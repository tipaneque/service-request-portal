import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { ColorModeContext } from './colorMode'
import { createPortalTheme, type ColorMode } from './theme'

const STORAGE_KEY = 'srp.color-mode'

/** Remembered choice first, then the operating system preference. */
function readInitialMode(): ColorMode {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Private browsing can refuse storage; the OS preference still applies.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Owns the active colour mode and hands the matching liquid-glass theme to the
 * tree. The choice is remembered across visits and mirrored onto
 * `document.documentElement` so the plain-CSS aurora backdrop can follow it.
 */
export function PortalThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorMode>(readInitialMode)

  const toggleColorMode = useCallback(() => {
    setMode((current) => {
      const next = current === 'light' ? 'dark' : 'light'
      try {
        window.localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // Not being able to remember the choice is not worth failing over.
      }
      return next
    })
  }, [])

  useEffect(() => {
    document.documentElement.dataset.mode = mode
  }, [mode])

  const theme = useMemo(() => createPortalTheme(mode), [mode])
  const contextValue = useMemo(() => ({ mode, toggleColorMode }), [mode, toggleColorMode])

  return (
    <ColorModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}
