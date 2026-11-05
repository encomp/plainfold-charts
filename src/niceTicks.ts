/** Round tick values (steps of 1, 2, 2.5 or 5 times a power of ten) from at or below `lo` to at or above `hi`. */
export function niceTicks(lo: number, hi: number, target = 5): number[] {
  const raw = ((hi - lo) || 1) / Math.max(target - 1, 1)
  const p = 10 ** Math.floor(Math.log10(raw))
  const step = p * [1, 2, 2.5, 5, 10].reduce((a, b) => (Math.abs(b - raw / p) < Math.abs(a - raw / p) ? b : a))
  const first = Math.floor(lo / step + 1e-9)
  const last = Math.max(Math.ceil(hi / step - 1e-9), first + 1)
  return Array.from({ length: last - first + 1 }, (_, i) => Number(((first + i) * step).toPrecision(12)))
}
