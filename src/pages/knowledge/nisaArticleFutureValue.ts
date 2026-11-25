import { calculateFutureValue } from '../../nisaCalculation'

export const ARTICLE_CHART_MAX_MAN = 3000
export const ARTICLE_CHART_YEARS = [5, 10, 15, 20] as const
export type ArticleFutureValueSeries = {
  monthly: number
  points: { years: number; principal: number; gain: number; total: number }[]
}

// Reuse the unchanged simulator engine: annual effective rate, end-of-month deposits.
// No prior NISA use, no sale/reuse and no deposits above the acquisition-cost limit.
export const articleFutureValueSeries: ArticleFutureValueSeries[] = [10000, 50000, 100000].map(monthly => ({
  monthly,
  points: ARTICLE_CHART_YEARS.filter(years => monthly * years * 12 <= 18000000).map(years => {
    const result = calculateFutureValue({ monthlyContribution: monthly, annualRatePercent: 5, months: years * 12 })
    return { years, principal: result.principal, gain: result.gain, total: result.futureValue }
  }),
}))
