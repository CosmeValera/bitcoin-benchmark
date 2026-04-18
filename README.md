# Bitcoin Benchmark

Compare Bitcoin against treasury stocks, preferred shares, and market indices, all in one chart with real historical data.

![Bitcoin Benchmark screenshot](image.png)

## What it does

Pick any combination of assets, choose a time range, and hit **Compare**. You get:

- A line chart showing normalized returns (% change from start date)
- A metrics table with return, price range, and volatility for each asset

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
