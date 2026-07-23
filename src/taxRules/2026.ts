import type { TaxRules } from './types'

/**
 * 給与収入を1円単位の整数へ整えます。
 */
const normalizeSalaryRevenue = (
  salaryRevenue: number,
) => {
  if (
    !Number.isFinite(salaryRevenue) ||
    salaryRevenue <= 0
  ) {
    return 0
  }

  return Math.floor(salaryRevenue)
}

/**
 * 給与収入を4で割った後、
 * 1,000円未満を切り捨てます。
 */
const calculateTableAmount = (
  salaryRevenue: number,
) => {
  return (
    Math.floor(salaryRevenue / 4 / 1_000) *
    1_000
  )
}

/**
 * 2026年分の給与所得を計算します。
 */
export const calculateSalaryIncome2026 = (
  salaryRevenue: number,
) => {
  const revenue =
    normalizeSalaryRevenue(salaryRevenue)

  /*
   * 74万1,000円未満
   */
  if (revenue < 741_000) {
    return 0
  }

  /*
   * 74万1,000円以上
   * 219万1,000円未満
   */
  if (revenue < 2_191_000) {
    return revenue - 740_000
  }

  /*
   * 219万1,000円以上
   * 219万3,000円未満
   */
  if (revenue < 2_193_000) {
    return 1_451_000
  }

  /*
   * 219万3,000円以上
   * 219万6,000円未満
   */
  if (revenue < 2_196_000) {
    return 1_453_000
  }

  /*
   * 219万6,000円以上
   * 220万円未満
   */
  if (revenue < 2_200_000) {
    return 1_456_000
  }

  /*
   * 220万円以上
   * 360万円未満
   */
  if (revenue < 3_600_000) {
    const tableAmount =
      calculateTableAmount(revenue)

    return Math.floor(
      tableAmount * 2.8 - 80_000,
    )
  }

  /*
   * 360万円以上
   * 660万円未満
   */
  if (revenue < 6_600_000) {
    const tableAmount =
      calculateTableAmount(revenue)

    return Math.floor(
      tableAmount * 3.2 - 440_000,
    )
  }

  /*
   * 660万円以上
   * 850万円未満
   */
  if (revenue < 8_500_000) {
    return Math.floor(
      revenue * 0.9 - 1_100_000,
    )
  }

  /*
   * 850万円以上
   */
  return revenue - 1_950_000
}

/**
 * 合計所得金額から基礎控除額を取得します。
 */
export const getBasicDeduction2026 = (
  totalIncome: number,
) => {
  const bracket =
    taxRules2026.basicDeductionBrackets.find(
      (item) =>
        item.upperLimit === null ||
        totalIncome <= item.upperLimit,
    )

  return bracket?.deduction ?? 0
}

export const taxRules2026: TaxRules = {
  year: 2026,

  calculationType: 'official',

  calculateSalaryIncome:
    calculateSalaryIncome2026,

  reconstructionTaxRate: 0.021,

  basicDeductionBrackets: [
    {
      upperLimit: 1_320_000,
      deduction: 1_040_000,
    },
    {
      upperLimit: 3_360_000,
      deduction: 880_000,
    },
    {
      upperLimit: 4_890_000,
      deduction: 680_000,
    },
    {
      upperLimit: 6_550_000,
      deduction: 670_000,
    },
    {
      upperLimit: 23_500_000,
      deduction: 620_000,
    },
    {
      upperLimit: 24_000_000,
      deduction: 480_000,
    },
    {
      upperLimit: 24_500_000,
      deduction: 320_000,
    },
    {
      upperLimit: 25_000_000,
      deduction: 160_000,
    },
    {
      upperLimit: null,
      deduction: 0,
    },
  ],

  incomeTaxBrackets: [
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
  ],

  sources: [
    {
      title:
        '令和8年度税制改正による所得税の基礎控除の引上げ等について',
      url:
        'https://www.nta.go.jp/users/gensen/2026kiso/index.htm',
      checkedAt: '2026-07-22',
    },
    {
      title:
        '令和8年4月 源泉所得税の改正のあらまし',
      url:
        'https://www.nta.go.jp/publication/pamph/gensen/2026kaisei.pdf',
      checkedAt: '2026-07-22',
    },
    {
      title: '所得税の税率',
      url:
        'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm',
      checkedAt: '2026-07-22',
    },
  ],
}