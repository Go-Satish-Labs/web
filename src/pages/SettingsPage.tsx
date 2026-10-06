import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import Shell from '../components/Shell'
import { useAuth } from '../features/auth/AuthContext'
import { api } from '../lib/api'
import { friendlyError } from '../lib/errors'

/* ── Circular progress ring (exported for Shell header) ── */
export function ProfileRing({
  pct, size = 44, stroke = 3, children,
}: { pct: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track,#e5e5e5)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={pct === 100 ? '#16a34a' : 'var(--ink,#0a0a0a)'} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(.22,1,.36,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
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
  const qRef = useRef<HTMLInputElement>(null)

  useEffect(() => { qRef.current?.focus() }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!q.trim() || !a.trim()) { setErr('Both fields are required.'); return }
    setSaving(true); setErr('')
    try {
      await api.patch('/auth/me', { security_question: q.trim(), security_answer: a.trim() })
      await refreshUser()
      onSaved(q.trim())
    } catch (e) { setErr(friendlyError(e)) }
    finally { setSaving(false) }
  }

  const inp: React.CSSProperties = {
    width: '100%', height: 48, padding: '0 16px', fontSize: 15,
    border: '1px solid #d4d4d4', borderRadius: 12, outline: 'none',
    background: '#fff', color: '#000', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 24, padding: '32px',
        width: '100%', maxWidth: 440,
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
        border: '1px solid #e5e5e5',
      }}>
        {/* header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: '#000', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: '50%', border: '1px solid #e5e5e5',
            background: '#fff', cursor: 'pointer', fontSize: 14, color: '#737373',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
          {existing ? 'Edit security question' : 'Set a security question'}
        </div>
        <div style={{ fontSize: 14, color: '#737373', marginBottom: 24, lineHeight: 1.5 }}>
          We ask this if you ever need to recover your password.
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Question</label>
            <input ref={qRef} value={q} onChange={e => setQ(e.target.value)} required
              placeholder="What was your first pet's name?" style={inp} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Answer</label>
            <input value={a} onChange={e => setA(e.target.value)} required
              autoComplete="off" placeholder="Not case-sensitive" style={inp} />
          </div>
          {err && <div style={{ fontSize: 13, color: '#dc2626', padding: '10px 14px', background: '#fef2f2', borderRadius: 8 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button type="submit" disabled={saving} style={{
              flex: 1, height: 48, borderRadius: 12, border: '1px solid #000',
              background: '#000', color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
              fontFamily: 'inherit',
            }}>
              {saving ? 'Saving…' : 'Save question'}
            </button>
            <button type="button" onClick={onClose} style={{
              height: 48, padding: '0 20px', borderRadius: 12, border: '1px solid #d4d4d4',
              background: '#fff', color: '#000', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Check icon ── */
const Check = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const location = useLocation()

  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [savedName, setSavedName] = useState(user?.displayName ?? '')
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingPic, setUploadingPic] = useState(false)
  const [picErr, setPicErr] = useState('')

  const [secQ, setSecQ] = useState('')
  const [hasSecQ, setHasSecQ] = useState(false)
  const [showSecModal, setShowSecModal] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      if (data.security_question) { setSecQ(data.security_question); setHasSecQ(true) }
      if (data.display_name) { setDisplayName(data.display_name); setSavedName(data.display_name) }
    }).finally(() => setLoading(false))
  }, [])

  // Auto-open security modal if navigated here from the gate popup
  useEffect(() => {
    if ((location.state as { openSec?: boolean } | null)?.openSec) {
      setShowSecModal(true)
      window.history.replaceState({}, '')
    }
  }, [location.state])

  const picDone = !!user?.profilePicUrl
  const secDone = hasSecQ
  const pct = (picDone ? 50 : 0) + (secDone ? 50 : 0)
  const CIRC = 2 * Math.PI * 54

  async function saveName(e: FormEvent) {
    e.preventDefault()
    if (displayName.trim() === savedName.trim()) return
    setSavingName(true); setNameMsg('')
    try {
      await api.patch('/auth/me/profile', { display_name: displayName })
      await refreshUser()
      setSavedName(displayName)
      setNameMsg('✓ Name saved')
      setTimeout(() => setNameMsg(''), 2500)
    } finally { setSavingName(false) }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setPicErr('')
    if (!file.type.startsWith('image/')) { setPicErr('Choose an image file (PNG, JPG or WebP).'); return }
    if (file.size > 2 * 1024 * 1024) { setPicErr('Choose an image smaller than 2 MB.'); return }
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
    try {
      await api.patch('/auth/me', { security_question: '', security_answer: '' })
      setSecQ(''); setHasSecQ(false); setConfirming(false)
      await refreshUser()
    } catch { /* ignore */ }
  }

  if (loading) return <Shell><div style={{ color: '#737373', fontSize: 14 }}>Loading…</div></Shell>

  const email = user?.email ?? ''
  const initials = email.split('@')[0].slice(0, 2).toUpperCase()

  const inp: React.CSSProperties = {
    width: '100%', height: 48, padding: '0 16px', fontSize: 15,
    border: '1px solid #d4d4d4', borderRadius: 12, outline: 'none',
    background: '#fff', color: '#000', boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const btn: React.CSSProperties = {
    height: 48, padding: '0 24px', borderRadius: 12, fontSize: 14, fontWeight: 600,
    border: '1px solid #000', background: '#000', color: '#fff',
    cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
  }
  const ghostBtn: React.CSSProperties = {
    ...btn, background: '#fff', color: '#000', border: '1px solid #d4d4d4',
  }
  const smBtn: React.CSSProperties = {
    height: 36, padding: '0 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
    border: '1px solid #000', background: '#000', color: '#fff',
    cursor: 'pointer', fontFamily: 'inherit',
  }
  const smGhost: React.CSSProperties = { ...smBtn, background: '#fff', color: '#000', border: '1px solid #d4d4d4' }
  const row: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 16, padding: '16px 0', borderTop: '1px solid #d4d4d4',
  }
  const sec: React.CSSProperties = { padding: '32px 0 8px' }

  return (
    <Shell>
      {showSecModal && (
        <SecurityModal
          existing={secQ}
          onClose={() => setShowSecModal(false)}
          onSaved={q => { setSecQ(q); setHasSecQ(true); setShowSecModal(false); setConfirming(false) }}
        />
      )}

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px 64px' }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickFile} />

        {/* ── Hero ── */}
        <div style={{ display: 'flex', gap: 28, alignItems: 'center', padding: '8px 0 32px', flexWrap: 'wrap' }}>
          {/* Ring + avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'relative', width: 116, height: 116 }}>
              <svg width="116" height="116" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                <circle cx="58" cy="58" r="54" fill="none" stroke="#e5e5e5" strokeWidth="4"/>
                <circle cx="58" cy="58" r="54" fill="none"
                  stroke={pct === 100 ? '#16a34a' : '#000'} strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${pct / 100 * CIRC} ${CIRC}`}
                  style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(.22,1,.36,1)' }}/>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: 98, height: 98, borderRadius: '50%',
                  background: '#000', color: '#fff', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 31, fontWeight: 700, letterSpacing: '-0.02em',
                }}>
                  {user?.profilePicUrl
                    ? <img src={user.profilePicUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials}
                </div>
              </div>
            </div>
            {/* edit button */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingPic}
              style={{
                position: 'absolute', right: 2, bottom: 2,
                width: 34, height: 34, borderRadius: '50%',
                background: '#fff', color: '#000', border: '2px solid #000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {uploadingPic ? '…' : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                </svg>
              )}
            </button>
          </div>

          {/* Name + email + meta */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName || email}
            </h1>
            {user?.displayName && (
              <div style={{ fontSize: 15, color: '#737373', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 999, border: '1px solid #000', textTransform: 'capitalize' }}>
                {user?.plan ?? 'free'} plan
              </span>
              {user?.profilePicUrl && (
                <button onClick={removePic} disabled={uploadingPic}
                  style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, fontWeight: 500, color: '#737373', textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}>
                  Remove photo
                </button>
              )}
            </div>
          </div>
        </div>

        {picErr && (
          <div style={{ fontSize: 13, fontWeight: 500, padding: '12px 14px', borderRadius: 10, border: '1px solid #000', background: '#f5f5f5', marginBottom: 16 }}>{picErr}</div>
        )}

        {/* ── Finish setting up (hidden when 100%) ── */}
        {pct < 100 && (
          <div style={{ background: '#000', color: '#fff', borderRadius: 24, padding: '28px 28px 12px', marginBottom: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Finish setting up</h2>
              <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.6 }}>{pct}% complete</span>
            </div>
            <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.2)', margin: '16px 0 8px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: '#fff', borderRadius: 4, transition: 'width 0.9s cubic-bezier(.22,1,.36,1)' }} />
            </div>
            {[
              { done: picDone, label: 'Add a profile photo', action: () => fileRef.current?.click() },
              { done: secDone, label: 'Set a security question', action: () => setShowSecModal(true) },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0',
                borderTop: '1px solid rgba(255,255,255,0.18)',
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  border: `1.5px solid ${item.done ? '#fff' : 'rgba(255,255,255,0.5)'}`,
                  background: item.done ? '#fff' : 'transparent',
                  color: '#000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.done && <Check />}
                </span>
                <span style={{ flex: 1, fontSize: 15, opacity: item.done ? 0.5 : 1, textDecoration: item.done ? 'line-through' : 'none' }}>
                  {item.label}
                </span>
                {!item.done && (
                  <button onClick={item.action} style={{ height: 36, padding: '0 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Add
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Display name ── */}
        <section style={sec}>
          <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>Display name</h2>
          <p style={{ fontSize: 14, color: '#737373', margin: '4px 0 0', lineHeight: 1.5 }}>This is how your name appears across the app.</p>
          <form onSubmit={saveName} style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder={email} maxLength={80}
                style={{ ...inp, flex: 1, minWidth: 200 }} />
              <button type="submit" disabled={savingName || displayName.trim() === savedName.trim()} style={{ ...btn, opacity: (savingName || displayName.trim() === savedName.trim()) ? 0.45 : 1 }}>
                {savingName ? 'Saving…' : 'Save changes'}
              </button>
            </div>
            {nameMsg && <div style={{ minHeight: 22, marginTop: 10, fontSize: 13, fontWeight: 500, color: '#000' }}>{nameMsg}</div>}
          </form>
        </section>

        {/* ── Account ── */}
        <section style={{ ...sec, paddingTop: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', margin: '0 0 12px' }}>Account</h2>
          {[
            { label: 'Email', value: email },
            { label: 'Plan', value: (user?.plan ?? 'free').charAt(0).toUpperCase() + (user?.plan ?? 'free').slice(1) },
            { label: 'Role', value: (user?.role ?? 'member').charAt(0).toUpperCase() + (user?.role ?? 'member').slice(1) },
          ].map(r => (
            <div key={r.label} style={row}>
              <span style={{ fontSize: 14, color: '#737373' }}>{r.label}</span>
              <b style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.value}</b>
            </div>
          ))}
        </section>

        {/* ── Password recovery ── */}
        <section style={{ ...sec, paddingTop: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>Password recovery</h2>
          <p style={{ fontSize: 14, color: '#737373', margin: '4px 0 0', lineHeight: 1.5 }}>Your security question confirms it's you if you forget your password.</p>
          <div style={{
            marginTop: 16, padding: 20, borderRadius: 16,
            border: `1px solid ${hasSecQ ? '#000' : '#d4d4d4'}`,
            background: hasSecQ ? '#fff' : '#f5f5f5',
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            transition: 'background 0.3s, border-color 0.3s',
          }}>
            <span style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: hasSecQ ? '#000' : '#fff', color: hasSecQ ? '#fff' : '#000',
              border: '1px solid #d4d4d4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{hasSecQ ? 'Security question is set' : 'No security question'}</div>
              <div style={{ fontSize: 14, color: '#737373', marginTop: 2, overflowWrap: 'anywhere' }}>
                {hasSecQ ? secQ : "You won't be able to recover your password without one."}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {!hasSecQ && <button onClick={() => setShowSecModal(true)} style={smBtn}>Set question</button>}
              {hasSecQ && !confirming && (
                <>
                  <button onClick={() => setShowSecModal(true)} style={smGhost}>Edit</button>
                  <button onClick={() => setConfirming(true)} style={smGhost}>Remove</button>
                </>
              )}
              {confirming && (
                <>
                  <button onClick={removeSecurity} style={smBtn}>Yes, remove</button>
                  <button onClick={() => setConfirming(false)} style={smGhost}>Cancel</button>
                </>
              )}
            </div>
          </div>
          {confirming && (
            <p style={{ fontSize: 13, color: '#737373', marginTop: 10 }}>Removing it turns off password recovery for this account.</p>
          )}
        </section>
      </div>
    </Shell>
  )
}
