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
] as const

type FutureValuePoint = {
  years: number
  principal: number
  total: number
}

type FutureValueChartProps = {
  monthly: number
  points: FutureValuePoint[]
  maxValue: number
}

function FutureValueChart({
  monthly,
  points,
  maxValue,
}: FutureValueChartProps) {
  const twentyYears = points[points.length - 1]

  return (
    <figure
      className="nisa-bank-chart"
      aria-label={`毎月${monthly.toLocaleString('ja-JP')}円を年率5%で積み立てた場合の将来額`}
    >
      <figcaption>
        <strong>毎月{(monthly / 10000).toLocaleString('ja-JP')}万円を積み立てた場合</strong>
        <span>
          <i className="is-principal" aria-hidden="true" />
          積立元本
          <i className="is-growth" aria-hidden="true" />
          運用後の資産額（年率5%）
        </span>
      </figcaption>

      <div className="nisa-bank-chart__callout">
        <small>20年後</small>
        <strong>約{twentyYears.total.toLocaleString('ja-JP')}万円</strong>
        <span>元本 {twentyYears.principal.toLocaleString('ja-JP')}万円</span>
      </div>

      <div className="nisa-bank-chart__plot">
        <div className="nisa-bank-chart__grid" aria-hidden="true" />
        {points.map((point) => {
          const totalHeight = Math.max((point.total / maxValue) * 100, 3)
          const principalRatio = point.principal / point.total

          return (
            <div className="nisa-bank-chart__column" key={point.years}>
              <div className="nisa-bank-chart__bar-wrap">
                <div
                  className="nisa-bank-chart__bar"
                  style={{ height: `${totalHeight}%` }}
                  aria-hidden="true"
                >
                  <span
                    className="nisa-bank-chart__principal"
                    style={{ height: `${principalRatio * 100}%` }}
                  />
                  <span className="nisa-bank-chart__growth" />
                </div>
              </div>
              <span className="nisa-bank-chart__year">{point.years}年</span>
            </div>
          )
        })}
      </div>
      <div className="nisa-bank-chart__unit">（万円）</div>
    </figure>
  )
}

const futureValueSeries = [
  {
    monthly: 10000,
    maxValue: 450,
    points: [
      { years: 5, principal: 60, total: 68 },
      { years: 10, principal: 120, total: 155 },
      { years: 15, principal: 180, total: 267 },
      { years: 20, principal: 240, total: 411 },
    ],
  },
  {
    monthly: 50000,
    maxValue: 2200,
    points: [
      { years: 5, principal: 300, total: 340 },
      { years: 10, principal: 600, total: 776 },
      { years: 15, principal: 900, total: 1336 },
      { years: 20, principal: 1200, total: 2055 },
    ],
  },
  {
    monthly: 100000,
    maxValue: 4400,
    points: [
      { years: 5, principal: 600, total: 680 },
      { years: 10, principal: 1200, total: 1553 },
      { years: 15, principal: 1800, total: 2673 },
      { years: 20, principal: 2400, total: 4110 },
    ],
  },
] as const

function NisaLimitsArticlePage() {
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
              <p className="nisa-bank-hero__eyebrow">NISA / DECISION GUIDE</p>
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
                  <dt>制度・情報の基準日</dt>
                  <dd><time dateTime="2026-10-04">2026.10.04</time></dd>
                </div>
              </dl>
            </div>
          </div>
        </header>

        <div className="nisa-bank-nav-shell">
          <nav className="nisa-bank-tabs" aria-label="NISA制度メニュー">
            <a className="is-active" href="#basic">NISAトップ</a>
            <a href="#tsumitate">つみたて投資枠</a>
            <a href="#growth">成長投資枠</a>
          </nav>
          <nav className="nisa-bank-anchor-nav" aria-label="ページ内メニュー">
            <a href="#caution">制度の注意点</a>
            <a href="#compare">投資枠の違い・活用例</a>
            <a href="#benefits">NISAのメリット</a>
            <a href="#faq">Q&amp;A</a>
          </nav>
        </div>

        <div className="nisa-bank-layout">
          <aside className="nisa-bank-sidebar" aria-label="この記事の内容">
            <section>
              <h2>この記事の内容</h2>
              <nav>
                <a className="is-current" href="#basic"><span>01</span>NISAとは</a>
                <a href="#compare"><span>02</span>年間投資枠と<br />非課税保有限度額</a>
                <a href="#cases"><span>03</span>積立額からみる<br />将来額の例</a>
                <a href="#caution"><span>04</span>NISAを利用する際の注意点</a>
                <a href="#faq"><span>05</span>よくある質問（Q&amp;A）</a>
                <a href="#sources"><span>06</span>参考・一次資料</a>
              </nav>
            </section>

            <section className="nisa-bank-sidebar__related">
              <h2>関連コンテンツ</h2>
              <Link to={routes.nisa}>
                <StepCalculatorIcon />
                <span><strong>NISAシミュレーター</strong><small>将来額を試算する</small></span>
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
                <span>01</span>
                <h2>NISAとは</h2>
              </header>
              <p className="nisa-bank-section__intro">
                NISA（少額投資非課税制度）は、一定の投資枠の範囲内で得られた
                上場株式や投資信託などの運用益が非課税になる制度です。
                通常の課税口座では利益に税金がかかりますが、NISA口座では制度の対象となる利益が非課税になります。
              </p>

              <figure className="nisa-bank-tax" id="benefits" aria-labelledby="nisa-bank-tax-title">
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

                  <aside className="nisa-bank-tax__difference">
                    <small>税額差</small>
                    <strong>203,150円</strong>
                  </aside>
                </div>

                <p className="nisa-bank-note">
                  ※ 税率20.315%は上場株式等の譲渡益等にかかる税率の例です。
                  実際の税額は取引内容等により異なります。
                </p>
              </figure>
            </section>

            <section className="nisa-bank-section" id="compare">
              <header className="nisa-bank-section__heading">
                <span>02</span>
                <h2>年間投資枠と非課税保有限度額</h2>
              </header>
              <p className="nisa-bank-section__intro">
                NISAには「つみたて投資枠」と「成長投資枠」があり、2つの枠を併用できます。
                年間投資枠と、生涯を通じた非課税保有限度額を分けて確認します。
              </p>

              <div className="nisa-bank-table-wrap" role="region" aria-label="NISA投資枠比較表">
                <table className="nisa-bank-table">
                  <thead>
                    <tr>
                      <th>項目</th>
                      <th id="tsumitate">つみたて投資枠</th>
                      <th id="growth">成長投資枠</th>
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
            </section>

            <section className="nisa-bank-section" id="cases">
              <header className="nisa-bank-section__heading">
                <span>03</span>
                <h2>積立額からみる将来額の例</h2>
              </header>
              <p className="nisa-bank-section__intro">
                毎月一定額を積み立て、年率5%で運用できたと仮定した場合の将来額を比較します。
                積立額・期間・運用利回りによって結果は変わります。
              </p>

              <div className="nisa-bank-chart-grid">
                {futureValueSeries.map((series) => (
                  <FutureValueChart
                    key={series.monthly}
                    monthly={series.monthly}
                    points={series.points.map((point) => ({ ...point }))}
                    maxValue={series.maxValue}
                  />
                ))}
              </div>

              <p className="nisa-bank-note">
                ※ 毎月末に積み立て、年率5%を月次換算して複利運用した場合の概算です。
                手数料・税金等は考慮していません。将来の運用成果を保証するものではありません。
              </p>
            </section>

            <section className="nisa-bank-section" id="caution">
              <header className="nisa-bank-section__heading">
                <span>04</span>
                <h2>NISAを利用する際の注意点</h2>
              </header>

              <div className="nisa-bank-caution">
                <span className="nisa-bank-caution__icon" aria-hidden="true">
                  <TrustDisclaimerIcon />
                </span>
                <ul>
                  <li>NISAは元本保証のある制度ではありません。投資商品の価格は変動します。</li>
                  <li>非課税の対象となる範囲や対象商品には制度上の条件があります。</li>
                  <li>非課税保有限度額は、売却した商品の簿価分を翌年以降に再利用できます。</li>
                  <li>制度内容は変更される可能性があります。最新情報は金融庁等の一次資料で確認してください。</li>
                </ul>
              </div>
            </section>

            <div className="nisa-bank-bottom-grid">
              <section className="nisa-bank-section nisa-bank-faq" id="faq">
                <header className="nisa-bank-section__heading">
                  <span>05</span>
                  <h2>よくある質問（Q&amp;A）</h2>
                </header>
                <details>
                  <summary><span>Q</span>NISAはいつから始めるのがよいですか？</summary>
                  <p>
                    開始時期だけで判断せず、家計・投資目的・投資期間を確認し、
                    無理のない範囲で検討することが大切です。
                  </p>
                </details>
                <details>
                  <summary><span>Q</span>年間360万円まで投資する必要がありますか？</summary>
                  <p>いいえ。360万円は年間の上限であり、利用額は家計や目的に応じて決めます。</p>
                </details>
              </section>

              <section className="nisa-bank-section nisa-bank-sources" id="sources">
                <header className="nisa-bank-section__heading">
                  <span>06</span>
                  <h2>参考・一次資料</h2>
                </header>
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
