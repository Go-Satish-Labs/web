/** The animated Analytrix mark used consistently across the application. */
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
      src="/analytrix-loader.svg"
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