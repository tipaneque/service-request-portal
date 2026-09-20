import { createContext, useContext } from 'react'
import type { ColorMode } from './theme'

export interface ColorModeContextValue {
  mode: ColorMode
  toggleColorMode: () => void
}

/**
 * Split from the provider so the hook can be imported by any component
 * without dragging the theme factory into that module's fast-refresh graph.
 */
export const ColorModeContext = createContext<ColorModeContextValue>({
  mode: 'light',
  toggleColorMode: () => {},
})

export function useColorMode(): ColorModeContextValue {
  return useContext(ColorModeContext)
}
