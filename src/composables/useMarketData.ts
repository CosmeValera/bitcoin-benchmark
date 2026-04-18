import type { PricePoint } from '@/types'

const cache = new Map<string, PricePoint[]>()

export function useMarketData() {
  async function fetchChartData(
    ticker: string,
    period1: number,
    period2: number,
  ): Promise<PricePoint[]> {
    const url = `/api/yahoo/v8/finance/chart/${encodeURIComponent(ticker)}?period1=${period1}&period2=${period2}&interval=1d`
    const res = await fetch(url)

    if (!res.ok) {
      throw new Error(`Failed to fetch ${ticker}: ${res.status}`)
    }

    const json = await res.json()
    const result = json.chart?.result?.[0]

    if (!result || !result.timestamp) {
      return []
    }

    const timestamps: number[] = result.timestamp
    const closes: (number | null)[] = result.indicators.quote[0].close

    const prices: PricePoint[] = []
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i]
      if (close != null) {
        const d = new Date(timestamps[i] * 1000)
        prices.push({
          date: d.toISOString().slice(0, 10),
          price: close,
        })
      }
    }

    return prices
  }

  async function fetchAssetPrices(
    ticker: string,
    from: Date,
    to: Date,
  ): Promise<PricePoint[]> {
    const period1 = Math.floor(from.getTime() / 1000)
    const period2 = Math.floor(to.getTime() / 1000)
    const cacheKey = `${ticker}-${period1}-${period2}`

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!
    }

    // Try the requested range first
    let prices = await fetchChartData(ticker, period1, period2)

    // If no data, try progressively shorter fallback periods
    // This helps newer assets (e.g., recently IPO'd stocks) return
    // whatever data is available instead of showing an error
    if (prices.length === 0) {
      const fallbackStarts = [
        new Date(to.getFullYear() - 2, to.getMonth(), to.getDate()),
        new Date(to.getFullYear() - 1, to.getMonth(), to.getDate()),
        new Date(to.getFullYear(), to.getMonth() - 6, to.getDate()),
        new Date(to.getFullYear(), to.getMonth() - 3, to.getDate()),
      ]

      for (const fallbackFrom of fallbackStarts) {
        if (fallbackFrom.getTime() <= from.getTime()) continue // skip if not shorter
        const fb1 = Math.floor(fallbackFrom.getTime() / 1000)
        prices = await fetchChartData(ticker, fb1, period2)
        if (prices.length > 0) break
      }
    }

    if (prices.length === 0) {
      throw new Error(`No data available for ${ticker}`)
    }

    cache.set(cacheKey, prices)
    return prices
  }

  function normalizeReturns(prices: PricePoint[]): number[] {
    if (prices.length === 0) return []
    const base = prices[0].price
    return prices.map((p) => ((p.price - base) / base) * 100)
  }

  function calcVolatility(prices: PricePoint[]): number {
    if (prices.length < 2) return 0
    const returns: number[] = []
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i].price - prices[i - 1].price) / prices[i - 1].price)
    }
    const mean = returns.reduce((s, r) => s + r, 0) / returns.length
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length
    return Math.sqrt(variance * 252) * 100 // annualized
  }

  return { fetchAssetPrices, normalizeReturns, calcVolatility }
}
