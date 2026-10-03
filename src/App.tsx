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
 * sequence therefore loops on a health poll rather than ending on a timer:
 * if the server is not up after one pass of the ANALYTRIX formation, the next
 * one begins. There is no time limit - the handover is driven purely by
 * whether the API has responded, never by a clock.
 *
 * Runs on every load. SKIP (or Escape) is the way out if someone does not
 * want to wait.
 */
function BootGate({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!booting) return
    let cancelled = false
    let timer: number

    const finish = () => {
      if (cancelled) return
      setReady(true)
      setBooting(false)
    }

    const poll = async () => {
      try {
        const { data } = await api.get('/health', { timeout: 6000 })
        if (cancelled) return
        // 'degraded' still answers, so the sequence can stand down; the app
        // then surfaces its own database-unavailable messaging.
        if (data?.status === 'healthy' || data?.status === 'degraded') finish()
      } catch {
        // Not awake yet. Keep looping and try again - no timeout, because the
        // boot sequence is the loading state for exactly this situation.
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
