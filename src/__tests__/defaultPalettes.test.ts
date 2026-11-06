import { describe, it, expect } from 'vitest'
import { DEFAULT_DARK_PALETTE, DEFAULT_LIGHT_PALETTE } from '../defaultPalettes'

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('default palettes', () => {
  it.each([
    ['dark', DEFAULT_DARK_PALETTE],
    ['light', DEFAULT_LIGHT_PALETTE],
  ])('%s palette passes 4.5:1 for text on surface', (_n, p) => {
    for (const t of ['--pf-text-primary', '--pf-text-secondary', '--pf-text-muted'] as const) {
      expect(ratio(p[t], p['--pf-bg-surface'])).toBeGreaterThanOrEqual(4.5)
    }
  })
})
