import { ResponsiveLine } from '@nivo/line'
import { chartPalette, usePfChartColors, usePfChartTheme } from '../usePfChartTheme'

export interface PfLineChartSeries {
  id: string
  data: { x: string | number; y: number }[]
}

export interface PfLineChartProps {
  series: PfLineChartSeries[]
  curved?: boolean
  height?: number
  colors?: string[]
  'aria-label'?: string
}

export function PfLineChart({
  series,
  curved = true,
  height = 300,
  colors,
  'aria-label': ariaLabel,
}: PfLineChartProps) {
  const theme = usePfChartTheme()
  const palette = usePfChartColors()

  return (
    <div style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveLine
        data={series}
        curve={curved ? 'monotoneX' : 'linear'}
        theme={theme}
        colors={colors ?? chartPalette(palette)}
        margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
        enablePoints={true}
        pointSize={6}
        useMesh={true}
        animate={true}
      />
    </div>
  )
}
