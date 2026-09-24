import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { apiErrorMessage } from '../lib/api'
import OAuthButtons from '../components/OAuthButtons'

export default function LoginPage() {
  const { login, authError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ── Left panel — dot grid + branding ── */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: '#ffffff',
        borderRight: '1.5px solid #e8e8e8',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
        overflow: 'hidden',
      }}>
        {/* dot grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, #d4d4d4 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        {/* fade edges */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(255,255,255,0.85) 100%)',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#0a0a0a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#0a0a0a' }}>Astrolytics</span>
        </div>

        {/* Center content */}
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 38, fontWeight: 800, color: '#0a0a0a', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 20 }}>
            Your data,<br />understood.
          </div>
          <p style={{ fontSize: 15, color: '#6b6b6b', lineHeight: 1.7, maxWidth: 340, marginBottom: 36 }}>
            Upload a CSV or Excel file and get a full analytics dashboard — KPIs, charts, anomaly detection, and AI-powered Q&A.
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 32 }}>
            {[
              { value: '12k+', label: 'Datasets analyzed' },
              { value: '4.2s', label: 'Avg dashboard time' },
              { value: '98k+', label: 'AI questions answered' },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-mono-num" style={{ fontSize: 22, fontWeight: 800, color: '#0a0a0a' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#a8a8a8', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div style={{ position: 'relative', fontSize: 12, color: '#a8a8a8' }}>
          No code required · Free to start · AI-powered
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div style={{
        width: 480,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 56px',
        background: '#ffffff',
      }}>
        <div style={{ width: '100%' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0a0a0a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: '#6b6b6b', marginBottom: 28 }}>
            Sign in to your workspace
          </p>

          <OAuthButtons />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0', fontSize: 11, fontWeight: 600, color: '#a8a8a8', letterSpacing: '0.06em' }}>
            <span style={{ flex: 1, height: 1, background: '#e8e8e8' }} />
            OR
            <span style={{ flex: 1, height: 1, background: '#e8e8e8' }} />
          </div>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0a0a0a', marginBottom: 7, letterSpacing: '0.04em' }}>
                EMAIL
              </label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={{ width: '100%', padding: '11px 14px', fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0a0a0a', marginBottom: 7, letterSpacing: '0.04em' }}>
                PASSWORD
              </label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '11px 14px', fontSize: 14 }}
              />
            </div>

            {(error || authError) && (
              <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: '#fef2f2', color: '#dc2626', border: '1.5px solid rgba(220,38,38,0.15)' }}>
                {authError || error}
              </div>
            )}

            <button
              type="submit" disabled={busy}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, marginTop: 4,
                fontSize: 14, fontWeight: 700, color: '#fff', border: 'none',
                background: busy ? '#a8a8a8' : '#0a0a0a',
                transition: 'background 0.15s',
                letterSpacing: '0.01em',
              }}
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ fontSize: 13, color: '#6b6b6b', textAlign: 'center', marginTop: 24 }}>
            No account?{' '}
            <Link to="/register" style={{ color: '#0a0a0a', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
