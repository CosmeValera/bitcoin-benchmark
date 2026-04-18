# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bitcoin Benchmark is a Vue 3 financial comparison tool that visualizes Bitcoin performance against treasury stocks, preferred shares, and market indices using real historical data from Yahoo Finance.

## Build Commands

- `npm run dev` — Start Vite dev server (localhost:5173)
- `npm run build` — Type-check with vue-tsc, then build with Vite (outputs to `/dist`)
- `npm run preview` — Preview production build locally
- `npx vue-tsc --noEmit` — Type-check only (no test suite or linter configured)

## Tech Stack

- **Vue 3.5** with Composition API + `<script setup>` (no Options API)
- **Pinia 3** for state management
- **Vue Router 5** (single route at `/`)
- **Chart.js 4** via vue-chartjs (line charts with normalized % returns)
- **Vite 8** with TypeScript 6 strict mode
- **Path alias:** `@/` → `/src/`

## Architecture

### Data Flow (Comparison Feature)

1. User selects assets + time range → stored in `useComparisonStore()` (Pinia)
2. "Compare Assets" button calls `store.runComparison()`
3. `useMarketData.fetchAssetPrices()` fetches each selected asset in parallel via Yahoo Finance proxy
4. Prices normalized to % returns from start date; volatility calculated (annualized, √252)
5. `ComparisonChart.vue` renders line chart; `PerformanceTable.vue` renders metrics table

### Yahoo Finance Proxy

Configured in `vite.config.ts`: `/api/yahoo/*` → `https://query1.finance.yahoo.com/*`

- Endpoint: `/api/yahoo/v8/finance/chart/{ticker}?period1={unix}&period2={unix}&interval=1d`
- Response: `chart.result[0].timestamp[]` + `indicators.quote[0].close[]`
- Fallback: if requested date range returns no data (new IPO), retries with progressively shorter periods (2Y → 1Y → 6M → 3M)

### Asset Definitions (`src/types.ts`)

All assets defined in the `ASSETS[]` array with: `id`, `ticker`, `name`, `category`, `color`, `description`.

| Category | Assets |
|----------|--------|
| Bitcoin | BTC-USD |
| BTC Treasuries | MSTR, MTPLF (Metaplanet), XXI (Twenty One Capital), CPTLF (Capital B), SWC.L (Smarter Web Co.) |
| Strategy Preferred | STRK (Strike), STRD (Stride), STRF (Strife), STRC (Stretch) |
| Market Indices | SPY, QQQ |

To add a new asset: add entry to `ASSETS[]` in `types.ts`. The UI picks it up automatically via the category system in `AssetSelector.vue`.

### Chart Date Alignment

`ComparisonChart.vue` builds a union of all dates across all assets and aligns each dataset by date (using `null` + `spanGaps`). This handles assets with different listing dates correctly.

### Component Pattern

Components consume the Pinia store directly rather than using props/emits. `useComparisonStore()` is the single source of truth for selection state, fetched data, and computed metrics.

### Styling

Dark theme using CSS custom properties in `src/assets/main.css`. Key variables: `--bg` (#0f172a), `--card-bg` (#1e293b), `--accent` (#f7931a, Bitcoin orange). All components use scoped CSS. Mobile breakpoint at 600px.

## Unused Code

`stores/simulation.ts`, `useBitcoinPrice.ts`, `useCalculator.ts`, and components `InputPanel.vue`, `PriceChart.vue`, `ResultsSummary.vue` are scaffolded for a DCA simulation feature but not integrated into the UI.
