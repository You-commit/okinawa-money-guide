import { useMemo, useState } from 'react'
import MoneyInput from './components/form/MoneyInput'
import {
  getMoneyInputDigits,
  normalizeMoneyInputCharacters,
} from './utils/moneyInput'

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

const normalizeDecimalInput = (value: string) => {
  const converted = normalizeMoneyInputCharacters(value)
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
    getMoneyInputDigits(initialInvestment),
  )

  const monthlyAmount = Number(
    getMoneyInputDigits(monthlyContribution),
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
    getMoneyInputDigits(initialInvestment),
  )

  const monthlyAmount = Number(
    getMoneyInputDigits(monthlyContribution),
  )

  const annualRate = Number(
    normalizeDecimalInput(annualReturnRate),
  )

  const years = Number(
    normalizeDecimalInput(investmentYears),
  )

  const finalAssetValue = displayedResult.futureValue

  const assetTrajectory = useMemo(() => {
    if (finalAssetValue === null || years <= 0) {
      return []
    }

    return Array.from({ length: 7 }, (_, index) => index / 6).map((ratio) => {
      const pointYears = years * ratio
      const pointResult = ratio === 0
        ? {
            totalPrincipal: initialAmount,
            investmentGain: 0,
            futureValue: initialAmount,
          }
        : calculateNisa(
            initialInvestment,
            monthlyContribution,
            annualReturnRate,
            String(pointYears),
          )

      return {
        label: ratio === 0
          ? '開始'
          : ratio === 1
            ? '終了'
            : `${pointYears.toLocaleString('ja-JP', { maximumFractionDigits: 1 })}年後`,
        principal: pointResult.totalPrincipal ?? 0,
        gain: pointResult.investmentGain ?? 0,
        futureValue: pointResult.futureValue ?? 0,
        ratio,
      }
    })
  }, [
    annualReturnRate,
    finalAssetValue,
    initialInvestment,
    monthlyContribution,
    years,
    initialAmount,
  ])

  const assetAreaGraph = useMemo(() => {
    if (assetTrajectory.length === 0 || !finalAssetValue) {
      return null
    }

    const width = 600
    const bottom = 180
    const plotHeight = 150
    const pointStep = width / (assetTrajectory.length - 1)
    const toY = (value: number) =>
      bottom - value / finalAssetValue * plotHeight
    const principalPoints = assetTrajectory.map((point, index) =>
      `${index * pointStep},${toY(point.principal)}`,
    )
    const totalPoints = assetTrajectory.map((point, index) =>
      `${index * pointStep},${toY(point.futureValue)}`,
    )

    return {
      principalArea: `0,${bottom} ${principalPoints.join(' ')} ${width},${bottom}`,
      gainArea: `${totalPoints.join(' ')} ${[...principalPoints].reverse().join(' ')}`,
      totalLine: totalPoints.join(' '),
    }
  }, [assetTrajectory, finalAssetValue])

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
          <div className="simulator-panel-heading">
            <span aria-hidden="true">01</span>
            <div>
              <p>INPUT</p>
              <h3>条件を入力する</h3>
            </div>
          </div>

          <label>
            <span>初期投資額（任意）</span>

            <div className="input-with-unit">
              <MoneyInput
                value={initialInvestment}
                onValueChange={handleInitialInvestmentChange}
                placeholder="例：1,000,000"
              />

              <span>円</span>
            </div>
          </label>

          <label>
            <span>毎月積立額</span>

            <div className="input-with-unit">
              <MoneyInput
                value={monthlyContribution}
                onValueChange={handleMonthlyContributionChange}
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
          className="calculator-results"
          aria-live="polite"
        >
          <div className="simulator-results-heading">
            <div>
              <p>RESULT</p>
              <h3>シミュレーション結果</h3>
            </div>
            <span>毎月末積立・月次複利</span>
          </div>

          <div className="simulator-summary-grid simulator-summary-grid--nisa">
            <div className="result-card emphasis-result result-card--future">
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

            <div className="result-card">
              <span>積立元本の合計</span>

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

            <div className="result-card result-card--gain">
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

            <div className="result-card result-card--tax-free-note">
              <span>非課税メリット</span>

              <strong>別途確認</strong>

              <small>
                税率や売却時期により異なるため、金額は表示していません
              </small>
            </div>

          </div>

          <div className="simulator-chart-panel simulator-chart-panel--nisa">
            <div className="simulator-subheading">
              <div>
                <p>ASSET TRAJECTORY</p>
                <h3>資産の推移イメージ</h3>
              </div>
              <span>{years > 0 ? `運用期間 ${years.toLocaleString('ja-JP')}年` : '条件入力後に表示'}</span>
            </div>

            {assetAreaGraph ? (
              <div className="nisa-trajectory-wrap">
                <div className="nisa-trajectory-legend" aria-hidden="true">
                  <span><i />積立元本</span>
                  <span><i />運用益</span>
                  <span><i />将来資産額</span>
                </div>
                <div className="nisa-area-graph" aria-label="元本と運用益を含む資産推移の概算グラフ">
                  <svg viewBox="0 0 600 200" role="img" aria-hidden="true" preserveAspectRatio="none">
                    <g className="nisa-area-graph__grid">
                      <line x1="0" y1="30" x2="600" y2="30" />
                      <line x1="0" y1="80" x2="600" y2="80" />
                      <line x1="0" y1="130" x2="600" y2="130" />
                      <line x1="0" y1="180" x2="600" y2="180" />
                    </g>
                    <polygon className="nisa-area-graph__principal" points={assetAreaGraph.principalArea} />
                    <polygon className="nisa-area-graph__gain" points={assetAreaGraph.gainArea} />
                    <polyline className="nisa-area-graph__total" points={assetAreaGraph.totalLine} />
                  </svg>
                  <div className="nisa-area-graph__labels" aria-hidden="true">
                    {assetTrajectory.map((point) => (
                      <span key={point.ratio}>{point.label}</span>
                    ))}
                  </div>
                  <strong>{formatYen(finalAssetValue!)}</strong>
                </div>
              </div>
            ) : (
              <div className="nisa-area-graph nisa-area-graph--empty" aria-label="資産推移（未計算）">
                <svg viewBox="0 0 600 200" aria-hidden="true" preserveAspectRatio="none">
                  <g className="nisa-area-graph__grid">
                    <line x1="0" y1="30" x2="600" y2="30" />
                    <line x1="0" y1="80" x2="600" y2="80" />
                    <line x1="0" y1="130" x2="600" y2="130" />
                    <line x1="0" y1="180" x2="600" y2="180" />
                  </g>
                  <polyline className="nisa-area-graph__placeholder" points="0,180 100,168 200,150 300,125 400,98 500,65 600,28" />
                </svg>
                <div className="nisa-area-graph__labels" aria-hidden="true">
                  <span>開始</span><span>―</span><span>―</span><span>―</span><span>―</span><span>―</span><span>終了</span>
                </div>
                <p>条件を入力すると、資産推移の概算を表示します。</p>
              </div>
            )}
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
