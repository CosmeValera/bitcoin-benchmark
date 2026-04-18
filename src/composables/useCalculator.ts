import type { PricePoint } from './useBitcoinPrice'

export interface SimulationResult {
  dates: string[]
  dcaPortfolioValues: number[]
  lumpSumPortfolioValues: number[]
  dcaTotalInvested: number[]
  lumpSumTotalInvested: number
  dcaBtcAccumulated: number
  lumpSumBtcAccumulated: number
  dcaFinalValue: number
  lumpSumFinalValue: number
  dcaROI: number
  lumpSumROI: number
}

export function useCalculator() {
  function simulate(
    prices: PricePoint[],
    monthlyInvestment: number,
    frequencyDays: number,
  ): SimulationResult {
    if (prices.length === 0) {
      return emptyResult()
    }

    // Lump Sum: invest the equivalent total amount on day 1
    const totalDCAInvestments = Math.floor((prices.length - 1) / frequencyDays) + 1
    const totalLumpSum = monthlyInvestment * totalDCAInvestments
    const lumpSumBtc = totalLumpSum / prices[0].price

    // DCA: invest fixed amount every `frequencyDays` days
    let dcaBtc = 0
    let dcaInvested = 0
    let nextBuyIndex = 0

    const dates: string[] = []
    const dcaPortfolioValues: number[] = []
    const lumpSumPortfolioValues: number[] = []
    const dcaTotalInvested: number[] = []

    for (let i = 0; i < prices.length; i++) {
      const { date, price } = prices[i]

      if (i >= nextBuyIndex) {
        dcaBtc += monthlyInvestment / price
        dcaInvested += monthlyInvestment
        nextBuyIndex += frequencyDays
      }

      dates.push(date.toISOString().slice(0, 10))
      dcaPortfolioValues.push(dcaBtc * price)
      lumpSumPortfolioValues.push(lumpSumBtc * price)
      dcaTotalInvested.push(dcaInvested)
    }

    const dcaFinalValue = dcaPortfolioValues[dcaPortfolioValues.length - 1]
    const lumpSumFinalValue = lumpSumPortfolioValues[lumpSumPortfolioValues.length - 1]

    return {
      dates,
      dcaPortfolioValues,
      lumpSumPortfolioValues,
      dcaTotalInvested,
      lumpSumTotalInvested: totalLumpSum,
      dcaBtcAccumulated: dcaBtc,
      lumpSumBtcAccumulated: lumpSumBtc,
      dcaFinalValue,
      lumpSumFinalValue,
      dcaROI: ((dcaFinalValue - dcaInvested) / dcaInvested) * 100,
      lumpSumROI: ((lumpSumFinalValue - totalLumpSum) / totalLumpSum) * 100,
    }
  }

  return { simulate }
}

function emptyResult(): SimulationResult {
  return {
    dates: [],
    dcaPortfolioValues: [],
    lumpSumPortfolioValues: [],
    dcaTotalInvested: [],
    lumpSumTotalInvested: 0,
    dcaBtcAccumulated: 0,
    lumpSumBtcAccumulated: 0,
    dcaFinalValue: 0,
    lumpSumFinalValue: 0,
    dcaROI: 0,
    lumpSumROI: 0,
  }
}
