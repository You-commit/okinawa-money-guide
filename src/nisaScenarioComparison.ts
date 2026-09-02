import {
  NISA_INPUT_LIMITS,
  calculateCurrentFutureValueWithInitialInvestment,
  calculateNisaTrajectory,
  type NisaTrajectoryPoint,
} from './nisaCalculation'

export type NisaScenarioId = 'low' | 'base' | 'high'

export type NisaScenarioResult = {
  id: NisaScenarioId
  label: '低位' | '基準' | '高位'
  annualRatePercent: number
  futureValue: number
  principal: number
  gain: number
  inflationAdjustedValue: number | null
  trajectory: NisaTrajectoryPoint[]
}

export type NisaScenarioComparison = {
  low: NisaScenarioResult
  base: NisaScenarioResult
  high: NisaScenarioResult
}

export type NisaScenarioComparisonInput = {
  initialInvestment: number
  monthlyContribution: number
  months: number
  lowAnnualRatePercent: number
  baseAnnualRatePercent: number
  highAnnualRatePercent: number
  inflationRatePercent?: number
}

const assertScenarioRate = (value: number) => {
  if (
    !Number.isFinite(value) ||
    value < NISA_INPUT_LIMITS.annualRatePercent.min ||
    value > NISA_INPUT_LIMITS.annualRatePercent.max
  ) {
    throw new RangeError('Invalid NISA scenario rate')
  }
}

const calculateScenario = (
  id: NisaScenarioId,
  label: NisaScenarioResult['label'],
  annualRatePercent: number,
  input: NisaScenarioComparisonInput,
): NisaScenarioResult => {
  const calculationInput = {
    initialInvestment: input.initialInvestment,
    monthlyContribution: input.monthlyContribution,
    annualRatePercent,
    months: input.months,
    inflationRatePercent: input.inflationRatePercent,
  }
  const result = calculateCurrentFutureValueWithInitialInvestment(
    calculationInput,
  )

  return {
    id,
    label,
    annualRatePercent,
    futureValue: result.futureValue,
    principal: result.principal,
    gain: result.gain,
    inflationAdjustedValue: result.inflationAdjustedValue,
    trajectory: calculateNisaTrajectory(calculationInput),
  }
}

export const calculateNisaScenarioComparison = (
  input: NisaScenarioComparisonInput,
): NisaScenarioComparison => {
  assertScenarioRate(input.lowAnnualRatePercent)
  assertScenarioRate(input.baseAnnualRatePercent)
  assertScenarioRate(input.highAnnualRatePercent)

  if (
    input.lowAnnualRatePercent > input.baseAnnualRatePercent ||
    input.baseAnnualRatePercent > input.highAnnualRatePercent
  ) {
    throw new RangeError('NISA scenario rates must be ordered low to high')
  }

  return {
    low: calculateScenario('low', '低位', input.lowAnnualRatePercent, input),
    base: calculateScenario(
      'base',
      '基準',
      input.baseAnnualRatePercent,
      input,
    ),
    high: calculateScenario(
      'high',
      '高位',
      input.highAnnualRatePercent,
      input,
    ),
  }
}

export const getNisaScenarioResults = (
  comparison: NisaScenarioComparison,
) => [comparison.low, comparison.base, comparison.high]
