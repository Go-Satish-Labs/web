import { useEffect, useRef } from 'react'

const CYCLE_MS = 6500

/**
 * Displays the compact animated brand mark while the application is starting.
 *
 * The loader keeps looping while the API is unavailable. Once the API answers,
 * the current animation cycle finishes before the application is revealed.
 */
export default function CompactBootSequence({
  onDone,
  waiting,
}: {
  onDone: () => void
  waiting: boolean
}) {
  const doneRef = useRef(onDone)
  const startedAtRef = useRef<number | null>(null)
  const finishRef = useRef<() => void>(() => {})

  useEffect(() => {
    doneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      doneRef.current()
      return
    }

    if (startedAtRef.current === null) startedAtRef.current = performance.now()
    const startedAt = startedAtRef.current

    let finished = false
    let timer: number | undefined

    const finish = () => {
      if (finished) return
      finished = true
      if (timer !== undefined) window.clearTimeout(timer)
      doneRef.current()
    }
    finishRef.current = finish

    if (!waiting) {
      const elapsed = performance.now() - startedAt
      const remaining = CYCLE_MS - (elapsed % CYCLE_MS)
      timer = window.setTimeout(finish, remaining)
    }

    return () => {
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [waiting])

  return (
    <div
      role="status"
      aria-label="Analytrix is starting up"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(8, 8, 8, 0.34)',
        backdropFilter: 'blur(12px) saturate(0.8)',
        WebkitBackdropFilter: 'blur(12px) saturate(0.8)',
      }}
    >
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 'min(180px, 42vw)',
          aspectRatio: '1.27',
          borderRadius: 22,
          background: '#000',
          boxShadow: '0 18px 60px rgba(0, 0, 0, 0.32)',
        }}
      >
        <img
          src="/analytrix-loader.svg"
          alt=""
          width={180}
          height={142}
          style={{ display: 'block', width: '100%', height: 'auto' }}
          decoding="async"
        />
      </div>
      <button
        onClick={() => finishRef.current()}
        aria-label="Skip startup animation"
        style={{
          position: 'absolute',
          right: 20,
          bottom: 18,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#fff',
          opacity: 0.35,
          fontSize: 10,
          letterSpacing: '0.16em',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 300,
          padding: 8,
        }}
      >
        SKIP
      </button>
    </div>
  )
}
