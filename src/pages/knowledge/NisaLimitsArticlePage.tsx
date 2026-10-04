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
  { monthly: '1万円', annual: '12万円', note: '年間360万円の約3%' },
  { monthly: '5万円', annual: '60万円', note: '年間360万円の約17%' },
  { monthly: '10万円', annual: '120万円', note: 'つみたて投資枠の年間上限' },
  { monthly: '30万円', annual: '360万円', note: '2つの枠を併用した年間上限' },
] as const

function NisaLimitsArticlePage() {
  return (
    <KnowledgeArticleLayout
      pageClassName="nisa-article-v3"
      eyebrow="NISA / DECISION GUIDE"
      title="NISAの非課税枠と、積立額・将来額の考え方"
      lead="年間の投資枠と将来の資産額は、同じ数字ではありません。制度の数字を整理し、自分の積立額へ置き換え、最後に将来額を試算する順番で見ていきます。"
      publishedAt="2026-09-21"
      basisDate="2026-10-04"
      sources={[...sources]}
      related={(
        <>
          <Link className="knowledge-article-related-link" to={routes.nisa}>NISAシミュレーターで数字を確かめる</Link>
          <Link className="knowledge-article-related-link" to={routes.knowledge}>お金の知識一覧へ戻る</Link>
        </>
      )}
    >
      <section className="nisa-opening" aria-labelledby="nisa-article-takeaways">
        <p className="nisa-opening__eyebrow">最初に、結論から</p>
        <h2 id="nisa-article-takeaways">この記事で分かること</h2>
        <p className="nisa-opening__lead">
          NISAは「非課税になる制度」ですが、制度の枠内なら利益が約束されるわけではありません。
          読み違えを防ぐために、まず制度の上限、次に毎月の積立額、最後に将来額という順番で整理します。
        </p>
        <ol className="nisa-opening__index" aria-label="この記事の読み順">
          <li><span>01</span><div><strong>制度の枠を知る</strong><small>120万円・240万円・360万円・1,800万円</small></div></li>
          <li><span>02</span><div><strong>毎月の積立額へ置き換える</strong><small>月額から年間の買付額へ</small></div></li>
          <li><span>03</span><div><strong>将来額は別の数字として考える</strong><small>制度上限と運用結果を分ける</small></div></li>
        </ol>
      </section>

      <section id="limits" className="nisa-section">
        <header className="nisa-section__header">
          <p><span>01</span> 制度を読む</p>
          <h2>まず押さえたい、4つの数字</h2>
          <div className="nisa-section__rule" aria-hidden="true" />
          <p className="nisa-section__summary">年間の投資上限と、生涯を通じた総枠は別に管理されます。</p>
        </header>

        <figure className="nisa-number-figure" aria-labelledby="nisa-number-caption">
          <div className="nisa-number-figure__annual">
            <div>
              <span>つみたて投資枠</span>
              <strong>120<small>万円</small></strong>
              <em>1年間</em>
            </div>
            <b aria-hidden="true">＋</b>
            <div>
              <span>成長投資枠</span>
              <strong>240<small>万円</small></strong>
              <em>1年間</em>
            </div>
            <b aria-hidden="true">＝</b>
            <div className="nisa-number-figure__result">
              <span>年間投資枠</span>
              <strong>360<small>万円</small></strong>
              <em>2つの枠を併用した場合</em>
            </div>
          </div>
          <div className="nisa-number-figure__lifetime">
            <div>
              <span>生涯を通じた非課税保有限度額</span>
              <strong>1,800<small>万円</small></strong>
            </div>
            <p>年間360万円とは別の総枠です。成長投資枠は、この1,800万円の内数で1,200万円までです。</p>
          </div>
          <figcaption id="nisa-number-caption">年間の枠と、生涯の総枠を同じものとして見ないことが最初のポイントです。</figcaption>
        </figure>

        <div className="nisa-prose-grid">
          <article>
            <p className="nisa-prose-grid__label">つみたて投資枠</p>
            <h3>積立を中心に使う、年間120万円の枠</h3>
            <p>対象商品と買付方法に条件があります。長期・積立・分散投資に適した一定の商品が対象です。</p>
          </article>
          <article>
            <p className="nisa-prose-grid__label">成長投資枠</p>
            <h3>選択肢を広げる、年間240万円の枠</h3>
            <p>つみたて投資枠と併用できます。成長投資枠で利用できる非課税保有限度額は1,200万円までです。</p>
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

        <aside className="nisa-editor-note" aria-label="売却した場合のポイント">
          <p className="nisa-editor-note__label">売却したらどうなる？</p>
          <h3>売却した商品の簿価分は、翌年以降に総枠として再利用できます。</h3>
          <p>ただし、売却した年の年間投資枠が増えるわけではありません。</p>
          <ol>
            <li><span>1</span><div><strong>商品を売却</strong><small>売却した商品の簿価を確認</small></div></li>
            <li><span>2</span><div><strong>その年は戻らない</strong><small>年間投資枠はそのまま</small></div></li>
            <li><span>3</span><div><strong>翌年以降</strong><small>簿価分の総枠を再利用</small></div></li>
          </ol>
        </aside>
      </section>

      <section id="contribution" className="nisa-section nisa-section--tint">
        <header className="nisa-section__header">
          <p><span>02</span> 自分の金額へ置き換える</p>
          <h2>「毎月いくら」を、年間額へ直してみる</h2>
          <div className="nisa-section__rule" aria-hidden="true" />
          <p className="nisa-section__summary">制度枠と比べるときは、毎月額ではなく12か月分の買付額で見ます。</p>
        </header>

        <div className="nisa-contribution-table" role="region" aria-label="毎月の積立額と年間額の例" tabIndex={0}>
          <div className="nisa-contribution-table__head" aria-hidden="true">
            <span>毎月の積立額</span><span>年間の買付額</span><span>制度枠との関係</span>
          </div>
          {contributionExamples.map((item) => (
            <div className="nisa-contribution-table__row" key={item.monthly}>
              <strong>{item.monthly}</strong>
              <span className="nisa-contribution-table__arrow" aria-hidden="true">→</span>
              <strong>{item.annual}</strong>
              <small>{item.note}</small>
            </div>
          ))}
        </div>

        <blockquote className="nisa-quote">
          <p>制度枠との比較は「買付額」で行います。</p>
          <cite>運用益を足した時価と、非課税保有限度額を混同しないことが大切です。</cite>
        </blockquote>

        <p className="nisa-body-copy">積立期間も含めて確認したい場合は、毎月額と期間を入力して元本の合計を確かめます。既に利用した枠や売却後の再利用は個別に異なるため、金融機関の画面でも残り枠を確認してください。</p>
      </section>

      <section id="future-value" className="nisa-section">
        <header className="nisa-section__header">
          <p><span>03</span> 将来額を考える</p>
          <h2>制度の上限と、運用後の将来額は別の数字</h2>
          <div className="nisa-section__rule" aria-hidden="true" />
          <p className="nisa-section__summary">同じNISA枠を使っても、積立額・期間・想定利回り・商品の値動きで結果は変わります。</p>
        </header>

        <div className="nisa-contrast" aria-label="制度枠と将来額は同じではありません">
          <div>
            <p>制度で決まるもの</p>
            <h3>いくら買えるか</h3>
            <span>年間投資枠・非課税保有限度額</span>
          </div>
          <b aria-hidden="true">≠</b>
          <div>
            <p>運用によって変わるもの</p>
            <h3>将来いくらになるか</h3>
            <span>元本・期間・利回り・値動き</span>
          </div>
        </div>

        <dl className="nisa-term-list">
          <div><dt>元本</dt><dd>自分が積み立てた金額の合計。制度枠との比較では、この買付額を基準にします。</dd></div>
          <div><dt>運用収益</dt><dd>試算上の将来額から元本を引いた差。マイナスになる可能性もあります。</dd></div>
          <div><dt>想定利回り</dt><dd>試算のために置く仮定で、将来の成果を示す約束ではありません。</dd></div>
        </dl>

        <div className="nisa-simulator-bridge">
          <div>
            <p className="nisa-simulator-bridge__eyebrow">数字を、自分の場合に置き換える</p>
            <h3>毎月額・期間・想定利回りを変えて、将来額を確かめる</h3>
            <p>制度を理解したら、次は自分の条件で試します。結果は将来を保証するものではありません。</p>
          </div>
          <Link to={routes.nisa}>NISAシミュレーターで積立額と期間を試算する <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="nisa-check-section" aria-labelledby="nisa-before-start">
        <p className="nisa-check-section__eyebrow">Before you start</p>
        <h2 id="nisa-before-start">実際に始める前に、確認しておきたいこと</h2>
        <ul>
          <li>生活費や近い将来に使うお金を、投資資金と分ける</li>
          <li>商品の値動き、手数料、つみたて投資枠の対象可否を確認する</li>
          <li>年間枠だけでなく、現在の非課税保有限度額の利用状況を確認する</li>
          <li>利回りを1つに決めつけず、複数の条件で試算する</li>
        </ul>
      </section>

      <p className="knowledge-article-disclaimer nisa-disclaimer">この記事は制度の一般的な整理を目的としたもので、特定商品の推奨や将来の運用成果を保証するものではありません。</p>
    </KnowledgeArticleLayout>
  )
}

export default NisaLimitsArticlePage
