# Bitcoin Finance Lab

A suite of Bitcoin finance tools — build portfolios, benchmark assets, and simulate DCA strategies with real historical data.

![Bitcoin Finance Lab screenshot](image.png)

## What it does

- **Portfolio Builder** — Allocate weights across BTC, treasury stocks, preferred shares, indices, and any custom ticker. See blended returns, volatility, and max drawdown.
- **Benchmark** — Compare normalized returns across assets on a single chart with a sortable metrics table.
- **DCA Simulator** — Simulate dollar-cost averaging into Bitcoin over any time period.

### Available assets

| Category | Assets |
|----------|--------|
| Bitcoin | BTC |
| BTC Treasuries | Strategy (MSTR), Metaplanet, Twenty One Capital, Capital B, Smarter Web Co. |
| Strategy Preferred | STRK, STRD, STRF, STRC |
| Market Indices | S&P 500 (SPY), Nasdaq 100 (QQQ) |

## Getting started

```bash
git clone https://github.com/your-username/bitcoin-benchmark.git
cd bitcoin-benchmark
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Built with

- [Vue 3](https://vuejs.org/) + TypeScript
- [Pinia](https://pinia.vuejs.org/) for state management
- [Chart.js](https://www.chartjs.org/) for charts
- [Vite](https://vite.dev/) for dev server and builds
- Market data from Yahoo Finance
