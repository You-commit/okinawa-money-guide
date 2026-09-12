import { Link } from 'react-router-dom'
import { routes } from '../../app/routes'
import {
  ArrowRightIcon,
  BuildingIcon,
  GrowthChartIcon,
  HouseIcon,
  SproutIcon,
  TrustReliableIcon,
  TrustUpdateIcon,
} from './TopIcons'
import TrustSection from './TrustSection'

const useCases = [
  {
    id: 'mortgage',
    title: '住宅を買う前に',
    description: '毎月の返済額や、2つの返済方式による負担の違いを確認できます。',
    action: '住宅ローンを試算',
    href: routes.mortgage,
    icon: <HouseIcon />,
  },
  {
    id: 'nisa',
    title: '将来のお金を準備したい',
    description: '積立額・期間・想定利回りから、将来資産の目安を整理できます。',
    action: 'NISAを試算',
    href: routes.nisa,
    icon: <GrowthChartIcon />,
  },
  {
    id: 'ideco',
    title: '節税額を確認したい',
    description: '掛金と所得状況をもとに、iDeCoによる税負担の軽減額を確認できます。',
    action: 'iDeCoを試算',
    href: routes.ideco,
    icon: <SproutIcon />,
  },
  {
    id: 'military',
    title: '沖縄ならではの資産を検討したい',
    description: '軍用地の利回り・年間収支・購入価格ベースの回収期間を確認できます。',
    action: '軍用地を試算',
    href: routes.militaryLand,
    icon: <BuildingIcon />,
  },
] as const

const decisionSteps = [
  {
    number: '01',
    title: '自分の条件に置き換える',
    description: '一般的な例だけでなく、金額や期間を入力して、自分に近い条件で考えます。',
  },
  {
    number: '02',
    title: '負担と違いを見比べる',
    description: '月々の負担、将来額、節税額など、判断に必要な数字を並べて確認します。',
  },
  {
    number: '03',
    title: '前提と根拠も確かめる',
    description: '概算に含まれない条件や制度の注意点、一次資料まで確認して次の相談に備えます。',
  },
] as const

function HomeEnrichment() {
  return (
    <>
      <section className="top-option02__home-section top-option02__use-cases" aria-labelledby="home-use-cases-title">
        <div className="top-option02__home-shell">
          <header className="top-option02__home-heading">
            <p>USE CASES</p>
            <h2 id="home-use-cases-title">こんなときに使えます</h2>
            <span>今の悩みに近いところから、必要な数字を確かめられます。</span>
          </header>
          <div className="top-option02__use-case-grid">
            {useCases.map((item) => (
              <Link
                className={`top-option02__use-case-card top-option02__use-case-card--${item.id}`}
                to={item.href}
                key={item.id}
              >
                <span className="top-option02__use-case-icon">{item.icon}</span>
                <span className="top-option02__use-case-copy">
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                  <b>{item.action}<ArrowRightIcon /></b>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="top-option02__home-section top-option02__decision-flow" aria-labelledby="home-decision-flow-title">
        <div className="top-option02__home-shell">
          <header className="top-option02__home-heading">
            <p>FROM NUMBERS TO DECISIONS</p>
            <h2 id="home-decision-flow-title">数字を入れるだけで、判断材料が見えてきます</h2>
            <span>結果だけで決めず、比べるポイントと前提条件まで一緒に整理します。</span>
          </header>
          <ol className="top-option02__decision-list">
            {decisionSteps.map((step) => (
              <li key={step.number}>
                <b>{step.number}</b>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="top-option02__home-section top-option02__knowledge-entry" aria-labelledby="home-knowledge-title">
        <div className="top-option02__knowledge-panel">
          <div className="top-option02__knowledge-copy">
            <p>KNOWLEDGE</p>
            <h2 id="home-knowledge-title">お金の基礎知識</h2>
            <span>借りる・貯める・増やす・備える。目的ごとに、仕組みや注意点を落ち着いて確認できます。</span>
            <Link to={routes.knowledge}>
              お金の知識を見る
              <ArrowRightIcon />
            </Link>
          </div>
          <div className="top-option02__knowledge-points" aria-label="確認できること">
            <article>
              <TrustReliableIcon />
              <strong>仕組みを知る</strong>
              <small>制度やお金の基本を、目的からたどれます。</small>
            </article>
            <article>
              <TrustUpdateIcon />
              <strong>注意点を確かめる</strong>
              <small>費用・リスク・確認事項を整理して掲載します。</small>
            </article>
          </div>
        </div>
      </section>

      <TrustSection />

      <section className="top-option02__final-cta" aria-labelledby="home-final-cta-title">
        <div>
          <p>START WITH YOUR NUMBERS</p>
          <h2 id="home-final-cta-title">気になるお金から、まず試算してみませんか？</h2>
          <span>入力した条件から、将来や返済、節税などの目安を確認できます。</span>
        </div>
        <a href="#popular-simulators">
          シミュレーターを選ぶ
          <ArrowRightIcon />
        </a>
      </section>
    </>
  )
}

export default HomeEnrichment
