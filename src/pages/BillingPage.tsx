import { useEffect, useState } from 'react'
import Shell from '../components/Shell'
import { useAuth } from '../features/auth/AuthContext'
import { api } from '../lib/api'
import { friendlyError } from '../lib/errors'

interface Subscription { plan: string; status: string; provider: string; current_period_end: string | null }

const Check = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export default function BillingPage() {
  const { user, refreshUser } = useAuth()
  const [sub, setSub] = useState<Subscription | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function load() { api.get('/billing/subscription').then((r) => setSub(r.data)) }
  useEffect(() => { load() }, [])

  async function upgrade() {
    setBusy(true); setError(''); setMessage('')
    try {
      const { data: order } = await api.post('/billing/create-order', { plan: 'premium' })
      if (order.provider === 'mock') {
        await api.post('/billing/confirm', { order_id: order.order_id, payment_id: `mock_pay_${Date.now()}` })
        setMessage('Payment simulated (mock provider) — premium unlocked.')
      } else { setMessage('Real Razorpay checkout would open here.') }
      await refreshUser(); load()
    } catch (err) { setError(friendlyError(err)) }
    finally { setBusy(false) }
  }

  async function cancel() {
    setBusy(true)
    try { await api.post('/billing/cancel'); load() } finally { setBusy(false) }
  }

  const isPremium = user?.plan === 'premium'
  const freePlan = ['3 datasets · 50 MB storage', '3 dashboards', '20 AI questions / month', 'Web only']
  const premiumPlan = ['100 datasets · 2 GB storage', '50 dashboards', '1,000 AI questions / month', 'Web + mobile access', 'Priority support']

  return (
    <Shell>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a0a0a', margin: 0, letterSpacing: '-0.02em' }}>Plan & Billing</h1>
        <p style={{ fontSize: 14, color: '#6b6b6b', marginTop: 6 }}>Manage your subscription and usage limits.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Free */}
        <div style={{ borderRadius: 14, padding: '24px', background: '#ffffff', border: `2px solid ${!isPremium ? '#0a0a0a' : '#e8e8e8'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a' }}>Free</div>
            {!isPremium && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#0a0a0a', color: '#fff' }}>Current plan</span>}
          </div>
          <div className="font-mono-num" style={{ fontSize: 32, fontWeight: 800, color: '#0a0a0a', margin: '14px 0 20px' }}>
            $0<span style={{ fontSize: 14, fontWeight: 500, color: '#6b6b6b' }}>/mo</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {freePlan.map((f) => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b6b6b' }}><Check />{f}</li>
            ))}
          </ul>
        </div>

        {/* Premium */}
        <div style={{ borderRadius: 14, padding: '24px', background: isPremium ? '#ffffff' : '#0a0a0a', border: `2px solid ${isPremium ? '#0a0a0a' : '#0a0a0a'}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: isPremium ? '#0a0a0a' : '#ffffff' }}>Premium</div>
            {isPremium
              ? <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#0a0a0a', color: '#fff' }}>Current plan</span>
              : <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: '#fff' }}>Most popular</span>
            }
          </div>
          <div className="font-mono-num" style={{ fontSize: 32, fontWeight: 800, color: isPremium ? '#0a0a0a' : '#ffffff', margin: '14px 0 20px' }}>
            $10<span style={{ fontSize: 14, fontWeight: 500, color: isPremium ? '#6b6b6b' : 'rgba(255,255,255,0.5)' }}>/mo</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {premiumPlan.map((f) => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: isPremium ? '#6b6b6b' : 'rgba(255,255,255,0.7)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isPremium ? '#16a34a' : '#fff'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {f}
              </li>
            ))}
          </ul>
          {isPremium ? (
            <button onClick={cancel} disabled={busy} style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1.5px solid rgba(220,38,38,0.2)', padding: '8px 16px', borderRadius: 8, opacity: busy ? 0.6 : 1 }}>
              Cancel subscription
            </button>
          ) : (
            <button onClick={upgrade} disabled={busy} style={{ width: '100%', padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#0a0a0a', background: '#ffffff', border: 'none', opacity: busy ? 0.6 : 1, transition: 'opacity 0.15s' }}>
              {busy ? 'Processing…' : 'Upgrade to Premium →'}
            </button>
          )}
        </div>
      </div>

      {sub && (
        <div style={{ padding: '12px 16px', borderRadius: 10, fontSize: 13, background: '#ffffff', border: '1.5px solid #e8e8e8', color: '#6b6b6b' }}>
          Subscription: <strong style={{ color: '#0a0a0a' }}>{sub.plan}</strong> · {sub.status} · {sub.provider}
          {sub.current_period_end ? ` · renews ${new Date(sub.current_period_end).toLocaleDateString()}` : ''}
        </div>
      )}
      {message && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, fontSize: 13, background: '#f0fdf4', color: '#16a34a', border: '1.5px solid rgba(22,163,74,0.2)' }}>{message}</div>}
      {error && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, fontSize: 13, background: '#fef2f2', color: '#dc2626', border: '1.5px solid rgba(220,38,38,0.2)' }}>{error}</div>}
    </Shell>
  )
}
