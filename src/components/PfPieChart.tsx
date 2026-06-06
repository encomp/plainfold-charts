import { ResponsivePie } from '@nivo/pie'
import { usePfChartTheme } from '../usePfChartTheme'

export interface PfPieChartProps {
  data: { id: string; label?: string; value: number; [key: string]: unknown }[]
  labelField?: string
  valueField?: string
  donut?: boolean
  height?: number
  colors?: string[]
  'aria-label'?: string
}

export function PfPieChart({
  data,
  donut = false,
  height = 300,
  colors,
  'aria-label': ariaLabel,
}: PfPieChartProps) {
  const theme = usePfChartTheme()

  return (
    <div style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsivePie
        data={data}
        innerRadius={donut ? 0.5 : 0}
        theme={theme}
        colors={colors ?? { scheme: 'category10' }}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        padAngle={1}
        cornerRadius={4}
        animate={true}
      />
    </div>
  )
}
