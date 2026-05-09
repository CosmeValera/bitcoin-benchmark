import type { Asset, PricePoint } from '@/types'

export type DisplayCurrency = 'USD' | 'EUR' | 'BTC' | 'sats'

function sortedRates(rates: Map<string, number>): [string, number][] {
  return [...rates.entries()].sort(([a], [b]) => a.localeCompare(b))
}

function rateForDate(date: string, entries: [string, number][]): number | undefined {
  if (entries.length === 0) return undefined

  let last: number | undefined
  for (const [rateDate, rate] of entries) {
    if (rateDate > date) return last ?? rate
    last = rate
  }
  return last
}

export function convertUsdValue(
  usd: number,
  date: string,
  currency: DisplayCurrency,
  btcPrices: Map<string, number>,
  eurRate: Map<string, number>,
): number {
  if (currency === 'USD') return usd

  const rates = sortedRates(currency === 'EUR' ? eurRate : btcPrices)
  const rate = rateForDate(date, rates)
  if (!rate) return usd

  if (currency === 'EUR') return usd / rate
  if (currency === 'BTC') return usd / rate
  return (usd / rate) * 1e8
}

export function adjustedPricePoints(
  asset: Asset,
  prices: PricePoint[],
  currency: DisplayCurrency,
  btcPrices: Map<string, number>,
  eurRate: Map<string, number>,
  includeDividends: boolean,
): PricePoint[] {
  if (prices.length === 0) return []

  const firstDate = new Date(prices[0].date)
  return prices.map((point) => {
    let usdValue = point.price

    if (includeDividends && asset.dividendRate && asset.parValue) {
      const dayDate = new Date(point.date)
      const years = Math.max(0, (dayDate.getTime() - firstDate.getTime()) / (365.25 * 86400000))
      usdValue += asset.dividendRate * asset.parValue * years
    }

    return {
      date: point.date,
      price: convertUsdValue(usdValue, point.date, currency, btcPrices, eurRate),
    }
  })
}

export function normalizedAdjustedReturns(
  asset: Asset,
  prices: PricePoint[],
  currency: DisplayCurrency,
  btcPrices: Map<string, number>,
  eurRate: Map<string, number>,
  includeDividends: boolean,
): number[] {
  const adjusted = adjustedPricePoints(asset, prices, currency, btcPrices, eurRate, includeDividends)
  if (adjusted.length === 0) return []

  const base = adjusted[0].price
  if (base <= 0) return adjusted.map(() => 0)
  return adjusted.map((point) => ((point.price - base) / base) * 100)
}
