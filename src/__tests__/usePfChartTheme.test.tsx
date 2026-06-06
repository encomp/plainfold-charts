import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePfChartTheme } from '../usePfChartTheme'

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
})
