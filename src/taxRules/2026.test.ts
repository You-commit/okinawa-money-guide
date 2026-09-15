import { describe, expect, it } from 'vitest'
import {
  calculateSalaryIncome2026,
  getBasicDeduction2026,
  taxRules2026,
} from './2026'

describe('2026 salary-income deduction boundaries', () => {
  it.each([
    [740_999, 0],
    [741_000, 1_000],
    [741_001, 1_001],
    [2_190_999, 1_450_999],
    [2_191_000, 1_451_000],
    [2_191_001, 1_451_000],
    [2_192_999, 1_451_000],
    [2_193_000, 1_453_000],
    [2_193_001, 1_453_000],
    [2_195_999, 1_453_000],
    [2_196_000, 1_456_000],
    [2_196_001, 1_456_000],
    [2_199_999, 1_456_000],
    [2_200_000, 1_460_000],
    [2_200_001, 1_460_000],
    [3_599_999, 2_437_200],
    [3_600_000, 2_440_000],
    [3_600_001, 2_440_000],
    [6_599_999, 4_836_800],
    [6_600_000, 4_840_000],
    [6_600_001, 4_840_000],
    [8_499_999, 6_549_999],
    [8_500_000, 6_550_000],
    [8_500_001, 6_550_001],
  ])(
    'maps salary revenue %i yen to %i yen of salary income',
    (salaryRevenue, expected) => {
      expect(calculateSalaryIncome2026(salaryRevenue)).toBe(expected)
    },
  )
})

describe('2026 basic-deduction boundaries', () => {
  it.each([
    [1_319_999, 1_040_000],
    [1_320_000, 1_040_000],
    [1_320_001, 880_000],
    [3_359_999, 880_000],
    [3_360_000, 880_000],
    [3_360_001, 680_000],
    [4_889_999, 680_000],
    [4_890_000, 680_000],
    [4_890_001, 670_000],
    [6_549_999, 670_000],
    [6_550_000, 670_000],
    [6_550_001, 620_000],
    [23_499_999, 620_000],
    [23_500_000, 620_000],
    [23_500_001, 480_000],
    [23_999_999, 480_000],
    [24_000_000, 480_000],
    [24_000_001, 320_000],
    [24_499_999, 320_000],
    [24_500_000, 320_000],
    [24_500_001, 160_000],
    [24_999_999, 160_000],
    [25_000_000, 160_000],
    [25_000_001, 0],
  ])(
    'maps total income %i yen to a %i yen deduction',
    (totalIncome, expected) => {
      expect(getBasicDeduction2026(totalIncome)).toBe(expected)
    },
  )
})

describe('income-tax quick-table boundaries', () => {
  const getBracket = (taxableIncome: number) =>
    taxRules2026.incomeTaxBrackets.find(
      ({ upperLimit }) =>
        upperLimit === null || taxableIncome <= upperLimit,
    )

  it.each([
    [1_949_000, 0.05, 0],
    [1_950_000, 0.1, 97_500],
    [3_299_000, 0.1, 97_500],
    [3_300_000, 0.2, 427_500],
    [6_949_000, 0.2, 427_500],
    [6_950_000, 0.23, 636_000],
    [8_999_000, 0.23, 636_000],
    [9_000_000, 0.33, 1_536_000],
    [17_999_000, 0.33, 1_536_000],
    [18_000_000, 0.4, 2_796_000],
    [39_999_000, 0.4, 2_796_000],
    [40_000_000, 0.45, 4_796_000],
  ])(
    'uses rate %f and deduction %i at %i yen',
    (taxableIncome, expectedRate, expectedDeduction) => {
      expect(getBracket(taxableIncome)).toMatchObject({
        rate: expectedRate,
        deduction: expectedDeduction,
      })
    },
  )
})
