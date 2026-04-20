export interface ProjectionResult {
  years: number[]
  portfolioValues: number[]
  totalContributions: number[]
  totalInterest: number[]
  finalValue: number
  totalContributed: number
  totalInterestEarned: number
  effectiveGrowth: number
}

export function useProjection() {
  function project(
    initialInvestment: number,
    monthlyContribution: number,
    annualReturnPct: number,
    investmentYears: number,
    compoundingFrequency: number, // times per year (1=annually, 4=quarterly, 12=monthly, 365=daily)
  ): ProjectionResult {
    const r = annualReturnPct / 100
    const n = compoundingFrequency

    const years: number[] = []
    const portfolioValues: number[] = []
    const totalContributions: number[] = []
    const totalInterest: number[] = []

    // Generate data points for each month
    const totalMonths = investmentYears * 12
    for (let m = 0; m <= totalMonths; m++) {
      const t = m / 12 // time in years

      // Future value of initial investment: P * (1 + r/n)^(nt)
      const fvInitial = initialInvestment * Math.pow(1 + r / n, n * t)

      // Future value of monthly contributions (annuity)
      // Each monthly contribution compounds from its deposit date
      let fvContributions = 0
      for (let k = 1; k <= m; k++) {
        const timeLeft = (m - k) / 12
        fvContributions += monthlyContribution * Math.pow(1 + r / n, n * timeLeft)
      }

      const totalValue = fvInitial + fvContributions
      const contributed = initialInvestment + monthlyContribution * m

      years.push(t)
      portfolioValues.push(totalValue)
      totalContributions.push(contributed)
      totalInterest.push(totalValue - contributed)
    }

    const finalValue = portfolioValues[portfolioValues.length - 1]
    const totalContributed = totalContributions[totalContributions.length - 1]
    const totalInterestEarned = finalValue - totalContributed
    const effectiveGrowth = totalContributed > 0 ? ((finalValue - totalContributed) / totalContributed) * 100 : 0

    return {
      years,
      portfolioValues,
      totalContributions,
      totalInterest,
      finalValue,
      totalContributed,
      totalInterestEarned,
      effectiveGrowth,
    }
  }

  return { project }
}
