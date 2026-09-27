import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import { apiErrorMessage } from '../lib/api'
import OAuthButtons from '../components/OAuthButtons'
import VirtualPets from '../components/VirtualPets'

const AuthScene = lazy(() => import('../components/AuthScene'))

type ModalMode = 'login' | 'register' | null

export default function LandingPage() {
  const location = useLocation()
  const [modal, setModal] = useState<ModalMode>(
    (location.state as { modal?: ModalMode })?.modal ?? null
  )
  const [closing, setClosing] = useState(false)

  function openModal(m: 'login' | 'register') {
    setClosing(false)
    setModal(m)
  }

  function closeModal() {
    setClosing(true)
    setTimeout(() => { setModal(null); setClosing(false) }, 300)
  }

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const modalOpen = modal !== null

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', overflow: 'hidden' }}>

      {/* ── 3D scene (fixed behind content) ── */}
      <Suspense fallback={null}>
        <AuthScene />
      </Suspense>

      {/* ── Virtual pets ── */}
      <VirtualPets />

      {/* ── Vignette ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 20%, rgba(10,10,10,0.7) 100%)',
      }} />

      {/* ── Scrollable content layer ── */}
      <div
        style={{
          position: 'absolute', inset: 0,
          overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          transition: 'filter 0.35s ease, opacity 0.35s ease',
          filter: modalOpen ? 'blur(4px)' : 'none',
          opacity: modalOpen ? 0.3 : 1,
        }}
      >

      {/* ── Floating nav ── */}
      <nav style={{
        position: 'sticky', top: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 20,
        padding: '10px 8px',
        borderRadius: 999,
        margin: '18px auto 0',
        border: '1px solid rgba(255,255,255,0.1)',
        width: 'fit-content',
      }}>
        {/* logo */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: '#ffffff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: 6,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginRight: 10, letterSpacing: '-0.2px' }}>
          Analytrix
        </span>
        <Pill active={modal === 'login'} onClick={() => openModal('login')}>Sign in</Pill>
        <Pill active={modal === 'register'} onClick={() => openModal('register')}>Sign up</Pill>
      </nav>

      {/* ── Hero ── */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px 96px',
        minHeight: 'calc(100vh - 60px)',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 999, padding: '5px 14px',
          fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.4px', marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
          AI-powered analytics
        </div>

        <h1 style={{
          fontSize: 'clamp(40px, 6vw, 80px)',
          fontWeight: 800,
          color: '#ffffff',
          lineHeight: 1.05,
          letterSpacing: '-2px',
          margin: '0 0 20px',
          maxWidth: 700,
        }}>
          Your data,<br />understood.
        </h1>

        <p style={{
          fontSize: 'clamp(15px, 1.5vw, 18px)',
          color: 'rgba(255,255,255,0.4)',
          maxWidth: 480,
          lineHeight: 1.7,
          margin: '0 0 40px',
        }}>
          Upload a CSV or Excel file and get a full analytics dashboard — KPIs, charts, anomaly detection, and AI-powered Q&amp;A.
        </p>

        <div style={{ display: 'flex', gap: 12, pointerEvents: 'all' }}>
          <HeroBtn primary onClick={() => openModal('register')}>Get started free</HeroBtn>
          <HeroBtn onClick={() => openModal('login')}>Sign in</HeroBtn>
        </div>

        {/* stats */}
        <div style={{
          display: 'flex', gap: 40, marginTop: 56,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 32,
        }}>
          {[['12k+', 'Datasets analyzed'], ['4.2s', 'Avg dashboard time'], ['98k+', 'AI questions answered']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '-0.5px' }}>{v}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* ── Modal backdrop ── */}
      {modalOpen && (
        <div
          onClick={closeModal}
          style={{
            position: 'absolute', inset: 0, zIndex: 30,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            opacity: closing ? 0 : 1,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* ── Auth modal panel ── */}
      {modalOpen && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '80px 20px 40px',
          pointerEvents: 'none',
        }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              pointerEvents: 'all',
              width: '100%', maxWidth: 400,
              background: '#ffffff',
              borderRadius: 20,
              padding: '32px 32px 28px',
              boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
              opacity: closing ? 0 : 1,
              transform: closing ? 'translateY(16px) scale(0.98)' : 'translateY(0) scale(1)',
              transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            {/* tab switcher inside modal */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: '#f3f3f3', borderRadius: 10, padding: 3 }}>
              <ModalTab active={modal === 'login'} onClick={() => setModal('login')}>Sign in</ModalTab>
              <ModalTab active={modal === 'register'} onClick={() => setModal('register')}>Sign up</ModalTab>
            </div>

            {modal === 'login'
              ? <LoginForm onSuccess={closeModal} />
              : <RegisterForm onSuccess={closeModal} />
            }
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Login form ── */
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { login, authError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(''); setBusy(true)
    try { await login(email, password); onSuccess(); navigate('/') }
    catch (err) { setError(apiErrorMessage(err)) }
    finally { setBusy(false) }
  }

  return (
    <div>
      <OAuthButtons />
      <Divider />
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FormField label="Email">
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" style={inputStyle} />
        </FormField>
        <FormField label="Password">
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
        </FormField>
        {(error || authError) && <ErrBox msg={authError || error} />}
        <Btn busy={busy} label="Sign in" busyLabel="Signing in…" />
      </form>
    </div>
  )
}

/* ── Register form ── */
function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, authError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(''); setBusy(true)
    try { await register(email, password); onSuccess(); navigate('/') }
    catch (err) { setError(apiErrorMessage(err)) }
    finally { setBusy(false) }
  }

  return (
    <div>
      <OAuthButtons />
      <Divider />
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FormField label="Email">
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" style={inputStyle} />
        </FormField>
        <FormField label="Password">
          <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="min 8 characters" style={inputStyle} />
        </FormField>
        {(error || authError) && <ErrBox msg={authError || error} />}
        <Btn busy={busy} label="Create free account" busyLabel="Creating…" />
      </form>
      <p style={{ fontSize: 11, color: '#a8a8a8', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
        Free forever · No credit card required
      </p>
    </div>
  )
}

/* ── Small shared pieces ── */
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: '7px 16px', borderRadius: 999, border: 'none',
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        background: active ? '#ffffff' : hov ? 'rgba(255,255,255,0.08)' : 'transparent',
        color: active ? '#0a0a0a' : 'rgba(255,255,255,0.65)',
        transition: 'all 0.18s ease',
        transform: hov && !active ? 'scale(1.02)' : 'scale(1)',
      }}
    >{children}</button>
  )
}

function HeroBtn({ primary, onClick, children }: { primary?: boolean; onClick: () => void; children: React.ReactNode }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: '13px 28px', borderRadius: 12, border: primary ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
        fontSize: 14, fontWeight: 700, cursor: 'pointer',
        background: primary ? (hov ? '#e8e8e8' : '#ffffff') : (hov ? 'rgba(255,255,255,0.08)' : 'transparent'),
        color: primary ? '#0a0a0a' : '#ffffff',
        transition: 'all 0.18s ease',
        transform: hov ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: primary && hov ? '0 8px 24px rgba(255,255,255,0.15)' : 'none',
      }}
    >{children}</button>
  )
}

function ModalTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '8px', borderRadius: 8, border: 'none',
      fontSize: 13, fontWeight: 600, cursor: 'pointer',
      background: active ? '#ffffff' : 'transparent',
      color: active ? '#0a0a0a' : '#6b6b6b',
      boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
      transition: 'all 0.18s ease',
    }}>{children}</button>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#6b6b6b', letterSpacing: '0.5px' }}>{label.toUpperCase()}</label>
      {children}
    </div>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
      <span style={{ flex: 1, height: 1, background: '#e8e8e8' }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: '#a8a8a8', letterSpacing: '0.5px' }}>OR</span>
      <span style={{ flex: 1, height: 1, background: '#e8e8e8' }} />
    </div>
  )
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 8, fontSize: 13, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
      {msg}
    </div>
  )
}

function Btn({ busy, label, busyLabel }: { busy: boolean; label: string; busyLabel: string }) {
  const [hov, setHov] = useState(false)
  return (
    <button type="submit" disabled={busy}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', padding: '12px', borderRadius: 10, border: 'none',
        fontSize: 14, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer',
        background: busy ? '#d0d0d0' : hov ? '#1a1a1a' : '#0a0a0a',
        color: '#ffffff',
        transition: 'all 0.18s ease',
        transform: hov && !busy ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hov && !busy ? '0 6px 20px rgba(0,0,0,0.2)' : 'none',
        marginTop: 4,
      }}
    >{busy ? busyLabel : label}</button>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 13px', fontSize: 14,
  background: '#f9f9f9', border: '1.5px solid #e8e8e8',
  borderRadius: 10, color: '#0a0a0a', outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}
