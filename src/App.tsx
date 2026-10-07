import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import BootSequence from './components/BootSequence'
import CompactBootSequence from './components/CompactBootSequence'
import RequireAuth from './components/RequireAuth'
import { AuthProvider, useAuth } from './features/auth/AuthContext'
import { api } from './lib/api'
import AskDataPage from './pages/AskDataPage'
import DatasetDetailPage from './pages/DatasetDetailPage'
import DatasetsPage from './pages/DatasetsPage'
import FeedbackPage from './pages/FeedbackPage'
import LandingPage from './pages/LandingPage'
import SettingsPage from './pages/SettingsPage'
import OnboardingTour from './components/OnboardingTour'

/**
 * Plays the boot sequence once on every load, and keeps playing it until the
 * backend answers.
 *
 * The sequence always runs at least one full pass - it is the product's
 * front door, so it plays even when the API is already warm and the wait would
 * otherwise be zero. What the backend changes is only what happens *after*
 * that pass:
 *
 * - API up: one pass, then the app.
 * - API down: the pass repeats until the API answers, then the pass already in
 *   progress finishes and the app appears on the completed wordmark.
 *
 * The handover is driven by the health response, never by a clock, and never
 * by cutting a pass short. SKIP (or Escape) is the way out for anyone who does
 * not want to wait.
 */
function BootGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [booting, setBooting] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!booting) return
    let cancelled = false
    let timer: number

    const poll = async () => {
      try {
        const { data } = await api.get('/health', { timeout: 6000 })
        if (cancelled) return
        // 'degraded' still answers, so the wait can end; the app surfaces its
        // own database-unavailable messaging afterwards.
        if (data?.status === 'healthy' || data?.status === 'degraded') setReady(true)
      } catch {
        // Not awake yet - the sequence keeps looping.
      }
      if (!cancelled) timer = window.setTimeout(poll, 2500)
    }
    poll()

    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [booting])

  if (!booting) return <>{children}</>
  // Firebase initially reports no user while it restores a persisted session.
  // Keep the compact loader mounted during that window so authenticated
  // refreshes never flash the public full-screen animation.
  const Loader = authLoading || user ? CompactBootSequence : BootSequence
  return <Loader waiting={!ready} onDone={() => setBooting(false)} />
}

function PublicHome() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) {
    if (!user.hasSecurityQuestion) return <Navigate to="/settings" replace state={{ openSec: true }} />
    return <Navigate to="/datasets" replace />
  }
  return <LandingPage />
}

function RequireSecQ({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user && !user.hasSecurityQuestion) return <Navigate to="/settings" replace state={{ openSec: true }} />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <BootGate>
          <Routes>
            <Route path="/" element={<PublicHome />} />
            <Route path="/login"    element={<Navigate to="/" replace state={{ modal: 'login' }} />} />
            <Route path="/register" element={<Navigate to="/" replace state={{ modal: 'register' }} />} />
            <Route path="/datasets" element={<RequireAuth><RequireSecQ><DatasetsPage /></RequireSecQ></RequireAuth>} />
            <Route path="/datasets/:id" element={<RequireAuth><RequireSecQ><DatasetDetailPage /></RequireSecQ></RequireAuth>} />
            <Route path="/ask"      element={<RequireAuth><RequireSecQ><AskDataPage /></RequireSecQ></RequireAuth>} />
            <Route path="/feedback" element={<RequireAuth><RequireSecQ><FeedbackPage /></RequireSecQ></RequireAuth>} />
            {/* Billing is temporarily disabled while Razorpay deployment is completed. */}
            <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
            <Route path="*"         element={<Navigate to="/" replace />} />
          </Routes>
          <OnboardingTour />
        </BootGate>
      </BrowserRouter>
    </AuthProvider>
  )
}
