export interface LabelItem {
  id: string
  px: number
  py: number
  /** Dot radius. */
  r: number
  /** Label width in px; 0 for a dot without a label. */
  w: number
}

export interface LabelBox {
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface LabelSpot {
  /** Left edge for anchor 'start', right edge for 'end'. */
  x: number
  /** Vertical centre of the text. */
  y: number
  anchor: 'start' | 'end'
}

const H = 12 // label height
const GAP = 4 // between dot and label

interface Rect { l: number; t: number; r: number; b: number }

const hit = (a: Rect, b: Rect) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b

/**
 * Greedy label placement: larger dots first, each tries right, left, above, below.
 * A label that overlaps a placed label, any dot, or leaves the box gets no entry.
 * shortcut: first free spot wins, not the best overall; upgrade if dense charts need fewer omissions.
 */
export function placeLabels(items: LabelItem[], box: LabelBox): Map<string, LabelSpot> {
  const out = new Map<string, LabelSpot>()
  const taken: Rect[] = []
  const onDot = (q: Rect) => items.some((d) => {
    const dx = Math.max(q.l - d.px, 0, d.px - q.r)
    const dy = Math.max(q.t - d.py, 0, d.py - q.b)
    return dx * dx + dy * dy < d.r * d.r
  })
  const byRadius = items.map((d, i) => ({ d, i })).sort((a, b) => b.d.r - a.d.r || a.i - b.i)
  for (const { d } of byRadius) {
    if (d.w <= 0) continue
    const spots: LabelSpot[] = [
      { x: d.px + d.r + GAP, y: d.py, anchor: 'start' },
      { x: d.px - d.r - GAP, y: d.py, anchor: 'end' },
      { x: d.px - d.w / 2, y: d.py - d.r - GAP - H / 2, anchor: 'start' },
      { x: d.px - d.w / 2, y: d.py + d.r + GAP + H / 2, anchor: 'start' },
    ]
    for (const s of spots) {
      const l = s.anchor === 'start' ? s.x : s.x - d.w
      const q = { l, t: s.y - H / 2, r: l + d.w, b: s.y + H / 2 }
      if (q.l < box.x0 || q.r > box.x1 || q.t < box.y0 || q.b > box.y1) continue
      if (taken.some((o) => hit(o, q)) || onDot(q)) continue
      taken.push(q)
      out.set(d.id, s)
      break
    }
  }
  return out
}
