export type AffiliateCategory = 'nisa' | 'ideco' | 'mortgage'

export type AffiliatePlacement =
  | 'nisa-after-consultation-summary'
  | 'ideco-after-consultation-summary'
  | 'mortgage-after-consultation-summary'

export type AffiliateProgramConfig = {
  id: string
  enabled: boolean
  provider: string
  category: AffiliateCategory
  placement: AffiliatePlacement
  url: string
  title: string
  description: string
  ctaLabel: string
  disclosureLabel?: string
  riskDisclosure?: string
  riskUrl?: string
  trackingPixelUrl?: string
}

export const affiliatePrograms: Record<
  AffiliateCategory,
  AffiliateProgramConfig
> = {
  nisa: {
    id: 'nisa-dmm-kabu-a8',
    enabled: false,
    provider: 'DMM 株',
    category: 'nisa',
    placement: 'nisa-after-consultation-summary',
    url: 'https://px.a8.net/svt/ejp?a8mat=4BCCJF+FUDB2Y+1WP2+15RK36',
    title: 'NISA口座を検討している方へ',
    description:
      'NISAを含む資産形成の選択肢として、DMM 株のサービス内容や取引条件を確認できます。',
    ctaLabel: 'DMM 株の詳細を見る',
    disclosureLabel: 'PR',
    riskDisclosure:
      '投資には価格変動等による元本割れのリスクがあります。手数料・リスク等は公式情報をご確認ください。',
    riskUrl: 'https://kabu.dmm.com/',
    trackingPixelUrl:
      'https://www16.a8.net/0.gif?a8mat=4BCCJF+FUDB2Y+1WP2+15RK36',
  },
  ideco: {
    id: 'ideco-primary',
    enabled: false,
    provider: '',
    category: 'ideco',
    placement: 'ideco-after-consultation-summary',
    url: '',
    title: '',
    description: '',
    ctaLabel: '',
  },
  mortgage: {
    id: 'mortgage-primary',
    enabled: false,
    provider: '',
    category: 'mortgage',
    placement: 'mortgage-after-consultation-summary',
    url: '',
    title: '',
    description: '',
    ctaLabel: '',
  },
}

export const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export const isAffiliateProgramVisible = (
  program: AffiliateProgramConfig,
) => {
  if (
    !program.enabled ||
    !program.provider.trim() ||
    !program.title.trim() ||
    !program.ctaLabel.trim() ||
    !program.url.trim()
  ) {
    return false
  }

  return isHttpsUrl(program.url)
}

export const isAffiliateVisualPreviewEnabled = () =>
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('affiliate-preview') === '1'
