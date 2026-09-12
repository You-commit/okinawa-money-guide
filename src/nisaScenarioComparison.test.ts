import { describe, expect, it } from 'vitest'
import { roundHalfUp } from './nisaCalculation'
import {
  calculateNisaScenarioComparison,
  getNisaScenarioResults,
} from './nisaScenarioComparison'

const STANDARD_INPUT = {
  initialInvestment: 0,
  monthlyContribution: 10_000,
  months: 240,
  lowAnnualRatePercent: 3,
  baseAnnualRatePercent: 5,
  highAnnualRatePercent: 7,
}

describe('NISA scenario comparison', () => {
  it('uses the formal NISA calculation for low, base, and high rates', () => {
    const comparison = calculateNisaScenarioComparison(STANDARD_INPUT)

    expect(roundHalfUp(comparison.base.futureValue)).toBe(4_058_045)
    expect(comparison.low.futureValue).toBeLessThan(comparison.base.futureValue)
    expect(comparison.high.futureValue).toBeGreaterThan(comparison.base.futureValue)
    expect(new Set(getNisaScenarioResults(comparison).map(
      (scenario) => scenario.principal,
    ))).toEqual(new Set([2_400_000]))
  })

  it('accepts equal rates and produces equal scenario results', () => {
    const comparison = calculateNisaScenarioComparison({
      ...STANDARD_INPUT,
      lowAnnualRatePercent: 5,
      highAnnualRatePercent: 5,
    })

    expect(comparison.low.futureValue).toBe(comparison.base.futureValue)
    expect(comparison.high.futureValue).toBe(comparison.base.futureValue)
  })

  it('supports -20% and 20%, including a negative gain', () => {
    const comparison = calculateNisaScenarioComparison({
      ...STANDARD_INPUT,
      lowAnnualRatePercent: -20,
      highAnnualRatePercent: 20,
    })

    expect(comparison.low.gain).toBeLessThan(0)
    expect(comparison.high.gain).toBeGreaterThan(0)
    expect(comparison.low.trajectory.at(-1)?.futureValue)
      .toBe(comparison.low.futureValue)
    expect(comparison.high.trajectory.at(-1)?.futureValue)
      .toBe(comparison.high.futureValue)
  })

  it('calculates inflation-adjusted values for all scenarios', () => {
    const comparison = calculateNisaScenarioComparison({
      ...STANDARD_INPUT,
      inflationRatePercent: 2,
    })

    expect(getNisaScenarioResults(comparison).every(
      (scenario) => scenario.inflationAdjustedValue !== null,
    )).toBe(true)
  })

  it('rejects unordered or out-of-range rates', () => {
    expect(() => calculateNisaScenarioComparison({
      ...STANDARD_INPUT,
      lowAnnualRatePercent: 7,
    })).toThrow(RangeError)
    expect(() => calculateNisaScenarioComparison({
      ...STANDARD_INPUT,
      highAnnualRatePercent: 3,
    })).toThrow(RangeError)
    expect(() => calculateNisaScenarioComparison({
      ...STANDARD_INPUT,
      lowAnnualRatePercent: -20.01,
    })).toThrow(RangeError)
    expect(() => calculateNisaScenarioComparison({
      ...STANDARD_INPUT,
      highAnnualRatePercent: 20.01,
    })).toThrow(RangeError)
  })
})
