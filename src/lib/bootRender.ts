/**
 * The ANALYTRIX boot sequence, as a pure renderer.
 *
 * Kept separate from the React component, and written as a function of `t`
 * rather than something that integrates frame deltas, for two reasons:
 *
 * - It is deterministic. Every position is a direct evaluation of the
 *   timeline, so the sequence is identical on every run and can be scrubbed.
 * - It is verifiable. A headless browser throttles requestAnimationFrame to a
 *   handful of callbacks per second, which turns a time-based animation into
 *   a slideshow; driving `renderBootFrame` with explicit times renders any
 *   frame on demand.
 *
 * Strictly two colours, #000 and #fff. No shadow, blur, gradient or composite
 * operation is used anywhere - canvas applies those by default, so every call
 * here is a bare fill or stroke.
 */
export const BLACK = '#000000'
export const WHITE = '#ffffff'

/** Scene boundaries, in seconds. Total run is 8.0s. */
export const T = {
  hold0: 0.35,   // pure black
  s1: 0.75,      // initialisation: dot, sweeping ring
  s2: 2.30,      // data stream
  s3: 3.70,      // analytics engine: core, rings, system text
  s4: 5.10,      // organise into the wordmark
  s5: 6.30,      // final boot: wordmark, underline
  ready: 6.55,   // "ANALYTICS ENGINE READY" starts fading in
  holdEnd: 7.50, // final composition holds, then fades
  end: 8.00,     // fully black
}

export const ease = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export interface Particle {
  /** Stream position while data is flowing (scenes 1-3). */
  sx: number
  sy: number
  /** Target letterform point, used from scene 4. */
  tx: number
  ty: number
  /** Per-particle offset so the convergence is not one mechanical step. */
  delay: number
  /** Whether this particle is part of the wordmark. */
  letter: boolean
}

export interface Geometry {
  w: number
  h: number
  cx: number
  cy: number
  scale: number
}

/** The sampling canvas the wordmark is rasterised into. */
const WORD_W = 1400
const WORD_H = 300

/**
 * The on-screen box the wordmark is fitted into.
 *
 * The sampled points live in a 1400x300 box, so one scale factor cannot be
 * applied to both axes - doing that stretched the letters to roughly 900px
 * tall and pushed most of them outside the viewport. Fitting the width and
 * deriving the height from the source aspect keeps the wordmark in
 * proportion and on screen.
 */
export function wordmarkBox(geo: Geometry): { w: number; h: number } {
  const width = Math.min(geo.w * 0.72, 1000) * geo.scale
  return { w: width, h: width * (WORD_H / WORD_W) }
}

/**
 * Samples the filled pixels of a wordmark and returns evenly spaced points in
 * a 0..1 box, for the caller to scale onto its canvas.
 *
 * Tracking is applied by hand rather than through ctx.letterSpacing, which is
 * still unevenly supported and silently falls back to default spacing.
 */
export function sampleWordmark(text: string, max: number): { x: number; y: number }[] {
  const W = 1400
  const H = 300
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const g = canvas.getContext('2d')
  if (!g) return []

  g.fillStyle = WHITE
  g.textBaseline = 'middle'

  const size = 190
  g.font = `800 ${size}px Inter, system-ui, -apple-system, "Segoe UI", sans-serif`
  const track = size * 0.16
  const widths = [...text].map(ch => g.measureText(ch).width)
  const total = widths.reduce((a, b) => a + b, 0) + track * (text.length - 1)

  let x = (W - total) / 2
  for (let i = 0; i < text.length; i++) {
    g.fillText(text[i], x, H / 2)
    x += widths[i] + track
  }

  const { data } = g.getImageData(0, 0, W, H)
  const hits: { x: number; y: number }[] = []
  // A 4px grid: coarse enough to stay cheap, fine enough that ~1200 points
  // fill the letterforms solidly rather than hinting at them.
  const step = 4
  for (let py = 0; py < H; py += step) {
    for (let px = 0; px < W; px += step) {
      if (data[(py * W + px) * 4 + 3] > 128) hits.push({ x: px / W, y: py / H })
    }
  }
  if (hits.length <= max) return hits
  // Even stride keeps the letterforms evenly filled, rather than dense in
  // whichever part of the glyph the scan order happened to reach first.
  const out = []
  const stride = hits.length / max
  for (let i = 0; i < max; i++) out.push(hits[Math.floor(i * stride)])
  return out
}

/** Builds the particle field. Deterministic - no Math.random anywhere. */
export function buildParticles(count: number, wordPoints: { x: number; y: number }[], geo: Geometry): Particle[] {
  const box = wordmarkBox(geo)
  return Array.from({ length: count }, (_, i) => {
    // Golden-angle spiral: an even scatter without a random source.
    const a = (i * 2.399963) % (Math.PI * 2)
    const r = 0.55 + (((i * 37) % 100) / 100) * 0.5
    const t = wordPoints[i % wordPoints.length]
    return {
      sx: geo.cx + Math.cos(a) * Math.min(geo.w, geo.h) * r * 0.95,
      sy: geo.cy + Math.sin(a) * Math.min(geo.w, geo.h) * r * 0.62,
      tx: geo.cx + (t.x - 0.5) * box.w,
      ty: geo.cy + (t.y - 0.5) * box.h,
      delay: (((i * 53) % 100) / 100) * 0.45,
      // A fifth of the field is scenery and fades before the final frame, so
      // the last composition is the word and nothing else.
      letter: i % 5 !== 0,
    }
  })
}
/** Draws one frame at absolute time `t` (seconds since start). */
export function renderBootFrame(
  ctx: CanvasRenderingContext2D,
  t: number,
  geo: Geometry,
  particles: Particle[],
): void {
  const { w, h, cx, cy, scale } = geo

  ctx.fillStyle = BLACK
  ctx.fillRect(0, 0, w, h)

  /* ── Scene 5: fade to black, applied to everything at the end ── */
  const fadeOut = t > T.holdEnd ? clamp01((t - T.holdEnd) / (T.end - T.holdEnd)) : 0
  const alpha = 1 - fadeOut

  /* ── Scene 1: initialisation ── */
  // The centre dot is a sharp square, never a blurred blob. It leaves once
  // the data stream takes over, rather than sitting under the wordmark for
  // the rest of the sequence.
  const dotIn = ease(clamp01((t - T.hold0) / 0.3))
  const dotOut = 1 - clamp01((t - (T.s2 - 0.3)) / 0.3)
  if (dotIn > 0 && dotOut > 0) {
    ctx.globalAlpha = alpha * dotIn * dotOut
    ctx.fillStyle = WHITE
    const d = 5 * scale
    ctx.fillRect(cx - d / 2, cy - d / 2, d, d)
    ctx.globalAlpha = 1
  }

  // The ring completes itself with a single clean sweep, then is gone. The
  // previous fade bottomed out at a non-zero alpha, so a faint ring stayed on
  // screen behind the finished wordmark.
  const ringT = clamp01((t - (T.hold0 + 0.3)) / 0.95)
  const ringAlpha = ringT < 0.88 ? 1 : Math.max(0, 1 - (ringT - 0.88) / 0.12)
  if (ringT > 0 && ringT < 1 && ringAlpha > 0) {
    ctx.beginPath()
    ctx.strokeStyle = WHITE
    ctx.lineWidth = 1
    ctx.globalAlpha = alpha * ringAlpha
    ctx.arc(cx, cy, 96 * scale, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringT)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  const s1 = clamp01((t - T.s1) / 0.5)
  const streamT = ease(clamp01((t - T.s2) / 1.15))
  const s2Fade = clamp01((t - T.s2) / 0.3)
  const s3Fade = t > T.s3 && t < T.s3 + 1.6 ? 1 : 0
  const ringsFade = s3Fade * (1 - clamp01((t - (T.s3 + 1.0)) / 0.6))
  const formT = ease(clamp01((t - T.s4) / 1.05))
  const settle = clamp01((t - T.s5) / 0.35)

  /* ── Particles ── */
  ctx.fillStyle = WHITE
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]

    // Stream: start scattered, converge inward. The particles settle onto a
    // small disc rather than the exact centre, so scene 3 still has a visible
    // field around the core instead of a single stacked pixel.
    const conv = ease(clamp01((streamT - p.delay * 0.4) / 0.75))
    const standOff = 10 + (((i * 17) % 9) * 4.5)
    const ang = Math.atan2(p.sy - cy, p.sx - cx)
    const hx = cx + Math.cos(ang) * standOff * scale
    const hy = cy + Math.sin(ang) * standOff * scale
    const streamX = lerp(p.sx, hx, conv)
    const streamY = lerp(p.sy, hy, conv)
    const s1Conv = ease(clamp01((s1 - p.delay) / 0.7))
    const fromX = lerp(p.sx * 0.5, p.sx, s1Conv)
    const fromY = lerp(p.sy * 0.5, p.sy, s1Conv)
    const baseX = lerp(fromX, streamX, s2Fade)
    const baseY = lerp(fromY, streamY, s2Fade)

    const form = ease(clamp01((formT - p.delay * 0.5) / 0.6))
    const x = lerp(baseX, p.tx, form)
    const y = lerp(baseY, p.ty, form)

    // Arrival is staggered so the field builds up instead of appearing at once.
    const birth = clamp01((t - (T.s1 + p.delay * 0.5)) / 0.25)
    let a = alpha * birth
    if (t < T.s1) a *= s1Conv
    else if (t < T.s2) a *= lerp(s1Conv, 1, 0.5)
    else a *= s2Fade
    if (!p.letter) a *= 1 - clamp01((t - (T.s5 - 0.45)) / 0.45)
    else a *= lerp(0.35, 1, settle)
    if (a <= 0.01) continue

    ctx.globalAlpha = a
    // Slightly larger once settled, so the strokes close up into solid
    // letterforms.
    const s = p.letter ? lerp(1.0, 1.7, settle) : 1.15
    ctx.fillRect(x - s / 2, y - s / 2, s, s)
  }

  /* ── Scene 2/3: the data network ── */
  const linkT = clamp01((t - T.s2) / 0.5)
  const linksFade = linkT * (1 - clamp01((t - (T.s4 + 0.35)) / 0.55))
  if (linksFade > 0.01 && t < T.s5) {
    ctx.strokeStyle = WHITE
    ctx.lineWidth = 1
    ctx.globalAlpha = alpha * linksFade * 0.32
    ctx.beginPath()
    const reach = Math.min(w, h) * 0.42 * (0.35 + 0.65 * streamT)
    // "Several thin lines", not a starburst: linking every 9th point drew over
    // a hundred rays and buried the particles underneath them.
    for (let i = 0; i < particles.length; i += 34) {
      const p = particles[i]
      const conv = ease(clamp01((streamT - p.delay * 0.4) / 0.75))
      const standOff = 10 + (((i * 17) % 9) * 4.5)
      const ang = Math.atan2(p.sy - cy, p.sx - cx)
      const hx = cx + Math.cos(ang) * standOff * scale
      const hy = cy + Math.sin(ang) * standOff * scale
      const x = lerp(p.sx, hx, conv)
      const y = lerp(p.sy, hy, conv)
      if (Math.hypot(x - cx, y - cy) > reach) continue
      ctx.moveTo(x, y)
      ctx.lineTo(hx, hy)
    }
    // Lateral links, but only between points that have actually converged near
    // each other. Without the distance test these joined a particle still far
    // out to one already at the core, drawing long chords across the field.
    const maxLink = Math.min(w, h) * 0.14
    for (let i = 0; i < particles.length; i += 53) {
      const a1 = particles[i]
      const a2 = particles[(i + 7) % particles.length]
      const c1 = ease(clamp01((streamT - a1.delay * 0.4) / 0.75))
      const c2 = ease(clamp01((streamT - a2.delay * 0.4) / 0.75))
      const x1 = lerp(a1.sx, cx, c1)
      const y1 = lerp(a1.sy, cy, c1)
      const x2 = lerp(a2.sx, cx, c2)
      const y2 = lerp(a2.sy, cy, c2)
      if (Math.hypot(x1 - x2, y1 - y2) > maxLink) continue
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
    }
    ctx.stroke()
  }

  /* ── Scene 3: the core and its rings ── */
  if (ringsFade > 0.01) {
    ctx.globalAlpha = alpha * ringsFade
    ctx.fillStyle = WHITE
    const coreR = 5 * scale
    ctx.fillRect(cx - coreR, cy - coreR, coreR * 2, coreR * 2)

    ctx.strokeStyle = WHITE
    ctx.lineWidth = 1
    const radii = [64, 96, 132, 172]
    // Each ring turns at its own constant, slow, angular velocity.
    for (let k = 0; k < radii.length; k++) {
      const rot = (t - T.s3) * (0.22 + k * 0.13) * (k % 2 ? -1 : 1)
      const start = rot
      ctx.beginPath()
      ctx.arc(cx, cy, radii[k] * scale, start, start + Math.PI * 2 * 0.7)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  /* ── Scene 3: system text, each shown briefly then removed cleanly ── */
  const box = wordmarkBox(geo)
  if (s3Fade) {
    const labels = [
      { text: 'INITIALIZING', at: T.s3 },
      { text: 'DATA ENGINE', at: T.s3 + 0.42 },
      { text: 'ANALYTICS CORE', at: T.s3 + 0.86 },
    ]
    ctx.fillStyle = WHITE
    ctx.font = '300 12px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const l of labels) {
      const local = (t - l.at) / 0.4
      if (local < 0 || local > 1) continue
      const la = local < 0.18 ? local / 0.18 : 1 - (local - 0.72) / 0.28
      ctx.globalAlpha = alpha * Math.max(0, la) * 0.85
      ctx.fillText(l.text, cx, cy + box.h / 2 + 210 * scale)
    }
    ctx.globalAlpha = 1
  }

  /* ── Scene 5: underline sweep and ready text ── */
  if (t >= T.s5) {
    // Both sit clear of the wordmark rather than at a fixed offset, so they
    // cannot land on top of the letters at any viewport size.
    const underlineY = cy + box.h / 2 + 30 * scale
    const readyY = underlineY + 28 * scale
    const sweep = clamp01((t - (T.s5 + 0.1)) / 0.5)
    if (sweep > 0 && sweep < 1.01) {
      const halfW = (box.w / 2) * sweep
      ctx.globalAlpha = alpha
      ctx.strokeStyle = WHITE
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx - halfW, underlineY)
      ctx.lineTo(cx + halfW, underlineY)
      ctx.stroke()
    }

    const ready = clamp01((t - T.ready) / 0.3)
    if (ready > 0) {
      ctx.globalAlpha = alpha * ready * 0.9
      ctx.fillStyle = WHITE
      ctx.font = '300 11px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('ANALYTICS ENGINE READY', cx, readyY)
    }
    ctx.globalAlpha = 1
  }
}
