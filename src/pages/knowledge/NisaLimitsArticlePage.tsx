import { Link } from 'react-router-dom'
import { routes } from '../../app/routes'
import KnowledgeArticleLayout from '../../components/knowledge/KnowledgeArticleLayout'
import './NisaLimitsArticlePage.css'

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

const contributionExamples = [
  { monthly: '1万円', annual: '12万円', progress: '3.4%', note: '年間360万円の約3%' },
  { monthly: '5万円', annual: '60万円', progress: '16.7%', note: '年間360万円の約17%' },
  { monthly: '10万円', annual: '120万円', progress: '33.3%', note: 'つみたて投資枠の年間上限' },
  { monthly: '30万円', annual: '360万円', progress: '100%', note: '2枠を併用した年間上限' },
] as const

function NisaLimitsArticlePage() {
  return (
    <KnowledgeArticleLayout
      pageClassName="nisa-article-v2"
      eyebrow="NISA / DECISION GUIDE"
      title="NISAの非課税枠と、積立額・将来額の考え方"
      lead="年間の投資枠と将来の資産額は、同じ数字ではありません。制度の数字を整理し、自分の積立額へ置き換え、最後に将来額を試算する順番で見ていきます。"
      publishedAt="2026-09-21"
      basisDate="2026-10-04"
      heroAside={(
        <div className="nisa-hero-map" aria-label="NISAで最初に押さえる制度の数字">
          <div className="nisa-hero-map__heading">
            <span>NISA MAP</span>
            <small>最初に押さえる4つの数字</small>
          </div>
          <div className="nisa-hero-map__formula" aria-label="120万円と240万円を合わせて年間360万円">
            <div>
              <strong>120</strong><span>万円</span>
              <small>つみたて投資枠 / 年</small>
            </div>
            <b aria-hidden="true">＋</b>
            <div>
              <strong>240</strong><span>万円</span>
              <small>成長投資枠 / 年</small>
            </div>
            <b aria-hidden="true">＝</b>
            <div className="nisa-hero-map__annual">
              <strong>360</strong><span>万円</span>
              <small>年間投資枠 / 最大</small>
            </div>
          </div>
          <div className="nisa-hero-map__lifetime">
            <span>LIFETIME LIMIT</span>
            <strong>1,800万円</strong>
            <small>非課税保有限度額（総枠）</small>
          </div>
        </div>
      )}
      sources={[...sources]}
      related={(
        <>
          <Link className="knowledge-article-related-link" to={routes.nisa}>NISAシミュレーターで数字を確かめる</Link>
          <Link className="knowledge-article-related-link" to={routes.knowledge}>お金の知識一覧へ戻る</Link>
        </>
      )}
    >
      <section className="nisa-editorial-opening" aria-labelledby="nisa-article-takeaways">
        <div className="nisa-editorial-opening__lead">
          <span className="nisa-kicker">START HERE</span>
          <h2 id="nisa-article-takeaways">この記事で分かること</h2>
          <p>
            NISAは「非課税になる制度」ですが、制度の枠内なら利益が約束されるわけではありません。
            まず制度上の上限を整理し、そのあとに毎月の積立額と将来額を分けて考えます。
          </p>
        </div>
        <nav className="nisa-reading-index" aria-label="この記事の読み順">
          <a href="#limits"><span>01</span><strong>制度の枠</strong><small>120・240・360・1,800</small></a>
          <a href="#contribution"><span>02</span><strong>毎月額</strong><small>月額 → 年間額</small></a>
          <a href="#future-value"><span>03</span><strong>将来額</strong><small>制度 ≠ 運用結果</small></a>
        </nav>
      </section>

      <section id="limits" className="nisa-chapter">
        <header className="nisa-chapter__header">
          <span className="nisa-chapter__number" aria-hidden="true">01</span>
          <div>
            <span className="nisa-kicker">LIMITS</span>
            <h2>年間の投資枠と、生涯の総枠を分ける</h2>
            <p>同じ「枠」でも、1年間に使える金額と、生涯を通じて保有できる総枠は別です。</p>
          </div>
        </header>

        <div className="nisa-equation" aria-label="NISAの年間投資枠の関係">
          <div className="nisa-equation__term">
            <span>つみたて投資枠</span>
            <strong>120<small>万円</small></strong>
            <p>年間の上限</p>
          </div>
          <b className="nisa-equation__operator" aria-hidden="true">＋</b>
          <div className="nisa-equation__term">
            <span>成長投資枠</span>
            <strong>240<small>万円</small></strong>
            <p>年間の上限</p>
          </div>
          <b className="nisa-equation__operator" aria-hidden="true">＝</b>
          <div className="nisa-equation__term nisa-equation__term--result">
            <span>年間投資枠</span>
            <strong>360<small>万円</small></strong>
            <p>2つの枠を併用した場合</p>
          </div>
        </div>

        <div className="nisa-lifetime-rule">
          <div>
            <span>生涯を通じた非課税保有限度額</span>
            <strong>1,800万円</strong>
          </div>
          <p>年間360万円とは別に管理される総枠です。成長投資枠は、この1,800万円の内数で1,200万円までです。</p>
        </div>

        <div className="nisa-frame-compare" aria-label="つみたて投資枠と成長投資枠の比較">
          <article>
            <span className="nisa-frame-compare__label">積立を中心に使う</span>
            <h3>つみたて投資枠</h3>
            <strong>年間120万円</strong>
            <p>対象商品と買付方法に条件があります。長期・積立・分散投資に適した一定の商品が対象です。</p>
          </article>
          <div className="nisa-frame-compare__axis" aria-hidden="true"><span>併用可</span></div>
          <article>
            <span className="nisa-frame-compare__label">選択肢を広げる</span>
            <h3>成長投資枠</h3>
            <strong>年間240万円</strong>
            <p>つみたて投資枠と併用できます。非課税保有限度額のうち、成長投資枠で利用できるのは1,200万円までです。</p>
          </article>
        </div>

        <details className="nisa-detail-table">
          <summary>制度の数字を表で詳しく確認する</summary>
          <div className="knowledge-data-table" role="region" aria-label="NISAの主な制度枠" tabIndex={0}>
            <table>
              <thead><tr><th scope="col">確認する枠</th><th scope="col">上限</th><th scope="col">読み方</th></tr></thead>
              <tbody>
                <tr><th scope="row">つみたて投資枠</th><td>年間120万円</td><td>対象商品と買付方法にも条件があります。</td></tr>
                <tr><th scope="row">成長投資枠</th><td>年間240万円</td><td>つみたて投資枠との併用ができます。</td></tr>
                <tr><th scope="row">年間投資枠の合計</th><td>年間360万円</td><td>2つの枠を併用した場合の合計です。</td></tr>
                <tr><th scope="row">非課税保有限度額</th><td>1,800万円</td><td>成長投資枠は、この内数で1,200万円までです。</td></tr>
              </tbody>
            </table>
          </div>
        </details>

        <div className="nisa-reuse-story">
          <div className="nisa-reuse-story__heading">
            <span className="nisa-kicker">IF YOU SELL</span>
            <h3>売却した分の総枠は、翌年以降に再利用できます</h3>
            <p>ただし、売却した年の年間投資枠が増えるわけではありません。</p>
          </div>
          <ol className="nisa-reuse-timeline">
            <li><span>01</span><strong>商品を売却</strong><small>売却した商品の簿価を確認</small></li>
            <li><span>02</span><strong>その年は戻らない</strong><small>年間投資枠はそのまま</small></li>
            <li><span>03</span><strong>翌年以降</strong><small>簿価分の総枠を再利用</small></li>
          </ol>
        </div>
      </section>

      <section id="contribution" className="nisa-chapter nisa-chapter--mist">
        <header className="nisa-chapter__header">
          <span className="nisa-chapter__number" aria-hidden="true">02</span>
          <div>
            <span className="nisa-kicker">CONTRIBUTION</span>
            <h2>「毎月いくら」を、年間額へ置き換える</h2>
            <p>制度枠と比べるときは、毎月額だけでなく12か月分の買付額で見ます。</p>
          </div>
        </header>

        <div className="nisa-scale" aria-label="毎月の積立額を年間360万円に対して比較した目安">
          <div className="nisa-scale__axis" aria-hidden="true">
            <span>0</span>
            <span className="nisa-scale__threshold">120万円<br /><small>つみたて投資枠</small></span>
            <span>360万円</span>
          </div>
          {contributionExamples.map((item) => (
            <div className="nisa-scale__row" key={item.monthly}>
              <div className="nisa-scale__label"><span>毎月</span><strong>{item.monthly}</strong></div>
              <div className="nisa-scale__track" aria-hidden="true"><span style={{ width: item.progress }} /></div>
              <div className="nisa-scale__value"><span>年間</span><strong>{item.annual}</strong><small>{item.note}</small></div>
            </div>
          ))}
        </div>

        <blockquote className="nisa-editorial-quote">
          <strong>制度枠との比較は「買付額」で行います。</strong>
          <span>運用益を足した時価と、非課税保有限度額を混同しないことが大切です。</span>
        </blockquote>

        <p>積立期間も含めて確認したい場合は、毎月額と期間を入力して元本の合計を確かめます。既に利用した枠や売却後の再利用は個別に異なるため、金融機関の画面でも残り枠を確認してください。</p>
      </section>

      <section id="future-value" className="nisa-chapter">
        <header className="nisa-chapter__header">
          <span className="nisa-chapter__number" aria-hidden="true">03</span>
          <div>
            <span className="nisa-kicker">LIMIT ≠ RESULT</span>
            <h2>制度の上限と、運用後の将来額は別の数字</h2>
            <p>同じNISA枠を使っても、積立額・期間・想定利回り・商品の値動きで結果は変わります。</p>
          </div>
        </header>

        <div className="nisa-limit-result" aria-label="制度枠と将来額は同じではありません">
          <div>
            <span>LIMIT</span>
            <strong>いくら買えるか</strong>
            <p>制度で決まる投資上限。買付額を基準に管理します。</p>
          </div>
          <b aria-hidden="true">≠</b>
          <div>
            <span>RESULT</span>
            <strong>将来いくらになるか</strong>
            <p>運用結果。元本保証ではなく、条件によって増減します。</p>
          </div>
        </div>

        <dl className="nisa-term-lines">
          <div><dt><span>01</span>元本</dt><dd>自分が積み立てた金額の合計。制度枠との比較では、この買付額を基準にします。</dd></div>
          <div><dt><span>02</span>運用収益</dt><dd>試算上の将来額から元本を引いた差。マイナスになる可能性もあります。</dd></div>
          <div><dt><span>03</span>想定利回り</dt><dd>試算のために置く仮定で、将来の成果を示す約束ではありません。</dd></div>
        </dl>

        <div className="nisa-simulator-bridge">
          <div className="nisa-simulator-bridge__copy">
            <span className="nisa-kicker">FROM KNOWLEDGE TO YOUR NUMBERS</span>
            <h3>ここからは、自分の毎月額・期間で確かめる</h3>
            <p>制度を理解したあとに、自分の条件へ置き換えるのが沖縄マネーガイドの使い方です。</p>
          </div>
          <div className="nisa-simulator-bridge__flow" aria-hidden="true">
            <span>毎月額</span><i>→</i><span>期間</span><i>→</i><span>将来額</span>
          </div>
          <Link className="nisa-simulator-bridge__cta" to={routes.nisa}>
            NISAシミュレーターで積立額と期間を試算する <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section id="checklist" className="nisa-chapter nisa-before-start">
        <header className="nisa-chapter__header">
          <span className="nisa-chapter__number" aria-hidden="true">04</span>
          <div>
            <span className="nisa-kicker">BEFORE YOU START</span>
            <h2>始める前に、制度より先に確認したいこと</h2>
          </div>
        </header>
        <ol className="nisa-check-lines">
          <li><span>01</span><p>生活費や近い将来に使うお金を、投資資金と分ける</p></li>
          <li><span>02</span><p>商品の値動き、手数料、つみたて投資枠の対象可否を確認する</p></li>
          <li><span>03</span><p>年間枠だけでなく、現在の非課税保有限度額の利用状況を確認する</p></li>
          <li><span>04</span><p>利回りを1つに決めつけず、複数の条件で試算する</p></li>
        </ol>
      </section>

      <p className="knowledge-article-disclaimer nisa-article-disclaimer">この記事は制度の一般的な整理を目的としたもので、特定商品の推奨や将来の運用成果を保証するものではありません。</p>
    </KnowledgeArticleLayout>
  )
}

export default NisaLimitsArticlePage
