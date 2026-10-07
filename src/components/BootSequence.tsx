import { useEffect, useRef } from 'react'
import {
  BLACK, T, WHITE,
  buildParticles, renderBootFrame, sampleWordmark,
  type Geometry, type Particle,
} from '../lib/bootRender'

/** The original full-screen boot sequence shown before authentication. */
export default function BootSequence({ onDone, waiting }: { onDone: () => void; waiting: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const doneRef = useRef(onDone)
  const finishRef = useRef<() => void>(() => {})
  const waitingRef = useRef(waiting)
  const elapsedRef = useRef(0)

  useEffect(() => { doneRef.current = onDone }, [onDone])
  useEffect(() => { waitingRef.current = waiting }, [waiting])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) { doneRef.current(); return }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      doneRef.current()
      return
    }

    const COUNT = 1200
    let geo: Geometry = { w: 0, h: 0, cx: 0, cy: 0, scale: 1 }
    let particles: Particle[] = []

    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      geo = {
        w: window.innerWidth,
        h: window.innerHeight,
        cx: window.innerWidth / 2,
        cy: window.innerHeight / 2,
        scale: Math.min(1.4, Math.max(0.85, window.innerWidth / 1440)),
      }
      canvas.width = Math.floor(geo.w * dpr)
      canvas.height = Math.floor(geo.h * dpr)
      canvas.style.width = `${geo.w}px`
      canvas.style.height = `${geo.h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const points = sampleWordmark('ANALYTRIX', COUNT)
      const wordPoints = points.length >= 40
        ? points
        : Array.from({ length: COUNT }, (_, i) => ({
            x: 0.5 + 0.34 * Math.cos((i / COUNT) * Math.PI * 2),
            y: 0.5 + 0.16 * Math.sin((i / COUNT) * Math.PI * 2),
          }))
      particles = buildParticles(COUNT, wordPoints, geo)
    }

    layout()
    window.addEventListener('resize', layout)
    let raf = 0
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', layout)
      doneRef.current()
    }
    finishRef.current = finish

    const CYCLE = (T.end + 0.6) * 1000
    let origin = performance.now()
    const draw = (now: number) => {
      if (waitingRef.current) {
        if (now - origin >= CYCLE) origin = now
        elapsedRef.current = (now - origin) / 1000
        renderBootFrame(ctx, elapsedRef.current, geo, particles)
      } else {
        elapsedRef.current = (now - origin) / 1000
        if (elapsedRef.current >= T.end) { finish(); return }
        renderBootFrame(ctx, elapsedRef.current, geo, particles)
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', layout)
    }
  }, [])

  useEffect(() => {
    if (waiting) return
    const remaining = Math.max(0, T.end * 1000 - elapsedRef.current * 1000)
    const id = window.setTimeout(() => finishRef.current(), remaining)
    return () => window.clearTimeout(id)
  }, [waiting])

  return (
    <div
      role="status"
      aria-label="Analytrix is starting up"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: BLACK }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      {waiting && (
        <div
          aria-live="polite"
          style={{
            position: 'absolute', left: 0, right: 0, bottom: 58,
            textAlign: 'center', color: WHITE, opacity: 0.45,
            fontSize: 10, letterSpacing: '0.2em', fontWeight: 300,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          CONNECTING TO THE ANALYTICS ENGINE…
        </div>
      )}
      <button
        onClick={() => finishRef.current()}
        style={{
          position: 'absolute', right: 20, bottom: 18,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: WHITE, opacity: 0.35, fontSize: 10,
          letterSpacing: '0.16em', fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 300, padding: 8,
        }}
      >
        SKIP
      </button>
    </div>
  )
}
