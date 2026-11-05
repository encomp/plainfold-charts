# @plainfold/charts

Theme-aware chart components wrapping Nivo (D3-based) for the Plainfold ecosystem. Optional package.

## Architecture

Depends on: `@plainfold/design-tokens` (for CSS variables and theme tokens)
No downstream Plainfold dependencies -- this is a leaf package.

## Public API

### Components
- `PfBarChart` -- props: `data`, `xField`, `yField`, `orientation`, `stacked`, `height`, `colors`
- `PfLineChart` -- props: `series`, `curved`, `height`, `colors`
- `PfPieChart` -- props: `data`, `donut`, `height`, `colors`
- `PfHeatmap` -- props: `data`, `height`
- `PfScatterChart` -- props: `points`, `getId`, `getX`, `getY`, `getSize`, `getPointLabel`, `getTone`, `getDashed`, `xAxis`, `yAxis`, `selectedId`, `onSelect`, `renderTooltip`, `renderLabel`, `regions`, `legend`, `note`, `emptyState`, `height` (hand-rolled SVG, no Nivo dependency; each point is a focusable button)

### Hooks
- `usePfChartTheme()` -- returns Nivo-compatible theme from CSS variables

## Key Decisions

- **No Nivo props leak** -- clean abstraction layer, our props map to Nivo internals
- **Heatmap tokens** -- uses `--pf-heat-none/low/mid/high` from design-tokens
- **Theme reads from DOM** -- `usePfChartTheme` reads CSS variables at render time
- **React >= 19 only**

## Development

```bash
npm install
npm test           # Vitest
npm run build      # ESM + CJS
npm run lint       # ESLint
npm run typecheck  # TypeScript
```
