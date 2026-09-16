import type {
  AffiliateCategory,
  AffiliatePlacement,
} from './affiliateConfig'

type AffiliateClickParameters = {
  provider: string
  category: AffiliateCategory
  placement: AffiliatePlacement
}

type GtagWindow = Window & {
  gtag?: (
    command: 'event',
    eventName: 'affiliate_click',
    parameters: AffiliateClickParameters,
  ) => void
}

export const trackAffiliateClick = (
  parameters: AffiliateClickParameters,
) => {
  if (typeof window === 'undefined') return

  const gtag = (window as GtagWindow).gtag
  if (typeof gtag !== 'function') return

  try {
    gtag('event', 'affiliate_click', parameters)
  } catch {
    // Analytics must never interrupt the user's navigation.
  }
}
