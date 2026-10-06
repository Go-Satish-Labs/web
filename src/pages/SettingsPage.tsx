import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Shell from '../components/Shell'
import { useAuth } from '../features/auth/AuthContext'
import { api } from '../lib/api'
import { friendlyError } from '../lib/errors'

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const [securityQuestion, setSecurityQuestion] = useState('')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [hasSecurityQuestion, setHasSecurityQuestion] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [revealAnswer, setRevealAnswer] = useState(false)
  const [editing, setEditing] = useState(false)

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
      setEditing(false)
      setRevealAnswer(false)
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
      setEditing(false)
      setMessage('Security question removed.')
      await refreshUser()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Shell><div>Loading…</div></Shell>

  const profileComplete = hasSecurityQuestion
  const completionPercent = profileComplete ? 100 : 0

  return (
    <Shell>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Profile</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>Manage your profile and security settings.</p>
      </div>

      {/* Profile completion banner */}
      {!profileComplete && (
        <div style={{
          padding: '16px 20px', borderRadius: 12, marginBottom: 24,
          background: 'var(--bg-subtle)', border: '1.5px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--text)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, flexShrink: 0,
          }}>
            !
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              Profile incomplete
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Add a security question to enable password recovery. This is required to use the forgot password feature.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: 'var(--text)', color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            Complete now
          </button>
        </div>
      )}

      {/* Profile completion progress */}
      <div style={{
        background: 'var(--bg-white)', border: '1.5px solid var(--border)', borderRadius: 14,
        padding: '20px 24px', marginBottom: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Profile completion</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{completionPercent}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${completionPercent}%`,
            background: 'var(--text)', borderRadius: 4,
            transition: 'width 0.3s ease',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <span style={{
              width: 16, height: 16, borderRadius: '50%',
              background: 'var(--text)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700,
            }}>✓</span>
            Email verified
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: hasSecurityQuestion ? 'var(--text-muted)' : 'var(--text)' }}>
            <span style={{
              width: 16, height: 16, borderRadius: '50%',
              background: hasSecurityQuestion ? 'var(--text)' : 'var(--bg-subtle)',
              border: hasSecurityQuestion ? 'none' : '1.5px solid var(--border-strong)',
              color: hasSecurityQuestion ? '#fff' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700,
            }}>
              {hasSecurityQuestion ? '✓' : '!'}
            </span>
            Security question
          </div>
        </div>
      </div>

      {/* Security question section */}
      <div style={{ background: 'var(--bg-white)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '24px', maxWidth: 560 }}>
        {message && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--bg-subtle)', color: 'var(--text)', marginBottom: 16, fontSize: 13, border: '1px solid var(--border)' }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--bad-light)', color: 'var(--bad)', marginBottom: 16, fontSize: 13, border: '1px solid var(--bad)' }}>
            {error}
          </div>
        )}

        {hasSecurityQuestion && !editing ? (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>SECURITY QUESTION</label>
              <div style={{
                padding: '12px 16px', borderRadius: 10,
                background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                fontSize: 14, color: 'var(--text)', fontWeight: 500,
              }}>
                {securityQuestion}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>YOUR ANSWER</label>
              <div style={{
                padding: '12px 16px', borderRadius: 10,
                background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                fontSize: 14, color: 'var(--text)', fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {revealAnswer ? securityAnswer : '••••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setRevealAnswer(!revealAnswer)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 8px',
                    textDecoration: 'underline', flexShrink: 0,
                  }}
                >
                  {revealAnswer ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setEditing(true)}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: 'var(--text)', color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={removeSecurityQuestion}
                disabled={saving}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: '1.5px solid var(--bad)',
                  background: 'var(--bg-white)', color: 'var(--bad)', fontSize: 13, fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 8 }}>
              {hasSecurityQuestion ? 'Update your security question and answer.' : 'Add a security question to enable password recovery if you forget your password. This works alongside your email verification.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>SECURITY QUESTION</label>
              <input
                type="text"
                required
                value={securityQuestion}
                onChange={e => setSecurityQuestion(e.target.value)}
                placeholder="e.g., What was your first pet's name?"
                style={{
                  width: '100%', padding: '11px 13px', fontSize: 14,
                  background: 'var(--bg-subtle)', border: '1.5px solid var(--border)',
                  borderRadius: 10, color: 'var(--text)', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>YOUR ANSWER</label>
              <input
                type="text"
                required
                value={securityAnswer}
                onChange={e => setSecurityAnswer(e.target.value)}
                placeholder="Your answer (case-insensitive)"
                style={{
                  width: '100%', padding: '11px 13px', fontSize: 14,
                  background: 'var(--bg-subtle)', border: '1.5px solid var(--border)',
                  borderRadius: 10, color: 'var(--text)', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                  fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  background: saving ? 'var(--border-strong)' : 'var(--text)', color: '#ffffff',
                  transition: 'all 0.18s ease', minWidth: 140,
                }}
              >
                {saving ? 'Saving…' : 'Save security question'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => { setEditing(false); setSecurityQuestion(''); setSecurityAnswer(''); }}
                  style={{
                    padding: '12px 20px', borderRadius: 10, border: '1.5px solid var(--border)',
                    background: 'var(--bg-white)', color: 'var(--text)', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Account info */}
      <div style={{ background: 'var(--bg-white)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '24px', maxWidth: 560, marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 16px' }}>Account Information</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Email</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{user?.email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Plan</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{user?.plan}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Role</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{user?.role}</span>
          </div>
        </div>
      </div>
    </Shell>
  )
}