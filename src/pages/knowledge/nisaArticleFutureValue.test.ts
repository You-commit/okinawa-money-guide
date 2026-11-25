import { describe, expect, it } from 'vitest'
import { ARTICLE_CHART_MAX_MAN, ARTICLE_CHART_YEARS, articleFutureValueSeries } from './nisaArticleFutureValue'

describe('NISA article accurate chart', () => {
  it('matches an independent month-by-month accumulation for all eleven points', () => {
    const r = Math.pow(1.05, 1 / 12) - 1
    expect(articleFutureValueSeries.flatMap(s => s.points)).toHaveLength(11)
    for (const { monthly, points } of articleFutureValueSeries) {
      for (const p of points) {
        let total = 0
        for (let i = 0; i < p.years * 12; i++) total = total * (1 + r) + monthly
        expect(p.total).toBeCloseTo(total, 5)
        expect(p.principal).toBe(monthly * p.years * 12)
        expect(p.gain + p.principal).toBeCloseTo(p.total, 5)
        expect(p.total).toBeLessThanOrEqual(ARTICLE_CHART_MAX_MAN * 10000)
        expect(p.principal).toBeLessThanOrEqual(18000000)
      }
    }
  })
  it('uses one common axis, time scale, and does not imply a 20-year 10万円 contribution', () => {
    expect(ARTICLE_CHART_MAX_MAN).toBe(3000)
    expect(ARTICLE_CHART_YEARS).toEqual([5, 10, 15, 20])
    expect(articleFutureValueSeries.map(s => s.points.length)).toEqual([4, 4, 3])
    const a = articleFutureValueSeries[0]!.points[3]!.total
    const b = articleFutureValueSeries[1]!.points[3]!.total
    expect(b / a).toBeCloseTo(5, 10)
  })
})
