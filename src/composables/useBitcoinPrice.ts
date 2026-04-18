import { ref } from 'vue'

export interface PricePoint {
  date: Date
  price: number
}

const cache = new Map<string, PricePoint[]>()

export function useBitcoinPrice() {
  const prices = ref<PricePoint[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPrices(from: Date, to: Date): Promise<PricePoint[]> {
    const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
    const timespan = `${diffDays}days`
    const cacheKey = `${from.toISOString()}-${to.toISOString()}`

    if (cache.has(cacheKey)) {
      prices.value = cache.get(cacheKey)!
      return prices.value
    }

    loading.value = true
    error.value = null

    try {
      // Blockchain.info charts API — free, no auth required
      const url = `https://api.blockchain.info/charts/market-price?timespan=${timespan}&rollingAverage=1days&format=json&cors=true`
      const res = await fetch(url)

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }

      const data = await res.json()
      const allPoints: PricePoint[] = data.values.map((d: { x: number; y: number }) => ({
        date: new Date(d.x * 1000),
        price: d.y,
      }))

      // Filter to the requested date range
      const filtered = allPoints.filter((p) => p.date >= from && p.date <= to)
      const daily = reduceToDailyPrices(filtered)

      cache.set(cacheKey, daily)
      prices.value = daily
      return daily
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch prices'
      return []
    } finally {
      loading.value = false
    }
  }

  return { prices, loading, error, fetchPrices }
}

function reduceToDailyPrices(points: PricePoint[]): PricePoint[] {
  const seen = new Set<string>()
  return points.filter((p) => {
    const key = p.date.toISOString().slice(0, 10)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
