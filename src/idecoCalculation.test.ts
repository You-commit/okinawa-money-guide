import { describe, expect, it } from 'vitest'
import {
  calculateAnnualIdecoContribution,
  calculateDetailedIdecoTaxSaving,
  calculateIdeco,
  calculateIdecoIncomeTaxSaving,
  calculateIdecoResidentTaxSaving,
  calculateIdecoSupplementaryIncomeTax,
  calculateProgressiveIncomeTax,
  roundHalfUp,
} from './idecoCalculation'
import {
  getIdecoContributionLimit,
  getIdecoParticipantLabel,
  getIdecoRegime,
  IDECO_RULE_PERIODS,
  IDECO_SUPPORTED_EFFECTIVE_DATE_ERROR,
  IDECO_SUPPORTED_EFFECTIVE_DATE_FROM,
  IDECO_SUPPORTED_EFFECTIVE_DATE_TO,
  isIdecoSupportedEffectiveDate,
  type IdecoParticipantCategory,
  type IdecoRuleInput,
  validateIdecoRuleInput,
} from './idecoRules'

const validInput = (
  overrides: Partial<IdecoRuleInput> = {},
): IdecoRuleInput => ({
  calculationMode: 'simple',
  effectiveDate: '2026-11-30',
  currentAge: 40,
  participantCategory: 'category2-no-pension',
  relatedMonthlyContribution: null,
  monthlyContribution: 23_000,
  actualContributionMonths: 12,
  incomeTaxRate: 10,
  taxableIncomeBeforeContribution: null,
  residentTaxRate: 10,
  referenceYears: 20,
  ...overrides,
})

describe('iDeCo age eligibility boundaries', () => {
  it('accepts the upper age boundary of the current regime and rejects 65', () => {
    expect(validateIdecoRuleInput(validInput({ currentAge: 64 })))
      .not.toHaveProperty('currentAge')
    expect(validateIdecoRuleInput(validInput({ currentAge: 65 })))
      .toHaveProperty('currentAge')
  })

  it('accepts age 69 after the reform and rejects 70', () => {
    const reformed = {
      effectiveDate: '2026-12-01',
      participantCategory: 'category2-no-pension' as const,
    }

    expect(validateIdecoRuleInput(validInput({
      ...reformed,
      currentAge: 69,
    }))).not.toHaveProperty('currentAge')
    expect(validateIdecoRuleInput(validInput({
      ...reformed,
      currentAge: 70,
    }))).toHaveProperty('currentAge')
  })

  it('checks participant-category age ranges without inferring a contribution period', () => {
    expect(validateIdecoRuleInput(validInput({
      participantCategory: 'category1',
      relatedMonthlyContribution: 0,
      currentAge: 60,
    }))).toHaveProperty('currentAge')
    expect(validateIdecoRuleInput(validInput({
      effectiveDate: '2026-12-01',
      participantCategory: 'category5',
      currentAge: 59,
    }))).toHaveProperty('currentAge')
    expect(validateIdecoRuleInput(validInput({
      effectiveDate: '2026-12-01',
      participantCategory: 'category5',
      currentAge: 60,
    }))).not.toHaveProperty('currentAge')
  })

  it('does not return a normal calculation for an ineligible age', () => {
    const outcome = calculateIdeco(validInput({ currentAge: 65 }))

    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.errors.currentAge).toBeTruthy()
  })
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
    ['category3', '2026-12-01', null, 23_000],
    ['category4', '2026-12-01', 5_000, 70_000],
    ['category5', '2026-12-01', 0, 62_000],
    ['category5', '2026-12-01', 12_000, 50_000],
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

  it('uses the official Category 5 participant terminology', () => {
    expect(getIdecoParticipantLabel('category5')).toContain(
      '第5号加入者',
    )
    expect(getIdecoParticipantLabel('category5')).not.toContain(
      '第5号被保険者',
    )
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
    expect(
      validateIdecoRuleInput(
        validInput({
          effectiveDate: '2026-12-01',
          participantCategory: 'category5',
          relatedMonthlyContribution: null,
          monthlyContribution: 5_000,
        }),
      ).relatedMonthlyContribution,
    ).toBeTruthy()
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
    ['category3', '2026-12-01', null, 23_000],
    ['category4', '2026-12-01', 5_000, 70_000],
    ['category5', '2026-12-01', 12_000, 50_000],
  ])(
    'accepts the %s limit and rejects the next 1,000 yen on %s',
    (participantCategory, effectiveDate, related, limit) => {
      const input = validInput({
        participantCategory,
        effectiveDate,
        relatedMonthlyContribution: related,
      })

      expect(validateIdecoRuleInput({
        ...input,
        monthlyContribution: limit,
      }).monthlyContribution).toBeUndefined()
      expect(validateIdecoRuleInput({
        ...input,
        monthlyContribution: limit + 1_000,
      }).monthlyContribution).toBeTruthy()
    },
  )

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

describe('iDeCo supported calculation date range', () => {
  it('derives the supported range from the formal rule periods', () => {
    expect(IDECO_SUPPORTED_EFFECTIVE_DATE_FROM).toBe(
      IDECO_RULE_PERIODS[0].effectiveFrom,
    )
    expect(IDECO_SUPPORTED_EFFECTIVE_DATE_TO).toBe(
      IDECO_RULE_PERIODS[IDECO_RULE_PERIODS.length - 1].effectiveTo,
    )
    expect(IDECO_SUPPORTED_EFFECTIVE_DATE_FROM).toBe('2026-01-01')
    expect(IDECO_SUPPORTED_EFFECTIVE_DATE_TO).toBe('2027-12-31')
  })

  it.each([
    ['2025-12-31', false],
    ['2026-01-01', true],
    ['2026-11-30', true],
    ['2026-12-01', true],
    ['2026-12-31', true],
    ['2027-01-01', true],
    ['2027-12-31', true],
    ['2028-01-01', false],
    ['2026-02-30', false],
    ['invalid', false],
  ])('validates supported calculation date %s', (date, expected) => {
    expect(isIdecoSupportedEffectiveDate(date)).toBe(expected)
  })

  it('keeps the formal regime boundary inside the supported range', () => {
    expect(getIdecoRegime('2025-12-31')).toBeNull()
    expect(getIdecoRegime('2026-01-01')).toBe('current')
    expect(getIdecoRegime('2026-11-30')).toBe('current')
    expect(getIdecoRegime('2026-12-01')).toBe('reformed')
    expect(getIdecoRegime('2026-12-31')).toBe('reformed')
    expect(getIdecoRegime('2027-01-01')).toBe('reformed')
    expect(getIdecoRegime('2027-12-31')).toBe('reformed')
    expect(getIdecoRegime('2028-01-01')).toBeNull()
  })

  it('returns the shared range error and blocks calculations outside it', () => {
    for (const effectiveDate of ['2025-12-31', '2028-01-01']) {
      const input = validInput({ effectiveDate })
      expect(validateIdecoRuleInput(input).effectiveDate).toBe(
        IDECO_SUPPORTED_EFFECTIVE_DATE_ERROR,
      )
      expect(calculateIdeco(input).ok).toBe(false)
    }
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

describe('iDeCo detailed taxable-income calculation', () => {
  it.each([
    [0, 0, 0],
    [1_000, 0.05, 50],
    [1_949_999, 0.05, 97_450],
    [1_950_000, 0.1, 97_500],
    [1_950_001, 0.1, 97_500],
    [3_299_999, 0.1, 232_400],
    [3_300_000, 0.2, 232_500],
    [3_300_001, 0.2, 232_500],
    [6_949_999, 0.2, 962_300],
    [6_950_000, 0.23, 962_500],
    [6_950_001, 0.23, 962_500],
    [8_999_999, 0.23, 1_433_770],
    [9_000_000, 0.33, 1_434_000],
    [9_000_001, 0.33, 1_434_000],
    [17_999_999, 0.33, 4_403_670],
    [18_000_000, 0.4, 4_404_000],
    [18_000_001, 0.4, 4_404_000],
    [39_999_999, 0.4, 13_203_600],
    [40_000_000, 0.45, 13_204_000],
    [40_000_001, 0.45, 13_204_000],
    [100_000_000, 0.45, 40_204_000],
  ])(
    'uses the formal progressive bracket at taxable income %i',
    (taxableIncome, expectedRate, expectedBaseTax) => {
      const tax = calculateProgressiveIncomeTax(
        taxableIncome,
        '2026-11-30',
      )

      expect(tax.marginalRate).toBe(expectedRate)
      expect(tax.baseIncomeTax).toBe(expectedBaseTax)
    },
  )

  it('calculates the saving from pre- and post-contribution tax across a bracket', () => {
    const result = calculateDetailedIdecoTaxSaving({
      taxableIncomeBeforeContribution: 3_500_000,
      annualContribution: 276_000,
      residentTaxRate: 10,
      effectiveDate: '2026-11-30',
    })

    expect(result.detailedTax.before.marginalRate).toBe(0.2)
    expect(result.detailedTax.after.marginalRate).toBe(0.1)
    expect(result.detailedTax.before.baseIncomeTax).toBe(272_500)
    expect(result.detailedTax.after.baseIncomeTax).toBe(224_900)
    expect(result.incomeTaxSaving).toBeCloseTo(48_599.6, 8)
    expect(result.residentTaxSaving).toBe(27_600)
  })

  it('handles a contribution within one bracket and a contribution crossing multiple boundaries', () => {
    const sameBracket = calculateDetailedIdecoTaxSaving({
      taxableIncomeBeforeContribution: 5_000_000,
      annualContribution: 120_000,
      residentTaxRate: 8,
      effectiveDate: '2026-11-30',
    })
    const multipleBoundaries = calculateDetailedIdecoTaxSaving({
      taxableIncomeBeforeContribution: 7_000_000,
      annualContribution: 4_000_000,
      residentTaxRate: 10,
      effectiveDate: '2026-11-30',
    })

    expect(sameBracket.detailedTax.before.marginalRate).toBe(0.2)
    expect(sameBracket.detailedTax.after.marginalRate).toBe(0.2)
    expect(multipleBoundaries.detailedTax.before.marginalRate).toBe(0.23)
    expect(multipleBoundaries.detailedTax.after.marginalRate).toBe(0.1)
  })

  it('floors post-contribution taxable income at zero and never exceeds pre-tax liability', () => {
    const result = calculateDetailedIdecoTaxSaving({
      taxableIncomeBeforeContribution: 100_000,
      annualContribution: 276_000,
      residentTaxRate: 10,
      effectiveDate: '2026-11-30',
    })

    expect(result.detailedTax.taxableIncomeAfterContribution).toBe(0)
    expect(result.detailedTax.idecoIncomeDeduction).toBe(100_000)
    expect(result.detailedTax.after.totalIncomeTax).toBe(0)
    expect(result.incomeTaxSaving).toBe(
      result.detailedTax.before.totalIncomeTax,
    )
    expect(result.residentTaxSaving).toBe(10_000)
  })

  it('uses the formal special-tax split before and after 2027 without changing the 1.021 total factor', () => {
    const through2026 = calculateProgressiveIncomeTax(
      1_000_000,
      '2026-12-31',
    )
    const from2027 = calculateProgressiveIncomeTax(
      1_000_000,
      '2027-01-01',
    )

    expect(through2026.reconstructionSpecialIncomeTax).toBe(1_050)
    expect(through2026.defenseSpecialIncomeTax).toBe(0)
    expect(from2027.reconstructionSpecialIncomeTax).toBe(550)
    expect(from2027.defenseSpecialIncomeTax).toBe(500)
    expect(from2027.totalIncomeTax).toBe(through2026.totalIncomeTax)
    expect(
      calculateIdecoSupplementaryIncomeTax(Number.NaN, '2027-01-01'),
    ).toEqual({
      defenseSpecialIncomeTax: 0,
      reconstructionSpecialIncomeTax: 0,
      supplementaryIncomeTax: 0,
    })
  })

  it('validates mode-specific inputs and calculates the detailed result', () => {
    const detailedInput = validInput({
      calculationMode: 'detailed',
      incomeTaxRate: null,
      taxableIncomeBeforeContribution: 3_500_000,
    })

    expect(validateIdecoRuleInput(detailedInput)).toEqual({})
    const outcome = calculateIdeco(detailedInput)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    expect(outcome.result.rounded.incomeTaxSaving).toBe(48_600)
    expect(outcome.result.rounded.residentTaxSaving).toBe(27_600)
    expect(outcome.result.rounded.annualTaxSaving).toBe(76_200)
    expect(outcome.result.detailedTax).not.toBeNull()
  })

  it('rejects missing, negative, and non-finite detailed taxable income without requiring the simple rate', () => {
    for (const taxableIncome of [null, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const errors = validateIdecoRuleInput(validInput({
        calculationMode: 'detailed',
        incomeTaxRate: null,
        taxableIncomeBeforeContribution: taxableIncome,
      }))

      expect(errors.taxableIncomeBeforeContribution).toBeTruthy()
      expect(errors.incomeTaxRate).toBeUndefined()
    }
  })
})
