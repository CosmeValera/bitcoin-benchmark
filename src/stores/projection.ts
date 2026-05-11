import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useProjection, type ProjectionResult } from '@/composables/useProjection'

interface ProjectionPersistedState {
  initialInvestment: number
  monthlyContribution: number
  annualReturn: number
  investmentYears: number
  compoundingFrequency: number
}

const PROJECTION_STORAGE_KEY = 'dcaProjectionState'

function readProjectionState(): Partial<ProjectionPersistedState> {
  try {
    const raw = localStorage.getItem(PROJECTION_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export const useProjectionStore = defineStore('projection', () => {
  const { project } = useProjection()
  const persisted = readProjectionState()

  const initialInvestment = ref(typeof persisted.initialInvestment === 'number' ? persisted.initialInvestment : 1000)
  const monthlyContribution = ref(typeof persisted.monthlyContribution === 'number' ? persisted.monthlyContribution : 100)
  const annualReturn = ref(typeof persisted.annualReturn === 'number' ? persisted.annualReturn : 10)
  const investmentYears = ref(typeof persisted.investmentYears === 'number' ? persisted.investmentYears : 10)
  const compoundingFrequency = ref(typeof persisted.compoundingFrequency === 'number' ? persisted.compoundingFrequency : 12) // monthly
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
      initialInvestment: initialInvestment.value,
      monthlyContribution: monthlyContribution.value,
      annualReturn: annualReturn.value,
      investmentYears: investmentYears.value,
      compoundingFrequency: compoundingFrequency.value,
    }),
    (state) => {
      localStorage.setItem(PROJECTION_STORAGE_KEY, JSON.stringify(state))
    },
    { deep: true },
  )

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
