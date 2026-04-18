import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useBitcoinPrice } from '@/composables/useBitcoinPrice'
import { useCalculator, type SimulationResult } from '@/composables/useCalculator'

export const useSimulationStore = defineStore('simulation', () => {
  const { prices, loading, error, fetchPrices } = useBitcoinPrice()
  const { simulate } = useCalculator()

  const monthlyInvestment = ref(100)
  const frequencyDays = ref(30)
  const startDate = ref('2020-01-01')
  const endDate = ref(new Date().toISOString().slice(0, 10))
  const result = ref<SimulationResult | null>(null)
  const hasRun = ref(false)

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

  return {
    monthlyInvestment,
    frequencyDays,
    startDate,
    endDate,
    result,
    hasRun,
    loading,
    error,
    prices,
    runSimulation,
    formatCurrency,
    formatBtc,
  }
})
