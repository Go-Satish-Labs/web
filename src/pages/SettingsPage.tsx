import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Shell from '../components/Shell'
import { useAuth } from '../features/auth/AuthContext'
import { api } from '../lib/api'
import { friendlyError } from '../lib/errors'

const card: React.CSSProperties = {
  background: '#fff',
  border: '1.5px solid var(--border)',
  borderRadius: 16,
  padding: '28px 28px',
  marginBottom: 20,
}

const label: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.08em', color: 'var(--text-muted)',
  display: 'block', marginBottom: 7,
}

const input: React.CSSProperties = {
  width: '100%', padding: '11px 14px', fontSize: 14,
  background: 'var(--bg-subtle)', border: '1.5px solid var(--border)',
  borderRadius: 10, color: 'var(--text)', outline: 'none',
  boxSizing: 'border-box',
}

const btn: React.CSSProperties = {
  padding: '11px 24px', borderRadius: 10, border: 'none',
  background: 'var(--text)', color: '#fff',
  fontSize: 13, fontWeight: 700, cursor: 'pointer',
}

/* ── Avatar ── */
function Avatar({ url, name, size = 80 }: { url?: string | null; name: string; size?: number }) {
  const initials = name.split('@')[0].slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#0a0a0a', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.3, fontWeight: 800, overflow: 'hidden', flexShrink: 0,
      border: '3px solid var(--border)',
    }}>
      {url
        ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials}
    </div>
  )
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()

  /* profile */
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState('')

  /* avatar */
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingPic, setUploadingPic] = useState(false)
  const [picErr, setPicErr] = useState('')

  /* security */
  const [secQ, setSecQ] = useState('')
  const [secA, setSecA] = useState('')
  const [hasSecQ, setHasSecQ] = useState(false)
  const [editingSec, setEditingSec] = useState(false)
  const [savingSec, setSavingSec] = useState(false)
  const [secMsg, setSecMsg] = useState('')
  const [secErr, setSecErr] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      if (data.security_question) { setSecQ(data.security_question); setHasSecQ(true) }
      if (data.display_name) setDisplayName(data.display_name)
    }).finally(() => setLoading(false))
  }, [])

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
      await api.post('/auth/me/profile-pic', bytes, {
        headers: { 'Content-Type': file.type },
      })
      await refreshUser()
    } catch (err) {
      setPicErr(friendlyError(err))
    } finally {
      setUploadingPic(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function removePic() {
    setUploadingPic(true)
    try { await api.delete('/auth/me/profile-pic'); await refreshUser() }
    finally { setUploadingPic(false) }
  }

  async function saveSecurity(e: FormEvent) {
    e.preventDefault()
    setSecErr(''); setSecMsg(''); setSavingSec(true)
    try {
      await api.patch('/auth/me', { security_question: secQ, security_answer: secA })
      setHasSecQ(true); setEditingSec(false); setSecA('')
      setSecMsg('Security question saved.')
      await refreshUser()
      setTimeout(() => setSecMsg(''), 3000)
    } catch (err) { setSecErr(friendlyError(err)) }
    finally { setSavingSec(false) }
  }

  async function removeSecurity() {
    if (!window.confirm('Remove your security question? Password recovery will be unavailable.')) return
    setSavingSec(true)
    try {
      await api.patch('/auth/me', { security_question: '', security_answer: '' })
      setSecQ(''); setSecA(''); setHasSecQ(false); setEditingSec(false)
      await refreshUser()
    } finally { setSavingSec(false) }
  }

  if (loading) return <Shell><div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div></Shell>

  const emailUsername = user?.email ?? ''
  const joinedDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <Shell>
      <div style={{ maxWidth: 620 }}>

        {/* ── Profile hero card ── */}
        <div style={{ ...card, padding: '32px 28px' }}>
          {/* Avatar row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginBottom: 24 }}>
            <div style={{ position: 'relative' }}>
              <Avatar url={user?.profilePicUrl} name={emailUsername} size={88} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingPic}
                title="Change photo"
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#0a0a0a', border: '2px solid #fff',
                  color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13,
                }}
              >
                {uploadingPic ? '…' : '✎'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickFile} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.displayName || emailUsername}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {emailUsername}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#f3f3f3', color: '#6b6b6b', textTransform: 'capitalize' }}>
                  {user?.plan ?? 'free'}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#f3f3f3', color: '#6b6b6b' }}>
                  Member since {joinedDate}
                </span>
              </div>
            </div>
          </div>

          {picErr && (
            <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 8 }}>{picErr}</div>
          )}
          {user?.profilePicUrl && (
            <button onClick={removePic} disabled={uploadingPic}
              style={{ fontSize: 12, color: '#6b6b6b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginBottom: 20, padding: 0 }}>
              Remove photo
            </button>
          )}
          <div style={{ fontSize: 11, color: '#a8a8a8', marginBottom: 20 }}>
            JPG, PNG or WebP · max 2 MB
          </div>

          {/* Display name */}
          <form onSubmit={saveName}>
            <label style={label}>Display name</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                style={{ ...input, flex: 1 }}
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={emailUsername.split('@')[0]}
                maxLength={80}
              />
              <button type="submit" disabled={savingName} style={{ ...btn, padding: '11px 20px', flexShrink: 0 }}>
                {savingName ? 'Saving…' : 'Save'}
              </button>
            </div>
            {nameMsg && <div style={{ fontSize: 12, color: '#16a34a', marginTop: 8 }}>{nameMsg}</div>}
          </form>
        </div>

        {/* ── Account info ── */}
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Account</div>
          {[
            { label: 'Email', value: emailUsername },
            { label: 'Plan', value: (user?.plan ?? 'free').charAt(0).toUpperCase() + (user?.plan ?? 'free').slice(1) },
            { label: 'Role', value: (user?.role ?? 'member').charAt(0).toUpperCase() + (user?.role ?? 'member').slice(1) },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* ── Security question ── */}
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Security question</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
            Used to verify your identity during password recovery.
          </div>

          {secMsg && <div style={{ fontSize: 13, color: '#16a34a', marginBottom: 14, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid rgba(22,163,74,0.2)' }}>{secMsg}</div>}
          {secErr && <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 14, padding: '10px 14px', background: '#fef2f2', borderRadius: 8 }}>{secErr}</div>}

          {hasSecQ && !editingSec ? (
            <>
              <div style={{ marginBottom: 14 }}>
                <span style={label}>Question</span>
                <div style={{ padding: '11px 14px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1.5px solid var(--border)', fontSize: 14, color: 'var(--text)' }}>
                  {secQ}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <span style={label}>Answer</span>
                <div style={{ padding: '11px 14px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1.5px solid var(--border)', fontSize: 14, color: 'var(--text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{showAnswer ? secA || '(hidden)' : '••••••••'}</span>
                  <button onClick={() => setShowAnswer(v => !v)} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}>
                    {showAnswer ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setEditingSec(true)} style={btn}>Edit</button>
                <button onClick={removeSecurity} disabled={savingSec}
                  style={{ ...btn, background: '#fff', color: '#dc2626', border: '1.5px solid #dc2626' }}>
                  Remove
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={saveSecurity} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={label}>Question <span style={{ color: '#dc2626' }}>*</span></label>
                <input style={input} required value={secQ} onChange={e => setSecQ(e.target.value)}
                  placeholder="e.g. What was your first pet's name?" />
              </div>
              <div>
                <label style={label}>Answer <span style={{ color: '#dc2626' }}>*</span></label>
                <input style={input} required value={secA} onChange={e => setSecA(e.target.value)}
                  placeholder="Your answer (case-insensitive)" />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={savingSec} style={{ ...btn, flex: 1 }}>
                  {savingSec ? 'Saving…' : 'Save'}
                </button>
                {editingSec && (
                  <button type="button" onClick={() => setEditingSec(false)}
                    style={{ ...btn, background: '#fff', color: 'var(--text)', border: '1.5px solid var(--border)' }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

      </div>
    </Shell>
  )
}
