import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { usePfChartTheme } from '../usePfChartTheme'
import { niceTicks } from '../niceTicks'

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
  /** Unique id (hover and selection key on it; duplicates only avoid a crash); also the fallback accessible name. */
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
  /** Id of the selected point (marked with aria-pressed). Without `onSelect` points are not buttons: they are images, focusable only when `renderTooltip` is given. */
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
const M = { top: 16, bottom: 56 }
const CHAR_W = 6.5 // rough px per tick label character
const TITLE_ROOM = 20 // rotated y title plus its gap

const R_DEFAULT = 6
const R_MIN = 4
const R_MAX = 16
// shortcut: flip threshold assumes a tooltip under ~48px tall, upgrade by measuring the tooltip
const TIP_FLIP_Y = 48

const TONE: Record<PfScatterTone, { color: string; shape: 'circle' | 'triangle' | 'diamond'; word: string }> = {
  ok: { color: 'var(--pf-positive, #22c55e)', shape: 'circle', word: 'good' },
  warn: { color: 'var(--pf-warning, #f59e0b)', shape: 'triangle', word: 'warning' },
  bad: { color: 'var(--pf-danger, #ef4444)', shape: 'diamond', word: 'problem' },
  neutral: { color: 'var(--pf-accent, #3b82f6)', shape: 'circle', word: '' },
}

function clamp(v: number, lo: number, hi: number): number {
  return hi < lo ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v))
}

// Ticks extend the data range to round values; a fixed min or max wins and drops ticks beyond it.
function scale(vals: number[], axis: PfScatterAxis): { lo: number; hi: number; ticks: number[] } {
  const dlo = axis.min ?? Math.min(...vals)
  const max = axis.max ?? Math.max(...vals)
  const dhi = max > dlo ? max : dlo + 1 // a span even for equal values or a min above max
  const t = niceTicks(dlo, dhi)
  const lo = axis.min ?? t[0]
  const hi = axis.max === undefined ? t[t.length - 1] : dhi
  return { lo, hi, ticks: t.filter((v) => v >= lo && v <= hi) }
}

function defaultFormat(v: number, ticks: number[]): string {
  const step = ticks[1] - ticks[0]
  let d = 0
  while (d < 6 && Math.abs(Math.round(step * 10 ** d) - step * 10 ** d) > 1e-9) d++
  return v.toFixed(d)
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

  const xs = scale(drawable.map((d) => d.x), xAxis)
  const ys = scale(drawable.map((d) => d.y), yAxis)
  const { lo: x0, hi: x1 } = xs
  const { lo: y0, hi: y1 } = ys
  const fx = xAxis.format ?? ((v: number) => defaultFormat(v, xs.ticks))
  const fy = yAxis.format ?? ((v: number) => defaultFormat(v, ys.ticks))
  const left = Math.max(56, Math.max(...ys.ticks.map((t) => fy(t).length)) * CHAR_W + 6 + TITLE_ROOM)
  const right = Math.max(20, (fx(xs.ticks[xs.ticks.length - 1]).length * CHAR_W) / 2 + 2)
  const pw = Math.max(width - left - right, 1)
  const ph = height - M.top - M.bottom
  const sx = (v: number) => left + ((v - x0) / (x1 - x0)) * pw
  const sy = (v: number) => M.top + ph - ((v - y0) / (y1 - y0)) * ph

  const validSize = (p: T): number | null => {
    const s = getSize?.(p) ?? null
    return s !== null && Number.isFinite(s) && s > 0 ? s : null
  }
  const maxSize = drawable.reduce((m, d) => Math.max(m, validSize(d.p) ?? 0), 0)
  // Area-proportional radius.
  const radius = (p: T) => {
    const s = validSize(p)
    if (s === null || maxSize === 0) return R_DEFAULT
    return R_MIN + Math.sqrt(s / maxSize) * (R_MAX - R_MIN)
  }

  // shortcut: out-of-range points are drawn on the plot edge (the tooltip shows the real value), upgrade if callers need an off-scale marker.
  const placed = drawable.map((d) => {
    const r = radius(d.p)
    return {
      ...d,
      r,
      px: clamp(sx(d.x), left + r, left + pw - r),
      py: clamp(sy(d.y), M.top + r, M.top + ph - r),
    }
  })

  const label = (p: T) => {
    const l = renderLabel?.(p)
    return typeof l === 'string' || typeof l === 'number' ? String(l) : getId(p)
  }
  const select = (id: string) => onSelect?.(id)
  const hoveredPoint = hovered === null ? null : placed.find((d) => getId(d.p) === hovered)
  const gap = (hoveredPoint?.r ?? 0) + 6 // tooltip offset from the marker edge

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', minWidth: 0 }} data-testid={testId}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="group" aria-label={`${yAxis.label} by ${xAxis.label}`} style={{ display: 'block', fontSize: theme.fontSize, fontFamily: theme.tooltip.container.fontFamily }}>
        <defs>
          <clipPath id={clipId}>
            <rect x={left} y={M.top} width={pw} height={ph} />
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
        {xs.ticks.map((t) => (
          <g key={`x${t}`}>
            <line x1={sx(t)} x2={sx(t)} y1={M.top} y2={M.top + ph} stroke={theme.grid.line.stroke} />
            <text x={sx(t)} y={M.top + ph + 16} textAnchor="middle" fill={theme.axis.ticks.text.fill}>{fx(t)}</text>
          </g>
        ))}
        {ys.ticks.map((t) => (
          <g key={`y${t}`}>
            <line x1={left} x2={left + pw} y1={sy(t)} y2={sy(t)} stroke={theme.grid.line.stroke} />
            <text x={left - 6} y={sy(t) + 4} textAnchor="end" fill={theme.axis.ticks.text.fill}>{fy(t)}</text>
          </g>
        ))}
        <text x={left + pw / 2} y={height - 6} textAnchor="middle" fill={theme.axis.legend.text.fill}>{xAxis.label}</text>
        <text transform={`translate(12 ${M.top + ph / 2}) rotate(-90)`} textAnchor="middle" fill={theme.axis.legend.text.fill}>{yAxis.label}</text>
        {placed.map(({ p, r, px, py }, i) => {
          const id = getId(p)
          const tone = TONE[getTone?.(p) ?? 'neutral']
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
              key={`${id}:${i}`}
              role={onSelect ? 'button' : 'img'}
              tabIndex={onSelect || renderTooltip ? 0 : undefined}
              aria-pressed={onSelect ? selected : undefined}
              aria-describedby={hovered === id && renderTooltip ? tipId : undefined}
              aria-label={tone.word ? `${label(p)}, ${tone.word}` : label(p)}
              data-r={r}
              transform={`translate(${px} ${py})`}
              style={{ cursor: onSelect ? 'pointer' : 'default' }}
              onClick={() => select(id)}
              onKeyDown={(e) => {
                if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
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
            left: `${(hoveredPoint.px / width) * 100}%`,
            top: `${(hoveredPoint.py / height) * 100}%`,
            // Shift sideways near the edges (0% at the left edge, -100% at the right) and flip below the marker near the top.
            transform: `translate(${-(hoveredPoint.px / width) * 100}%, ${hoveredPoint.py < TIP_FLIP_Y ? `${gap}px` : `calc(-100% - ${gap}px)`})`,
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
