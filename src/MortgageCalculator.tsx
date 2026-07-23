import { useMemo, useState } from 'react'

type RepaymentMethod = 'equal-payment' | 'equal-principal'

type MortgageResult = {
  monthlyPayment: number | null
  firstPayment: number | null
  lastPayment: number | null
  totalPayment: number | null
  totalInterest: number | null
}

const emptyResult: MortgageResult = {
  monthlyPayment: null,
  firstPayment: null,
  lastPayment: null,
  totalPayment: null,
  totalInterest: null,
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

const calculateMortgage = (
  loanAmount: string,
  annualInterestRate: string,
  repaymentYears: string,
  repaymentMethod: RepaymentMethod,
): MortgageResult => {
  const principal = Number(getMoneyDigits(loanAmount))
  const annualRate = Number(
    normalizeDecimalInput(annualInterestRate),
  )
  const years = Number(
    normalizeDecimalInput(repaymentYears),
  )

  if (
    principal <= 0 ||
    annualRate < 0 ||
    years <= 0
  ) {
    return emptyResult
  }

  const numberOfPayments = Math.round(years * 12)
  const monthlyRate = annualRate / 100 / 12

  /*
   * 元利均等返済
   */
  if (repaymentMethod === 'equal-payment') {
    let monthlyPayment: number

    if (monthlyRate === 0) {
      monthlyPayment = principal / numberOfPayments
    } else {
      const compoundFactor = Math.pow(
        1 + monthlyRate,
        numberOfPayments,
      )

      monthlyPayment =
        principal *
        (
          monthlyRate * compoundFactor
        ) /
        (
          compoundFactor - 1
        )
    }

    const totalPayment =
      monthlyPayment * numberOfPayments

    return {
      monthlyPayment,
      firstPayment: null,
      lastPayment: null,
      totalPayment,
      totalInterest: totalPayment - principal,
    }
  }

  /*
   * 元金均等返済
   *
   * 毎月の元金返済額は一定です。
   * 利息は返済前の残高に対して計算します。
   */
  const principalPayment =
    principal / numberOfPayments

  const firstInterest =
    principal * monthlyRate

  const firstPayment =
    principalPayment + firstInterest

  const balanceBeforeLastPayment =
    principalPayment

  const lastInterest =
    balanceBeforeLastPayment * monthlyRate

  const lastPayment =
    principalPayment + lastInterest

  /*
   * 各月の残高は等差数列になるため、
   * 全期間の利息合計をまとめて求めます。
   */
  const totalInterest =
    monthlyRate *
    principal *
    (numberOfPayments + 1) /
    2

  const totalPayment =
    principal + totalInterest

  return {
    monthlyPayment: null,
    firstPayment,
    lastPayment,
    totalPayment,
    totalInterest,
  }
}

function MortgageCalculator() {
  const [loanAmount, setLoanAmount] = useState('')
  const [annualInterestRate, setAnnualInterestRate] =
    useState('')
  const [repaymentYears, setRepaymentYears] = useState('')

  /*
   * 初期値をequal-paymentにしているため、
   * デフォルトは元利均等返済です。
   */
  const [repaymentMethod, setRepaymentMethod] =
    useState<RepaymentMethod>('equal-payment')

  const [isAutoCalculation, setIsAutoCalculation] =
    useState(false)

  const [manualResult, setManualResult] =
    useState<MortgageResult | null>(null)

  const autoResult = useMemo(
    () =>
      calculateMortgage(
        loanAmount,
        annualInterestRate,
        repaymentYears,
        repaymentMethod,
      ),
    [
      loanAmount,
      annualInterestRate,
      repaymentYears,
      repaymentMethod,
    ],
  )

  const displayedResult = isAutoCalculation
    ? autoResult
    : manualResult ?? emptyResult

  const principal = Number(getMoneyDigits(loanAmount))
  const annualRate = Number(
    normalizeDecimalInput(annualInterestRate),
  )
  const years = Number(
    normalizeDecimalInput(repaymentYears),
  )

  const canSimulate =
    principal > 0 &&
    annualRate >= 0 &&
    annualInterestRate !== '' &&
    years > 0

  const clearManualResult = () => {
    if (!isAutoCalculation) {
      setManualResult(null)
    }
  }

  const handleLoanAmountChange = (value: string) => {
    setLoanAmount(value)
    clearManualResult()
  }

  const handleInterestRateChange = (value: string) => {
    setAnnualInterestRate(value)
    clearManualResult()
  }

  const handleRepaymentYearsChange = (value: string) => {
    setRepaymentYears(value)
    clearManualResult()
  }

  const handleRepaymentMethodChange = (
    method: RepaymentMethod,
  ) => {
    setRepaymentMethod(method)
    setManualResult(null)
  }

  const simulate = () => {
    setManualResult(
      calculateMortgage(
        loanAmount,
        annualInterestRate,
        repaymentYears,
        repaymentMethod,
      ),
    )
  }

  const resetCalculator = () => {
    setLoanAmount('')
    setAnnualInterestRate('')
    setRepaymentYears('')
    setRepaymentMethod('equal-payment')
    setManualResult(null)
  }

  const changeCalculationMode = (checked: boolean) => {
    setIsAutoCalculation(checked)
    setManualResult(null)
  }

  return (
    <section
      className="calculator"
      aria-labelledby="mortgage-title"
    >
      <div className="calculator-heading">
        <p className="section-label">
          MORTGAGE CALCULATOR
        </p>

        <h2 id="mortgage-title">
          住宅ローン返済シミュレーター
        </h2>

        <p>
          借入金額・年利・返済期間・返済方式から、
          住宅ローンの返済額を試算します。
        </p>
      </div>

      <div className="calculator-layout">
        <div className="calculator-form">
          <fieldset className="repayment-method">
            <legend>返済方式</legend>

            <div className="repayment-method-options">
              <label
                className={
                  repaymentMethod === 'equal-payment'
                    ? 'repayment-option selected'
                    : 'repayment-option'
                }
              >
                <input
                  type="radio"
                  name="repayment-method"
                  value="equal-payment"
                  checked={
                    repaymentMethod === 'equal-payment'
                  }
                  onChange={() =>
                    handleRepaymentMethodChange(
                      'equal-payment',
                    )
                  }
                />

                <span>
                  <strong>元利均等返済</strong>
                  <small>
                    毎月返済額が原則一定
                  </small>
                </span>
              </label>

              <label
                className={
                  repaymentMethod === 'equal-principal'
                    ? 'repayment-option selected'
                    : 'repayment-option'
                }
              >
                <input
                  type="radio"
                  name="repayment-method"
                  value="equal-principal"
                  checked={
                    repaymentMethod === 'equal-principal'
                  }
                  onChange={() =>
                    handleRepaymentMethodChange(
                      'equal-principal',
                    )
                  }
                />

                <span>
                  <strong>元金均等返済</strong>
                  <small>
                    返済額が徐々に減少
                  </small>
                </span>
              </label>
            </div>
          </fieldset>

          <label>
            <span>借入金額</span>

            <div className="input-with-unit">
              <input
                type="text"
                inputMode="numeric"
                value={loanAmount}
                onChange={(event) => {
                  const value = event.target.value

                  if (event.nativeEvent instanceof InputEvent &&
                      event.nativeEvent.isComposing) {
                    handleLoanAmountChange(value)
                    return
                  }

                  handleLoanAmountChange(
                    formatMoneyInput(value),
                  )
                }}
                onCompositionEnd={(event) => {
                  handleLoanAmountChange(
                    formatMoneyInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                onBlur={(event) => {
                  handleLoanAmountChange(
                    formatMoneyInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                placeholder="例：30,000,000"
              />

              <span>円</span>
            </div>
          </label>

          <label>
            <span>年利</span>

            <div className="input-with-unit">
              <input
                type="text"
                inputMode="decimal"
                value={annualInterestRate}
                onChange={(event) => {
                  const value = event.target.value

                  if (event.nativeEvent instanceof InputEvent &&
                      event.nativeEvent.isComposing) {
                    handleInterestRateChange(value)
                    return
                  }

                  handleInterestRateChange(
                    normalizeDecimalInput(value),
                  )
                }}
                onCompositionEnd={(event) => {
                  handleInterestRateChange(
                    normalizeDecimalInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                onBlur={(event) => {
                  handleInterestRateChange(
                    normalizeDecimalInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                placeholder="例：1.0"
              />

              <span>%</span>
            </div>
          </label>

          <label>
            <span>返済期間</span>

            <div className="input-with-unit">
              <input
                type="text"
                inputMode="decimal"
                value={repaymentYears}
                onChange={(event) => {
                  const value = event.target.value

                  if (
                    event.nativeEvent instanceof InputEvent &&
                    event.nativeEvent.isComposing
                  ) {
                    handleRepaymentYearsChange(value)
                    return
                  }

                  handleRepaymentYearsChange(
                  normalizeDecimalInput(value),
                  )
                }}
                onCompositionEnd={(event) => {
                  handleRepaymentYearsChange(
                    normalizeDecimalInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                onBlur={(event) => {
                  handleRepaymentYearsChange(
                    normalizeDecimalInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                placeholder="例：35"
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
          {repaymentMethod === 'equal-payment' ? (
            <div className="result-card">
              <span>毎月返済額</span>

              <strong>
                {displayedResult.monthlyPayment === null
                  ? '―'
                  : formatYen(
                      displayedResult.monthlyPayment,
                    )}
              </strong>

              <small>
                元利均等返済による概算
              </small>
            </div>
          ) : (
            <>
              <div className="result-card">
                <span>初回返済額</span>

                <strong>
                  {displayedResult.firstPayment === null
                    ? '―'
                    : formatYen(
                        displayedResult.firstPayment,
                      )}
                </strong>

                <small>
                  元金返済額＋初回利息
                </small>
              </div>

              <div className="result-card">
                <span>最終回返済額</span>

                <strong>
                  {displayedResult.lastPayment === null
                    ? '―'
                    : formatYen(
                        displayedResult.lastPayment,
                      )}
                </strong>

                <small>
                  元金返済額＋最終回利息
                </small>
              </div>
            </>
          )}

          <div className="result-card">
            <span>総返済額</span>

            <strong>
              {displayedResult.totalPayment === null
                ? '―'
                : formatYen(
                    displayedResult.totalPayment,
                  )}
            </strong>

            <small>
              元金と利息の合計
            </small>
          </div>

          <div className="result-card">
            <span>支払利息総額</span>

            <strong>
              {displayedResult.totalInterest === null
                ? '―'
                : formatYen(
                    displayedResult.totalInterest,
                  )}
            </strong>

            <small>
              総返済額 − 借入金額
            </small>
          </div>
        </div>
      </div>

      <p className="calculator-note">
        本シミュレーターは概算です。
        金融機関ごとの端数処理、手数料、保証料、
        団体信用生命保険料、金利変動などは
        含んでいません。
      </p>
    </section>
  )
}

export default MortgageCalculator