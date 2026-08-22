import { useEffect, useMemo, useState } from 'react'

type IdecoResult = {
  annualContribution: number | null
  incomeTaxSaving: number | null
  residentTaxSaving: number | null
  annualTaxSaving: number | null
  totalTaxSaving: number | null
}

const emptyResult: IdecoResult = {
  annualContribution: null,
  incomeTaxSaving: null,
  residentTaxSaving: null,
  annualTaxSaving: null,
  totalTaxSaving: null,
}

const incomeTaxRates = [
  {
    rate: 0,
    taxableIncomeGuide: '課税所得なし',
  },
  {
    rate: 5,
    taxableIncomeGuide: '課税所得 195万円未満',
  },
  {
    rate: 10,
    taxableIncomeGuide:
      '課税所得 195万円以上～330万円未満',
  },
  {
    rate: 20,
    taxableIncomeGuide:
      '課税所得 330万円以上～695万円未満',
  },
  {
    rate: 23,
    taxableIncomeGuide:
      '課税所得 695万円以上～900万円未満',
  },
  {
    rate: 33,
    taxableIncomeGuide:
      '課税所得 900万円以上～1,800万円未満',
  },
  {
    rate: 40,
    taxableIncomeGuide:
      '課税所得 1,800万円以上～4,000万円未満',
  },
  {
    rate: 45,
    taxableIncomeGuide:
      '課税所得 4,000万円以上',
  },
]

const convertToHalfWidth = (value: string) => {
  return value.normalize('NFKC')
}

const getMoneyDigits = (value: string) => {
  return convertToHalfWidth(value).replace(/[^\d]/g, '')
}

const formatMoneyInput = (value: string) => {
  const digits = getMoneyDigits(value)

  if (digits === '') {
    return ''
  }

  return Number(digits).toLocaleString('ja-JP')
}

const normalizeDecimalInput = (value: string) => {
  const converted = convertToHalfWidth(value)
    .replace(/,/g, '')
    .replace(/[^\d.]/g, '')

  const [integerPart, ...decimalParts] =
    converted.split('.')

  if (decimalParts.length === 0) {
    return integerPart
  }

  return `${integerPart}.${decimalParts.join('')}`
}

const formatYen = (value: number) =>
  new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(Math.round(value))

const calculateIdeco = (
  monthlyContribution: string,
  incomeTaxRate: string,
  residentTaxRate: string,
  contributionYears: string,
): IdecoResult => {
  const monthlyAmount = Number(
    getMoneyDigits(monthlyContribution),
  )

  const incomeRate = Number(
    normalizeDecimalInput(incomeTaxRate),
  )

  const residentRate = Number(
    normalizeDecimalInput(residentTaxRate),
  )

  const years = Number(
    normalizeDecimalInput(contributionYears),
  )

  if (
    monthlyAmount <= 0 ||
    incomeRate < 0 ||
    residentRate < 0 ||
    years <= 0
  ) {
    return emptyResult
  }

  const annualContribution =
    monthlyAmount * 12

  /*
   * 所得税には、基準所得税額の2.1％にあたる
   * 復興特別所得税を概算で含めています。
   */
  const incomeTaxSaving =
    annualContribution *
    (incomeRate / 100) *
    1.021

  const residentTaxSaving =
    annualContribution *
    (residentRate / 100)

  const annualTaxSaving =
    incomeTaxSaving + residentTaxSaving

  const totalTaxSaving =
    annualTaxSaving * years

  return {
    annualContribution,
    incomeTaxSaving,
    residentTaxSaving,
    annualTaxSaving,
    totalTaxSaving,
  }
}

type IdecoCalculatorProps = {
  initialIncomeTaxRate?: number
  onOpenTaxableIncome: () => void
}

function IdecoCalculator({
  initialIncomeTaxRate,
  onOpenTaxableIncome,
}: IdecoCalculatorProps) {
  const [monthlyContribution, setMonthlyContribution] =
    useState('')

  const [incomeTaxRate, setIncomeTaxRate] =
    useState(() => String(initialIncomeTaxRate ?? 10))

  const [residentTaxRate, setResidentTaxRate] =
    useState('10')

  const [contributionYears, setContributionYears] =
    useState('')

  const [isAutoCalculation, setIsAutoCalculation] =
    useState(false)

  const [manualResult, setManualResult] =
    useState<IdecoResult | null>(null)

  useEffect(() => {
    if (initialIncomeTaxRate !== undefined) {
      setIncomeTaxRate(String(initialIncomeTaxRate))
      setManualResult(null)
    }
  }, [initialIncomeTaxRate])

  const autoResult = useMemo(
    () =>
      calculateIdeco(
        monthlyContribution,
        incomeTaxRate,
        residentTaxRate,
        contributionYears,
      ),
    [
      monthlyContribution,
      incomeTaxRate,
      residentTaxRate,
      contributionYears,
    ],
  )

  const displayedResult = isAutoCalculation
    ? autoResult
    : manualResult ?? emptyResult

  const monthlyAmount = Number(
    getMoneyDigits(monthlyContribution),
  )

  const incomeRate = Number(
    normalizeDecimalInput(incomeTaxRate),
  )

  const residentRate = Number(
    normalizeDecimalInput(residentTaxRate),
  )

  const years = Number(
    normalizeDecimalInput(contributionYears),
  )

  const canSimulate =
    monthlyAmount > 0 &&
    incomeRate >= 0 &&
    residentRate >= 0 &&
    years > 0

  const clearManualResult = () => {
    if (!isAutoCalculation) {
      setManualResult(null)
    }
  }

  const handleMonthlyContributionChange = (
    value: string,
  ) => {
    setMonthlyContribution(value)
    clearManualResult()
  }

  const handleIncomeTaxRateChange = (
    value: string,
  ) => {
    setIncomeTaxRate(value)
    clearManualResult()
  }

  const handleResidentTaxRateChange = (
    value: string,
  ) => {
    setResidentTaxRate(value)
    clearManualResult()
  }

  const handleContributionYearsChange = (
    value: string,
  ) => {
    setContributionYears(value)
    clearManualResult()
  }

  const simulate = () => {
    setManualResult(
      calculateIdeco(
        monthlyContribution,
        incomeTaxRate,
        residentTaxRate,
        contributionYears,
      ),
    )
  }

  const resetCalculator = () => {
    setMonthlyContribution('')
    setIncomeTaxRate('10')
    setResidentTaxRate('10')
    setContributionYears('')
    setManualResult(null)
  }

  const changeCalculationMode = (
    checked: boolean,
  ) => {
    setIsAutoCalculation(checked)
    setManualResult(null)
  }

  const openTaxableIncomeCalculator = () => {
    onOpenTaxableIncome()
  }

  const selectedIncomeTaxRate =
    incomeTaxRates.find(
      (item) =>
        String(item.rate) === incomeTaxRate,
    ) ?? incomeTaxRates[0]

  return (
    <section
      className="calculator"
      aria-labelledby="ideco-title"
    >
      <div className="calculator-heading">
        <p className="section-label">
          IDECO TAX SAVING CALCULATOR
        </p>

        <h2 id="ideco-title">
          <span>iDeCo節税</span>
          <wbr />
          <span>シミュレーター</span>
        </h2>

        <p>
          毎月の掛金と税率から、
          iDeCoによる所得税・住民税の軽減額を
          概算します。
        </p>
      </div>

      <div className="calculator-layout">
        <div className="calculator-form">
          <label>
            <span>毎月の掛金</span>

            <div className="input-with-unit">
              <input
                type="text"
                inputMode="numeric"
                value={monthlyContribution}
                onChange={(event) => {
                  const value = event.target.value

                  if (
                    event.nativeEvent instanceof InputEvent &&
                    event.nativeEvent.isComposing
                  ) {
                    handleMonthlyContributionChange(
                      value,
                    )
                    return
                  }

                  handleMonthlyContributionChange(
                    formatMoneyInput(value),
                  )
                }}
                onCompositionEnd={(event) => {
                  handleMonthlyContributionChange(
                    formatMoneyInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                onBlur={(event) => {
                  handleMonthlyContributionChange(
                    formatMoneyInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                placeholder="例：23,000"
              />

              <span>円</span>
            </div>
          </label>

          <div
            id="ideco-income-tax-rate-field"
            className="calculator-field"
          >
            <div className="field-label-row">
              <label htmlFor="ideco-income-tax-rate-select">
                所得税率
              </label>

              <span className="tooltip-container">
                <button
                  className="tooltip-button"
                  type="button"
                  aria-label="課税所得についての説明"
                  aria-describedby="taxable-income-tooltip"
                >
                  ?
                </button>

                <span
                  id="taxable-income-tooltip"
                  className="tooltip-content"
                  role="tooltip"
                >
                  課税所得は、給与収入から給与所得控除や
                  社会保険料控除、基礎控除などを
                  差し引いた後の金額です。
                </span>
              </span>
            </div>

            <div className="tax-rate-select">
              <div
                className="tax-rate-select-display"
                aria-hidden="true"
              >
                <strong className="tax-rate-value">
                  {selectedIncomeTaxRate.rate}%
                </strong>

                <span className="tax-rate-divider">
                  |
                </span>

                <span className="tax-rate-guide">
                  {
                    selectedIncomeTaxRate
                      .taxableIncomeGuide
                  }
                </span>

                <span className="tax-rate-arrow">
                  ▼
                </span>
              </div>

              <select
                id="ideco-income-tax-rate-select"
                className="tax-rate-native-select"
                value={incomeTaxRate}
                aria-label="所得税率"
                onChange={(event) =>
                  handleIncomeTaxRateChange(
                    event.target.value,
                  )
                }
              >
                {incomeTaxRates.map((item) => (
                  <option
                    key={item.rate}
                    value={item.rate}
                  >
                    {item.rate}%｜{item.taxableIncomeGuide}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="calculator-helper-link"
            type="button"
            onClick={openTaxableIncomeCalculator}
          >
            自分の所得税率を調べる
          </button>

          <label>
            <span>住民税率</span>

            <div className="input-with-unit">
              <input
                type="text"
                inputMode="decimal"
                value={residentTaxRate}
                onChange={(event) => {
                  const value = event.target.value

                  if (
                    event.nativeEvent instanceof InputEvent &&
                    event.nativeEvent.isComposing
                  ) {
                    handleResidentTaxRateChange(
                      value,
                    )
                    return
                  }

                  handleResidentTaxRateChange(
                    normalizeDecimalInput(value),
                  )
                }}
                onCompositionEnd={(event) => {
                  handleResidentTaxRateChange(
                    normalizeDecimalInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                onBlur={(event) => {
                  handleResidentTaxRateChange(
                    normalizeDecimalInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                placeholder="例：10"
              />

              <span>%</span>
            </div>
          </label>

          <label>
            <span>積立期間</span>

            <div className="input-with-unit">
              <input
                type="text"
                inputMode="decimal"
                value={contributionYears}
                onChange={(event) => {
                  const value = event.target.value

                  if (
                    event.nativeEvent instanceof InputEvent &&
                    event.nativeEvent.isComposing
                  ) {
                    handleContributionYearsChange(
                      value,
                    )
                    return
                  }

                  handleContributionYearsChange(
                    normalizeDecimalInput(value),
                  )
                }}
                onCompositionEnd={(event) => {
                  handleContributionYearsChange(
                    normalizeDecimalInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                onBlur={(event) => {
                  handleContributionYearsChange(
                    normalizeDecimalInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                placeholder="例：20"
              />

              <span>年</span>
            </div>
          </label>

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
                入力と同時に計算結果を更新する
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
            <span>年間掛金額</span>

            <strong>
              {displayedResult
                .annualContribution === null
                ? '―'
                : formatYen(
                  displayedResult
                    .annualContribution,
                )}
            </strong>

            <small>
              毎月の掛金 × 12か月
            </small>
          </div>

          <div className="result-card">
            <span>年間の所得税軽減額</span>

            <strong>
              {displayedResult
                .incomeTaxSaving === null
                ? '―'
                : formatYen(
                  displayedResult
                    .incomeTaxSaving,
                )}
            </strong>

            <small>
              復興特別所得税を含む概算
            </small>
          </div>

          <div className="result-card">
            <span>年間の住民税軽減額</span>

            <strong>
              {displayedResult
                .residentTaxSaving === null
                ? '―'
                : formatYen(
                  displayedResult
                    .residentTaxSaving,
                )}
            </strong>

            <small>
              年間掛金額 × 住民税率
            </small>
          </div>

          <div className="result-card">
            <span>年間節税額</span>

            <strong>
              {displayedResult
                .annualTaxSaving === null
                ? '―'
                : formatYen(
                  displayedResult
                    .annualTaxSaving,
                )}
            </strong>

            <small>
              所得税軽減額＋住民税軽減額
            </small>
          </div>

          <div className="result-card">
            <span>期間中の節税額合計</span>

            <strong>
              {displayedResult
                .totalTaxSaving === null
                ? '―'
                : formatYen(
                  displayedResult
                    .totalTaxSaving,
                )}
            </strong>

            <small>
              年間節税額 × 積立期間
            </small>
          </div>
        </div>
      </div>

      <p className="calculator-note">
        本シミュレーターは概算です。
        実際の税額は課税所得、所得控除、
        税率区分、掛金の拠出月数などにより
        異なります。運用益、手数料、
        受取時の税金は含んでいません。
      </p>
    </section>
  )
}

export default IdecoCalculator
