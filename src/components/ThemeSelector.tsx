import { useState } from 'react'
import { themes, useTheme } from '../features/theme/ThemeContext'

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const active = themes.find(item => item.id === theme) ?? themes[0]

  return (
    <div className="theme-picker">
      <button
        className="theme-picker-trigger"
        type="button"
        aria-label={`Color theme: ${active.label}`}
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        <span className="theme-wheel theme-wheel-small" style={{ '--theme-a': active.swatches[0], '--theme-b': active.swatches[2] } as React.CSSProperties} />
        <span className="theme-trigger-label">{active.label}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="theme-honeycomb" role="menu" aria-label="Choose color theme">
          <div className="theme-honeycomb-title">Color scheme</div>
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
