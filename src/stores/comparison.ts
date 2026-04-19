import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import {
  ASSETS,
  type Asset,
  type AssetData,
  type PerformanceMetrics,
  type TimeRange,
  getDateForRange,
} from '@/types'
import { useMarketData } from '@/composables/useMarketData'

// Rotating palette for custom assets
const CUSTOM_COLORS = [
  '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#ec4899',
  '#14b8a6', '#eab308', '#6366f1', '#d946ef', '#0ea5e9',
]

export const useComparisonStore = defineStore('comparison', () => {
  const { fetchAssetPrices, normalizeReturns, calcVolatility } = useMarketData()

  // State
  const selectedIds = ref<Set<string>>(new Set(['btc', 'mstr', 'spy']))
  const customAssets = ref<Asset[]>([])
  const timeRange = ref<TimeRange>('1Y')
  const customStartDate = ref('2020-01-01')
  const customEndDate = ref(new Date().toISOString().slice(0, 10))
  const assetsData = ref<AssetData[]>([])
  const loading = ref(false)
  const errors = ref<Map<string, string>>(new Map())
  const hasRun = ref(false)
  const showDividendAdjusted = ref(false)
  const showDrawdown = ref(false)
  const autoRun = ref(localStorage.getItem('autoRun') !== 'false')
  const displayCurrency = ref<'USD' | 'BTC' | 'sats' | 'EUR'>('USD')
  const btcPrices = ref<Map<string, number>>(new Map()) // date → BTC price in USD
  const eurRate = ref<Map<string, number>>(new Map()) // date → EUR per USD

  // Computed
  const allAssets = computed(() => [...ASSETS, ...customAssets.value])

  const selectedAssets = computed(() =>
    allAssets.value.filter((a) => selectedIds.value.has(a.id)),
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
      let totalReturn = startPrice > 0 ? ((currentPrice - startPrice) / startPrice) * 100 : 0

      // Add cumulative dividend income if toggle is on
      if (showDividendAdjusted.value && asset.dividendRate && asset.parValue && prices.length >= 2) {
        const firstDate = new Date(prices[0].date)
        const lastDate = new Date(prices[prices.length - 1].date)
        const years = (lastDate.getTime() - firstDate.getTime()) / (365.25 * 86400000)
        const dividendPerShare = asset.dividendRate * asset.parValue * years
        totalReturn += (dividendPerShare / startPrice) * 100
      }

      return {
        asset,
        totalReturn,
        currentPrice,
        startPrice,
        high: Math.max(...allPrices),
        low: Math.min(...allPrices),
        volatility: calcVolatility(prices),
      }
    })
  })

  const drawdownData = computed(() => {
    return assetsData.value.map(({ asset, prices }) => {
      const allPrices = prices.map((p) => p.price)
      let peak = -Infinity
      const drawdowns = allPrices.map((price) => {
        if (price > peak) peak = price
        return ((price - peak) / peak) * 100
      })
      return { asset, drawdowns, dates: prices.map((p) => p.date) }
    })
  })

  // Actions
  function addCustomAsset(ticker: string) {
    const normalized = ticker.trim().toUpperCase()
    if (!normalized) return false
    const id = `custom_${normalized.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    if (ASSETS.some((a) => a.ticker.toUpperCase() === normalized)) return false
    if (customAssets.value.some((a) => a.ticker.toUpperCase() === normalized)) return false

    const colorIdx = customAssets.value.length % CUSTOM_COLORS.length
    const asset: Asset = {
      id,
      ticker: normalized,
      name: normalized,
      category: 'index',
      color: CUSTOM_COLORS[colorIdx],
      description: `Custom asset: ${normalized}`,
    }
    customAssets.value = [...customAssets.value, asset]
    // Auto-select the new custom asset
    const next = new Set(selectedIds.value)
    next.add(id)
    selectedIds.value = next
    return true
  }

  function removeCustomAsset(id: string) {
    customAssets.value = customAssets.value.filter((a) => a.id !== id)
    const next = new Set(selectedIds.value)
    next.delete(id)
    selectedIds.value = next
  }

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

  function initFromUrl() {
    const params = new URLSearchParams(window.location.search)
    const assetsParam = params.get('assets')
    const rangeParam = params.get('range') as TimeRange | null
    if (assetsParam) {
      const ids = assetsParam.split(',').filter((id) => allAssets.value.some((a) => a.id === id))
      if (ids.length > 0) selectedIds.value = new Set(ids)
    }
    if (rangeParam) {
      const validRanges: TimeRange[] = ['1M', '3M', '6M', 'YTD', '1Y', '2Y', '3Y', '5Y', 'ALL', 'CUSTOM']
      if (validRanges.includes(rangeParam)) timeRange.value = rangeParam
    }
    if (rangeParam === 'CUSTOM') {
      const from = params.get('from')
      const to = params.get('to')
      if (from) customStartDate.value = from
      if (to) customEndDate.value = to
    }
  }

  function convertPrice(usd: number, date?: string): number {
    if (displayCurrency.value === 'USD') return usd
    if (displayCurrency.value === 'BTC') {
      const btc = date ? btcPrices.value.get(date) : getLatestBtcPrice()
      return btc ? usd / btc : usd
    }
    if (displayCurrency.value === 'sats') {
      const btc = date ? btcPrices.value.get(date) : getLatestBtcPrice()
      return btc ? (usd / btc) * 1e8 : usd
    }
    if (displayCurrency.value === 'EUR') {
      const rate = date ? eurRate.value.get(date) : getLatestEurRate()
      return rate ? usd * rate : usd
    }
    return usd
  }

  function getLatestBtcPrice(): number | undefined {
    const entries = [...btcPrices.value.entries()]
    return entries.length > 0 ? entries[entries.length - 1][1] : undefined
  }

  function getLatestEurRate(): number | undefined {
    const entries = [...eurRate.value.entries()]
    return entries.length > 0 ? entries[entries.length - 1][1] : undefined
  }

  function currencySymbol(): string {
    switch (displayCurrency.value) {
      case 'USD': return '$'
      case 'BTC': return '₿'
      case 'sats': return 'sats '
      case 'EUR': return '€'
    }
  }

  function toShareUrl(): string {
    const url = new URL(window.location.href.split('?')[0])
    url.searchParams.set('assets', [...selectedIds.value].join(','))
    url.searchParams.set('range', timeRange.value)
    if (timeRange.value === 'CUSTOM') {
      url.searchParams.set('from', customStartDate.value)
      url.searchParams.set('to', customEndDate.value)
    }
    return url.toString()
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

    // Always fetch BTC prices for currency conversion
    const btcFetch = fetchAssetPrices('BTC-USD', from, to)
      .then((prices) => {
        const map = new Map<string, number>()
        for (const p of prices) map.set(p.date, p.price)
        btcPrices.value = map
      })
      .catch(() => {})

    // Fetch EUR rate if needed
    const eurFetch = fetchAssetPrices('EURUSD=X', from, to)
      .then((prices) => {
        const map = new Map<string, number>()
        for (const p of prices) map.set(p.date, p.price)
        eurRate.value = map
      })
      .catch(() => {})

    await Promise.all([...fetches, btcFetch, eurFetch])

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

  // Auto-run: debounced watcher
  let autoRunTimer: ReturnType<typeof setTimeout> | null = null
  watch(
    () => ({
      ids: [...selectedIds.value],
      range: timeRange.value,
      start: customStartDate.value,
      end: customEndDate.value,
      div: showDividendAdjusted.value,
    }),
    () => {
      if (!autoRun.value || !hasRun.value) return
      if (loading.value) return
      if (autoRunTimer) clearTimeout(autoRunTimer)
      autoRunTimer = setTimeout(() => {
        runComparison()
      }, 800)
    },
    { deep: true },
  )

  watch(autoRun, (v) => {
    localStorage.setItem('autoRun', String(v))
  })

  return {
    selectedIds,
    customAssets,
    allAssets,
    timeRange,
    customStartDate,
    customEndDate,
    assetsData,
    loading,
    errors,
    hasRun,
    showDividendAdjusted,
    showDrawdown,
    autoRun,
    displayCurrency,
    btcPrices,
    eurRate,
    selectedAssets,
    metrics,
    drawdownData,
    addCustomAsset,
    removeCustomAsset,
    toggleAsset,
    setTimeRange,
    convertPrice,
    currencySymbol,
    initFromUrl,
    toShareUrl,
    runComparison,
  }
})
