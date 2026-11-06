import { useSyncExternalStore } from 'react'
import { DEFAULT_DARK_PALETTE, DEFAULT_LIGHT_PALETTE, type PfChartToken } from './defaultPalettes'

export interface PfChartTheme {
  background: string
  textColor: string
  fontSize: number
  axis: {
    ticks: { text: { fill: string } }
    legend: { text: { fill: string } }
  }
  grid: { line: { stroke: string; strokeWidth: number } }
  legends: { text: { fill: string } }
  tooltip: {
    container: {
      background: string
      border: string
      borderRadius: string
      color: string
      fontFamily: string
    }
  }
}

// shortcut: only hex and rgb() colors parse (hsl or named tokens fall back), widen when a theme needs them
// The same rules as plainfold-maps' pinColors: a fully transparent rgba() is "no color".
function parseRgb(v: string): [number, number, number] | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v)
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1]
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
  }
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/i.exec(v)
  return rgb && !/^0*\.?0*%?$/.test(rgb[4] ?? '1') ? [+rgb[1], +rgb[2], +rgb[3]] : null
}

// A transparent body shows the browser's white canvas, so it reads as light; any other unreadable background reads as dark.
function isLightPage(): boolean {
  const token = getComputedStyle(document.documentElement).getPropertyValue('--pf-bg-page').trim()
  const body = getComputedStyle(document.body).backgroundColor
  const rgb = parseRgb(token) ?? parseRgb(body)
  if (!rgb) return !token && isTransparent(body)
  return 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2] > 128
}

const isTransparent = (v: string) => v === '' || v === 'transparent' || /^rgba?\(.*[,/]\s*0*\.?0*%?\s*\)$/i.test(v) // alpha 0

export function readChartToken(name: PfChartToken): string {
  if (typeof window === 'undefined') return DEFAULT_DARK_PALETTE[name]
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (v && parseRgb(v)) return v
  return (isLightPage() ? DEFAULT_LIGHT_PALETTE : DEFAULT_DARK_PALETTE)[name]
}

function buildTheme(): PfChartTheme {
  const root = typeof window === 'undefined' ? null : getComputedStyle(document.documentElement)
  const get = (v: string, fallback: string) => root?.getPropertyValue(v).trim() || fallback
  const secondary = readChartToken('--pf-text-secondary')
  const border = readChartToken('--pf-border')
  return {
    background: 'transparent',
    textColor: secondary,
    fontSize: 12,
    axis: {
      ticks: { text: { fill: secondary } },
      legend: { text: { fill: secondary } },
    },
    grid: { line: { stroke: border, strokeWidth: 1 } },
    legends: { text: { fill: secondary } },
    tooltip: {
      container: {
        background: readChartToken('--pf-bg-surface'),
        border: `1px solid ${border}`,
        borderRadius: get('--pf-radius-sm', '6px'),
        color: readChartToken('--pf-text-primary'),
        fontFamily: get('--pf-font-ui', 'system-ui, sans-serif'),
      },
    },
  }
}

const TOKENS = Object.keys(DEFAULT_DARK_PALETTE) as PfChartToken[]
export type PfChartColors = Record<PfChartToken, string>

type Snapshot = { theme: PfChartTheme; colors: PfChartColors; key: string }

function read(): Snapshot {
  const colors = Object.fromEntries(TOKENS.map((t) => [t, readChartToken(t)])) as PfChartColors
  const theme = buildTheme()
  return { theme, colors, key: JSON.stringify([colors, theme]) }
}

// One observer for all hook users; a root mutation replaces the snapshot only when a color or style value changed.
let snap: Snapshot | null = null
let observer: MutationObserver | null = null
const listeners = new Set<() => void>()

function subscribe(cb: () => void): () => void {
  if (listeners.size === 0 && typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(() => {
      const next = read()
      if (snap && next.key === snap.key) return
      snap = next
      listeners.forEach((l) => l())
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class', 'data-theme'],
    })
  }
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
    if (listeners.size === 0) {
      observer?.disconnect()
      observer = null
      snap = null
    }
  }
}

const getSnapshot = () => (snap ??= read())

export function usePfChartTheme(): PfChartTheme {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot).theme
}

/** Every chart token resolved once per theme change (same object until a color changes), for marks drawn outside the nivo theme. */
export function usePfChartColors(): PfChartColors {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot).colors
}

/** The default series colors: theme tokens, never a d3 scheme. */
export const chartPalette = (c: PfChartColors): string[] => [c['--pf-accent'], c['--pf-positive'], c['--pf-warning'], c['--pf-danger'], c['--pf-text-secondary']]
