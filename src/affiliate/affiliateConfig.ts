export type AffiliateCategory = 'nisa' | 'ideco' | 'mortgage'
export type AffiliateCreativeType = 'text' | 'banner'

export type AffiliatePlacement =
  | 'nisa-before-simulation'
  | 'nisa-after-consultation-summary'
  | 'ideco-after-consultation-summary'
  | 'mortgage-after-consultation-summary'

export type AffiliateProgramConfig = {
  id: string
  enabled: boolean
  provider: string
  category: AffiliateCategory
  placement: AffiliatePlacement
  creativeType?: AffiliateCreativeType
  url: string
  title: string
  description: string
  ctaLabel: string
  disclosureLabel?: string
  riskDisclosure?: string
  riskUrl?: string
  trackingPixelUrl?: string
  bannerImageUrl?: string
  bannerAlt?: string
  bannerWidth?: number
  bannerHeight?: number
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
    placement: 'nisa-before-simulation',
    creativeType: 'banner',
    url: 'https://px.a8.net/svt/ejp?a8mat=4BCCJF+FUDB2Y+1WP2+15Q22P',
    title: 'DMM 株',
    description: '',
    ctaLabel: '',
    disclosureLabel: 'PR',
    riskDisclosure:
      '投資には価格変動等による元本割れのリスクがあります。手数料・リスク等は公式情報をご確認ください。',
    riskUrl: 'https://kabu.dmm.com/',
    trackingPixelUrl:
      'https://www17.a8.net/0.gif?a8mat=4BCCJF+FUDB2Y+1WP2+15Q22P',
    bannerImageUrl:
      'https://www22.a8.net/svt/bgt?aid=260916603958&wid=002&eno=01&mid=s00000008903007008000&mc=1',
    bannerAlt: 'DMM 株',
    bannerWidth: 468,
    bannerHeight: 60,
  },
  ideco: {
    id: 'ideco-primary',
    enabled: false,
    provider: '',
    category: 'ideco',
    placement: 'ideco-after-consultation-summary',
    creativeType: 'text',
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
    creativeType: 'text',
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
    !program.url.trim() ||
    !isHttpsUrl(program.url)
  ) {
    return false
  }

  if (program.creativeType === 'banner') {
    return Boolean(
      program.bannerImageUrl &&
      isHttpsUrl(program.bannerImageUrl),
    )
  }

  return Boolean(program.title.trim() && program.ctaLabel.trim())
}

const isAffiliateBranchPreviewHost = (hostname: string) =>
  hostname.startsWith('feature-') &&
  hostname.endsWith('.okinawa-money-guide.pages.dev')

export const isAffiliateVisualPreviewEnabled = () => {
  if (typeof window === 'undefined') return false

  const previewRequested =
    new URLSearchParams(window.location.search).get('affiliate-preview') === '1'

  if (!previewRequested) return false

  return import.meta.env.DEV || isAffiliateBranchPreviewHost(
    window.location.hostname.toLowerCase(),
  )
}
