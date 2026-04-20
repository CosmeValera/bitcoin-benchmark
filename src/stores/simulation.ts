import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useBitcoinPrice } from '@/composables/useBitcoinPrice'
import { useCalculator, type SimulationResult } from '@/composables/useCalculator'
import { getDateForRange, type TimeRange } from '@/types'

export const useSimulationStore = defineStore('simulation', () => {
  const { prices, loading, error, fetchPrices } = useBitcoinPrice()
  const { simulate } = useCalculator()

  const monthlyInvestment = ref(100)
  const frequencyDays = ref(30)
  const timeRange = ref<TimeRange>('3Y')
  const customStartDate = ref('2020-01-01')
  const customEndDate = ref(new Date().toISOString().slice(0, 10))
  const autoRun = ref(localStorage.getItem('autoRunSimulation') === 'true')
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
      range: timeRange.value,
      start: customStartDate.value,
      end: customEndDate.value,
      investment: monthlyInvestment.value,
      freq: frequencyDays.value,
    }),
    () => {
      if (autoRun.value && hasRun.value) runSimulation()
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
