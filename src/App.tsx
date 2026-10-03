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
 * The wait is capped, though, and deliberately so. A blocking intro is only
 * safe if it cannot become a cage: ad blockers and privacy extensions answer
 * net::ERR_BLOCKED_BY_CLIENT, and a poll that can never succeed would strand
 * the user on the splash forever. After the cap the app is shown regardless,
 * and the app's own request errors report a genuinely unreachable API.
 *
 * Runs on every load, and can be skipped at any point.
 */
const MAX_BOOT_WAIT_MS = 20_000

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

    // The cap is not a success - it just stops blocking the user. `ready`
    // stays false so the sequence still shows the connecting state if the
    // user is still looking at it, and any in-flight request surfaces its own
    // error inside the app.
    const cap = window.setTimeout(() => {
      if (!cancelled) { setReady(true); setBooting(false) }
    }, MAX_BOOT_WAIT_MS)

    const poll = async () => {
      try {
        const { data } = await api.get('/health', { timeout: 6000 })
        if (cancelled) return
        // 'degraded' still answers, so the intro can stand down; the app then
        // shows its own database-unavailable messaging.
        if (data?.status === 'healthy' || data?.status === 'degraded') {
          window.clearTimeout(cap)
          finish()
        }
      } catch {
        // Blocked, offline, or still waking - keep the sequence running.
      }
      if (!cancelled) timer = window.setTimeout(poll, 2500)
    }
    poll()

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      window.clearTimeout(cap)
    }
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
