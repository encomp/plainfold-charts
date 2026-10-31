# @plainfold/charts

Theme-aware chart components for Plainfold apps.

## PfScatterChart

```tsx
import { PfScatterChart } from '@plainfold/charts'

interface Item { id: string; width: number | null; height: number | null; weight: number | null; state: 'ok' | 'warn' | 'bad' | 'neutral'; draft: boolean }

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
  getTone={(p) => p.state}
  getDashed={(p) => p.draft}
  xAxis={{ label: 'Width', format: (v) => `${v}px` }}
  yAxis={{ label: 'Height' }}
  regions={[{ x0: 100, x1: 220, y0: 20, y1: 60, label: 'Target zone' }]}
  selectedId="a"
  onSelect={(id) => console.log(id)}
  renderTooltip={(p) => <span>{p.id}</span>}
  emptyState={<p>Nothing to show</p>}
/>
```

Every drawn point is a focusable button (Enter or Space selects) when `onSelect` is given; without it points are non-interactive images, focusable only when `renderTooltip` is given. Tone is shown by colour, shape and a hidden word.
