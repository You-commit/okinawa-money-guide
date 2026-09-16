import {
  isAffiliateProgramVisible,
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
  action: ReactNode
}

export function AffiliateCardView({
  category,
  title,
  description,
  provider,
  action,
}: AffiliateCardViewProps) {
  return (
    <aside
      className="affiliate-card"
      data-category={category}
      aria-label="関連サービス"
    >
      <div className="affiliate-card__content">
        <div>
          <p className="affiliate-card__eyebrow">RELATED SERVICE</p>
          <h3>{title}</h3>
          <p>{description}</p>
          {provider && (
            <small className="affiliate-card__provider">
              提供：{provider}
            </small>
          )}
        </div>

        {action}
      </div>
    </aside>
  )
}

function AffiliateCard({ program }: AffiliateCardProps) {
  if (!isAffiliateProgramVisible(program)) return null

  return (
    <AffiliateCardView
      category={program.category}
      title={program.title}
      description={program.description}
      provider={program.provider}
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
  )
}

export default AffiliateCard
