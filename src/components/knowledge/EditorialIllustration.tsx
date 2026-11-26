type IllustrationTopic = 'knowledge' | 'mortgage'
const assets = import.meta.glob<string>('/src/assets/editorial/*.webp', { eager: true, query: '?url', import: 'default' })
const illustrations = {
  knowledge: { file: 'knowledge-guide-approved.webp', alt: 'お金の制度や資産づくりを学ぶ二人。NISA、住宅ローン、家計、保険のテーマを案内するイラスト。' },
  mortgage: { file: 'mortgage-comparison-approved.webp', alt: '住宅ローンの借入額、金利、返済額、固定金利と変動金利を考える二人。' },
} as const
export default function EditorialIllustration({ topic }: { topic: IllustrationTopic }) {
  const item = illustrations[topic]
  const src = assets['/src/assets/editorial/' + item.file]
  // Never substitute unapproved artwork when an asset is missing.
  if (!src) return null
  return (
    <figure className="editorial-approved-illustration" data-illustration-topic={topic}>
      <img src={src} alt={item.alt} width={1536} height={1024} loading={topic === 'knowledge' ? 'eager' : 'lazy'} decoding="async" />
      {topic === 'knowledge' && <figcaption>家計・保険の記事は準備中です。</figcaption>}
    </figure>
  )
}
