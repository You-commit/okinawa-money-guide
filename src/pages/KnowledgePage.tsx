import { Link } from 'react-router-dom'
import { routes } from '../app/routes'
import {
  HandYenIcon,
  PiggyBankIcon,
  PurposeGrowthIcon,
  PurposeShieldIcon,
} from '../components/top/TopIcons'
import SiteLayout from '../layouts/SiteLayout'

type KnowledgeCategoryId = 'borrow' | 'save' | 'grow' | 'protect'

type KnowledgeCategory = {
  id: KnowledgeCategoryId
  title: string
  short: string
  description: string
  topics: Array<{ title: string; href?: string }>
}

const categories: KnowledgeCategory[] = [
  { id: 'borrow', title: '借りる', short: '住まい・ローン', description: '住宅・教育・軍用地ローンなど、返済を含めて考えるための基礎。', topics: [{ title: '住宅ローン比較で見るべき項目', href: routes.knowledgeMortgageComparison }, { title: '借入可能額の考え方' }] },
  { id: 'save', title: '貯める', short: '家計・積立', description: '生活防衛資金と目的別の積立を、無理のない順序で整理。', topics: [{ title: '家計の土台づくり' }, { title: '目的別積立' }] },
  { id: 'grow', title: '増やす', short: 'NISA・iDeCo', description: 'NISA・iDeCo・投資信託を、制度とリスクの両面から理解。', topics: [{ title: 'NISAの非課税枠と積立額', href: routes.knowledgeNisaLimits }, { title: 'iDeCoの税制' }] },
  { id: 'protect', title: '備える', short: '保険・年金', description: '保険・年金・相続を、必要性と優先順位から考えるための入口。', topics: [{ title: '保険見直しの基本' }, { title: '公的保障の確認' }] },
]

function KnowledgeCategoryIcon({ id, className }: { id: KnowledgeCategoryId; className?: string }) {
  switch (id) {
    case 'borrow':
      return <HandYenIcon className={className} />
    case 'save':
      return <PiggyBankIcon className={className} />
    case 'grow':
      return <PurposeGrowthIcon className={className} />
    case 'protect':
      return <PurposeShieldIcon className={className} />
  }
}

function KnowledgePage() {
  return (
    <SiteLayout className="dedicated-page info-page info-page--knowledge">
      <main id="main-content">
        <section className="info-hero knowledge-hero">
          <div className="info-hero__inner knowledge-hero__inner">
            <div>
              <nav className="knowledge-article-breadcrumb" aria-label="パンくずリスト"><Link to={routes.home}>ホーム</Link><span aria-hidden="true">›</span><span aria-current="page">お金の知識</span></nav>
              <h1>今の目的から、<br />知るべきお金のことへ</h1>
              <p className="info-hero__lead">住宅ローンやNISAなど、お金の制度・仕組みを理解し、今の目的に合わせた判断に役立てるための記事をまとめています。</p>
            </div>
            <nav className="knowledge-hero-nav" aria-label="目的別カテゴリ">
              {categories.map((category) => (
                <a className={`knowledge-hero-tile knowledge-hero-tile--${category.id}`} href={`#${category.id}`} key={category.id}>
                  <KnowledgeCategoryIcon id={category.id} className="knowledge-category-icon" />
                  <span>{category.title}</span><small>{category.short}</small>
                </a>
              ))}
            </nav>
          </div>
        </section>

        <div className="info-main"><div className="info-shell">
          <section className="info-section" id="published">
            <div className="info-section-heading"><div><h2>公開中の記事</h2></div><p>制度と数字を理解するための解説記事です。</p></div>
            <div className="knowledge-latest-list">
              {[
                { category: 'NISA・資産形成', title: 'NISAの非課税枠と、積立額・将来額の考え方', description: '年間投資枠、非課税保有限度額、将来額の違いを整理します。', href: routes.knowledgeNisaLimits, date: '2026-10-14', dateLabel: '更新日' },
                { category: '住宅・ローン', title: '住宅ローン比較で見るべき項目', description: '返済方式、金利、総返済額、諸費用、保証、団信を同じ順序で比べます。', href: routes.knowledgeMortgageComparison, date: '2026-09-21', dateLabel: '公開日' },
              ].map((article) => (
                <article key={article.href}>
                  <div className="knowledge-list-meta"><span>{article.category}</span><small>{article.dateLabel} <time dateTime={article.date}>{article.date.replaceAll('-', '.')}</time></small></div>
                  <h3><Link to={article.href}>{article.title}</Link></h3>
                  <p className="knowledge-list-description">{article.description}</p>
                  <Link className="knowledge-list-read" to={article.href} aria-label={`${article.title}を読む`}>記事を読む <span aria-hidden="true">→</span></Link>
                </article>
              ))}
            </div>
          </section>

          <section className="info-section">
            <div className="info-section-heading"><div><h2>初めての方は、3つの順序で確認</h2></div><p>知識を増やすこと自体ではなく、次の判断が落ち着いてできることを目指します。</p></div>
            <div className="start-path info-surface">
              <article><b>1</b><strong>目的を選ぶ</strong><p>借りる・貯める・増やす・備えるから、今の関心に近いものを選びます。</p></article>
              <article><b>2</b><strong>基礎と注意点を知る</strong><p>仕組み、費用、リスク、確認すべき条件を短く整理します。</p></article>
              <article><b>3</b><strong>数字で確かめる</strong><p>必要に応じて無料シミュレーターで、自分の条件に置き換えます。</p></article>
            </div>
          </section>

          <section className="info-section">
            <div className="info-section-heading"><div><h2>目的から探す</h2></div><p>気になるテーマから、公開中の記事や今後公開予定の内容を確認できます。</p></div>
            <div className="knowledge-grid">
              {categories.map((category) => (
                <article className={`knowledge-card knowledge-card--${category.id} info-surface`} id={category.id} key={category.id}>
                  <KnowledgeCategoryIcon id={category.id} className="knowledge-card__icon" />
                  <h3>{category.title}</h3><p>{category.description}</p>
                  <div className="topic-list">{category.topics.map((topic) => (
                    topic.href
                      ? <Link key={topic.title} to={topic.href}>{topic.title}<span aria-hidden="true">→</span></Link>
                      : <span key={topic.title}>{topic.title}<small className="preparing">準備中</small></span>
                  ))}</div>
                </article>
              ))}
            </div>
          </section>

          <section className="info-section">
            <div className="okinawa-panel info-surface">
              <div className="okinawa-intro"><h2>沖縄で暮らすからこそ、確認したいこと</h2><p>全国共通の制度を土台にしつつ、沖縄の暮らしや資産に関わるテーマを分けて整理します。</p></div>
              <div className="okinawa-topics">
                {[
                  ['軍用地', '倍率・年間借地料・利回りを判断するための基礎。'],
                  ['住まいと台風', '住宅費だけでなく、維持・修繕の備えも含めて考える。'],
                  ['自動車と生活費', '移動手段にかかる固定費を、家計全体で確認する。'],
                  ['地域と制度', '制度の全国基準と地域差を混同しないための読み方。'],
                ].map(([title, description]) => <article key={title}><h3>{title}</h3><p>{description}</p><span className="preparing">知識記事 準備中</span></article>)}
              </div>
            </div>
          </section>

          <section className="info-section">
            <div className="info-section-heading"><div><h2>数字を確かめる</h2></div><p>無料シミュレーターで、自分の条件に置き換えて確認できます。</p></div>
            <div className="simulator-links">
              <Link to={routes.militaryLand}>軍用地利回り <span aria-hidden="true">→</span></Link>
              <Link to={routes.mortgage}>住宅ローン <span aria-hidden="true">→</span></Link>
              <Link to={routes.nisa}>NISA積立 <span aria-hidden="true">→</span></Link>
              <Link to={routes.ideco}>iDeCo節税 <span aria-hidden="true">→</span></Link>
              <Link to={routes.taxableIncome}>課税所得 <span aria-hidden="true">→</span></Link>
            </div>
          </section>
        </div></div>
      </main>
    </SiteLayout>
  )
}

export default KnowledgePage
