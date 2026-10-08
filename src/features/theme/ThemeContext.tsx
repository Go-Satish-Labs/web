import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export const themes = [
  { id: 'honey', label: 'Honey', swatches: ['#f59e0b', '#fff7ed', '#1c1917'] },
  { id: 'ocean', label: 'Ocean', swatches: ['#0ea5e9', '#f0f9ff', '#0c4a6e'] },
  { id: 'forest', label: 'Forest', swatches: ['#16a34a', '#f0fdf4', '#14532d'] },
  { id: 'violet', label: 'Violet', swatches: ['#8b5cf6', '#f5f3ff', '#4c1d95'] },
  { id: 'rose', label: 'Rose', swatches: ['#e11d48', '#fff1f2', '#881337'] },
  { id: 'mono', label: 'Mono', swatches: ['#111827', '#f3f4f6', '#111827'] },
] as const

export type ThemeId = (typeof themes)[number]['id']

interface ThemeContextValue {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
  customColor: string | null
  setCustomColor: (color: string | null) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const saved = window.localStorage.getItem('analytrix:theme') as ThemeId | null
    return themes.some(item => item.id === saved) ? saved! : 'mono'
  })
  const [customColor, setCustomColorState] = useState<string | null>(() => window.localStorage.getItem('analytrix:custom-color'))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('analytrix:theme', theme)
    if (customColor) {
      document.documentElement.style.setProperty('--bg', `color-mix(in srgb, ${customColor} 6%, white)`)
      document.documentElement.style.setProperty('--bg-white', `color-mix(in srgb, ${customColor} 2%, white)`)
      document.documentElement.style.setProperty('--bg-subtle', `color-mix(in srgb, ${customColor} 10%, white)`)
      document.documentElement.style.setProperty('--border', `color-mix(in srgb, ${customColor} 22%, #e0e0e0)`)
      document.documentElement.style.setProperty('--border-strong', `color-mix(in srgb, ${customColor} 38%, #bdbdbd)`)
      document.documentElement.style.setProperty('--text', `color-mix(in srgb, ${customColor} 18%, #0a0a0a)`)
      document.documentElement.style.setProperty('--text-muted', `color-mix(in srgb, ${customColor} 38%, #525252)`)
      document.documentElement.style.setProperty('--text-subtle', `color-mix(in srgb, ${customColor} 24%, #a3a3a3)`)
      document.documentElement.style.setProperty('--accent', customColor)
      document.documentElement.style.setProperty('--brand', customColor)
      document.documentElement.style.setProperty('--brand-gold', customColor)
      document.documentElement.style.setProperty('--brand-deep', `color-mix(in srgb, ${customColor} 78%, black)`)
      document.documentElement.style.setProperty('--accent-light', `color-mix(in srgb, ${customColor} 10%, white)`)
      document.documentElement.style.setProperty('--brand-tint', `color-mix(in srgb, ${customColor} 8%, white)`)
      document.documentElement.style.setProperty('--brand-tint-2', `color-mix(in srgb, ${customColor} 16%, white)`)
      document.documentElement.style.setProperty('--accent-glow', `color-mix(in srgb, ${customColor} 18%, transparent)`)
      document.documentElement.style.setProperty('--good', `color-mix(in srgb, ${customColor} 70%, #15803d)`)
      document.documentElement.style.setProperty('--good-light', `color-mix(in srgb, ${customColor} 8%, white)`)
      document.documentElement.style.setProperty('--warn', `color-mix(in srgb, ${customColor} 65%, #b45309)`)
      document.documentElement.style.setProperty('--warn-light', `color-mix(in srgb, ${customColor} 8%, white)`)
    } else {
      for (const property of ['--bg', '--bg-white', '--bg-subtle', '--border', '--border-strong', '--text', '--text-muted', '--text-subtle', '--accent', '--brand', '--brand-gold', '--brand-deep', '--accent-light', '--brand-tint', '--brand-tint-2', '--accent-glow', '--good', '--good-light', '--warn', '--warn-light']) {
        document.documentElement.style.removeProperty(property)
      }
    }
  }, [theme, customColor])

  const value = useMemo(() => ({
    theme,
    setTheme: (next: ThemeId) => {
      setThemeState(next)
      if (next !== 'mono') {
        setCustomColorState(null)
        window.localStorage.removeItem('analytrix:custom-color')
      }
    },
    customColor,
    setCustomColor: (color: string | null) => {
      setCustomColorState(color)
      if (color) {
        window.localStorage.setItem('analytrix:custom-color', color)
      } else {
        window.localStorage.removeItem('analytrix:custom-color')
      }
    },
  }), [theme, customColor])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
