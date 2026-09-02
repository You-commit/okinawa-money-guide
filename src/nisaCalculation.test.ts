import { describe, expect, it } from 'vitest'
import {
  NISA_INPUT_LIMITS,
  annualRateToEffectiveMonthlyRate,
  assessRequiredInvestmentMonthsReachability,
  calculateCurrentFutureValueWithInitialInvestment,
  calculateFutureValue,
  calculateInflationAdjustedValue,
  calculateNisaTrajectory,
  calculateRequiredInvestmentMonths,
  calculateRequiredMonthlyContribution,
  roundHalfUp,
  splitInvestmentMonths,
  validateNisaCalculationInput,
} from './nisaCalculation'

describe('NISA accessible trajectory data', () => {
  it('uses the pure calculation model for major points and an exact partial final month', () => {
    const points = calculateNisaTrajectory({
      initialInvestment: 0,
      monthlyContribution: 30_000,
      annualRatePercent: 5,
      months: 211,
    })

    expect(points.map((point) => point.months)).toEqual([
      0,
      60,
      120,
      180,
      211,
    ])

    const finalPoint = points.at(-1)!
    const formalResult = calculateCurrentFutureValueWithInitialInvestment({
      initialInvestment: 0,
      monthlyContribution: 30_000,
      annualRatePercent: 5,
      months: 211,
    })

    expect(finalPoint).toEqual({
      months: 211,
      principal: formalResult.principal,
      gain: formalResult.gain,
      futureValue: formalResult.futureValue,
    })
  })

  it('preserves zero-return and negative-return gains without hiding losses', () => {
    const zeroReturn = calculateNisaTrajectory({
      initialInvestment: 0,
      monthlyContribution: 10_000,
      annualRatePercent: 0,
      months: 120,
    })
    const negativeReturn = calculateNisaTrajectory({
      initialInvestment: 0,
      monthlyContribution: 10_000,
      annualRatePercent: -20,
      months: 120,
    })

    expect(zeroReturn.at(-1)?.gain).toBe(0)
    expect(negativeReturn.at(-1)?.gain).toBeLessThan(0)
    expect(negativeReturn.at(-1)?.futureValue)
      .toBeLessThan(negativeReturn.at(-1)?.principal ?? 0)
  })
})

describe('NISA formal calculation model', () => {
  it('converts an annual return into an effective monthly rate', () => {
    expect(annualRateToEffectiveMonthlyRate(5)).toBeCloseTo(
      Math.pow(1.05, 1 / 12) - 1,
      15,
    )
  })

  it('calculates case A: 10,000 yen monthly at 0% for 10 years', () => {
    const result = calculateFutureValue({
      monthlyContribution: 10_000,
      annualRatePercent: 0,
      months: 120,
    })

    expect(result.futureValue).toBe(1_200_000)
    expect(result.principal).toBe(1_200_000)
    expect(result.gain).toBe(0)
  })

  it('calculates case B: 10,000 yen monthly at 5% for 20 years', () => {
    const result = calculateFutureValue({
      monthlyContribution: 10_000,
      annualRatePercent: 5,
      months: 240,
    })

    expect(roundHalfUp(result.futureValue)).toBe(4_058_045)
    expect(result.futureValue).not.toBe(roundHalfUp(result.futureValue))
  })

  it('calculates case C: the required contribution for 10 million yen', () => {
    const result = calculateRequiredMonthlyContribution({
      targetAmount: 10_000_000,
      annualRatePercent: 5,
      months: 240,
    })

    expect(result.requiredMonthlyContribution).toBe(24_643)
    expect(result.futureValue).toBeGreaterThanOrEqual(10_000_000)

    const oneYenLess = calculateFutureValue({
      monthlyContribution: result.requiredMonthlyContribution - 1,
      annualRatePercent: 5,
      months: 240,
    })

    expect(oneYenLess.futureValue).toBeLessThan(10_000_000)
  })

  it('calculates case D: the required period as 211 months / 17 years 7 months', () => {
    const result = calculateRequiredInvestmentMonths({
      targetAmount: 10_000_000,
      monthlyContribution: 30_000,
      annualRatePercent: 5,
    })

    expect(result.status).toBe('reachable')

    if (result.status !== 'reachable') {
      throw new Error('Expected a reachable result')
    }

    expect(result.requiredMonths).toBe(211)
    expect(result.years).toBe(17)
    expect(result.remainingMonths).toBe(7)
    expect(result.futureValue).toBeGreaterThanOrEqual(10_000_000)

    const previousMonth = calculateFutureValue({
      monthlyContribution: 30_000,
      annualRatePercent: 5,
      months: 210,
    })

    expect(previousMonth.futureValue).toBeLessThan(10_000_000)
  })

  it('keeps a reachable negative-return case finite and shows a negative gain', () => {
    const result = calculateRequiredInvestmentMonths({
      targetAmount: 1_000_000,
      monthlyContribution: 30_000,
      annualRatePercent: -20,
    })

    expect(result.status).toBe('reachable')

    if (result.status !== 'reachable') {
      throw new Error('Expected a reachable result')
    }

    expect(Number.isFinite(result.requiredMonths)).toBe(true)
    expect(Number.isFinite(result.futureValue)).toBe(true)
    expect(result.gain).toBeLessThan(0)
  })

  it('returns unreachable before calculating an infinite negative-return period', () => {
    const reachability = assessRequiredInvestmentMonthsReachability({
      targetAmount: 2_000_000,
      monthlyContribution: 30_000,
      annualRatePercent: -20,
    })
    const result = calculateRequiredInvestmentMonths({
      targetAmount: 2_000_000,
      monthlyContribution: 30_000,
      annualRatePercent: -20,
    })

    expect(reachability.status).toBe('unreachable')
    expect(result.status).toBe('unreachable')

    if (result.status !== 'unreachable') {
      throw new Error('Expected an unreachable result')
    }

    expect(Number.isFinite(result.maximumReachableValue)).toBe(true)
  })

  it('supports the formal annual return boundaries', () => {
    const negative = calculateFutureValue({
      monthlyContribution: 10_000,
      annualRatePercent: -20,
      months: 12,
    })
    const positive = calculateFutureValue({
      monthlyContribution: 10_000,
      annualRatePercent: 20,
      months: 12,
    })

    expect(Number.isFinite(negative.futureValue)).toBe(true)
    expect(negative.gain).toBeLessThan(0)
    expect(Number.isFinite(positive.futureValue)).toBe(true)
    expect(positive.gain).toBeGreaterThan(0)
  })

  it('supports one month and 960 months without intermediate rounding', () => {
    const oneMonth = calculateFutureValue({
      monthlyContribution: 1,
      annualRatePercent: 20,
      months: 1,
    })
    const maximumPeriod = calculateFutureValue({
      monthlyContribution: 10_000_000,
      annualRatePercent: 20,
      months: 960,
    })

    expect(oneMonth.futureValue).toBeCloseTo(1, 12)
    expect(Number.isFinite(maximumPeriod.futureValue)).toBe(true)
    expect(maximumPeriod.futureValue).not.toBe(
      roundHalfUp(maximumPeriod.futureValue),
    )
  })

  it('supports formal contribution and target amount boundaries', () => {
    expect(() => calculateFutureValue({
      monthlyContribution: NISA_INPUT_LIMITS.monthlyContribution.min,
      annualRatePercent: 0,
      months: 1,
    })).not.toThrow()

    expect(() => calculateFutureValue({
      monthlyContribution: NISA_INPUT_LIMITS.monthlyContribution.max,
      annualRatePercent: 0,
      months: 960,
    })).not.toThrow()

    expect(() => calculateRequiredMonthlyContribution({
      targetAmount: NISA_INPUT_LIMITS.targetAmount.min,
      annualRatePercent: 0,
      months: 1,
    })).not.toThrow()

    expect(() => calculateRequiredMonthlyContribution({
      targetAmount: NISA_INPUT_LIMITS.targetAmount.max,
      annualRatePercent: 20,
      months: 960,
    })).not.toThrow()
  })

  it('uses one-yen ceiling without over-ceiling exact zero-rate results', () => {
    const exact = calculateRequiredMonthlyContribution({
      targetAmount: 1_200_000,
      annualRatePercent: 0,
      months: 120,
    })
    const fractional = calculateRequiredMonthlyContribution({
      targetAmount: 1_000_000,
      annualRatePercent: 0,
      months: 3,
    })

    expect(exact.requiredMonthlyContribution).toBe(10_000)
    expect(fractional.requiredMonthlyContribution).toBe(333_334)
  })

  it('uses one-month ceiling without over-ceiling exact zero-rate results', () => {
    const exact = calculateRequiredInvestmentMonths({
      targetAmount: 1_200_000,
      monthlyContribution: 10_000,
      annualRatePercent: 0,
    })
    const fractional = calculateRequiredInvestmentMonths({
      targetAmount: 1_000_001,
      monthlyContribution: 10_000,
      annualRatePercent: 0,
    })

    expect(exact.status).toBe('reachable')
    expect(fractional.status).toBe('reachable')

    if (exact.status === 'reachable' && fractional.status === 'reachable') {
      expect(exact.requiredMonths).toBe(120)
      expect(fractional.requiredMonths).toBe(101)
    }
  })

  it('calculates inflation-adjusted value at 0% and 10%', () => {
    expect(calculateInflationAdjustedValue(2_000_000, 120, 0)).toBe(
      2_000_000,
    )
    expect(
      calculateInflationAdjustedValue(2_000_000, 120, 10),
    ).toBeCloseTo(2_000_000 / Math.pow(1.1, 10), 8)
  })

  it('rounds positive and negative half values with ROUND_HALF_UP', () => {
    expect(roundHalfUp(10.5)).toBe(11)
    expect(roundHalfUp(-10.5)).toBe(-11)
    expect(roundHalfUp(10.49)).toBe(10)
    expect(roundHalfUp(-10.49)).toBe(-10)
  })

  it('converts formal month results to years and remaining months', () => {
    expect(splitInvestmentMonths(211)).toEqual({
      years: 17,
      remainingMonths: 7,
    })
  })
})

describe('NISA input validation contract', () => {
  it('accepts valid values for all three calculation modes', () => {
    expect(validateNisaCalculationInput({
      mode: 'future-value',
      monthlyContribution: 30_000,
      annualRatePercent: -20,
      months: 960,
      inflationRatePercent: 10,
    })).toEqual([])

    expect(validateNisaCalculationInput({
      mode: 'required-contribution',
      targetAmount: 10_000_000,
      annualRatePercent: 5,
      months: 240,
    })).toEqual([])

    expect(validateNisaCalculationInput({
      mode: 'required-months',
      targetAmount: 10_000_000,
      monthlyContribution: 30_000,
      annualRatePercent: 5,
    })).toEqual([])
  })

  it('reports missing, out-of-range, fractional-month, and precision issues', () => {
    expect(validateNisaCalculationInput({
      mode: 'future-value',
      monthlyContribution: 0,
      annualRatePercent: 20.001,
      months: 12.5,
      inflationRatePercent: 10.01,
    })).toEqual(expect.arrayContaining([
      { field: 'monthlyContribution', code: 'out-of-range' },
      { field: 'annualRatePercent', code: 'out-of-range' },
      { field: 'months', code: 'not-integer' },
      { field: 'inflationRatePercent', code: 'out-of-range' },
    ]))

    expect(validateNisaCalculationInput({
      mode: 'required-contribution',
      annualRatePercent: 5.001,
      months: 120,
    })).toEqual(expect.arrayContaining([
      { field: 'targetAmount', code: 'required' },
      { field: 'annualRatePercent', code: 'too-many-decimals' },
    ]))
  })

  it('never returns NaN or Infinity as a normal result', () => {
    expect(() => calculateFutureValue({
      monthlyContribution: Number.NaN,
      annualRatePercent: 5,
      months: 120,
    })).toThrow(RangeError)

    expect(() => calculateRequiredMonthlyContribution({
      targetAmount: Number.POSITIVE_INFINITY,
      annualRatePercent: 5,
      months: 120,
    })).toThrow(RangeError)
  })
})

describe('current NISA initial-investment extension', () => {
  it('keeps initial investment in the current future-value UI only', () => {
    const formal = calculateFutureValue({
      monthlyContribution: 10_000,
      annualRatePercent: 5,
      months: 240,
    })
    const currentUi = calculateCurrentFutureValueWithInitialInvestment({
      initialInvestment: 1_000_000,
      monthlyContribution: 10_000,
      annualRatePercent: 5,
      months: 240,
    })

    expect(currentUi.futureValue).toBeCloseTo(
      formal.futureValue + 1_000_000 * Math.pow(1.05, 20),
      8,
    )
    expect(currentUi.principal).toBe(formal.principal + 1_000_000)
  })

  it('preserves an initial-investment-only current UI calculation', () => {
    const result = calculateCurrentFutureValueWithInitialInvestment({
      initialInvestment: 1_000_000,
      monthlyContribution: 0,
      annualRatePercent: 5,
      months: 240,
    })

    expect(result.futureValue).toBeCloseTo(
      1_000_000 * Math.pow(1.05, 20),
      8,
    )
    expect(result.principal).toBe(1_000_000)
  })
})
