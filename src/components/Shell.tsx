import { useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Logo from './Logo'
import Footer from './Footer'
import { useAuth } from '../features/auth/AuthContext'
import { ProfileRing } from '../pages/SettingsPage'

/* ── Security gate popup ── */
function SecurityGatePopup({ onClose, onGoSetup }: { onClose: () => void; onGoSetup: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, padding: '36px 32px',
          width: '100%', maxWidth: 420,
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 16, background: '#f3f3f3',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <div style={{ fontSize: 19, fontWeight: 800, color: '#0a0a0a', marginBottom: 10 }}>
          Set up account security first
        </div>
        <div style={{ fontSize: 14, color: '#6b6b6b', lineHeight: 1.6, marginBottom: 28 }}>
          Before you continue, please set a security question. This protects your account and enables password recovery if you ever get locked out.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onGoSetup}
            style={{
              width: '100%', padding: '13px', borderRadius: 10, border: 'none',
              background: '#0a0a0a', color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Set up security question →
          </button>
        </div>
      </div>
    </div>
  )
}

const navItems = [
  {
    to: '/datasets',
    label: 'Datasets',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/>
        <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
        <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
      </svg>
    ),
  },
  {
    to: '/ask',
    label: 'Ask Data',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    to: '/feedback',
    label: 'Feedback',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="15" x2="12.01" y2="15"/>
      </svg>
    ),
  },
  {
    to: '/billing',
    label: 'Billing',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
]

export default function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showGate, setShowGate] = useState(false)

  const secDone = !!user?.hasSecurityQuestion

  function handleNavClick(to: string) {
    // Settings is always allowed — that's where they fix it
    if (to === '/settings') { navigate(to); return }
    // Already on that tab — allow
    if (location.pathname.startsWith(to)) { navigate(to); return }
    // Security not set — show gate popup
    if (!secDone) { setShowGate(true); return }
    navigate(to)
  }

  const picDone = !!user?.profilePicUrl
  const pct = (picDone ? 50 : 0) + (secDone ? 50 : 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {showGate && (
        <SecurityGatePopup
          onClose={() => setShowGate(false)}
          onGoSetup={() => { setShowGate(false); navigate('/settings', { state: { openSec: true } }) }}
        />
      )}

      {/* ── Vertical tab rail ── */}
      <nav className="vtab-rail">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to)
          return (
            <button
              key={item.to}
              onClick={() => handleNavClick(item.to)}
              className={`vtab${isActive ? ' active' : ''}`}
            >
              <span className="vtab-icon">{item.icon}</span>
              <span className="vtab-label">{item.label}</span>
            </button>
          )
        })}

        {/* Sign out */}
        <button
          onClick={() => { logout(); navigate('/') }}
          className="vtab"
          style={{ marginTop: 16 }}
        >
          <span className="vtab-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span className="vtab-label">Sign out</span>
        </button>
      </nav>

      {/* ── Top bar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px 0 64px', height: 54,
        background: 'var(--bg-white)',
        borderBottom: '1.5px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Logo size={28} />
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Analytrix</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            className="account-chip"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 12px 4px 4px', borderRadius: 20,
              background: 'var(--bg-subtle)', border: '1.5px solid var(--border)',
              cursor: 'pointer',
            }}
            onClick={() => handleNavClick('/settings')}
          >
            <ProfileRing pct={pct} size={30} stroke={2}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'var(--text)', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 800, color: '#fff',
              }}>
                {user?.profilePicUrl
                  ? <img src={user.profilePicUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (user?.email?.[0]?.toUpperCase() ?? 'U')
                }
              </div>
            </ProfileRing>
            <span className="account-email" style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName || user?.email}
            </span>
            {user?.plan === 'premium' && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: 'var(--text)', color: '#fff' }}>PRO</span>
            )}
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main style={{ paddingLeft: 52 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px' }}>
          {children}
          <Footer />
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to)
          return (
            <button
              key={item.to}
              onClick={() => handleNavClick(item.to)}
              className={`bn-item${isActive ? ' active' : ''}`}
            >
              <span className="vtab-icon">{item.icon}</span>
              <span className="vtab-label">{item.label}</span>
            </button>
          )
        })}

        <button
          onClick={() => { logout(); navigate('/') }}
          className="bn-item"
          style={{ color: 'var(--bad)' }}
        >
          <span className="vtab-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span className="vtab-label">Sign out</span>
        </button>
      </nav>
    </div>
  )
}
