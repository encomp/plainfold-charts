import { describe, it, expect } from 'vitest'

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
