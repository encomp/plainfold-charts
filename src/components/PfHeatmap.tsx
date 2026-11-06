import { ResponsiveHeatMap } from '@nivo/heatmap'
import { usePfChartColors, usePfChartTheme } from '../usePfChartTheme'

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

  const colors = usePfChartColors()
  const heatColorMin = colors['--pf-heat-none']
  const heatColorMax = colors['--pf-heat-high']

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
