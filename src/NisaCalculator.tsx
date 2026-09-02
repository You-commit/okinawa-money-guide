import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import MoneyInput from './components/form/MoneyInput'
import {
  getMoneyInputDigits,
  normalizeMoneyInputCharacters,
} from './utils/moneyInput'
import {
  NISA_INPUT_LIMITS,
  calculateCurrentFutureValueWithInitialInvestment,
  calculateRequiredInvestmentMonths,
  calculateRequiredMonthlyContribution,
  roundHalfUp,
  type NisaCalculationMode,
} from './nisaCalculation'
import {
  assessNisaAllowance,
  type NisaAllowanceAssessment,
} from './nisaAllowance'
import './NisaCalculator.css'

type NisaField =
  | 'monthlyContribution'
  | 'targetAmount'
  | 'annualReturnRate'
  | 'investmentPeriod'
  | 'inflationRate'

type NisaErrors = Partial<Record<NisaField, string>>

type NisaFormValues = {
  initialInvestment: string
  monthlyContribution: string
  targetAmount: string
  annualReturnRate: string
  investmentYears: string
  investmentMonths: string
  inflationRate: string
}

type ParsedNisaValues = {
  initialInvestment: number
  monthlyContribution?: number
  targetAmount?: number
  annualReturnRate?: number
  investmentMonths?: number
  inflationRate?: number
}

type CalculatedNisaResult = {
  status: 'calculated'
  mode: NisaCalculationMode
  futureValue: number
  principal: number
  gain: number
  monthlyContribution: number
  months: number
  targetAmount: number | null
  inflationAdjustedValue: number | null
  allowance: NisaAllowanceAssessment
}

type UnreachableNisaResult = {
  status: 'unreachable'
  mode: 'required-months'
  maximumReachableValue: number
}

type NisaUiResult = CalculatedNisaResult | UnreachableNisaResult

const MODE_OPTIONS: Array<{
  mode: NisaCalculationMode
  label: string
  shortLabel: string
}> = [
  {
    mode: 'future-value',
    label: '将来額を調べる',
    shortLabel: '将来額',
  },
  {
    mode: 'required-contribution',
    label: '必要な毎月積立額を調べる',
    shortLabel: '毎月積立額',
  },
  {
    mode: 'required-months',
    label: '必要な積立期間を調べる',
    shortLabel: '積立期間',
  },
]

const FIELD_INPUT_IDS: Record<NisaField, string> = {
  monthlyContribution: 'nisa-monthly-contribution',
  targetAmount: 'nisa-target-amount',
  annualReturnRate: 'nisa-annual-return-rate',
  investmentPeriod: 'nisa-investment-years',
  inflationRate: 'nisa-inflation-rate',
}

const INITIAL_VALUES: NisaFormValues = {
  initialInvestment: '',
  monthlyContribution: '',
  targetAmount: '',
  annualReturnRate: '',
  investmentYears: '',
  investmentMonths: '',
  inflationRate: '',
}

const normalizeDecimalInput = (value: string) => {
  const converted = normalizeMoneyInputCharacters(value)
    .replace(/,/g, '')
    .replace(/\s/g, '')
  const sign = converted.startsWith('-') ? '-' : ''
  const unsignedValue = converted
    .replace(/-/g, '')
    .replace(/[^\d.]/g, '')
  const [integerPart, ...decimalParts] = unsignedValue.split('.')

  if (decimalParts.length === 0) {
    return `${sign}${integerPart}`
  }

  return `${sign}${integerPart}.${decimalParts.join('')}`
}

const normalizeWholeNumberInput = (value: string) =>
  normalizeMoneyInputCharacters(value).replace(/\D/g, '')

const parseMoneyValue = (value: string) => {
  const digits = getMoneyInputDigits(value)
  return digits === '' ? undefined : Number(digits)
}

const parseDecimalValue = (value: string) => {
  const normalized = normalizeDecimalInput(value)

  if (normalized === '' || normalized === '-' || normalized === '.') {
    return undefined
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

const hasAtMostTwoDecimalPlaces = (value: string) => {
  const decimalPart = normalizeDecimalInput(value).split('.')[1]
  return decimalPart === undefined || decimalPart.length <= 2
}

const getTotalMonths = (
  investmentYears: string,
  investmentMonths: string,
) => {
  const years = investmentYears === '' ? 0 : Number(investmentYears)
  const months = investmentMonths === '' ? 0 : Number(investmentMonths)

  if (
    !Number.isInteger(years) ||
    !Number.isInteger(months) ||
    years < 0 ||
    months < 0 ||
    months > 11
  ) {
    return undefined
  }

  const totalMonths = years * 12 + months

  if (
    totalMonths < NISA_INPUT_LIMITS.months.min ||
    totalMonths > NISA_INPUT_LIMITS.months.max
  ) {
    return undefined
  }

  return totalMonths
}

const parseValues = (values: NisaFormValues): ParsedNisaValues => ({
  initialInvestment: parseMoneyValue(values.initialInvestment) ?? 0,
  monthlyContribution: parseMoneyValue(values.monthlyContribution),
  targetAmount: parseMoneyValue(values.targetAmount),
  annualReturnRate: parseDecimalValue(values.annualReturnRate),
  investmentMonths: getTotalMonths(
    values.investmentYears,
    values.investmentMonths,
  ),
  inflationRate: parseDecimalValue(values.inflationRate),
})

const validateValues = (
  mode: NisaCalculationMode,
  values: NisaFormValues,
  showRequired: boolean,
) => {
  const errors: NisaErrors = {}
  const parsed = parseValues(values)
  const needsMonthly = mode === 'future-value' || mode === 'required-months'
  const needsTarget = mode !== 'future-value'
  const needsPeriod = mode !== 'required-months'

  if (needsMonthly) {
    if (values.monthlyContribution === '') {
      if (showRequired) errors.monthlyContribution = '毎月積立額を入力してください。'
    } else if (
      parsed.monthlyContribution === undefined ||
      parsed.monthlyContribution < NISA_INPUT_LIMITS.monthlyContribution.min ||
      parsed.monthlyContribution > NISA_INPUT_LIMITS.monthlyContribution.max
    ) {
      errors.monthlyContribution =
        '毎月積立額は1円～10,000,000円で入力してください。'
    }
  }

  if (needsTarget) {
    if (values.targetAmount === '') {
      if (showRequired) errors.targetAmount = '目標額を入力してください。'
    } else if (
      parsed.targetAmount === undefined ||
      parsed.targetAmount < NISA_INPUT_LIMITS.targetAmount.min ||
      parsed.targetAmount > NISA_INPUT_LIMITS.targetAmount.max
    ) {
      errors.targetAmount =
        '目標額は1円～1,000,000,000円で入力してください。'
    }
  }

  if (values.annualReturnRate === '') {
    if (showRequired) errors.annualReturnRate = '想定利回りを入力してください。'
  } else if (
    parsed.annualReturnRate === undefined ||
    parsed.annualReturnRate < NISA_INPUT_LIMITS.annualRatePercent.min ||
    parsed.annualReturnRate > NISA_INPUT_LIMITS.annualRatePercent.max ||
    !hasAtMostTwoDecimalPlaces(values.annualReturnRate)
  ) {
    errors.annualReturnRate =
      '想定利回りは-20.00%～20.00%、小数第2位までで入力してください。'
  }

  if (needsPeriod) {
    const periodIsEmpty =
      values.investmentYears === '' && values.investmentMonths === ''

    if (periodIsEmpty) {
      if (showRequired) errors.investmentPeriod = '積立期間を入力してください。'
    } else if (parsed.investmentMonths === undefined) {
      errors.investmentPeriod =
        '積立期間は1～960か月（最大80年）で入力してください。'
    }
  }

  if (values.inflationRate !== '' && (
    parsed.inflationRate === undefined ||
    parsed.inflationRate < NISA_INPUT_LIMITS.inflationRatePercent.min ||
    parsed.inflationRate > NISA_INPUT_LIMITS.inflationRatePercent.max ||
    !hasAtMostTwoDecimalPlaces(values.inflationRate)
  )) {
    errors.inflationRate =
      '想定インフレ率は0.00%～10.00%、小数第2位までで入力してください。'
  }

  return { errors, parsed }
}

const hasRequiredValues = (
  mode: NisaCalculationMode,
  values: NisaFormValues,
) => {
  const hasMonthly = values.monthlyContribution !== ''
  const hasTarget = values.targetAmount !== ''
  const hasRate = values.annualReturnRate !== ''
  const hasPeriod = values.investmentYears !== '' || values.investmentMonths !== ''

  if (mode === 'future-value') return hasMonthly && hasRate && hasPeriod
  if (mode === 'required-contribution') return hasTarget && hasRate && hasPeriod
  return hasTarget && hasMonthly && hasRate
}

const calculateForMode = (
  mode: NisaCalculationMode,
  parsed: ParsedNisaValues,
): NisaUiResult | null => {
  try {
    if (parsed.annualReturnRate === undefined) return null

    if (
      mode === 'future-value' &&
      parsed.monthlyContribution !== undefined &&
      parsed.investmentMonths !== undefined
    ) {
      const result = calculateCurrentFutureValueWithInitialInvestment({
        initialInvestment: parsed.initialInvestment,
        monthlyContribution: parsed.monthlyContribution,
        annualRatePercent: parsed.annualReturnRate,
        months: parsed.investmentMonths,
        inflationRatePercent: parsed.inflationRate,
      })

      return {
        status: 'calculated',
        mode,
        futureValue: result.futureValue,
        principal: result.principal,
        gain: result.gain,
        monthlyContribution: parsed.monthlyContribution,
        months: parsed.investmentMonths,
        targetAmount: null,
        inflationAdjustedValue: result.inflationAdjustedValue,
        allowance: assessNisaAllowance({
          monthlyContribution: parsed.monthlyContribution,
          months: parsed.investmentMonths,
        }),
      }
    }

    if (
      mode === 'required-contribution' &&
      parsed.targetAmount !== undefined &&
      parsed.investmentMonths !== undefined
    ) {
      const result = calculateRequiredMonthlyContribution({
        targetAmount: parsed.targetAmount,
        annualRatePercent: parsed.annualReturnRate,
        months: parsed.investmentMonths,
        inflationRatePercent: parsed.inflationRate,
      })

      return {
        status: 'calculated',
        mode,
        futureValue: result.futureValue,
        principal: result.principal,
        gain: result.gain,
        monthlyContribution: result.requiredMonthlyContribution,
        months: parsed.investmentMonths,
        targetAmount: parsed.targetAmount,
        inflationAdjustedValue: result.inflationAdjustedValue,
        allowance: assessNisaAllowance({
          monthlyContribution: result.requiredMonthlyContribution,
          months: parsed.investmentMonths,
        }),
      }
    }

    if (
      mode === 'required-months' &&
      parsed.targetAmount !== undefined &&
      parsed.monthlyContribution !== undefined
    ) {
      const result = calculateRequiredInvestmentMonths({
        targetAmount: parsed.targetAmount,
        monthlyContribution: parsed.monthlyContribution,
        annualRatePercent: parsed.annualReturnRate,
        inflationRatePercent: parsed.inflationRate,
      })

      if (result.status === 'unreachable') {
        return {
          status: 'unreachable',
          mode,
          maximumReachableValue: result.maximumReachableValue,
        }
      }

      return {
        status: 'calculated',
        mode,
        futureValue: result.futureValue,
        principal: result.principal,
        gain: result.gain,
        monthlyContribution: parsed.monthlyContribution,
        months: result.requiredMonths,
        targetAmount: parsed.targetAmount,
        inflationAdjustedValue: result.inflationAdjustedValue,
        allowance: assessNisaAllowance({
          monthlyContribution: parsed.monthlyContribution,
          months: result.requiredMonths,
        }),
      }
    }
  } catch {
    return null
  }

  return null
}

const formatYen = (value: number) =>
  new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(roundHalfUp(value))

const formatMonths = (months: number) => {
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  if (years === 0) return `${remainingMonths}か月`
  if (remainingMonths === 0) return `${years}年`
  return `${years}年${remainingMonths}か月`
}

const NisaMoneyField = ({
  id,
  label,
  value,
  placeholder,
  required,
  error,
  help,
  onValueChange,
}: {
  id: string
  label: string
  value: string
  placeholder: string
  required: boolean
  error?: string
  help: string
  onValueChange: (value: string) => void
}) => (
  <div className="nisa-field">
    <label htmlFor={id}>{label}</label>
    <div className="input-with-unit">
      <MoneyInput
        id={id}
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        aria-required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
      />
      <span>円</span>
    </div>
    <small id={`${id}-help`} className="nisa-field__help">{help}</small>
    {error && (
      <small id={`${id}-error`} className="nisa-field__error">{error}</small>
    )}
  </div>
)

function NisaCalculator() {
  const [mode, setMode] = useState<NisaCalculationMode>('future-value')
  const [values, setValues] = useState<NisaFormValues>(INITIAL_VALUES)
  const [isAutoCalculation, setIsAutoCalculation] = useState(false)
  const [manualResult, setManualResult] = useState<NisaUiResult | null>(null)
  const [manualErrors, setManualErrors] = useState<NisaErrors>({})
  const [focusErrorSummary, setFocusErrorSummary] = useState(false)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  const autoState = useMemo(() => {
    if (!isAutoCalculation) {
      return { errors: {} as NisaErrors, result: null as NisaUiResult | null }
    }

    const { errors, parsed } = validateValues(mode, values, false)

    if (Object.keys(errors).length > 0 || !hasRequiredValues(mode, values)) {
      return { errors, result: null }
    }

    return { errors, result: calculateForMode(mode, parsed) }
  }, [isAutoCalculation, mode, values])

  const visibleErrors = isAutoCalculation ? autoState.errors : manualErrors
  const displayedResult = isAutoCalculation ? autoState.result : manualResult
  const errorEntries = Object.entries(visibleErrors) as Array<[NisaField, string]>

  useEffect(() => {
    if (focusErrorSummary && errorEntries.length > 0) {
      errorSummaryRef.current?.focus()
      setFocusErrorSummary(false)
    }
  }, [errorEntries.length, focusErrorSummary])

  const updateValue = (field: keyof NisaFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setManualResult(null)
    setManualErrors({})
  }

  const changeMode = (nextMode: NisaCalculationMode) => {
    setMode(nextMode)
    setManualResult(null)
    setManualErrors({})
  }

  const simulate = () => {
    const { errors, parsed } = validateValues(mode, values, true)

    if (Object.keys(errors).length > 0) {
      setManualErrors(errors)
      setManualResult(null)
      setFocusErrorSummary(true)
      return
    }

    setManualErrors({})
    setManualResult(calculateForMode(mode, parsed))
  }

  const resetCalculator = () => {
    setValues(INITIAL_VALUES)
    setManualResult(null)
    setManualErrors({})
  }

  const assetTrajectory = useMemo(() => {
    if (
      displayedResult?.status !== 'calculated' ||
      displayedResult.mode !== 'future-value'
    ) return []

    const initialAmount = parseMoneyValue(values.initialInvestment) ?? 0
    const annualRate = parseDecimalValue(values.annualReturnRate)
    if (annualRate === undefined) return []

    return Array.from({ length: 7 }, (_, index) => index / 6).map((ratio) => {
      if (ratio === 0) {
        return {
          label: '開始', principal: initialAmount, gain: 0,
          futureValue: initialAmount, ratio,
        }
      }

      const pointMonths = ratio === 1
        ? displayedResult.months
        : Math.max(1, Math.floor(displayedResult.months * ratio))
      const point = calculateCurrentFutureValueWithInitialInvestment({
        initialInvestment: initialAmount,
        monthlyContribution: displayedResult.monthlyContribution,
        annualRatePercent: annualRate,
        months: pointMonths,
      })

      return {
        label: ratio === 1
          ? '終了'
          : `${(pointMonths / 12).toLocaleString('ja-JP', {
              maximumFractionDigits: 1,
            })}年後`,
        principal: point.principal,
        gain: point.gain,
        futureValue: point.futureValue,
        ratio,
      }
    })
  }, [displayedResult, values.annualReturnRate, values.initialInvestment])

  const assetAreaGraph = useMemo(() => {
    if (assetTrajectory.length === 0) return null

    const width = 600
    const bottom = 180
    const plotHeight = 150
    const maximumValue = Math.max(
      1,
      ...assetTrajectory.flatMap((point) => [point.principal, point.futureValue]),
    )
    const pointStep = width / (assetTrajectory.length - 1)
    const toY = (value: number) => bottom - value / maximumValue * plotHeight
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
  }, [assetTrajectory])

  const setDecimal = (
    field: 'annualReturnRate' | 'inflationRate',
    value: string,
  ) => updateValue(field, normalizeDecimalInput(value))

  const setWholeNumber = (
    field: 'investmentYears' | 'investmentMonths',
    value: string,
  ) => updateValue(field, normalizeWholeNumberInput(value))

  return (
    <section className="calculator nisa-calculator" aria-labelledby="nisa-title">
      <div className="calculator-heading">
        <p className="section-label">NISA CALCULATOR</p>
        <h2 id="nisa-title">NISA積立シミュレーター</h2>
        <p>将来額・必要積立額・必要期間を、月次複利で試算します。</p>
      </div>

      <div className="nisa-mode-selector" role="tablist" aria-label="計算モード">
        {MODE_OPTIONS.map((option, index) => (
          <button
            key={option.mode}
            id={`nisa-mode-${option.mode}`}
            type="button"
            role="tab"
            aria-selected={mode === option.mode}
            aria-controls="nisa-calculation-panel"
            data-selected={mode === option.mode}
            onClick={() => changeMode(option.mode)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{option.label}</strong>
            <small>{option.shortLabel}を試算</small>
          </button>
        ))}
      </div>

      <div
        id="nisa-calculation-panel"
        className="calculator-layout"
        role="tabpanel"
        aria-labelledby={`nisa-mode-${mode}`}
      >
        <div className="calculator-form">
          <div className="simulator-panel-heading">
            <span aria-hidden="true">01</span>
            <div><p>INPUT</p><h3>条件を入力する</h3></div>
          </div>

          {!isAutoCalculation && errorEntries.length > 0 && (
            <div
              ref={errorSummaryRef}
              className="nisa-error-summary"
              role="alert"
              tabIndex={-1}
            >
              <strong>入力内容を確認してください（{errorEntries.length}件）</strong>
              <ul>
                {errorEntries.map(([field, message]) => (
                  <li key={field}>
                    <a
                      href={`#${FIELD_INPUT_IDS[field]}`}
                      onClick={(event) => {
                        event.preventDefault()
                        document.getElementById(FIELD_INPUT_IDS[field])?.focus()
                      }}
                    >
                      {message}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mode === 'future-value' && (
            <NisaMoneyField
              id="nisa-initial-investment"
              label="初期投資額（任意）"
              value={values.initialInvestment}
              placeholder="例：1,000,000"
              required={false}
              help="将来額の試算にだけ使用し、NISA制度枠の判定には含めません。"
              onValueChange={(value) => updateValue('initialInvestment', value)}
            />
          )}

          {(mode === 'future-value' || mode === 'required-months') && (
            <NisaMoneyField
              id="nisa-monthly-contribution"
              label="毎月積立額"
              value={values.monthlyContribution}
              placeholder="例：30,000"
              required
              error={visibleErrors.monthlyContribution}
              help="1円～10,000,000円で入力してください。"
              onValueChange={(value) => updateValue('monthlyContribution', value)}
            />
          )}

          {mode !== 'future-value' && (
            <NisaMoneyField
              id="nisa-target-amount"
              label="目標額"
              value={values.targetAmount}
              placeholder="例：10,000,000"
              required
              error={visibleErrors.targetAmount}
              help="1円～1,000,000,000円で入力してください。"
              onValueChange={(value) => updateValue('targetAmount', value)}
            />
          )}

          <div className="nisa-field">
            <label htmlFor="nisa-annual-return-rate">想定利回り</label>
            <div className="input-with-unit">
              <input
                id="nisa-annual-return-rate"
                type="text"
                inputMode="decimal"
                value={values.annualReturnRate}
                placeholder="例：5.00"
                aria-required="true"
                aria-invalid={Boolean(visibleErrors.annualReturnRate)}
                aria-describedby={`nisa-annual-return-rate-help${visibleErrors.annualReturnRate ? ' nisa-annual-return-rate-error' : ''}`}
                onChange={(event) => {
                  if (
                    event.nativeEvent instanceof InputEvent &&
                    event.nativeEvent.isComposing
                  ) {
                    updateValue('annualReturnRate', event.target.value)
                    return
                  }
                  setDecimal('annualReturnRate', event.target.value)
                }}
                onCompositionEnd={(event) =>
                  setDecimal('annualReturnRate', event.currentTarget.value)
                }
              />
              <span>%</span>
            </div>
            <small id="nisa-annual-return-rate-help" className="nisa-field__help">
              -20.00%～20.00%、小数第2位まで。初期値はありません。
            </small>
            {visibleErrors.annualReturnRate && (
              <small id="nisa-annual-return-rate-error" className="nisa-field__error">
                {visibleErrors.annualReturnRate}
              </small>
            )}
          </div>

          {mode !== 'required-months' && (
            <fieldset className="nisa-field nisa-period-field">
              <legend>積立期間</legend>
              <div className="nisa-period-inputs">
                <label htmlFor="nisa-investment-years">
                  <span>年</span>
                  <input
                    id="nisa-investment-years"
                    aria-label="積立期間（年）"
                    type="text"
                    inputMode="numeric"
                    value={values.investmentYears}
                    placeholder="20"
                    aria-invalid={Boolean(visibleErrors.investmentPeriod)}
                    aria-describedby={`nisa-investment-period-help${visibleErrors.investmentPeriod ? ' nisa-investment-period-error' : ''}`}
                    onChange={(event) => setWholeNumber('investmentYears', event.target.value)}
                  />
                </label>
                <label htmlFor="nisa-investment-months">
                  <span>か月</span>
                  <input
                    id="nisa-investment-months"
                    aria-label="積立期間（か月）"
                    type="text"
                    inputMode="numeric"
                    value={values.investmentMonths}
                    placeholder="0"
                    aria-invalid={Boolean(visibleErrors.investmentPeriod)}
                    aria-describedby={`nisa-investment-period-help${visibleErrors.investmentPeriod ? ' nisa-investment-period-error' : ''}`}
                    onChange={(event) => setWholeNumber('investmentMonths', event.target.value)}
                  />
                </label>
              </div>
              <small id="nisa-investment-period-help" className="nisa-field__help">
                合計1～960か月。80年0か月まで入力できます。
              </small>
              {visibleErrors.investmentPeriod && (
                <small id="nisa-investment-period-error" className="nisa-field__error">
                  {visibleErrors.investmentPeriod}
                </small>
              )}
            </fieldset>
          )}

          <div className="nisa-field">
            <label htmlFor="nisa-inflation-rate">想定インフレ率（任意）</label>
            <div className="input-with-unit">
              <input
                id="nisa-inflation-rate"
                type="text"
                inputMode="decimal"
                value={values.inflationRate}
                placeholder="例：2.00"
                aria-invalid={Boolean(visibleErrors.inflationRate)}
                aria-describedby={`nisa-inflation-rate-help${visibleErrors.inflationRate ? ' nisa-inflation-rate-error' : ''}`}
                onChange={(event) => setDecimal('inflationRate', event.target.value)}
              />
              <span>%</span>
            </div>
            <small id="nisa-inflation-rate-help" className="nisa-field__help">
              0.00%～10.00%。入力した場合だけ実質価値を表示します。
            </small>
            {visibleErrors.inflationRate && (
              <small id="nisa-inflation-rate-error" className="nisa-field__error">
                {visibleErrors.inflationRate}
              </small>
            )}
          </div>

          <div className="calculation-mode">
            <label className="mode-checkbox">
              <input
                type="checkbox"
                checked={isAutoCalculation}
                onChange={(event) => {
                  setIsAutoCalculation(event.target.checked)
                  setManualResult(null)
                  setManualErrors({})
                }}
              />
              <span>入力と同時に計算結果を更新する</span>
            </label>
            <p>
              {isAutoCalculation
                ? '有効な条件がそろうと、結果を自動更新します。'
                : '「計算する」を押した時に入力内容を確認します。'}
            </p>
          </div>

          <div className="simulator-form-actions" data-single={isAutoCalculation}>
            <button className="reset-button" type="button" onClick={resetCalculator}>
              入力内容をリセット
            </button>
            {!isAutoCalculation && (
              <button className="simulate-button" type="button" onClick={simulate}>
                計算する
              </button>
            )}
          </div>
        </div>

        <div className="calculator-results" aria-live="polite">
          <div className="simulator-results-heading">
            <div><p>RESULT</p><h3>概算結果</h3></div>
            <span>毎月末積立・実効月利</span>
          </div>

          {displayedResult?.status === 'unreachable' ? (
            <div className="nisa-unreachable-result">
              <strong>この条件では目標額に到達しません。</strong>
              <p>
                負の想定利回りでは、積立を続けても理論上の上限があります。
                条件を変更して再度お試しください。
              </p>
            </div>
          ) : displayedResult?.status === 'calculated' ? (
            <>
              <div className="simulator-summary-grid simulator-summary-grid--nisa nisa-result-grid">
                {displayedResult.mode === 'future-value' && (
                  <>
                    <ResultCard className="emphasis-result result-card--future" label="将来資産額" value={formatYen(displayedResult.futureValue)} help="毎月末積立・月次複利による概算" />
                    <ResultCard label="元本" value={formatYen(displayedResult.principal)} help="初期投資額と毎月積立額の合計" />
                    <ResultCard className="result-card--gain" label="運用収益" value={formatYen(displayedResult.gain)} help="将来資産額－元本" />
                  </>
                )}

                {displayedResult.mode === 'required-contribution' && (
                  <>
                    <ResultCard className="emphasis-result result-card--future" label="必要な毎月積立額" value={formatYen(displayedResult.monthlyContribution)} help="目標額を下回らないよう1円単位で切り上げ" />
                    <ResultCard label="年間換算額" value={formatYen(displayedResult.allowance.annualContribution)} help="必要な毎月積立額×12か月" />
                    <ResultCard label="目標額" value={formatYen(displayedResult.targetAmount!)} help="入力した目標額" />
                    <ResultCard label="元本" value={formatYen(displayedResult.principal)} help="切り上げ後の毎月積立額×積立月数" />
                  </>
                )}

                {displayedResult.mode === 'required-months' && (
                  <>
                    <ResultCard className="emphasis-result result-card--future" label="必要積立期間" value={formatMonths(displayedResult.months)} help={`${displayedResult.months.toLocaleString('ja-JP')}か月（1か月単位で切り上げ）`} />
                    <ResultCard label="目標額" value={formatYen(displayedResult.targetAmount!)} help="入力した目標額" />
                    <ResultCard label="毎月積立額" value={formatYen(displayedResult.monthlyContribution)} help="入力した毎月積立額" />
                    <ResultCard label="元本" value={formatYen(displayedResult.principal)} help="毎月積立額×必要月数" />
                  </>
                )}

                {displayedResult.inflationAdjustedValue !== null && (
                  <ResultCard className="nisa-inflation-card" label="インフレ調整後価値" value={formatYen(displayedResult.inflationAdjustedValue)} help="入力した想定インフレ率による現在価値の目安" />
                )}

                <ResultCard className="result-card--tax-free-note" label="非課税メリット" value="別途確認" help="個別税額は自動算定していません" />
              </div>

              <NisaAllowancePanel assessment={displayedResult.allowance} />
            </>
          ) : (
            <div className="nisa-result-empty">
              <strong>{MODE_OPTIONS.find((option) => option.mode === mode)?.label}</strong>
              <p>
                {isAutoCalculation
                  ? '有効な条件がそろうと概算結果を表示します。'
                  : '条件を入力して「計算する」を押してください。'}
              </p>
            </div>
          )}

          {mode === 'future-value' && (
            <div className="simulator-chart-panel simulator-chart-panel--nisa">
              <div className="simulator-subheading">
                <div><p>ASSET TRAJECTORY</p><h3>資産の推移イメージ</h3></div>
                <span>
                  {displayedResult?.status === 'calculated'
                    ? `運用期間 ${formatMonths(displayedResult.months)}`
                    : '条件入力後に表示'}
                </span>
              </div>

              {assetAreaGraph && displayedResult?.status === 'calculated' ? (
                <div className="nisa-trajectory-wrap">
                  <div className="nisa-trajectory-legend" aria-hidden="true">
                    <span><i />積立元本</span><span><i />運用益</span><span><i />将来資産額</span>
                  </div>
                  <div className="nisa-area-graph" aria-label="元本と運用益を含む資産推移の概算グラフ">
                    <svg viewBox="0 0 600 200" role="img" aria-hidden="true" preserveAspectRatio="none">
                      <g className="nisa-area-graph__grid">
                        <line x1="0" y1="30" x2="600" y2="30" /><line x1="0" y1="80" x2="600" y2="80" />
                        <line x1="0" y1="130" x2="600" y2="130" /><line x1="0" y1="180" x2="600" y2="180" />
                      </g>
                      <polygon className="nisa-area-graph__principal" points={assetAreaGraph.principalArea} />
                      <polygon className="nisa-area-graph__gain" points={assetAreaGraph.gainArea} />
                      <polyline className="nisa-area-graph__total" points={assetAreaGraph.totalLine} />
                    </svg>
                    <div className="nisa-area-graph__labels" aria-hidden="true">
                      {assetTrajectory.map((point) => <span key={point.ratio}>{point.label}</span>)}
                    </div>
                    <strong>{formatYen(displayedResult.futureValue)}</strong>
                  </div>
                </div>
              ) : (
                <div className="nisa-area-graph nisa-area-graph--empty" aria-label="資産推移（未計算）">
                  <svg viewBox="0 0 600 200" aria-hidden="true" preserveAspectRatio="none">
                    <g className="nisa-area-graph__grid">
                      <line x1="0" y1="30" x2="600" y2="30" /><line x1="0" y1="80" x2="600" y2="80" />
                      <line x1="0" y1="130" x2="600" y2="130" /><line x1="0" y1="180" x2="600" y2="180" />
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
          )}
        </div>
      </div>

      <p className="calculator-note">
        本シミュレーターは、一定の利回りで毎月末に積み立てる想定の概算です。
        実際の運用成果、手数料、価格変動、利用可能なNISA枠を保証するものではありません。
      </p>
    </section>
  )
}

const ResultCard = ({
  label, value, help, className = '',
}: {
  label: string
  value: string
  help: string
  className?: string
}) => (
  <div className={`result-card ${className}`.trim()}>
    <span>{label}</span><strong>{value}</strong><small>{help}</small>
  </div>
)

const NisaAllowancePanel = ({
  assessment,
}: {
  assessment: NisaAllowanceAssessment
}) => (
  <section
    className="nisa-allowance-panel"
    data-status={assessment.annualStatus}
    aria-labelledby="nisa-allowance-title"
  >
    <div className="nisa-allowance-panel__heading">
      <div><p>NISA ALLOWANCE CHECK</p><h3 id="nisa-allowance-title">NISA制度枠との関係</h3></div>
      <span>2026年現行制度</span>
    </div>
    <div className="nisa-allowance-panel__summary">
      <div><span>年間積立額</span><strong>{formatYen(assessment.annualContribution)}</strong></div>
      <div><span>枠判定対象の積立元本</span><strong>{formatYen(assessment.formalPrincipal)}</strong></div>
    </div>
    <p className="nisa-allowance-panel__limits">
      年間上限：つみたて投資枠120万円／成長投資枠240万円／合計360万円
    </p>
    <div className="nisa-allowance-panel__message">
      <strong>{assessment.annualTitle}</strong><p>{assessment.annualDescription}</p>
    </div>
    {assessment.requiresLifetimeLimitReview && (
      <div className="nisa-lifetime-notice">
        <strong>非課税保有限度額について確認が必要です</strong>
        <p>
          積立元本の合計が1,800万円を超える試算です。
          NISAの非課税保有限度額は簿価で管理され、売却後の枠再利用等もあるため、
          実際の利用可能枠は金融機関等でご確認ください。
        </p>
      </div>
    )}
  </section>
)

export default NisaCalculator
