import { useMemo, useState } from 'react'
import {
  getBasicDeduction2026,
  taxRules2026,
} from './taxRules/2026'

type DeductionKey =
  | 'socialInsurance'
  | 'spouse'
  | 'dependent'
  | 'lifeInsurance'
  | 'earthquakeInsurance'
  | 'medicalExpense'
  | 'donation'
  | 'other'

type DeductionInputs = Record<
  DeductionKey,
  string
>

type TaxableIncomeResult = {
  salaryRevenue: number | null
  salaryIncomeDeduction: number | null
  salaryIncome: number | null
  basicDeduction: number | null
  otherDeductions: number | null
  totalDeductions: number | null
  taxableIncome: number | null
  incomeTaxRate: number | null
  baseIncomeTax: number | null
  reconstructionSpecialIncomeTax:
  number | null
  totalIncomeTax: number | null
}

type TaxableIncomeCalculatorProps = {
  onApplyIncomeTaxRate: (
    rate: number,
  ) => void
}

const emptyResult: TaxableIncomeResult = {
  salaryRevenue: null,
  salaryIncomeDeduction: null,
  salaryIncome: null,
  basicDeduction: null,
  otherDeductions: null,
  totalDeductions: null,
  taxableIncome: null,
  incomeTaxRate: null,
  baseIncomeTax: null,
  reconstructionSpecialIncomeTax: null,
  totalIncomeTax: null,
}

const initialDeductionInputs: DeductionInputs = {
  socialInsurance: '',
  spouse: '',
  dependent: '',
  lifeInsurance: '',
  earthquakeInsurance: '',
  medicalExpense: '',
  donation: '',
  other: '',
}

const deductionFields: Array<{
  key: DeductionKey
  label: string
  help: string
}> = [
    {
      key: 'socialInsurance',
      label: '社会保険料控除',
      help:
        '源泉徴収票の「社会保険料等の金額」などを入力します。',
    },
    {
      key: 'spouse',
      label: '配偶者控除・配偶者特別控除',
      help:
        '適用される場合の控除額を入力します。',
    },
    {
      key: 'dependent',
      label: '扶養控除',
      help:
        '扶養親族について適用される控除額の合計です。',
    },
    {
      key: 'lifeInsurance',
      label: '生命保険料控除',
      help:
        '支払保険料ではなく、実際の控除額を入力します。',
    },
    {
      key: 'earthquakeInsurance',
      label: '地震保険料控除',
      help:
        '支払保険料ではなく、実際の控除額を入力します。',
    },
    {
      key: 'medicalExpense',
      label: '医療費控除',
      help:
        '支払医療費ではなく、計算後の控除額を入力します。',
    },
    {
      key: 'donation',
      label: '寄附金控除',
      help:
        '寄附額ではなく、所得控除として適用される額です。',
    },
    {
      key: 'other',
      label: 'その他の所得控除',
      help:
        '雑損控除などを入力します。iDeCo掛金は含めません。',
    },
  ]

const convertToHalfWidth = (
  value: string,
) => value.normalize('NFKC')

const getMoneyDigits = (value: string) =>
  convertToHalfWidth(value).replace(
    /[^\d]/g,
    '',
  )

const getMoneyValue = (value: string) => {
  const digits = getMoneyDigits(value)

  if (digits === '') {
    return 0
  }

  return Number(digits)
}

const formatMoneyInput = (
  value: string,
) => {
  const digits = getMoneyDigits(value)

  if (digits === '') {
    return ''
  }

  return Number(digits).toLocaleString(
    'ja-JP',
  )
}

const formatYen = (value: number) =>
  new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(Math.round(value))

const calculateTaxableIncome = (
  salaryRevenueInput: string,
  deductionInputs: DeductionInputs,
): TaxableIncomeResult => {
  const salaryRevenue = getMoneyValue(
    salaryRevenueInput,
  )

  if (salaryRevenue <= 0) {
    return emptyResult
  }

  const salaryIncome =
    taxRules2026.calculateSalaryIncome(
      salaryRevenue,
    )

  const salaryIncomeDeduction =
    salaryRevenue - salaryIncome

  /*
   * 給与以外の所得を対象にしないため、
   * 給与所得を合計所得金額として
   * 基礎控除を判定します。
   */
  const basicDeduction =
    getBasicDeduction2026(salaryIncome)

  /*
   * 基礎控除以外の所得控除を合計します。
   */
  const otherDeductions = Object.values(
    deductionInputs,
  ).reduce(
    (total, value) =>
      total + getMoneyValue(value),
    0,
  )

  const totalDeductions =
    basicDeduction + otherDeductions

  /*
   * 課税所得は0円未満にならないようにし、
   * 1,000円未満を切り捨てます。
   */
  const taxableIncomeBeforeRounding =
    Math.max(
      0,
      salaryIncome - totalDeductions,
    )

  const taxableIncome =
    Math.floor(
      taxableIncomeBeforeRounding /
      1_000,
    ) * 1_000

  if (taxableIncome === 0) {
    return {
      salaryRevenue,
      salaryIncomeDeduction,
      salaryIncome,
      basicDeduction,
      otherDeductions,
      totalDeductions,
      taxableIncome,
      incomeTaxRate: 0,
      baseIncomeTax: 0,
      reconstructionSpecialIncomeTax: 0,
      totalIncomeTax: 0,
    }
  }

  const incomeTaxBracket =
    taxRules2026.incomeTaxBrackets.find(
      (item) =>
        item.upperLimit === null ||
        taxableIncome <= item.upperLimit,
    )

  if (!incomeTaxBracket) {
    return emptyResult
  }

  const baseIncomeTax = Math.max(
    0,
    Math.floor(
      taxableIncome *
      incomeTaxBracket.rate -
      incomeTaxBracket.deduction,
    ),
  )

  const reconstructionSpecialIncomeTax =
    Math.floor(
      baseIncomeTax *
      taxRules2026.reconstructionTaxRate,
    )

  /*
   * 所得税と復興特別所得税の合計は、
   * 100円未満を切り捨てた概算です。
   */
  const totalIncomeTax =
    Math.floor(
      (baseIncomeTax +
        reconstructionSpecialIncomeTax) /
      100,
    ) * 100

  return {
    salaryRevenue,
    salaryIncomeDeduction,
    salaryIncome,
    basicDeduction,
    otherDeductions,
    totalDeductions,
    taxableIncome,
    incomeTaxRate:
      incomeTaxBracket.rate * 100,
    baseIncomeTax,
    reconstructionSpecialIncomeTax,
    totalIncomeTax,
  }
}

function TaxableIncomeCalculator({
  onApplyIncomeTaxRate,
}: TaxableIncomeCalculatorProps) {
  const [
    salaryRevenue,
    setSalaryRevenue,
  ] = useState('')

  const [
    deductionInputs,
    setDeductionInputs,
  ] = useState<DeductionInputs>({
    ...initialDeductionInputs,
  })

  const [
    isAutoCalculation,
    setIsAutoCalculation,
  ] = useState(false)

  const [manualResult, setManualResult] =
    useState<TaxableIncomeResult | null>(
      null,
    )

  const autoResult = useMemo(
    () =>
      calculateTaxableIncome(
        salaryRevenue,
        deductionInputs,
      ),
    [salaryRevenue, deductionInputs],
  )

  const displayedResult =
    isAutoCalculation
      ? autoResult
      : manualResult ?? emptyResult

  const canSimulate =
    getMoneyValue(salaryRevenue) > 0

  const clearManualResult = () => {
    if (!isAutoCalculation) {
      setManualResult(null)
    }
  }

  const handleSalaryRevenueChange = (
    value: string,
  ) => {
    setSalaryRevenue(value)
    clearManualResult()
  }

  const handleDeductionChange = (
    key: DeductionKey,
    value: string,
  ) => {
    setDeductionInputs((current) => ({
      ...current,
      [key]: value,
    }))

    clearManualResult()
  }

  const simulate = () => {
    setManualResult(
      calculateTaxableIncome(
        salaryRevenue,
        deductionInputs,
      ),
    )
  }

  const resetCalculator = () => {
    setSalaryRevenue('')

    setDeductionInputs({
      ...initialDeductionInputs,
    })

    setManualResult(null)
  }

  const changeCalculationMode = (
    checked: boolean,
  ) => {
    setIsAutoCalculation(checked)
    setManualResult(null)
  }

  const handleApplyIncomeTaxRate = () => {
    const rate =
      displayedResult.incomeTaxRate

    if (rate === null) {
      return
    }

    onApplyIncomeTaxRate(rate)
  }

  return (
    <section
      className="calculator"
      aria-labelledby="taxable-income-title"
    >
      <div className="calculator-heading">
        <p className="section-label">
          TAXABLE INCOME CALCULATOR
        </p>

        <h2 id="taxable-income-title">
          課税所得・所得税率
          シミュレーター
        </h2>

        <p>
          給与収入と所得控除から、
          2026年分の課税所得、
          所得税率、所得税額を
          概算します。
        </p>
      </div>

      <div className="calculator-layout">
        <div className="calculator-form">
          <label>
            <span>年間の給与収入</span>

            <div className="input-with-unit">
              <input
                type="text"
                inputMode="numeric"
                value={salaryRevenue}
                onChange={(event) => {
                  const value =
                    event.target.value

                  if (
                    (event.nativeEvent as InputEvent).isComposing
                  ) {
                    handleSalaryRevenueChange(
                      value,
                    )
                    return
                  }

                  handleSalaryRevenueChange(
                    formatMoneyInput(value),
                  )
                }}
                onCompositionEnd={(
                  event,
                ) => {
                  handleSalaryRevenueChange(
                    formatMoneyInput(
                      event.currentTarget
                        .value,
                    ),
                  )
                }}
                onBlur={(event) => {
                  handleSalaryRevenueChange(
                    formatMoneyInput(
                      event.currentTarget
                        .value,
                    ),
                  )
                }}
                placeholder="例：5,000,000"
              />

              <span>円</span>
            </div>
          </label>

          <p className="input-help">
            源泉徴収票の「支払金額」を
            入力してください。
          </p>

          <div className="form-subheading">
            <strong>
              基礎控除以外の所得控除
            </strong>

            <p>
              該当しない項目や
              分からない項目は、
              空欄のままで計算できます。
              基礎控除は自動計算されます。
            </p>
          </div>

          <div className="deduction-fields">
            {deductionFields.map(
              (field) => (
                <label key={field.key}>
                  <span>{field.label}</span>

                  <div className="input-with-unit">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={
                        deductionInputs[
                        field.key
                        ]
                      }
                      onChange={(
                        event,
                      ) => {
                        const value =
                          event.target
                            .value

                        if (
                          (event.nativeEvent as InputEvent).isComposing
                        ) {
                          handleDeductionChange(
                            field.key,
                            value,
                          )
                          return
                        }

                        handleDeductionChange(
                          field.key,
                          formatMoneyInput(
                            value,
                          ),
                        )
                      }}
                      onCompositionEnd={(
                        event,
                      ) => {
                        handleDeductionChange(
                          field.key,
                          formatMoneyInput(
                            event
                              .currentTarget
                              .value,
                          ),
                        )
                      }}
                      onBlur={(event) => {
                        handleDeductionChange(
                          field.key,
                          formatMoneyInput(
                            event
                              .currentTarget
                              .value,
                          ),
                        )
                      }}
                      placeholder="0"
                    />

                    <span>円</span>
                  </div>

                  <small className="field-help">
                    {field.help}
                  </small>
                </label>
              ),
            )}
          </div>

          <div
            className="form-spacer"
            aria-hidden="true"
          ></div>

          <div className="calculation-mode">
            <label className="mode-checkbox">
              <input
                type="checkbox"
                checked={isAutoCalculation}
                onChange={(event) =>
                  changeCalculationMode(
                    event.target.checked,
                  )
                }
              />

              <span>
                入力と同時に計算結果を
                更新する
              </span>
            </label>

            <p>
              {isAutoCalculation
                ? '入力内容を変更すると、結果が自動更新されます。'
                : 'シミュレートボタンを押すと結果が表示されます。'}
            </p>
          </div>

          {!isAutoCalculation && (
            <button
              className="simulate-button"
              type="button"
              onClick={simulate}
              disabled={!canSimulate}
            >
              シミュレートする
            </button>
          )}

          <button
            className="reset-button"
            type="button"
            onClick={resetCalculator}
          >
            入力内容をリセット
          </button>
        </div>

        <div
          className="calculator-results"
          aria-live="polite"
        >
          <div className="result-card">
            <span>
              給与所得控除相当額
            </span>

            <strong>
              {displayedResult
                .salaryIncomeDeduction ===
                null
                ? '―'
                : formatYen(
                  displayedResult
                    .salaryIncomeDeduction,
                )}
            </strong>

            <small>
              給与収入から差し引かれる金額
            </small>
          </div>

          <div className="result-card">
            <span>給与所得</span>

            <strong>
              {displayedResult
                .salaryIncome === null
                ? '―'
                : formatYen(
                  displayedResult
                    .salaryIncome,
                )}
            </strong>

            <small>
              給与収入－給与所得控除相当額
            </small>
          </div>

          <div className="result-card">
            <span>基礎控除</span>

            <strong>
              {displayedResult
                .basicDeduction === null
                ? '―'
                : formatYen(
                  displayedResult
                    .basicDeduction,
                )}
            </strong>

            <small>
              給与所得から自動判定
            </small>
          </div>

          <div className="result-card">
            <span>
              基礎控除以外の所得控除
            </span>

            <strong>
              {displayedResult
                .otherDeductions === null
                ? '―'
                : formatYen(
                  displayedResult
                    .otherDeductions,
                )}
            </strong>

            <small>
              入力した所得控除の合計
            </small>
          </div>

          <div className="result-card">
            <span>所得控除合計</span>

            <strong>
              {displayedResult
                .totalDeductions === null
                ? '―'
                : formatYen(
                  displayedResult
                    .totalDeductions,
                )}
            </strong>

            <small>
              基礎控除＋その他の所得控除
            </small>
          </div>

          <div className="result-card emphasis-result">
            <span>課税所得</span>

            <strong>
              {displayedResult
                .taxableIncome === null
                ? '―'
                : formatYen(
                  displayedResult
                    .taxableIncome,
                )}
            </strong>

            <small>
              1,000円未満切捨て
            </small>
          </div>

          <div className="result-card emphasis-result">
            <span>所得税率</span>

            <strong>
              {displayedResult
                .incomeTaxRate === null
                ? '―'
                : `${displayedResult.incomeTaxRate}%`}
            </strong>

            <small>
              課税所得に適用される税率
            </small>
          </div>

          <button
            className="apply-tax-rate-button"
            type="button"
            onClick={handleApplyIncomeTaxRate}
            disabled={
              displayedResult.incomeTaxRate ===
              null
            }
          >
            {displayedResult.incomeTaxRate ===
              null
              ? '所得税率を計算してください'
              : `この${displayedResult.incomeTaxRate}%をiDeCoに反映する`}
          </button>

          <div className="result-card">
            <span>所得税額</span>

            <strong>
              {displayedResult
                .baseIncomeTax === null
                ? '―'
                : formatYen(
                  displayedResult
                    .baseIncomeTax,
                )}
            </strong>

            <small>
              税額控除適用前の概算
            </small>
          </div>

          <div className="result-card">
            <span>
              復興特別所得税
            </span>

            <strong>
              {displayedResult
                .reconstructionSpecialIncomeTax ===
                null
                ? '―'
                : formatYen(
                  displayedResult
                    .reconstructionSpecialIncomeTax,
                )}
            </strong>

            <small>
              所得税額の2.1％
            </small>
          </div>

          <div className="result-card">
            <span>
              所得税等の合計
            </span>

            <strong>
              {displayedResult
                .totalIncomeTax === null
                ? '―'
                : formatYen(
                  displayedResult
                    .totalIncomeTax,
                )}
            </strong>

            <small>
              100円未満切捨ての概算
            </small>
          </div>
        </div>
      </div>

      <p className="calculator-note">
        2026年分の給与所得のみを
        対象とした概算です。
        住宅ローン控除などの税額控除、
        所得金額調整控除、特定支出控除、
        給与以外の所得、住民税は
        含んでいません。
      </p>
    </section>
  )
}

export default TaxableIncomeCalculator