# @plainfold/charts

Theme-aware chart components for Plainfold apps.

## PfScatterChart

```tsx
import { PfScatterChart } from '@plainfold/charts'

interface Item { id: string; width: number | null; height: number | null; weight: number | null; state: 'ok' | 'warn' | 'bad' | 'neutral'; draft: boolean; estimated?: boolean }

const items: Item[] = [
  { id: 'a', width: 120, height: 40, weight: 5, state: 'ok', draft: false },
  { id: 'b', width: 200, height: 80, weight: 20, state: 'warn', draft: true },
  { id: 'c', width: null, height: 10, weight: null, state: 'bad', draft: false }, // not drawn
]

<PfScatterChart
  points={items}
  getId={(p) => p.id}
  getX={(p) => p.width}
  getY={(p) => p.height}
  getSize={(p) => p.weight}
  getPointLabel={(p) => `${p.id} ${p.height}`}
  getTone={(p) => p.state}
  getDashed={(p) => p.draft}
  getHollow={(p) => p.estimated}
  xAxis={{ label: 'Width', format: (v) => `${v}px` }}
  yAxis={{ label: 'Height' }}
  legend={[{ label: 'good', tone: 'ok' }, { label: 'draft', tone: 'neutral', dashed: true }, { label: 'estimate', tone: 'ok', hollow: true }]}
  note="Size = weight"
  regions={[{ x0: 100, x1: 220, y0: 20, y1: 60, label: 'Target zone' }]}
  selectedId="a"
  onSelect={(id) => console.log(id)}
  renderTooltip={(p) => <span>{p.id}</span>}
  emptyState={<p>Nothing to show</p>}
/>
```

Ticks are round values (steps of 1, 2, 2.5 or 5 times a power of ten) that extend the data range unless the axis sets `min` or `max`; without `format` a tick shows only the decimals its step needs.

`getHollow` draws a point as a ring: no fill, tone-colour stroke (for example, an estimated value).

`getPointLabel` draws text beside a dot when there is room (right, left, above, then below; larger dots first, labels that would overlap are left out). Dot radius scales with `getSize` from 5 to 22 px.

`legend` and `note` render one wrapping key row under the chart: a swatch per item in its tone's colour and shape (dashed outline when `dashed`, ring with no fill when `hollow`), then the note text.

Every drawn point is a focusable button (Enter or Space selects) when `onSelect` is given; without it points are non-interactive images, focusable only when `renderTooltip` is given. Tone is shown by colour, shape and a hidden word.
