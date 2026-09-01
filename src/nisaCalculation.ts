export const NISA_INPUT_LIMITS = {
  monthlyContribution: { min: 1, max: 10_000_000 },
  targetAmount: { min: 1, max: 1_000_000_000 },
  annualRatePercent: { min: -20, max: 20 },
  months: { min: 1, max: 960 },
  inflationRatePercent: { min: 0, max: 10 },
} as const

export type NisaCalculationMode =
  | 'future-value'
  | 'required-contribution'
  | 'required-months'

export type NisaValidationField =
  | 'monthlyContribution'
  | 'targetAmount'
  | 'annualRatePercent'
  | 'months'
  | 'inflationRatePercent'

export type NisaValidationIssue = {
  field: NisaValidationField
  code:
    | 'required'
    | 'not-finite'
    | 'out-of-range'
    | 'not-integer'
    | 'too-many-decimals'
}

export type NisaValidationInput = {
  mode: NisaCalculationMode
  monthlyContribution?: number
  targetAmount?: number
  annualRatePercent?: number
  months?: number
  inflationRatePercent?: number
}

export type NisaFutureValueInput = {
  monthlyContribution: number
  annualRatePercent: number
  months: number
  inflationRatePercent?: number
}

export type NisaFutureValueResult = {
  monthlyRate: number
  months: number
  futureValue: number
  principal: number
  gain: number
  inflationAdjustedValue: number | null
}

export type NisaRequiredContributionInput = {
  targetAmount: number
  annualRatePercent: number
  months: number
  inflationRatePercent?: number
}

export type NisaRequiredContributionResult =
  NisaFutureValueResult & {
    exactMonthlyContribution: number
    requiredMonthlyContribution: number
  }

export type NisaRequiredMonthsInput = {
  targetAmount: number
  monthlyContribution: number
  annualRatePercent: number
  inflationRatePercent?: number
}

export type NisaRequiredMonthsReachability =
  | {
      status: 'reachable'
      maximumReachableValue: null
    }
  | {
      status: 'unreachable'
      maximumReachableValue: number
      reason: 'negative-return-limit'
    }

export type NisaRequiredMonthsResult =
  | ({
      status: 'reachable'
      requiredMonths: number
      years: number
      remainingMonths: number
      withinSupportedPeriod: boolean
    } & NisaFutureValueResult)
  | {
      status: 'unreachable'
      maximumReachableValue: number
      reason: 'negative-return-limit'
    }

export type NisaCurrentFutureValueInput =
  NisaFutureValueInput & {
    initialInvestment: number
  }

const hasAtMostTwoDecimalPlaces = (value: number) => {
  const scaled = value * 100
  const tolerance = Number.EPSILON * Math.max(1, Math.abs(scaled)) * 8

  return Math.abs(scaled - Math.round(scaled)) <= tolerance
}

const addRequiredIssue = (
  issues: NisaValidationIssue[],
  field: NisaValidationField,
  value: number | undefined,
) => {
  if (value === undefined) {
    issues.push({ field, code: 'required' })
    return false
  }

  if (!Number.isFinite(value)) {
    issues.push({ field, code: 'not-finite' })
    return false
  }

  return true
}

const addRangeIssue = (
  issues: NisaValidationIssue[],
  field: NisaValidationField,
  value: number,
  min: number,
  max: number,
) => {
  if (value < min || value > max) {
    issues.push({ field, code: 'out-of-range' })
    return false
  }

  return true
}

export const validateNisaCalculationInput = (
  input: NisaValidationInput,
): NisaValidationIssue[] => {
  const issues: NisaValidationIssue[] = []
  const needsMonthlyContribution =
    input.mode === 'future-value' || input.mode === 'required-months'
  const needsTargetAmount = input.mode !== 'future-value'
  const needsMonths = input.mode !== 'required-months'

  if (
    needsMonthlyContribution &&
    addRequiredIssue(
      issues,
      'monthlyContribution',
      input.monthlyContribution,
    )
  ) {
    addRangeIssue(
      issues,
      'monthlyContribution',
      input.monthlyContribution!,
      NISA_INPUT_LIMITS.monthlyContribution.min,
      NISA_INPUT_LIMITS.monthlyContribution.max,
    )
  }

  if (
    needsTargetAmount &&
    addRequiredIssue(issues, 'targetAmount', input.targetAmount)
  ) {
    addRangeIssue(
      issues,
      'targetAmount',
      input.targetAmount!,
      NISA_INPUT_LIMITS.targetAmount.min,
      NISA_INPUT_LIMITS.targetAmount.max,
    )
  }

  if (
    addRequiredIssue(
      issues,
      'annualRatePercent',
      input.annualRatePercent,
    )
  ) {
    const rateIsInRange = addRangeIssue(
      issues,
      'annualRatePercent',
      input.annualRatePercent!,
      NISA_INPUT_LIMITS.annualRatePercent.min,
      NISA_INPUT_LIMITS.annualRatePercent.max,
    )

    if (
      rateIsInRange &&
      !hasAtMostTwoDecimalPlaces(input.annualRatePercent!)
    ) {
      issues.push({
        field: 'annualRatePercent',
        code: 'too-many-decimals',
      })
    }
  }

  if (needsMonths && addRequiredIssue(issues, 'months', input.months)) {
    if (!Number.isInteger(input.months)) {
      issues.push({ field: 'months', code: 'not-integer' })
    } else {
      addRangeIssue(
        issues,
        'months',
        input.months!,
        NISA_INPUT_LIMITS.months.min,
        NISA_INPUT_LIMITS.months.max,
      )
    }
  }

  if (input.inflationRatePercent !== undefined) {
    if (!Number.isFinite(input.inflationRatePercent)) {
      issues.push({ field: 'inflationRatePercent', code: 'not-finite' })
    } else {
      const inflationIsInRange = addRangeIssue(
        issues,
        'inflationRatePercent',
        input.inflationRatePercent,
        NISA_INPUT_LIMITS.inflationRatePercent.min,
        NISA_INPUT_LIMITS.inflationRatePercent.max,
      )

      if (
        inflationIsInRange &&
        !hasAtMostTwoDecimalPlaces(input.inflationRatePercent)
      ) {
        issues.push({
          field: 'inflationRatePercent',
          code: 'too-many-decimals',
        })
      }
    }
  }

  return issues
}

const assertValidInput = (input: NisaValidationInput) => {
  const issues = validateNisaCalculationInput(input)

  if (issues.length > 0) {
    throw new RangeError(
      `Invalid NISA calculation input: ${issues
        .map(({ field, code }) => `${field}:${code}`)
        .join(', ')}`,
    )
  }
}

const ensureFiniteResult = (name: string, value: number) => {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} could not be calculated`)
  }

  return value
}

export const annualRateToEffectiveMonthlyRate = (
  annualRatePercent: number,
) => {
  assertValidInput({
    mode: 'required-months',
    monthlyContribution: 1,
    targetAmount: 1,
    annualRatePercent,
  })

  const annualRate = annualRatePercent / 100

  return ensureFiniteResult(
    'effectiveMonthlyRate',
    Math.expm1(Math.log1p(annualRate) / 12),
  )
}

const calculateAnnuityFactor = (
  monthlyRate: number,
  months: number,
) => {
  if (monthlyRate === 0) {
    return months
  }

  return Math.expm1(months * Math.log1p(monthlyRate)) / monthlyRate
}

const calculateFutureValueFromMonthlyRate = (
  monthlyContribution: number,
  monthlyRate: number,
  months: number,
) => ensureFiniteResult(
  'futureValue',
  monthlyContribution * calculateAnnuityFactor(monthlyRate, months),
)

export const calculatePrincipal = (
  monthlyContribution: number,
  months: number,
) => ensureFiniteResult(
  'principal',
  monthlyContribution * months,
)

export const calculateGain = (
  futureValue: number,
  principal: number,
) => ensureFiniteResult('gain', futureValue - principal)

export const calculateInflationAdjustedValue = (
  futureValue: number,
  months: number,
  inflationRatePercent: number,
) => {
  assertValidInput({
    mode: 'future-value',
    monthlyContribution: 1,
    annualRatePercent: 0,
    months,
    inflationRatePercent,
  })

  return ensureFiniteResult(
    'inflationAdjustedValue',
    futureValue /
      Math.pow(1 + inflationRatePercent / 100, months / 12),
  )
}

export const calculateFutureValue = (
  input: NisaFutureValueInput,
): NisaFutureValueResult => {
  assertValidInput({ mode: 'future-value', ...input })

  const monthlyRate = annualRateToEffectiveMonthlyRate(
    input.annualRatePercent,
  )
  const futureValue = calculateFutureValueFromMonthlyRate(
    input.monthlyContribution,
    monthlyRate,
    input.months,
  )
  const principal = calculatePrincipal(
    input.monthlyContribution,
    input.months,
  )

  return {
    monthlyRate,
    months: input.months,
    futureValue,
    principal,
    gain: calculateGain(futureValue, principal),
    inflationAdjustedValue:
      input.inflationRatePercent === undefined
        ? null
        : calculateInflationAdjustedValue(
            futureValue,
            input.months,
            input.inflationRatePercent,
          ),
  }
}

const integerTolerance = (value: number) =>
  Number.EPSILON * Math.max(1, Math.abs(value)) * 16

const ceilWithFloatingPointTolerance = (value: number) => {
  const nearestInteger = Math.round(value)

  if (Math.abs(value - nearestInteger) <= integerTolerance(value)) {
    return nearestInteger
  }

  return Math.ceil(value)
}

export const calculateRequiredMonthlyContribution = (
  input: NisaRequiredContributionInput,
): NisaRequiredContributionResult => {
  assertValidInput({ mode: 'required-contribution', ...input })

  const monthlyRate = annualRateToEffectiveMonthlyRate(
    input.annualRatePercent,
  )
  const annuityFactor = calculateAnnuityFactor(monthlyRate, input.months)
  const exactMonthlyContribution = ensureFiniteResult(
    'requiredMonthlyContribution',
    input.targetAmount / annuityFactor,
  )
  let requiredMonthlyContribution = ceilWithFloatingPointTolerance(
    exactMonthlyContribution,
  )
  let futureValue = calculateFutureValueFromMonthlyRate(
    requiredMonthlyContribution,
    monthlyRate,
    input.months,
  )

  if (
    futureValue + integerTolerance(input.targetAmount) <
    input.targetAmount
  ) {
    requiredMonthlyContribution += 1
    futureValue = calculateFutureValueFromMonthlyRate(
      requiredMonthlyContribution,
      monthlyRate,
      input.months,
    )
  }

  const principal = calculatePrincipal(
    requiredMonthlyContribution,
    input.months,
  )

  return {
    exactMonthlyContribution,
    requiredMonthlyContribution,
    monthlyRate,
    months: input.months,
    futureValue,
    principal,
    gain: calculateGain(futureValue, principal),
    inflationAdjustedValue:
      input.inflationRatePercent === undefined
        ? null
        : calculateInflationAdjustedValue(
            futureValue,
            input.months,
            input.inflationRatePercent,
          ),
  }
}

export const assessRequiredInvestmentMonthsReachability = (
  input: Omit<NisaRequiredMonthsInput, 'inflationRatePercent'>,
): NisaRequiredMonthsReachability => {
  assertValidInput({ mode: 'required-months', ...input })

  const monthlyRate = annualRateToEffectiveMonthlyRate(
    input.annualRatePercent,
  )

  if (monthlyRate >= 0) {
    return { status: 'reachable', maximumReachableValue: null }
  }

  const maximumReachableValue = ensureFiniteResult(
    'maximumReachableValue',
    input.monthlyContribution / -monthlyRate,
  )

  if (
    input.targetAmount >=
    maximumReachableValue - integerTolerance(maximumReachableValue)
  ) {
    return {
      status: 'unreachable',
      maximumReachableValue,
      reason: 'negative-return-limit',
    }
  }

  return { status: 'reachable', maximumReachableValue: null }
}

export const splitInvestmentMonths = (months: number) => {
  if (!Number.isInteger(months) || months < 0) {
    throw new RangeError('months must be a non-negative integer')
  }

  return {
    years: Math.floor(months / 12),
    remainingMonths: months % 12,
  }
}

export const calculateRequiredInvestmentMonths = (
  input: NisaRequiredMonthsInput,
): NisaRequiredMonthsResult => {
  assertValidInput({ mode: 'required-months', ...input })

  const reachability = assessRequiredInvestmentMonthsReachability(input)

  if (reachability.status === 'unreachable') {
    return reachability
  }

  const monthlyRate = annualRateToEffectiveMonthlyRate(
    input.annualRatePercent,
  )
  const exactMonths = monthlyRate === 0
    ? input.targetAmount / input.monthlyContribution
    : Math.log1p(
        input.targetAmount * monthlyRate /
          input.monthlyContribution,
      ) / Math.log1p(monthlyRate)

  let requiredMonths = Math.max(
    1,
    ceilWithFloatingPointTolerance(
      ensureFiniteResult('requiredMonths', exactMonths),
    ),
  )
  let futureValue = calculateFutureValueFromMonthlyRate(
    input.monthlyContribution,
    monthlyRate,
    requiredMonths,
  )

  if (
    futureValue + integerTolerance(input.targetAmount) <
    input.targetAmount
  ) {
    requiredMonths += 1
    futureValue = calculateFutureValueFromMonthlyRate(
      input.monthlyContribution,
      monthlyRate,
      requiredMonths,
    )
  }

  const principal = calculatePrincipal(
    input.monthlyContribution,
    requiredMonths,
  )
  const { years, remainingMonths } = splitInvestmentMonths(requiredMonths)

  return {
    status: 'reachable',
    requiredMonths,
    years,
    remainingMonths,
    withinSupportedPeriod:
      requiredMonths <= NISA_INPUT_LIMITS.months.max,
    monthlyRate,
    months: requiredMonths,
    futureValue,
    principal,
    gain: calculateGain(futureValue, principal),
    inflationAdjustedValue:
      input.inflationRatePercent === undefined
        ? null
        : calculateInflationAdjustedValue(
            futureValue,
            requiredMonths,
            input.inflationRatePercent,
          ),
  }
}

export const calculateCurrentFutureValueWithInitialInvestment = (
  input: NisaCurrentFutureValueInput,
): NisaFutureValueResult => {
  if (
    !Number.isFinite(input.initialInvestment) ||
    input.initialInvestment < 0 ||
    !Number.isFinite(input.monthlyContribution) ||
    input.monthlyContribution < 0 ||
    input.monthlyContribution > NISA_INPUT_LIMITS.monthlyContribution.max ||
    (input.initialInvestment === 0 && input.monthlyContribution === 0)
  ) {
    throw new RangeError('Invalid current NISA future-value input')
  }

  assertValidInput({
    mode: 'future-value',
    monthlyContribution: Math.max(1, input.monthlyContribution),
    annualRatePercent: input.annualRatePercent,
    months: input.months,
    inflationRatePercent: input.inflationRatePercent,
  })

  const monthlyRate = annualRateToEffectiveMonthlyRate(
    input.annualRatePercent,
  )
  const contributionFutureValue = calculateFutureValueFromMonthlyRate(
    input.monthlyContribution,
    monthlyRate,
    input.months,
  )
  const initialFutureValue = ensureFiniteResult(
    'initialFutureValue',
    input.initialInvestment *
      Math.exp(input.months * Math.log1p(monthlyRate)),
  )
  const futureValue = initialFutureValue + contributionFutureValue
  const principal = input.initialInvestment +
    calculatePrincipal(input.monthlyContribution, input.months)

  return {
    monthlyRate,
    months: input.months,
    futureValue,
    principal,
    gain: calculateGain(futureValue, principal),
    inflationAdjustedValue:
      input.inflationRatePercent === undefined
        ? null
        : calculateInflationAdjustedValue(
            futureValue,
            input.months,
            input.inflationRatePercent,
          ),
  }
}

export const roundHalfUp = (value: number) => {
  const rounded = Math.sign(value) * Math.floor(
    Math.abs(value) + 0.5 + integerTolerance(value),
  )

  return Object.is(rounded, -0) ? 0 : rounded
}
