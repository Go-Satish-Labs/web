import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import { AuthProvider, useAuth } from './features/auth/AuthContext'
import AskDataPage from './pages/AskDataPage'
import BillingPage from './pages/BillingPage'
import DatasetDetailPage from './pages/DatasetDetailPage'
import DatasetsPage from './pages/DatasetsPage'
import LandingPage from './pages/LandingPage'

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
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/login"    element={<Navigate to="/" replace state={{ modal: 'login' }} />} />
          <Route path="/register" element={<Navigate to="/" replace state={{ modal: 'register' }} />} />
          <Route path="/datasets" element={<RequireAuth><DatasetsPage /></RequireAuth>} />
          <Route path="/datasets/:id" element={<RequireAuth><DatasetDetailPage /></RequireAuth>} />
          <Route path="/ask"      element={<RequireAuth><AskDataPage /></RequireAuth>} />
          <Route path="/billing"  element={<RequireAuth><BillingPage /></RequireAuth>} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
