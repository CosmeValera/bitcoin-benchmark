import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  ASSETS,
  type Asset,
  type AssetData,
  type TimeRange,
  type PricePoint,
  getDateForRange,
} from '@/types'
import { useMarketData } from '@/composables/useMarketData'

// Rotating palette for custom assets
const CUSTOM_COLORS = [
  '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#ec4899',
  '#14b8a6', '#eab308', '#6366f1', '#d946ef', '#0ea5e9',
]

export interface PortfolioResult {
  assetData: AssetData[]
  blendedReturns: { date: string; value: number }[]
  totalReturn: number
  volatility: number
  maxDrawdown: number
  maxDrawdownDate: string
  sharpeRatio: number
}

export const usePortfolioStore = defineStore('portfolio', () => {
  const { fetchAssetPrices, normalizeReturns, calcVolatility } = useMarketData()

  // State – default portfolio: BTC 30%, MSTR 20%, SPY 50%
  const initialWeights: Record<string, number> = {}
  for (const a of ASSETS) initialWeights[a.id] = 0
  initialWeights['btc'] = 30
  initialWeights['mstr'] = 20
  initialWeights['spy'] = 50
  const allocations = ref<Record<string, number>>(initialWeights)
  const customAssets = ref<Asset[]>([])
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

  // All assets: built-in + custom
  const allAssets = computed(() => [...ASSETS, ...customAssets.value])

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
    for (const a of customAssets.value) next[a.id] = 0
    Object.assign(next, preset)
    allocations.value = next
  }

  function addCustomAsset(ticker: string) {
    const normalized = ticker.trim().toUpperCase()
    if (!normalized) return false
    const id = `custom_${normalized.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    // Check if already exists (built-in or custom)
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
    allocations.value = { ...allocations.value, [id]: 0 }
    return true
  }

  function removeCustomAsset(id: string) {
    customAssets.value = customAssets.value.filter((a) => a.id !== id)
    const next = { ...allocations.value }
    delete next[id]
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
    const all = allAssets.value
    const fetches = activeIds.map(async (assetId) => {
      const asset = all.find((a) => a.id === assetId)
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
    const allDateSet = new Set<string>()
    for (const ad of assetResults) {
      const dateMap = new Map<string, number>()
      for (let i = 0; i < ad.prices.length; i++) {
        dateMap.set(ad.prices[i].date, ad.normalizedReturns[i])
        allDateSet.add(ad.prices[i].date)
      }
      assetDateMaps.set(ad.asset.id, dateMap)
    }

    // Union of all dates — show the full time range
    const allDates = [...allDateSet].sort()

    // For each date, blend assets using last known value for gaps (weekends/holidays).
    // This avoids spikes when only BTC has data on a weekend.
    const blendedReturns: { date: string; value: number }[] = []
    const lastKnown = new Map<string, number>() // asset id → last normalized return

    for (const date of allDates) {
      // Update last known values for assets that have data today
      for (const ad of assetResults) {
        const ret = assetDateMaps.get(ad.asset.id)?.get(date)
        if (ret != null) {
          lastKnown.set(ad.asset.id, ret)
        }
      }

      // Blend all assets that have ever had data (using carried-forward values)
      let availableWeightSum = 0
      const available: { weight: number; ret: number }[] = []
      for (const ad of assetResults) {
        const ret = lastKnown.get(ad.asset.id)
        if (ret != null) {
          const weight = normalizedWeights[ad.asset.id] ?? 0
          availableWeightSum += weight
          available.push({ weight, ret })
        }
      }
      if (availableWeightSum > 0) {
        let weightedReturn = 0
        for (const { weight, ret } of available) {
          weightedReturn += (ret * weight) / availableWeightSum
        }
        blendedReturns.push({ date, value: weightedReturn })
      }
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
    let maxDDDate = ''
    for (const br of blendedReturns) {
      if (br.value > peak) peak = br.value
      const dd = peak - br.value
      if (dd > maxDD) {
        maxDD = dd
        maxDDDate = br.date
      }
    }

    // Sharpe ratio (annualized, risk-free rate ~4.5%)
    const tradingDays = blendedReturns.length
    const years = tradingDays / 252
    const annualizedReturn = years > 0 ? ((1 + totalReturn / 100) ** (1 / years) - 1) * 100 : 0
    const riskFreeRate = 4.5
    const sharpeRatio = volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0

    result.value = {
      assetData: assetResults,
      blendedReturns,
      totalReturn,
      volatility,
      maxDrawdown: maxDD,
      maxDrawdownDate: maxDDDate,
      sharpeRatio,
    }
    hasRun.value = true
    loading.value = false
  }

  function toShareUrl(): string {
    const url = new URL(window.location.href.split('?')[0])
    // Encode active weights
    const active = Object.entries(allocations.value).filter(([, w]) => w > 0)
    if (active.length > 0) {
      url.searchParams.set('w', active.map(([id, w]) => `${id}:${w}`).join(','))
    }
    // Encode custom asset tickers so receiver can recreate them
    if (customAssets.value.length > 0) {
      url.searchParams.set('custom', customAssets.value.map((a) => a.ticker).join(','))
    }
    url.searchParams.set('range', timeRange.value)
    if (timeRange.value === 'CUSTOM') {
      url.searchParams.set('from', customStartDate.value)
      url.searchParams.set('to', customEndDate.value)
    }
    return url.toString()
  }

  function initFromUrl() {
    const params = new URLSearchParams(window.location.search)

    // Restore custom assets first so their IDs exist for weight assignment
    const customParam = params.get('custom')
    if (customParam) {
      for (const ticker of customParam.split(',')) {
        addCustomAsset(ticker)
      }
    }

    const weightsParam = params.get('w')
    if (weightsParam) {
      // Zero out all weights, then apply from URL
      const next: Record<string, number> = {}
      for (const a of ASSETS) next[a.id] = 0
      for (const a of customAssets.value) next[a.id] = 0
      for (const entry of weightsParam.split(',')) {
        const [id, wStr] = entry.split(':')
        const w = parseFloat(wStr)
        if (id && !isNaN(w)) next[id] = w
      }
      allocations.value = next
    }

    const rangeParam = params.get('range') as TimeRange | null
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

  return {
    allocations,
    customAssets,
    allAssets,
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
    addCustomAsset,
    removeCustomAsset,
    setTimeRange,
    toShareUrl,
    initFromUrl,
    runPortfolio,
  }
})
