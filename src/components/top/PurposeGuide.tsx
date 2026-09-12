import { Link } from 'react-router-dom'
import { routes } from '../../app/routes'
import {
  ArrowRightIcon,
  HandYenIcon,
  PiggyBankIcon,
  PurposeGrowthIcon,
  PurposeShieldIcon,
} from './TopIcons'

function PurposeIcon({ purpose }: { purpose: 'borrow' | 'save' | 'grow' | 'protect' }) {
  if (purpose === 'borrow') {
    return <HandYenIcon />
  }

  if (purpose === 'save') {
    return <PiggyBankIcon />
  }

  if (purpose === 'grow') {
    return <PurposeGrowthIcon />
  }

  return <PurposeShieldIcon />
}

const purposes = [
  { id: 'borrow', title: '借りる', description: '住宅ローンや教育ローンなど、借入に関する情報はこちら', color: 'blue' },
  { id: 'save', title: '貯める', description: '預金や積立の方法を分かりやすく解説', color: 'coral' },
  { id: 'grow', title: '増やす', description: '投資や資産運用で将来に備える', color: 'mint' },
  { id: 'protect', title: '備える', description: '保険や年金、相続の基礎知識を学ぶ', color: 'navy' },
] as const

function PurposeGuide() {
  return (
    <section className="top-option02__purpose" aria-labelledby="purpose-guide-title">
      <div className="top-option02__section-title top-option02__section-title--purpose">
        <h2 id="purpose-guide-title">目的から探す</h2>
        <p>まだ使うツールが決まっていない方はこちら</p>
      </div>
      <div className="top-option02__purpose-grid">
        {purposes.map((purpose) => (
          <Link
            className={`top-option02__purpose-card top-option02__purpose-card--${purpose.color}`}
            to={`${routes.knowledge}#${purpose.id}`}
            key={purpose.id}
          >
            <span className="top-option02__purpose-icon"><PurposeIcon purpose={purpose.id} /></span>
            <span className="top-option02__purpose-copy">
              <strong>{purpose.title}</strong>
              <small>{purpose.description}</small>
            </span>
            <ArrowRightIcon className="top-option02__purpose-arrow" />
          </Link>
        ))}
      </div>
    </section>
  )
}

export default PurposeGuide
