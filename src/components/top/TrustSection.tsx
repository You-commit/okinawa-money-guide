import {
  TrustDisclaimerIcon,
  TrustReliableIcon,
  TrustUpdateIcon,
} from './TopIcons'
import { Link } from 'react-router-dom'
import { routes } from '../../app/routes'

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
    title: '計算の根拠を分かりやすく',
    description: '制度や一次資料を確認できるようにし、試算の前提を明確にします。',
  },
  {
    type: 'calculation',
    title: '結果だけで決めない',
    description: '概算結果と、含まれない費用や条件を一緒に確認できるようにします。',
  },
  {
    type: 'notice',
    title: '沖縄の暮らしに近いテーマ',
    description: '軍用地など、地域ならではのお金の判断に役立つ情報も扱います。',
  },
] as const

function TrustSection() {
  return (
    <section className="top-option02__trust" aria-labelledby="home-trust-title">
      <div className="top-option02__trust-shell">
        <header className="top-option02__home-heading">
          <p>OUR PRINCIPLES</p>
          <h2 id="home-trust-title">沖縄マネーガイドで大切にしていること</h2>
          <span>数字を判断材料として安心して使えるよう、情報の伝え方を整えています。</span>
        </header>
        <div className="top-option02__trust-grid">
          {trustItems.map((item) => (
            <article key={item.type}>
              <span className="top-option02__trust-icon"><TrustIcon type={item.type} /></span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
            </article>
          ))}
        </div>
        <Link className="top-option02__trust-link" to={routes.trust}>
          情報と運営の方針を見る
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  )
}

export default TrustSection
