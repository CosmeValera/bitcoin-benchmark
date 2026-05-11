import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useBitcoinPrice } from '@/composables/useBitcoinPrice'
import { useCalculator, type SimulationResult } from '@/composables/useCalculator'
import { getDateForRange, type TimeRange } from '@/types'

interface SimulationPersistedState {
  monthlyInvestment: number
  frequencyDays: number
  timeRange: TimeRange
  customStartDate: string
  customEndDate: string
}

const SIMULATION_STORAGE_KEY = 'dcaHistoricalState'
const VALID_TIME_RANGES: TimeRange[] = ['1M', '3M', '6M', 'YTD', '1Y', '2Y', '3Y', '5Y', 'ALL', 'CUSTOM']

function readSimulationState(): Partial<SimulationPersistedState> {
  try {
    const raw = localStorage.getItem(SIMULATION_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export const useSimulationStore = defineStore('simulation', () => {
  const { prices, loading, error, fetchPrices } = useBitcoinPrice()
  const { simulate } = useCalculator()
  const persisted = readSimulationState()

  const monthlyInvestment = ref(typeof persisted.monthlyInvestment === 'number' ? persisted.monthlyInvestment : 100)
  const frequencyDays = ref(typeof persisted.frequencyDays === 'number' ? persisted.frequencyDays : 30)
  const timeRange = ref<TimeRange>(
    persisted.timeRange && VALID_TIME_RANGES.includes(persisted.timeRange) ? persisted.timeRange : '3Y',
  )
  const customStartDate = ref(typeof persisted.customStartDate === 'string' ? persisted.customStartDate : '2020-01-01')
  const customEndDate = ref(typeof persisted.customEndDate === 'string' ? persisted.customEndDate : new Date().toISOString().slice(0, 10))
  const autoRun = ref(localStorage.getItem('autoRunSimulation') !== 'false')
  const result = ref<SimulationResult | null>(null)
  const hasRun = ref(false)

  const startDate = computed(() => {
    if (timeRange.value === 'CUSTOM') return customStartDate.value
    return getDateForRange(timeRange.value).toISOString().slice(0, 10)
  })

  const endDate = computed(() => {
    if (timeRange.value === 'CUSTOM') return customEndDate.value
    return new Date().toISOString().slice(0, 10)
  })

  function setTimeRange(range: TimeRange) {
    timeRange.value = range
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const formatBtc = (n: number) => n.toFixed(8)

  async function runSimulation() {
    const from = new Date(startDate.value)
    const to = new Date(endDate.value)

    const priceData = await fetchPrices(from, to)
    if (priceData.length > 0) {
      result.value = simulate(priceData, monthlyInvestment.value, frequencyDays.value)
      hasRun.value = true
    }
  }

  watch(autoRun, (v) => {
    localStorage.setItem('autoRunSimulation', String(v))
  })

  watch(
    () => ({
      monthlyInvestment: monthlyInvestment.value,
      frequencyDays: frequencyDays.value,
      timeRange: timeRange.value,
      customStartDate: customStartDate.value,
      customEndDate: customEndDate.value,
    }),
    (state) => {
      localStorage.setItem(SIMULATION_STORAGE_KEY, JSON.stringify(state))
    },
    { deep: true },
  )

  let simAutoTimer: ReturnType<typeof setTimeout> | null = null
  watch(
    () => ({
      range: timeRange.value,
      start: customStartDate.value,
      end: customEndDate.value,
      investment: monthlyInvestment.value,
      freq: frequencyDays.value,
    }),
    () => {
      if (!autoRun.value || !hasRun.value) return
      if (loading.value) return
      if (simAutoTimer) clearTimeout(simAutoTimer)
      simAutoTimer = setTimeout(() => {
        runSimulation()
      }, 800)
    },
    { deep: true },
  )

  return {
    monthlyInvestment,
    frequencyDays,
    timeRange,
    customStartDate,
    customEndDate,
    autoRun,
    startDate,
    endDate,
    result,
    hasRun,
    loading,
    error,
    prices,
    setTimeRange,
    runSimulation,
    formatCurrency,
    formatBtc,
  }
})
