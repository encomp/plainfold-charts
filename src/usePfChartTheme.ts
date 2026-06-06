import { useMemo } from 'react'

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

export function usePfChartTheme(): PfChartTheme {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return getDefaultTheme()
    }
    const style = getComputedStyle(document.documentElement)
    const get = (v: string) => style.getPropertyValue(v).trim()

    return {
      background: 'transparent',
      textColor: get('--pf-text-secondary') || '#94a3b8',
      fontSize: 12,
      axis: {
        ticks: { text: { fill: get('--pf-text-muted') || '#475569' } },
        legend: { text: { fill: get('--pf-text-secondary') || '#94a3b8' } },
      },
      grid: {
        line: { stroke: get('--pf-border') || '#1e293b', strokeWidth: 1 },
      },
      legends: { text: { fill: get('--pf-text-secondary') || '#94a3b8' } },
      tooltip: {
        container: {
          background: get('--pf-bg-surface') || '#070d1a',
          border: `1px solid ${get('--pf-border') || '#1e293b'}`,
          borderRadius: get('--pf-radius-sm') || '6px',
          color: get('--pf-text-primary') || '#f1f5f9',
          fontFamily: get('--pf-font-ui') || 'system-ui, sans-serif',
        },
      },
    }
  }, [])
}

function getDefaultTheme(): PfChartTheme {
  return {
    background: 'transparent',
    textColor: '#94a3b8',
    fontSize: 12,
    axis: {
      ticks: { text: { fill: '#475569' } },
      legend: { text: { fill: '#94a3b8' } },
    },
    grid: { line: { stroke: '#1e293b', strokeWidth: 1 } },
    legends: { text: { fill: '#94a3b8' } },
    tooltip: {
      container: {
        background: '#070d1a',
        border: '1px solid #1e293b',
        borderRadius: '6px',
        color: '#f1f5f9',
        fontFamily: 'system-ui, sans-serif',
      },
    },
  }
}
