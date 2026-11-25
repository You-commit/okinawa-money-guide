import { type MouseEvent as ReactMouseEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { routes } from '../../app/routes'
import {
  ArrowRightIcon,
  GrowthChartIcon,
  StepCalculatorIcon,
  TrustDisclaimerIcon,
  TrustReliableIcon,
} from '../../components/top/TopIcons'
import SiteLayout from '../../layouts/SiteLayout'
import { ARTICLE_CHART_MAX_MAN, ARTICLE_CHART_YEARS, articleFutureValueSeries } from './nisaArticleFutureValue'
import './nisa-guide-integrated.css'

const sources = [
  {
    title: 'NISAを知る',
    organization: '金融庁',
    url: 'https://www.fsa.go.jp/policy/nisa2/know/',
  },
  {
    title: 'NISAに関するよくある質問',
    organization: '金融庁',
    url: 'https://www.fsa.go.jp/policy/nisa2/question/',
  },
  {
    title: 'つみたて投資枠対象商品',
    organization: '金融庁',
    url: 'https://www.fsa.go.jp/policy/nisa2/products/',
  },
  {
    title: 'NISAの活用事例',
    organization: '金融庁',
    url: 'https://www.fsa.go.jp/policy/nisa2/example/',
  },
  {
    title: '2027年からのNISA拡充',
    organization: '金融庁',
    url: 'https://www.fsa.go.jp/access/r7/273.html',
  },
] as const

const yenToMan = (yen: number) => Math.round(yen / 10000).toLocaleString('ja-JP')
const axisTicks = [0, 1000, 2000, 3000] as const
type ChartYear = typeof ARTICLE_CHART_YEARS[number]

function FutureValueComparison() {
  const [year, setYear] = useState<ChartYear>(15)
  return (
    <div className="nisa-comparison">
      <figure className="nisa-bank-chart nisa-comparison__figure" aria-labelledby="nisa-comparison-title">
        <figcaption>
          <h3 id="nisa-comparison-title">同じ積立期間で将来額を比較</h3>
          <p>毎月末積立・想定年率5%（概算）</p>
        </figcaption>
        <div className="nisa-comparison__control" role="group" aria-label="積立期間">
          {ARTICLE_CHART_YEARS.map(y => <button type="button" key={y} aria-pressed={year === y} onClick={() => setYear(y)}>{y}年</button>)}
        </div>
        <div className="nisa-comparison__legend">
          <span><i className="nisa-comparison__principal" aria-hidden="true" />積立元本</span>
          <span><i className="nisa-comparison__gain" aria-hidden="true" />運用益</span>
          <span className="nisa-comparison__unit">単位：万円</span>
        </div>
        <div className="nisa-comparison__axis" aria-hidden="true">
          {axisTicks.map(tick => <span key={tick} style={{ left: `${tick / ARTICLE_CHART_MAX_MAN * 100}%` }}>{tick.toLocaleString('ja-JP')}</span>)}
        </div>
        <div className="nisa-comparison__results" aria-live="polite" aria-atomic="true">
          {articleFutureValueSeries.map(series => {
            const point = series.points.find(p => p.years === year)
            return <div className="nisa-comparison__row" key={series.monthly} data-monthly={series.monthly} data-year={year}>
              <div className="nisa-comparison__row-heading"><strong>月{series.monthly / 10000}万円</strong>
                {point ? <strong className="nisa-comparison__amount">約{yenToMan(point.total)}<small>万円</small></strong> : <strong className="nisa-comparison__unmodeled">試算対象外</strong>}
              </div>
              {point ? <>
                <svg className="nisa-comparison__track" data-axis-max={ARTICLE_CHART_MAX_MAN} aria-hidden="true"
                  viewBox={`0 0 ${ARTICLE_CHART_MAX_MAN} 26`} preserveAspectRatio="none" width="100%" height="26">
                  <rect x="0" y="0" width={ARTICLE_CHART_MAX_MAN} height="26" fill="#f4f7f9" />
                  {axisTicks.map(tick => <line key={tick} x1={tick} x2={tick} y1="0" y2="26" stroke="#d4e1e8" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
                  <g className="nisa-comparison__bar" data-total={point.total}>
                    <rect x="0" y="0" width={point.principal / 10000} height="26" fill="#bed5df" />
                    <rect x={point.principal / 10000} y="0" width={point.gain / 10000} height="26" fill="#0e5d88" />
                  </g>
                </svg>
                <div className="nisa-comparison__breakdown"><span>元本 {yenToMan(point.principal)}万円</span><span>運用益 {yenToMan(point.gain)}万円</span></div>
              </> : <p className="nisa-comparison__excluded">15年で積立元本1,800万円に到達するため、20年間の継続積立は試算していません。保有・運用は継続できます。</p>}
            </div>
          })}
        </div>
        <p className="nisa-comparison__scale-note">すべての積立額・期間で同じ金額軸（0〜3,000万円）を使用しています。</p>
      </figure>
      <table className="nisa-comparison__table">
        <caption>積立期間別の将来資産額<span>（万円、概算）</span></caption>
        <thead><tr><th scope="col">期間</th>{articleFutureValueSeries.map(s => <th key={s.monthly} scope="col">月{s.monthly / 10000}万円</th>)}</tr></thead>
        <tbody>{ARTICLE_CHART_YEARS.map(y => <tr key={y} className={year === y ? 'is-selected' : undefined}>
          <th scope="row">{y}年</th>{articleFutureValueSeries.map(s => {
            const point = s.points.find(p => p.years === y)
            return <td key={s.monthly}>{point ? yenToMan(point.total) : <span className="nisa-comparison__excluded-cell">対象外<sup>※</sup></span>}</td>
          })}
        </tr>)}</tbody>
      </table>
      <p className="nisa-comparison__table-note">※ 月10万円の20年は、売却・枠の再利用をしない前提では非課税保有限度額を超えるため対象外です。15年後も非課税で保有・運用を継続できます。</p>
    </div>
  )
}

const articleSections = [
  ['basic', 'NISAとは'],
  ['benefits', 'NISAのメリット'],
  ['compare', '投資枠と使い分け'],
  ['cases', '積立額と将来額'],
  ['reuse', '売却と枠の再利用'],
  ['caution', '制度の注意点'],
  ['faq', 'よくある質問'],
  ['sources', '参考・一次資料'],
] as const
type ArticleSectionId = typeof articleSections[number][0]

function articleSectionFromHash(hash: string): ArticleSectionId {
  const id = hash.slice(1)
  if (id === 'tsumitate' || id === 'growth') return 'compare'
  return articleSections.find(([key]) => key === id)?.[0] ?? 'basic'
}

type TabKey = 'basic' | 'tsumitate' | 'growth'

function tabFromHash(hash: string): TabKey {
  if (hash === '#tsumitate') return 'tsumitate'
  if (hash === '#growth') return 'growth'
  return 'basic'
}

function NisaLimitsArticlePage() {
  const [activeTab, setActiveTab] = useState<TabKey>(() => (
    typeof window === 'undefined' ? 'basic' : tabFromHash(window.location.hash)
  ))

  const [activeSection, setActiveSection] = useState<ArticleSectionId>(() => (
    typeof window === 'undefined' ? 'basic' : articleSectionFromHash(window.location.hash)
  ))

  useEffect(() => {
    const syncTab = () => {
      setActiveTab(tabFromHash(window.location.hash))
      setActiveSection(articleSectionFromHash(window.location.hash))
    }
    const syncScroll = () => {
      const first = document.getElementById(articleSections[0][0])
      if (!first) return
      // The global page already reserves the sticky header via scroll-padding.
      // Match the browser's real anchor position rather than a hard-coded viewport threshold.
      const scrollPadding = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
      const scrollMargin = Number.parseFloat(getComputedStyle(first).scrollMarginTop) || 0
      const threshold = scrollPadding + scrollMargin + 24
      const sections = articleSections.flatMap(([id]) => {
        const node = document.getElementById(id)
        return node ? [{ id, rect: node.getBoundingClientRect() }] : []
      })
      if (!sections.some(s => s.rect.height > 0)) return
      const current = [...sections].reverse().find(s => s.rect.top <= threshold)
      setActiveSection(current?.id ?? 'basic')
    }
    window.addEventListener('scroll', syncScroll, { passive: true })
    window.addEventListener('hashchange', syncTab)
    window.addEventListener('popstate', syncTab)

    if (window.location.hash) {
      requestAnimationFrame(() => {
        const target = document.getElementById(window.location.hash.slice(1))
        target?.scrollIntoView({ behavior: 'auto', block: 'start' })
      })
    }

    return () => {
      window.removeEventListener('scroll', syncScroll)
      window.removeEventListener('hashchange', syncTab)
      window.removeEventListener('popstate', syncTab)
    }
  }, [])

  const navigateToSection = (
    event: ReactMouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) => {
    if (
      event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) {
      return
    }

    const target = document.getElementById(sectionId)
    if (!target) return

    event.preventDefault()
    const nextHash = `#${sectionId}`
    window.history.pushState({}, '', nextHash)
    setActiveTab(tabFromHash(nextHash))
    setActiveSection(articleSectionFromHash(nextHash))

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    target.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <SiteLayout className="dedicated-page knowledge-article-page nisa-guide-page nisa-bank-page">
      <main id="main-content">
        <header className="nisa-bank-hero">
          <div className="nisa-bank-hero__inner">
            <nav className="knowledge-article-breadcrumb" aria-label="パンくずリスト">
              <Link to={routes.home}>ホーム</Link>
              <span aria-hidden="true">›</span>
              <Link to={routes.knowledge}>お金の知識</Link>
              <span aria-hidden="true">›</span>
              <span aria-current="page">NISA</span>
            </nav>

            <div className="nisa-bank-hero__copy">
              <h1>NISAの非課税枠と、<br />積立額・将来額の考え方</h1>
              <p className="nisa-bank-hero__lead">
                NISAの制度を理解し、年間の投資枠や非課税保有限度額、
                積立額から将来いくらになるのかを、具体的な数字とともに整理します。
              </p>

              <dl className="nisa-bank-hero__meta">
                <div>
                  <dt>公開日</dt>
                  <dd><time dateTime="2026-09-21">2026.09.21</time></dd>
                </div>
                <div>
                  <dt>更新日</dt>
                  <dd><time dateTime="2026-10-14">2026.10.14</time></dd>
                </div>
                <div>
                  <dt>制度・情報の基準日</dt>
                  <dd><time dateTime="2026-10-14">2026.10.14</time></dd>
                </div>
              </dl>
            </div>
            <aside className="nisa-editorial-keyfacts" aria-label="現行NISAの投資枠">
              <div className="nisa-editorial-keyfacts__heading">
                <span>制度の要点</span>
                <span>2024年以降のNISA</span>
              </div>
              <dl>
                <div className="nisa-editorial-keyfacts__total">
                  <dt>非課税保有限度額</dt>
                  <dd><strong>1,800</strong><span>万円</span></dd>
                  <p>うち成長投資枠は1,200万円まで</p>
                </div>
                <div className="nisa-editorial-keyfacts__annual">
                  <div><dt>つみたて投資枠（年間）</dt><dd><strong>120</strong><span>万円</span></dd></div>
                  <div><dt>成長投資枠（年間）</dt><dd><strong>240</strong><span>万円</span></dd></div>
                </div>
              </dl>
            </aside>
          </div>
        </header>

        <div className="nisa-bank-nav-shell">
          <nav className="nisa-bank-tabs" aria-label="NISA制度メニュー">
            <a
              className={activeTab === 'basic' ? 'is-active' : undefined}
              aria-current={activeTab === 'basic' ? 'page' : undefined}
              href="#basic"
              onClick={(event) => navigateToSection(event, 'basic')}
            >
              NISAトップ
            </a>
            <a
              className={activeTab === 'tsumitate' ? 'is-active' : undefined}
              aria-current={activeTab === 'tsumitate' ? 'page' : undefined}
              href="#tsumitate"
              onClick={(event) => navigateToSection(event, 'tsumitate')}
            >
              つみたて投資枠
            </a>
            <a
              className={activeTab === 'growth' ? 'is-active' : undefined}
              aria-current={activeTab === 'growth' ? 'page' : undefined}
              href="#growth"
              onClick={(event) => navigateToSection(event, 'growth')}
            >
              成長投資枠
            </a>
          </nav>

          <nav className="nisa-bank-anchor-nav" aria-label="ページ内メニュー">
            <a href="#benefits" onClick={(event) => navigateToSection(event, 'benefits')}>NISAのメリット</a>
            <a href="#compare" onClick={(event) => navigateToSection(event, 'compare')}>投資枠の違い・活用例</a>
            <a href="#caution" onClick={(event) => navigateToSection(event, 'caution')}>制度の注意点</a>
            <a href="#faq" onClick={(event) => navigateToSection(event, 'faq')}>よくある質問</a>
          </nav>
        </div>

        <div className="nisa-bank-layout">
          <aside className="nisa-bank-sidebar" aria-label="この記事の内容">
            <section>
              <h2>この記事の内容</h2>
              <nav>
                {articleSections.map(([id, label]) => (
                  <a key={id} className={activeSection === id ? 'is-current' : undefined} aria-current={activeSection === id ? 'location' : undefined} href={`#${id}`} onClick={(event) => navigateToSection(event, id)}>{label}</a>
                ))}
              </nav>
            </section>

            <section className="nisa-bank-sidebar__related">
              <h2>関連コンテンツ</h2>
              <Link to={routes.nisa}>
                <StepCalculatorIcon />
                <span><strong className="nisa-bank-related-nisa">NISA<wbr />シミュレーター</strong><small>将来額を試算する</small></span>
              </Link>
              <Link to={routes.knowledge}>
                <TrustReliableIcon />
                <span><strong>お金の知識</strong><small>制度を基礎から確認</small></span>
              </Link>
              <Link to={routes.trust}>
                <GrowthChartIcon />
                <span><strong>信頼情報</strong><small>情報源・計算方針を見る</small></span>
              </Link>
            </section>
          </aside>

          <article className="nisa-bank-article">
            <section className="nisa-bank-section" id="basic">
              <header className="nisa-bank-section__heading">
                
                <h2>NISAとは</h2>
              </header>
              <p className="nisa-bank-section__intro">
                NISA（少額投資非課税制度）は、一定の投資枠の範囲内で購入した
                上場株式や投資信託などから得られる売却益・配当・分配金を非課税にする制度です。
                2024年から非課税保有期間が無期限となり、制度自体も恒久化されました。
              </p>

              <figure className="nisa-bank-editorial-illustration">
                <img
                  src="/article-media/nisa-questions-illustration.webp"
                  alt="NISAを始める時期、毎月の積立額、制度の使い分け、損失への不安について考える二人のイラスト"
                  loading="lazy"
                  decoding="async"
                />
              </figure>

              <dl className="nisa-bank-facts" aria-label="NISA利用の基本条件">
                <div><dt>対象者</dt><dd>日本国内に住む18歳以上<br /><small>利用する年の1月1日時点</small></dd></div>
                <div><dt>口座数</dt><dd>1人につき1口座</dd></div>
                <div><dt>金融機関</dt><dd>年単位で変更可能</dd></div>
                <div><dt>非課税保有期間</dt><dd>無期限</dd></div>
              </dl>

              <aside className="nisa-bank-update">
                <strong>2027年1月から、つみたて投資枠は未成年にも拡大</strong>
                <p>
                  0〜17歳はつみたて投資枠のみ利用でき、年間投資枠60万円、
                  非課税保有限度額600万円となる予定です。未成年の間は金融機関の変更ができず、
                  保有資産の払出しにも原則として制限があります。
                </p>
              </aside>
            </section>

            <section className="nisa-bank-section" id="benefits">
              <header className="nisa-bank-section__heading">
                
                <h2>NISAのメリットは「利益に税金がかからない」こと</h2>
              </header>
              <p className="nisa-bank-section__intro">
                通常の課税口座では、上場株式等の売却益や配当などに原則20.315%の税率がかかります。
                NISA口座では、制度の対象となる利益が非課税になるため、同じ運用成果でも手元に残る金額が変わります。
              </p>

              <figure className="nisa-bank-tax" aria-labelledby="nisa-bank-tax-title">
                <figcaption id="nisa-bank-tax-title">
                  <strong>100万円の利益が出た場合の税金の違い</strong>
                  <span>手数料等を考慮せず、税率20.315%で比較した例</span>
                </figcaption>

                <div className="nisa-bank-tax__compare">
                  <section className="nisa-bank-tax__account">
                    <h3>通常の課税口座</h3>
                    <p>（特定口座・一般口座など）</p>
                    <strong className="nisa-bank-tax__rate">税率 20.315%</strong>
                    <span className="nisa-bank-tax__message">203,150円が税金として差し引かれます</span>
                    <div className="nisa-bank-tax__bar is-taxable" role="img" aria-label="利益100万円のうち税金20万3150円、税引後79万6850円">
                      <div className="nisa-bank-tax__tax">
                        <small>税金</small>
                        <strong>203,150円</strong>
                      </div>
                      <div className="nisa-bank-tax__net">
                        <small>手元に残る利益</small>
                        <strong>796,850円</strong>
                      </div>
                    </div>
                  </section>

                  <section className="nisa-bank-tax__account is-nisa">
                    <h3>NISA口座（非課税）</h3>
                    <p>制度の対象となる運用益</p>
                    <strong className="nisa-bank-tax__rate">税率 0%</strong>
                    <span className="nisa-bank-tax__message">利益は非課税です</span>
                    <div className="nisa-bank-tax__bar is-nisa" role="img" aria-label="利益100万円が非課税で100万円">
                      <div className="nisa-bank-tax__net">
                        <small>手元に残る利益</small>
                        <strong>1,000,000円</strong>
                      </div>
                    </div>
                  </section>

                  <aside className="nisa-bank-tax__difference" aria-label="税額差のまとめ">
                    <small>税額差</small>
                    <strong>203,150円</strong>
                    <span>同じ100万円の利益でも、NISAでは差し引かれない税額です。</span>
                  </aside>
                </div>

                <p className="nisa-bank-note">
                  ※ 実際の税額は取引内容等により異なります。
                </p>
              </figure>

              <div className="nisa-bank-reading-note">
                <strong>国内上場株式の配当金は、受取方法も確認</strong>
                <p>
                  NISA口座で購入した国内上場株式・ETF・REITの配当や分配金を非課税にするには、
                  証券会社の口座で受け取る「株式数比例配分方式」を選ぶ必要があります。
                  銀行口座で受け取る方式などでは、NISAで保有していても課税される場合があります。
                </p>
              </div>
            </section>

            <section className="nisa-bank-section" id="compare">
              <header className="nisa-bank-section__heading">
                
                <h2>年間投資枠と非課税保有限度額</h2>
              </header>
              <p className="nisa-bank-section__intro">
                NISAには「つみたて投資枠」と「成長投資枠」があり、同じNISA口座で併用できます。
                年間に新しく買える金額と、生涯を通じて非課税で保有できる総枠は別の上限です。
              </p>

              <div className="nisa-bank-table-wrap" role="region" aria-label="NISA投資枠比較表">
                <table className="nisa-bank-table">
                  <thead>
                    <tr>
                      <th>項目</th>
                      <th>つみたて投資枠</th>
                      <th>成長投資枠</th>
                      <th>合計</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th>年間投資枠</th>
                      <td>120万円</td>
                      <td>240万円</td>
                      <td><strong>360万円</strong></td>
                    </tr>
                    <tr>
                      <th>非課税保有限度額<br />（生涯）</th>
                      <td colSpan={3}><strong>1,800万円</strong><br /><small>うち成長投資枠は1,200万円まで</small></td>
                    </tr>
                    <tr>
                      <th>非課税保有期間</th>
                      <td>無期限</td>
                      <td>無期限</td>
                      <td>—</td>
                    </tr>
                    <tr>
                      <th>主な対象商品</th>
                      <td>長期・積立・分散投資に適した一定の商品</td>
                      <td>上場株式・投資信託等</td>
                      <td>—</td>
                    </tr>
                    <tr>
                      <th>投資方法</th>
                      <td>積立</td>
                      <td>積立・一括</td>
                      <td>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="nisa-bank-frame-details">
                <section id="tsumitate">
                  <h3>つみたて投資枠</h3>
                  <p>
                    年間120万円まで。長期の積立・分散投資に適した一定の投資信託等が対象で、
                    定期的に少額から積み立てたい場合に使いやすい枠です。
                  </p>
                  <ul>
                    <li>毎月10万円なら、年間120万円で年間投資枠を使い切る計算です。</li>
                    <li>つみたて投資枠だけで、非課税保有限度額1,800万円を使い切ることもできます。</li>
                    <li>対象商品は金融庁の届出一覧で確認できます。</li>
                  </ul>
                </section>

                <section id="growth">
                  <h3>成長投資枠</h3>
                  <p>
                    年間240万円まで。上場株式や投資信託等が対象で、
                    積立だけでなく、まとまった資金を使った一括投資にも利用できます。
                  </p>
                  <ul>
                    <li>成長投資枠だけを利用することもできます。</li>
                    <li>ただし成長投資枠として使える非課税保有限度額は1,200万円までです。</li>
                    <li>整理・監理銘柄や、毎月分配型など一定の投資信託は対象外です。</li>
                  </ul>
                </section>
              </div>

              <div className="nisa-bank-reading-note">
                <strong>2つの枠は別々の金融機関では使えません</strong>
                <p>
                  つみたて投資枠と成長投資枠は、一つの金融機関のNISA口座で利用します。
                  金融機関自体は年単位で変更できます。
                </p>
              </div>
            </section>

            <section className="nisa-bank-section" id="cases">
              <header className="nisa-bank-section__heading">
                
                <h2>積立額からみる将来額の例</h2>
              </header>
              <p className="nisa-bank-section__intro">
                毎月一定額を積み立て、年率5%で運用できたと仮定した場合の将来額を比較します。
                NISAそのものが利回りを生むわけではなく、実際の結果は選ぶ商品・市場環境・投資期間によって変わります。
              </p>

              <FutureValueComparison />

              <div className="nisa-bank-chart-reading">
                <div><strong>月1万円</strong><span>年間12万円。少額から長く続ける場合の例。</span></div>
                <div><strong>月5万円</strong><span>年間60万円。20年積み立てても元本は1,200万円。</span></div>
                <div><strong>月10万円</strong><span>年間120万円。15年で元本1,800万円に到達。</span></div>
              </div>

              <p className="nisa-bank-note">
                ※ 毎月末に積み立て、年率5%（実効年率）を月利（1.05の12乗根−1）に換算して複利運用した場合の概算です。
                手数料・税金等は考慮していません。将来の運用成果を保証するものではありません。
                既存のNISA利用額は0円とし、つみたて投資枠のみを利用し、売却による枠の再利用は行わない前提です。
              </p>

              <Link className="nisa-bank-inline-cta" to={routes.nisa}>
                <span>
                  <small>自分の条件で確認</small>
                  NISAシミュレーターで積立額・期間・想定利回りを試算する
                </span>
                <ArrowRightIcon />
              </Link>
            </section>

            <section className="nisa-bank-section" id="reuse">
              <header className="nisa-bank-section__heading">
                
                <h2>売却したとき、非課税保有限度額はどうなる？</h2>
              </header>
              <p className="nisa-bank-section__intro">
                NISA口座の商品は必要なときに売却できます。
                売却すると、翌年以降に「売却時の時価」ではなく「購入時の金額（簿価）」分の
                非課税保有限度額を再利用できます。
              </p>

              <div className="nisa-bank-reuse-flow" role="region" aria-label="NISA売却後の非課税保有限度額再利用例">
                <div><small>購入時</small><strong>100万円</strong><span>簿価</span></div>
                <b aria-hidden="true">→</b>
                <div><small>売却時</small><strong>130万円</strong><span>時価の例</span></div>
                <b aria-hidden="true">→</b>
                <div className="is-result"><small>翌年以降に再利用</small><strong>100万円</strong><span>簿価分が復活</span></div>
              </div>

              <div className="nisa-bank-reading-note">
                <strong>復活した総枠が、年間投資枠に上乗せされるわけではありません</strong>
                <p>
                  100万円分の非課税保有限度額が再利用できるようになっても、
                  その年に投資できる年間上限は、つみたて投資枠120万円・成長投資枠240万円の範囲内です。
                </p>
              </div>
            </section>

            <section className="nisa-bank-section" id="caution">
              <header className="nisa-bank-section__heading">
                
                <h2>NISAを利用する際の注意点</h2>
              </header>

              <div className="nisa-bank-caution">
                <span className="nisa-bank-caution__icon" aria-hidden="true">
                  <TrustDisclaimerIcon />
                </span>
                <ul>
                  <li><strong>元本保証ではありません。</strong> 投資商品の価格変動によって損失が生じる可能性があります。</li>
                  <li><strong>NISA口座の損失は損益通算できません。</strong> 特定口座・一般口座の利益との損益通算や、損失の繰越控除はできません。</li>
                  <li><strong>対象商品には条件があります。</strong> つみたて投資枠は金融庁の基準を満たす一定の商品、成長投資枠にも除外商品があります。</li>
                  <li><strong>上場株式の配当受取方法に注意が必要です。</strong> 非課税扱いを受けるには株式数比例配分方式の確認が重要です。</li>
                  <li><strong>投資枠は目標額ではありません。</strong> 360万円や1,800万円まで使い切る必要はなく、生活資金と分けて無理のない金額を決めます。</li>
                </ul>
              </div>
            </section>

            <div className="nisa-bank-bottom-grid">
              <section className="nisa-bank-section nisa-bank-faq" id="faq">
                <header className="nisa-bank-section__heading">
                  
                  <h2>よくある質問</h2>
                </header>

                <details>
                  <summary><span>Q</span>年間360万円まで投資する必要がありますか？</summary>
                  <p>
                    いいえ。360万円は年間の上限です。家計・目的・投資期間に合わせて、
                    無理のない金額を利用します。
                  </p>
                </details>

                <details>
                  <summary><span>Q</span>つみたて投資枠だけ、または成長投資枠だけでも使えますか？</summary>
                  <p>
                    可能です。つみたて投資枠だけで総枠1,800万円を使うこともできます。
                    成長投資枠だけの場合、成長投資枠として利用できる総枠は1,200万円です。
                  </p>
                </details>

                <details>
                  <summary><span>Q</span>2つの投資枠を別々の金融機関で使えますか？</summary>
                  <p>
                    できません。つみたて投資枠と成長投資枠は同一の金融機関で利用します。
                    金融機関の変更は年単位で可能です。
                  </p>
                </details>

                <details>
                  <summary><span>Q</span>商品を売却したら、枠はすぐに戻りますか？</summary>
                  <p>
                    非課税保有限度額は、売却した商品の簿価分を翌年以降に再利用できます。
                    再利用分がその年の年間投資枠に上乗せされるわけではありません。
                  </p>
                </details>

                <details>
                  <summary><span>Q</span>2023年までのNISA商品を新しいNISAへ移せますか？</summary>
                  <p>
                    2024年からのNISAへロールオーバーすることはできません。
                    旧制度の商品は現行NISAの1,800万円とは外枠で管理され、旧制度の非課税期間が適用されます。
                  </p>
                </details>
              </section>

              <section className="nisa-bank-section nisa-bank-sources" id="sources">
                <header className="nisa-bank-section__heading">
                  
                  <h2>参考・一次資料</h2>
                </header>
                <p className="nisa-bank-sources__intro">
                  制度変更があるため、最終判断前には金融庁等の最新情報も確認してください。
                </p>
                <ul>
                  {sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        <span>{source.title}</span>
                        <small>{source.organization}</small>
                        <b aria-hidden="true">↗</b>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </article>
        </div>

        <div className="nisa-bank-sticky-cta" aria-label="NISAの次のアクション">
          <div className="nisa-bank-sticky-cta__inner">
            <Link className="nisa-bank-sticky-cta__primary" to={routes.nisa}>
              <StepCalculatorIcon />
              <span>NISAシミュレーターで試算する</span>
              <ArrowRightIcon />
            </Link>
            <a
              className="nisa-bank-sticky-cta__secondary"
              href="https://www.fsa.go.jp/policy/nisa2/know/"
              target="_blank"
              rel="noreferrer"
            >
              <span>金融庁のNISA公式情報を確認</span>
              <b aria-hidden="true">↗</b>
            </a>
          </div>
        </div>
      </main>
    </SiteLayout>
  )
}

export default NisaLimitsArticlePage
