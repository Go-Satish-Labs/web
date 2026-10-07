import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  onIdTokenChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { api } from '../../lib/api'
import { friendlyError } from '../../lib/errors'
import { firebaseAuth } from '../../lib/firebase'
import { passwordPolicyError } from '../../lib/passwordPolicy'

interface User {
  id: string
  email: string
  plan: string
  role: string
  displayName?: string | null
  hasSecurityQuestion?: boolean
  profilePicUrl?: string | null
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  authError: string
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, securityQuestion: string, securityAnswer: string) => Promise<void>
  continueWithProvider: (provider: 'google' | 'github') => Promise<void>
  /** True when Firebase has not yet confirmed the address, which holds the
      person out of the app until they click the link we emailed them. */
  awaitingVerification: boolean
  resendVerificationEmail: () => Promise<boolean>
  refreshVerificationStatus: () => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  // Google and GitHub sign-ins arrive already verified, so this only turns on
  // for a password sign-up that has not clicked the emailed link yet.
  const [awaitingVerification, setAwaitingVerification] = useState(false)
  // Pending security question/answer to save after email verification
  const [pendingSecurity, setPendingSecurity] = useState<{ question: string; answer: string } | null>(null)

  async function savePendingSecurity() {
    if (!pendingSecurity || !user) return
    try {
      await api.patch('/auth/me', {
        security_question: pendingSecurity.question,
        security_answer: pendingSecurity.answer
      })
    } catch {
      // Silently fail - user can set it later
    }
    setPendingSecurity(null)
  }

  async function refreshUser(throwOnFailure = false) {
    if (!firebaseAuth.currentUser) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get('/auth/me')
      setUser({
        id: data.id,
        email: data.email,
        plan: data.plan,
        role: data.role,
        displayName: data.display_name ?? null,
        hasSecurityQuestion: data.has_security_question,
        profilePicUrl: data.profile_pic_url ?? null,
      })
      setAuthError('')
      // If we have pending security info and user is now verified, save it
      if (pendingSecurity) {
        await savePendingSecurity()
      }
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: { detail?: string } } })?.response
      const status = response?.status
      if (status === 403 && /verify/i.test(String(response?.data?.detail ?? ''))) {
        // The API refuses unverified tokens. This is the expected first step
        // after signing up, not a failure, so it gets its own state rather than
        // an error the person has to dismiss.
        setAwaitingVerification(true)
        setUser(null)
        setLoading(false)
        if (throwOnFailure) return
        return
      } else if (status === 503) {
        // Backend is running but cannot reach its database (see Brain/DATABASE.md).
        setAuthError('Your sign-in worked, but the workspace service cannot reach its database right now. No data was lost - please try again in a minute.')
      } else if (status === 502) {
        setAuthError('Your sign-in worked, but the backend API is not running. Its Supabase database connection must be fixed before a workspace can be created.')
      } else if (status) {
        setAuthError('Your sign-in worked, but the workspace service could not complete your session. Please try again shortly.')
      } else {
        setAuthError('Your sign-in worked, but the workspace service is offline. The database connection needs attention.')
      }
      setUser(null)
      if (throwOnFailure) throw error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(firebaseAuth, () => { void refreshUser() })
    return unsubscribe
  }, [])

  async function login(email: string, password: string) {
    setAuthError('')
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
      // An account that predates verification - or whose first email went to
      // spam - is sent one on sign-in too. Without this they reach the
      // "check your inbox" screen for a message that was never sent, and the
      // only way out is a button that guesses they will find it.
      if (!credential.user.emailVerified) {
        try {
          await sendEmailVerification(credential.user)
        } catch {
          // A failed send must not break sign-in; the gate offers a resend.
        }
      }
      await refreshUser(true)
    } catch (error) {
      // Set here as well as at the form, so every surface that reads
      // authError shows the same wording rather than a bare Firebase code.
      setAuthError(friendlyError(error, 'We could not sign you in. Please try again.'))
      throw error
    }
  }

  async function register(email: string, password: string, securityQuestion: string, securityAnswer: string) {
    setAuthError('')
    const passwordError = passwordPolicyError(password)
    if (passwordError) {
      setAuthError(passwordError)
      throw new Error(passwordError)
    }
    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
      // Send the verification email immediately. Nothing else is gated on it
      // here - the API refuses an unverified token - but sending it now means
      // the inbox already has it by the time they read the next screen.
      await sendEmailVerification(credential.user)
      // Store security question/answer to save after verification
      setPendingSecurity({ question: securityQuestion, answer: securityAnswer })
      await refreshUser(true)
    } catch (error) {
      setAuthError(friendlyError(error, 'We could not create your account. Please try again.'))
      throw error
    }
  }

  /** Re-send the verification email for the signed-in user. */
  async function resendVerificationEmail() {
    const current = firebaseAuth.currentUser
    if (!current) return false
    await sendEmailVerification(current)
    return true
  }

  /**
   * Checks whether the user has verified their address and refreshes the ID
   * token if so.
   *
   * The token is cached by Firebase and still says email_verified: false
   * after the user clicks the link, so a plain `currentUser` check never
   * notices. `getIdToken(true)` forces a refresh from the server, which is
   * what actually carries the new claim.
   */
  async function refreshVerificationStatus() {
    const current = firebaseAuth.currentUser
    if (!current) return false
    await current.reload()
    if (current.emailVerified) {
      await current.getIdToken(true)
      // Trigger refreshUser to save any pending security info
      await refreshUser()
      return true
    }
    return false
  }

  async function continueWithProvider(provider: 'google' | 'github') {
    setAuthError('')
    try {
      const authProvider = provider === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider()
      await signInWithPopup(firebaseAuth, authProvider)
      await refreshUser(true)
    } catch (error) {
      setAuthError(friendlyError(error, 'We could not complete that sign-in. Please try again.'))
      throw error
    }
  }

  function logout() {
    void signOut(firebaseAuth)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, register, continueWithProvider, logout, refreshUser, awaitingVerification, resendVerificationEmail, refreshVerificationStatus }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
