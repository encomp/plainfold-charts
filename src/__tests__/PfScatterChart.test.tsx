import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { PfScatterChart, type PfScatterChartProps } from '../components/PfScatterChart'

interface P { id: string; x: number | null; y: number | null; r?: number | null; tone?: 'ok' | 'warn' | 'bad' | 'neutral'; dashed?: boolean }

const pts: P[] = [
  { id: 'a', x: 120, y: 40, r: 5 },
  { id: 'b', x: 200, y: 80, r: 20 },
  { id: 'c', x: 300, y: 10, r: null },
]

function setup(over: Partial<PfScatterChartProps<P>> = {}) {
  const props: PfScatterChartProps<P> = {
    points: pts,
    getId: (p) => p.id,
    getX: (p) => p.x,
    getY: (p) => p.y,
    xAxis: { label: 'Width' },
    yAxis: { label: 'Height' },
    ...over,
  }
  return render(<PfScatterChart {...props} />)
}

describe('PfScatterChart', () => {
  it('renders one button per drawable point', () => {
    setup()
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('skips points with a null x or y', () => {
    setup({ points: [...pts, { id: 'n1', x: null, y: 3 }, { id: 'n2', x: 3, y: null }] })
    expect(screen.getAllByRole('button')).toHaveLength(3)
    expect(screen.queryByRole('button', { name: 'n1' })).toBeNull()
  })

  it('names points from renderLabel text or getId', () => {
    setup({ renderLabel: (p) => (p.id === 'a' ? `Point ${p.id}` : null) })
    expect(screen.getByRole('button', { name: /Point a/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^b/ })).toBeInTheDocument()
  })

  it('calls onSelect on click, Enter and Space', () => {
    const onSelect = vi.fn()
    setup({ onSelect })
    const a = screen.getByRole('button', { name: /^a/ })
    fireEvent.click(a)
    fireEvent.keyDown(a, { key: 'Enter' })
    fireEvent.keyDown(a, { key: ' ' })
    expect(onSelect).toHaveBeenCalledTimes(3)
    expect(onSelect).toHaveBeenCalledWith('a')
  })

  it('marks the selected point with aria-pressed', () => {
    setup({ selectedId: 'b' })
    expect(screen.getByRole('button', { name: /^b/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^a/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('puts the tone word in the accessible name and a distinct shape per tone', () => {
    setup({
      points: [
        { id: 'w', x: 1, y: 1, tone: 'warn' },
        { id: 'x', x: 2, y: 2, tone: 'bad' },
        { id: 'y', x: 3, y: 3, tone: 'ok' },
        { id: 'z', x: 4, y: 4 },
      ],
      getTone: (p) => p.tone ?? 'neutral',
    })
    expect(screen.getByRole('button', { name: /^w.*warning/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^x.*problem/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^y.*good/ })).toBeInTheDocument()
    const shapes = ['w', 'x', 'y', 'z'].map((id) => screen.getByRole('button', { name: new RegExp(`^${id}`) }).querySelector('[data-shape]')!.getAttribute('data-shape'))
    expect(new Set(shapes).size).toBe(3)
  })

  it('tone changes the outline colour', () => {
    setup({ getTone: (p) => (p.id === 'a' ? 'bad' : 'neutral') })
    const stroke = (id: string) => screen.getByRole('button', { name: new RegExp(`^${id}`) }).querySelector('[data-shape]')!.getAttribute('stroke')
    expect(stroke('a')).not.toBe(stroke('b'))
  })

  it('draws a dashed outline when getDashed', () => {
    setup({ getDashed: (p) => p.id === 'a' })
    const shape = (id: string) => screen.getByRole('button', { name: new RegExp(`^${id}`) }).querySelector('[data-shape]')!
    expect(shape('a').getAttribute('stroke-dasharray')).toBeTruthy()
    expect(shape('b').getAttribute('stroke-dasharray')).toBeNull()
  })

  it('scales radius with getSize and uses a default for null', () => {
    setup({ getSize: (p) => p.r ?? null })
    const r = (id: string) => Number(screen.getByRole('button', { name: new RegExp(`^${id}`) }).getAttribute('data-r'))
    expect(r('b')).toBeGreaterThan(r('a'))
    expect(r('c')).toBeGreaterThan(0)
    expect(r('c')).not.toBe(r('a'))
  })

  it('renders labelled regions at data coordinates', () => {
    const { container } = setup({ regions: [{ x0: 100, x1: 200, y0: 20, y1: 60, label: 'Zone one' }] })
    expect(screen.getByText('Zone one')).toBeInTheDocument()
    const rect = container.querySelector('[data-region] rect')!
    expect(Number(rect.getAttribute('width'))).toBeGreaterThan(0)
    expect(Number(rect.getAttribute('height'))).toBeGreaterThan(0)
  })

  it('shows axis labels and formats ticks', () => {
    setup({ xAxis: { label: 'Width', min: 0, max: 400, format: (v) => `${v}px` } })
    expect(screen.getByText('Width')).toBeInTheDocument()
    expect(screen.getByText('Height')).toBeInTheDocument()
    expect(screen.getAllByText(/px$/).length).toBeGreaterThan(1)
  })

  it('shows emptyState with zero drawable points', () => {
    setup({ points: [{ id: 'n', x: null, y: 1 }], emptyState: <p>Nothing here</p> })
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('shows renderTooltip on hover and focus', () => {
    setup({ renderTooltip: (p) => <span>Tip {p.id}</span> })
    const a = screen.getByRole('button', { name: /^a/ })
    expect(screen.queryByText('Tip a')).toBeNull()
    fireEvent.mouseEnter(a)
    expect(screen.getByText('Tip a')).toBeInTheDocument()
    fireEvent.mouseLeave(a)
    expect(screen.queryByText('Tip a')).toBeNull()
    fireEvent.focus(screen.getByRole('button', { name: /^b/ }))
    expect(screen.getByText('Tip b')).toBeInTheDocument()
    fireEvent.blur(screen.getByRole('button', { name: /^b/ }))
    expect(screen.queryByText('Tip b')).toBeNull()
  })

  it('positions the tooltip in percentages on both axes and links it by aria-describedby', () => {
    setup({ renderTooltip: (p) => <span>Tip {p.id}</span>, height: 200 })
    const a = screen.getByRole('button', { name: /^a/ })
    fireEvent.mouseEnter(a)
    const tip = screen.getByRole('tooltip')
    expect(tip.style.left).toMatch(/%$/)
    expect(tip.style.top).toMatch(/%$/)
    expect(a.getAttribute('aria-describedby')).toBe(tip.id)
  })

  it('clips regions but not points', () => {
    const { container } = setup({ regions: [{ x0: 0, x1: 9999, y0: 0, y1: 9999, label: 'Big' }] })
    expect(container.querySelector('clipPath rect')).not.toBeNull()
    expect(container.querySelectorAll('g[clip-path]').length).toBe(1)
    expect(container.querySelector('g[clip-path] [role="button"]')).toBeNull()
  })

  it('uses pixel height with no scaling', () => {
    const { container } = setup({ height: 250 })
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('height')).toBe('250')
    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${svg.getAttribute('width')} 250`)
  })

  it('falls back to the id for null or JSX labels', () => {
    setup({ renderLabel: (p) => (p.id === 'a' ? null : <b>{p.id}</b>) })
    expect(screen.getByRole('button', { name: 'a' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'b' })).toBeInTheDocument()
  })

  it('does not show another point when points change under a hovered id', () => {
    const base = { getId: (p: P) => p.id, getX: (p: P) => p.x, getY: (p: P) => p.y, xAxis: { label: 'X' }, yAxis: { label: 'Y' }, renderTooltip: (p: P) => <span>Tip {p.id}</span> }
    const { rerender } = render(<PfScatterChart {...base} points={pts} />)
    fireEvent.mouseEnter(screen.getByRole('button', { name: /^a/ }))
    expect(screen.getByText('Tip a')).toBeInTheDocument()
    rerender(<PfScatterChart {...base} points={[pts[1], pts[2]]} />)
    expect(screen.queryByRole('tooltip')).toBeNull()
    rerender(<PfScatterChart {...base} points={[pts[1], pts[0]]} />)
    expect(screen.getByText('Tip a')).toBeInTheDocument()
    expect(screen.queryByText('Tip b')).toBeNull()
  })

  it('tolerates duplicate ids without throwing', () => {
    setup({ points: [pts[0], { ...pts[0] }] })
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('keeps a valid domain for one point, equal points, a lone min and min above max', () => {
    for (const over of [
      { points: [pts[0]] },
      { points: [pts[0], { ...pts[0], id: 'a2' }] },
      { xAxis: { label: 'X', min: 500 } },
      { xAxis: { label: 'X', min: 500, max: 100 } },
      { yAxis: { label: 'Y', max: -5 } },
    ] as Partial<PfScatterChartProps<P>>[]) {
      const { container, unmount } = setup(over)
      expect(container.innerHTML).not.toMatch(/NaN|Infinity/)
      unmount()
    }
  })

  it('clamps points outside an explicit axis range to the plot box', () => {
    setup({ xAxis: { label: 'X', min: 150, max: 250 }, yAxis: { label: 'Y', min: 20, max: 60 } })
    const pos = (id: string) => {
      const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(screen.getByRole('button', { name: new RegExp(`^${id}`) }).getAttribute('transform')!)!
      return [Number(m[1]), Number(m[2])]
    }
    const [ax] = pos('a') // x=120 is below min 150
    expect(ax).toBeGreaterThanOrEqual(56)
    const [cx] = pos('c') // x=300 is above max 250
    expect(cx).toBeLessThanOrEqual(600 - 20)
    const [, by] = pos('b') // y=80 is above max 60
    expect(by).toBeGreaterThanOrEqual(16)
  })

  it('lets the wrapper shrink in flex/grid parents', () => {
    const { container } = setup()
    const wrap = container.firstElementChild as HTMLElement
    expect(wrap.style.minWidth).toMatch(/^0(px)?$/)
    expect(wrap.style.overflow).not.toBe('hidden')
  })

  it('places the tooltip at the clamped marker for an out-of-range point', () => {
    setup({ xAxis: { label: 'X', min: 150, max: 250 }, renderTooltip: (p) => <span>Tip {p.id}</span> })
    const a = screen.getByRole('button', { name: /^a/ })
    fireEvent.mouseEnter(a)
    const tip = screen.getByRole('tooltip')
    const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(a.getAttribute('transform')!)!
    expect(parseFloat(tip.style.left)).toBeCloseTo((Number(m[1]) / 600) * 100, 3)
    expect(parseFloat(tip.style.top)).toBeCloseTo((Number(m[2]) / 320) * 100, 3)
  })

  it('ignores non-finite values and sizes', () => {
    const { container } = setup({
      points: [
        { id: 'a', x: 1, y: 1, r: Number.NaN },
        { id: 'b', x: 2, y: 2, r: Number.POSITIVE_INFINITY },
        { id: 'c', x: 3, y: 3, r: 4 },
        { id: 'd', x: Number.NaN, y: 1 },
        { id: 'e', x: 1, y: Number.POSITIVE_INFINITY },
      ],
      getSize: (p) => p.r ?? null,
    })
    expect(screen.getAllByRole('button')).toHaveLength(3)
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/)
  })

  it('shifts the tooltip near edges and flips it below near the top', () => {
    setup({
      points: [
        { id: 'lo', x: 0, y: 0 },
        { id: 'hi', x: 100, y: 100 },
        { id: 'mid', x: 50, y: 50 },
      ],
      xAxis: { label: 'X', min: 0, max: 100 },
      yAxis: { label: 'Y', min: 0, max: 100 },
      renderTooltip: (p) => <span>Tip {p.id}</span>,
    })
    const tf = (id: string) => {
      fireEvent.mouseEnter(screen.getByRole('button', { name: new RegExp(`^${id}`) }))
      const v = screen.getByRole('tooltip').style.transform
      fireEvent.mouseLeave(screen.getByRole('button', { name: new RegExp(`^${id}`) }))
      return v
    }
    const pct = (v: string) => parseFloat(/translate\(([-\d.]+)%/.exec(v)![1])
    expect(pct(tf('lo'))).toBeGreaterThan(pct(tf('mid')))
    expect(pct(tf('mid'))).toBeGreaterThan(pct(tf('hi')))
    expect(tf('hi')).toContain('10px') // top of the plot: flipped below
    expect(tf('hi')).not.toContain('100%) ')
    expect(tf('lo')).toContain('calc(-100% - 10px)') // bottom: stays above
  })

  describe('width measuring', () => {
    const original = globalThis.ResizeObserver
    afterEach(() => {
      globalThis.ResizeObserver = original
    })

    it('follows the observer, ignores 0 and disconnects on unmount', () => {
      let cb: ResizeObserverCallback = () => {}
      const disconnect = vi.fn()
      globalThis.ResizeObserver = class {
        constructor(c: ResizeObserverCallback) {
          cb = c
        }
        observe() {}
        unobserve() {}
        disconnect = disconnect
      } as unknown as typeof ResizeObserver
      const { container, unmount } = setup()
      const emit = (w: number) =>
        act(() => cb([{ contentRect: { width: w } } as ResizeObserverEntry], {} as ResizeObserver))
      emit(400)
      expect(container.querySelector('svg')!.getAttribute('width')).toBe('400')
      emit(0)
      expect(container.querySelector('svg')!.getAttribute('width')).toBe('400')
      unmount()
      expect(disconnect).toHaveBeenCalled()
    })
  })
})
