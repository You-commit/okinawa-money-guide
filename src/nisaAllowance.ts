export const NISA_ALLOWANCE_LIMITS = {
  annualTsumitate: 1_200_000,
  annualGrowth: 2_400_000,
  annualCombined: 3_600_000,
  lifetimeAcquisition: 18_000_000,
} as const

export type NisaAnnualAllowanceStatus =
  | 'within-tsumitate'
  | 'outside-tsumitate-within-combined'
  | 'over-combined'

export type NisaAllowanceAssessment = {
  annualContribution: number
  formalPrincipal: number
  annualStatus: NisaAnnualAllowanceStatus
  annualTitle: string
  annualDescription: string
  requiresLifetimeLimitReview: boolean
}

export const assessNisaAllowance = ({
  monthlyContribution,
  months,
}: {
  monthlyContribution: number
  months: number
}): NisaAllowanceAssessment => {
  if (
    !Number.isFinite(monthlyContribution) ||
    monthlyContribution <= 0 ||
    !Number.isInteger(months) ||
    months <= 0
  ) {
    throw new RangeError('Invalid NISA allowance assessment input')
  }

  const annualContribution = monthlyContribution * 12
  const formalPrincipal = monthlyContribution * months

  if (
    !Number.isFinite(annualContribution) ||
    !Number.isFinite(formalPrincipal)
  ) {
    throw new RangeError('NISA allowance assessment could not be calculated')
  }

  if (annualContribution <= NISA_ALLOWANCE_LIMITS.annualTsumitate) {
    return {
      annualContribution,
      formalPrincipal,
      annualStatus: 'within-tsumitate',
      annualTitle: 'つみたて投資枠の年間上限内',
      annualDescription:
        '年間積立額は120万円以内です。実際に対象となる商品や購入方法は、金融機関等でご確認ください。',
      requiresLifetimeLimitReview:
        formalPrincipal > NISA_ALLOWANCE_LIMITS.lifetimeAcquisition,
    }
  }

  if (annualContribution <= NISA_ALLOWANCE_LIMITS.annualCombined) {
    return {
      annualContribution,
      formalPrincipal,
      annualStatus: 'outside-tsumitate-within-combined',
      annualTitle: 'つみたて投資枠だけには収まりません',
      annualDescription:
        '成長投資枠へ自動的に振り分けてはいません。商品・購入方法・金融機関の条件をご確認ください。',
      requiresLifetimeLimitReview:
        formalPrincipal > NISA_ALLOWANCE_LIMITS.lifetimeAcquisition,
    }
  }

  return {
    annualContribution,
    formalPrincipal,
    annualStatus: 'over-combined',
    annualTitle: '現行NISAの年間投資枠合計を超えます',
    annualDescription:
      '年間積立額を、現行制度の年間投資枠合計360万円と比較した結果です。実際の利用可能枠は金融機関等でご確認ください。',
    requiresLifetimeLimitReview:
      formalPrincipal > NISA_ALLOWANCE_LIMITS.lifetimeAcquisition,
  }
}
