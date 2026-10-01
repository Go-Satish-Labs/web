import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import BootSequence from './components/BootSequence'
import RequireAuth from './components/RequireAuth'
import { AuthProvider, useAuth } from './features/auth/AuthContext'
import { api } from './lib/api'
import AskDataPage from './pages/AskDataPage'
import BillingPage from './pages/BillingPage'
import DatasetDetailPage from './pages/DatasetDetailPage'
import DatasetsPage from './pages/DatasetsPage'
import FeedbackPage from './pages/FeedbackPage'
import LandingPage from './pages/LandingPage'

/**
 * Plays the boot sequence, and keeps playing it until the backend answers.
 *
 * The frontend on Vercel and the API on Render are separate hosts, and a
 * free-tier cold start can leave the API unreachable for a while. The
 * sequence therefore loops on a health poll rather than ending on a timer
 * into a black screen that looks broken.
 *
 * Runs on every load, and can be skipped at any point.
 */
function BootGate({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!booting) return
    let cancelled = false
    let timer: number

    // A single fast probe, so the common case (API already warm) clears the
    // intro almost immediately rather than waiting a full poll interval.
    const finish = () => {
      if (cancelled) return
      setReady(true)
      setBooting(false)
    }

    const poll = async () => {
      try {
        const { data } = await api.get('/health', { timeout: 6000 })
        if (data?.status === 'healthy' || data?.status === 'degraded') finish()
      } catch {
        // Still down - keep the sequence running and try again.
      }
      if (!cancelled) timer = window.setTimeout(poll, 2500)
    }
    poll()

    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [booting])

  if (!booting) return <>{children}</>
  return <BootSequence waiting={!ready} onDone={() => setBooting(false)} />
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
