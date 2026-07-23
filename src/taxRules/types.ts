export type BasicDeductionBracket = {
  /**
   * 合計所得金額の上限です。
   * 上限がない最後の区分ではnullにします。
   */
  upperLimit: number | null

  /**
   * 適用される基礎控除額です。
   */
  deduction: number
}

export type IncomeTaxBracket = {
  /**
   * 課税所得の上限です。
   * 上限がない最後の区分ではnullにします。
   */
  upperLimit: number | null

  /**
   * 所得税率です。
   * 5％は0.05とします。
   */
  rate: number

  /**
   * 所得税の速算表で差し引く控除額です。
   */
  deduction: number
}

export type TaxRuleSource = {
  title: string
  url: string
  checkedAt: string
}

export type TaxRules = {
  year: number

  calculationType: 'official' | 'estimate'

  /**
   * 給与収入から給与所得を求める
   * 年度別の計算関数です。
   */
  calculateSalaryIncome: (
    salaryRevenue: number,
  ) => number

  /**
   * 復興特別所得税率です。
   */
  reconstructionTaxRate: number

  basicDeductionBrackets:
    BasicDeductionBracket[]

  incomeTaxBrackets:
    IncomeTaxBracket[]

  sources: TaxRuleSource[]
}