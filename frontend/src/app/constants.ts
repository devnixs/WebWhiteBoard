import type { ColorChoice, FontChoice, ShapeChoice, SizeChoice } from './types'

export const identityStorageKey = 'wwb.identity'
export const boardHistoryStorageKey = 'wwb.board-history'
export const boardIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const colorPalette = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899', '#84cc16']
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
export const colorChoices: ColorChoice[] = ['blue', 'green', 'orange', 'red', 'violet', 'black']
export const sizeChoices: SizeChoice[] = ['s', 'm', 'l', 'xl']
export const fontChoices: FontChoice[] = ['draw', 'sans', 'serif', 'mono']
export const shapeChoices: Array<{ id: ShapeChoice; label: string }> = [
  { id: 'rectangle', label: 'Square' },
  { id: 'ellipse', label: 'Circle' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'star', label: 'Star' },
]
export const isMacPlatform = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
export const loginPalette = [...colorPalette]

export const colorToHex: Record<ColorChoice, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  orange: '#f59e0b',
  red: '#ef4444',
  violet: '#a855f7',
  black: '#1f2430',
}

export const sizeToPixels: Record<SizeChoice, number> = {
  s: 2,
  m: 4,
  l: 8,
  xl: 12,
}

export const fontFamilyLabels: Record<FontChoice, string> = {
  draw: 'Draw',
  sans: 'Sans',
  serif: 'Serif',
  mono: 'Mono',
}

export const fontPixelSizes: Record<SizeChoice, number> = {
  s: 14,
  m: 18,
  l: 24,
  xl: 32,
}
