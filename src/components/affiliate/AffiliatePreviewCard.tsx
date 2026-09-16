import type { AffiliateCategory } from '../../affiliate/affiliateConfig'
import { AffiliateCardView } from './AffiliateCard'

type AffiliatePreviewCardProps = {
  category: AffiliateCategory
}

function AffiliatePreviewCard({ category }: AffiliatePreviewCardProps) {
  if (!import.meta.env.DEV) return null

  return (
    <AffiliateCardView
      category={category}
      title="意思決定後の関連サービス案内"
      description="正式な提携先とリンクが設定された場合に、この位置へ表示されます。"
      action={(
        <span
          className="affiliate-card__link affiliate-card__link--preview"
          aria-disabled="true"
        >
          リンク準備中
        </span>
      )}
    />
  )
}

export default AffiliatePreviewCard
