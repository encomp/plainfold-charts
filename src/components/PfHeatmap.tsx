import { ResponsiveHeatMap } from '@nivo/heatmap'
import { usePfChartTheme } from '../usePfChartTheme'

export interface PfHeatmapData {
  id: string
  data: { x: string; y: number | null }[]
}

export interface PfHeatmapProps {
  data: PfHeatmapData[]
  height?: number
  'aria-label'?: string
}

export function PfHeatmap({
  data,
  height = 300,
  'aria-label': ariaLabel,
}: PfHeatmapProps) {
  const theme = usePfChartTheme()

  const style = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null
  const heatColorMin = style?.getPropertyValue('--pf-heat-none').trim() || '#0f172a'
  const heatColorMax = style?.getPropertyValue('--pf-heat-high').trim() || '#ef4444'

  return (
    <div style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveHeatMap
        data={data}
        theme={theme}
        colors={{ type: 'sequential', colors: [heatColorMin, heatColorMax] }}
        margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
        animate={true}
      />
    </div>
  )
}
