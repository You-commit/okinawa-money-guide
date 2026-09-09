import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import MoneyInput from './components/form/MoneyInput'
import { navigateToSimulationResult } from './utils/simulationResultNavigation'
import {
  getMoneyInputDigits,
  normalizeMoneyInputCharacters,
} from './utils/moneyInput'
import {
  NISA_INPUT_LIMITS,
  calculateNisaTrajectory,
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
import {
  calculateNisaScenarioComparison,
  getNisaScenarioResults,
  type NisaScenarioComparison,
} from './nisaScenarioComparison'
import {
  NISA_CONFIRMATION_ITEMS,
  NISA_PRIMARY_SOURCES,
  NISA_UNCONSIDERED_ITEMS,
  createNisaConsultationSummaryText,
  getNisaAllowanceRelation,
  getNisaModeLabel,
  getNisaPrincipalLabel,
  type NisaConsultationRecord as NisaConsultationSummaryRecord,
  type NisaConsultationInputSnapshot,
} from './nisaConsultationSummary'
import './NisaCalculator.css'

type NisaField =
  | 'monthlyContribution'
  | 'targetAmount'
  | 'annualReturnRate'
  | 'investmentPeriod'
  | 'inflationRate'
  | 'lowScenarioRate'
  | 'highScenarioRate'

type NisaErrors = Partial<Record<NisaField, string>>

type NisaFormValues = {
  initialInvestment: string
  monthlyContribution: string
  targetAmount: string
  annualReturnRate: string
  investmentYears: string
  investmentMonths: string
  inflationRate: string
  lowScenarioRate: string
  highScenarioRate: string
}

type ParsedNisaValues = {
  initialInvestment: number
  monthlyContribution?: number
  targetAmount?: number
  annualReturnRate?: number
  investmentMonths?: number
  inflationRate?: number
  lowScenarioRate?: number
  highScenarioRate?: number
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
  scenarioComparison: NisaScenarioComparison | null
}

type UnreachableNisaResult = {
  status: 'unreachable'
  mode: 'required-months'
  maximumReachableValue: number
}

type NisaUiResult = CalculatedNisaResult | UnreachableNisaResult

type NisaCalculationRecord = {
  result: NisaUiResult
  input: NisaConsultationInputSnapshot
  calculatedAt: string
}

type NisaResetSnapshot = {
  mode: NisaCalculationMode
  values: NisaFormValues
  isAutoCalculation: boolean
  isScenarioComparisonEnabled: boolean
}

type NisaSummaryActionStatus = 'copied' | 'copy-error' | null

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
  lowScenarioRate: 'nisa-low-scenario-rate',
  highScenarioRate: 'nisa-high-scenario-rate',
}

const INITIAL_VALUES: NisaFormValues = {
  initialInvestment: '',
  monthlyContribution: '',
  targetAmount: '',
  annualReturnRate: '',
  investmentYears: '',
  investmentMonths: '',
  inflationRate: '',
  lowScenarioRate: '',
  highScenarioRate: '',
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
  lowScenarioRate: parseDecimalValue(values.lowScenarioRate),
  highScenarioRate: parseDecimalValue(values.highScenarioRate),
})

const validateValues = (
  mode: NisaCalculationMode,
  values: NisaFormValues,
  showRequired: boolean,
  isScenarioComparisonEnabled: boolean,
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

  if (mode === 'future-value' && isScenarioComparisonEnabled) {
    if (values.lowScenarioRate === '') {
      if (showRequired) {
        errors.lowScenarioRate = '低位シナリオの利回りを入力してください。'
      }
    } else if (
      parsed.lowScenarioRate === undefined ||
      parsed.lowScenarioRate < NISA_INPUT_LIMITS.annualRatePercent.min ||
      parsed.lowScenarioRate > NISA_INPUT_LIMITS.annualRatePercent.max ||
      !hasAtMostTwoDecimalPlaces(values.lowScenarioRate)
    ) {
      errors.lowScenarioRate =
        '低位シナリオは-20.00%～20.00%、小数第2位までで入力してください。'
    } else if (
      parsed.annualReturnRate !== undefined &&
      parsed.lowScenarioRate > parsed.annualReturnRate
    ) {
      errors.lowScenarioRate =
        '低位シナリオは基準シナリオ以下の利回りを入力してください。'
    }

    if (values.highScenarioRate === '') {
      if (showRequired) {
        errors.highScenarioRate = '高位シナリオの利回りを入力してください。'
      }
    } else if (
      parsed.highScenarioRate === undefined ||
      parsed.highScenarioRate < NISA_INPUT_LIMITS.annualRatePercent.min ||
      parsed.highScenarioRate > NISA_INPUT_LIMITS.annualRatePercent.max ||
      !hasAtMostTwoDecimalPlaces(values.highScenarioRate)
    ) {
      errors.highScenarioRate =
        '高位シナリオは-20.00%～20.00%、小数第2位までで入力してください。'
    } else if (
      parsed.annualReturnRate !== undefined &&
      parsed.highScenarioRate < parsed.annualReturnRate
    ) {
      errors.highScenarioRate =
        '高位シナリオは基準シナリオ以上の利回りを入力してください。'
    }
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
        scenarioComparison: null,
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
        scenarioComparison: null,
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
        scenarioComparison: null,
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

const createCalculationRecord = (
  mode: NisaCalculationMode,
  values: NisaFormValues,
  parsed: ParsedNisaValues,
  isScenarioComparisonEnabled: boolean,
): NisaCalculationRecord | null => {
  const baseResult = calculateForMode(mode, parsed)

  if (baseResult === null || parsed.annualReturnRate === undefined) {
    return null
  }

  let scenarioComparison: NisaScenarioComparison | null = null

  if (
    baseResult.status === 'calculated' &&
    mode === 'future-value' &&
    isScenarioComparisonEnabled &&
    parsed.monthlyContribution !== undefined &&
    parsed.investmentMonths !== undefined &&
    parsed.lowScenarioRate !== undefined &&
    parsed.highScenarioRate !== undefined &&
    parsed.lowScenarioRate >= NISA_INPUT_LIMITS.annualRatePercent.min &&
    parsed.lowScenarioRate <= NISA_INPUT_LIMITS.annualRatePercent.max &&
    parsed.highScenarioRate >= NISA_INPUT_LIMITS.annualRatePercent.min &&
    parsed.highScenarioRate <= NISA_INPUT_LIMITS.annualRatePercent.max &&
    parsed.lowScenarioRate <= parsed.annualReturnRate &&
    parsed.annualReturnRate <= parsed.highScenarioRate &&
    hasAtMostTwoDecimalPlaces(values.lowScenarioRate) &&
    hasAtMostTwoDecimalPlaces(values.highScenarioRate)
  ) {
    scenarioComparison = calculateNisaScenarioComparison({
      initialInvestment: parsed.initialInvestment,
      monthlyContribution: parsed.monthlyContribution,
      months: parsed.investmentMonths,
      lowAnnualRatePercent: parsed.lowScenarioRate,
      baseAnnualRatePercent: parsed.annualReturnRate,
      highAnnualRatePercent: parsed.highScenarioRate,
      inflationRatePercent: parsed.inflationRate,
    })
  }

  const result = baseResult.status === 'calculated'
    ? { ...baseResult, scenarioComparison }
    : baseResult

  return {
    result,
    calculatedAt: new Date().toISOString(),
    input: {
      mode,
      initialInvestment:
        mode === 'future-value' && values.initialInvestment !== ''
          ? parsed.initialInvestment
          : null,
      monthlyContribution:
        mode === 'future-value' || mode === 'required-months'
          ? parsed.monthlyContribution ?? null
          : null,
      targetAmount:
        mode === 'future-value'
          ? null
          : parsed.targetAmount ?? null,
      annualRatePercent: parsed.annualReturnRate,
      inputMonths:
        mode === 'required-months'
          ? null
          : parsed.investmentMonths ?? null,
      inflationRatePercent: parsed.inflationRate ?? null,
      scenarioComparisonEnabled:
        mode === 'future-value' && isScenarioComparisonEnabled,
      lowScenarioAnnualRatePercent:
        mode === 'future-value' && isScenarioComparisonEnabled
          ? parsed.lowScenarioRate ?? null
          : null,
      highScenarioAnnualRatePercent:
        mode === 'future-value' && isScenarioComparisonEnabled
          ? parsed.highScenarioRate ?? null
          : null,
    },
  }
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

const formatGraphAxisYen = (value: number) => {
  if (value === 0) return '0'

  if (Math.abs(value) >= 100_000_000) {
    const oku = roundHalfUp(value / 10_000_000) / 10
    return `${oku.toLocaleString('ja-JP', { maximumFractionDigits: 1 })}億円`
  }

  if (Math.abs(value) >= 10_000) {
    return `${roundHalfUp(value / 10_000).toLocaleString('ja-JP')}万円`
  }

  return `${roundHalfUp(value).toLocaleString('ja-JP')}円`
}

const formatTrajectoryPointLabel = (
  months: number,
  finalMonths: number,
) => {
  if (months === 0) return '開始'
  if (months === finalMonths) return `最終（${formatMonths(months)}）`
  return formatMonths(months)
}

const createScenarioGraphData = (
  comparison: NisaScenarioComparison,
) => {
  const width = 600
  const bottom = 180
  const plotHeight = 150
  const scenarios = getNisaScenarioResults(comparison)
  const maximumValue = Math.max(
    1,
    ...scenarios.flatMap((scenario) =>
      scenario.trajectory.map((point) => point.futureValue),
    ),
  )
  const toY = (value: number) =>
    bottom - value / maximumValue * plotHeight

  return {
    lines: scenarios.map((scenario) => {
      const pointStep = scenario.trajectory.length > 1
        ? width / (scenario.trajectory.length - 1)
        : 0

      return {
        id: scenario.id,
        points: scenario.trajectory.map((point, index) =>
          `${index * pointStep},${toY(point.futureValue)}`,
        ).join(' '),
      }
    }),
    xAxisLabels: comparison.base.trajectory.map((point) => ({
      months: point.months,
      label: formatTrajectoryPointLabel(
        point.months,
        comparison.base.trajectory.at(-1)?.months ?? point.months,
      ),
    })),
    yAxisValues: [1, 0.75, 0.5, 0.25, 0].map((ratio) =>
      maximumValue * ratio,
    ),
  }
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

const InfoTooltip = ({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: string
}) => (
  <span className="nisa-info-tooltip">
    <button
      type="button"
      className="nisa-info-tooltip__trigger"
      aria-label={label}
      aria-describedby={id}
    >
      i
    </button>
    <span id={id} className="nisa-info-tooltip__content" role="tooltip">
      {children}
    </span>
  </span>
)

function NisaCalculator() {
  const [mode, setMode] = useState<NisaCalculationMode>('future-value')
  const [values, setValues] = useState<NisaFormValues>(INITIAL_VALUES)
  const [isAutoCalculation, setIsAutoCalculation] = useState(false)
  const [isScenarioComparisonEnabled, setIsScenarioComparisonEnabled] =
    useState(false)
  const [manualRecord, setManualRecord] =
    useState<NisaCalculationRecord | null>(null)
  const [manualErrors, setManualErrors] = useState<NisaErrors>({})
  const [focusErrorSummary, setFocusErrorSummary] = useState(false)
  const [resetSnapshot, setResetSnapshot] =
    useState<NisaResetSnapshot | null>(null)
  const [summaryActionStatus, setSummaryActionStatus] =
    useState<NisaSummaryActionStatus>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const summaryStatusTimerRef = useRef<number | null>(null)
  const copyRequestIdRef = useRef(0)
  const modeButtonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const resultsRef = useRef<HTMLDivElement>(null)

  const autoState = useMemo(() => {
    if (!isAutoCalculation) {
      return {
        errors: {} as NisaErrors,
        record: null as NisaCalculationRecord | null,
      }
    }

    const { errors, parsed } = validateValues(
      mode,
      values,
      false,
      isScenarioComparisonEnabled,
    )
    const hasCoreErrors = Object.keys(errors).some(
      (field) => field !== 'lowScenarioRate' && field !== 'highScenarioRate',
    )

    if (hasCoreErrors || !hasRequiredValues(mode, values)) {
      return { errors, record: null }
    }

    return {
      errors,
      record: createCalculationRecord(
        mode,
        values,
        parsed,
        isScenarioComparisonEnabled,
      ),
    }
  }, [isAutoCalculation, isScenarioComparisonEnabled, mode, values])

  const visibleErrors = isAutoCalculation ? autoState.errors : manualErrors
  const displayedRecord = isAutoCalculation ? autoState.record : manualRecord
  const displayedResult = displayedRecord?.result ?? null
  const errorEntries = Object.entries(visibleErrors) as Array<[NisaField, string]>
  const consultationRecord = useMemo(
    () => displayedRecord?.result.status === 'calculated'
      ? {
          input: displayedRecord.input,
          result: displayedRecord.result,
          calculatedAt: displayedRecord.calculatedAt,
        }
      : null,
    [displayedRecord],
  )
  const consultationSummary = useMemo(
    () => consultationRecord
      ? createNisaConsultationSummaryText(consultationRecord)
      : null,
    [consultationRecord],
  )

  useEffect(() => {
    if (focusErrorSummary && errorEntries.length > 0) {
      errorSummaryRef.current?.focus()
      setFocusErrorSummary(false)
    }
  }, [errorEntries.length, focusErrorSummary])

  useEffect(() => {
    copyRequestIdRef.current += 1
    setSummaryActionStatus(null)

    if (summaryStatusTimerRef.current !== null) {
      window.clearTimeout(summaryStatusTimerRef.current)
      summaryStatusTimerRef.current = null
    }
  }, [displayedRecord])

  useEffect(() => () => {
    copyRequestIdRef.current += 1

    if (summaryStatusTimerRef.current !== null) {
      window.clearTimeout(summaryStatusTimerRef.current)
    }
  }, [])

  const dismissResetUndo = () => {
    setResetSnapshot(null)
  }

  const updateValue = (field: keyof NisaFormValues, value: string) => {
    dismissResetUndo()
    setValues((current) => ({ ...current, [field]: value }))
    setManualRecord(null)
    setManualErrors({})
  }

  const changeScenarioComparison = (enabled: boolean) => {
    dismissResetUndo()
    setIsScenarioComparisonEnabled(enabled)
    setManualRecord(null)
    setManualErrors({})
  }

  const changeMode = (nextMode: NisaCalculationMode) => {
    if (nextMode === mode) return

    dismissResetUndo()
    setMode(nextMode)
    setManualRecord(null)
    setManualErrors({})
  }

  const handleModeKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex: number | null = null

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % MODE_OPTIONS.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + MODE_OPTIONS.length) % MODE_OPTIONS.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = MODE_OPTIONS.length - 1
    }

    if (nextIndex === null) return

    event.preventDefault()
    changeMode(MODE_OPTIONS[nextIndex].mode)
    modeButtonRefs.current[nextIndex]?.focus()
  }

  const simulate = () => {
    const { errors, parsed } = validateValues(
      mode,
      values,
      true,
      isScenarioComparisonEnabled,
    )

    if (Object.keys(errors).length > 0) {
      setManualErrors(errors)
      setManualRecord(null)
      setFocusErrorSummary(true)
      return
    }

    setManualErrors({})
    setManualRecord(createCalculationRecord(
      mode,
      values,
      parsed,
      isScenarioComparisonEnabled,
    ))
    navigateToSimulationResult(resultsRef.current)
  }

  const resetCalculator = () => {
    const shouldOfferUndo =
      mode !== 'future-value' ||
      isAutoCalculation ||
      isScenarioComparisonEnabled ||
      Object.values(values).some((value) => value !== '')

    setResetSnapshot(shouldOfferUndo
      ? {
          mode,
          values: { ...values },
          isAutoCalculation,
          isScenarioComparisonEnabled,
        }
      : null)
    setMode('future-value')
    setValues(INITIAL_VALUES)
    setIsAutoCalculation(false)
    setIsScenarioComparisonEnabled(false)
    setManualRecord(null)
    setManualErrors({})
  }

  const restoreReset = () => {
    if (resetSnapshot === null) return

    setMode(resetSnapshot.mode)
    setValues(resetSnapshot.values)
    setIsAutoCalculation(resetSnapshot.isAutoCalculation)
    setIsScenarioComparisonEnabled(
      resetSnapshot.isScenarioComparisonEnabled,
    )
    setManualRecord(null)
    setManualErrors({})
    setResetSnapshot(null)
  }

  const handleAutoCalculationChange = (checked: boolean) => {
    dismissResetUndo()
    setIsAutoCalculation(checked)
    setManualRecord(null)
    setManualErrors({})
  }

  const copyConsultationSummary = async () => {
    if (consultationSummary === null) return

    if (summaryStatusTimerRef.current !== null) {
      window.clearTimeout(summaryStatusTimerRef.current)
      summaryStatusTimerRef.current = null
    }

    const requestId = copyRequestIdRef.current + 1
    copyRequestIdRef.current = requestId

    try {
      await navigator.clipboard.writeText(consultationSummary)

      if (requestId !== copyRequestIdRef.current) return

      setSummaryActionStatus('copied')
      summaryStatusTimerRef.current = window.setTimeout(() => {
        if (requestId === copyRequestIdRef.current) {
          setSummaryActionStatus(null)
          summaryStatusTimerRef.current = null
        }
      }, 3000)
    } catch {
      if (requestId !== copyRequestIdRef.current) return
      setSummaryActionStatus('copy-error')
    }
  }

  const printConsultationSummary = () => {
    if (consultationSummary === null) return
    window.print()
  }

  const assetTrajectory = useMemo(() => {
    if (
      displayedRecord?.result.status !== 'calculated' ||
      displayedRecord.result.mode !== 'future-value'
    ) return []

    const points = calculateNisaTrajectory({
      initialInvestment: displayedRecord.input.initialInvestment ?? 0,
      monthlyContribution: displayedRecord.result.monthlyContribution,
      annualRatePercent: displayedRecord.input.annualRatePercent,
      months: displayedRecord.result.months,
    })

    return points.map((point) => ({
      ...point,
      label: formatTrajectoryPointLabel(
        point.months,
        displayedRecord.result.status === 'calculated'
          ? displayedRecord.result.months
          : point.months,
      ),
    }))
  }, [displayedRecord])

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
      yAxisValues: [1, 0.75, 0.5, 0.25, 0].map((ratio) =>
        maximumValue * ratio,
      ),
    }
  }, [assetTrajectory])

  const displayedScenarioComparison =
    displayedResult?.status === 'calculated'
      ? displayedResult.scenarioComparison
      : null
  const scenarioGraphData = useMemo(
    () => displayedScenarioComparison
      ? createScenarioGraphData(displayedScenarioComparison)
      : null,
    [displayedScenarioComparison],
  )

  const setDecimal = (
    field:
      | 'annualReturnRate'
      | 'inflationRate'
      | 'lowScenarioRate'
      | 'highScenarioRate',
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
            ref={(element) => {
              modeButtonRefs.current[index] = element
            }}
            id={`nisa-mode-${option.mode}`}
            type="button"
            role="tab"
            aria-selected={mode === option.mode}
            aria-controls="nisa-calculation-panel"
            tabIndex={mode === option.mode ? 0 : -1}
            data-selected={mode === option.mode}
            onClick={() => changeMode(option.mode)}
            onKeyDown={(event) => handleModeKeyDown(event, index)}
          >
            <span className="nisa-mode-selector__number">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="nisa-mode-selector__content">
              <strong>{option.label}</strong>
              <small>{option.shortLabel}を試算</small>
            </span>
            {mode === option.mode && (
              <span className="nisa-mode-selector__state">選択中</span>
            )}
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

          {mode === 'future-value' && (
            <section
              className="nisa-scenario-input"
              aria-labelledby="nisa-scenario-input-title"
            >
              <div className="nisa-scenario-input__heading">
                <div>
                  <h4 id="nisa-scenario-input-title">シナリオ比較</h4>
                  <p>利回りだけを変えた3つの仮定を比較します。</p>
                </div>
                <div
                  className="nisa-scenario-segmented-control"
                  role="group"
                  aria-label="シナリオ比較"
                >
                  <button
                    type="button"
                    aria-pressed={!isScenarioComparisonEnabled}
                    onClick={() => changeScenarioComparison(false)}
                  >
                    比較しない
                  </button>
                  <button
                    type="button"
                    aria-pressed={isScenarioComparisonEnabled}
                    onClick={() => changeScenarioComparison(true)}
                  >
                    比較する
                  </button>
                </div>
              </div>

              {isScenarioComparisonEnabled && (
                <div
                  id="nisa-scenario-rate-fields"
                  className="nisa-scenario-rate-fields"
                >
                  <div className="nisa-field nisa-scenario-rate-field">
                    <label htmlFor="nisa-low-scenario-rate">
                      低位シナリオ
                    </label>
                    <div className="input-with-unit">
                      <input
                        id="nisa-low-scenario-rate"
                        type="text"
                        inputMode="decimal"
                        value={values.lowScenarioRate}
                        placeholder="-20.00～20.00"
                        aria-required="true"
                        aria-invalid={Boolean(visibleErrors.lowScenarioRate)}
                        aria-describedby={`nisa-low-scenario-rate-help${visibleErrors.lowScenarioRate ? ' nisa-low-scenario-rate-error' : ''}`}
                        onChange={(event) =>
                          setDecimal('lowScenarioRate', event.target.value)
                        }
                      />
                      <span>%</span>
                    </div>
                    <small
                      id="nisa-low-scenario-rate-help"
                      className="nisa-field__help"
                    >
                      基準シナリオ以下の利回り
                    </small>
                    {visibleErrors.lowScenarioRate && (
                      <small
                        id="nisa-low-scenario-rate-error"
                        className="nisa-field__error"
                      >
                        {visibleErrors.lowScenarioRate}
                      </small>
                    )}
                  </div>

                  <div className="nisa-scenario-base-rate">
                    <span>基準シナリオ</span>
                    <strong>
                      {values.annualReturnRate === ''
                        ? '想定利回りを入力'
                        : `${values.annualReturnRate}%`}
                    </strong>
                    <small>現在入力中の想定利回り</small>
                  </div>

                  <div className="nisa-field nisa-scenario-rate-field">
                    <label htmlFor="nisa-high-scenario-rate">
                      高位シナリオ
                    </label>
                    <div className="input-with-unit">
                      <input
                        id="nisa-high-scenario-rate"
                        type="text"
                        inputMode="decimal"
                        value={values.highScenarioRate}
                        placeholder="-20.00～20.00"
                        aria-required="true"
                        aria-invalid={Boolean(visibleErrors.highScenarioRate)}
                        aria-describedby={`nisa-high-scenario-rate-help${visibleErrors.highScenarioRate ? ' nisa-high-scenario-rate-error' : ''}`}
                        onChange={(event) =>
                          setDecimal('highScenarioRate', event.target.value)
                        }
                      />
                      <span>%</span>
                    </div>
                    <small
                      id="nisa-high-scenario-rate-help"
                      className="nisa-field__help"
                    >
                      基準シナリオ以上の利回り
                    </small>
                    {visibleErrors.highScenarioRate && (
                      <small
                        id="nisa-high-scenario-rate-error"
                        className="nisa-field__error"
                      >
                        {visibleErrors.highScenarioRate}
                      </small>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

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
            <div className="nisa-field__label-row">
              <label htmlFor="nisa-inflation-rate">想定インフレ率（任意）</label>
              <InfoTooltip
                id="nisa-inflation-rate-tooltip"
                label="想定インフレ率の説明"
              >
                将来のお金の実質的な価値を確認するための任意項目です。入力しなくても通常の資産形成試算はできます。
              </InfoTooltip>
            </div>
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
                onChange={(event) =>
                  handleAutoCalculationChange(event.target.checked)
                }
              />
              <span>入力と同時に計算結果を更新する</span>
            </label>
            <p>
              {isAutoCalculation
                ? '有効な条件がそろうと、結果を自動更新します。'
                : '「シミュレートする」を押した時に入力内容を確認します。'}
            </p>
          </div>

          <div className="simulator-form-actions" data-single={isAutoCalculation}>
            <button className="reset-button" type="button" onClick={resetCalculator}>
              入力内容をリセット
            </button>
            {!isAutoCalculation && (
              <button className="simulate-button" type="button" onClick={simulate}>
                シミュレートする
              </button>
            )}
          </div>

          {resetSnapshot && (
            <div
              className="nisa-reset-undo"
              role="group"
              aria-label="リセットの取り消し"
            >
              <strong>入力内容をリセットしました。</strong>
              <button type="button" onClick={restoreReset}>元に戻す</button>
            </div>
          )}
        </div>

        <div
          className="calculator-results simulation-result-anchor"
          ref={resultsRef}
          aria-live="polite"
          tabIndex={-1}
        >
          <div className="simulator-results-heading">
            <div><p>RESULT</p><h3>概算結果</h3></div>
            <div className="nisa-calculation-assumption">
              <span>毎月末に積み立てる前提で試算</span>
              <InfoTooltip
                id="nisa-effective-monthly-rate-tooltip"
                label="計算方法の説明"
              >
                入力した年利を実効月次利率へ換算して計算しています。
              </InfoTooltip>
            </div>
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
                    <ResultCard label={getNisaPrincipalLabel(displayedRecord!.input)} value={formatYen(displayedResult.principal)} help="初期投資額と毎月積立額の合計" />
                    <ResultCard className="result-card--gain" label="運用収益" value={formatYen(displayedResult.gain)} help="将来資産額－元本" />
                  </>
                )}

                {displayedResult.mode === 'required-contribution' && (
                  <>
                    <ResultCard className="emphasis-result result-card--future" label="必要な毎月積立額" value={formatYen(displayedResult.monthlyContribution)} help="目標額を下回らないよう1円単位で切り上げ" />
                    <ResultCard label="年間換算額" value={formatYen(displayedResult.allowance.annualContribution)} help="必要な毎月積立額×12か月" />
                    <ResultCard label="目標額" value={formatYen(displayedResult.targetAmount!)} help="入力した目標額" />
                    <ResultCard label="投資元本" value={formatYen(displayedResult.principal)} help="切り上げ後の毎月積立額×積立月数" />
                  </>
                )}

                {displayedResult.mode === 'required-months' && (
                  <>
                    <ResultCard className="emphasis-result result-card--future" label="必要積立期間" value={formatMonths(displayedResult.months)} help={`${displayedResult.months.toLocaleString('ja-JP')}か月（1か月単位で切り上げ）`} />
                    <ResultCard label="目標額" value={formatYen(displayedResult.targetAmount!)} help="入力した目標額" />
                    <ResultCard label="毎月積立額" value={formatYen(displayedResult.monthlyContribution)} help="入力した毎月積立額" />
                    <ResultCard label="投資元本" value={formatYen(displayedResult.principal)} help="毎月積立額×必要月数" />
                  </>
                )}

                {displayedResult.inflationAdjustedValue !== null && (
                  <ResultCard className="nisa-inflation-card" label="インフレ調整後価値" value={formatYen(displayedResult.inflationAdjustedValue)} help="入力した想定インフレ率による現在価値の目安" />
                )}

              </div>

              <NisaAllowancePanel assessment={displayedResult.allowance} />
              <NisaTaxFreeInformation />
            </>
          ) : (
            <div className="nisa-result-empty">
              <strong>{MODE_OPTIONS.find((option) => option.mode === mode)?.label}</strong>
              <p>
                {isAutoCalculation
                  ? '有効な条件がそろうと概算結果を表示します。'
                  : '条件を入力して「シミュレートする」を押してください。'}
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
                    <span><i />積立元本</span><span><i />運用収益</span><span><i />将来資産額</span>
                  </div>
                  <div className="nisa-area-graph" aria-label="元本と運用益を含む資産推移の概算グラフ">
                    <div className="nisa-area-graph__canvas">
                      <div className="nisa-area-graph__y-axis" aria-hidden="true">
                        {assetAreaGraph.yAxisValues.map((value, index) => (
                          <span key={`${index}-${value}`}>{formatGraphAxisYen(value)}</span>
                        ))}
                      </div>
                      <div className="nisa-area-graph__plot">
                        <svg viewBox="0 0 600 200" role="img" aria-hidden="true" preserveAspectRatio="none">
                          <g className="nisa-area-graph__grid">
                            <line x1="0" y1="30" x2="600" y2="30" />
                            <line x1="0" y1="67.5" x2="600" y2="67.5" />
                            <line x1="0" y1="105" x2="600" y2="105" />
                            <line x1="0" y1="142.5" x2="600" y2="142.5" />
                            <line x1="0" y1="180" x2="600" y2="180" />
                          </g>
                          <polygon className="nisa-area-graph__principal" points={assetAreaGraph.principalArea} />
                          <polygon className="nisa-area-graph__gain" points={assetAreaGraph.gainArea} />
                          <polyline className="nisa-area-graph__total" points={assetAreaGraph.totalLine} />
                        </svg>
                        <div
                          className="nisa-area-graph__labels"
                          aria-hidden="true"
                          style={{
                            gridTemplateColumns:
                              `repeat(${assetTrajectory.length}, minmax(0, 1fr))`,
                          }}
                        >
                          {assetTrajectory.map((point) => (
                            <span key={point.months}>{point.label}</span>
                          ))}
                        </div>
                        <strong>{formatYen(displayedResult.futureValue)}</strong>
                      </div>
                    </div>
                  </div>
                  <p className="nisa-trajectory-summary">
                    最終時点は{formatMonths(displayedResult.months)}です。
                    積立元本{formatYen(displayedResult.principal)}に対し、
                    運用収益は{formatYen(displayedResult.gain)}、
                    将来資産額は{formatYen(displayedResult.futureValue)}の概算です。
                    {displayedResult.gain < 0 && (
                      <strong> 運用収益はマイナスで、元本を下回る試算です。</strong>
                    )}
                  </p>
                  <div
                    className="nisa-trajectory-table-wrap"
                    tabIndex={0}
                    role="region"
                    aria-label="資産推移の主要時点表"
                  >
                    <table className="nisa-trajectory-table">
                      <caption>資産推移の主要時点（概算）</caption>
                      <thead>
                        <tr>
                          <th scope="col">時点</th>
                          <th scope="col">積立元本</th>
                          <th scope="col">運用収益</th>
                          <th scope="col">将来資産額</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assetTrajectory.map((point) => (
                          <tr key={point.months}>
                            <th scope="row">{point.label}</th>
                            <td>{formatYen(point.principal)}</td>
                            <td>{formatYen(point.gain)}</td>
                            <td>{formatYen(point.futureValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

          {mode === 'future-value' && isScenarioComparisonEnabled && (
            <NisaScenarioComparisonPanel
              comparison={displayedScenarioComparison}
              graphData={scenarioGraphData}
            />
          )}
        </div>
      </div>

      {consultationRecord && (
        <section
          className="nisa-consultation-summary"
          aria-labelledby="nisa-consultation-summary-title"
        >
          <header className="nisa-consultation-summary__heading">
            <div>
              <p>CONSULTATION SUMMARY</p>
              <h3 id="nisa-consultation-summary-title">相談用サマリー</h3>
              <span>
                金融機関やFPへの相談時に、入力条件と概算結果を確認するための資料です。
              </span>
            </div>
            <div className="nisa-consultation-summary__actions">
              <button type="button" onClick={copyConsultationSummary}>
                相談用サマリーをコピー
              </button>
              <button type="button" onClick={printConsultationSummary}>
                印刷する
              </button>
            </div>
          </header>

          {summaryActionStatus && (
            <p
              className="nisa-consultation-summary__status"
              data-tone={summaryActionStatus === 'copied' ? 'success' : 'error'}
              role="status"
              aria-live="polite"
            >
              {summaryActionStatus === 'copied'
                ? '相談用サマリーをコピーしました。'
                : 'コピーできませんでした。もう一度お試しください。'}
            </p>
          )}

          <NisaConsultationSummaryContent record={consultationRecord} />
        </section>
      )}

      <p className="calculator-note">
        一定の利回りで毎月末に積み立てる想定の概算であり、将来の運用成果を保証するものではありません。
      </p>
    </section>
  )
}

const NisaConsultationSummaryContent = ({
  record,
}: {
  record: NisaConsultationSummaryRecord
}) => {
  const { input, result } = record
  const allowanceRelation = getNisaAllowanceRelation(result.allowance)

  return (
    <div
      className="nisa-consultation-summary__content"
      aria-label="相談用サマリー本文"
    >
      <header className="nisa-consultation-summary__document-heading">
        <p>沖縄マネーガイド</p>
        <h4>NISAシミュレーター 相談用サマリー</h4>
        <span>
          入力条件と概算結果を整理した、金融機関・FPへの相談用資料です。
        </span>
      </header>

      <section className="nisa-consultation-summary__section">
        <h5>入力条件</h5>
        <dl>
          <div><dt>計算モード</dt><dd>{getNisaModeLabel(input.mode)}</dd></div>
          {input.monthlyContribution !== null && (
            <div><dt>毎月積立額</dt><dd>{formatYen(input.monthlyContribution)}</dd></div>
          )}
          {input.targetAmount !== null && (
            <div><dt>目標額</dt><dd>{formatYen(input.targetAmount)}</dd></div>
          )}
          <div><dt>想定利回り</dt><dd>{input.annualRatePercent}%</dd></div>
          {input.inputMonths !== null && (
            <div>
              <dt>積立期間</dt>
              <dd>{formatMonths(input.inputMonths)}（{input.inputMonths.toLocaleString('ja-JP')}か月）</dd>
            </div>
          )}
          {input.inflationRatePercent !== null && (
            <div><dt>想定インフレ率</dt><dd>{input.inflationRatePercent}%</dd></div>
          )}
          {input.mode === 'future-value' && input.initialInvestment !== null && (
            <div><dt>初期投資額</dt><dd>{formatYen(input.initialInvestment)}</dd></div>
          )}
          {input.mode === 'future-value' && (
            <div>
              <dt>シナリオ比較</dt>
              <dd>{input.scenarioComparisonEnabled ? 'ON' : 'OFF'}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="nisa-consultation-summary__section">
        <h5>概算結果</h5>
        <dl>
          {input.mode === 'future-value' && (
            <>
              <div><dt>将来資産額</dt><dd>{formatYen(result.futureValue)}</dd></div>
              <div><dt>{getNisaPrincipalLabel(input)}</dt><dd>{formatYen(result.principal)}</dd></div>
              <div><dt>運用収益</dt><dd>{formatYen(result.gain)}</dd></div>
              {result.inflationAdjustedValue !== null && (
                <div><dt>インフレ調整後価値</dt><dd>{formatYen(result.inflationAdjustedValue)}</dd></div>
              )}
            </>
          )}
          {input.mode === 'required-contribution' && (
            <>
              <div><dt>必要な毎月積立額</dt><dd>{formatYen(result.monthlyContribution)}</dd></div>
              <div><dt>年間換算額</dt><dd>{formatYen(result.allowance.annualContribution)}</dd></div>
              <div><dt>投資元本</dt><dd>{formatYen(result.principal)}</dd></div>
              <div><dt>目標額</dt><dd>{formatYen(result.targetAmount ?? 0)}</dd></div>
            </>
          )}
          {input.mode === 'required-months' && (
            <>
              <div><dt>必要期間</dt><dd>{formatMonths(result.months)}</dd></div>
              <div><dt>必要月数</dt><dd>{result.months.toLocaleString('ja-JP')}か月</dd></div>
              <div><dt>毎月積立額</dt><dd>{formatYen(result.monthlyContribution)}</dd></div>
              <div><dt>投資元本</dt><dd>{formatYen(result.principal)}</dd></div>
              <div><dt>目標額</dt><dd>{formatYen(result.targetAmount ?? 0)}</dd></div>
            </>
          )}
        </dl>
      </section>

      {result.scenarioComparison && (
        <section className="nisa-consultation-summary__section nisa-consultation-summary__section--scenarios">
          <h5>シナリオ比較</h5>
          <div className="nisa-consultation-scenario-grid">
            {getNisaScenarioResults(result.scenarioComparison).map((scenario) => (
              <article key={scenario.id} data-scenario={scenario.id}>
                <h6>{scenario.label}</h6>
                <dl>
                  <div><dt>想定利回り</dt><dd>{scenario.annualRatePercent}%</dd></div>
                  <div><dt>将来資産額</dt><dd>{formatYen(scenario.futureValue)}</dd></div>
                  <div><dt>運用収益</dt><dd>{formatYen(scenario.gain)}</dd></div>
                  {scenario.inflationAdjustedValue !== null && (
                    <div>
                      <dt>インフレ調整後価値</dt>
                      <dd>{formatYen(scenario.inflationAdjustedValue)}</dd>
                    </div>
                  )}
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="nisa-consultation-summary__section">
        <h5>NISA枠との関係</h5>
        <dl>
          <div><dt>年間換算額</dt><dd>{formatYen(result.allowance.annualContribution)}</dd></div>
          <div><dt>NISA枠判定対象の積立元本</dt><dd>{formatYen(result.allowance.formalPrincipal)}</dd></div>
          <div><dt>120万円との関係</dt><dd>{allowanceRelation.annualTsumitate}</dd></div>
          <div><dt>360万円との関係</dt><dd>{allowanceRelation.annualCombined}</dd></div>
          <div><dt>1,800万円との関係</dt><dd>{allowanceRelation.lifetime}</dd></div>
        </dl>
        <p className="nisa-consultation-summary__supplement">
          初期投資額はNISA枠判定に含めていません。
          成長投資枠へ自動配分していません。実際の利用可能枠は金融機関等でご確認ください。
        </p>
      </section>

      <section className="nisa-consultation-summary__section">
        <h5>未考慮事項</h5>
        <ul>
          {NISA_UNCONSIDERED_ITEMS.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="nisa-consultation-summary__section">
        <h5>金融機関・FPへ確認する項目</h5>
        <ul>
          {NISA_CONFIRMATION_ITEMS.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="nisa-consultation-summary__section">
        <h5>一次資料</h5>
        <ul className="nisa-primary-source-list">
          {NISA_PRIMARY_SOURCES.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${source.label}を新しいタブで開く`}
              >
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="nisa-consultation-summary__notice">
        本サマリーは一定の利回りを仮定した概算です。
        実際の運用成果や利用可能なNISA枠を保証するものではありません。
      </p>
    </div>
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

const NisaScenarioComparisonPanel = ({
  comparison,
  graphData,
}: {
  comparison: NisaScenarioComparison | null
  graphData: ReturnType<typeof createScenarioGraphData> | null
}) => (
  <section
    className="nisa-scenario-comparison"
    aria-labelledby="nisa-scenario-comparison-title"
  >
    <div className="simulator-subheading">
      <div>
        <p>SCENARIO COMPARISON</p>
        <h3 id="nisa-scenario-comparison-title">シナリオ比較</h3>
      </div>
      <span>利回りだけを変更</span>
    </div>

    {comparison && graphData ? (
      <>
        <div className="nisa-scenario-result-grid">
          {getNisaScenarioResults(comparison).map((scenario) => (
            <article
              key={scenario.id}
              className="nisa-scenario-result-card"
              data-scenario={scenario.id}
            >
              <div className="nisa-scenario-result-card__heading">
                <strong>{scenario.label}</strong>
                {scenario.id === 'base' && <span>基準</span>}
              </div>
              <dl>
                <div>
                  <dt>想定利回り</dt>
                  <dd>{scenario.annualRatePercent}%</dd>
                </div>
                <div>
                  <dt>将来資産額</dt>
                  <dd>{formatYen(scenario.futureValue)}</dd>
                </div>
                <div>
                  <dt>運用収益</dt>
                  <dd>{formatYen(scenario.gain)}</dd>
                </div>
                {scenario.inflationAdjustedValue !== null && (
                  <div>
                    <dt>インフレ調整後価値</dt>
                    <dd>{formatYen(scenario.inflationAdjustedValue)}</dd>
                  </div>
                )}
              </dl>
            </article>
          ))}
        </div>

        <div className="nisa-scenario-chart" aria-label="低位・基準・高位シナリオの資産推移比較グラフ">
          <div className="nisa-scenario-chart__legend">
            {getNisaScenarioResults(comparison).map((scenario) => (
              <span key={scenario.id} data-scenario={scenario.id}>
                <i aria-hidden="true" />{scenario.label}
              </span>
            ))}
          </div>
          <div className="nisa-scenario-chart__canvas">
            <div className="nisa-scenario-chart__y-axis" aria-hidden="true">
              {graphData.yAxisValues.map((value, index) => (
                <span key={`${index}-${value}`}>{formatGraphAxisYen(value)}</span>
              ))}
            </div>
            <div className="nisa-scenario-chart__plot">
              <svg viewBox="0 0 600 200" aria-hidden="true" preserveAspectRatio="none">
                <g className="nisa-scenario-chart__grid">
                  <line x1="0" y1="30" x2="600" y2="30" />
                  <line x1="0" y1="67.5" x2="600" y2="67.5" />
                  <line x1="0" y1="105" x2="600" y2="105" />
                  <line x1="0" y1="142.5" x2="600" y2="142.5" />
                  <line x1="0" y1="180" x2="600" y2="180" />
                </g>
                {graphData.lines.map((line) => (
                  <polyline
                    key={line.id}
                    className="nisa-scenario-chart__line"
                    data-scenario={line.id}
                    points={line.points}
                  />
                ))}
              </svg>
              <div
                className="nisa-scenario-chart__labels"
                aria-hidden="true"
                style={{
                  gridTemplateColumns:
                    `repeat(${graphData.xAxisLabels.length}, minmax(0, 1fr))`,
                }}
              >
                {graphData.xAxisLabels.map((point) => (
                  <span key={point.months}>{point.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="nisa-scenario-table-wrap"
          role="region"
          aria-label="シナリオ比較結果表"
          tabIndex={0}
        >
          <table className="nisa-scenario-table">
            <caption>低位・基準・高位シナリオの最終結果（概算）</caption>
            <thead>
              <tr>
                <th scope="col">シナリオ</th>
                <th scope="col">想定利回り</th>
                <th scope="col">将来資産額</th>
                <th scope="col">運用収益</th>
                <th scope="col">インフレ調整後価値</th>
              </tr>
            </thead>
            <tbody>
              {getNisaScenarioResults(comparison).map((scenario) => (
                <tr key={scenario.id}>
                  <th scope="row">{scenario.label}</th>
                  <td>{scenario.annualRatePercent}%</td>
                  <td>{formatYen(scenario.futureValue)}</td>
                  <td>{formatYen(scenario.gain)}</td>
                  <td>
                    {scenario.inflationAdjustedValue === null
                      ? '―'
                      : formatYen(scenario.inflationAdjustedValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ) : (
      <div className="nisa-scenario-comparison__empty">
        低位・基準・高位の利回りと共通条件を入力して計算すると、比較結果を表示します。
      </div>
    )}

    <p className="nisa-scenario-comparison__notice">
      各シナリオは、入力した利回りが積立期間中継続すると仮定した概算です。
      将来の運用成果を予測・保証するものではありません。
    </p>
  </section>
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
      <div><span>NISA枠判定対象の積立元本</span><strong>{formatYen(assessment.formalPrincipal)}</strong></div>
    </div>
    <p className="nisa-allowance-panel__initial-note">
      初期投資額はNISA枠判定に含めていません。
    </p>
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

const NisaTaxFreeInformation = () => (
  <aside className="nisa-tax-free-information" aria-labelledby="nisa-tax-free-information-title">
    <div>
      <p>NISA TAX INFORMATION</p>
      <h3 id="nisa-tax-free-information-title">NISAの非課税効果について</h3>
    </div>
    <strong>別途確認</strong>
    <p>
      運用益に対する実際の非課税効果は、売却時期や課税関係などによって異なるため、
      本シミュレーターでは個別金額を算定していません。
    </p>
  </aside>
)

export default NisaCalculator
