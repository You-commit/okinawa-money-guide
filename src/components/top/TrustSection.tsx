import {
  TrustDisclaimerIcon,
  TrustReliableIcon,
  TrustUpdateIcon,
} from './TopIcons'

function TrustIcon({ type }: { type: 'clarity' | 'calculation' | 'notice' }) {
  if (type === 'clarity') {
    return <TrustReliableIcon />
  }

  if (type === 'calculation') {
    return <TrustUpdateIcon />
  }

  return <TrustDisclaimerIcon />
}

const trustItems = [
  {
    type: 'clarity',
    title: '分かりやすい情報をお届け',
    description: '複雑なお金の情報を、読みやすく整理して掲載します。',
  },
  {
    type: 'calculation',
    title: '条件に沿って試算',
    description: '入力した条件をもとに、結果の目安を確認できます。',
  },
  {
    type: 'notice',
    title: '免責事項',
    description: '本サイトは情報提供を目的としており、投資等の勧誘を行うものではありません。',
  },
] as const

function TrustSection() {
  return (
    <section className="top-option02__trust" aria-label="サイトの情報提供方針">
      {trustItems.map((item) => (
        <article key={item.type}>
          <span className="top-option02__trust-icon"><TrustIcon type={item.type} /></span>
          <span>
            <strong>{item.title}</strong>
            <small>{item.description}</small>
          </span>
        </article>
      ))}
    </section>
  )
}

export default TrustSection
