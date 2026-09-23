import { useMemo, useRef, useState } from 'react'
import MoneyInput from './components/form/MoneyInput'
import { getMoneyInputDigits } from './utils/moneyInput'
import { navigateToSimulationResult } from './utils/simulationResultNavigation'
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

type DeductionGroupId = 'social' | 'other'

const deductionGroups: Array<{
  id: DeductionGroupId
  title: string
  description: string
  fields: typeof deductionFields
}> = [
  {
    id: 'social',
    title: '社会保険・人的控除',
    description: '社会保険料、配偶者、扶養に関する控除',
    fields: deductionFields.slice(0, 3),
  },
  {
    id: 'other',
    title: 'その他の所得控除',
    description: '保険料、医療費、寄附金などの控除',
    fields: deductionFields.slice(3),
  },
]

const initialOpenDeductionGroups: Record<DeductionGroupId, boolean> = {
  social: true,
  other: false,
}

const getMoneyValue = (value: string) => {
  const digits = getMoneyInputDigits(value)

  if (digits === '') {
    return 0
  }

  return Number(digits)
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
  const [inputMode, setInputMode] =
    useState<'basic' | 'detail'>('basic')

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
  const [openDeductionGroups, setOpenDeductionGroups] =
    useState({ ...initialOpenDeductionGroups })
  const resultsRef = useRef<HTMLDivElement>(null)

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
    const result = calculateTaxableIncome(
      salaryRevenue,
      deductionInputs,
    )

    setManualResult(result)
    navigateToSimulationResult(resultsRef.current)
  }

  const resetCalculator = () => {
    setSalaryRevenue('')

    setDeductionInputs({
      ...initialDeductionInputs,
    })

    setOpenDeductionGroups({ ...initialOpenDeductionGroups })
    setManualResult(null)
  }

  const toggleDeductionGroup = (groupId: DeductionGroupId) => {
    setOpenDeductionGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }))
  }

  const changeCalculationMode = (
    checked: boolean,
  ) => {
    setIsAutoCalculation(checked)
    setManualResult(null)
  }

  const changeInputMode = (mode: 'basic' | 'detail') => {
    setInputMode(mode)
    if (mode === 'basic') {
      setDeductionInputs({ ...initialDeductionInputs })
      clearManualResult()
    }
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
          <span>課税所得・所得税率</span>
          <wbr />
          <span>シミュレーター</span>
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
          <div className="simulator-panel-heading">
            <span aria-hidden="true">01</span>
            <div>
              <p>INPUT</p>
              <h3>条件を入力する</h3>
            </div>
          </div>

          <label htmlFor="taxable-salary-revenue">
            <span>年間の給与収入</span>

            <div className="input-with-unit">
              <MoneyInput
                id="taxable-salary-revenue"
                value={salaryRevenue}
                onValueChange={handleSalaryRevenueChange}
                placeholder="例：5,000,000"
              />

              <span>円</span>
            </div>
          </label>

          <p className="input-help">
            源泉徴収票の「支払金額」を
            入力してください。
          </p>

          <div className="taxable-input-mode" aria-label="入力モード">
            <button
              type="button"
              className={inputMode === 'basic' ? 'is-active' : ''}
              aria-pressed={inputMode === 'basic'}
              onClick={() => changeInputMode('basic')}
            >
              基本
            </button>
            <button
              type="button"
              className={inputMode === 'detail' ? 'is-active' : ''}
              aria-pressed={inputMode === 'detail'}
              onClick={() => changeInputMode('detail')}
            >
              詳細
            </button>
          </div>

          {inputMode === 'detail' ? (
            <>
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

              <div className="taxable-deduction-groups">
                {deductionGroups.map((group) => {
                  const isOpen = openDeductionGroups[group.id]
                  const panelId = `taxable-deduction-group-${group.id}`

                  return (
                    <section
                      className="taxable-deduction-group"
                      key={group.id}
                    >
                      <button
                        className="taxable-deduction-group__trigger"
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => toggleDeductionGroup(group.id)}
                      >
                        <span>
                          <strong>{group.title}</strong>
                          <small>{group.description}</small>
                        </span>
                        <span aria-hidden="true">{isOpen ? '−' : '＋'}</span>
                      </button>

                      <div
                        className="deduction-fields"
                        id={panelId}
                        hidden={!isOpen}
                      >
                        {group.fields.map((field) => (
                          <label
                            htmlFor={`taxable-deduction-${field.key}`}
                            key={field.key}
                          >
                            <span>{field.label}</span>

                            <div className="input-with-unit">
                              <MoneyInput
                                id={`taxable-deduction-${field.key}`}
                                value={deductionInputs[field.key]}
                                onValueChange={(value) => {
                                  handleDeductionChange(field.key, value)
                                }}
                                placeholder="0"
                              />

                              <span>円</span>
                            </div>

                            <small className="field-help">
                              {field.help}
                            </small>
                          </label>
                        ))}
                      </div>
                    </section>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="taxable-basic-note">
              基本モードでは給与収入と基礎控除で概算します。社会保険料控除などを反映する場合は「詳細」を選んでください。
            </p>
          )}

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

          <div
            className="simulator-form-actions"
            data-single={isAutoCalculation}
          >
            <button
              className="reset-button"
              type="button"
              onClick={resetCalculator}
            >
              入力内容をリセット
            </button>

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
          </div>
        </div>

        <div
          className="calculator-results simulation-result-anchor"
          ref={resultsRef}
          aria-live="polite"
          tabIndex={-1}
        >
          <div className="simulator-results-heading">
            <div>
              <p>RESULT</p>
              <h3>シミュレーション結果</h3>
            </div>
            <span>2026年分・給与所得の概算</span>
          </div>

          <div className="simulator-summary-grid simulator-summary-grid--taxable">
            <div className="result-card emphasis-result">
              <span>課税所得</span>
              <strong>{displayedResult.taxableIncome === null ? '―' : formatYen(displayedResult.taxableIncome)}</strong>
              <small>1,000円未満切捨て</small>
            </div>

            <div className="result-card emphasis-result">
              <span>所得税率</span>
              <strong>{displayedResult.incomeTaxRate === null ? '―' : `${displayedResult.incomeTaxRate}%`}</strong>
              <small>課税所得に適用される税率</small>
            </div>

            <div className="result-card result-card--total">
              <span>所得税等の合計</span>
              <strong>{displayedResult.totalIncomeTax === null ? '―' : formatYen(displayedResult.totalIncomeTax)}</strong>
              <small>100円未満切捨ての概算</small>
            </div>
          </div>

          <button
            className="apply-tax-rate-button apply-tax-rate-button--panel"
            type="button"
            onClick={handleApplyIncomeTaxRate}
            disabled={displayedResult.incomeTaxRate === null}
          >
            {displayedResult.incomeTaxRate === null
              ? '所得税率を計算してください'
              : `この${displayedResult.incomeTaxRate}%をiDeCoに反映する`}
          </button>

          <div className="simulator-breakdown-panel simulator-breakdown-panel--taxable">
            <div className="simulator-subheading">
              <div>
                <p>CALCULATION BREAKDOWN</p>
                <h3>計算の内訳</h3>
              </div>
              <span>入力条件に基づく概算です</span>
            </div>

            <div className="taxable-breakdown-grid">
              <div className="result-card"><span>給与所得控除相当額</span><strong>{displayedResult.salaryIncomeDeduction === null ? '―' : formatYen(displayedResult.salaryIncomeDeduction)}</strong><small>給与収入から差し引かれる金額</small></div>
              <div className="result-card"><span>給与所得</span><strong>{displayedResult.salaryIncome === null ? '―' : formatYen(displayedResult.salaryIncome)}</strong><small>給与収入－給与所得控除相当額</small></div>
              <div className="result-card"><span>基礎控除</span><strong>{displayedResult.basicDeduction === null ? '―' : formatYen(displayedResult.basicDeduction)}</strong><small>給与所得から自動判定</small></div>
              <div className="result-card"><span>基礎控除以外の所得控除</span><strong>{displayedResult.otherDeductions === null ? '―' : formatYen(displayedResult.otherDeductions)}</strong><small>入力した所得控除の合計</small></div>
              <div className="result-card"><span>所得控除合計</span><strong>{displayedResult.totalDeductions === null ? '―' : formatYen(displayedResult.totalDeductions)}</strong><small>基礎控除＋その他の所得控除</small></div>
              <div className="result-card"><span>所得税額</span><strong>{displayedResult.baseIncomeTax === null ? '―' : formatYen(displayedResult.baseIncomeTax)}</strong><small>税額控除適用前の概算</small></div>
              <div className="result-card"><span>復興特別所得税</span><strong>{displayedResult.reconstructionSpecialIncomeTax === null ? '―' : formatYen(displayedResult.reconstructionSpecialIncomeTax)}</strong><small>所得税額の2.1％</small></div>
            </div>
          </div>
        </div>
      </div>

      {displayedResult.taxableIncome !== null && (
        <div
          id="taxable-affiliate-after-results"
          className="taxable-affiliate-placement taxable-affiliate-placement--post-simulation"
          aria-label="関連サービス"
        />
      )}

    </section>
  )
}

export default TaxableIncomeCalculator
