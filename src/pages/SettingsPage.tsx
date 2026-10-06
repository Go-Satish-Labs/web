import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Shell from '../components/Shell'
import { useAuth } from '../features/auth/AuthContext'
import { api } from '../lib/api'
import { friendlyError } from '../lib/errors'

/* ── Circular progress ring ── */
export function ProfileRing({
  pct, size = 44, stroke = 3, children,
}: { pct: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8e8e8" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={pct === 100 ? '#16a34a' : '#0a0a0a'} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}

/* ── Avatar ── */
function Avatar({ url, name, size = 80 }: { url?: string | null; name: string; size?: number }) {
  const initials = name.split('@')[0].slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: '#0a0a0a', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.3, fontWeight: 800, overflow: 'hidden',
    }}>
      {url ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
    </div>
  )
}

/* ── Security question modal ── */
function SecurityModal({ onClose, onSaved, existing }: {
  onClose: () => void
  onSaved: (q: string) => void
  existing: string
}) {
  const [q, setQ] = useState(existing)
  const [a, setA] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const { refreshUser } = useAuth()

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!q.trim() || !a.trim()) { setErr('Both fields are required.'); return }
    setSaving(true); setErr('')
    try {
      await api.patch('/auth/me', { security_question: q.trim(), security_answer: a.trim() })
      await refreshUser()
      onSaved(q.trim())
    } catch (err) { setErr(friendlyError(err)) }
    finally { setSaving(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 460,
        boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#a8a8a8', textTransform: 'uppercase', marginBottom: 6 }}>
              Account security
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0a0a0a', lineHeight: 1.2 }}>
              Set a security question
            </div>
            <div style={{ fontSize: 13, color: '#6b6b6b', marginTop: 8, lineHeight: 1.6 }}>
              This is used to verify your identity if you ever need to recover your password.
            </div>
          </div>
          <button onClick={onClose} style={{
            background: '#f3f3f3', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#6b6b6b',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 16,
          }}>✕</button>
        </div>

        {/* Lock icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: '#f3f3f3',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b6b6b', display: 'block', marginBottom: 7 }}>
              Security question
            </label>
            <input
              value={q} onChange={e => setQ(e.target.value)} required
              placeholder="e.g. What was your first pet's name?"
              style={{
                width: '100%', padding: '12px 14px', fontSize: 14, borderRadius: 10,
                border: '1.5px solid #e8e8e8', background: '#f9f9f9', color: '#0a0a0a',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b6b6b', display: 'block', marginBottom: 7 }}>
              Your answer
            </label>
            <input
              value={a} onChange={e => setA(e.target.value)} required
              placeholder="Answer (case-insensitive)"
              style={{
                width: '100%', padding: '12px 14px', fontSize: 14, borderRadius: 10,
                border: '1.5px solid #e8e8e8', background: '#f9f9f9', color: '#0a0a0a',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {err && <div style={{ fontSize: 13, color: '#dc2626', padding: '10px 14px', background: '#fef2f2', borderRadius: 8 }}>{err}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="submit" disabled={saving} style={{
              flex: 1, padding: '13px', borderRadius: 10, border: 'none',
              background: '#0a0a0a', color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Saving…' : 'Save security question'}
            </button>
            <button type="button" onClick={onClose} style={{
              padding: '13px 20px', borderRadius: 10, border: '1.5px solid #e8e8e8',
              background: '#fff', color: '#0a0a0a', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              Later
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const sectionCard: React.CSSProperties = {
  background: '#fff', border: '1.5px solid #e8e8e8',
  borderRadius: 16, padding: '24px 24px', marginBottom: 16,
}
const fieldLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.08em', color: '#6b6b6b', display: 'block', marginBottom: 7,
}
const fieldInput: React.CSSProperties = {
  width: '100%', padding: '11px 14px', fontSize: 14,
  background: '#f9f9f9', border: '1.5px solid #e8e8e8',
  borderRadius: 10, color: '#0a0a0a', outline: 'none', boxSizing: 'border-box',
}
const saveBtn: React.CSSProperties = {
  padding: '11px 24px', borderRadius: 10, border: 'none',
  background: '#0a0a0a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()

  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingPic, setUploadingPic] = useState(false)
  const [picErr, setPicErr] = useState('')

  const [secQ, setSecQ] = useState('')
  const [hasSecQ, setHasSecQ] = useState(false)
  const [editingSec, setEditingSec] = useState(false)
  const [showSecModal, setShowSecModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      if (data.security_question) { setSecQ(data.security_question); setHasSecQ(true) }
      if (data.display_name) setDisplayName(data.display_name)
    }).finally(() => setLoading(false))
  }, [])

  // Profile completion: pic (50%) + security question (50%)
  const picDone = !!user?.profilePicUrl
  const secDone = hasSecQ
  const pct = (picDone ? 50 : 0) + (secDone ? 50 : 0)

  async function saveName(e: FormEvent) {
    e.preventDefault()
    setSavingName(true); setNameMsg('')
    try {
      await api.patch('/auth/me/profile', { display_name: displayName })
      await refreshUser()
      setNameMsg('Saved.')
      setTimeout(() => setNameMsg(''), 2500)
    } finally { setSavingName(false) }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPicErr('')
    if (!file.type.startsWith('image/')) { setPicErr('Please pick an image file.'); return }
    if (file.size > 2 * 1024 * 1024) { setPicErr('Image must be under 2 MB.'); return }
    setUploadingPic(true)
    try {
      const bytes = await file.arrayBuffer()
      await api.post('/auth/me/profile-pic', bytes, { headers: { 'Content-Type': file.type } })
      await refreshUser()
    } catch (err) { setPicErr(friendlyError(err)) }
    finally { setUploadingPic(false); if (fileRef.current) fileRef.current.value = '' }
  }

  async function removePic() {
    setUploadingPic(true)
    try { await api.delete('/auth/me/profile-pic'); await refreshUser() }
    finally { setUploadingPic(false) }
  }

  async function removeSecurity() {
    if (!window.confirm('Remove your security question? Password recovery will be unavailable.')) return
    try {
      await api.patch('/auth/me', { security_question: '', security_answer: '' })
      setSecQ(''); setHasSecQ(false); setEditingSec(false)
      await refreshUser()
    } catch { /* ignore */ }
  }

  if (loading) return <Shell><div style={{ color: '#6b6b6b', fontSize: 14 }}>Loading…</div></Shell>

  const email = user?.email ?? ''

  return (
    <Shell>
      {showSecModal && (
        <SecurityModal
          existing={secQ}
          onClose={() => { setShowSecModal(false); setEditingSec(false) }}
          onSaved={q => { setSecQ(q); setHasSecQ(true); setShowSecModal(false); setEditingSec(false) }}
        />
      )}

      <div style={{ maxWidth: 600 }}>

        {/* ── Hero profile card ── */}
        <div style={{
          background: '#0a0a0a', borderRadius: 20, padding: '32px 28px', marginBottom: 16,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* subtle grid texture */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.04,
            backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '32px 32px',
          }} />

          <div style={{ position: 'relative', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            {/* Avatar with ring */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <ProfileRing pct={pct} size={96} stroke={3}>
                <div style={{ position: 'relative' }}>
                  <Avatar url={user?.profilePicUrl} name={email} size={82} />
                  <button onClick={() => fileRef.current?.click()} disabled={uploadingPic}
                    style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 26, height: 26, borderRadius: '50%',
                      background: '#fff', border: '2px solid #0a0a0a',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, color: '#0a0a0a',
                    }}>
                    {uploadingPic ? '…' : '✎'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickFile} />
                </div>
              </ProfileRing>
              {/* pct label */}
              <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, fontWeight: 700, color: pct === 100 ? '#16a34a' : 'rgba(255,255,255,0.5)' }}>
                {pct}%
              </div>
            </div>

            {/* Name + email */}
            <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.displayName || email}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {email}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>
                  {user?.plan ?? 'free'}
                </span>
                {!secDone && (
                  <button onClick={() => setShowSecModal(true)} style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer',
                  }}>
                    + Add security question
                  </button>
                )}
              </div>
            </div>
          </div>

          {picErr && (
            <div style={{ marginTop: 16, fontSize: 12, color: '#fca5a5', padding: '8px 12px', background: 'rgba(220,38,38,0.15)', borderRadius: 8 }}>{picErr}</div>
          )}
          {user?.profilePicUrl && (
            <button onClick={removePic} disabled={uploadingPic}
              style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0, position: 'relative' }}>
              Remove photo
            </button>
          )}
        </div>

        {/* ── Profile completion checklist ── */}
        {pct < 100 && (
          <div style={{ ...sectionCard, background: '#fafafa' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a', marginBottom: 14 }}>Complete your profile</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { done: picDone, label: 'Upload a profile photo', action: () => fileRef.current?.click() },
                { done: secDone, label: 'Set a security question for password recovery', action: () => setShowSecModal(true) },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: item.done ? '#16a34a' : '#e8e8e8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <span style={{ fontSize: 13, color: item.done ? '#6b6b6b' : '#0a0a0a', textDecoration: item.done ? 'line-through' : 'none', flex: 1 }}>
                    {item.label}
                  </span>
                  {!item.done && (
                    <button onClick={item.action} style={{ fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 8, border: '1.5px solid #e8e8e8', background: '#fff', color: '#0a0a0a', cursor: 'pointer' }}>
                      Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Display name ── */}
        <div style={sectionCard}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', marginBottom: 16 }}>Display name</div>
          <form onSubmit={saveName}>
            <label style={fieldLabel}>Name shown across the app</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input style={{ ...fieldInput, flex: 1 }} value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={email} maxLength={80} />
              <button type="submit" disabled={savingName} style={{ ...saveBtn, flexShrink: 0 }}>
                {savingName ? 'Saving…' : 'Save'}
              </button>
            </div>
            {nameMsg && <div style={{ fontSize: 12, color: '#16a34a', marginTop: 8 }}>{nameMsg}</div>}
          </form>
        </div>

        {/* ── Account info ── */}
        <div style={sectionCard}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a', marginBottom: 16 }}>Account</div>
          {[
            { label: 'Email / Username', value: email },
            { label: 'Plan', value: (user?.plan ?? 'free').charAt(0).toUpperCase() + (user?.plan ?? 'free').slice(1) },
            { label: 'Role', value: (user?.role ?? 'member').charAt(0).toUpperCase() + (user?.role ?? 'member').slice(1) },
          ].map((row, i, arr) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: i < arr.length - 1 ? '1px solid #f3f3f3' : 'none' }}>
              <span style={{ fontSize: 13, color: '#6b6b6b' }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0a' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* ── Security question ── */}
        <div style={sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a' }}>Security question</div>
              <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 3 }}>Used for password recovery verification</div>
            </div>
            {hasSecQ && !editingSec && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setEditingSec(true); setShowSecModal(true) }}
                  style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e8e8e8', background: '#fff', color: '#0a0a0a', cursor: 'pointer' }}>
                  Edit
                </button>
                <button onClick={removeSecurity}
                  style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, border: '1.5px solid #fca5a5', background: '#fff', color: '#dc2626', cursor: 'pointer' }}>
                  Remove
                </button>
              </div>
            )}
          </div>

          {hasSecQ ? (
            <div style={{ padding: '14px 16px', borderRadius: 10, background: '#f0fdf4', border: '1.5px solid rgba(22,163,74,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>Security question set</div>
                <div style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>{secQ}</div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '14px 16px', borderRadius: 10, background: '#f9f9f9', border: '1.5px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontSize: 13, color: '#6b6b6b' }}>No security question set — password recovery unavailable.</div>
              <button onClick={() => setShowSecModal(true)}
                style={{ ...saveBtn, padding: '8px 16px', fontSize: 12, flexShrink: 0 }}>
                Set now
              </button>
            </div>
          )}
        </div>

      </div>
    </Shell>
  )
}
