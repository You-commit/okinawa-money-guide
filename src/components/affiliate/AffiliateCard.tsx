import {
  isAffiliateProgramVisible,
  isHttpsUrl,
  type AffiliateCategory,
  type AffiliateProgramConfig,
} from '../../affiliate/affiliateConfig'
import { trackAffiliateClick } from '../../affiliate/affiliateTracking'
import type { ReactNode } from 'react'
import './AffiliateCard.css'

type AffiliateCardProps = {
  program: AffiliateProgramConfig
}

type AffiliateCardViewProps = {
  category: AffiliateCategory
  title: string
  description: string
  provider?: string
  disclosureLabel?: string
  riskDisclosure?: string
  riskUrl?: string
  action: ReactNode
}

type AffiliateBannerViewProps = {
  category: AffiliateCategory
  provider: string
  disclosureLabel?: string
  bannerImageUrl: string
  bannerAlt: string
  bannerWidth?: number
  bannerHeight?: number
  riskDisclosure?: string
  riskUrl?: string
  href?: string
  onClick?: () => void
  preview?: boolean
}

function AffiliateRiskNote({
  riskDisclosure,
  riskUrl,
}: Pick<AffiliateBannerViewProps, 'riskDisclosure' | 'riskUrl'>) {
  const safeRiskUrl = riskUrl && isHttpsUrl(riskUrl) ? riskUrl : undefined

  if (!riskDisclosure) return null

  return (
    <p className="affiliate-card__risk">
      {riskDisclosure}
      {safeRiskUrl && (
        <>
          {' '}
          <a
            href={safeRiskUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            公式情報
          </a>
        </>
      )}
    </p>
  )
}

export function AffiliateCardView({
  category,
  title,
  description,
  provider,
  disclosureLabel,
  riskDisclosure,
  riskUrl,
  action,
}: AffiliateCardViewProps) {
  return (
    <aside
      className="affiliate-card"
      data-category={category}
      aria-label={disclosureLabel
        ? `関連サービス（${disclosureLabel}）`
        : '関連サービス'}
    >
      <div className="affiliate-card__content">
        <div>
          <div className="affiliate-card__meta">
            <p className="affiliate-card__eyebrow">RELATED SERVICE</p>
            {disclosureLabel && (
              <span className="affiliate-card__disclosure">
                {disclosureLabel}
              </span>
            )}
          </div>
          <h3>{title}</h3>
          <p>{description}</p>
          {provider && (
            <small className="affiliate-card__provider">
              提供：{provider}
            </small>
          )}
          <AffiliateRiskNote
            riskDisclosure={riskDisclosure}
            riskUrl={riskUrl}
          />
        </div>

        {action}
      </div>
    </aside>
  )
}

export function AffiliateBannerView({
  category,
  provider,
  disclosureLabel,
  bannerImageUrl,
  bannerAlt,
  bannerWidth,
  bannerHeight,
  riskDisclosure,
  riskUrl,
  href,
  onClick,
  preview = false,
}: AffiliateBannerViewProps) {
  const image = (
    <img
      className="affiliate-banner__image"
      src={bannerImageUrl}
      width={bannerWidth}
      height={bannerHeight}
      alt={bannerAlt}
    />
  )

  return (
    <aside
      className="affiliate-banner"
      data-category={category}
      aria-label={`${provider}の関連サービス${disclosureLabel ? `（${disclosureLabel}）` : ''}`}
    >
      <div className="affiliate-banner__header">
        {disclosureLabel && (
          <span className="affiliate-card__disclosure">
            {disclosureLabel}
          </span>
        )}
      </div>

      <div className="affiliate-banner__creative">
        {href && !preview ? (
          <a
            href={href}
            target="_blank"
            rel="sponsored noopener noreferrer"
            onClick={onClick}
            aria-label={`${provider}の詳細を見る`}
          >
            {image}
          </a>
        ) : image}
      </div>

      <AffiliateRiskNote
        riskDisclosure={riskDisclosure}
        riskUrl={riskUrl}
      />
    </aside>
  )
}

function AffiliateCard({ program }: AffiliateCardProps) {
  if (program.placement === 'nisa-before-simulation') return null
  if (!isAffiliateProgramVisible(program)) return null

  const safeTrackingPixelUrl =
    program.trackingPixelUrl && isHttpsUrl(program.trackingPixelUrl)
      ? program.trackingPixelUrl
      : undefined

  if (
    program.creativeType === 'banner' &&
    program.bannerImageUrl &&
    isHttpsUrl(program.bannerImageUrl)
  ) {
    return (
      <>
        <AffiliateBannerView
          category={program.category}
          provider={program.provider}
          disclosureLabel={program.disclosureLabel}
          bannerImageUrl={program.bannerImageUrl}
          bannerAlt={program.bannerAlt || program.provider}
          bannerWidth={program.bannerWidth}
          bannerHeight={program.bannerHeight}
          riskDisclosure={program.riskDisclosure}
          riskUrl={program.riskUrl}
          href={program.url}
          onClick={() => trackAffiliateClick({
            provider: program.provider,
            category: program.category,
            placement: program.placement,
          })}
        />
        {safeTrackingPixelUrl && (
          <img
            className="affiliate-card__tracking-pixel"
            src={safeTrackingPixelUrl}
            width="1"
            height="1"
            alt=""
            aria-hidden="true"
          />
        )}
      </>
    )
  }

  return (
    <>
      <AffiliateCardView
        category={program.category}
        title={program.title}
        description={program.description}
        provider={program.provider}
        disclosureLabel={program.disclosureLabel}
        riskDisclosure={program.riskDisclosure}
        riskUrl={program.riskUrl}
        action={(
          <a
            className="affiliate-card__link"
            href={program.url}
            target="_blank"
            rel="sponsored noopener noreferrer"
            onClick={() => trackAffiliateClick({
              provider: program.provider,
              category: program.category,
              placement: program.placement,
            })}
          >
            {program.ctaLabel}
            <span aria-hidden="true">↗</span>
          </a>
        )}
      />
      {safeTrackingPixelUrl && (
        <img
          className="affiliate-card__tracking-pixel"
          src={safeTrackingPixelUrl}
          width="1"
          height="1"
          alt=""
          aria-hidden="true"
        />
      )}
    </>
  )
}

export default AffiliateCard
