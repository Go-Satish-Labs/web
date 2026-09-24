import { type ReactNode } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

const navItems = [
  {
    to: '/',
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
    to: '/billing',
    label: 'Billing',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
]

export default function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Vertical tab rail ── */}
      <nav className="vtab-rail">
        {navItems.map((item) => {
          const isActive = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={`vtab${isActive ? ' active' : ''}`}
            >
              <span className="vtab-icon">{item.icon}</span>
              <span className="vtab-label">{item.label}</span>
            </NavLink>
          )
        })}

        {/* Sign out */}
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="vtab"
          style={{ marginTop: 16, background: '#ffffff', border: '1.5px solid #e8e8e8', borderLeft: 'none' }}
          onMouseEnter={(e) => {
            const el = e.currentTarget
            el.style.width = '148px'
            el.style.background = '#fef2f2'
            el.style.borderColor = 'rgba(220,38,38,0.3)'
            const label = el.querySelector('.vtab-label') as HTMLElement
            if (label) { label.style.opacity = '1'; label.style.color = '#dc2626' }
            const icon = el.querySelector('.vtab-icon') as HTMLElement
            if (icon) icon.style.color = '#dc2626'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget
            el.style.width = '44px'
            el.style.background = '#ffffff'
            el.style.borderColor = '#e8e8e8'
            const label = el.querySelector('.vtab-label') as HTMLElement
            if (label) { label.style.opacity = '0'; label.style.color = '#0a0a0a' }
            const icon = el.querySelector('.vtab-icon') as HTMLElement
            if (icon) icon.style.color = '#6b6b6b'
          }}
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
        background: '#ffffff',
        borderBottom: '1.5px solid #e8e8e8',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0a0a0a' }}>Astrolytics</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 12px 5px 6px', borderRadius: 20,
            background: '#f3f3f3', border: '1.5px solid #e8e8e8',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: '#0a0a0a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff',
            }}>
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#6b6b6b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </span>
            {user?.plan === 'premium' && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: '#0a0a0a', color: '#fff' }}>PRO</span>
            )}
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main style={{ paddingLeft: 52 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
