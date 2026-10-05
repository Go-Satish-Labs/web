import { useEffect, useState } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import { friendlyError } from '../lib/errors'

/**
 * The gate between "signed up" and "can use the product".
 *
 * Shown while Firebase says the address is unverified. Firebase has already
 * emailed the link; all this does is explain where to look, let them resend
 * it, and notice when they have clicked it. Polls gently rather than making
 * them reload, because following an email link on a phone usually lands them
 * back on this page with no idea what to press.
 */
export default function VerifyEmailGate({ email }: { email: string }) {
  const { resendVerificationEmail, refreshVerificationStatus } = useAuth()
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [checking, setChecking] = useState(false)

  // Firebase's cached token keeps saying unverified after the link is
  // clicked, so each poll forces a refresh rather than re-reading local state.
  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      try {
        const done = await refreshVerificationStatus()
        if (done && !cancelled) setMessage('Verified — taking you in…')
      } catch {
        // Offline; the next tick tries again.
      }
    }
    const id = window.setInterval(() => { void tick() }, 5000)
    return () => { cancelled = true; window.clearInterval(id) }
  }, [refreshVerificationStatus])

  async function resend() {
    setState('sending'); setMessage('')
    try {
      await resendVerificationEmail()
      setState('sent')
      setMessage('Sent again. It can take a minute to arrive — check spam too.')
    } catch (error) {
      setState('error')
      setMessage(friendlyError(error, 'We could not send that email. Try again in a moment.'))
    }
  }

  async function checkNow() {
    setChecking(true); setMessage('')
    try {
      const done = await refreshVerificationStatus()
      if (!done) setMessage('Not yet. Open the link in your email, then press this again.')
    } catch (error) {
      setMessage(friendlyError(error))
    } finally {
      setChecking(false)
    }
  }

  return (
    <div style={{
      borderRadius: 16, padding: '32px 28px', background: '#fff',
      border: '1.5px solid var(--border)', textAlign: 'center',
      maxWidth: 440, margin: '0 auto',
    }}>
      <div
        aria-hidden
        style={{
          width: 52, height: 52, borderRadius: '50%', margin: '0 auto 18px',
          background: 'var(--brand-tint)', color: 'var(--brand-deep)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}
      >
        ✉
      </div>

      <div style={{ fontSize: 18, fontWeight: 800, color: '#0a0a0a', marginBottom: 8 }}>
        Check your inbox
      </div>
      <p style={{ fontSize: 14, color: '#6b6b6b', lineHeight: 1.65, margin: '0 0 4px' }}>
        We sent a verification link to
      </p>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a', margin: '0 0 18px', wordBreak: 'break-all' }}>
        {email}
      </p>
      <p style={{ fontSize: 13, color: '#6b6b6b', lineHeight: 1.65, margin: '0 0 20px' }}>
        Click it to confirm the address, then come back here. This keeps
        accounts tied to a real inbox and stops anyone signing up as someone else.
      </p>

      {message && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16,
          background: state === 'error' ? '#fef2f2' : 'var(--brand-tint)',
          color: state === 'error' ? '#dc2626' : 'var(--brand-deep)',
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={checkNow} disabled={checking}
          style={{
            padding: '11px 20px', borderRadius: 10, border: 'none', cursor: checking ? 'wait' : 'pointer',
            background: '#0a0a0a', color: '#fff', fontSize: 13, fontWeight: 700, opacity: checking ? 0.6 : 1,
          }}>
          {checking ? 'Checking…' : "I've verified it"}
        </button>
        <button onClick={resend} disabled={state === 'sending'}
          style={{
            padding: '11px 20px', borderRadius: 10, cursor: state === 'sending' ? 'wait' : 'pointer',
            background: '#fff', border: '1.5px solid #e8e8e8', color: '#0a0a0a',
            fontSize: 13, fontWeight: 600, opacity: state === 'sending' ? 0.6 : 1,
          }}>
          {state === 'sending' ? 'Sending…' : 'Resend email'}
        </button>
      </div>

      <p style={{ fontSize: 11, color: '#a8a8a8', marginTop: 18, lineHeight: 1.6 }}>
        This page checks on its own every few seconds.
      </p>
    </div>
  )
}