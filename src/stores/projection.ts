import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useProjection, type ProjectionResult } from '@/composables/useProjection'

export const useProjectionStore = defineStore('projection', () => {
  const { project } = useProjection()

  const initialInvestment = ref(1000)
  const monthlyContribution = ref(100)
  const annualReturn = ref(10)
  const investmentYears = ref(10)
  const compoundingFrequency = ref(12) // monthly
  const autoRun = ref(localStorage.getItem('autoRunProjection') === 'true')

  const result = ref<ProjectionResult | null>(null)
  const hasRun = ref(false)

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  function runProjection() {
    result.value = project(
      initialInvestment.value,
      monthlyContribution.value,
      annualReturn.value,
      investmentYears.value,
      compoundingFrequency.value,
    )
    hasRun.value = true
  }

  watch(autoRun, (v) => {
    localStorage.setItem('autoRunProjection', String(v))
  })

  watch(
    () => ({
      initial: initialInvestment.value,
      monthly: monthlyContribution.value,
      rate: annualReturn.value,
      years: investmentYears.value,
      freq: compoundingFrequency.value,
    }),
    () => {
      if (autoRun.value && hasRun.value) runProjection()
    },
    { deep: true },
  )

  return {
    initialInvestment,
    monthlyContribution,
    annualReturn,
    investmentYears,
    compoundingFrequency,
    autoRun,
    result,
    hasRun,
    runProjection,
    formatCurrency,
  }
})
