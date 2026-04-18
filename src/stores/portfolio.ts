import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  ASSETS,
  type AssetData,
  type TimeRange,
  type PricePoint,
  getDateForRange,
} from '@/types'
import { useMarketData } from '@/composables/useMarketData'

export interface PortfolioResult {
  assetData: AssetData[]
  blendedReturns: { date: string; value: number }[]
  totalReturn: number
  volatility: number
  maxDrawdown: number
}

export const usePortfolioStore = defineStore('portfolio', () => {
  const { fetchAssetPrices, normalizeReturns, calcVolatility } = useMarketData()

  // State – every asset starts at 0; always replace the whole object so Vue sees the change
  const initialWeights: Record<string, number> = {}
  for (const a of ASSETS) initialWeights[a.id] = 0
  const allocations = ref<Record<string, number>>(initialWeights)
  const timeRange = ref<TimeRange>('1Y')
  const customStartDate = ref('2020-01-01')
  const customEndDate = ref(new Date().toISOString().slice(0, 10))
  const result = ref<PortfolioResult | null>(null)
  const loading = ref(false)
  const errors = ref<Map<string, string>>(new Map())
  const hasRun = ref(false)

  // Computed
  const totalWeight = computed(() => {
    let sum = 0
    for (const w of Object.values(allocations.value)) sum += w
    return sum
  })

  const isValid = computed(() => totalWeight.value > 0)

  const startDate = computed(() => {
    if (timeRange.value === 'CUSTOM') return new Date(customStartDate.value)
    return getDateForRange(timeRange.value)
  })

  const endDate = computed(() => {
    if (timeRange.value === 'CUSTOM') return new Date(customEndDate.value)
    return new Date()
  })

  // Actions — always assign a new object so Vue detects the change
  function setWeight(assetId: string, weight: number) {
    allocations.value = { ...allocations.value, [assetId]: Math.max(0, weight) }
  }

  function applyPreset(preset: Record<string, number>) {
    const next: Record<string, number> = {}
    for (const a of ASSETS) next[a.id] = 0
    Object.assign(next, preset)
    allocations.value = next
  }

  function setTimeRange(range: TimeRange) {
    timeRange.value = range
  }

  async function runPortfolio() {
    if (!isValid.value) return

    loading.value = true
    errors.value = new Map()

    const from = startDate.value
    const to = endDate.value
    const assetResults: AssetData[] = []

    const activeIds = Object.entries(allocations.value).filter(([, w]) => w > 0).map(([id]) => id)
    const fetches = activeIds.map(async (assetId) => {
      const asset = ASSETS.find((a) => a.id === assetId)
      if (!asset) return
      try {
        const prices = await fetchAssetPrices(asset.ticker, from, to)
        if (prices.length === 0) {
          errors.value.set(assetId, `No data for ${asset.name}`)
          return
        }
        assetResults.push({
          asset,
          prices,
          normalizedReturns: normalizeReturns(prices),
        })
      } catch (e) {
        errors.value.set(assetId, e instanceof Error ? e.message : `Failed to fetch ${asset.name}`)
      }
    })

    await Promise.all(fetches)

    // Normalize weights so they sum to 100% internally
    const activeWeights = Object.entries(allocations.value).filter(([, w]) => w > 0)
    const rawTotal = activeWeights.reduce((s, [, w]) => s + w, 0)
    const normalizedWeights: Record<string, number> = {}
    for (const [id, w] of activeWeights) {
      normalizedWeights[id] = (w / rawTotal) * 100
    }

    // Build blended returns
    // Build date→return lookup per asset for O(1) access
    const assetDateMaps: Map<string, Map<string, number>> = new Map()
    for (const ad of assetResults) {
      const dateMap = new Map<string, number>()
      for (let i = 0; i < ad.prices.length; i++) {
        dateMap.set(ad.prices[i].date, ad.normalizedReturns[i])
      }
      assetDateMaps.set(ad.asset.id, dateMap)
    }

    // Use only dates where ALL assets have data (intersection, not union)
    // This prevents the blended return from being skewed by missing data
    let commonDates: string[] | null = null
    for (const ad of assetResults) {
      const dates = new Set(ad.prices.map((p) => p.date))
      if (commonDates === null) {
        commonDates = [...dates]
      } else {
        commonDates = commonDates.filter((d) => dates.has(d))
      }
    }
    const allDates = commonDates ? commonDates.sort() : []

    // For each date, compute weighted average of normalized returns
    const blendedReturns: { date: string; value: number }[] = []
    let totalAllocWeight = 0
    for (const id of Object.keys(normalizedWeights)) {
      if (assetResults.some((a) => a.asset.id === id)) totalAllocWeight += normalizedWeights[id]
    }

    for (const date of allDates) {
      let weightedReturn = 0
      for (const ad of assetResults) {
        const weight = normalizedWeights[ad.asset.id] ?? 0
        const ret = assetDateMaps.get(ad.asset.id)?.get(date)
        if (ret != null) {
          weightedReturn += (ret * weight) / totalAllocWeight
        }
      }
      blendedReturns.push({ date, value: weightedReturn })
    }

    // Compute portfolio-level metrics
    const totalReturn = blendedReturns.length > 0 ? blendedReturns[blendedReturns.length - 1].value : 0

    // Portfolio volatility from blended daily returns
    const blendedPrices: PricePoint[] = blendedReturns.map((br) => ({
      date: br.date,
      price: 100 + br.value, // synthetic price starting at 100
    }))
    const volatility = calcVolatility(blendedPrices)

    // Max drawdown
    let peak = -Infinity
    let maxDD = 0
    for (const br of blendedReturns) {
      if (br.value > peak) peak = br.value
      const dd = peak - br.value
      if (dd > maxDD) maxDD = dd
    }

    result.value = {
      assetData: assetResults,
      blendedReturns,
      totalReturn,
      volatility,
      maxDrawdown: maxDD,
    }
    hasRun.value = true
    loading.value = false
  }

  return {
    allocations,
    timeRange,
    customStartDate,
    customEndDate,
    result,
    loading,
    errors,
    hasRun,
    totalWeight,
    isValid,
    setWeight,
    applyPreset,
    setTimeRange,
    runPortfolio,
  }
})
