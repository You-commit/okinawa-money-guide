import {
  isAffiliateProgramVisible,
  isAffiliateVisualPreviewEnabled,
  isHttpsUrl,
  type AffiliatePlacement,
  type AffiliateProgramConfig,
} from '../../affiliate/affiliateConfig'
import { trackAffiliateClick } from '../../affiliate/affiliateTracking'
import { AffiliateBannerView } from './AffiliateCard'

type AffiliateProgramPlacementProps = {
  program: AffiliateProgramConfig
  placement: AffiliatePlacement
}

function AffiliateProgramPlacement({
  program,
  placement,
}: AffiliateProgramPlacementProps) {
  if (program.placement !== placement) return null

  const isPreview = isAffiliateVisualPreviewEnabled()
  const hasBanner = Boolean(
    program.creativeType === 'banner' &&
    program.bannerImageUrl &&
    isHttpsUrl(program.bannerImageUrl),
  )

  if (!hasBanner) return null
  if (!isPreview && !isAffiliateProgramVisible(program)) return null

  const trackingPixelUrl =
    !isPreview &&
    program.trackingPixelUrl &&
    isHttpsUrl(program.trackingPixelUrl)
      ? program.trackingPixelUrl
      : undefined

  return (
    <>
      <AffiliateBannerView
        category={program.category}
        provider={program.provider}
        disclosureLabel={program.disclosureLabel}
        bannerImageUrl={program.bannerImageUrl!}
        bannerAlt={program.bannerAlt || program.provider}
        bannerWidth={program.bannerWidth}
        bannerHeight={program.bannerHeight}
        riskDisclosure={program.riskDisclosure}
        riskUrl={program.riskUrl}
        href={isPreview ? undefined : program.url}
        preview={isPreview}
        onClick={isPreview
          ? undefined
          : () => trackAffiliateClick({
              provider: program.provider,
              category: program.category,
              placement: program.placement,
            })}
      />
      {trackingPixelUrl && (
        <img
          className="affiliate-card__tracking-pixel"
          src={trackingPixelUrl}
          width="1"
          height="1"
          alt=""
          aria-hidden="true"
        />
      )}
    </>
  )
}

export default AffiliateProgramPlacement
