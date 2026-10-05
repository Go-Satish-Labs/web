/**
 * One place that decides what the user is told when something fails.
 *
 * Before this, messages came from whatever raised them: FastAPI detail
 * strings, or Firebase's raw codes - "Firebase: Error (auth/invalid-credential)"
 * is not something to put in front of someone. Two sign-in paths and a dozen
 * HTTP statuses each produced their own wording, and the app had no single
 * voice.
 *
 * The rules: say what happened in plain words, say what to do next, and never
 * expose a code, a status line, or an internal name. Confidence without
 * bluffing - "that email and password don't match" is a fact we know; "your
 * account has been compromised" is one we would be guessing at.
 */

/** Firebase Auth error code -> what we tell the user. */
const FIREBASE_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use':
    'An account with this email already exists. Try signing in instead.',
  'auth/invalid-email':
    "That doesn't look like a valid email address.",
  'auth/invalid-credential':
    "That email and password don't match. Check them and try again.",
  'auth/wrong-password':
    "That email and password don't match. Check them and try again.",
  'auth/user-not-found':
    "That email and password don't match. Check them and try again.",
  'auth/invalid-login-credentials':
    "That email and password don't match. Check them and try again.",
  'auth/weak-password':
    'That password is too weak. Use at least 6 characters.',
  'auth/too-many-requests':
    'Too many attempts. Wait a minute, then try again.',
  'auth/popup-closed-by-user':
    'The sign-in window closed before it finished. Try again.',
  'auth/popup-blocked':
    'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.',
  'auth/cancelled-popup-request':
    'The sign-in window closed before it finished. Try again.',
  'auth/network-request-failed':
    "We couldn't reach our servers. Check your connection and try again.",
  'auth/requires-recent-login':
    'For your security, sign in again before continuing.',
  'auth/user-disabled':
    'This account has been disabled. Contact support if that seems wrong.',
  'auth/operation-not-allowed':
    'That sign-in method is not available for this account.',
  'auth/too-many-requests-per-user':
    'Too many attempts from this device. Wait a little while, then try again.',
  'auth/unauthorized-domain':
    "This site isn't authorised for sign-in yet. If this is your deployment, add the domain in the Firebase console under Authentication → Settings → Authorised domains.",
}

/** Fallbacks by HTTP status, for when the server did not send a message. */
const STATUS_MESSAGES: Record<number, string> = {
  400: 'That request was not valid. Check the details and try again.',
  401: 'Please sign in to continue.',
  403: 'Your plan does not allow this. Upgrade to unlock it.',
  404: "We couldn't find that. It may have been deleted.",
  409: 'That already exists.',
  410: 'This is no longer available.',
  413: 'That file is too large. Try a smaller one.',
  415: "That file type isn't supported. Upload a CSV or Excel file.",
  422: 'Some of those details were not valid. Check them and try again.',
  429: 'Too many attempts. Wait a moment, then try again.',
  500: 'Something went wrong on our side. Try again in a moment.',
  502: 'Our servers did not respond. Try again in a moment.',
  503: 'This service is temporarily unavailable. Nothing was lost — try again shortly.',
}

/** True when a string is an internal message rather than something to show. */
function isUnfriendly(text: string): boolean {
  return (
    !text ||
    text.length > 300 ||
    /\b(traceback|exception|object at 0x|none|integrityerror|operationalerror)\b/i.test(text) ||
    /^(internal server error|not found|bad request|unauthorized|forbidden)$/i.test(text.trim()) ||
    /^HTTP \d/.test(text) ||
    /\[[A-Z_]+\]$/.test(text.trim())
  )
}

/**
 * Turns anything thrown - axios, Firebase, a plain Error - into one sentence a
 * user can act on.
 */
export function friendlyError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!err) return fallback

  // Firebase: the code lives in `code`, and `message` is "Firebase: Error (auth/...)"
  const code = (err as { code?: string })?.code
  if (typeof code === 'string' && FIREBASE_MESSAGES[code]) return FIREBASE_MESSAGES[code]

  // axios: a FastAPI detail, if the server sent a readable one
  const response = (err as { response?: { status?: number; data?: { detail?: unknown } } })?.response
  if (response) {
    const detail = response.data?.detail
    if (typeof detail === 'string' && !isUnfriendly(detail)) return detail
    if (Array.isArray(detail) && detail.length > 0) {
      // FastAPI validation errors: [{loc, msg, type}, ...]
      const first = detail[0] as { msg?: string; loc?: unknown[] }
      const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : undefined
      if (typeof first.msg === 'string') {
        const readable = first.msg.replace(/Value error, /, '')
        if (typeof field === 'string') {
          return `Check ${field}: ${readable.replace(/^[A-Z]/, c => c.toLowerCase())}.`
        }
        if (!isUnfriendly(readable)) return readable
      }
    }
    return STATUS_MESSAGES[response.status ?? 0] ?? fallback
  }

  // Network failure: nothing came back at all
  if (typeof code === 'string' && code.startsWith('auth/')) {
    return 'We could not sign you in right now. Please try again.'
  }
  const message = (err as { message?: string })?.message
  if (typeof message === 'string') {
    if (/network|failed to fetch|load failed|timeout/i.test(message)) {
      return "We couldn't reach our servers. Check your connection and try again."
    }
    if (/^(firebase: )?error \(/i.test(message) || /\bauth\//.test(message)) {
      // A Firebase code we do not have wording for. Say something honest
      // rather than printing the code.
      return 'We could not complete that just now. Please try again.'
    }
    const cleaned = message.replace(/^Firebase:\s*/, '').replace(/^Error:\s*/, '')
    if (!isUnfriendly(cleaned)) return cleaned
  }

  return fallback
}

export { STATUS_MESSAGES, FIREBASE_MESSAGES }