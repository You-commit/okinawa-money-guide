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
}

export const affiliatePrograms: Record<
  AffiliateCategory,
  AffiliateProgramConfig
> = {
  nisa: {
    id: 'nisa-primary',
    enabled: false,
    provider: '',
    category: 'nisa',
    placement: 'nisa-after-consultation-summary',
    url: '',
    title: '',
    description: '',
    ctaLabel: '',
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

  try {
    return new URL(program.url).protocol === 'https:'
  } catch {
    return false
  }
}

export const isAffiliateVisualPreviewEnabled = () =>
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('affiliate-preview') === '1'
