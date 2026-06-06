import { ResponsiveBar, type BarDatum } from '@nivo/bar'
import { usePfChartTheme } from '../usePfChartTheme'

export interface PfBarChartProps {
  data: BarDatum[]
  xField: string
  yField: string | string[]
  orientation?: 'vertical' | 'horizontal'
  stacked?: boolean
  height?: number
  colors?: string[]
  'aria-label'?: string
}

export function PfBarChart({
  data,
  xField,
  yField,
  orientation = 'vertical',
  stacked = false,
  height = 300,
  colors,
  'aria-label': ariaLabel,
}: PfBarChartProps) {
  const theme = usePfChartTheme()
  const keys = Array.isArray(yField) ? yField : [yField]

  return (
    <div style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveBar
        data={data}
        keys={keys}
        indexBy={xField}
        layout={orientation === 'horizontal' ? 'horizontal' : 'vertical'}
        groupMode={stacked ? 'stacked' : 'grouped'}
        theme={theme}
        colors={colors ?? { scheme: 'category10' }}
        margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
        padding={0.3}
        borderRadius={4}
        axisBottom={{ tickRotation: 0 }}
        animate={true}
      />
    </div>
  )
}
