import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from 'react'
import './MortgageCalculator.css'
import {
  calculateMortgageComparison,
  createMortgageComparisonExplanation,
  createMortgageComparisonInputKey,
  formatApproxMortgageYen,
  formatLoanAmountForDisplay,
  normalizeAnnualRateText,
  normalizeRepaymentYearsText,
  validateMortgageFields,
  type MortgageCalculationError,
  type MortgageFieldErrors,
  type MortgageFieldName,
  type MortgageFieldValues,
  type MortgageComparison,
  type MortgageInput,
  type RepaymentMethod,
} from './mortgage'

type TouchedFields = Record<MortgageFieldName, boolean>

type StoredCalculation = {
  input: MortgageInput
  inputKey: string
  comparison: MortgageComparison
}

type ResetSnapshot = {
  values: MortgageFieldValues
  touchedFields: TouchedFields
  repaymentMethod: RepaymentMethod
  isAutoCalculation: boolean
  hasSubmitted: boolean
  manualCalculation: StoredCalculation | null
  manualCalculationError: MortgageCalculationError | null
}

type CalculatorViewState =
  | 'idle'
  | 'incomplete'
  | 'invalid'
  | 'ready'
  | 'calculated'
  | 'stale'
  | 'calculation-error'

const FIELD_NAMES: MortgageFieldName[] = [
  'loanAmount',
  'annualInterestRate',
  'repaymentYears',
]

const FIELD_INPUT_IDS: Record<MortgageFieldName, string> = {
  loanAmount: 'mortgage-loan-amount',
  annualInterestRate: 'mortgage-interest-rate',
  repaymentYears: 'mortgage-repayment-years',
}

const EMPTY_VALUES: MortgageFieldValues = {
  loanAmount: '',
  annualInterestRate: '',
  repaymentYears: '',
}

const EMPTY_TOUCHED_FIELDS: TouchedFields = {
  loanAmount: false,
  annualInterestRate: false,
  repaymentYears: false,
}

const CALCULATION_ERROR_MESSAGE =
  '計算処理中に問題が発生しました。入力内容を確認して、もう一度お試しください。'
const RESET_UNDO_DURATION_MS = 10_000

const hasAnyInput = (values: MortgageFieldValues) =>
  FIELD_NAMES.some((fieldName) => values[fieldName] !== '')

const normalizeConfirmedDecimalText = (
  value: string,
  normalizer: (text: string) => string,
) => {
  const normalized = normalizer(value)

  if (normalized.endsWith('.')) {
    return normalized.slice(0, -1)
  }

  return normalized
}

const normalizeFieldForConfirmation = (
  fieldName: MortgageFieldName,
  value: string,
) => {
  switch (fieldName) {
    case 'loanAmount':
      return formatLoanAmountForDisplay(value)
    case 'annualInterestRate':
      return normalizeConfirmedDecimalText(
        value,
        normalizeAnnualRateText,
      )
    case 'repaymentYears':
      return normalizeConfirmedDecimalText(
        value,
        normalizeRepaymentYearsText,
      )
  }
}

const normalizeAllFieldsForConfirmation = (
  values: MortgageFieldValues,
): MortgageFieldValues => ({
  loanAmount: normalizeFieldForConfirmation(
    'loanAmount',
    values.loanAmount,
  ),
  annualInterestRate: normalizeFieldForConfirmation(
    'annualInterestRate',
    values.annualInterestRate,
  ),
  repaymentYears: normalizeFieldForConfirmation(
    'repaymentYears',
    values.repaymentYears,
  ),
})

const createStoredCalculation = (
  input: MortgageInput,
  comparison: MortgageComparison,
): StoredCalculation => ({
  input,
  inputKey: createMortgageComparisonInputKey(input),
  comparison,
})

const getResultHeading = (
  isStale: boolean,
  hasResult: boolean,
) => {
  if (isStale) {
    return '前回の概算結果'
  }

  if (hasResult) {
    return '概算結果'
  }

  return 'シミュレーション結果'
}

const getStatusMessage = (
  viewState: CalculatorViewState,
  hasVisibleErrors: boolean,
) => {
  switch (viewState) {
    case 'idle':
      return '借入条件を入力してください。'
    case 'incomplete':
      return '入力を続けてください。すべての条件がそろうと計算できます。'
    case 'invalid':
      return '入力内容を確認してください。'
    case 'ready':
      return '入力内容を確認し、シミュレートしてください。'
    case 'calculated':
      return '概算結果を更新しました。'
    case 'stale':
      return hasVisibleErrors
        ? '条件が変更され、入力内容にも確認が必要です。前回の結果を表示しています。'
        : '条件が変更されました。再計算してください。前回の結果を表示しています。'
    case 'calculation-error':
      return CALCULATION_ERROR_MESSAGE
  }
}

const getStatusTone = (
  viewState: CalculatorViewState,
) => {
  switch (viewState) {
    case 'invalid':
    case 'calculation-error':
      return 'error'
    case 'stale':
      return 'warning'
    case 'calculated':
      return 'success'
    case 'ready':
      return 'ready'
    default:
      return 'neutral'
  }
}

const getCalculationErrorLabel = (
  error: MortgageCalculationError | null,
) => (error ? CALCULATION_ERROR_MESSAGE : null)

function MortgageCalculator() {
  const [values, setValues] =
    useState<MortgageFieldValues>(EMPTY_VALUES)
  const [touchedFields, setTouchedFields] =
    useState<TouchedFields>(EMPTY_TOUCHED_FIELDS)
  const [repaymentMethod, setRepaymentMethod] =
    useState<RepaymentMethod>('equal-payment')
  const [isAutoCalculation, setIsAutoCalculation] =
    useState(false)
  const [hasSubmitted, setHasSubmitted] =
    useState(false)
  const [manualCalculation, setManualCalculation] =
    useState<StoredCalculation | null>(null)
  const [
    manualCalculationError,
    setManualCalculationError,
  ] = useState<MortgageCalculationError | null>(null)
  const [resetSnapshot, setResetSnapshot] =
    useState<ResetSnapshot | null>(null)
  const [statusMessageOverride, setStatusMessageOverride] =
    useState<string | null>(null)

  const errorSummaryRef =
    useRef<HTMLDivElement>(null)
  const pendingErrorSummaryFocusRef =
    useRef(false)
  const resetUndoTimerRef =
    useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const loanAmountRef =
    useRef<HTMLInputElement>(null)
  const annualInterestRateRef =
    useRef<HTMLInputElement>(null)
  const repaymentYearsRef =
    useRef<HTMLInputElement>(null)

  const fieldRefs = {
    loanAmount: loanAmountRef,
    annualInterestRate: annualInterestRateRef,
    repaymentYears: repaymentYearsRef,
  }

  const clearResetUndoTimer = () => {
    if (resetUndoTimerRef.current === null) {
      return
    }

    window.clearTimeout(resetUndoTimerRef.current)
    resetUndoTimerRef.current = null
  }

  const dismissResetUndo = () => {
    clearResetUndoTimer()
    setResetSnapshot(null)
    setStatusMessageOverride(null)
  }

  const validation = useMemo(
    () => validateMortgageFields(values),
    [values],
  )

  const currentInputKey =
    validation.ok
      ? createMortgageComparisonInputKey(
        validation.input,
      )
      : null

  const autoCalculationOutcome = useMemo(() => {
    if (!isAutoCalculation || !validation.ok) {
      return null
    }

    const calculation = calculateMortgageComparison(
      validation.input,
    )

    if (!calculation.ok) {
      return {
        ok: false as const,
        error: calculation.error,
      }
    }

    return {
      ok: true as const,
      stored: createStoredCalculation(
        validation.input,
        calculation.comparison,
      ),
    }
  }, [isAutoCalculation, validation])

  const visibleErrors = useMemo(() => {
    if (validation.ok) {
      return {} as MortgageFieldErrors
    }

    const errors: MortgageFieldErrors = {}
    const showAllErrors =
      !isAutoCalculation && hasSubmitted

    for (const fieldName of FIELD_NAMES) {
      const error = validation.errors[fieldName]

      if (
        error &&
        (showAllErrors || touchedFields[fieldName])
      ) {
        errors[fieldName] = error
      }
    }

    return errors
  }, [
    hasSubmitted,
    isAutoCalculation,
    touchedFields,
    validation,
  ])

  const visibleErrorEntries = FIELD_NAMES.flatMap(
    (fieldName) => {
      const error = visibleErrors[fieldName]

      return error
        ? [{
            fieldName,
            message: error.message,
          }]
        : []
    },
  )

  const hasVisibleErrors =
    visibleErrorEntries.length > 0
  const shouldShowErrorSummary =
    !isAutoCalculation &&
    hasSubmitted &&
    hasVisibleErrors

  useEffect(() => {
    if (
      !shouldShowErrorSummary ||
      !pendingErrorSummaryFocusRef.current
    ) {
      return
    }

    errorSummaryRef.current?.focus()
    pendingErrorSummaryFocusRef.current = false
  }, [shouldShowErrorSummary])

  useEffect(
    () => () => {
      if (resetUndoTimerRef.current !== null) {
        window.clearTimeout(resetUndoTimerRef.current)
      }
    },
    [],
  )

  const isManualResultStale =
    !isAutoCalculation &&
    manualCalculation !== null &&
    currentInputKey !== manualCalculation.inputKey

  const activeCalculation =
    isAutoCalculation
      ? autoCalculationOutcome?.ok
        ? autoCalculationOutcome.stored
        : null
      : manualCalculation

  const calculationError =
    isAutoCalculation
      ? autoCalculationOutcome &&
        !autoCalculationOutcome.ok
        ? autoCalculationOutcome.error
        : null
      : manualCalculationError

  const viewState: CalculatorViewState = (() => {
    if (!hasAnyInput(values)) {
      return 'idle'
    }

    if (calculationError) {
      return 'calculation-error'
    }

    if (isManualResultStale) {
      return 'stale'
    }

    if (hasVisibleErrors) {
      return 'invalid'
    }

    if (isAutoCalculation) {
      if (
        validation.ok &&
        autoCalculationOutcome?.ok
      ) {
        return 'calculated'
      }

      return 'incomplete'
    }

    if (
      manualCalculation &&
      currentInputKey === manualCalculation.inputKey
    ) {
      return 'calculated'
    }

    if (validation.ok) {
      return 'ready'
    }

    return 'incomplete'
  })()

  const statusMessage =
    statusMessageOverride ??
    getStatusMessage(
      viewState,
      hasVisibleErrors,
    )

  const updateFieldValue = (
    fieldName: MortgageFieldName,
    value: string,
  ) => {
    dismissResetUndo()
    setValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }))
    setManualCalculationError(null)
  }

  const handleFieldChange = (
    fieldName: MortgageFieldName,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    updateFieldValue(fieldName, event.target.value)
  }

  const handleFieldBlur = (
    fieldName: MortgageFieldName,
    event: FocusEvent<HTMLInputElement>,
  ) => {
    setTouchedFields((currentTouchedFields) => ({
      ...currentTouchedFields,
      [fieldName]: true,
    }))

    updateFieldValue(
      fieldName,
      normalizeFieldForConfirmation(
        fieldName,
        event.currentTarget.value,
      ),
    )
  }

  const focusFirstInvalidField = (
    errors: MortgageFieldErrors,
  ) => {
    const firstInvalidField = FIELD_NAMES.find(
      (fieldName) => Boolean(errors[fieldName]),
    )

    if (!firstInvalidField) {
      return
    }

    window.requestAnimationFrame(() => {
      fieldRefs[firstInvalidField].current?.focus()
    })
  }

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    dismissResetUndo()

    const confirmedValues =
      normalizeAllFieldsForConfirmation(values)

    setValues(confirmedValues)

    const confirmedValidation =
      validateMortgageFields(confirmedValues)

    if (isAutoCalculation) {
      if (!confirmedValidation.ok) {
        setTouchedFields({
          loanAmount: true,
          annualInterestRate: true,
          repaymentYears: true,
        })
        focusFirstInvalidField(
          confirmedValidation.errors,
        )
      }

      return
    }

    setHasSubmitted(true)
    setTouchedFields({
      loanAmount: true,
      annualInterestRate: true,
      repaymentYears: true,
    })
    setManualCalculationError(null)

    if (!confirmedValidation.ok) {
      pendingErrorSummaryFocusRef.current = true
      return
    }

    const calculation = calculateMortgageComparison(
      confirmedValidation.input,
    )

    if (!calculation.ok) {
      setManualCalculationError(
        calculation.error,
      )
      return
    }

    setManualCalculation(
      createStoredCalculation(
        confirmedValidation.input,
        calculation.comparison,
      ),
    )
  }

  const handleRepaymentMethodChange = (
    method: RepaymentMethod,
  ) => {
    dismissResetUndo()
    setRepaymentMethod(method)
  }

  const handleCalculationModeChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    dismissResetUndo()
    const nextIsAutoCalculation = event.target.checked

    if (
      isAutoCalculation &&
      !nextIsAutoCalculation &&
      autoCalculationOutcome?.ok
    ) {
      setManualCalculation(
        autoCalculationOutcome.stored,
      )
    }

    pendingErrorSummaryFocusRef.current = false
    setIsAutoCalculation(nextIsAutoCalculation)
    setHasSubmitted(false)
    setManualCalculationError(null)
  }

  const resetCalculator = () => {
    const shouldOfferUndo = hasAnyInput(values)

    clearResetUndoTimer()

    if (shouldOfferUndo) {
      setResetSnapshot({
        values: { ...values },
        touchedFields: { ...touchedFields },
        repaymentMethod,
        isAutoCalculation,
        hasSubmitted,
        manualCalculation,
        manualCalculationError,
      })
      setStatusMessageOverride(
        '入力内容をリセットしました。10秒以内は元に戻せます。',
      )
      resetUndoTimerRef.current = window.setTimeout(() => {
        setResetSnapshot(null)
        setStatusMessageOverride(null)
        resetUndoTimerRef.current = null
      }, RESET_UNDO_DURATION_MS)
    } else {
      setResetSnapshot(null)
      setStatusMessageOverride(null)
    }

    pendingErrorSummaryFocusRef.current = false
    setValues(EMPTY_VALUES)
    setTouchedFields(EMPTY_TOUCHED_FIELDS)
    setRepaymentMethod('equal-payment')
    setIsAutoCalculation(false)
    setHasSubmitted(false)
    setManualCalculation(null)
    setManualCalculationError(null)

    if (!shouldOfferUndo) {
      loanAmountRef.current?.focus()
    }
  }

  const restoreReset = () => {
    if (!resetSnapshot) {
      return
    }

    clearResetUndoTimer()
    pendingErrorSummaryFocusRef.current = false
    setValues(resetSnapshot.values)
    setTouchedFields(resetSnapshot.touchedFields)
    setRepaymentMethod(resetSnapshot.repaymentMethod)
    setIsAutoCalculation(resetSnapshot.isAutoCalculation)
    setHasSubmitted(resetSnapshot.hasSubmitted)
    setManualCalculation(resetSnapshot.manualCalculation)
    setManualCalculationError(
      resetSnapshot.manualCalculationError,
    )
    setResetSnapshot(null)
    setStatusMessageOverride(
      'リセット前の入力内容を元に戻しました。',
    )

    window.requestAnimationFrame(() => {
      loanAmountRef.current?.focus()
    })
  }

  const resultHeading = getResultHeading(
    isManualResultStale,
    Boolean(activeCalculation),
  )

  return (
    <section
      className="mortgage-calculator"
      aria-labelledby="mortgage-title"
    >
      <header className="mortgage-calculator__heading">
        <p className="section-label">
          MORTGAGE CALCULATOR
        </p>

        <h2 id="mortgage-title">
          住宅ローン返済シミュレーター
        </h2>

        <p>
          借入金額・年利・返済期間から、
          元利均等返済と元金均等返済を
          同じ条件で比較します。
        </p>
      </header>

      <div
        className="mortgage-status"
        data-tone={getStatusTone(viewState)}
        aria-live="polite"
        aria-atomic="true"
      >
        <span aria-hidden="true" />
        <strong>{statusMessage}</strong>
      </div>

      <div className="mortgage-calculator__layout">
        <form
          className="mortgage-form"
          aria-labelledby="mortgage-title"
          onSubmit={handleSubmit}
          noValidate
        >
          <fieldset className="mortgage-method">
            <legend>強調して表示する返済方式</legend>

            <div className="mortgage-method__options">
              <label
                className="mortgage-method__option"
                data-selected={
                  repaymentMethod === 'equal-payment'
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
                    毎月の返済額が原則一定
                  </small>
                </span>
              </label>

              <label
                className="mortgage-method__option"
                data-selected={
                  repaymentMethod === 'equal-principal'
                }
              >
                <input
                  type="radio"
                  name="repayment-method"
                  value="equal-principal"
                  checked={
                    repaymentMethod ===
                    'equal-principal'
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

            <p className="mortgage-method__help">
              両方式を同じ条件で計算し、
              選択した方式を結果で強調表示します。
            </p>
          </fieldset>

          {shouldShowErrorSummary && (
            <div
              ref={errorSummaryRef}
              className="mortgage-error-summary"
              role="alert"
              aria-labelledby="mortgage-error-title"
              tabIndex={-1}
            >
              <strong id="mortgage-error-title">
                入力内容を確認してください
                （{visibleErrorEntries.length}件）
              </strong>

              <ul>
                {visibleErrorEntries.map(
                  ({ fieldName, message }) => (
                    <li key={fieldName}>
                      <a
                        href={`#${FIELD_INPUT_IDS[fieldName]}`}
                        onClick={(event) => {
                          event.preventDefault()
                          fieldRefs[
                            fieldName
                          ].current?.focus()
                        }}
                      >
                        {message}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          <div className="mortgage-field">
            <label htmlFor="mortgage-loan-amount">
              借入金額
            </label>

            <div className="mortgage-input-with-unit">
              <input
                ref={loanAmountRef}
                id="mortgage-loan-amount"
                name="loanAmount"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={values.loanAmount}
                placeholder="例：30,000,000"
                aria-required="true"
                aria-invalid={Boolean(
                  visibleErrors.loanAmount,
                )}
                aria-describedby={
                  visibleErrors.loanAmount
                    ? 'mortgage-loan-amount-help mortgage-loan-amount-error'
                    : 'mortgage-loan-amount-help'
                }
                onChange={(event) =>
                  handleFieldChange(
                    'loanAmount',
                    event,
                  )
                }
                onBlur={(event) =>
                  handleFieldBlur(
                    'loanAmount',
                    event,
                  )
                }
              />

              <span>円</span>
            </div>

            <small
              id="mortgage-loan-amount-help"
              className="mortgage-field__help"
            >
              10万円～10億円の整数で入力してください。
              本シミュレーター上の計算範囲であり、
              金融機関の融資条件や審査基準を
              示すものではありません。
            </small>

            {visibleErrors.loanAmount && (
              <small
                id="mortgage-loan-amount-error"
                className="mortgage-field__error"
              >
                {visibleErrors.loanAmount.message}
              </small>
            )}
          </div>

          <div className="mortgage-field">
            <label htmlFor="mortgage-interest-rate">
              年利
            </label>

            <div className="mortgage-input-with-unit">
              <input
                ref={annualInterestRateRef}
                id="mortgage-interest-rate"
                name="annualInterestRate"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={values.annualInterestRate}
                placeholder="例：1.0"
                aria-required="true"
                aria-invalid={Boolean(
                  visibleErrors.annualInterestRate,
                )}
                aria-describedby={
                  visibleErrors.annualInterestRate
                    ? 'mortgage-interest-rate-help mortgage-interest-rate-error'
                    : 'mortgage-interest-rate-help'
                }
                onChange={(event) =>
                  handleFieldChange(
                    'annualInterestRate',
                    event,
                  )
                }
                onBlur={(event) =>
                  handleFieldBlur(
                    'annualInterestRate',
                    event,
                  )
                }
              />

              <span>%</span>
            </div>

            <small
              id="mortgage-interest-rate-help"
              className="mortgage-field__help"
            >
              0～20％、小数第3位まで入力できます。
            </small>

            {visibleErrors.annualInterestRate && (
              <small
                id="mortgage-interest-rate-error"
                className="mortgage-field__error"
              >
                {
                  visibleErrors.annualInterestRate
                    .message
                }
              </small>
            )}
          </div>

          <div className="mortgage-field">
            <label htmlFor="mortgage-repayment-years">
              返済期間
            </label>

            <div className="mortgage-input-with-unit">
              <input
                ref={repaymentYearsRef}
                id="mortgage-repayment-years"
                name="repaymentYears"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={values.repaymentYears}
                placeholder="例：35"
                aria-required="true"
                aria-invalid={Boolean(
                  visibleErrors.repaymentYears,
                )}
                aria-describedby={
                  visibleErrors.repaymentYears
                    ? 'mortgage-repayment-years-help mortgage-repayment-years-error'
                    : 'mortgage-repayment-years-help'
                }
                onChange={(event) =>
                  handleFieldChange(
                    'repaymentYears',
                    event,
                  )
                }
                onBlur={(event) =>
                  handleFieldBlur(
                    'repaymentYears',
                    event,
                  )
                }
              />

              <span>年</span>
            </div>

            <small
              id="mortgage-repayment-years-help"
              className="mortgage-field__help"
            >
              1～50年の整数で入力してください。
            </small>

            {visibleErrors.repaymentYears && (
              <small
                id="mortgage-repayment-years-error"
                className="mortgage-field__error"
              >
                {
                  visibleErrors.repaymentYears.message
                }
              </small>
            )}
          </div>

          <div className="mortgage-mode">
            <label>
              <input
                type="checkbox"
                checked={isAutoCalculation}
                onChange={
                  handleCalculationModeChange
                }
              />

              <span>
                入力と同時に計算結果を更新する
              </span>
            </label>

            <p>
              {isAutoCalculation
                ? '未操作の項目にはエラーを表示せず、有効な条件がそろった時点で自動計算します。'
                : '入力後にEnterキー、またはシミュレートボタンで計算できます。'}
            </p>
          </div>

          {!isAutoCalculation && (
            <button
              className="mortgage-button mortgage-button--primary"
              type="submit"
            >
              シミュレートする
            </button>
          )}

          <button
            className="mortgage-button mortgage-button--secondary"
            type="button"
            onClick={resetCalculator}
          >
            入力内容をリセット
          </button>

          {resetSnapshot && (
            <div
              className="mortgage-reset-undo"
              role="group"
              aria-label="リセットの取り消し"
            >
              <p>
                <strong>入力内容をリセットしました。</strong>
                <span>10秒以内に元に戻せます。</span>
              </p>

              <button
                className="mortgage-reset-undo__button"
                type="button"
                onClick={restoreReset}
              >
                元に戻す
              </button>
            </div>
          )}
        </form>

        <section
          className="mortgage-results"
          aria-labelledby="mortgage-result-title"
          data-stale={isManualResultStale}
          data-empty={
            activeCalculation === null &&
            calculationError === null
          }
        >
          <div className="mortgage-results__heading">
            <div>
              <p className="mortgage-results__eyebrow">
                RESULT
              </p>

              <h3 id="mortgage-result-title">
                {resultHeading}
              </h3>
            </div>

          </div>

          {isManualResultStale && (
            <div
              className="mortgage-stale-note"
              role="note"
            >
              条件変更前の結果です。現在の条件を反映するには、
              もう一度シミュレートしてください。
            </div>
          )}

          {getCalculationErrorLabel(
            calculationError,
          ) && (
              <div
                className="mortgage-calculation-error"
                role="alert"
              >
                {getCalculationErrorLabel(
                  calculationError,
                )}
              </div>
            )}

          {activeCalculation ? (
            <>
              <div className="mortgage-results__condition-heading">
                <strong>この条件で比較</strong>
                <button
                  className="mortgage-results__edit-button"
                  type="button"
                  onClick={() =>
                    loanAmountRef.current?.focus()
                  }
                >
                  入力条件を確認・変更する
                </button>
              </div>

              <dl className="mortgage-conditions">
                <div><dt>借入金額</dt><dd>{activeCalculation.input.principal.toLocaleString('ja-JP')}円</dd></div>
                <div><dt>年利</dt><dd>{activeCalculation.input.annualRate.toLocaleString('ja-JP', { maximumFractionDigits: 3 })}%</dd></div>
                <div><dt>返済期間</dt><dd>{activeCalculation.input.paymentCount / 12}年</dd></div>
                <div><dt>返済回数</dt><dd>{activeCalculation.input.paymentCount.toLocaleString('ja-JP')}回</dd></div>
              </dl>

              <div className="mortgage-comparison-summary" role="note">
                <strong>比較のポイント</strong>
                <p>{createMortgageComparisonExplanation(activeCalculation.comparison)}</p>
              </div>

              <div className="mortgage-comparison-grid" aria-label="返済方式の比較結果">
                <article className="mortgage-comparison-card" data-selected={repaymentMethod === 'equal-payment'} aria-labelledby="mortgage-equal-payment-title">
                  <header className="mortgage-comparison-card__heading">
                    <div><p>毎月の安定を重視</p><h4 id="mortgage-equal-payment-title">元利均等返済</h4></div>
                    {repaymentMethod === 'equal-payment' && <span>選択中</span>}
                  </header>
                  <dl className="mortgage-comparison-card__values">
                    <div><dt>毎月返済額</dt><dd>{formatApproxMortgageYen(activeCalculation.comparison.equalPayment.firstPayment)}</dd><small>毎月の返済額が原則一定</small></div>
                    <div><dt>最終回返済額</dt><dd>{formatApproxMortgageYen(activeCalculation.comparison.equalPayment.lastPayment)}</dd></div>
                    <div><dt>総返済額</dt><dd>{formatApproxMortgageYen(activeCalculation.comparison.equalPayment.totalPayment)}</dd></div>
                    <div><dt>支払利息総額</dt><dd>{formatApproxMortgageYen(activeCalculation.comparison.equalPayment.totalInterest)}</dd></div>
                  </dl>
                </article>

                <article className="mortgage-comparison-card" data-selected={repaymentMethod === 'equal-principal'} aria-labelledby="mortgage-equal-principal-title">
                  <header className="mortgage-comparison-card__heading">
                    <div><p>利息の軽減を重視</p><h4 id="mortgage-equal-principal-title">元金均等返済</h4></div>
                    {repaymentMethod === 'equal-principal' && <span>選択中</span>}
                  </header>
                  <dl className="mortgage-comparison-card__values">
                    <div><dt>初回返済額</dt><dd>{formatApproxMortgageYen(activeCalculation.comparison.equalPrincipal.firstPayment)}</dd><small>返済額は徐々に減少</small></div>
                    <div><dt>最終回返済額</dt><dd>{formatApproxMortgageYen(activeCalculation.comparison.equalPrincipal.lastPayment)}</dd></div>
                    <div><dt>総返済額</dt><dd>{formatApproxMortgageYen(activeCalculation.comparison.equalPrincipal.totalPayment)}</dd></div>
                    <div><dt>支払利息総額</dt><dd>{formatApproxMortgageYen(activeCalculation.comparison.equalPrincipal.totalInterest)}</dd></div>
                  </dl>
                </article>
              </div>
            </>          ) : (
            <div className="mortgage-results__empty">
              <span aria-hidden="true">¥</span>
              <strong>
                ここに概算結果が表示されます
              </strong>
              <p>
                借入金額・年利・返済期間を入力してください。
              </p>
            </div>
          )}
        </section>
      </div>

      <aside
        className="mortgage-note"
        aria-label="計算上の注意"
      >
        <strong>計算上の前提</strong>

        <p>
          入力した金利が返済期間中変わらず、
          毎月1回返済するものとして算出した概算です。
          計算途中では円未満を丸めず、画面表示時に
          円単位へ四捨五入します。
        </p>

        <p>
          金融機関ごとの各回返済額の端数処理、
          最終回調整、事務手数料、保証料、
          団体信用生命保険料、登記費用、
          火災保険料、金利変動などは含みません。
          実際の返済予定表とは差が生じる場合があります。
        </p>
      </aside>
    </section>
  )
}

export default MortgageCalculator
