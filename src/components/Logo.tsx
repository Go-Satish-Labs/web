/**
 * The Analytrix mark.
 *
 * Uses /favicon.svg: it is ~9KB, scales cleanly to any size, and keeps the
 * gradients and blur the raster exports flatten. The 64/192/512 PNGs and the
 * .ico exist for the favicon set and the web manifest, not for in-page use -
 * a 22px footer mark rendered from logo-192.png would be a 38KB download, and
 * logo-64.png upscaled to a 512px hero would be a blur.
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
    <img
      src="/favicon.svg"
      width={size}
      height={size}
      alt={alt ?? ''}
      aria-hidden={alt ? undefined : true}
      className={className}
      style={{ objectFit: 'contain', flexShrink: 0, ...style }}
      decoding="async"
    />
  )
}
