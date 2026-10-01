import { useEffect, useState } from 'react'
import { api, apiErrorMessage, type Prediction } from '../lib/api'

const BASE = import.meta.env.VITE_API_URL || '/api'

/**
 * Turns a server-relative path like "/dashboards/shared/abc" into a link the
 * user can open.
 *
 * BASE is an absolute URL in production (https://api-...onrender.com) but a
 * path in dev (/api), where Vite proxies it. Joining those naively with the
 * page origin produced
 * "https://app.vercel.apphttps://api-...onrender.com/dashboards/shared/abc",
 * which is why shared links worked locally and 404'd once deployed. An
 * absolute BASE is already the whole answer, so it is used as-is.
 */
function absolute(url: string): string {
  if (/^https?:\/\//i.test(BASE)) return `${BASE}${url}`
  return `${window.location.origin}${BASE}${url}`
}

interface ShareLink {
  token: string
  mode: string
  title: string
  url: string
  created_at: string
  expires_at: string | null
  view_count: number
  expired: boolean
}

function when(iso: string | null): string {
  if (!iso) return 'no expiry'
  const then = new Date(iso).getTime()
  const hours = Math.round((then - Date.now()) / 3_600_000)
  if (hours <= 0) return 'expired'
  if (hours < 48) return `expires in ${hours}h`
  return `expires in ${Math.round(hours / 24)} days`
}

/**
 * Creates a public link to the current dashboard view.
 *
 * The link opens a standalone HTML document, so a recipient needs no login
 * and no access to the uploaded file - which is also why the panel is explicit
 * about who can read it. Revoking a link takes effect immediately.
 */
export default function ShareButton({ datasetId, mode, prediction }: {
  datasetId: string
  mode: 'history' | 'prediction'
  prediction: Prediction | null
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<string | null>(null)
  const [links, setLinks] = useState<ShareLink[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    setError(''); setCreated(null); setCopied(false)
    api.get<ShareLink[]>('/dashboards/shared/list')
      .then(({ data }) => setLinks(data.filter(l => l.mode === mode)))
      .catch((e) => setError(apiErrorMessage(e)))
  }, [open, mode])

  async function create() {
    setError(''); setBusy(true)
    try {
      const { data } = await api.post('/dashboards/share', {
        dataset_id: datasetId,
        mode,
        title: null,
        // Prediction reports must carry the exact result the user is looking
        // at, otherwise the shared page would show a different model.
        prediction: mode === 'prediction' ? prediction : undefined,
      })
      setCreated(data.url)
      setLinks(l => [{ ...data, view_count: 0, expired: false }, ...l])
    } catch (e) {
      setError(apiErrorMessage(e))
    } finally { setBusy(false) }
  }

  async function revoke(token: string) {
    setError('')
    try {
      await api.delete(`/dashboards/shared/${token}`)
      setLinks(l => l.filter(x => x.token !== token))
      if (created && created.endsWith(token)) setCreated(null)
    } catch (e) { setError(apiErrorMessage(e)) }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(absolute(url))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Could not copy automatically — select the link and copy it manually.')
    }
  }

  if (mode === 'prediction' && !prediction) return null

  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.6" y1="10.5" x2="15.4" y2="6.5"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/>
        </svg>
        Share
      </button>

      {open && (
        <div onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto', padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a' }}>Share this {mode === 'prediction' ? 'prediction' : 'dashboard'}</div>
                <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 4 }}>
                  Creates a public link anyone can open, without signing in.
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                style={{ border: 'none', background: '#f3f3f3', cursor: 'pointer', color: '#0a0a0a', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: 9, background: '#fffbeb', border: '1.5px solid rgba(202,138,4,0.2)', fontSize: 12, color: '#92400e', lineHeight: 1.6, margin: '14px 0' }}>
              The link shows your numbers, not your rows — no data from the file is
              included. Anyone with the link can read it until it expires or you
              revoke it.
            </div>

            {created && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 6 }}>✓ Link ready</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
                  <input readOnly value={absolute(created)}
                    style={{ flex: 1, padding: '8px 10px', fontSize: 12, borderRadius: 8, border: '1.5px solid #e8e8e8', background: '#fafafa' }} />
                  <button onClick={() => copy(created)}
                    style={{ padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, border: '1.5px solid #e8e8e8', background: '#fff', color: '#0a0a0a', whiteSpace: 'nowrap' }}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                  <a href={absolute(created)} target="_blank" rel="noreferrer"
                    style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: '#0a0a0a', color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Open
                  </a>
                </div>
              </div>
            )}

            <button onClick={create} disabled={busy}
              style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', cursor: busy ? 'not-allowed' : 'pointer', background: '#0a0a0a', color: '#fff', fontSize: 13, fontWeight: 700, opacity: busy ? 0.5 : 1 }}>
              {busy ? 'Creating…' : created ? 'Create another link' : 'Create share link'}
            </button>

            {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 10 }}>{error}</div>}

            {links.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a8a8a8', marginBottom: 8 }}>
                  Existing links
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {links.map(l => (
                    <div key={l.token} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e8e8e8', background: '#fafafa' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: '#0a0a0a', fontWeight: 600 }}>
                          {when(l.expires_at)} · {l.view_count} view{l.view_count === 1 ? '' : 's'}
                        </div>
                        <div style={{ fontSize: 11, color: '#a8a8a8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {absolute(l.url)}
                        </div>
                      </div>
                      <button onClick={() => copy(l.url)}
                        style={{ background: '#fff', border: '1.5px solid #e8e8e8', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#0a0a0a' }}>
                        Copy
                      </button>
                      <button onClick={() => revoke(l.token)}
                        style={{ background: '#fff', border: '1.5px solid #fecaca', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#dc2626' }}>
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
