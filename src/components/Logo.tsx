/**
 * The Analytrix mark.
 *
 * Uses a <picture> with srcset rather than choosing a file in JS: the browser
 * already knows the rendered width and device pixel ratio, and guessing at it
 * here is how you end up shipping a 64px PNG scaled up to a blurry 512px blob
 * or a 165KB PNG into a 24px header.
 *
 * The SVG is offered first because it carries the gradients and blur filters
 * the raster exports flatten; the WebP is the modern-raster fallback, with PNG
 * for anything older.
 *
 * Always pass an `alt` when the logo carries meaning on its own. Left empty
 * (the default) the image is hidden from assistive tech, which is correct for
 * a decorative mark sitting beside a text wordmark.
 */
export default function Logo({
  size = 28,
  alt,
  className,
  style,
}: {
  size?: number
  alt?: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <picture>
      <source srcSet="/favicon.svg" type="image/svg+xml" />
      <source srcSet="/logo-512.webp" type="image/webp" />
      <img
        src="/logo-192.png"
        srcSet="/logo-64.png 64w, /logo-192.png 192w, /logo-512.png 512w"
        sizes={`${size}px`}
        width={size}
        height={size}
        alt={alt ?? ''}
        aria-hidden={alt ? undefined : true}
        className={className}
        style={{ objectFit: 'contain', flexShrink: 0, ...style }}
        decoding="async"
      />
    </picture>
  )
}
