import {
  useMemo,
  useRef,
  useState,
  type Ref,
} from 'react'
import { routes } from './app/routes'

type CalculationResult = {
  calculatedMultiple: number | null
  surfaceYield: number | null
  netYield: number | null
  annualNetIncome: number | null
  paybackYears: number | null
  annualRent: number | null
  purchasePrice: number | null
  fixedAssetTax: number | null
  managementExpenses: number | null
  annualInterest: number | null
  saleCosts: number | null
  leaseYears: number | null
}

type CalculationInputs = {
  annualRent: string
  purchasePrice: string
  leaseYears: string
  fixedAssetTax: string
  managementExpenses: string
  saleCostRate: string
  hasLoan: boolean
  loanAmount: string
  interestRate: string
}

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

const emptyResult: CalculationResult = {
  calculatedMultiple: null,
  surfaceYield: null,
  netYield: null,
  annualNetIncome: null,
  paybackYears: null,
  annualRent: null,
  purchasePrice: null,
  fixedAssetTax: null,
  managementExpenses: null,
  annualInterest: null,
  saleCosts: null,
  leaseYears: null,
}

const MOBILE_VIEWPORT_QUERY = '(max-width: 760px)'
const DATA_UPDATED_AT = '2026年8月29日'

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

const formatSignedExpense = (value: number) =>
  value > 0 ? `−${formatYen(value)}` : formatYen(0)

const convertToHalfWidth = (value: string) =>
  value.normalize('NFKC')

const getMoneyDigits = (value: string) =>
  convertToHalfWidth(value).replace(/[^\d]/g, '')

const formatMoneyInput = (value: string) => {
  const digits = getMoneyDigits(value)

  return digits === ''
    ? ''
    : Number(digits).toLocaleString('ja-JP')
}

const normalizeDecimalInput = (value: string) => {
  const converted = convertToHalfWidth(value)
    .replace(/,/g, '')
    .replace(/[^\d.]/g, '')
  const [integerPart, ...decimalParts] = converted.split('.')

  return decimalParts.length === 0
    ? integerPart
    : `${integerPart}.${decimalParts.join('')}`
}

const normalizeIntegerInput = (value: string) =>
  convertToHalfWidth(value).replace(/[^\d]/g, '')

const parseMoney = (value: string) =>
  Number(getMoneyDigits(value))

const parseDecimal = (value: string) =>
  Number(normalizeDecimalInput(value))

const calculateResults = ({
  annualRent,
  purchasePrice,
  leaseYears,
  fixedAssetTax,
  managementExpenses,
  saleCostRate,
  hasLoan,
  loanAmount,
  interestRate,
}: CalculationInputs): CalculationResult => {
  const rent = parseMoney(annualRent)
  const price = parseMoney(purchasePrice)

  if (rent <= 0 || price <= 0) {
    return emptyResult
  }

  const tax = parseMoney(fixedAssetTax)
  const expenses = parseMoney(managementExpenses)
  const selectedLeaseYears = Math.max(
    1,
    Number(normalizeIntegerInput(leaseYears)) || 50,
  )
  const saleCosts = price * (parseDecimal(saleCostRate) / 100)
  const annualInterest = hasLoan
    ? parseMoney(loanAmount) * (parseDecimal(interestRate) / 100)
    : 0
  const annualNetIncome = rent - tax - expenses - annualInterest

  return {
    calculatedMultiple: price / rent,
    surfaceYield: (rent / price) * 100,
    netYield: (annualNetIncome / price) * 100,
    annualNetIncome,
    paybackYears: annualNetIncome > 0
      ? price / annualNetIncome
      : null,
    annualRent: rent,
    purchasePrice: price,
    fixedAssetTax: tax,
    managementExpenses: expenses,
    annualInterest,
    saleCosts,
    leaseYears: selectedLeaseYears,
  }
}

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
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
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

            onChange(formatMoneyInput(nextValue))
          }}
          onCompositionEnd={(event) => {
            onChange(formatMoneyInput(event.currentTarget.value))
          }}
          onBlur={(event) => {
            onChange(formatMoneyInput(event.currentTarget.value))
          }}
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

function MilitaryLandCalculator() {
  const formRef = useRef<HTMLDivElement>(null)
  const annualRentInputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [annualRent, setAnnualRent] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [leaseYears, setLeaseYears] = useState('50')
  const [fixedAssetTax, setFixedAssetTax] = useState('')
  const [managementExpenses, setManagementExpenses] = useState('')
  const [saleCostRate, setSaleCostRate] = useState('5')
  const [hasLoan, setHasLoan] = useState(false)
  const [loanAmount, setLoanAmount] = useState('')
  const [loanTerm, setLoanTerm] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [isAutoCalculation, setIsAutoCalculation] = useState(false)
  const [manualResult, setManualResult] =
    useState<CalculationResult | null>(null)

  const calculationInputs = useMemo<CalculationInputs>(
    () => ({
      annualRent,
      purchasePrice,
      leaseYears,
      fixedAssetTax,
      managementExpenses,
      saleCostRate,
      hasLoan,
      loanAmount,
      interestRate,
    }),
    [
      annualRent,
      purchasePrice,
      leaseYears,
      fixedAssetTax,
      managementExpenses,
      saleCostRate,
      hasLoan,
      loanAmount,
      interestRate,
    ],
  )

  const autoResult = useMemo(
    () => calculateResults(calculationInputs),
    [calculationInputs],
  )

  const displayedResult = isAutoCalculation
    ? autoResult
    : manualResult ?? emptyResult
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
    setManualResult(calculateResults(calculationInputs))
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
    setLeaseYears('50')
    setFixedAssetTax('')
    setManagementExpenses('')
    setSaleCostRate('5')
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
    if (
      displayedResult.annualNetIncome === null ||
      displayedResult.leaseYears === null ||
      displayedResult.saleCosts === null
    ) {
      return []
    }

    const totalYears = displayedResult.leaseYears
    const checkpoints = Array.from(
      new Set(
        Array.from({ length: 6 }, (_, index) =>
          Math.round((totalYears * index) / 5),
        ),
      ),
    )

    return checkpoints.map((year) => ({
      year,
      value:
        displayedResult.annualNetIncome! * year -
        (year === totalYears ? displayedResult.saleCosts! : 0),
    }))
  }, [displayedResult])

  const periodEarnings = useMemo(() => {
    if (trajectory.length < 2 || displayedResult.saleCosts === null) {
      return []
    }

    return trajectory.slice(1).map((point, index) => {
      const previous = trajectory[index]
      const isLast = index === trajectory.length - 2

      return {
        label: `${point.year}年後`,
        value:
          (point.year - previous.year) *
            (displayedResult.annualNetIncome ?? 0) -
          (isLast ? displayedResult.saleCosts! : 0),
      }
    })
  }, [displayedResult, trajectory])

  const lineGraph = useMemo(() => {
    if (trajectory.length === 0) {
      return null
    }

    const values = trajectory.map((point) => point.value)
    const minimum = Math.min(0, ...values)
    const maximum = Math.max(0, ...values)
    const range = Math.max(1, maximum - minimum)
    const pointList = trajectory.map((point, index) => {
      const x = 24 + (552 * index) / (trajectory.length - 1)
      const y = 164 - ((point.value - minimum) / range) * 132

      return { ...point, x, y }
    })
    const zeroY = 164 - ((0 - minimum) / range) * 132

    return {
      points: pointList,
      line: pointList.map((point) => `${point.x},${point.y}`).join(' '),
      area: [
        `${pointList[0].x},${zeroY}`,
        ...pointList.map((point) => `${point.x},${point.y}`),
        `${pointList[pointList.length - 1].x},${zeroY}`,
      ].join(' '),
      zeroY,
    }
  }, [trajectory])

  const maximumPeriodEarning = Math.max(
    1,
    ...periodEarnings.map((period) => Math.abs(period.value)),
  )

  return (
    <section
      className="calculator calculator--military-expanded"
      aria-labelledby="military-land-title"
    >
      <div className="calculator-heading calculator-heading--military">
        <p className="section-label">MILITARY LAND CALCULATOR</p>
        <h2 id="military-land-title">軍用地利回りシミュレーター</h2>
        <p>購入価格・年間借地料・経費から、実質利回りと将来収益を概算します。</p>
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
          <NumberField
            label="借地期間"
            value={leaseYears}
            placeholder="例：50"
            unit="年"
            integer
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
          <NumberField
            label="売却時の諸費用（概算）"
            value={saleCostRate}
            placeholder="例：5"
            unit="%"
            onChange={(value) => updateInput(setSaleCostRate, value)}
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
              リセット
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
              <li>税金・管理費は年額で入力してください。</li>
              <li>借入利息は初年度相当の単純計算です。</li>
              <li>売却諸費用は将来収益の最終年に控除します。</li>
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
            <span>データ更新日：{DATA_UPDATED_AT}</span>
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
              <span>実質利回り</span>
              <strong>
                {displayedResult.netYield === null
                  ? '―'
                  : `${displayedResult.netYield.toFixed(2)}%`}
              </strong>
              <small>税金・経費・借入利息控除後</small>
            </div>
            <div className="result-card military-result-card--income">
              <span>年間手取り収益</span>
              <strong>
                {displayedResult.annualNetIncome === null
                  ? '―'
                  : formatManYen(displayedResult.annualNetIncome)}
              </strong>
              <small>年間借地料から年間経費を控除</small>
            </div>
            <div className="result-card military-result-card--payback">
              <span>回収期間（概算）</span>
              <strong>
                {displayedResult.paybackYears === null
                  ? '―'
                  : `${displayedResult.paybackYears.toFixed(1)}年`}
              </strong>
              <small>購入価格 ÷ 年間手取り収益</small>
            </div>
          </div>

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
                {hasLoan ? <div><dt>借入利息（概算）</dt><dd>{displayedResult.annualInterest === null ? '―' : formatSignedExpense(displayedResult.annualInterest)}</dd></div> : null}
                <div className="military-breakdown-total"><dt>年間手取り収益</dt><dd>{displayedResult.annualNetIncome === null ? '―' : formatYen(displayedResult.annualNetIncome)}</dd></div>
                <div><dt>実質利回り</dt><dd>{displayedResult.netYield === null ? '―' : `${displayedResult.netYield.toFixed(2)}%`}</dd></div>
              </dl>
            </section>

            <aside className="military-net-yield-guide">
              <span aria-hidden="true">i</span>
              <div>
                <strong>実質利回りとは</strong>
                <p>年間借地料から固定資産税や管理費、借入利息の概算を差し引いた手取り収益をもとにした利回りです。</p>
                <a href={`${routes.knowledge}#borrow`}>
                  利回りの考え方を詳しく見る <span aria-hidden="true">→</span>
                </a>
              </div>
            </aside>
          </div>

          <section className="military-future-panel" aria-labelledby="military-future-title">
            <div className="simulator-subheading">
              <div>
                <p>FUTURE INCOME</p>
                <h3 id="military-future-title">将来の収益シミュレーション（手取りベース）</h3>
              </div>
              <span>売却諸費用は最終年に控除</span>
            </div>

            <div className="military-future-grid">
              <article className="military-line-chart">
                <header><strong>累計手取り収益の推移</strong><small>概算</small></header>
                {lineGraph ? (
                  <>
                    <svg viewBox="0 0 600 190" role="img" aria-label="累計手取り収益の推移グラフ">
                      <line x1="24" y1={lineGraph.zeroY} x2="576" y2={lineGraph.zeroY} className="military-chart-axis" />
                      <polygon points={lineGraph.area} className="military-chart-area" />
                      <polyline points={lineGraph.line} className="military-chart-line" />
                      {lineGraph.points.map((point) => <circle key={point.year} cx={point.x} cy={point.y} r="4" />)}
                    </svg>
                    <div className="military-chart-labels">
                      {lineGraph.points.map((point) => <span key={point.year}>{point.year === 0 ? '現在' : `${point.year}年後`}</span>)}
                    </div>
                    <strong className="military-chart-total">
                      {trajectory.length > 0 ? `${trajectory[trajectory.length - 1].year}年後の累計 ${formatManYen(trajectory[trajectory.length - 1].value)}` : '―'}
                    </strong>
                  </>
                ) : <div className="military-chart-empty">条件入力後に表示します</div>}
              </article>

              <article className="military-period-chart">
                <header><strong>期間ごとの手取り収益</strong><small>概算</small></header>
                {periodEarnings.length > 0 ? (
                  <div className="military-period-bars">
                    {periodEarnings.map((period) => (
                      <div key={period.label}>
                        <strong>{formatManYen(period.value)}</strong>
                        <i
                          style={{ height: `${Math.max(8, (Math.abs(period.value) / maximumPeriodEarning) * 100)}%` }}
                          data-negative={period.value < 0}
                        />
                        <span>{period.label}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="military-chart-empty">条件入力後に表示します</div>}
              </article>
            </div>
          </section>

          <div className="military-formula-strip">
            <div>
              <span>購入倍率</span>
              <strong>{displayedResult.calculatedMultiple === null ? '―' : `${displayedResult.calculatedMultiple.toFixed(2)}倍`}</strong>
            </div>
            <div>
              <span>売却時の諸費用（概算）</span>
              <strong>{displayedResult.saleCosts === null ? '―' : formatYen(displayedResult.saleCosts)}</strong>
            </div>
            <p>借入利息は借入額と年率から求めた初年度相当の概算です。元金返済額は手取り収益から控除していません。</p>
          </div>
        </div>
      </div>

      <div className="military-calculator-footer">
        <p className="calculator-note">本シミュレーションは現在の入力条件が継続した場合の概算です。借地料改定、税制、契約条件などにより結果は変動します。</p>
        <span>データ更新日：{DATA_UPDATED_AT}</span>
      </div>
    </section>
  )
}

export default MilitaryLandCalculator
