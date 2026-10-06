import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import { friendlyError } from '../lib/errors'
import OAuthButtons from '../components/OAuthButtons'
import Logo from '../components/Logo'
import VirtualPets from '../components/VirtualPets'

const AuthScene = lazy(() => import('../components/AuthScene'))

type ModalMode = 'login' | 'register' | null

export default function LandingPage() {
  const location = useLocation()
  const routeModal = (location.state as { modal?: ModalMode } | null)?.modal ?? null
  const [modal, setModal] = useState<ModalMode>(routeModal)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (routeModal) setModal(routeModal)
  }, [routeModal])

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
          filter: modalOpen ? 'none' : 'none',
          opacity: modalOpen ? 0.25 : 1,
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
        <Logo size={28} style={{ marginRight: 8 }} />
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
        {/* A fixed-gap flex row overflowed narrow phones and the scroll layer
            clipped it, taking the headline with it. Three equal columns keep
            all three on one row at any width. */}
        <div className="hero-stats" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 16, marginTop: 56, width: '100%', maxWidth: 560,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 32,
        }}>
          {[['12k+', 'Datasets analyzed'], ['4.2s', 'Avg dashboard time'], ['98k+', 'AI questions answered']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center', minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '-0.5px' }}>{v}</div>
              <div className="hero-stat-label" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{l}</div>
            </div>
          ))}
      </div>
      </div>

      {/* ── Closing line ── */}
      <div className="landing-footer">
        <p className="site-footer-line">
          <span className="site-footer-copy">© Satish-Labs</span>
          <span className="site-footer-tagline">The AI chats. The maths doesn&rsquo;t bluff.</span>
        </p>
      </div>

      </div>

      {/* ── Modal backdrop ── */}
      {modalOpen && (
        <div
          onClick={closeModal}
          style={{
            position: 'absolute', inset: 0, zIndex: 30,
            background: 'rgba(0,0,0,0.55)',
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
            className="modal-enter"
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
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(''); setBusy(true)
    try { await login(email, password); onSuccess(); navigate('/datasets') }
    catch (err) { setError(friendlyError(err)) }
    finally { setBusy(false) }
  }

  return (
    <div>
      <OAuthButtons />
      <Divider />
      {showForgotPassword ? (
        <ForgotPasswordForm
          onBack={() => setShowForgotPassword(false)}
          onSwitchToLogin={() => setShowForgotPassword(false)}
        />
      ) : (
        <>
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
          <p style={{ textAlign: 'center', marginTop: 12 }}>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              style={{ background: 'none', border: 'none', color: '#6b6b6b', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              Forgot password?
            </button>
          </p>
        </>
      )}
    </div>
  )
}

/* ── Forgot Password Form ── */
function ForgotPasswordForm({ onBack, onSwitchToLogin }: { onBack: () => void; onSwitchToLogin: () => void }) {
  const { authError } = useAuth()
  const [step, setStep] = useState<'email' | 'answer' | 'no-security'>('email')
  const [email, setEmail] = useState('')
  const [securityQuestion, setSecurityQuestion] = useState('')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)

  async function fetchSecurityQuestion() {
    setError(''); setBusy(true)
    try {
      const res = await fetch('/api/auth/forgot-password/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Something went wrong.')
      if (!data.has_security_question) {
        setStep('no-security')
        return
      }
      setSecurityQuestion(data.security_question)
      setStep('answer')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  async function verifySecurityAnswer() {
    setError(''); setBusy(true)
    try {
      const res = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, security_answer: securityAnswer })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Incorrect security answer.')
      }
      const { firebaseAuth } = await import('../lib/firebase')
      const { sendPasswordResetEmail } = await import('firebase/auth')
      await sendPasswordResetEmail(firebaseAuth, email)
      setSuccess(true)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  // ── Success state ──
  if (success) {
    return (
      <div className="pop-in" style={{ textAlign: 'center', padding: '8px 0 4px' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f0fdf4', border: '1.5px solid rgba(22,163,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0a0a0a', marginBottom: 8 }}>Reset email sent</div>
        <p style={{ fontSize: 13, color: '#6b6b6b', lineHeight: 1.6, marginBottom: 24 }}>Check your inbox for the password reset link.</p>
        <Btn busy={false} label="Back to sign in" busyLabel="" onClick={onBack} />
      </div>
    )
  }

  // ── No security question state ──
  if (step === 'no-security') {
    return (
      <div className="pop-in" style={{ textAlign: 'center', padding: '8px 0 4px' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fffbeb', border: '1.5px solid rgba(202,138,4,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0a0a0a', marginBottom: 8 }}>No security question set</div>
        <p style={{ fontSize: 13, color: '#6b6b6b', lineHeight: 1.6, marginBottom: 8 }}>
          The account <strong style={{ color: '#0a0a0a' }}>{email}</strong> hasn't set up a security question yet.
        </p>
        <p style={{ fontSize: 13, color: '#6b6b6b', lineHeight: 1.6, marginBottom: 24 }}>
          Sign in first, then go to <strong style={{ color: '#0a0a0a' }}>Settings → Password recovery</strong> to add one.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Btn busy={false} label="Sign in to set it up →" busyLabel="" onClick={onSwitchToLogin} />
          <button type="button" onClick={onBack}
            style={{ width: '100%', padding: '11px', borderRadius: 10, border: '1.5px solid #e8e8e8', background: '#fff', color: '#6b6b6b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Back
          </button>
        </div>
      </div>
    )
  }

  // ── Normal flow ──
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button type="button" onClick={step === 'answer' ? () => setStep('email') : onBack}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #e8e8e8', background: '#f9f9f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'border-color 0.15s, background 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#0a0a0a'; e.currentTarget.style.background = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e8e8'; e.currentTarget.style.background = '#f9f9f9' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', lineHeight: 1.2 }}>
            {step === 'email' ? 'Forgot password' : 'Verify identity'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
            {(['email', 'answer'] as const).map((s, i) => (
              <div key={s} style={{ height: 3, borderRadius: 3, width: step === s ? 20 : 12, background: step === s ? '#0a0a0a' : (i < ['email','answer'].indexOf(step) ? '#0a0a0a' : '#e8e8e8'), transition: 'width 0.3s cubic-bezier(.22,1,.36,1), background 0.3s' }} />
            ))}
            <span style={{ fontSize: 10, color: '#a8a8a8', marginLeft: 4 }}>Step {step === 'email' ? 1 : 2} of 2</span>
          </div>
        </div>
      </div>

      {step === 'email' ? (
        <form onSubmit={e => { e.preventDefault(); fetchSecurityQuestion() }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Email">
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" style={inputStyle} autoFocus />
          </FormField>
          {(error || authError) && <ErrBox msg={authError || error} />}
          <Btn busy={busy} label="Continue" busyLabel="Checking…" />
        </form>
      ) : (
        <form onSubmit={e => { e.preventDefault(); verifySecurityAnswer() }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: '14px 16px', background: '#f9f9f9', borderRadius: 12, border: '1.5px solid #e8e8e8' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#a8a8a8', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>Security question</div>
            <div style={{ fontSize: 13, color: '#0a0a0a', lineHeight: 1.5, fontWeight: 500 }}>{securityQuestion}</div>
          </div>
          <FormField label="Your answer">
            <input type="text" required value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)} placeholder="Enter your answer" style={inputStyle} autoFocus />
          </FormField>
          {(error || authError) && <ErrBox msg={authError || error} />}
          <Btn busy={busy} label="Verify & send reset email" busyLabel="Verifying…" />
        </form>
      )}
    </div>
  )
}
/* ── Register form ── */
function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, authError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [securityQuestion, setSecurityQuestion] = useState('')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(''); setBusy(true)
    try { await register(email, password, securityQuestion, securityAnswer); onSuccess(); navigate('/datasets') }
    catch (err) { setError(friendlyError(err)) }
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
        <FormField label="Security question">
          <input type="text" required value={securityQuestion} onChange={e => setSecurityQuestion(e.target.value)} placeholder="e.g., What was your first pet's name?" style={inputStyle} />
        </FormField>
        <FormField label="Security answer">
          <input type="text" required value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)} placeholder="Your answer" style={inputStyle} />
        </FormField>
        <p style={{ fontSize: 11, color: '#a8a8a8', lineHeight: 1.5 }}>
          Used to verify your identity if you forget your password.
        </p>
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

function Btn({ busy, label, busyLabel, onClick }: { busy: boolean; label: string; busyLabel: string; onClick?: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button type={onClick ? 'button' : 'submit'} disabled={busy} onClick={onClick}
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
