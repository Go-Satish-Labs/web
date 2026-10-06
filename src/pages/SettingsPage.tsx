import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Shell from '../components/Shell'
import { useAuth } from '../features/auth/AuthContext'
import { api } from '../lib/api'
import { friendlyError } from '../lib/errors'

export default function SettingsPage() {
  const { refreshUser } = useAuth()
  const [securityQuestion, setSecurityQuestion] = useState('')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [hasSecurityQuestion, setHasSecurityQuestion] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    try {
      const { data } = await api.get('/auth/me')
      if (data.security_question) {
        setSecurityQuestion(data.security_question)
        setHasSecurityQuestion(true)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(''); setMessage(''); setSaving(true)
    try {
      await api.patch('/auth/me', { security_question: securityQuestion, security_answer: securityAnswer })
      setMessage('Security question saved. You can now use it to recover your password.')
      setHasSecurityQuestion(true)
      await refreshUser()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  async function removeSecurityQuestion() {
    if (!window.confirm('Remove your security question? You will not be able to use password recovery without it.')) return
    setError(''); setMessage(''); setSaving(true)
    try {
      await api.patch('/auth/me', { security_question: '', security_answer: '' })
      setSecurityQuestion('')
      setSecurityAnswer('')
      setHasSecurityQuestion(false)
      setMessage('Security question removed.')
      await refreshUser()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Shell><div>Loading…</div></Shell>

  return (
    <Shell>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a0a0a', margin: 0, letterSpacing: '-0.02em' }}>Security Settings</h1>
        <p style={{ fontSize: 14, color: '#6b6b6b', marginTop: 6 }}>Manage your security question for password recovery.</p>
      </div>

      <div style={{ background: '#ffffff', border: '1.5px solid var(--border)', borderRadius: 14, padding: '24px', maxWidth: 560 }}>
        {message && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: '#f0fdf4', color: '#166534', marginBottom: 16, fontSize: 13 }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        {hasSecurityQuestion ? (
          <>
            <p style={{ fontSize: 13, color: '#6b6b6b', marginBottom: 16 }}>
              Your current security question: <strong>{securityQuestion}</strong>
            </p>
            <button
              type="button"
              onClick={removeSecurityQuestion}
              disabled={saving}
              style={{
                padding: '10px 16px', borderRadius: 8, border: '1.5px solid #fecaca',
                background: '#fff', color: '#dc2626', fontSize: 13, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Removing…' : 'Remove security question'}
            </button>
          </>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: '#6b6b6b', lineHeight: 1.6, marginBottom: 8 }}>
              Add a security question to enable password recovery if you forget your password.
              This works alongside your email verification.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6b6b6b', letterSpacing: '0.5px' }}>SECURITY QUESTION</label>
              <input
                type="text"
                required
                value={securityQuestion}
                onChange={e => setSecurityQuestion(e.target.value)}
                placeholder="e.g., What was your first pet's name?"
                style={{
                  width: '100%', padding: '11px 13px', fontSize: 14,
                  background: '#f9f9f9', border: '1.5px solid #e8e8e8',
                  borderRadius: 10, color: '#0a0a0a', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6b6b6b', letterSpacing: '0.5px' }}>YOUR ANSWER</label>
              <input
                type="text"
                required
                value={securityAnswer}
                onChange={e => setSecurityAnswer(e.target.value)}
                placeholder="Your answer (case-insensitive)"
                style={{
                  width: '100%', padding: '11px 13px', fontSize: 14,
                  background: '#f9f9f9', border: '1.5px solid #e8e8e8',
                  borderRadius: 10, color: '#0a0a0a', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                background: saving ? '#d0d0d0' : '#0a0a0a', color: '#ffffff',
                transition: 'all 0.18s ease',
              }}
            >
              {saving ? 'Saving…' : 'Save security question'}
            </button>
          </form>
        )}
      </div>
    </Shell>
  )
}