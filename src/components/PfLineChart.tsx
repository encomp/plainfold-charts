import { ResponsiveLine } from '@nivo/line'
import { usePfChartTheme } from '../usePfChartTheme'

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

  return (
    <div style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveLine
        data={series}
        curve={curved ? 'monotoneX' : 'linear'}
        theme={theme}
        colors={colors ?? { scheme: 'category10' }}
        margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
        enablePoints={true}
        pointSize={6}
        useMesh={true}
        animate={true}
      />
    </div>
  )
}
