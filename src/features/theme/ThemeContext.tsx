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
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const saved = window.localStorage.getItem('analytrix:theme') as ThemeId | null
    return themes.some(item => item.id === saved) ? saved! : 'honey'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('analytrix:theme', theme)
  }, [theme])

  const value = useMemo(() => ({
    theme,
    setTheme: (next: ThemeId) => setThemeState(next),
  }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
