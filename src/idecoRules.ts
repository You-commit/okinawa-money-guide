export const IDECO_REFORM_START_DATE = '2026-12-01'
export const IDECO_MINIMUM_MONTHLY_CONTRIBUTION = 5_000
export const IDECO_CONTRIBUTION_STEP = 1_000

export type IdecoRegime = 'current' | 'reformed'

export type IdecoCalculationMode = 'simple' | 'detailed'

export type IdecoParticipantCategory =
  | 'category1'
  | 'category2-no-pension'
  | 'category2-with-pension'
  | 'category3'
  | 'category4'
  | 'category5'

export type IdecoRuleField =
  | 'effectiveDate'
  | 'participantCategory'
  | 'relatedMonthlyContribution'
  | 'monthlyContribution'
  | 'actualContributionMonths'
  | 'incomeTaxRate'
  | 'taxableIncomeBeforeContribution'
  | 'residentTaxRate'
  | 'referenceYears'

export type IdecoValidationErrors = Partial<
  Record<IdecoRuleField, string>
>

export type IdecoRuleInput = {
  calculationMode: IdecoCalculationMode
  effectiveDate: string
  participantCategory: IdecoParticipantCategory | ''
  relatedMonthlyContribution: number | null
  monthlyContribution: number | null
  actualContributionMonths: number | null
  incomeTaxRate: number | null
  taxableIncomeBeforeContribution: number | null
  residentTaxRate: number | null
  referenceYears: number | null
}

export type IdecoContributionLimit = {
  regime: IdecoRegime
  combinedLimit: number
  monthlyLimit: number
  requiresRelatedContribution: boolean
}

export const IDECO_PARTICIPANT_OPTIONS: ReadonlyArray<{
  value: IdecoParticipantCategory
  label: string
}> = [
  { value: 'category1', label: '第1号被保険者' },
  {
    value: 'category2-no-pension',
    label: '第2号被保険者（企業年金なし）',
  },
  {
    value: 'category2-with-pension',
    label: '第2号被保険者（企業年金あり・公務員等）',
  },
  { value: 'category3', label: '第3号被保険者' },
  { value: 'category4', label: '第4号被保険者' },
  {
    value: 'category5',
    label: '第5号被保険者（改正制度の一定要件該当者）',
  },
]

const INCOME_TAX_RATES = [0, 5, 10, 20, 23, 33, 40, 45]

const toContributionStepLimit = (value: number) =>
  Math.max(
    0,
    Math.floor(value / IDECO_CONTRIBUTION_STEP) *
      IDECO_CONTRIBUTION_STEP,
  )

export const isValidIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export const getIdecoRegime = (
  effectiveDate: string,
): IdecoRegime | null => {
  if (!isValidIsoDate(effectiveDate)) {
    return null
  }

  return effectiveDate < IDECO_REFORM_START_DATE
    ? 'current'
    : 'reformed'
}

export const getIdecoRegimeLabel = (
  regime: IdecoRegime,
) =>
  regime === 'current'
    ? '2026年11月30日までの制度'
    : '2026年12月1日以後の改正制度'

export const getIdecoParticipantLabel = (
  category: IdecoParticipantCategory,
) =>
  IDECO_PARTICIPANT_OPTIONS.find(
    (option) => option.value === category,
  )?.label ?? category

export const requiresIdecoRelatedContribution = (
  category: IdecoParticipantCategory,
) =>
  category === 'category1' ||
  category === 'category4' ||
  category === 'category2-with-pension'

export const getIdecoRelatedContributionLabel = (
  category: IdecoParticipantCategory,
) =>
  category === 'category2-with-pension'
    ? '企業年金等の合算対象額（月額）'
    : '国民年金基金・付加保険料等（月額）'

export const getIdecoContributionLimit = ({
  effectiveDate,
  participantCategory,
  relatedMonthlyContribution,
}: Pick<
  IdecoRuleInput,
  | 'effectiveDate'
  | 'participantCategory'
  | 'relatedMonthlyContribution'
>): IdecoContributionLimit | null => {
  const regime = getIdecoRegime(effectiveDate)

  if (!regime || !participantCategory) {
    return null
  }

  if (regime === 'current' && participantCategory === 'category5') {
    return null
  }

  const requiresRelated = requiresIdecoRelatedContribution(
    participantCategory,
  )

  if (
    requiresRelated &&
    (relatedMonthlyContribution === null ||
      !Number.isFinite(relatedMonthlyContribution) ||
      relatedMonthlyContribution < 0)
  ) {
    return null
  }

  const related = requiresRelated
    ? relatedMonthlyContribution ?? 0
    : 0

  if (regime === 'current') {
    if (
      participantCategory === 'category1' ||
      participantCategory === 'category4'
    ) {
      return {
        regime,
        combinedLimit: 68_000,
        monthlyLimit: toContributionStepLimit(68_000 - related),
        requiresRelatedContribution: true,
      }
    }

    if (participantCategory === 'category2-no-pension') {
      return {
        regime,
        combinedLimit: 23_000,
        monthlyLimit: 23_000,
        requiresRelatedContribution: false,
      }
    }

    if (participantCategory === 'category2-with-pension') {
      return {
        regime,
        combinedLimit: 55_000,
        monthlyLimit: Math.min(
          20_000,
          toContributionStepLimit(55_000 - related),
        ),
        requiresRelatedContribution: true,
      }
    }

    return {
      regime,
      combinedLimit: 23_000,
      monthlyLimit: 23_000,
      requiresRelatedContribution: false,
    }
  }

  if (
    participantCategory === 'category1' ||
    participantCategory === 'category4'
  ) {
    return {
      regime,
      combinedLimit: 75_000,
      monthlyLimit: toContributionStepLimit(75_000 - related),
      requiresRelatedContribution: true,
    }
  }

  if (participantCategory === 'category2-with-pension') {
    return {
      regime,
      combinedLimit: 62_000,
      monthlyLimit: toContributionStepLimit(62_000 - related),
      requiresRelatedContribution: true,
    }
  }

  return {
    regime,
    combinedLimit: 62_000,
    monthlyLimit: 62_000,
    requiresRelatedContribution: false,
  }
}

export const validateIdecoRuleInput = (
  input: IdecoRuleInput,
): IdecoValidationErrors => {
  const errors: IdecoValidationErrors = {}
  const regime = getIdecoRegime(input.effectiveDate)

  if (input.effectiveDate === '') {
    errors.effectiveDate = '制度適用日を入力してください。'
  } else if (!regime) {
    errors.effectiveDate = '制度適用日を正しく入力してください。'
  }

  if (!input.participantCategory) {
    errors.participantCategory = '加入区分を選択してください。'
  } else if (
    regime === 'current' &&
    input.participantCategory === 'category5'
  ) {
    errors.participantCategory =
      '第5号被保険者は2026年12月1日以後の改正制度で選択できます。'
  }

  if (
    input.participantCategory &&
    requiresIdecoRelatedContribution(input.participantCategory)
  ) {
    if (input.relatedMonthlyContribution === null) {
      errors.relatedMonthlyContribution =
        '合算対象となる月額を入力してください。該当額がない場合は0円と入力してください。'
    } else if (
      !Number.isFinite(input.relatedMonthlyContribution) ||
      input.relatedMonthlyContribution < 0
    ) {
      errors.relatedMonthlyContribution =
        '合算対象額は0円以上で入力してください。'
    }
  }

  const limit = getIdecoContributionLimit(input)

  if (input.monthlyContribution === null) {
    errors.monthlyContribution = '毎月の掛金を入力してください。'
  } else if (
    !Number.isFinite(input.monthlyContribution) ||
    input.monthlyContribution < IDECO_MINIMUM_MONTHLY_CONTRIBUTION
  ) {
    errors.monthlyContribution =
      '毎月の掛金は5,000円以上で入力してください。'
  } else if (
    input.monthlyContribution % IDECO_CONTRIBUTION_STEP !== 0
  ) {
    errors.monthlyContribution =
      '毎月の掛金は1,000円単位で入力してください。'
  } else if (limit && limit.monthlyLimit < IDECO_MINIMUM_MONTHLY_CONTRIBUTION) {
    errors.monthlyContribution =
      '入力した合算対象額では、月額掛金の上限が5,000円未満となるため拠出できない場合があります。'
  } else if (
    limit &&
    input.monthlyContribution > limit.monthlyLimit
  ) {
    errors.monthlyContribution = `この条件での月額上限は${limit.monthlyLimit.toLocaleString('ja-JP')}円です。`
  }

  if (input.actualContributionMonths === null) {
    errors.actualContributionMonths =
      '実拠出月数を入力してください。'
  } else if (
    !Number.isInteger(input.actualContributionMonths) ||
    input.actualContributionMonths < 1 ||
    input.actualContributionMonths > 12
  ) {
    errors.actualContributionMonths =
      '実拠出月数は1〜12の整数で入力してください。'
  }

  if (input.calculationMode !== 'detailed') {
    if (input.incomeTaxRate === null) {
      errors.incomeTaxRate = '所得税率を選択してください。'
    } else if (
      !Number.isFinite(input.incomeTaxRate) ||
      !INCOME_TAX_RATES.includes(input.incomeTaxRate)
    ) {
      errors.incomeTaxRate = '所得税率を正しく選択してください。'
    }
  } else if (input.taxableIncomeBeforeContribution === null) {
    errors.taxableIncomeBeforeContribution =
      '掛金控除前の課税所得を入力してください。'
  } else if (
    !Number.isSafeInteger(input.taxableIncomeBeforeContribution) ||
    input.taxableIncomeBeforeContribution < 0
  ) {
    errors.taxableIncomeBeforeContribution =
      '掛金控除前の課税所得は0円以上の整数で入力してください。'
  }

  if (input.residentTaxRate === null) {
    errors.residentTaxRate =
      '住民税所得割率を入力してください。'
  } else if (
    !Number.isFinite(input.residentTaxRate) ||
    input.residentTaxRate < 0 ||
    input.residentTaxRate > 100
  ) {
    errors.residentTaxRate =
      '住民税所得割率は0〜100%で入力してください。'
  }

  if (input.referenceYears === null) {
    errors.referenceYears = '長期参考期間を入力してください。'
  } else if (
    !Number.isInteger(input.referenceYears) ||
    input.referenceYears < 1 ||
    !Number.isFinite(input.referenceYears)
  ) {
    errors.referenceYears =
      '長期参考期間は1年以上の整数で入力してください。'
  }

  return errors
}
