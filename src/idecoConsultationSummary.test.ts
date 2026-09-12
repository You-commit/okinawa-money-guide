import { describe, expect, it } from 'vitest'
import { calculateIdeco } from './idecoCalculation'
import {
  createIdecoConsultationSummaryText,
  type IdecoConsultationRecord,
} from './idecoConsultationSummary'
import type { IdecoRuleInput } from './idecoRules'

const createRecord = (
  overrides: Partial<IdecoRuleInput> = {},
): IdecoConsultationRecord => {
  const input: IdecoRuleInput = {
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
  }
  const calculation = calculateIdeco(input)

  if (!calculation.ok || !input.participantCategory) {
    throw new Error('A valid consultation record is required for this test.')
  }

  return {
    input: {
      ...input,
      currentAge: input.currentAge!,
      participantCategory: input.participantCategory,
      monthlyContribution: input.monthlyContribution!,
      actualContributionMonths: input.actualContributionMonths!,
      residentTaxRate: input.residentTaxRate!,
      referenceYears: input.referenceYears!,
    },
    calculation,
  }
}

describe('iDeCo consultation summary', () => {
  it('includes the simple-mode inputs, results,制度 conditions, and confirmation items', () => {
    const text = createIdecoConsultationSummaryText(createRecord())

    expect(text).toContain('計算モード: 簡易税率モード')
    expect(text).toContain('計算基準日: 2026-11-30')
    expect(text).toContain('現在の年齢: 40歳')
    expect(text).toContain('今年の掛金拠出月数: 12か月')
    expect(text).toContain('長期試算期間: 20年')
    expect(text).toContain('所得税率: 10%')
    expect(text).toContain('住民税所得割率: 10%')
    expect(text).toContain('年間節税効果: 55,780円')
    expect(text).toContain('適用月額上限: 23,000円')
    expect(text).toContain('【未考慮事項】')
    expect(text).toContain('【金融機関・勤務先・年金事務所・税務専門家へ確認する項目】')
    expect(text).toContain('【一次資料】')
  })

  it('includes detailed taxable-income inputs and breakdown values', () => {
    const text = createIdecoConsultationSummaryText(createRecord({
      calculationMode: 'detailed',
      incomeTaxRate: null,
      taxableIncomeBeforeContribution: 3_500_000,
    }))

    expect(text).toContain('計算モード: 詳細課税所得モード')
    expect(text).toContain('掛金控除前の課税所得: 3,500,000円')
    expect(text).toContain('控除前課税所得: 3,500,000円')
    expect(text).toContain('iDeCo所得控除額: 276,000円')
    expect(text).toContain('控除後課税所得: 3,224,000円')
    expect(text).toContain('年間節税効果: 76,200円')
  })

  it('does not expose developer metadata in copied or printed text', () => {
    const text = createIdecoConsultationSummaryText(createRecord())

    expect(text).not.toMatch(/OMG-DS-IDECO|model version|モデル版|計算モデル|internal timestamp|debug snapshot|計算日時/i)
  })

  it('records an aggregation condition without inventing a fixed allowance', () => {
    const text = createIdecoConsultationSummaryText(createRecord({
      participantCategory: 'category2-with-pension',
      relatedMonthlyContribution: 30_000,
      monthlyContribution: 20_000,
    }))

    expect(text).toContain('企業年金等の合算対象額（月額）: 30,000円')
    expect(text).toContain('適用月額上限: 20,000円')
    expect(text).toContain('企業年金等の合算対象額（月額）との合算を反映')
  })
})
