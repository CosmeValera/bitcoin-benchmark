import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  ASSETS,
  type Asset,
  type AssetData,
  type PerformanceMetrics,
  type TimeRange,
  getDateForRange,
} from '@/types'
import { useMarketData } from '@/composables/useMarketData'

export const useComparisonStore = defineStore('comparison', () => {
  const { fetchAssetPrices, normalizeReturns, calcVolatility } = useMarketData()

  // State
  const selectedIds = ref<Set<string>>(new Set(['btc', 'mstr', 'spy']))
  const timeRange = ref<TimeRange>('1Y')
  const customStartDate = ref('2020-01-01')
  const customEndDate = ref(new Date().toISOString().slice(0, 10))
  const assetsData = ref<AssetData[]>([])
  const loading = ref(false)
  const errors = ref<Map<string, string>>(new Map())
  const hasRun = ref(false)

  // Computed
  const selectedAssets = computed(() =>
    ASSETS.filter((a) => selectedIds.value.has(a.id)),
  )

  const startDate = computed(() => {
    if (timeRange.value === 'CUSTOM') return new Date(customStartDate.value)
    return getDateForRange(timeRange.value)
  })

  const endDate = computed(() => {
    if (timeRange.value === 'CUSTOM') return new Date(customEndDate.value)
    return new Date()
  })

  const metrics = computed<PerformanceMetrics[]>(() => {
    return assetsData.value.map(({ asset, prices }) => {
      const allPrices = prices.map((p) => p.price)
      const startPrice = allPrices[0] ?? 0
      const currentPrice = allPrices[allPrices.length - 1] ?? 0
      return {
        asset,
        totalReturn: startPrice > 0 ? ((currentPrice - startPrice) / startPrice) * 100 : 0,
        currentPrice,
        startPrice,
        high: Math.max(...allPrices),
        low: Math.min(...allPrices),
        volatility: calcVolatility(prices),
      }
    })
  })

  // Actions
  function toggleAsset(id: string) {
    const next = new Set(selectedIds.value)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    selectedIds.value = next
  }

  function setTimeRange(range: TimeRange) {
    timeRange.value = range
  }

  async function runComparison() {
    const assets = selectedAssets.value
    if (assets.length === 0) return

    loading.value = true
    errors.value = new Map()
    const results: AssetData[] = []

    const from = startDate.value
    const to = endDate.value

    const fetches = assets.map(async (asset) => {
      try {
        const prices = await fetchAssetPrices(asset.ticker, from, to)
        if (prices.length === 0) {
          errors.value.set(asset.id, `No data for ${asset.name}`)
          return
        }
        results.push({
          asset,
          prices,
          normalizedReturns: normalizeReturns(prices),
        })
      } catch (e) {
        errors.value.set(
          asset.id,
          e instanceof Error ? e.message : `Failed to fetch ${asset.name}`,
        )
      }
    })

    await Promise.all(fetches)

    // Sort to match the original asset order
    results.sort(
      (a, b) =>
        assets.findIndex((x) => x.id === a.asset.id) -
        assets.findIndex((x) => x.id === b.asset.id),
    )

    assetsData.value = results
    hasRun.value = true
    loading.value = false
  }

  return {
    selectedIds,
    timeRange,
    customStartDate,
    customEndDate,
    assetsData,
    loading,
    errors,
    hasRun,
    selectedAssets,
    metrics,
    toggleAsset,
    setTimeRange,
    runComparison,
  }
})
