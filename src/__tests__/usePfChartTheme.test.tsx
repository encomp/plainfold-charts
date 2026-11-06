import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { renderHook, act } from '@testing-library/react'
import { usePfChartTheme, readChartToken } from '../usePfChartTheme'
import { DEFAULT_DARK_PALETTE, DEFAULT_LIGHT_PALETTE } from '../defaultPalettes'

const root = document.documentElement

afterEach(() => {
  root.removeAttribute('style')
  root.removeAttribute('class')
  root.removeAttribute('data-theme')
})

describe('usePfChartTheme', () => {
  it('returns a chart theme object', () => {
    const { result } = renderHook(() => usePfChartTheme())
    expect(result.current.background).toBe('transparent')
    expect(result.current.fontSize).toBe(12)
    expect(result.current.tooltip.container).toBeDefined()
  })

  it('returns stable reference', () => {
    const { result, rerender } = renderHook(() => usePfChartTheme())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })

  it('re-reads the tokens when the root style changes', async () => {
    root.style.setProperty('--pf-border', '#abcdef')
    const { result } = renderHook(() => usePfChartTheme())
    expect(result.current.grid.line.stroke).toBe('#abcdef')
    await act(async () => {
      root.style.setProperty('--pf-border', '#123456')
    })
    expect(result.current.grid.line.stroke).toBe('#123456')
  })

  it('draws ticks and axis titles in the secondary text token', () => {
    root.style.setProperty('--pf-text-secondary', '#654321')
    const { result } = renderHook(() => usePfChartTheme())
    expect(result.current.axis.ticks.text.fill).toBe('#654321')
    expect(result.current.axis.legend.text.fill).toBe('#654321')
  })

  it('also reacts to data-theme and class changes', async () => {
    const { result } = renderHook(() => usePfChartTheme())
    const sheet = document.createElement('style')
    sheet.textContent =
      '[data-theme="x"]{--pf-border:#111111}.y{--pf-border:#222222}'
    document.head.appendChild(sheet)
    await act(async () => root.setAttribute('data-theme', 'x'))
    expect(result.current.grid.line.stroke).toBe('#111111')
    await act(async () => root.setAttribute('class', 'y'))
    expect(result.current.grid.line.stroke).toBe('#222222')
    sheet.remove()
  })

  it('two hooks share one observer', () => {
    const Real = MutationObserver
    const ctor = vi.fn(function (this: MutationObserver, cb: MutationCallback) {
      return new Real(cb)
    })
    vi.stubGlobal('MutationObserver', ctor)
    renderHook(() => usePfChartTheme())
    renderHook(() => usePfChartTheme())
    expect(ctor).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it('disconnects on unmount', () => {
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect')
    const { unmount } = renderHook(() => usePfChartTheme())
    unmount()
    expect(disconnect).toHaveBeenCalled()
    disconnect.mockRestore()
  })
})

describe('readChartToken', () => {
  it('falls back to the dark default when the page background is dark', () => {
    root.style.setProperty('--pf-bg-page', '#101010')
    expect(readChartToken('--pf-border')).toBe(DEFAULT_DARK_PALETTE['--pf-border'])
  })

  it('falls back to the light default when the page background is light', () => {
    root.style.setProperty('--pf-bg-page', '#fafafa')
    expect(readChartToken('--pf-border')).toBe(DEFAULT_LIGHT_PALETTE['--pf-border'])
  })

  it('falls back the same way for an unparsable value', () => {
    root.style.setProperty('--pf-bg-page', 'rgb(250, 250, 250)')
    root.style.setProperty('--pf-border', 'not-a-color')
    expect(readChartToken('--pf-border')).toBe(DEFAULT_LIGHT_PALETTE['--pf-border'])
  })

  it('returns a set token as is', () => {
    root.style.setProperty('--pf-border', '#123456')
    expect(readChartToken('--pf-border')).toBe('#123456')
  })
})

describe('source', () => {
  it('has no slate literal', () => {
    const src = ['../usePfChartTheme.ts', '../defaultPalettes.ts']
      .map((f) => readFileSync(new URL(f, import.meta.url), 'utf8'))
      .join('\n')
      .toLowerCase()
    for (const c of ['#1e293b', '#94a3b8', '#475569', '#070d1a', '#f1f5f9', '#3b82f6', '#0f172a', '#ef4444']) {
      expect(src).not.toContain(c)
    }
  })
})
