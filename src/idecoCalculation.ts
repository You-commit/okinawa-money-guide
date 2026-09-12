import {
  getIdecoContributionLimit,
  getIdecoParticipantLabel,
  getIdecoRegimeLabel,
  type IdecoContributionLimit,
  type IdecoRuleInput,
  type IdecoValidationErrors,
  validateIdecoRuleInput,
} from './idecoRules'
import { taxRules2026 } from './taxRules/2026'

export type IdecoProgressiveIncomeTax = {
  enteredTaxableIncome: number
  taxableIncome: number
  marginalRate: number
  quickDeduction: number
  baseIncomeTax: number
  reconstructionSpecialIncomeTax: number
  defenseSpecialIncomeTax: number
  supplementaryIncomeTax: number
  totalIncomeTax: number
}

export type IdecoDetailedTaxResult = {
  taxableIncomeBeforeContribution: number
  idecoIncomeDeduction: number
  taxableIncomeAfterContribution: number
  before: IdecoProgressiveIncomeTax
  after: IdecoProgressiveIncomeTax
}

export type IdecoResult = {
  annualContribution: number
  totalContribution: number
  incomeTaxSaving: number
  residentTaxSaving: number
  annualTaxSaving: number
  totalTaxSaving: number
  detailedTax: IdecoDetailedTaxResult | null
  rounded: {
    annualContribution: number
    totalContribution: number
    incomeTaxSaving: number
    residentTaxSaving: number
    annualTaxSaving: number
    totalTaxSaving: number
  }
}

export type IdecoCalculationSuccess = {
  ok: true
  result: IdecoResult
  contributionLimit: IdecoContributionLimit
  regimeLabel: string
  participantLabel: string
}

export type IdecoCalculationFailure = {
  ok: false
  errors: IdecoValidationErrors
}

export type IdecoCalculationOutcome =
  | IdecoCalculationSuccess
  | IdecoCalculationFailure

export const roundHalfUp = (value: number) => {
  if (!Number.isFinite(value)) {
    return value
  }

  return value < 0
    ? Math.ceil(value - 0.5)
    : Math.floor(value + 0.5)
}

export const calculateAnnualIdecoContribution = (
  monthlyContribution: number,
  actualContributionMonths: number,
) => monthlyContribution * actualContributionMonths

export const calculateIdecoIncomeTaxSaving = (
  annualContribution: number,
  incomeTaxRate: number,
) => annualContribution * (incomeTaxRate / 100) * 1.021

export const calculateIdecoResidentTaxSaving = (
  annualContribution: number,
  residentTaxRate: number,
) => annualContribution * (residentTaxRate / 100)

const normalizeTaxableIncome = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return 0
  }

  return Math.floor(value / 1_000) * 1_000
}

export const calculateIdecoSupplementaryIncomeTax = (
  baseIncomeTax: number,
  effectiveDate: string,
) => {
  const validBaseIncomeTax = Number.isFinite(baseIncomeTax)
    ? Math.max(0, baseIncomeTax)
    : 0
  const from2027 = effectiveDate >= '2027-01-01'
  const defenseSpecialIncomeTax = from2027
    ? validBaseIncomeTax * 0.01
    : 0
  const reconstructionSpecialIncomeTax = validBaseIncomeTax * (
    from2027 ? 0.011 : 0.021
  )

  return {
    defenseSpecialIncomeTax,
    reconstructionSpecialIncomeTax,
    supplementaryIncomeTax:
      defenseSpecialIncomeTax + reconstructionSpecialIncomeTax,
  }
}

export const calculateProgressiveIncomeTax = (
  taxableIncome: number,
  effectiveDate: string,
): IdecoProgressiveIncomeTax => {
  const enteredTaxableIncome = Number.isFinite(taxableIncome)
    ? Math.max(0, taxableIncome)
    : 0
  const normalizedIncome = normalizeTaxableIncome(taxableIncome)
  const bracket = taxRules2026.incomeTaxBrackets.find(
    (item) =>
      item.upperLimit === null ||
      normalizedIncome <= item.upperLimit,
  )
  const marginalRate = normalizedIncome === 0
    ? 0
    : bracket?.rate ?? 0
  const quickDeduction = normalizedIncome === 0
    ? 0
    : bracket?.deduction ?? 0
  const baseIncomeTax = Math.max(
    0,
    normalizedIncome * marginalRate - quickDeduction,
  )
  const {
    defenseSpecialIncomeTax,
    reconstructionSpecialIncomeTax,
    supplementaryIncomeTax,
  } = calculateIdecoSupplementaryIncomeTax(
    baseIncomeTax,
    effectiveDate,
  )

  return {
    enteredTaxableIncome,
    taxableIncome: normalizedIncome,
    marginalRate,
    quickDeduction,
    baseIncomeTax,
    reconstructionSpecialIncomeTax,
    defenseSpecialIncomeTax,
    supplementaryIncomeTax,
    totalIncomeTax: baseIncomeTax + supplementaryIncomeTax,
  }
}

export const calculateDetailedIdecoTaxSaving = ({
  taxableIncomeBeforeContribution,
  annualContribution,
  residentTaxRate,
  effectiveDate,
}: {
  taxableIncomeBeforeContribution: number
  annualContribution: number
  residentTaxRate: number
  effectiveDate: string
}) => {
  const taxableIncomeAfterContribution = Math.max(
    0,
    taxableIncomeBeforeContribution - annualContribution,
  )
  const before = calculateProgressiveIncomeTax(
    taxableIncomeBeforeContribution,
    effectiveDate,
  )
  const after = calculateProgressiveIncomeTax(
    taxableIncomeAfterContribution,
    effectiveDate,
  )
  const incomeTaxSaving = Math.max(
    0,
    before.totalIncomeTax - after.totalIncomeTax,
  )
  const residentTaxBefore =
    taxableIncomeBeforeContribution * (residentTaxRate / 100)
  const residentTaxAfter =
    taxableIncomeAfterContribution * (residentTaxRate / 100)
  const residentTaxSaving = Math.max(
    0,
    residentTaxBefore - residentTaxAfter,
  )

  return {
    incomeTaxSaving,
    residentTaxSaving,
    detailedTax: {
      taxableIncomeBeforeContribution,
      idecoIncomeDeduction:
        taxableIncomeBeforeContribution - taxableIncomeAfterContribution,
      taxableIncomeAfterContribution,
      before,
      after,
    } satisfies IdecoDetailedTaxResult,
  }
}

export const calculateIdeco = (
  input: IdecoRuleInput,
): IdecoCalculationOutcome => {
  const errors = validateIdecoRuleInput(input)

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  const contributionLimit = getIdecoContributionLimit(input)

  if (
    !contributionLimit ||
    !input.participantCategory ||
    input.monthlyContribution === null ||
    input.actualContributionMonths === null ||
    input.residentTaxRate === null ||
    input.referenceYears === null ||
    (input.calculationMode !== 'detailed' &&
      input.incomeTaxRate === null) ||
    (input.calculationMode === 'detailed' &&
      input.taxableIncomeBeforeContribution === null)
  ) {
    return {
      ok: false,
      errors: {
        monthlyContribution:
          '計算条件を確認してください。',
      },
    }
  }

  const annualContribution =
    calculateAnnualIdecoContribution(
      input.monthlyContribution,
      input.actualContributionMonths,
    )
  const detailedCalculation = input.calculationMode === 'detailed'
    ? calculateDetailedIdecoTaxSaving({
      taxableIncomeBeforeContribution:
        input.taxableIncomeBeforeContribution ?? 0,
      annualContribution,
      residentTaxRate: input.residentTaxRate,
      effectiveDate: input.effectiveDate,
    })
    : null
  const incomeTaxSaving = detailedCalculation
    ? detailedCalculation.incomeTaxSaving
    : calculateIdecoIncomeTaxSaving(
      annualContribution,
      input.incomeTaxRate ?? 0,
    )
  const residentTaxSaving = detailedCalculation
    ? detailedCalculation.residentTaxSaving
    : calculateIdecoResidentTaxSaving(
      annualContribution,
      input.residentTaxRate,
    )
  const annualTaxSaving =
    incomeTaxSaving + residentTaxSaving
  const totalContribution =
    annualContribution * input.referenceYears
  const totalTaxSaving =
    annualTaxSaving * input.referenceYears
  const roundedIncomeTaxSaving = roundHalfUp(incomeTaxSaving)
  const roundedResidentTaxSaving = roundHalfUp(residentTaxSaving)

  return {
    ok: true,
    contributionLimit,
    regimeLabel: getIdecoRegimeLabel(
      contributionLimit.regime,
    ),
    participantLabel: getIdecoParticipantLabel(
      input.participantCategory,
    ),
    result: {
      annualContribution,
      totalContribution,
      incomeTaxSaving,
      residentTaxSaving,
      annualTaxSaving,
      totalTaxSaving,
      detailedTax: detailedCalculation?.detailedTax ?? null,
      rounded: {
        annualContribution: roundHalfUp(annualContribution),
        totalContribution: roundHalfUp(totalContribution),
        incomeTaxSaving: roundedIncomeTaxSaving,
        residentTaxSaving: roundedResidentTaxSaving,
        annualTaxSaving:
          roundedIncomeTaxSaving + roundedResidentTaxSaving,
        totalTaxSaving: roundHalfUp(totalTaxSaving),
      },
    },
  }
}
