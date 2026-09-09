import {
  getIdecoContributionLimit,
  getIdecoParticipantLabel,
  getIdecoRegimeLabel,
  type IdecoContributionLimit,
  type IdecoRuleInput,
  type IdecoValidationErrors,
  validateIdecoRuleInput,
} from './idecoRules'

export type IdecoResult = {
  annualContribution: number
  totalContribution: number
  incomeTaxSaving: number
  residentTaxSaving: number
  annualTaxSaving: number
  totalTaxSaving: number
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
    input.incomeTaxRate === null ||
    input.residentTaxRate === null ||
    input.referenceYears === null
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
  const incomeTaxSaving =
    calculateIdecoIncomeTaxSaving(
      annualContribution,
      input.incomeTaxRate,
    )
  const residentTaxSaving =
    calculateIdecoResidentTaxSaving(
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
