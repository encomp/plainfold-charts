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
function parseRgb(v: string): [number, number, number] | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v)
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1]
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
  }
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(v)
  return rgb ? [+rgb[1], +rgb[2], +rgb[3]] : null
}

function isLightPage(): boolean {
  const root = getComputedStyle(document.documentElement)
  const bg = root.getPropertyValue('--pf-bg-page').trim()
  const rgb = parseRgb(bg) ?? parseRgb(getComputedStyle(document.body).backgroundColor)
  return !!rgb && 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2] > 128
}

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
      ticks: { text: { fill: readChartToken('--pf-text-muted') } },
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

// One observer for all hook users; the cached theme is rebuilt after each root mutation.
let theme: PfChartTheme | null = null
let observer: MutationObserver | null = null
const listeners = new Set<() => void>()

function subscribe(cb: () => void): () => void {
  if (listeners.size === 0 && typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(() => {
      theme = null
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
      theme = null
    }
  }
}

const getSnapshot = () => (theme ??= buildTheme())

export function usePfChartTheme(): PfChartTheme {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
