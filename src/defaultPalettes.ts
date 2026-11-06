export type PfChartToken =
  | '--pf-bg-surface'
  | '--pf-border'
  | '--pf-text-primary'
  | '--pf-text-secondary'
  | '--pf-text-muted'
  | '--pf-positive'
  | '--pf-warning'
  | '--pf-danger'
  | '--pf-accent'
  | '--pf-heat-none'
  | '--pf-heat-low'
  | '--pf-heat-mid'
  | '--pf-heat-high'

export const DEFAULT_DARK_PALETTE: Record<PfChartToken, string> = {
  '--pf-bg-surface': '#1a1d23',
  '--pf-border': '#343a46',
  '--pf-text-primary': '#f3f4f6',
  '--pf-text-secondary': '#b4bac5',
  '--pf-text-muted': '#9aa1ae',
  '--pf-positive': '#4ade80',
  '--pf-warning': '#fbbf24',
  '--pf-danger': '#f87171',
  '--pf-accent': '#60a5fa',
  '--pf-heat-none': '#232830',
  '--pf-heat-low': '#1e4d6b',
  '--pf-heat-mid': '#2e8f9b',
  '--pf-heat-high': '#7fdc8c',
}

export const DEFAULT_LIGHT_PALETTE: Record<PfChartToken, string> = {
  '--pf-bg-surface': '#ffffff',
  '--pf-border': '#d0d5dd',
  '--pf-text-primary': '#1a1d23',
  '--pf-text-secondary': '#4a5160',
  '--pf-text-muted': '#5b6372',
  '--pf-positive': '#15803d',
  '--pf-warning': '#b45309',
  '--pf-danger': '#b91c1c',
  '--pf-accent': '#1d4ed8',
  '--pf-heat-none': '#eef0f3',
  '--pf-heat-low': '#bcd7ee',
  '--pf-heat-mid': '#6fa8d0',
  '--pf-heat-high': '#1f6aa5',
}
