import { useEffect, useRef, useState } from 'react'
import { themes, useTheme } from '../features/theme/ThemeContext'

export default function ThemeSelector() {
  const { theme, setTheme, customColor, setCustomColor } = useTheme()
  const [open, setOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const [selectedColor, setSelectedColor] = useState(customColor ?? '#111827')
  const [markerPosition, setMarkerPosition] = useState({ left: 50, top: 50 })
  const active = themes.find(item => item.id === theme) ?? themes[5]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const size = 360
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const image = ctx.createImageData(size, size)
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const dx = x - size / 2
        const dy = y - size / 2
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance > size / 2) continue
        const hue = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360
        const saturation = distance / (size / 2)
        const c = saturation
        const part = hue / 60
        const xValue = c * (1 - Math.abs((part % 2) - 1))
        const [r, g, b] = hue < 60 ? [c, xValue, 0] : hue < 120 ? [xValue, c, 0] : hue < 180 ? [0, c, xValue] : hue < 240 ? [0, xValue, c] : hue < 300 ? [xValue, 0, c] : [c, 0, xValue]
        const index = (y * size + x) * 4
        image.data[index] = Math.round(r * 255)
        image.data[index + 1] = Math.round(g * 255)
        image.data[index + 2] = Math.round(b * 255)
        image.data[index + 3] = 255
      }
    }
    ctx.putImageData(image, 0, 0)
  }, [open])

  const selectColor = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) * canvas.width / rect.width
    const y = (event.clientY - rect.top) * canvas.height / rect.height
    const distance = Math.hypot(x - canvas.width / 2, y - canvas.height / 2)
    if (distance > canvas.width / 2) return
    const pixel = canvas.getContext('2d')?.getImageData(Math.floor(x), Math.floor(y), 1, 1).data
    if (!pixel) return
    const color = `#${[pixel[0], pixel[1], pixel[2]].map(value => value.toString(16).padStart(2, '0')).join('')}`
    setSelectedColor(color)
    setMarkerPosition({ left: x / canvas.width * 100, top: y / canvas.height * 100 })
    setTheme('mono')
    setCustomColor(color)
  }

  return (
    <div className="theme-picker">
      <button
        className="theme-picker-trigger"
        type="button"
        aria-label={`Color theme: ${active.label}`}
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        <span className="theme-wheel theme-wheel-small" style={{ '--theme-a': customColor ?? active.swatches[0], '--theme-b': active.swatches[2] } as React.CSSProperties} />
        <span className="theme-trigger-label">{customColor ?? active.label}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div ref={pickerRef} className="theme-honeycomb" role="menu" aria-label="Choose color theme">
          <div className="theme-honeycomb-title">Choose your color</div>
          <div className="color-wheel-wrap">
            <canvas ref={canvasRef} className="color-wheel-canvas" width={360} height={360} onPointerDown={selectColor} onPointerMove={event => event.buttons === 1 && selectColor(event)} />
            <span className="color-wheel-marker" style={{ left: `${markerPosition.left}%`, top: `${markerPosition.top}%`, background: selectedColor }} />
          </div>
          <div className="color-wheel-value">
            <span className="color-wheel-preview" style={{ background: selectedColor }} />
            <strong>{selectedColor.toUpperCase()}</strong>
          </div>
          <div className="theme-honeycomb-title theme-presets-title">Quick presets</div>
          <div className="theme-options">
            {themes.map(item => (
              <button
                key={item.id}
                type="button"
                role="menuitemradio"
                aria-checked={theme === item.id}
                className={`theme-option${theme === item.id ? ' selected' : ''}`}
                onClick={() => { setTheme(item.id); setOpen(false) }}
                title={item.label}
              >
                <span className="theme-wheel" style={{ '--theme-a': item.swatches[0], '--theme-b': item.swatches[2] } as React.CSSProperties}>
                  <span className="theme-wheel-center" style={{ background: item.swatches[1] }} />
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
