import {
  describe,
  expect,
  it,
} from 'vitest'
import {
  calculateSalaryIncome2026,
  getBasicDeduction2026,
  taxRules2026,
} from './2026'

describe('calculateSalaryIncome2026', () => {
  it.each([
    ['0円', 0, 0],
    ['負数', -1, 0],
    ['非数', Number.NaN, 0],
    ['740,999円', 740_999, 0],
    ['741,000円', 741_000, 1_000],
    ['2,190,999円', 2_190_999, 1_450_999],
    ['2,191,000円', 2_191_000, 1_451_000],
    ['2,192,999円', 2_192_999, 1_451_000],
    ['2,193,000円', 2_193_000, 1_453_000],
    ['2,195,999円', 2_195_999, 1_453_000],
    ['2,196,000円', 2_196_000, 1_456_000],
    ['2,199,999円', 2_199_999, 1_456_000],
    ['2,200,000円', 2_200_000, 1_460_000],
    ['3,599,999円', 3_599_999, 2_437_200],
    ['3,600,000円', 3_600_000, 2_440_000],
    ['6,599,999円', 6_599_999, 4_836_800],
    ['6,600,000円', 6_600_000, 4_840_000],
    ['8,499,999円', 8_499_999, 6_549_999],
    ['8,500,000円', 8_500_000, 6_550_000],
    ['10,000,000円', 10_000_000, 8_050_000],
  ])(
    '%sの給与所得を計算する',
    (_label, salaryRevenue, expected) => {
      expect(
        calculateSalaryIncome2026(
          salaryRevenue,
        ),
      ).toBe(expected)
    },
  )

  it('1円未満を切り捨てる', () => {
    expect(
      calculateSalaryIncome2026(
        741_000.99,
      ),
    ).toBe(1_000)
  })
})

describe('getBasicDeduction2026', () => {
  it.each([
    [0, 1_040_000],
    [1_320_000, 1_040_000],
    [1_320_001, 880_000],
    [3_360_000, 880_000],
    [3_360_001, 680_000],
    [4_890_000, 680_000],
    [4_890_001, 670_000],
    [6_550_000, 670_000],
    [6_550_001, 620_000],
    [23_500_000, 620_000],
    [23_500_001, 480_000],
    [24_000_000, 480_000],
    [24_000_001, 320_000],
    [24_500_000, 320_000],
    [24_500_001, 160_000],
    [25_000_000, 160_000],
    [25_000_001, 0],
  ])(
    '合計所得金額%s円の基礎控除を判定する',
    (totalIncome, expected) => {
      expect(
        getBasicDeduction2026(
          totalIncome,
        ),
      ).toBe(expected)
    },
  )
})

describe('taxRules2026', () => {
  it('税制年と復興特別所得税率を保持する', () => {
    expect(taxRules2026.year).toBe(2026)
    expect(
      taxRules2026.reconstructionTaxRate,
    ).toBe(0.021)
  })

  it('所得税の7段階速算表を保持する', () => {
    expect(
      taxRules2026.incomeTaxBrackets,
    ).toEqual([
      {
        upperLimit: 1_949_000,
        rate: 0.05,
        deduction: 0,
      },
      {
        upperLimit: 3_299_000,
        rate: 0.1,
        deduction: 97_500,
      },
      {
        upperLimit: 6_949_000,
        rate: 0.2,
        deduction: 427_500,
      },
      {
        upperLimit: 8_999_000,
        rate: 0.23,
        deduction: 636_000,
      },
      {
        upperLimit: 17_999_000,
        rate: 0.33,
        deduction: 1_536_000,
      },
      {
        upperLimit: 39_999_000,
        rate: 0.4,
        deduction: 2_796_000,
      },
      {
        upperLimit: null,
        rate: 0.45,
        deduction: 4_796_000,
      },
    ])
  })

  it('一次資料の参照情報を保持する', () => {
    expect(
      taxRules2026.sources.length,
    ).toBeGreaterThanOrEqual(3)

    for (
      const source of
      taxRules2026.sources
    ) {
      expect(source.title).not.toBe('')
      expect(source.url).toMatch(
        /^https:\/\/www\.nta\.go\.jp\//,
      )
      expect(source.checkedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}$/,
      )
    }
  })
})
