import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { usePfChartTheme } from '../usePfChartTheme'

export type PfScatterTone = 'ok' | 'warn' | 'bad' | 'neutral'

export interface PfScatterAxis {
  /** Axis title. */
  label: string
  /** Lower bound of the axis; defaults to the data minimum. */
  min?: number
  /** Upper bound of the axis; defaults to the data maximum. */
  max?: number
  /** Tick formatter. */
  format?(v: number): string
}

export interface PfScatterRegion {
  /** Rectangle in data coordinates. */
  x0: number
  x1: number
  y0: number
  y1: number
  /** Text drawn in the shaded rectangle. */
  label: string
}

export interface PfScatterChartProps<T> {
  /** Items to plot. */
  points: T[]
  /** Unique id (duplicates are a caller bug); also the fallback accessible name. */
  getId(p: T): string
  /** X value; a point with a null x or y is not drawn (the caller counts them). */
  getX(p: T): number | null
  /** Y value; a point with a null x or y is not drawn. */
  getY(p: T): number | null
  /** Bubble area value; null or omitted gives the default size. */
  getSize?(p: T): number | null
  /** Tone, default 'neutral'. Drawn as colour plus shape plus a hidden word. */
  getTone?(p: T): PfScatterTone
  /** Dashed outline when true (for example, not yet explored). */
  getDashed?(p: T): boolean
  xAxis: PfScatterAxis
  yAxis: PfScatterAxis
  /** Id of the selected point (marked with aria-pressed). */
  selectedId?: string | null
  /** Called with the id on click, Enter or Space. */
  onSelect?(id: string): void
  /** Shown on hover and focus. */
  renderTooltip?(p: T): ReactNode
  /** Accessible name text for a point; used only when it is a string or number, else getId. */
  renderLabel?(p: T): ReactNode
  /** Shaded labelled rectangles behind the points. */
  regions?: PfScatterRegion[]
  /** Shown when there are zero drawable points. */
  emptyState?: ReactNode
  /** Chart height in px, default 320. Width follows the container. */
  height?: number
  'data-testid'?: string
}

const FALLBACK_W = 600 // used where ResizeObserver or layout is unavailable (jsdom)
const M = { top: 16, right: 20, bottom: 44, left: 56 }
const R_DEFAULT = 6
const R_MIN = 4
const R_MAX = 16
const TICKS = 5

const TONE: Record<PfScatterTone, { color: string; shape: 'circle' | 'triangle' | 'diamond'; word: string }> = {
  ok: { color: 'var(--pf-positive, #22c55e)', shape: 'circle', word: 'good' },
  warn: { color: 'var(--pf-warning, #f59e0b)', shape: 'triangle', word: 'warning' },
  bad: { color: 'var(--pf-danger, #ef4444)', shape: 'diamond', word: 'problem' },
  neutral: { color: 'var(--pf-accent, #3b82f6)', shape: 'circle', word: '' },
}

function domain(vals: number[], axis: PfScatterAxis): [number, number] {
  let lo = axis.min ?? vals.reduce((a, b) => Math.min(a, b))
  let hi = axis.max ?? vals.reduce((a, b) => Math.max(a, b))
  if (axis.min === undefined && axis.max === undefined) {
    const pad = (hi - lo) * 0.05 || 1
    lo -= pad
    hi += pad
  } else if (hi <= lo) hi = lo + 1
  return [lo, hi]
}

function ticks([lo, hi]: [number, number]): number[] {
  return Array.from({ length: TICKS }, (_, i) => lo + ((hi - lo) * i) / (TICKS - 1))
}

function defaultFormat(v: number): string {
  return String(Math.round(v * 100) / 100)
}

function shapeProps(shape: 'circle' | 'triangle' | 'diamond', r: number) {
  if (shape === 'triangle') return { points: `0,${-r} ${r},${r} ${-r},${r}` }
  return { points: `0,${-r} ${r},0 0,${r} ${-r},0` }
}

export function PfScatterChart<T>({
  points,
  getId,
  getX,
  getY,
  getSize,
  getTone,
  getDashed,
  xAxis,
  yAxis,
  selectedId,
  onSelect,
  renderTooltip,
  renderLabel,
  regions,
  emptyState,
  height = 320,
  'data-testid': testId,
}: PfScatterChartProps<T>) {
  const theme = usePfChartTheme()
  const [hovered, setHovered] = useState<string | null>(null)
  const [width, setWidth] = useState(FALLBACK_W)
  const wrapRef = useRef<HTMLDivElement>(null)
  const uid = useId()
  const clipId = `${uid}-clip`
  const tipId = `${uid}-tip`

  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width)
      if (w > 0) setWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const drawable = points.flatMap((p) => {
    const x = getX(p)
    const y = getY(p)
    return x === null || y === null || !Number.isFinite(x) || !Number.isFinite(y) ? [] : [{ p, x, y }]
  })

  if (drawable.length === 0) {
    return <div ref={wrapRef} data-testid={testId}>{emptyState}</div>
  }

  const [x0, x1] = domain(drawable.map((d) => d.x), xAxis)
  const [y0, y1] = domain(drawable.map((d) => d.y), yAxis)
  const pw = Math.max(width - M.left - M.right, 1)
  const ph = height - M.top - M.bottom
  const sx = (v: number) => M.left + ((v - x0) / (x1 - x0)) * pw
  const sy = (v: number) => M.top + ph - ((v - y0) / (y1 - y0)) * ph
  const fx = xAxis.format ?? defaultFormat
  const fy = yAxis.format ?? defaultFormat

  const sizes = drawable.map((d) => getSize?.(d.p) ?? null).filter((s): s is number => s !== null && s > 0)
  const maxSize = sizes.length ? Math.max(...sizes) : 0
  // Area-proportional radius.
  const radius = (p: T) => {
    const s = getSize?.(p) ?? null
    if (s === null || s <= 0 || maxSize === 0) return R_DEFAULT
    return R_MIN + Math.sqrt(s / maxSize) * (R_MAX - R_MIN)
  }

  const label = (p: T) => {
    const l = renderLabel?.(p)
    return typeof l === 'string' || typeof l === 'number' ? String(l) : getId(p)
  }
  const select = (id: string) => onSelect?.(id)
  const hoveredPoint = hovered === null ? null : drawable.find((d) => getId(d.p) === hovered)

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }} data-testid={testId}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="group" aria-label={`${yAxis.label} by ${xAxis.label}`} style={{ display: 'block', fontSize: theme.fontSize, fontFamily: theme.tooltip.container.fontFamily }}>
        <defs>
          <clipPath id={clipId}>
            <rect x={M.left} y={M.top} width={pw} height={ph} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {(regions ?? []).map((r, i) => {
            const rx = Math.min(sx(r.x0), sx(r.x1))
            const ry = Math.min(sy(r.y0), sy(r.y1))
            return (
              <g key={i} data-region>
                <rect x={rx} y={ry} width={Math.abs(sx(r.x1) - sx(r.x0))} height={Math.abs(sy(r.y1) - sy(r.y0))} fill={theme.textColor} fillOpacity={0.1} />
                <text x={rx + 4} y={ry + 12} fill={theme.textColor}>{r.label}</text>
              </g>
            )
          })}
        </g>
        {ticks([x0, x1]).map((t) => (
          <g key={`x${t}`}>
            <line x1={sx(t)} x2={sx(t)} y1={M.top} y2={M.top + ph} stroke={theme.grid.line.stroke} />
            <text x={sx(t)} y={M.top + ph + 16} textAnchor="middle" fill={theme.axis.ticks.text.fill}>{fx(t)}</text>
          </g>
        ))}
        {ticks([y0, y1]).map((t) => (
          <g key={`y${t}`}>
            <line x1={M.left} x2={M.left + pw} y1={sy(t)} y2={sy(t)} stroke={theme.grid.line.stroke} />
            <text x={M.left - 6} y={sy(t) + 4} textAnchor="end" fill={theme.axis.ticks.text.fill}>{fy(t)}</text>
          </g>
        ))}
        <text x={M.left + pw / 2} y={height - 6} textAnchor="middle" fill={theme.axis.legend.text.fill}>{xAxis.label}</text>
        <text transform={`translate(12 ${M.top + ph / 2}) rotate(-90)`} textAnchor="middle" fill={theme.axis.legend.text.fill}>{yAxis.label}</text>
        {drawable.map(({ p, x, y }) => {
          const id = getId(p)
          const tone = TONE[getTone?.(p) ?? 'neutral']
          const r = radius(p)
          const selected = selectedId === id
          const shapeCommon = {
            'data-shape': tone.shape,
            fill: tone.color,
            fillOpacity: 0.6,
            stroke: tone.color,
            strokeWidth: selected ? 3 : 1.5,
            strokeDasharray: getDashed?.(p) ? '3 2' : undefined,
          }
          return (
            <g
              key={id}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-describedby={hovered === id && renderTooltip ? tipId : undefined}
              aria-label={tone.word ? `${label(p)}, ${tone.word}` : label(p)}
              data-r={r}
              transform={`translate(${sx(x)} ${sy(y)})`}
              style={{ cursor: onSelect ? 'pointer' : 'default' }}
              onClick={() => select(id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  select(id)
                }
              }}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(id)}
              onBlur={() => setHovered(null)}
            >
              {tone.shape === 'circle' ? <circle r={r} {...shapeCommon} /> : <polygon {...shapeProps(tone.shape, r)} {...shapeCommon} />}
            </g>
          )
        })}
      </svg>
      {hoveredPoint && renderTooltip && (
        <div
          id={tipId}
          role="tooltip"
          style={{
            position: 'absolute',
            left: `${(sx(hoveredPoint.x) / width) * 100}%`,
            top: `${(sy(hoveredPoint.y) / height) * 100}%`,
            transform: 'translate(-50%, calc(-100% - 10px))',
            pointerEvents: 'none',
            ...theme.tooltip.container,
            padding: '4px 8px',
          }}
        >
          {renderTooltip(hoveredPoint.p)}
        </div>
      )}
    </div>
  )
}
