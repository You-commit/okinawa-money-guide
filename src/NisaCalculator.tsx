import { useMemo, useState } from 'react'

type NisaResult = {
  totalPrincipal: number | null
  investmentGain: number | null
  futureValue: number | null
}

const emptyResult: NisaResult = {
  totalPrincipal: null,
  investmentGain: null,
  futureValue: null,
}

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

  const [integerPart, ...decimalParts] = converted.split('.')

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

const calculateNisa = (
  initialInvestment: string,
  monthlyContribution: string,
  annualReturnRate: string,
  investmentYears: string,
): NisaResult => {
  const initialAmount = Number(
    getMoneyDigits(initialInvestment),
  )

  const monthlyAmount = Number(
    getMoneyDigits(monthlyContribution),
  )

  const annualRate = Number(
    normalizeDecimalInput(annualReturnRate),
  )

  const years = Number(
    normalizeDecimalInput(investmentYears),
  )

  if (
    initialAmount < 0 ||
    monthlyAmount < 0 ||
    annualRate < 0 ||
    years <= 0 ||
    (initialAmount === 0 && monthlyAmount === 0)
  ) {
    return emptyResult
  }

  const numberOfMonths = Math.round(years * 12)
  const monthlyRate = annualRate / 100 / 12

  let initialFutureValue: number
  let contributionFutureValue: number

  if (monthlyRate === 0) {
    initialFutureValue = initialAmount
    contributionFutureValue =
      monthlyAmount * numberOfMonths
  } else {
    initialFutureValue =
      initialAmount *
      Math.pow(1 + monthlyRate, numberOfMonths)

    contributionFutureValue =
      monthlyAmount *
      (
        Math.pow(1 + monthlyRate, numberOfMonths) - 1
      ) /
      monthlyRate
  }

  const futureValue =
    initialFutureValue + contributionFutureValue

  const totalPrincipal =
    initialAmount +
    monthlyAmount * numberOfMonths

  const investmentGain =
    futureValue - totalPrincipal

  return {
    totalPrincipal,
    investmentGain,
    futureValue,
  }
}

function NisaCalculator() {
  const [initialInvestment, setInitialInvestment] =
    useState('')

  const [monthlyContribution, setMonthlyContribution] =
    useState('')

  const [annualReturnRate, setAnnualReturnRate] =
    useState('')

  const [investmentYears, setInvestmentYears] =
    useState('')

  const [isAutoCalculation, setIsAutoCalculation] =
    useState(false)

  const [manualResult, setManualResult] =
    useState<NisaResult | null>(null)

  const autoResult = useMemo(
    () =>
      calculateNisa(
        initialInvestment,
        monthlyContribution,
        annualReturnRate,
        investmentYears,
      ),
    [
      initialInvestment,
      monthlyContribution,
      annualReturnRate,
      investmentYears,
    ],
  )

  const displayedResult = isAutoCalculation
    ? autoResult
    : manualResult ?? emptyResult

  const initialAmount = Number(
    getMoneyDigits(initialInvestment),
  )

  const monthlyAmount = Number(
    getMoneyDigits(monthlyContribution),
  )

  const annualRate = Number(
    normalizeDecimalInput(annualReturnRate),
  )

  const years = Number(
    normalizeDecimalInput(investmentYears),
  )

  const canSimulate =
    (initialAmount > 0 || monthlyAmount > 0) &&
    annualReturnRate !== '' &&
    annualRate >= 0 &&
    years > 0

  const clearManualResult = () => {
    if (!isAutoCalculation) {
      setManualResult(null)
    }
  }

  const handleInitialInvestmentChange = (
    value: string,
  ) => {
    setInitialInvestment(value)
    clearManualResult()
  }

  const handleMonthlyContributionChange = (
    value: string,
  ) => {
    setMonthlyContribution(value)
    clearManualResult()
  }

  const handleAnnualReturnRateChange = (
    value: string,
  ) => {
    setAnnualReturnRate(value)
    clearManualResult()
  }

  const handleInvestmentYearsChange = (
    value: string,
  ) => {
    setInvestmentYears(value)
    clearManualResult()
  }

  const simulate = () => {
    setManualResult(
      calculateNisa(
        initialInvestment,
        monthlyContribution,
        annualReturnRate,
        investmentYears,
      ),
    )
  }

  const resetCalculator = () => {
    setInitialInvestment('')
    setMonthlyContribution('')
    setAnnualReturnRate('')
    setInvestmentYears('')
    setManualResult(null)
  }

  const changeCalculationMode = (checked: boolean) => {
    setIsAutoCalculation(checked)
    setManualResult(null)
  }

  return (
    <section
      className="calculator"
      aria-labelledby="nisa-title"
    >
      <div className="calculator-heading">
        <p className="section-label">
          NISA CALCULATOR
        </p>

        <h2 id="nisa-title">
          <span>NISA積立</span>
          <wbr />
          <span>シミュレーター</span>
        </h2>

        <p>
          投資額・想定年利・運用期間から、
          将来の資産額を複利計算で試算します。
        </p>
      </div>

      <div className="calculator-layout">
        <div className="calculator-form">
          <label>
            <span>初期投資額（任意）</span>

            <div className="input-with-unit">
              <input
                type="text"
                inputMode="numeric"
                value={initialInvestment}
                onChange={(event) => {
                  const value = event.target.value

                  if (event.nativeEvent instanceof InputEvent &&
                      event.nativeEvent.isComposing) {
                    handleInitialInvestmentChange(value)
                    return
                  }

                  handleInitialInvestmentChange(
                    formatMoneyInput(value),
                  )
                }}
                onCompositionEnd={(event) => {
                  handleInitialInvestmentChange(
                    formatMoneyInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                onBlur={(event) => {
                  handleInitialInvestmentChange(
                    formatMoneyInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                placeholder="例：1,000,000"
              />

              <span>円</span>
            </div>
          </label>

          <label>
            <span>毎月積立額</span>

            <div className="input-with-unit">
              <input
                type="text"
                inputMode="numeric"
                value={monthlyContribution}
                onChange={(event) => {
                  const value = event.target.value

                  if (event.nativeEvent instanceof InputEvent &&
                      event.nativeEvent.isComposing) {
                    handleMonthlyContributionChange(value)
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
                placeholder="例：30,000"
              />

              <span>円</span>
            </div>
          </label>

          <label>
            <span>想定年利</span>

            <div className="input-with-unit">
              <input
                type="text"
                inputMode="decimal"
                value={annualReturnRate}
                onChange={(event) => {
                  const value = event.target.value

                  if (event.nativeEvent instanceof InputEvent &&
                      event.nativeEvent.isComposing) {
                    handleAnnualReturnRateChange(value)
                    return
                  }

                  handleAnnualReturnRateChange(
                    normalizeDecimalInput(value),
                  )
                }}
                onCompositionEnd={(event) => {
                  handleAnnualReturnRateChange(
                    normalizeDecimalInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                onBlur={(event) => {
                  handleAnnualReturnRateChange(
                    normalizeDecimalInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                placeholder="例：5.0"
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
                value={investmentYears}
                onChange={(event) => {
                  const value = event.target.value

                  if (event.nativeEvent instanceof InputEvent &&
                      event.nativeEvent.isComposing) {
                    handleInvestmentYearsChange(value)
                    return
                  }

                  handleInvestmentYearsChange(
                    normalizeDecimalInput(value),
                  )
                }}
                onCompositionEnd={(event) => {
                  handleInvestmentYearsChange(
                    normalizeDecimalInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                onBlur={(event) => {
                  handleInvestmentYearsChange(
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
            <span>投資元本</span>

            <strong>
              {displayedResult.totalPrincipal === null
                ? '―'
                : formatYen(
                    displayedResult.totalPrincipal,
                  )}
            </strong>

            <small>
              初期投資額＋積立額の合計
            </small>
          </div>

          <div className="result-card">
            <span>運用収益</span>

            <strong>
              {displayedResult.investmentGain === null
                ? '―'
                : formatYen(
                    displayedResult.investmentGain,
                  )}
            </strong>

            <small>
              将来資産額−投資元本
            </small>
          </div>

          <div className="result-card">
            <span>将来の資産額</span>

            <strong>
              {displayedResult.futureValue === null
                ? '―'
                : formatYen(
                    displayedResult.futureValue,
                  )}
            </strong>

            <small>
              毎月末積立・月次複利による概算
            </small>
          </div>
        </div>
      </div>

      <p className="calculator-note">
        本シミュレーターは、一定の利回りで毎月末に積み立てる想定の概算です。
        実際の運用成果、手数料、価格変動などを保証するものではありません。
      </p>
    </section>
  )
}

export default NisaCalculator