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
  const safeRiskUrl = riskUrl && isHttpsUrl(riskUrl) ? riskUrl : undefined

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
          {riskDisclosure && (
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
          )}
        </div>

        {action}
      </div>
    </aside>
  )
}

function AffiliateCard({ program }: AffiliateCardProps) {
  if (!isAffiliateProgramVisible(program)) return null

  const safeTrackingPixelUrl =
    program.trackingPixelUrl && isHttpsUrl(program.trackingPixelUrl)
      ? program.trackingPixelUrl
      : undefined

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
