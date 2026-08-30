import { useEffect, useMemo, useState } from 'react'
import MoneyInput from './components/form/MoneyInput'
import {
  getMoneyInputDigits,
  normalizeMoneyInputCharacters,
} from './utils/moneyInput'

type IdecoResult = {
  annualContribution: number | null
  totalContribution: number | null
  incomeTaxSaving: number | null
  residentTaxSaving: number | null
  annualTaxSaving: number | null
  totalTaxSaving: number | null
}

const emptyResult: IdecoResult = {
  annualContribution: null,
  totalContribution: null,
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

const normalizeDecimalInput = (value: string) => {
  const converted = normalizeMoneyInputCharacters(value)
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
    getMoneyInputDigits(monthlyContribution),
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

  const totalContribution =
    annualContribution * years

  return {
    annualContribution,
    totalContribution,
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
    getMoneyInputDigits(monthlyContribution),
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

  const longTermDisplayMax = Math.max(
    displayedResult.totalContribution ?? 0,
    displayedResult.totalTaxSaving ?? 0,
  )

  const idecoTrajectory = useMemo(() => {
    if (
      displayedResult.totalContribution === null ||
      displayedResult.totalTaxSaving === null ||
      longTermDisplayMax <= 0
    ) {
      return []
    }

    return Array.from({ length: 7 }, (_, index) => {
      const ratio = index / 6

      return {
        ratio,
        label: ratio === 0
          ? '開始'
          : ratio === 1
            ? '終了'
            : `${Math.max(1, Math.round(years * ratio))}年後`,
        contribution: displayedResult.totalContribution! * ratio,
        saving: displayedResult.totalTaxSaving! * ratio,
      }
    })
  }, [
    displayedResult.totalContribution,
    displayedResult.totalTaxSaving,
    longTermDisplayMax,
    years,
  ])

  const idecoAreaGraph = useMemo(() => {
    if (idecoTrajectory.length === 0 || longTermDisplayMax <= 0) {
      return null
    }

    const width = 600
    const bottom = 180
    const plotHeight = 150
    const pointStep = width / (idecoTrajectory.length - 1)
    const toY = (value: number) =>
      bottom - value / longTermDisplayMax * plotHeight
    const contributionPoints = idecoTrajectory.map((point, index) =>
      `${index * pointStep},${toY(point.contribution)}`,
    )
    const savingPoints = idecoTrajectory.map((point, index) =>
      `${index * pointStep},${toY(point.saving)}`,
    )

    return {
      contributionArea: `0,${bottom} ${contributionPoints.join(' ')} ${width},${bottom}`,
      contributionLine: contributionPoints.join(' '),
      savingArea: `0,${bottom} ${savingPoints.join(' ')} ${width},${bottom}`,
      savingLine: savingPoints.join(' '),
    }
  }, [idecoTrajectory, longTermDisplayMax])

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
          <div className="simulator-panel-heading">
            <span aria-hidden="true">01</span>
            <div>
              <p>INPUT</p>
              <h3>条件を入力する</h3>
            </div>
          </div>

          <label>
            <span>毎月の掛金</span>

            <div className="input-with-unit">
              <MoneyInput
                value={monthlyContribution}
                onValueChange={handleMonthlyContributionChange}
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

          <aside className="simulator-input-point simulator-input-point--ideco">
            <strong>入力のポイント</strong>
            <p>
              掛金と税率を入力すると、年間と積立期間全体の節税効果を比較できます。
            </p>
          </aside>
        </div>

        <div
          className="calculator-results"
          aria-live="polite"
        >
          <div className="simulator-results-heading">
            <div>
              <p>RESULT</p>
              <h3>シミュレーション結果</h3>
            </div>
            <span>所得税・住民税の軽減額</span>
          </div>

          <div className="ideco-kpi-grid" aria-label="iDeCoの主要結果">
          <div className="simulator-summary-grid simulator-summary-grid--ideco">
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

            <div className="result-card emphasis-result">
              <span>年間節税効果（合計）</span>

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

          </div>

          <div className="ideco-longterm-summary" aria-label="掛金と節税効果の期間累計">
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

            <div className="result-card result-card--contribution-total">
              <span>掛金累計</span>

              <strong>
                {displayedResult
                  .totalContribution === null
                  ? '―'
                  : formatYen(
                    displayedResult
                      .totalContribution,
                  )}
              </strong>

              <small>
                年間掛金額 × 積立期間
              </small>
            </div>

            <div className="result-card result-card--total">
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

          <div className="ideco-visual-grid">
            <div className="simulator-chart-panel simulator-chart-panel--ideco">
              <div className="simulator-subheading">
                <div>
                  <p>LONG-TERM TRAJECTORY</p>
                  <h3>掛金累計と節税効果の推移</h3>
                </div>
                <span>{years > 0 ? `${years.toLocaleString('ja-JP')}年間` : '条件入力後に表示'}</span>
              </div>

              {idecoAreaGraph ? (
                <div className="ideco-trajectory-wrap">
                  <div className="ideco-trajectory-legend" aria-hidden="true">
                    <span><i />掛金累計</span>
                    <span><i />節税額累計</span>
                  </div>
                  <div className="ideco-area-graph" aria-label="掛金累計と期間中の節税額推移グラフ">
                    <svg viewBox="0 0 600 200" role="img" aria-hidden="true" preserveAspectRatio="none">
                      <g className="ideco-area-graph__grid">
                        <line x1="0" y1="30" x2="600" y2="30" />
                        <line x1="0" y1="80" x2="600" y2="80" />
                        <line x1="0" y1="130" x2="600" y2="130" />
                        <line x1="0" y1="180" x2="600" y2="180" />
                      </g>
                      <polygon className="ideco-area-graph__contribution" points={idecoAreaGraph.contributionArea} />
                      <polygon className="ideco-area-graph__saving" points={idecoAreaGraph.savingArea} />
                      <polyline className="ideco-area-graph__contribution-line" points={idecoAreaGraph.contributionLine} />
                      <polyline className="ideco-area-graph__saving-line" points={idecoAreaGraph.savingLine} />
                    </svg>
                    <div className="ideco-area-graph__labels" aria-hidden="true">
                      {idecoTrajectory.map((point) => (
                        <span key={point.ratio}>{point.label}</span>
                      ))}
                    </div>
                  </div>
                  <p className="ideco-trajectory-note">掛金累計には運用益を含みません。</p>
                </div>
              ) : (
                <div className="ideco-area-graph ideco-area-graph--empty" aria-label="掛金累計と節税額推移（未計算）">
                  <svg viewBox="0 0 600 200" aria-hidden="true" preserveAspectRatio="none">
                    <g className="ideco-area-graph__grid">
                      <line x1="0" y1="30" x2="600" y2="30" />
                      <line x1="0" y1="80" x2="600" y2="80" />
                      <line x1="0" y1="130" x2="600" y2="130" />
                      <line x1="0" y1="180" x2="600" y2="180" />
                    </g>
                    <polyline className="ideco-area-graph__placeholder" points="0,180 100,170 200,150 300,125 400,96 500,64 600,30" />
                  </svg>
                  <div className="ideco-area-graph__labels" aria-hidden="true">
                    <span>開始</span><span>―</span><span>―</span><span>―</span><span>―</span><span>―</span><span>終了</span>
                  </div>
                  <p>条件を入力すると、掛金累計と節税額を表示します。</p>
                </div>
              )}
            </div>

            <div className="simulator-breakdown-panel simulator-breakdown-panel--ideco">
              <div className="simulator-subheading">
                <div>
                  <p>ANNUAL BREAKDOWN</p>
                  <h3>年間節税額の内訳</h3>
                </div>
              </div>
              <div className="tax-saving-bars">
                <div>
                  <span>所得税</span>
                  <i><b style={{ width: `${displayedResult.annualTaxSaving && displayedResult.incomeTaxSaving !== null ? displayedResult.incomeTaxSaving / displayedResult.annualTaxSaving * 100 : 0}%` }} /></i>
                  <strong>{displayedResult.incomeTaxSaving === null ? '―' : formatYen(displayedResult.incomeTaxSaving)}</strong>
                </div>
                <div>
                  <span>住民税</span>
                  <i><b style={{ width: `${displayedResult.annualTaxSaving && displayedResult.residentTaxSaving !== null ? displayedResult.residentTaxSaving / displayedResult.annualTaxSaving * 100 : 0}%` }} /></i>
                  <strong>{displayedResult.residentTaxSaving === null ? '―' : formatYen(displayedResult.residentTaxSaving)}</strong>
                </div>
              </div>
            </div>
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
