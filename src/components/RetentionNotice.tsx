import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

interface Notice {
  retention_hours: number
  window: string
  headline: string
  message: string
  short: string
}

const DISMISS_KEY = 'analytrix.retention-dismissed-at'
// Re-show once a week rather than never, so a long-lived install still
// eventually surfaces a changed policy.
const RESHOW_AFTER_MS = 7 * 24 * 60 * 60 * 1000

function dismissedRecently(): boolean {
  try {
    const at = localStorage.getItem(DISMISS_KEY)
    if (!at) return false
    return Date.now() - Number(at) < RESHOW_AFTER_MS
  } catch {
    return false
  }
}

/**
 * Short privacy notice shown on the datasets page.
 *
 * The copy is fetched from /privacy/retention rather than hardcoded, so the
 * window shown here is the same number the server actually deletes on. If the
 * copy is hardcoded in the frontend it will quietly disagree with the
 * retention setting the first time that setting is changed.
 */
export default function RetentionNotice() {
  const [notice, setNotice] = useState<Notice | null>(null)
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    setHidden(dismissedRecently())
    let cancelled = false
    api.get<Notice>('/privacy/retention')
      .then(({ data }) => { if (!cancelled) setNotice(data) })
      .catch(() => { /* the banner is informational; never block the page */ })
    return () => { cancelled = true }
  }, [])

  function dismiss() {
    setHidden(true)
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* private mode */ }
  }

  if (hidden || !notice) return null

  return (
    <div
      role="status"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '12px 16px', borderRadius: 12, marginBottom: 16,
        background: '#f0fdf4', border: '1.5px solid rgba(22,163,74,0.2)',
      }}
    >
      <span style={{ fontSize: 15, lineHeight: 1.4 }} aria-hidden>🔒</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>
          {notice.headline}
        </div>
        <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.6, marginTop: 2 }}>
          {notice.message}
        </div>
      </div>
      <button onClick={dismiss} aria-label="Dismiss privacy notice"
        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#15803d', fontSize: 16, lineHeight: 1, padding: 2 }}>
        ✕
      </button>
    </div>
  )
}

/**
 * Per-row countdown, e.g. "deleted in 21h".
 *
 * Clicking it opens a short popover rather than leaving the tag inert: the
 * tag is the one place a user is looking at a number this app produced, so
 * that is where the "check it before you rely on it" caveat belongs. The
 * popover is one short sentence by request - a paragraph here is the kind of
 * text people skip, and skipped text protects nobody.
 */
export function RetentionTag({ hours }: { hours?: number | null }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (hours === null || hours === undefined) return null
  const text = hours < 1
    ? 'deleting soon'
    : hours < 48
      ? `deleted in ${Math.round(hours)}h`
      : `deleted in ${Math.round(hours / 24)}d`

  return (
    <span ref={wrapRef} className="retention-wrap">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        aria-expanded={open}
        aria-label={`${text}. Tap for a note about AI results`}
        className="retention-tag"
      >
        {text}
      </button>
      {open && (
        <span className="retention-pop" role="status">
          AI can make mistakes — check important numbers.
        </span>
      )}
    </span>
  )
}
