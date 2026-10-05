import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { api } from '../../lib/api'
import { friendlyError } from '../../lib/errors'
import { firebaseAuth } from '../../lib/firebase'

interface User {
  id: string
  email: string
  plan: string
  role: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  authError: string
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  continueWithProvider: (provider: 'google' | 'github') => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  async function refreshUser(throwOnFailure = false) {
    if (!firebaseAuth.currentUser) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get('/auth/me')
      setUser(data)
      setAuthError('')
    } catch (error) {
      const response = (error as { response?: { status?: number } })?.response
      const status = response?.status
      if (status === 503) {
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
      await signInWithEmailAndPassword(firebaseAuth, email, password)
      await refreshUser(true)
    } catch (error) {
      // Set here as well as at the form, so every surface that reads
      // authError shows the same wording rather than a bare Firebase code.
      setAuthError(friendlyError(error, 'We could not sign you in. Please try again.'))
      throw error
    }
  }

  async function register(email: string, password: string) {
    setAuthError('')
    try {
      await createUserWithEmailAndPassword(firebaseAuth, email, password)
      await refreshUser(true)
    } catch (error) {
      setAuthError(friendlyError(error, 'We could not create your account. Please try again.'))
      throw error
    }
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
    <AuthContext.Provider value={{ user, loading, authError, login, register, continueWithProvider, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
