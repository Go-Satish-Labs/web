import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import BootSequence from './components/BootSequence'
import RequireAuth from './components/RequireAuth'
import { AuthProvider, useAuth } from './features/auth/AuthContext'
import AskDataPage from './pages/AskDataPage'
import BillingPage from './pages/BillingPage'
import DatasetDetailPage from './pages/DatasetDetailPage'
import DatasetsPage from './pages/DatasetsPage'
import FeedbackPage from './pages/FeedbackPage'
import LandingPage from './pages/LandingPage'

/**
 * Plays the boot sequence once, on a cold load.
 *
 * Persisted in sessionStorage rather than shown on every mount: it covers
 * first paint and a slow backend, and replaying it on every route change
 * would be an obstacle rather than an introduction.
 */
function BootGate({ children }: { children: React.ReactNode }) {
  const [showBoot, setShowBoot] = useState(() => {
    if (typeof window === 'undefined') return false
    // A short window rather than the whole tab lifetime, so a reload an hour
    // later still gets the intro.
    const KEY = 'analytrix.booted'
    try {
      const at = Number(sessionStorage.getItem(KEY) || 0)
      return Date.now() - at > 5 * 60 * 1000
    } catch {
      return false
    }
  })

  if (!showBoot) return <>{children}</>
  return (
    <BootSequence onDone={() => {
      try { sessionStorage.setItem('analytrix.booted', String(Date.now())) } catch { /* private mode */ }
      setShowBoot(false)
    }} />
  )
}

function PublicHome() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/datasets" replace />
  return <LandingPage />
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
            <Route path="/datasets" element={<RequireAuth><DatasetsPage /></RequireAuth>} />
            <Route path="/datasets/:id" element={<RequireAuth><DatasetDetailPage /></RequireAuth>} />
            <Route path="/ask"      element={<RequireAuth><AskDataPage /></RequireAuth>} />
            <Route path="/feedback" element={<RequireAuth><FeedbackPage /></RequireAuth>} />
            <Route path="/billing"  element={<RequireAuth><BillingPage /></RequireAuth>} />
            <Route path="*"         element={<Navigate to="/" replace />} />
          </Routes>
        </BootGate>
      </BrowserRouter>
    </AuthProvider>
  )
}
