import { describe, expect, it } from 'vitest'
import {
  calculateAnnualIdecoContribution,
  calculateIdeco,
  calculateIdecoIncomeTaxSaving,
  calculateIdecoResidentTaxSaving,
  roundHalfUp,
} from './idecoCalculation'
import {
  getIdecoContributionLimit,
  getIdecoRegime,
  type IdecoParticipantCategory,
  type IdecoRuleInput,
  validateIdecoRuleInput,
} from './idecoRules'

const validInput = (
  overrides: Partial<IdecoRuleInput> = {},
): IdecoRuleInput => ({
  effectiveDate: '2026-11-30',
  participantCategory: 'category2-no-pension',
  relatedMonthlyContribution: null,
  monthlyContribution: 23_000,
  actualContributionMonths: 12,
  incomeTaxRate: 10,
  residentTaxRate: 10,
  referenceYears: 20,
  ...overrides,
})

describe('iDeCo formal contribution rules', () => {
  it('separates the regimes at 2026-12-01', () => {
    expect(getIdecoRegime('2026-11-30')).toBe('current')
    expect(getIdecoRegime('2026-12-01')).toBe('reformed')
  })

  it.each([
    [4_000, false],
    [5_000, true],
    [5_500, false],
    [6_000, true],
  ])('validates monthly contribution %i', (amount, valid) => {
    const errors = validateIdecoRuleInput(
      validInput({ monthlyContribution: amount }),
    )

    expect(!errors.monthlyContribution).toBe(valid)
  })

  it.each([
    [0, false],
    [1, true],
    [12, true],
    [13, false],
    [1.5, false],
  ])('validates actual contribution months %s', (months, valid) => {
    const errors = validateIdecoRuleInput(
      validInput({ actualContributionMonths: months }),
    )

    expect(!errors.actualContributionMonths).toBe(valid)
  })

  it.each<[
    IdecoParticipantCategory,
    string,
    number | null,
    number,
  ]>([
    ['category1', '2026-11-30', 0, 68_000],
    ['category2-no-pension', '2026-11-30', null, 23_000],
    ['category2-with-pension', '2026-11-30', 35_000, 20_000],
    ['category3', '2026-11-30', null, 23_000],
    ['category4', '2026-11-30', 8_000, 60_000],
    ['category1', '2026-12-01', 0, 75_000],
    ['category2-no-pension', '2026-12-01', null, 62_000],
    ['category2-with-pension', '2026-12-01', 12_000, 50_000],
    ['category3', '2026-12-01', null, 62_000],
    ['category4', '2026-12-01', 5_000, 70_000],
    ['category5', '2026-12-01', null, 62_000],
  ])(
    'calculates %s limit on %s',
    (participantCategory, effectiveDate, related, expected) => {
      expect(
        getIdecoContributionLimit(
          validInput({
            participantCategory,
            effectiveDate,
            relatedMonthlyContribution: related,
          }),
        )?.monthlyLimit,
      ).toBe(expected)
    },
  )

  it('rejects category 5 before the reform date', () => {
    const errors = validateIdecoRuleInput(
      validInput({ participantCategory: 'category5' }),
    )

    expect(errors.participantCategory).toContain('2026年12月1日')
  })

  it('requires the aggregation input only for relevant categories', () => {
    expect(
      validateIdecoRuleInput(
        validInput({
          participantCategory: 'category2-with-pension',
          monthlyContribution: 20_000,
        }),
      ).relatedMonthlyContribution,
    ).toBeTruthy()
    expect(
      validateIdecoRuleInput(
        validInput({
          participantCategory: 'category2-no-pension',
        }),
      ).relatedMonthlyContribution,
    ).toBeUndefined()
  })

  it('accepts the combined limit and rejects an excess', () => {
    const base = validInput({
      participantCategory: 'category2-with-pension',
      relatedMonthlyContribution: 35_000,
    })

    expect(
      validateIdecoRuleInput({
        ...base,
        monthlyContribution: 20_000,
      }).monthlyContribution,
    ).toBeUndefined()
    expect(
      validateIdecoRuleInput({
        ...base,
        monthlyContribution: 21_000,
      }).monthlyContribution,
    ).toContain('20,000円')
  })

  it('rounds a remaining combined allowance down to the 1,000-yen contribution step', () => {
    expect(
      getIdecoContributionLimit(
        validInput({
          participantCategory: 'category2-with-pension',
          relatedMonthlyContribution: 35_500,
        }),
      )?.monthlyLimit,
    ).toBe(19_000)
  })

  it('rejects a missing aggregation amount and a limit below the minimum', () => {
    expect(
      validateIdecoRuleInput(
        validInput({
          participantCategory: 'category1',
          relatedMonthlyContribution: null,
          monthlyContribution: 5_000,
        }),
      ).relatedMonthlyContribution,
    ).toBeTruthy()
    expect(
      validateIdecoRuleInput(
        validInput({
          participantCategory: 'category2-with-pension',
          relatedMonthlyContribution: 51_000,
          monthlyContribution: 5_000,
        }),
      ).monthlyContribution,
    ).toContain('5,000円未満')
  })

  it('keeps zero tax rates valid and rejects missing or invalid rates', () => {
    expect(
      validateIdecoRuleInput(
        validInput({ incomeTaxRate: 0, residentTaxRate: 0 }),
      ),
    ).toEqual({})
    expect(
      validateIdecoRuleInput(
        validInput({ incomeTaxRate: null }),
      ).incomeTaxRate,
    ).toBeTruthy()
    expect(
      validateIdecoRuleInput(
        validInput({ residentTaxRate: Number.NaN }),
      ).residentTaxRate,
    ).toBeTruthy()
  })
})

describe('iDeCo formal calculation', () => {
  it('uses monthly contribution times actual contribution months', () => {
    expect(calculateAnnualIdecoContribution(23_000, 7)).toBe(161_000)
  })

  it('uses the 1.021 special income tax factor without interim rounding', () => {
    expect(calculateIdecoIncomeTaxSaving(276_000, 10)).toBe(28_179.6)
    expect(calculateIdecoResidentTaxSaving(276_000, 10)).toBe(27_600)
  })

  it('calculates annual and long-term values from the formal inputs', () => {
    const outcome = calculateIdeco(validInput())

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    expect(outcome.result.annualContribution).toBe(276_000)
    expect(outcome.result.incomeTaxSaving).toBe(28_179.6)
    expect(outcome.result.residentTaxSaving).toBe(27_600)
    expect(outcome.result.annualTaxSaving).toBe(55_779.6)
    expect(outcome.result.totalContribution).toBe(5_520_000)
    expect(outcome.result.rounded.annualTaxSaving).toBe(55_780)
  })

  it('does not return a normal result for invalid or non-finite input', () => {
    expect(calculateIdeco(validInput({ monthlyContribution: 30_000 })).ok).toBe(false)
    expect(calculateIdeco(validInput({ residentTaxRate: Number.NaN })).ok).toBe(false)
    expect(calculateIdeco(validInput({ referenceYears: Number.POSITIVE_INFINITY })).ok).toBe(false)
  })

  it('implements ROUND_HALF_UP at positive and negative boundaries', () => {
    expect(roundHalfUp(1.49)).toBe(1)
    expect(roundHalfUp(1.5)).toBe(2)
    expect(roundHalfUp(-1.49)).toBe(-1)
    expect(roundHalfUp(-1.5)).toBe(-2)
  })
})
