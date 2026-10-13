import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { routes } from '../../app/routes'
import {
  ArrowRightIcon,
  GrowthChartIcon,
  StepCalculatorIcon,
  StepInputIcon,
  StepResultsIcon,
  TrustDisclaimerIcon,
  TrustReliableIcon,
  TrustUpdateIcon,
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
] as const

const contributionCaseA = [
  { label: '1年', value: 60 },
  { label: '5年', value: 300 },
  { label: '10年', value: 600 },
  { label: '15年', value: 900 },
  { label: '20年', value: 1200 },
  { label: '30年', value: 1800 },
]

const contributionCaseB = [
  { label: '1年', value: 100 },
  { label: '2年', value: 200 },
  { label: '4年', value: 400 },
  { label: '6年', value: 600 },
  { label: '8年', value: 800 },
  { label: '10年', value: 1000 },
]

type ContributionChartProps = {
  title: string
  unitLabel: string
  description: string
  points: { label: string; value: number }[]
}

function ContributionChart({
  title,
  unitLabel,
  description,
  points,
}: ContributionChartProps) {
  const max = Math.max(...points.map((point) => point.value))

  return (
    <figure className="nisa-guide-chart" aria-label={title}>
      <figcaption>
        <strong>{title}</strong>
        <span>{description}</span>
      </figcaption>
      <div className="nisa-guide-chart__unit">{unitLabel}</div>
      <div className="nisa-guide-chart__plot">
        {points.map((point) => (
          <div className="nisa-guide-chart__column" key={point.label}>
            <span className="nisa-guide-chart__value">
              {point.value.toLocaleString('ja-JP')}
            </span>
            <span className="nisa-guide-chart__track" aria-hidden="true">
              <span
                className="nisa-guide-chart__fill"
                style={{ height: `${(point.value / max) * 100}%` }}
              />
            </span>
            <span className="nisa-guide-chart__label">{point.label}</span>
          </div>
        ))}
      </div>
    </figure>
  )
}

type PointCardProps = {
  eyebrow: string
  title: string
  children: ReactNode
  icon: ReactNode
}

function PointCard({ eyebrow, title, children, icon }: PointCardProps) {
  return (
    <article className="nisa-guide-point-card">
      <span className="nisa-guide-point-card__icon" aria-hidden="true">{icon}</span>
      <div>
        <small>{eyebrow}</small>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </article>
  )
}

function NisaLimitsArticlePage() {
  return (
    <SiteLayout className="dedicated-page knowledge-article-page nisa-guide-page">
      <main id="main-content">
        <header className="knowledge-article-hero">
          <div className="knowledge-article-hero__inner">
            <nav className="knowledge-article-breadcrumb" aria-label="パンくずリスト">
              <Link to={routes.home}>ホーム</Link>
              <span aria-hidden="true">›</span>
              <Link to={routes.knowledge}>お金の知識</Link>
              <span aria-hidden="true">›</span>
              <span aria-current="page">NISA</span>
            </nav>
            <p className="info-eyebrow">NISA PLANNING</p>
            <h1>NISAの非課税枠と、積立額・将来額の考え方</h1>
            <p className="knowledge-article-hero__lead">
              NISAは投資から得られる利益が非課税になる制度です。
              年間の投資枠と、生涯の非課税保有限度額、実際の積立額を分けて整理します。
            </p>
            <dl className="knowledge-article-meta">
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
        </header>

        <div className="knowledge-article-layout nisa-guide-layout">
          <article className="knowledge-article-body nisa-guide-body">
            <section className="nisa-guide-overview" aria-labelledby="nisa-guide-overview-title">
              <div>
                <p className="nisa-guide-overview__eyebrow">ARTICLE GUIDE</p>
                <h2 id="nisa-guide-overview-title">この記事で分かること</h2>
                <ul className="nisa-guide-overview__list">
                  <li>NISAの年間投資枠と非課税保有限度額の違い</li>
                  <li>つみたて投資枠と成長投資枠の使い分け</li>
                  <li>制度上の上限と、自分が積み立てる金額・将来額の違い</li>
                </ul>
              </div>
              <dl className="nisa-guide-keyfacts" aria-label="NISAの主な制度数値">
                <div>
                  <dt>運用益</dt>
                  <dd>非課税</dd>
                </div>
                <div>
                  <dt>年間投資枠</dt>
                  <dd><strong>360</strong>万円</dd>
                </div>
                <div>
                  <dt>非課税保有限度額</dt>
                  <dd><strong>1,800</strong>万円</dd>
                </div>
              </dl>
            </section>

            <nav className="nisa-guide-tabs" aria-label="NISA制度メニュー">
              <a className="is-active" href="#basic">NISAトップ</a>
              <a href="#tsumitate">つみたて投資枠</a>
              <a href="#growth">成長投資枠</a>
            </nav>

            <nav className="nisa-guide-jump" aria-label="ページ内メニュー">
              <a href="#caution">制度の注意点</a>
              <a href="#compare">投資枠の違い</a>
              <a href="#cases">活用例</a>
              <a href="#faq">Q&amp;A</a>
            </nav>

            <section id="basic">
              <h2>NISAとは</h2>
              <p>
                通常の課税口座では、上場株式や投資信託などから得た利益に税金がかかります。
                NISA口座では、制度の対象となる利益が非課税になります。
              </p>

              <figure className="nisa-guide-tax-figure" aria-labelledby="nisa-guide-tax-title">
                <figcaption id="nisa-guide-tax-title">
                  <strong>100万円の利益が出た場合</strong>
                  <span>手数料等を考慮せず、税率20.315%で比較した例</span>
                </figcaption>

                <div className="nisa-guide-tax-compare">
                  <section className="nisa-guide-tax-card" aria-label="通常の課税口座">
                    <header>
                      <span>通常の課税口座</span>
                      <strong>税率 20.315%</strong>
                    </header>
                    <div
                      className="nisa-guide-tax-stack"
                      role="img"
                      aria-label="利益100万円のうち税金20万3150円、税引後79万6850円"
                    >
                      <div className="nisa-guide-tax-stack__tax">
                        <span>税金</span>
                        <strong>203,150円</strong>
                      </div>
                      <div className="nisa-guide-tax-stack__net">
                        <span>税引後</span>
                        <strong>796,850円</strong>
                      </div>
                    </div>
                  </section>

                  <section className="nisa-guide-tax-card is-nisa" aria-label="NISA口座">
                    <header>
                      <span>NISA口座</span>
                      <strong>税率 0%</strong>
                    </header>
                    <div
                      className="nisa-guide-tax-stack"
                      role="img"
                      aria-label="利益100万円が非課税で100万円"
                    >
                      <div className="nisa-guide-tax-stack__tax is-zero">
                        <span>税金</span>
                        <strong>0円</strong>
                      </div>
                      <div className="nisa-guide-tax-stack__net">
                        <span>利益</span>
                        <strong>1,000,000円</strong>
                      </div>
                    </div>
                  </section>
                </div>

                <p className="nisa-guide-figure-note">
                  ※ NISAは元本や利益を保証する制度ではありません。上記は税制の違いを説明するための例です。
                </p>
              </figure>
            </section>

            <section id="caution">
              <h2>事前に確認したいNISA制度の注意点</h2>
              <div className="nisa-guide-accordion">
                <details>
                  <summary>NISAは元本を保証する制度ではありません</summary>
                  <p>税制優遇制度であり、投資商品の価格変動による損失は生じる可能性があります。</p>
                </details>
                <details>
                  <summary>年間投資枠と非課税保有限度額は別です</summary>
                  <p>1年ごとの投資上限と、生涯を通じた非課税保有の総枠を分けて確認します。</p>
                </details>
                <details>
                  <summary>売却した枠の再利用時期にはルールがあります</summary>
                  <p>売却した商品の簿価分は、翌年以降に非課税保有限度額として再利用できます。</p>
                </details>
              </div>
            </section>

            <section id="compare">
              <h2>つみたて投資枠と成長投資枠の違い</h2>
              <p>
                2つの枠は併用できます。年間の上限と、生涯を通じた非課税保有限度額を別々に確認します。
              </p>

              <div className="nisa-guide-frame-grid" role="region" aria-label="NISAの投資枠比較">
                <article id="tsumitate">
                  <div className="nisa-guide-frame-grid__icon">
                    <StepInputIcon />
                  </div>
                  <h3>つみたて投資枠</h3>
                  <strong className="nisa-guide-frame-grid__amount">年間120万円</strong>
                  <dl>
                    <div><dt>買付方法</dt><dd>積立買付</dd></div>
                    <div><dt>対象商品</dt><dd>長期・積立・分散投資に適した一定の商品</dd></div>
                    <div><dt>非課税期間</dt><dd>無期限</dd></div>
                  </dl>
                </article>
                <article id="growth">
                  <div className="nisa-guide-frame-grid__icon">
                    <GrowthChartIcon />
                  </div>
                  <h3>成長投資枠</h3>
                  <strong className="nisa-guide-frame-grid__amount">年間240万円</strong>
                  <dl>
                    <div><dt>買付方法</dt><dd>積立・一括</dd></div>
                    <div><dt>対象商品</dt><dd>上場株式・投資信託等</dd></div>
                    <div><dt>非課税期間</dt><dd>無期限</dd></div>
                  </dl>
                </article>
              </div>

              <div className="nisa-guide-total-limit">
                <span>非課税保有限度額</span>
                <strong>合計1,800万円</strong>
                <small>うち成長投資枠は1,200万円まで</small>
              </div>
            </section>

            <section id="cases">
              <h2>積立額を自分の家計に置き換えて考える</h2>
              <p>
                次のグラフは運用収益を含めず、積み立てた元本だけを示しています。
                投資額を決めるときは、生活費や近い将来に使うお金と分けて考えます。
              </p>

              <div className="nisa-guide-case-list">
                <article className="nisa-guide-case">
                  <header>
                    <span>CASE A</span>
                    <div>
                      <h3>毎月5万円を積み立てる</h3>
                      <p>年間60万円。つみたて投資枠の範囲内で継続する例です。</p>
                    </div>
                  </header>
                  <ContributionChart
                    title="毎月5万円の積立元本"
                    unitLabel="単位：万円"
                    description="運用収益を含まない積立元本"
                    points={contributionCaseA}
                  />
                </article>

                <article className="nisa-guide-case">
                  <header>
                    <span>CASE B</span>
                    <div>
                      <h3>積立に加えて追加投資する</h3>
                      <p>毎月5万円の積立に、成長投資枠で年40万円を追加する例です。</p>
                    </div>
                  </header>
                  <ContributionChart
                    title="年間100万円を投資した場合の元本"
                    unitLabel="単位：万円"
                    description="毎月5万円×12か月＋年40万円。運用収益は含みません"
                    points={contributionCaseB}
                  />
                </article>
              </div>

              <Link className="knowledge-inline-cta" to={routes.nisa}>
                NISAシミュレーターで積立額と期間を試算する
                <ArrowRightIcon className="nisa-guide-inline-arrow" />
              </Link>
            </section>

            <section>
              <h2>NISAを理解するうえで押さえておきたいポイント</h2>
              <div className="nisa-guide-point-grid">
                <PointCard
                  eyebrow="POINT 1"
                  title="年間枠と総枠を分ける"
                  icon={<TrustReliableIcon />}
                >
                  年間360万円と非課税保有限度額1,800万円は、役割の異なる上限です。
                </PointCard>
                <PointCard
                  eyebrow="POINT 2"
                  title="元本保証ではない"
                  icon={<TrustDisclaimerIcon />}
                >
                  税制優遇と、投資商品の価格変動リスクは別々に確認します。
                </PointCard>
                <PointCard
                  eyebrow="POINT 3"
                  title="売却後の再利用を確認"
                  icon={<TrustUpdateIcon />}
                >
                  売却した年の年間投資枠が、その場で増えるわけではありません。
                </PointCard>
                <PointCard
                  eyebrow="POINT 4"
                  title="試算結果を保証と受け取らない"
                  icon={<StepCalculatorIcon />}
                >
                  想定利回りを使った将来額は、条件に基づくシミュレーションです。
                </PointCard>
              </div>
            </section>

            <section>
              <h2>制度を知ってから試算する5ステップ</h2>
              <ol className="nisa-guide-steps">
                <li>
                  <span className="nisa-guide-steps__icon"><StepInputIcon /></span>
                  <div><b>1</b><strong>制度を知る</strong><small>非課税の仕組みと投資枠を確認します。</small></div>
                </li>
                <li>
                  <span className="nisa-guide-steps__icon"><StepCalculatorIcon /></span>
                  <div><b>2</b><strong>毎月額を決める</strong><small>生活資金と分け、無理のない金額を設定します。</small></div>
                </li>
                <li>
                  <span className="nisa-guide-steps__icon"><StepResultsIcon /></span>
                  <div><b>3</b><strong>将来額を試算</strong><small>期間・想定利回りを変えて比較します。</small></div>
                </li>
                <li>
                  <span className="nisa-guide-steps__icon"><TrustDisclaimerIcon /></span>
                  <div><b>4</b><strong>リスクを確認</strong><small>元本保証ではないことを確認します。</small></div>
                </li>
                <li>
                  <span className="nisa-guide-steps__icon"><TrustReliableIcon /></span>
                  <div><b>5</b><strong>一次資料で確認</strong><small>金融庁・金融機関で最新条件を確認します。</small></div>
                </li>
              </ol>
            </section>

            <section id="faq">
              <h2>NISAに関するよくある質問</h2>
              <div className="nisa-guide-faq">
                <details>
                  <summary>年間360万円まで投資する必要がありますか？</summary>
                  <p>いいえ。360万円は年間の上限です。実際の利用額は家計や目的に応じて決めます。</p>
                </details>
                <details>
                  <summary>売却すると、その年に投資枠が戻りますか？</summary>
                  <p>その年の年間投資枠は戻りません。売却した簿価分は翌年以降、非課税保有限度額として再利用できます。</p>
                </details>
                <details>
                  <summary>NISAなら損をしませんか？</summary>
                  <p>NISAは税制優遇制度であり、商品の値動きによる損失を防ぐ制度ではありません。</p>
                </details>
                <details>
                  <summary>シミュレーターの将来額は保証されますか？</summary>
                  <p>保証されません。入力条件と想定利回りに基づく概算です。</p>
                </details>
              </div>
            </section>

            <section className="nisa-guide-final">
              <div>
                <p className="nisa-guide-final__eyebrow">NEXT STEP</p>
                <h2>自分の積立額で数字を確かめる</h2>
                <p>
                  月額・期間・想定利回りを変えて、元本と将来額の関係を確認できます。
                </p>
              </div>
              <Link className="nisa-guide-primary-action" to={routes.nisa}>
                NISAシミュレーターで試算する
                <ArrowRightIcon className="nisa-guide-inline-arrow" />
              </Link>
            </section>

            <section>
              <h2>投資前に確認しておきたい重要事項</h2>
              <div className="nisa-guide-legal">
                <ul>
                  <li>NISAは税制優遇制度であり、元本や将来の運用成果を保証する制度ではありません。</li>
                  <li>制度内容は変更される可能性があります。基準日と金融庁等の一次資料を確認してください。</li>
                  <li>シミュレーター結果は概算であり、実際の税額・運用成果・金融機関の手続きを保証しません。</li>
                </ul>
              </div>
            </section>
          </article>

          <aside className="knowledge-article-aside nisa-guide-aside" aria-label="記事の補足情報">
            <section>
              <h2>ページ内メニュー</h2>
              <nav className="nisa-guide-aside-nav" aria-label="NISA記事内メニュー">
                <a href="#basic">NISAとは</a>
                <a href="#caution">制度の注意点</a>
                <a href="#compare">投資枠の違い</a>
                <a href="#cases">活用例</a>
                <a href="#faq">Q&amp;A</a>
              </nav>
            </section>

            <section>
              <h2>一次資料</h2>
              <p>制度・税制は公的機関の一次資料を優先して確認しています。</p>
              <ul>
                {sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.title}<span aria-hidden="true">↗</span>
                    </a>
                    <small>{source.organization}</small>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2>あわせて確認</h2>
              <Link className="knowledge-article-related-link" to={routes.nisa}>
                NISAシミュレーターで数字を確かめる
              </Link>
              <Link className="knowledge-article-related-link" to={routes.knowledge}>
                お金の知識一覧へ戻る
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </SiteLayout>
  )
}

export default NisaLimitsArticlePage
