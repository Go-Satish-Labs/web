import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import Shell from '../components/Shell'
import { useAuth } from '../features/auth/AuthContext'
import { api } from '../lib/api'
import { friendlyError } from '../lib/errors'

const CIRC = 2 * Math.PI * 54

const LockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
  </svg>
)

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
          stroke={pct === 100 ? '#16a34a' : 'var(--ink,#000)'} strokeWidth={stroke}
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
  const [closing, setClosing] = useState(false)
  const { refreshUser } = useAuth()
  const qRef = useRef<HTMLInputElement>(null)

  useEffect(() => { qRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  function close() {
    setClosing(true)
    setTimeout(onClose, 200)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!q.trim() || !a.trim()) { setErr('Enter both a question and an answer.'); return }
    setSaving(true); setErr('')
    try {
      await api.patch('/auth/me', { security_question: q.trim(), security_answer: a.trim() })
      await refreshUser()
      onSaved(q.trim())
    } catch (e) { setErr(friendlyError(e)) }
    finally { setSaving(false) }
  }

  return (
    <div className={`sp-modal-scrim${closing ? ' closing' : ''}`} onClick={close}>
      <div className="sp-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div className="sp-mico"><LockIcon /></div>
          <button className="sp-x" onClick={close} aria-label="Close">✕</button>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.02em', margin: '0 0 6px' }}>
          {existing ? 'Edit security question' : 'Set a security question'}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--g1)', margin: '0 0 24px', lineHeight: 1.5 }}>
          We ask this if you ever need to recover your password.
        </p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Question</label>
            <input ref={qRef} className="sp-input" value={q} onChange={e => setQ(e.target.value)} required
              placeholder="What was your first pet's name?" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Answer</label>
            <input className="sp-input" value={a} onChange={e => setA(e.target.value)} required
              autoComplete="off" placeholder="Not case-sensitive" />
          </div>
          {err && <div className="sp-alert" style={{ margin: 0 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button type="submit" className="sp-btn" style={{ flex: 1 }} disabled={saving}>
              {saving ? 'Saving…' : 'Save question'}
            </button>
            <button type="button" className="sp-btn ghost" onClick={close}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const location = useLocation()

  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [savedName, setSavedName] = useState(user?.displayName ?? '')
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState('')
  const [nameMsgShow, setNameMsgShow] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingPic, setUploadingPic] = useState(false)
  const [picErr, setPicErr] = useState('')

  const [secQ, setSecQ] = useState('')
  const [hasSecQ, setHasSecQ] = useState(!!user?.hasSecurityQuestion)
  const [showSecModal, setShowSecModal] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(true)

  // track pct for animated bar
  const picDone = !!user?.profilePicUrl
  const secDone = hasSecQ
  const pct = (picDone ? 50 : 0) + (secDone ? 50 : 0)
  const [doneHidden, setDoneHidden] = useState(false)
  const [doneOut, setDoneOut] = useState(false)

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      if (data.security_question) { setSecQ(data.security_question); setHasSecQ(true) }
      if (data.display_name) { setDisplayName(data.display_name); setSavedName(data.display_name) }
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if ((location.state as { openSec?: boolean } | null)?.openSec) {
      setShowSecModal(true)
      window.history.replaceState({}, '')
    }
  }, [location.state])

  // animate "Finish setting up" card out when pct hits 100
  useEffect(() => {
    if (pct === 100 && !doneOut) {
      setDoneOut(true)
      setTimeout(() => setDoneHidden(true), 700)
    }
    if (pct < 100) { setDoneHidden(false); setDoneOut(false) }
  }, [pct])

  async function saveName(e: FormEvent) {
    e.preventDefault()
    if (displayName.trim() === savedName.trim()) return
    setSavingName(true); setNameMsg('')
    try {
      await api.patch('/auth/me/profile', { display_name: displayName })
      await refreshUser()
      setSavedName(displayName)
      setNameMsg('✓ Name saved')
      setNameMsgShow(true)
      setTimeout(() => { setNameMsg(''); setNameMsgShow(false) }, 2500)
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

  if (loading) return <Shell><div style={{ color: 'var(--g1)', fontSize: 14 }}>Loading…</div></Shell>

  const email = user?.email ?? ''
  const initials = email.split('@')[0].slice(0, 2).toUpperCase()
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

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
        <header className="sp-hero" style={{ display: 'flex', gap: 28, alignItems: 'center', padding: '8px 0 32px' }}>
          <div className="sp-ringwrap">
            <div style={{ position: 'relative', width: 116, height: 116 }}>
              <svg width="116" height="116" role="img" aria-label={`Profile ${pct}% complete`}
                style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                <circle cx="58" cy="58" r="54" fill="none" stroke="var(--track)" strokeWidth="4"/>
                <circle cx="58" cy="58" r="54" fill="none"
                  stroke={pct === 100 ? '#16a34a' : 'var(--ink)'} strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${pct / 100 * CIRC} ${CIRC}`}
                  style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(.22,1,.36,1)' }}/>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="sp-avatar">
                  {user?.profilePicUrl
                    ? <img src={user.profilePicUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials}
                </div>
              </div>
            </div>
            <button className="sp-edit" onClick={() => fileRef.current?.click()} disabled={uploadingPic}
              aria-label={user?.profilePicUrl ? 'Change profile photo' : 'Upload profile photo'}>
              {uploadingPic ? <span style={{ fontSize: 14 }}>◌</span> : <EditIcon />}
            </button>
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="sp-name" style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.03em', margin: 0, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName || email}
            </h1>
            {user?.displayName && (
              <div style={{ fontSize: 15, color: 'var(--g1)', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
              <span className="sp-pill">{cap(user?.plan ?? 'free')} plan</span>
              {user?.profilePicUrl && (
                <button className="sp-link" onClick={removePic} disabled={uploadingPic}>Remove photo</button>
              )}
            </div>
          </div>
        </header>

        {picErr && <div className="sp-alert">{picErr}</div>}

        {/* ── Finish setting up ── */}
        {!doneHidden && (
          <div className={`sp-done${doneOut ? ' out' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em', margin: 0 }}>Finish setting up</h2>
              <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.6 }}>{pct}% complete</span>
            </div>
            <div className="sp-bar"><span className="sp-bar-fill" style={{ width: `${pct}%` }} /></div>
            {[
              { id: 'pic', done: picDone, label: 'Add a profile photo', action: () => fileRef.current?.click() },
              { id: 'sec', done: secDone, label: 'Set a security question', action: () => setShowSecModal(true) },
            ].map(item => (
              <div key={item.id} className={`sp-item${item.done ? ' ok' : ''}`}>
                <span className="sp-dot"><CheckIcon /></span>
                <span className="sp-lbl">{item.label}</span>
                {!item.done && (
                  <button className="sp-btn sm inv" onClick={item.action}>Add</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Display name ── */}
        <section style={{ padding: '32px 0 8px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.01em', margin: 0 }}>Display name</h2>
          <p style={{ fontSize: 14, color: 'var(--g1)', margin: '4px 0 0', lineHeight: 1.5 }}>This is how your name appears across the app.</p>
          <form onSubmit={saveName} style={{ marginTop: 16 }}>
            <div className="sp-namerow" style={{ display: 'flex', gap: 10 }}>
              <input className="sp-input" value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder={email} maxLength={80} style={{ flex: 1 }} />
              <button type="submit" className="sp-btn"
                disabled={savingName || displayName.trim() === savedName.trim()}>
                {savingName ? 'Saving…' : 'Save changes'}
              </button>
            </div>
            {nameMsg && (
              <div style={{ minHeight: 22, marginTop: 10, fontSize: 13, fontWeight: 500 }}
                className={nameMsgShow ? 'sp-msg-show' : ''}>
                {nameMsg}
              </div>
            )}
          </form>
        </section>

        {/* ── Account ── */}
        <section style={{ padding: '24px 0 8px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.01em', margin: '0 0 12px' }}>Account</h2>
          {[
            { label: 'Email', value: email },
            { label: 'Plan', value: cap(user?.plan ?? 'free') },
            { label: 'Role', value: cap(user?.role ?? 'member') },
          ].map(r => (
            <div key={r.label} className="sp-row">
              <span style={{ fontSize: 14, color: 'var(--g1)' }}>{r.label}</span>
              <b style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.value}</b>
            </div>
          ))}
        </section>

        {/* ── Password recovery ── */}
        <section style={{ padding: '24px 0 8px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.01em', margin: 0 }}>Password recovery</h2>
          <p style={{ fontSize: 14, color: 'var(--g1)', margin: '4px 0 0', lineHeight: 1.5 }}>Your security question confirms it's you if you forget your password.</p>
          <div className={`sp-card${hasSecQ ? ' set' : ''}`}>
            <span className="sp-ico"><LockIcon /></span>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{hasSecQ ? 'Security question is set' : 'No security question'}</div>
              <div style={{ fontSize: 14, color: 'var(--g1)', marginTop: 2, overflowWrap: 'anywhere' }}>
                {hasSecQ ? secQ : "You won't be able to recover your password without one."}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {!hasSecQ && <button className="sp-btn sm" onClick={() => setShowSecModal(true)}>Set question</button>}
              {hasSecQ && !confirming && (
                <>
                  <button className="sp-btn sm ghost" onClick={() => setShowSecModal(true)}>Edit</button>
                  <button className="sp-btn sm ghost" onClick={() => setConfirming(true)}>Remove</button>
                </>
              )}
              {confirming && (
                <>
                  <button className="sp-btn sm" onClick={removeSecurity}>Yes, remove</button>
                  <button className="sp-btn sm ghost" onClick={() => setConfirming(false)}>Cancel</button>
                </>
              )}
            </div>
          </div>
          {confirming && (
            <p style={{ fontSize: 13, color: 'var(--g1)', marginTop: 10 }}>Removing it turns off password recovery for this account.</p>
          )}
        </section>
      </div>
    </Shell>
  )
}
