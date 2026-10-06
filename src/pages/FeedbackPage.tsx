import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Shell from '../components/Shell'
import { api, type Feedback } from '../lib/api'
import { friendlyError } from '../lib/errors'

const CATEGORIES = [
  { id: 'bug', label: 'Something is broken', hint: 'A button that does nothing, wrong numbers, an error message' },
  { id: 'idea', label: 'A feature I would use', hint: 'Something you want to be able to do' },
  { id: 'confusing', label: 'Something is confusing', hint: 'A chart or number you did not understand' },
  { id: 'praise', label: 'Just saying thanks', hint: 'The good stuff is worth hearing too' },
]

const RATING_LABEL = ['', 'Not useful', 'Could be better', 'Good', 'Very good', 'Excellent']

export default function FeedbackPage() {
  const location = useLocation()
  const [category, setCategory] = useState('bug')
  const [rating, setRating] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState<Feedback | null>(null)
  const [mine, setMine] = useState<Feedback[]>([])

  useEffect(() => {
    api.get<Feedback[]>('/feedback')
      .then(({ data }) => setMine(data))
      .catch(() => {})
  }, [])

  async function submit() {
    if (!message.trim()) return
    setBusy(true); setError('')
    try {
      const { data } = await api.post<Feedback>('/feedback', {
        category, rating: rating ?? null, message: message.trim(), context: location.pathname,
      })
      setSent(data); setMine(m => [data, ...m]); setMessage(''); setRating(null)
    } catch (e) { setError(friendlyError(e)) }
    finally { setBusy(false) }
  }

  const card: React.CSSProperties = {
    borderRadius: 14, padding: 20, background: '#fff',
    border: '1.5px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  }

  return (
    <Shell>
      <div className="page-enter">
        <div className="rise" style={{ '--i': 0, marginBottom: 24 } as React.CSSProperties}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a0a0a', margin: 0, letterSpacing: '-0.02em' }}>Feedback</h1>
          <p style={{ fontSize: 14, color: '#6b6b6b', marginTop: 6 }}>
            Tell us what is working and what is not. It goes straight to the people building this.
          </p>
        </div>

        {sent && (
          <div className="pop-in" style={{ padding: '14px 18px', borderRadius: 12, marginBottom: 16, background: '#f0fdf4', border: '1.5px solid rgba(22,163,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>✓ Thanks — we have your message.</span>
            <button onClick={() => setSent(null)} className="btn-close">×</button>
          </div>
        )}

        <div className="card-hover rise" style={{ '--i': 1, ...card, marginBottom: 20 } as React.CSSProperties}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a8a8a8', marginBottom: 10 }}>
            What is this about?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 8, marginBottom: 22 }}>
            {CATEGORIES.map(c => {
              const active = category === c.id
              return (
                <button key={c.id} onClick={() => setCategory(c.id)} className="btn-base"
                  style={{ padding: '11px 13px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', border: `1.5px solid ${active ? '#0a0a0a' : '#e8e8e8'}`, background: active ? '#0a0a0a' : '#fff', color: active ? '#fff' : '#0a0a0a' }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: active ? 'rgba(255,255,255,0.6)' : '#a8a8a8', marginTop: 2, lineHeight: 1.5 }}>{c.hint}</div>
                </button>
              )
            })}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a8a8a8', marginBottom: 10 }}>
            How is Analytrix working for you? <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>(optional)</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 22, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5].map(n => {
              const active = rating === n
              return (
                <button key={n} onClick={() => setRating(active ? null : n)} className="btn-base"
                  title={RATING_LABEL[n]} aria-pressed={active} aria-label={`${n} out of 5 - ${RATING_LABEL[n]}`}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 40, minWidth: 46, padding: '0 12px', borderRadius: 10, cursor: 'pointer', fontSize: 14, lineHeight: 1, whiteSpace: 'nowrap', letterSpacing: 1, border: `1.5px solid ${active ? '#0a0a0a' : '#e8e8e8'}`, background: active ? '#0a0a0a' : '#fff', color: active ? '#fff' : '#9aa0a6' }}>
                  {'★'.repeat(n)}
                </button>
              )
            })}
            {rating !== null && <span style={{ alignSelf: 'center', fontSize: 12, color: '#6b6b6b', marginLeft: 4 }}>{RATING_LABEL[rating]}</span>}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a8a8a8', marginBottom: 10 }}>
            Your message
          </div>
          <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, 4000))} rows={6}
            placeholder="Tell us what happened, or what you were trying to do…" className="input-base"
            style={{ width: '100%', padding: 12, fontSize: 14, borderRadius: 10, resize: 'vertical', border: '1.5px solid #e8e8e8', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#a8a8a8' }}>
              {message.length}/4000
              <span style={{ display: 'block', marginTop: 2 }}>We store your message and the page you were on — never your data.</span>
            </span>
            <button onClick={submit} disabled={busy || !message.trim()} className="btn-base btn-solid">
              {busy ? 'Sending…' : 'Send feedback'}
            </button>
          </div>
          {error && <div className="shake" style={{ fontSize: 12, color: '#dc2626', marginTop: 10 }}>{error}</div>}
        </div>

        {mine.length > 0 && (
          <div className="card-hover rise" style={{ '--i': 2, ...card } as React.CSSProperties}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a', marginBottom: 4 }}>Your previous messages</div>
            <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 14 }}>Most recent first.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mine.map(f => (
                <div key={f.id} className="row-hover" style={{ padding: '11px 14px', borderRadius: 10, background: '#f9f9f9', border: '1.5px solid #e8e8e8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', textTransform: 'capitalize' }}>
                      {f.category}{f.rating ? ` · ${'★'.repeat(f.rating)}` : ''}
                    </span>
                    <span style={{ fontSize: 11, color: '#a8a8a8', flexShrink: 0 }}>{new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b6b6b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{f.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}
