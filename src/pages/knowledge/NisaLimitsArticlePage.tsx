import { Link } from 'react-router-dom'
import { routes } from '../../app/routes'
import KnowledgeArticleLayout from '../../components/knowledge/KnowledgeArticleLayout'

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

function NisaLimitsArticlePage() {
  return (
    <KnowledgeArticleLayout
      eyebrow="NISA PLANNING"
      title="NISAの非課税枠と、積立額・将来額の考え方"
      lead="年間の投資枠と将来の資産額は、同じ数字ではありません。制度上の上限と、運用結果の試算を分けて読むための基礎を整理します。"
      sources={[...sources]}
      related={(
        <>
          <Link className="knowledge-article-related-link" to={routes.nisa}>NISAシミュレーターで数字を確かめる</Link>
          <Link className="knowledge-article-related-link" to={routes.knowledge}>お金の知識一覧へ戻る</Link>
        </>
      )}
    >
      <p className="knowledge-article-intro">
        NISAは投資から得た利益が非課税になる制度ですが、制度の枠内なら利益が約束されるわけではありません。まず「いくら買えるか」と「将来いくらになるか」を別々に考えると、試算を読み違えにくくなります。
      </p>

      <section className="knowledge-article-takeaways" aria-labelledby="nisa-article-takeaways">
        <h2 id="nisa-article-takeaways">この記事で分かること</h2>
        <ul>
          <li>NISAの年間投資枠と非課税保有限度額の違い</li>
          <li>商品を売却した後、簿価分の非課税保有限度額が再利用できる時期</li>
          <li>制度上の投資枠と、シミュレーターが示す将来額の違い</li>
        </ul>
      </section>

      <section id="allowances">
        <h2>年間投資枠と非課税保有限度額を分けて見る</h2>
        <p>現行NISAには、1年ごとの投資上限と、保有期間を通じた総枠があります。金額は買付額（簿価）を基準に管理されます。</p>
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
        <p>商品を売却すると、その商品の簿価分は翌年以降に総枠として再利用できます。ただし、売却した年の年間投資枠が増えるわけではありません。</p>
      </section>

      <section id="contribution">
        <h2>毎月の積立額は、まず年間額へ置き換える</h2>
        <p>毎月同じ金額を積み立てるなら、「毎月積立額 × 12か月」で年間の買付額を確認できます。たとえば毎月10万円は年間120万円、毎月30万円は年間360万円です。</p>
        <blockquote>
          制度枠との比較は買付額で行い、運用益を足しません。値上がり後の時価と非課税保有限度額を混同しないことが大切です。
        </blockquote>
        <p>積立期間も含めて確認したい場合は、毎月額と期間を入力して元本の合計を確かめます。既に利用した枠や売却後の再利用は個別に異なるため、金融機関の画面でも残り枠を確認してください。</p>
        <Link className="knowledge-inline-cta" to={routes.nisa}>NISAシミュレーターで積立額と期間を試算する <span aria-hidden="true">→</span></Link>
      </section>

      <section id="future-value">
        <h2>将来額は制度枠ではなく、仮定に基づく試算</h2>
        <p>将来額は、積立額・期間・想定利回りの組み合わせで変わります。同じNISA枠を使っても、選んだ商品や相場の動き、手数料によって結果は異なります。</p>
        <dl className="knowledge-definition-list">
          <div><dt>元本</dt><dd>自分が積み立てた金額の合計。制度枠との比較では、この買付額を基準にします。</dd></div>
          <div><dt>運用収益</dt><dd>試算上の将来額から元本を引いた差。マイナスになる可能性もあります。</dd></div>
          <div><dt>想定利回り</dt><dd>試算のために置く仮定で、将来の成果を示す約束ではありません。</dd></div>
        </dl>
      </section>

      <section id="checklist">
        <h2>実際に始める前の確認</h2>
        <ul className="knowledge-check-list">
          <li>生活費や近い将来に使うお金を投資資金と分ける</li>
          <li>商品の値動き、手数料、つみたて投資枠の対象可否を確認する</li>
          <li>年間枠だけでなく、現在の非課税保有限度額の利用状況を確認する</li>
          <li>利回りを1つに決めつけず、複数の条件で試算する</li>
        </ul>
      </section>

      <p className="knowledge-article-disclaimer">この記事は制度の一般的な整理を目的としたもので、特定商品の推奨や将来の運用成果を保証するものではありません。</p>
    </KnowledgeArticleLayout>
  )
}

export default NisaLimitsArticlePage
