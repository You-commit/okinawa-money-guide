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

const nisaNumbers = [
  { label: 'つみたて投資枠', value: '120万円', note: '1年間の上限' },
  { label: '成長投資枠', value: '240万円', note: '1年間の上限' },
  { label: '年間投資枠の合計', value: '360万円', note: '2つの枠を併用した場合' },
  { label: '非課税保有限度額', value: '1,800万円', note: '保有期間を通じた総枠' },
] as const

const contributionExamples = [
  { monthly: '1万円', annual: '12万円', usage: '年間枠の一部' },
  { monthly: '5万円', annual: '60万円', usage: 'つみたて投資枠の半分' },
  { monthly: '10万円', annual: '120万円', usage: 'つみたて投資枠の上限' },
  { monthly: '30万円', annual: '360万円', usage: '年間投資枠の合計' },
] as const

function NisaLimitsArticlePage() {
  return (
    <KnowledgeArticleLayout
      eyebrow="NISA PLANNING"
      title="NISAの非課税枠と、積立額・将来額の考え方"
      lead="年間の投資枠と将来の資産額は、同じ数字ではありません。制度上の上限と、運用結果の試算を分けて読むための基礎を整理します。"
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
      <div className="nisa-article-opening">
        <div className="nisa-article-opening__copy">
          <span className="nisa-article-opening__label">最初にここだけ</span>
          <p className="knowledge-article-intro">
            NISAは投資から得た利益が非課税になる制度ですが、制度の枠内なら利益が約束されるわけではありません。まず「いくら買えるか」と「将来いくらになるか」を別々に考えると、試算を読み違えにくくなります。
          </p>
        </div>
        <ol className="nisa-reading-flow" aria-label="この記事の読み方">
          <li><span>01</span><strong>枠を知る</strong><small>制度の上限</small></li>
          <li><span>02</span><strong>積立額へ直す</strong><small>毎月 → 年間</small></li>
          <li><span>03</span><strong>将来額を試す</strong><small>仮定を分ける</small></li>
        </ol>
      </div>

      <section className="knowledge-article-takeaways nisa-article-takeaways" aria-labelledby="nisa-article-takeaways">
        <div className="nisa-section-heading">
          <span className="nisa-section-kicker">QUICK GUIDE</span>
          <h2 id="nisa-article-takeaways">この記事で分かること</h2>
        </div>
        <div className="nisa-takeaway-grid">
          <article>
            <span className="nisa-takeaway-grid__number">01</span>
            <h3>年間枠と総枠</h3>
            <p>NISAの年間投資枠と非課税保有限度額の違い</p>
          </article>
          <article>
            <span className="nisa-takeaway-grid__number">02</span>
            <h3>売却後の再利用</h3>
            <p>商品を売却した後、簿価分の非課税保有限度額が再利用できる時期</p>
          </article>
          <article>
            <span className="nisa-takeaway-grid__number">03</span>
            <h3>制度と試算を分ける</h3>
            <p>制度上の投資枠と、シミュレーターが示す将来額の違い</p>
          </article>
        </div>
      </section>

      <section id="allowances" className="nisa-visual-section">
        <div className="nisa-section-heading">
          <span className="nisa-section-kicker">STEP 01 / LIMITS</span>
          <h2>年間投資枠と非課税保有限度額を分けて見る</h2>
          <p>まずは、NISAに出てくる4つの数字を役割ごとに分けます。</p>
        </div>

        <div className="nisa-number-grid" aria-label="NISAでまず押さえる4つの数字">
          {nisaNumbers.map((item) => (
            <article key={item.label} className="nisa-number-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.note}</small>
            </article>
          ))}
        </div>

        <div className="nisa-limit-explainer">
          <article className="nisa-limit-card nisa-limit-card--saving">
            <div>
              <span className="nisa-limit-card__tag">積立中心</span>
              <h3>つみたて投資枠</h3>
              <strong>年間120万円</strong>
            </div>
            <p>対象商品と買付方法にも条件があります。長期の積立を考えるときの中心になる枠です。</p>
          </article>
          <div className="nisa-limit-plus" aria-hidden="true">＋</div>
          <article className="nisa-limit-card nisa-limit-card--growth">
            <div>
              <span className="nisa-limit-card__tag">選択肢を広げる</span>
              <h3>成長投資枠</h3>
              <strong>年間240万円</strong>
            </div>
            <p>つみたて投資枠との併用ができます。非課税保有限度額1,800万円のうち、成長投資枠は1,200万円までです。</p>
          </article>
          <div className="nisa-limit-total">
            <span>1年間に使える合計</span>
            <strong>最大360万円</strong>
            <small>2つの枠を併用した場合</small>
          </div>
        </div>

        <div className="nisa-reading-note">
          <span className="nisa-reading-note__icon" aria-hidden="true">!</span>
          <div>
            <strong>年間の上限と、生涯の総枠は別のものです。</strong>
            <p>現行NISAには、1年ごとの投資上限と、保有期間を通じた総枠があります。金額は買付額（簿価）を基準に管理されます。</p>
          </div>
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

        <div className="nisa-reuse-card">
          <div className="nisa-reuse-card__marker">売却したら？</div>
          <div>
            <h3>総枠は翌年以降に再利用できます</h3>
            <p>商品を売却すると、その商品の簿価分は翌年以降に総枠として再利用できます。ただし、売却した年の年間投資枠が増えるわけではありません。</p>
          </div>
        </div>
      </section>

      <section id="contribution" className="nisa-visual-section nisa-visual-section--soft">
        <div className="nisa-section-heading">
          <span className="nisa-section-kicker">STEP 02 / CONTRIBUTION</span>
          <h2>毎月の積立額は、まず年間額へ置き換える</h2>
          <p>「毎月いくら」だけでは制度枠と比べにくいため、12か月分へ置き換えて考えます。</p>
        </div>

        <div className="nisa-contribution-grid" aria-label="毎月の積立額と年間額の例">
          {contributionExamples.map((item) => (
            <article key={item.monthly}>
              <span>毎月</span>
              <strong>{item.monthly}</strong>
              <div className="nisa-contribution-grid__arrow" aria-hidden="true">→</div>
              <span>年間</span>
              <strong>{item.annual}</strong>
              <small>{item.usage}</small>
            </article>
          ))}
        </div>

        <blockquote className="nisa-article-quote">
          <strong>制度枠との比較は「買付額」で行います。</strong>
          <span>運用益を足した時価と非課税保有限度額を混同しないことが大切です。</span>
        </blockquote>

        <p>積立期間も含めて確認したい場合は、毎月額と期間を入力して元本の合計を確かめます。既に利用した枠や売却後の再利用は個別に異なるため、金融機関の画面でも残り枠を確認してください。</p>

        <div className="nisa-simulator-bridge">
          <div>
            <span className="nisa-simulator-bridge__label">NEXT ACTION</span>
            <h3>自分の積立額なら、将来いくらになる？</h3>
            <p>制度の数字を理解したら、次は自分の毎月額・期間・想定利回りに置き換えて確認します。</p>
          </div>
          <div className="nisa-simulator-bridge__flow" aria-hidden="true">
            <span>毎月額</span><b>→</b><span>期間</span><b>→</b><span>将来額</span>
          </div>
          <Link className="nisa-simulator-bridge__cta" to={routes.nisa}>
            NISAシミュレーターで試算する <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section id="future-value" className="nisa-visual-section">
        <div className="nisa-section-heading">
          <span className="nisa-section-kicker">STEP 03 / FUTURE VALUE</span>
          <h2>将来額は制度枠ではなく、仮定に基づく試算</h2>
          <p>制度上の「買える上限」と、運用後の「将来額」は別の数字として読みます。</p>
        </div>

        <div className="nisa-not-equal" aria-label="制度枠と将来額は同じではありません">
          <div><span>制度枠</span><strong>いくら買えるか</strong></div>
          <b aria-hidden="true">≠</b>
          <div><span>将来額</span><strong>運用後いくらになるか</strong></div>
        </div>

        <p>将来額は、積立額・期間・想定利回りの組み合わせで変わります。同じNISA枠を使っても、選んだ商品や相場の動き、手数料によって結果は異なります。</p>

        <dl className="knowledge-definition-list nisa-definition-grid">
          <div><dt>元本</dt><dd>自分が積み立てた金額の合計。制度枠との比較では、この買付額を基準にします。</dd></div>
          <div><dt>運用収益</dt><dd>試算上の将来額から元本を引いた差。マイナスになる可能性もあります。</dd></div>
          <div><dt>想定利回り</dt><dd>試算のために置く仮定で、将来の成果を示す約束ではありません。</dd></div>
        </dl>
      </section>

      <section id="checklist" className="nisa-visual-section nisa-check-section">
        <div className="nisa-section-heading">
          <span className="nisa-section-kicker">BEFORE YOU START</span>
          <h2>実際に始める前の確認</h2>
          <p>制度の上限より先に、家計と商品の条件を確認します。</p>
        </div>
        <ul className="knowledge-check-list nisa-check-grid">
          <li>生活費や近い将来に使うお金を投資資金と分ける</li>
          <li>商品の値動き、手数料、つみたて投資枠の対象可否を確認する</li>
          <li>年間枠だけでなく、現在の非課税保有限度額の利用状況を確認する</li>
          <li>利回りを1つに決めつけず、複数の条件で試算する</li>
        </ul>
      </section>

      <p className="knowledge-article-disclaimer nisa-article-disclaimer">この記事は制度の一般的な整理を目的としたもので、特定商品の推奨や将来の運用成果を保証するものではありません。</p>
    </KnowledgeArticleLayout>
  )
}

export default NisaLimitsArticlePage
