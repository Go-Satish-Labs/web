/**
 * The Analytrix mark: a ribbon loop rendered with a gold-to-teal gradient.
 *
 * Sourced from the logo-* PNGs, which are the actual brand artwork. The
 * favicon.svg in public/ is a purple bolt that matches none of the other
 * brand assets - it was being used here by mistake and read as the Vite logo.
 *
 * A <picture> with srcset lets the browser choose a resolution to match the
 * rendered size: a 22px footer mark should not download a 169KB PNG, and a
 * 64px PNG scaled up to 128px would be visibly soft.
 *
 * Always pass an `alt` when the logo carries meaning on its own. Left empty
 * (the default) the image is hidden from assistive tech, which is correct for
 * a mark sitting beside a text wordmark.
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