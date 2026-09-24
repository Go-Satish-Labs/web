import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { apiErrorMessage } from '../lib/api'
import OAuthButtons from '../components/OAuthButtons'

export default function RegisterPage() {
  const { register, authError } = useAuth()
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
      await register(email, password)
      navigate('/')
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const features = [
    'Auto-generated KPI dashboards',
    'AI-powered data Q&A',
    'Anomaly detection built-in',
    'Charts selected automatically',
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ── Left panel ── */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
        overflow: 'hidden',
      }}>
        {/* subtle dot grid on dark */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#ffffff' }}>Astrolytics</span>
        </div>

        {/* Center content */}
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 38, fontWeight: 800, color: '#ffffff', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 20 }}>
            Everything you need<br />to understand<br />your data.
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 36, lineHeight: 1.7 }}>
            Free forever. No credit card required.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {features.map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          3 datasets · 50 MB storage · 20 AI questions/mo
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
        borderLeft: '1.5px solid #e8e8e8',
      }}>
        <div style={{ width: '100%' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0a0a0a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Create your workspace
          </h1>
          <p style={{ fontSize: 14, color: '#6b6b6b', marginBottom: 28 }}>
            Free forever · No credit card required
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
                PASSWORD <span style={{ color: '#a8a8a8', fontWeight: 400, fontSize: 11 }}>(min 8 chars)</span>
              </label>
              <input
                type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
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
              {busy ? 'Creating account…' : 'Create free account'}
            </button>
          </form>

          <p style={{ fontSize: 13, color: '#6b6b6b', textAlign: 'center', marginTop: 24 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#0a0a0a', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
