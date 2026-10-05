import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import VerifyEmailGate from './VerifyEmailGate'
import { useAuth } from '../features/auth/AuthContext'
import { firebaseAuth } from '../lib/firebase'

/**
 * Sends an unauthenticated visitor to sign in, and holds a brand-new account
 * at the "check your inbox" gate until they confirm the address.
 *
 * The API refuses unverified tokens, so this is where that refusal becomes
 * something a person can act on instead of a silent bounce back to the home
 * page - which is what an unverified signup used to look like.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, awaitingVerification } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm">
        Loading…
      </div>
    )
  }

  if (user) return <>{children}</>

  const pendingEmail = firebaseAuth.currentUser?.email
  if (awaitingVerification && pendingEmail) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <VerifyEmailGate email={pendingEmail} />
      </div>
    )
  }

  return <Navigate to="/login" replace />
}