import { describe, it, expect, vi } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, act } from '@testing-library/react'

const colors = vi.hoisted(() => [] as string[][])
vi.mock('@nivo/heatmap', () => ({
  ResponsiveHeatMap: (p: { colors: { colors: string[] } }) => {
    colors.push(p.colors.colors)
    return null
  },
}))

describe('chart components', () => {
  it('PfBarChart exports correctly', async () => {
    const { PfBarChart } = await import('../components/PfBarChart')
    expect(typeof PfBarChart).toBe('function')
  })

  it('PfLineChart exports correctly', async () => {
    const { PfLineChart } = await import('../components/PfLineChart')
    expect(typeof PfLineChart).toBe('function')
  })

  it('PfPieChart exports correctly', async () => {
    const { PfPieChart } = await import('../components/PfPieChart')
    expect(typeof PfPieChart).toBe('function')
  })

  it('PfHeatmap exports correctly', async () => {
    const { PfHeatmap } = await import('../components/PfHeatmap')
    expect(typeof PfHeatmap).toBe('function')
  })
})

describe('theme colors', () => {
  it('PfHeatmap cells use heat-none to heat-high and repaint on a theme change', async () => {
    const { PfHeatmap } = await import('../components/PfHeatmap')
    const root = document.documentElement
    root.style.setProperty('--pf-heat-none', '#010203')
    root.style.setProperty('--pf-heat-high', '#040506')
    render(<PfHeatmap data={[]} />)
    expect(colors.at(-1)).toEqual(['#010203', '#040506'])
    await act(async () => {
      root.style.setProperty('--pf-heat-none', '#0a0b0c')
    })
    expect(colors.at(-1)).toEqual(['#0a0b0c', '#040506'])
    root.removeAttribute('style')
  })

  it('no chart source contains a color literal outside defaultPalettes.ts', () => {
    const dir = join(__dirname, '../components')
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.tsx'))) {
      expect(readFileSync(join(dir, f), 'utf8'), f).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/)
    }
  })
})
