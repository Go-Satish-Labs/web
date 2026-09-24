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
      const status = (error as { response?: { status?: number } })?.response?.status
      setAuthError(
        status === 502
          ? 'Your sign-in worked, but the backend API is not running. Its Supabase database connection must be fixed before a workspace can be created.'
          : status
          ? 'Your sign-in worked, but the workspace service could not complete your session. Please try again shortly.'
          : 'Your sign-in worked, but the workspace service is offline. The database connection needs attention.',
      )
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
    await signInWithEmailAndPassword(firebaseAuth, email, password)
    await refreshUser(true)
  }

  async function register(email: string, password: string) {
    setAuthError('')
    await createUserWithEmailAndPassword(firebaseAuth, email, password)
    await refreshUser(true)
  }

  async function continueWithProvider(provider: 'google' | 'github') {
    setAuthError('')
    const authProvider = provider === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider()
    await signInWithPopup(firebaseAuth, authProvider)
    await refreshUser(true)
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
