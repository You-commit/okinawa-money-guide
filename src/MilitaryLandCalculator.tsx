import {
  useId,
  useMemo,
  useRef,
  useState,
  type Ref,
} from 'react'
import { routes } from './app/routes'
import MoneyInput from './components/form/MoneyInput'
import {
  buildMilitaryLandScenario,
  calculateMilitaryLandResults,
  emptyMilitaryLandResult,
  type MilitaryLandCalculationInputs,
  type MilitaryLandCalculationResult,
} from './militaryLandCalculation'
import {
  getMoneyInputDigits,
  normalizeMoneyInputCharacters,
} from './utils/moneyInput'

type MoneyFieldProps = {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
  inputRef?: Ref<HTMLInputElement>
  required?: boolean
}

type NumberFieldProps = {
  label: string
  value: string
  placeholder: string
  unit: string
  onChange: (value: string) => void
  integer?: boolean
}

const MOBILE_VIEWPORT_QUERY = '(max-width: 760px)'
const scrollToMobileTarget = (target: HTMLElement | null) => {
  if (
    target === null ||
    !window.matchMedia(MOBILE_VIEWPORT_QUERY).matches
  ) {
    return
  }

  const behavior = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
    ? 'auto'
    : 'smooth'

  window.requestAnimationFrame(() => {
    target.scrollIntoView({
      behavior,
      block: 'start',
    })
  })
}

const formatYen = (value: number) =>
  new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value)

const formatManYen = (value: number) =>
  `${new Intl.NumberFormat('ja-JP', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 10_000)}万円`

const formatPeriodManYen = (value: number) => {
  const amount = value / 10_000

  return `${new Intl.NumberFormat('ja-JP', {
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 1,
  }).format(amount)}万円`
}

const formatSignedExpense = (value: number) =>
  value > 0 ? `−${formatYen(value)}` : formatYen(0)

const normalizeDecimalInput = (value: string) => {
  const converted = normalizeMoneyInputCharacters(value)
    .replace(/,/g, '')
    .replace(/[^\d.]/g, '')
  const [integerPart, ...decimalParts] = converted.split('.')

  return decimalParts.length === 0
    ? integerPart
    : `${integerPart}.${decimalParts.join('')}`
}

const normalizeIntegerInput = (value: string) =>
  normalizeMoneyInputCharacters(value).replace(/[^\d]/g, '')

const parseMoney = (value: string) =>
  Number(getMoneyInputDigits(value))

function MoneyField({
  label,
  value,
  placeholder,
  onChange,
  inputRef,
  required = false,
}: MoneyFieldProps) {
  return (
    <label className="military-input-row">
      <span>
        {label}
        {required ? <em>必須</em> : null}
      </span>
      <div className="input-with-unit">
        <MoneyInput
          ref={inputRef}
          value={value}
          onValueChange={onChange}
          placeholder={placeholder}
        />
        <span>円</span>
      </div>
    </label>
  )
}

function NumberField({
  label,
  value,
  placeholder,
  unit,
  onChange,
  integer = false,
}: NumberFieldProps) {
  const normalize = integer
    ? normalizeIntegerInput
    : normalizeDecimalInput

  return (
    <label className="military-input-row">
      <span>{label}</span>
      <div className="input-with-unit">
        <input
          type="text"
          inputMode={integer ? 'numeric' : 'decimal'}
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value

            if (
              event.nativeEvent instanceof InputEvent &&
              event.nativeEvent.isComposing
            ) {
              onChange(nextValue)
              return
            }

            onChange(normalize(nextValue))
          }}
          onCompositionEnd={(event) => {
            onChange(normalize(event.currentTarget.value))
          }}
          onBlur={(event) => {
            onChange(normalize(event.currentTarget.value))
          }}
          placeholder={placeholder}
        />
        <span>{unit}</span>
      </div>
    </label>
  )
}

type ScenarioPeriodFieldProps = {
  value: string
  onChange: (value: string) => void
}

function ScenarioPeriodField({
  value,
  onChange,
}: ScenarioPeriodFieldProps) {
  const inputId = useId()
  const tooltipId = useId()

  return (
    <div className="military-input-row military-scenario-period-field">
      <div className="military-scenario-period-label">
        <label htmlFor={inputId}>収支シミュレーション期間</label>
        <button
          className="military-scenario-tooltip-trigger"
          type="button"
          aria-label="収支シミュレーション期間の説明"
          aria-describedby={tooltipId}
        >
          i
        </button>
        <span
          className="military-scenario-tooltip"
          id={tooltipId}
          role="tooltip"
        >
          現在の入力条件が変わらないと仮定した単純シナリオを、何年間表示するかを指定します。実際の契約期間や将来の収益を予測するものではありません。
        </span>
      </div>
      <div className="input-with-unit">
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          value={value}
          aria-describedby={tooltipId}
          onChange={(event) => {
            const nextValue = event.target.value

            if (
              event.nativeEvent instanceof InputEvent &&
              event.nativeEvent.isComposing
            ) {
              onChange(nextValue)
              return
            }

            onChange(normalizeIntegerInput(nextValue))
          }}
          onCompositionEnd={(event) => {
            onChange(normalizeIntegerInput(event.currentTarget.value))
          }}
          onBlur={(event) => {
            onChange(normalizeIntegerInput(event.currentTarget.value))
          }}
          placeholder="表示年数を入力"
        />
        <span>年</span>
      </div>
    </div>
  )
}

function MilitaryLandCalculator() {
  const formRef = useRef<HTMLDivElement>(null)
  const annualRentInputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [annualRent, setAnnualRent] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [leaseYears, setLeaseYears] = useState('')
  const [fixedAssetTax, setFixedAssetTax] = useState('')
  const [managementExpenses, setManagementExpenses] = useState('')
  const [hasLoan, setHasLoan] = useState(false)
  const [loanAmount, setLoanAmount] = useState('')
  const [loanTerm, setLoanTerm] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [isAutoCalculation, setIsAutoCalculation] = useState(false)
  const [manualResult, setManualResult] =
    useState<MilitaryLandCalculationResult | null>(null)

  const calculationInputs = useMemo<MilitaryLandCalculationInputs>(
    () => ({
      annualRent,
      purchasePrice,
      leaseYears,
      fixedAssetTax,
      managementExpenses,
      hasLoan,
      loanAmount,
      loanTerm,
      interestRate,
    }),
    [
      annualRent,
      purchasePrice,
      leaseYears,
      fixedAssetTax,
      managementExpenses,
      hasLoan,
      loanAmount,
      loanTerm,
      interestRate,
    ],
  )

  const autoResult = useMemo(
    () => calculateMilitaryLandResults(calculationInputs),
    [calculationInputs],
  )

  const displayedResult = isAutoCalculation
    ? autoResult
    : manualResult ?? emptyMilitaryLandResult
  const hasDisplayedResult = displayedResult.surfaceYield !== null
  const canSimulate =
    parseMoney(annualRent) > 0 &&
    parseMoney(purchasePrice) > 0

  const clearManualResult = () => {
    if (!isAutoCalculation) {
      setManualResult(null)
    }
  }

  const updateInput = (
    setter: (value: string) => void,
    value: string,
  ) => {
    setter(value)
    clearManualResult()
  }

  const simulate = () => {
    setManualResult(calculateMilitaryLandResults(calculationInputs))
    scrollToMobileTarget(resultsRef.current)
  }

  const returnToInputs = () => {
    scrollToMobileTarget(formRef.current)

    if (!window.matchMedia(MOBILE_VIEWPORT_QUERY).matches) {
      return
    }

    window.requestAnimationFrame(() => {
      annualRentInputRef.current?.focus({ preventScroll: true })
    })
  }

  const resetCalculator = () => {
    setAnnualRent('')
    setPurchasePrice('')
    setLeaseYears('')
    setFixedAssetTax('')
    setManagementExpenses('')
    setHasLoan(false)
    setLoanAmount('')
    setLoanTerm('')
    setInterestRate('')
    setManualResult(null)
  }

  const changeCalculationMode = (checked: boolean) => {
    setIsAutoCalculation(checked)
    setManualResult(null)
  }

  const trajectory = useMemo(() => {
    return buildMilitaryLandScenario({
      coreAnnualIncome: displayedResult.coreAnnualIncome,
      scenarioYears: displayedResult.leaseYears,
      annualPayment: displayedResult.annualPayment,
      loanTermYears: displayedResult.loanTermYears,
    })
  }, [displayedResult])

  const periodEarnings = useMemo(() => {
    if (trajectory.length < 2) {
      return []
    }

    return trajectory.slice(1).map((point, index) => {
      const previous = trajectory[index]

      return {
        label: `${point.year}年後`,
        propertyValue: point.propertyValue - previous.propertyValue,
        repaymentValue:
          point.repaymentValue !== null &&
          previous.repaymentValue !== null
            ? point.repaymentValue - previous.repaymentValue
            : null,
      }
    })
  }, [trajectory])

  const lineGraph = useMemo(() => {
    if (trajectory.length === 0) {
      return null
    }

    const values = trajectory.flatMap((point) =>
      point.repaymentValue === null
        ? [point.propertyValue]
        : [point.propertyValue, point.repaymentValue],
    )
    const minimum = Math.min(0, ...values)
    const maximum = Math.max(0, ...values)
    const range = Math.max(1, maximum - minimum)
    const pointList = trajectory.map((point, index) => {
      const x = 24 + (552 * index) / (trajectory.length - 1)
      const propertyY = 164 - (
        (point.propertyValue - minimum) / range
      ) * 132
      const repaymentY = point.repaymentValue === null
        ? null
        : 164 - ((point.repaymentValue - minimum) / range) * 132

      return { ...point, x, propertyY, repaymentY }
    })
    const zeroY = 164 - ((0 - minimum) / range) * 132

    return {
      points: pointList,
      propertyLine: pointList
        .map((point) => `${point.x},${point.propertyY}`)
        .join(' '),
      repaymentLine: pointList.every(
        (point) => point.repaymentY !== null,
      )
        ? pointList
          .map((point) => `${point.x},${point.repaymentY}`)
          .join(' ')
        : null,
      area: [
        `${pointList[0].x},${zeroY}`,
        ...pointList.map(
          (point) => `${point.x},${point.propertyY}`,
        ),
        `${pointList[pointList.length - 1].x},${zeroY}`,
      ].join(' '),
      zeroY,
    }
  }, [trajectory])

  const maximumPeriodEarning = Math.max(
    1,
    ...periodEarnings.map((period) =>
      Math.abs(period.propertyValue),
    ),
  )
  const finalTrajectoryPoint =
    trajectory[trajectory.length - 1]

  return (
    <section
      className="calculator calculator--military-expanded"
      aria-labelledby="military-land-title"
    >
      <div className="calculator-heading calculator-heading--military">
        <p className="section-label">MILITARY LAND CALCULATOR</p>
        <h2 id="military-land-title">軍用地利回りシミュレーター</h2>
        <p>購入価格・年間借地料・経費から、費用控除後利回りと長期収支の単純シナリオを概算します。</p>
      </div>

      <div className="calculator-layout military-calculator-layout">
        <div className="calculator-form military-expanded-form" ref={formRef}>
          <div className="simulator-panel-heading">
            <span aria-hidden="true">01</span>
            <div>
              <p>INPUT</p>
              <h3>条件を入力する</h3>
            </div>
          </div>

          <MoneyField
            label="購入価格"
            value={purchasePrice}
            placeholder="例：25,000,000"
            required
            onChange={(value) => updateInput(setPurchasePrice, value)}
          />
          <MoneyField
            label="年間借地料（年間地代）"
            value={annualRent}
            placeholder="例：1,750,000"
            required
            inputRef={annualRentInputRef}
            onChange={(value) => updateInput(setAnnualRent, value)}
          />
          <ScenarioPeriodField
            value={leaseYears}
            onChange={(value) => updateInput(setLeaseYears, value)}
          />
          <MoneyField
            label="固定資産税（年額）"
            value={fixedAssetTax}
            placeholder="例：35,000"
            onChange={(value) => updateInput(setFixedAssetTax, value)}
          />
          <MoneyField
            label="管理費・その他経費（年額）"
            value={managementExpenses}
            placeholder="例：15,000"
            onChange={(value) => updateInput(setManagementExpenses, value)}
          />
          <fieldset className="military-loan-choice">
            <legend>金利（借入がある場合）</legend>
            <label>
              <input
                type="radio"
                name="military-loan"
                checked={!hasLoan}
                onChange={() => {
                  setHasLoan(false)
                  clearManualResult()
                }}
              />
              なし
            </label>
            <label>
              <input
                type="radio"
                name="military-loan"
                checked={hasLoan}
                onChange={() => {
                  setHasLoan(true)
                  clearManualResult()
                }}
              />
              あり
            </label>
          </fieldset>

          {hasLoan ? (
            <div className="military-loan-fields" aria-label="借入条件（任意）">
              <strong>借入条件（任意）</strong>
              <MoneyField
                label="借入額"
                value={loanAmount}
                placeholder="例：10,000,000"
                onChange={(value) => updateInput(setLoanAmount, value)}
              />
              <NumberField
                label="借入期間"
                value={loanTerm}
                placeholder="例：20"
                unit="年"
                integer
                onChange={(value) => updateInput(setLoanTerm, value)}
              />
              <NumberField
                label="金利（年率）"
                value={interestRate}
                placeholder="例：1.5"
                unit="%"
                onChange={(value) => updateInput(setInterestRate, value)}
              />
              <p className="military-field-note">
                借入額・借入期間・金利から、元利均等返済による概算返済額を計算します。
              </p>
            </div>
          ) : null}

          <div className="calculation-mode">
            <label className="mode-checkbox">
              <input
                type="checkbox"
                checked={isAutoCalculation}
                onChange={(event) =>
                  changeCalculationMode(event.target.checked)
                }
              />
              <span className="mode-checkbox__title">
                入力と同時に計算結果を更新する
              </span>
            </label>
            <p className="calculation-mode__description">
              {isAutoCalculation
                ? '入力内容を変更すると結果が自動更新されます。'
                : '計算ボタンを押すと結果が表示されます。'}
            </p>
          </div>

          <div className="simulator-form-actions" data-single={isAutoCalculation}>
            <button
              className="reset-button"
              type="button"
              onClick={resetCalculator}
            >
              入力内容をリセット
            </button>
            {!isAutoCalculation ? (
              <button
                className="simulate-button"
                type="button"
                onClick={simulate}
                disabled={!canSimulate}
              >
                シミュレートする
              </button>
            ) : null}
          </div>

          <aside className="simulator-input-point simulator-input-point--military">
            <strong>入力のポイント</strong>
            <ul>
              <li>借地料は年間の収入額です。</li>
              <li>固定資産税・管理費は年額で入力してください。</li>
              <li>借入返済額は主要結果と分けた参考値です。</li>
            </ul>
          </aside>
        </div>

        <div
          className="calculator-results military-expanded-results"
          ref={resultsRef}
          role="region"
          aria-label="シミュレーション結果"
          aria-live="polite"
          tabIndex={-1}
        >
          <div className="simulator-results-heading military-results-heading">
            <div>
              <p>RESULT</p>
              <h3>シミュレーション結果</h3>
            </div>
          </div>

          {hasDisplayedResult ? (
            <div className="mobile-result-toolbar">
              <strong className="mobile-result-title">シミュレーション結果</strong>
              <button
                className="mobile-result-back"
                type="button"
                aria-label="入力条件に戻る"
                onClick={returnToInputs}
              >
                入力条件に戻る
              </button>
            </div>
          ) : null}

          <div className="military-kpi-grid" aria-label="軍用地の主要結果">
            <div className="result-card emphasis-result military-result-card--yield">
              <span>表面利回り</span>
              <strong>
                {displayedResult.surfaceYield === null
                  ? '―'
                  : `${displayedResult.surfaceYield.toFixed(2)}%`}
              </strong>
              <small>年間借地料 ÷ 購入価格</small>
            </div>
            <div className="result-card military-result-card--net-yield">
              <span>費用控除後利回り</span>
              <strong>
                {displayedResult.expenseAdjustedYield === null
                  ? '―'
                  : `${displayedResult.expenseAdjustedYield.toFixed(2)}%`}
              </strong>
              <small>実質利回りの目安</small>
            </div>
            <div className="result-card military-result-card--income">
              <span>年間収支（概算）</span>
              <strong>
                {displayedResult.coreAnnualIncome === null
                  ? '―'
                  : formatManYen(displayedResult.coreAnnualIncome)}
              </strong>
              <small>年間借地料から入力した年間費用を控除</small>
            </div>
            <div className="result-card military-result-card--payback">
              <span>回収期間（概算）</span>
              <strong>
                {displayedResult.paybackYears === null
                  ? '―'
                  : `${displayedResult.paybackYears.toFixed(1)}年`}
              </strong>
              <small>購入価格 ÷ 年間収支</small>
            </div>
          </div>

          {hasDisplayedResult &&
          (fixedAssetTax === '' || managementExpenses === '') ? (
            <p className="military-missing-cost-warning" role="note">
              未入力の年間費用は0円として仮計算しています。実際の費用をご確認ください。
            </p>
          ) : null}

          <div className="military-breakdown-and-guide">
            <section className="simulator-breakdown-panel simulator-breakdown-panel--military">
              <div className="simulator-subheading">
                <div>
                  <p>BREAKDOWN</p>
                  <h3>収益の内訳（年間）</h3>
                </div>
              </div>
              <dl className="military-income-breakdown">
                <div><dt>年間借地料（収入）</dt><dd>{displayedResult.annualRent === null ? '―' : formatYen(displayedResult.annualRent)}</dd></div>
                <div><dt>固定資産税</dt><dd>{displayedResult.fixedAssetTax === null ? '―' : formatSignedExpense(displayedResult.fixedAssetTax)}</dd></div>
                <div><dt>管理費・その他経費</dt><dd>{displayedResult.managementExpenses === null ? '―' : formatSignedExpense(displayedResult.managementExpenses)}</dd></div>
                <div className="military-breakdown-total"><dt>年間収支（概算）</dt><dd>{displayedResult.coreAnnualIncome === null ? '―' : formatYen(displayedResult.coreAnnualIncome)}</dd></div>
                <div><dt>費用控除後利回り</dt><dd>{displayedResult.expenseAdjustedYield === null ? '―' : `${displayedResult.expenseAdjustedYield.toFixed(2)}%`}</dd></div>
              </dl>
            </section>

            <aside className="military-net-yield-guide">
              <span aria-hidden="true">i</span>
              <div>
                <strong>費用控除後利回りとは</strong>
                <p>年間借地料から、入力した固定資産税と管理費・その他経費を差し引いた年間収支をもとにした、実質利回りの目安です。</p>
                <a href={`${routes.knowledge}#borrow`}>
                  利回りの考え方を詳しく見る <span aria-hidden="true">→</span>
                </a>
              </div>
            </aside>
          </div>

          {hasLoan ? (
            <aside className="military-loan-reference" aria-label="借入条件の参考結果">
              <div>
                <strong>借入条件の参考結果</strong>
                <p>元利均等返済を仮定した概算です。実際の金利、返済方式、手数料、融資条件は金融機関により異なります。融資審査、借入可能額、担保評価、金融機関固有の条件を算定するものではありません。</p>
              </div>
              <dl>
                <div>
                  <dt>毎月返済額（概算）</dt>
                  <dd>{displayedResult.monthlyPayment === null ? '―' : formatYen(displayedResult.monthlyPayment)}</dd>
                </div>
                <div>
                  <dt>年間返済額（概算）</dt>
                  <dd>{displayedResult.annualPayment === null ? '―' : formatYen(displayedResult.annualPayment)}</dd>
                </div>
                <div>
                  <dt>返済後年間収支（参考）</dt>
                  <dd>{displayedResult.afterRepaymentAnnualIncome === null ? '―' : formatYen(displayedResult.afterRepaymentAnnualIncome)}</dd>
                </div>
              </dl>
            </aside>
          ) : null}

          <section className="military-future-panel" aria-labelledby="military-future-title">
            <div className="simulator-subheading">
              <div>
                <p>LONG-TERM SCENARIO</p>
                <h3 id="military-future-title">長期収支の単純シナリオ（年間収支ベース）</h3>
              </div>
              <span>現在の入力条件を固定</span>
            </div>

            <div className="military-future-grid">
              <article className="military-line-chart">
                <header><strong>累計年間収支の推移</strong><small>単純計算</small></header>
                {lineGraph ? (
                  <>
                    {lineGraph.repaymentLine ? (
                      <div className="military-chart-legend" aria-label="グラフの凡例">
                        <span><i />物件単体</span>
                        <span><i />返済考慮後（参考）</span>
                      </div>
                    ) : null}
                    <svg viewBox="0 0 600 190" role="img" aria-label="累計年間収支の推移グラフ">
                      <line x1="24" y1={lineGraph.zeroY} x2="576" y2={lineGraph.zeroY} className="military-chart-axis" />
                      <polygon points={lineGraph.area} className="military-chart-area" />
                      <polyline points={lineGraph.propertyLine} className="military-chart-line military-chart-line--property" />
                      {lineGraph.repaymentLine ? <polyline points={lineGraph.repaymentLine} className="military-chart-line military-chart-line--repayment" /> : null}
                      {lineGraph.points.map((point) => <circle className="military-chart-point--property" key={`property-${point.year}`} cx={point.x} cy={point.propertyY} r="4" />)}
                      {lineGraph.repaymentLine ? lineGraph.points.map((point) => <circle className="military-chart-point--repayment" key={`repayment-${point.year}`} cx={point.x} cy={point.repaymentY ?? 0} r="4" />) : null}
                    </svg>
                    <div className="military-chart-labels" style={{ gridTemplateColumns: `repeat(${lineGraph.points.length}, minmax(0, 1fr))` }}>
                      {lineGraph.points.map((point) => <span key={point.year}>{point.year === 0 ? '現在' : `${point.year}年後`}</span>)}
                    </div>
                    <div className="military-chart-totals">
                      <strong className="military-chart-total">
                        {trajectory.length > 0 ? `物件単体：${trajectory[trajectory.length - 1].year}年後 ${formatManYen(trajectory[trajectory.length - 1].propertyValue)}` : '―'}
                      </strong>
                      {finalTrajectoryPoint?.repaymentValue != null ? (
                        <strong className="military-chart-total military-chart-total--repayment">
                          返済考慮後：{finalTrajectoryPoint.year}年後 {formatManYen(finalTrajectoryPoint.repaymentValue)}
                        </strong>
                      ) : null}
                    </div>
                  </>
                ) : <div className="military-chart-empty">条件入力後に表示します</div>}
              </article>

              <article className="military-period-chart">
                <header><strong>期間ごとの物件単体収支</strong><small>単純計算</small></header>
                {periodEarnings.length > 0 ? (
                  <div
                    className="military-period-bars"
                    style={{
                      gridTemplateColumns: `repeat(${periodEarnings.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {periodEarnings.map((period) => (
                      <div key={period.label}>
                        <strong>{formatPeriodManYen(period.propertyValue)}</strong>
                        <i
                          style={{ height: `${Math.max(8, (Math.abs(period.propertyValue) / maximumPeriodEarning) * 100)}%` }}
                          data-negative={period.propertyValue < 0}
                        />
                        <span>{period.label}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="military-chart-empty">条件入力後に表示します</div>}
              </article>
            </div>
            <p className="military-future-note">
              現在の入力条件が変わらないと仮定した単純シナリオです。将来の収益を予測・保証するものではありません。
            </p>
            {displayedResult.annualPayment !== null && displayedResult.loanTermYears !== null ? (
              <p className="military-future-note military-future-note--repayment">
                返済考慮後（参考）は{displayedResult.loanTermYears}年目まで年間返済額を差し引き、{displayedResult.loanTermYears + 1}年目以降は物件単体と同じ年間収支で積み上げます。
              </p>
            ) : null}
          </section>

          <div className="military-formula-strip">
            <div>
              <span>購入倍率</span>
              <strong>{displayedResult.calculatedMultiple === null ? '―' : `${displayedResult.calculatedMultiple.toFixed(2)}倍`}</strong>
            </div>
            <p>主要結果は物件の収益性を表し、借入条件は参考結果として分けて表示しています。</p>
          </div>
        </div>
      </div>

      <div className="military-calculator-footer">
        <p className="calculator-note">本シミュレーションは、入力した固定資産税や管理費などの条件が継続した場合の概算です。借地料改定、税制、契約条件などにより結果は変動します。</p>
      </div>
    </section>
  )
}

export default MilitaryLandCalculator
