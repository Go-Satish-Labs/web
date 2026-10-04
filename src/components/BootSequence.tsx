import { useEffect, useRef } from 'react'
import {
  BLACK, T, WHITE,
  buildParticles, renderBootFrame, sampleWordmark,
  type Geometry, type Particle,
} from '../lib/bootRender'

/**
 * The ANALYTRIX boot sequence.
 *
 * All the drawing lives in lib/bootRender as a pure function of time; this
 * component only owns the canvas, the resize handling and the rAF loop, then
 * hands the renderer a clock.
 */
export default function BootSequence({ onDone, waiting }: { onDone: () => void; waiting: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const doneRef = useRef(onDone)
  // The skip affordance is in this component's markup while the timeline runs
  // in the effect, so the end callback is published through a ref.
  const finishRef = useRef<() => void>(() => {})
  // Read inside the rAF loop, so a change mid-run takes effect without
  // restarting the sequence.
  const waitingRef = useRef(waiting)
  waitingRef.current = waiting
  // Mirrors the sequence timeline so the handover can be scheduled on a timer
  // as well as by the animation loop.
  const elapsedRef = useRef(0)

  useEffect(() => { doneRef.current = onDone }, [onDone])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) { doneRef.current(); return }

    // Someone who has asked the OS for less motion gets the app, not eight
    // seconds of animation.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      doneRef.current()
      return
    }

    // ~1200 points over nine letters is what makes the wordmark read as
    // letters rather than a scatter; 300 left them unreadable. Still only
    // fillRects, so it holds 60fps.
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
      // If the wordmark could not be sampled (no canvas, blocked
      // getImageData) fall back to a ring of points so the scene still
      // completes rather than collapsing to nothing.
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
      // One pass always plays. While the API is unreachable a finished pass
      // simply begins again, so the sequence keeps going for as long as the
      // backend is cold. When the API answers, the clock is no longer reset -
      // the pass already in progress runs to its end, so the app is handed
      // over on the completed wordmark rather than cutting away part-way
      // through the formation.
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

  // The handover must not depend on requestAnimationFrame being scheduled.
  // Browsers throttle rAF to a crawl in a background tab and suspend it
  // entirely on some devices, so a user who switched tabs during the boot
  // could be left staring at a frozen sequence that never hands over - even
  // though the API answered. Once the API is up, a plain timer ends the pass
  // at the same moment the animation would have.
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
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: BLACK,
        // Deliberately not click-to-dismiss. Tapping anywhere while a boot
        // sequence is running meant a stray click dropped straight into the
        // login page; only the explicit SKIP control or Escape gets you out.
      }}
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
