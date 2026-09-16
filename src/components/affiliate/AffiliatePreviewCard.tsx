import {
  affiliatePrograms,
  type AffiliateCategory,
} from '../../affiliate/affiliateConfig'
import {
  AffiliateBannerView,
  AffiliateCardView,
} from './AffiliateCard'

type AffiliatePreviewCardProps = {
  category: AffiliateCategory
}

function AffiliatePreviewCard({ category }: AffiliatePreviewCardProps) {
  const program = affiliatePrograms[category]

  if (
    program.creativeType === 'banner' &&
    program.provider.trim() &&
    program.bannerImageUrl
  ) {
    return (
      <AffiliateBannerView
        category={category}
        provider={program.provider}
        disclosureLabel={program.disclosureLabel}
        bannerImageUrl={program.bannerImageUrl}
        bannerAlt={program.bannerAlt || program.provider}
        bannerWidth={program.bannerWidth}
        bannerHeight={program.bannerHeight}
        riskDisclosure={program.riskDisclosure}
        riskUrl={program.riskUrl}
        preview
      />
    )
  }

  const hasConfiguredContent = Boolean(
    program.provider.trim() &&
    program.title.trim() &&
    program.description.trim() &&
    program.ctaLabel.trim(),
  )

  return (
    <AffiliateCardView
      category={category}
      title={hasConfiguredContent
        ? program.title
        : '意思決定後の関連サービス案内'}
      description={hasConfiguredContent
        ? program.description
        : '正式な提携先とリンクが設定された場合に、この位置へ表示されます。'}
      provider={hasConfiguredContent ? program.provider : undefined}
      disclosureLabel={hasConfiguredContent
        ? program.disclosureLabel
        : undefined}
      riskDisclosure={hasConfiguredContent
        ? program.riskDisclosure
        : undefined}
      riskUrl={hasConfiguredContent ? program.riskUrl : undefined}
      action={(
        <span
          className="affiliate-card__link affiliate-card__link--preview"
          aria-disabled="true"
        >
          {hasConfiguredContent ? program.ctaLabel : 'リンク準備中'}
        </span>
      )}
    />
  )
}

export default AffiliatePreviewCard
