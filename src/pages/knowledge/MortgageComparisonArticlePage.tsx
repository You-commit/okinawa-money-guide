import { Link } from 'react-router-dom'
import { routes } from '../../app/routes'
import KnowledgeArticleLayout from '../../components/knowledge/KnowledgeArticleLayout'
import EditorialIllustration from '../../components/knowledge/EditorialIllustration'

const sources = [
  {
    title: '元利均等返済・元金均等返済',
    organization: '住宅金融支援機構（フラット35）',
    url: 'https://www.flat35.com/hajimete/atoz/04.html',
  },
  {
    title: '借入希望金額から返済額を計算',
    organization: '住宅金融支援機構（フラット35）',
    url: 'https://www.flat35.com/simulation/simu_01.html',
  },
  {
    title: '住宅ローンの基礎知識・資料',
    organization: '住宅金融支援機構（フラット35）',
    url: 'https://www.flat35.com/business/support.html',
  },
  { title: '住宅ローンの金利タイプを考える', organization: '住宅金融支援機構', url: 'https://www.flat35.com/lp/kinri/index.html' },
  { title: 'フラット35のご利用条件', organization: '住宅金融支援機構', url: 'https://www.flat35.com/loan/lineup/flat35/conditions/index.html' },
  { title: 'ハザードマップポータルサイト', organization: '国土交通省・国土地理院', url: 'https://disaportal.gsi.go.jp/' },
] as const

const principal = 30_000_000
const months = 420
const example = (rate: number) => {
  const r = rate / 100 / 12
  const monthly = principal * r / (1 - (1 + r) ** -months)
  return { monthly, total: monthly * months, first: principal / months + principal * r, equalTotal: principal + principal * r * (months + 1) / 2 }
}
const base = example(2)
const yen = (value: number) => Math.round(value).toLocaleString('ja-JP') + '円'

const sections = [
  { id: 'overview', label: 'この記事で分かること' },
  { id: 'repayment-methods', label: '返済方式の違い' },
  { id: 'interest-and-total', label: '金利と総返済額' },
  { id: 'fees', label: '諸費用・保障' },
  { id: 'budget', label: '家計と借入額' },
  { id: 'okinawa', label: '沖縄の住まいと維持費' },
  { id: 'questions', label: '金融機関への確認事項' },
  { id: 'mortgage-faq', label: 'よくある質問' },
] as const

function MortgageComparisonArticlePage() {
  return (
    <KnowledgeArticleLayout
      title="住宅ローン比較で見るべき項目"
      topic="住宅ローン"
      sections={sections}
      lead="金利の低さだけで選ばないために。3,000万円・35年の具体例で返済方式、総返済額、諸費用、保障、家計の余裕を比較します。"
      publishedAt="2026-09-21"
      basisDate="2026-10-04"
      sources={[...sources]}
      related={(
        <>
          <Link className="knowledge-article-related-link" to={routes.mortgage}>住宅ローンを2方式で試算する</Link>
          <Link className="knowledge-article-related-link" to={routes.knowledge}>お金の知識一覧へ戻る</Link>
        </>
      )}
    >
      <p className="knowledge-article-intro">
        住宅ローンを比べるとき、低い金利や小さい月額だけを見ても、家計への影響は判断しきれません。返済方式の違いを理解したうえで、借入期間全体の金額と契約に伴う費用を同じ条件で比べることが出発点です。
      </p>

      <EditorialIllustration topic="mortgage" />

      <section id="overview" className="knowledge-article-takeaways" aria-labelledby="mortgage-article-takeaways">
        <h2 id="mortgage-article-takeaways">この記事で分かること</h2>
        <ul>
          <li>表示金利や月々の返済額だけで住宅ローンを比較しない理由</li>
          <li>元利均等返済と元金均等返済の負担の現れ方の違い</li>
          <li>手数料、保証料、登記費用、団信など、返済額以外に確認する項目</li>
          <li>3,000万円・35年の返済例と、金利差が家計に与える影響</li>
          <li>沖縄で住宅を取得するときの維持費と、無理のない借入額の考え方</li>
        </ul>
      </section>

      <section id="repayment-methods">
        <h2>元利均等と元金均等は、返済額の動きが違う</h2>
        <div className="knowledge-data-table" role="region" aria-label="住宅ローン返済方式の比較" tabIndex={0}>
          <table>
            <thead><tr><th scope="col">比較項目</th><th scope="col">元利均等返済</th><th scope="col">元金均等返済</th></tr></thead>
            <tbody>
              <tr><th scope="row">毎月返済額</th><td>金利が一定なら元金と利息の合計が原則一定</td><td>金利が一定なら初回が大きく、その後減っていく</td></tr>
              <tr><th scope="row">元金の減り方</th><td>返済当初は元金の減りが緩やか</td><td>毎月同じ元金を返すため早い</td></tr>
              <tr><th scope="row">当初の家計負担</th><td>比較的抑えやすい</td><td>元利均等より大きくなりやすい</td></tr>
              <tr><th scope="row">同条件の総返済額</th><td>元金均等より多くなる傾向</td><td>元利均等より少なくなる傾向</td></tr>
            </tbody>
          </table>
        </div>
        <p>どちらが合うかは、総額だけでなく、返済開始時の収入・支出と将来の家計変化によって異なります。初回返済額と利息総額の両方を見ると、負担の時期と総額のトレードオフを確認できます。</p>
        <figure className="mortgage-editorial-example">
          <figcaption><strong>具体例：3,000万円を35年で返済すると？</strong><span>年2.0%を全期間一定、毎月返済、ボーナス返済なしと仮定</span></figcaption>
          <div className="knowledge-data-table" role="region" aria-label="3,000万円の返済方式別試算" tabIndex={0}>
            <table><thead><tr><th scope="col">比較項目</th><th scope="col">元利均等</th><th scope="col">元金均等</th></tr></thead>
              <tbody>
                <tr><th scope="row">初回返済額</th><td>{yen(base.monthly)}</td><td>{yen(base.first)}</td></tr>
                <tr><th scope="row">総返済額</th><td>{yen(base.total)}</td><td>{yen(base.equalTotal)}</td></tr>
                <tr><th scope="row">利息総額</th><td>{yen(base.total - principal)}</td><td>{yen(base.equalTotal - principal)}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mortgage-editorial-note">元金均等は初回の負担が約2.2万円大きい一方、総返済額は約121万円少なくなります。途中で丸めず、表示額を円単位で四捨五入した概算です。諸費用・保障料は含めず、実際の端数処理は商品によって異なります。</p>
        </figure>
        <p>元金均等で利息を抑えられても、教育費が重なる時期に貯蓄を取り崩すようでは家計が不安定になります。総額の小ささと毎月の余裕は分けて判断しましょう。</p>
        <Link className="knowledge-inline-cta" to={routes.mortgage}>同じ借入条件で2つの返済方式を比べる <span aria-hidden="true">→</span></Link>
      </section>

      <section id="interest-and-total">
        <h2>金利は「表示された率」だけでなく条件をそろえる</h2>
        <p>固定金利か変動金利か、金利がいつ見直されるか、優遇条件がいつまで続くかで、返済額の見通しは変わります。比較するときは借入額・期間・返済方式・ボーナス返済の有無をそろえます。</p>
        <h3>固定金利と変動金利で異なるのは、将来の不確実性</h3>
        <div className="knowledge-data-table" role="region" aria-label="金利タイプの比較" tabIndex={0}>
          <table><thead><tr><th scope="col">タイプ</th><th scope="col">特徴</th><th scope="col">確認したい点</th></tr></thead><tbody>
            <tr><th scope="row">全期間固定</th><td>契約上の金利が完済まで固定される</td><td>当初返済額と総支払額、金利引下げ条件</td></tr>
            <tr><th scope="row">変動</th><td>借入後の金利見直しで利息負担が変わる可能性</td><td>金利・返済額の見直し時期、上昇時の家計余力</td></tr>
            <tr><th scope="row">固定期間選択</th><td>一定期間だけ金利を固定</td><td>固定期間終了後の金利、再選択の条件や費用</td></tr>
          </tbody></table>
        </div>
        <p>変動金利の返済額見直しルールは商品によって異なります。返済額の上昇が抑えられる場合でも、利息負担まで抑えられるわけではありません。</p>
        <figure className="mortgage-editorial-example">
          <figcaption><strong>金利が違うと、返済額はどれだけ変わる？</strong><span>3,000万円・35年・元利均等、各金利が最初から最後まで一定という比較</span></figcaption>
          <div className="knowledge-data-table" role="region" aria-label="金利別返済額の試算" tabIndex={0}>
            <table><thead><tr><th scope="col">仮定金利</th><th scope="col">毎月返済額</th><th scope="col">総返済額</th></tr></thead><tbody>
              {[1, 2, 3].map(rate => <tr key={rate}><th scope="row">{rate.toFixed(1)}%</th><td>{yen(example(rate).monthly)}</td><td>{yen(example(rate).total)}</td></tr>)}
            </tbody></table>
          </div>
          <p className="mortgage-editorial-note">年1%と年3%では毎月約3.1万円の差があります。実際の変動金利の途中上昇を再現したものではなく、金利感応度を理解するための仮定です。実際の金利・将来予測ではありません。</p>
        </figure>
        <p>シミュレーターの総返済額は借入元金と利息の概算です。契約・住宅取得時の費用を加えた支払総額とは区別します。</p>
      </section>

      <section id="fees">
        <h2>返済額の外にある費用を一覧にする</h2>
        <p>金融機関や商品によって名称・金額・支払時期は異なります。比較表を作るときは、少なくとも次の項目を別欄に置きます。</p>
        <ul className="knowledge-check-list knowledge-check-list--columns">
          <li>融資事務手数料</li>
          <li>保証料と保証条件</li>
          <li>契約書の印紙税</li>
          <li>抵当権設定の登録免許税・司法書士報酬</li>
          <li>物件検査や適合証明に関する費用</li>
          <li>火災保険・地震保険</li>
          <li>団体信用生命保険の保障内容と上乗せ条件</li>
          <li>繰上返済の最低額・手数料</li>
        </ul>
        <h3>金利と手数料はセットで比較する</h3>
        <p>借入3,000万円に対する融資手数料が2.2%と仮定すると66万円です。定額5万5,000円と仮定した場合とは60万5,000円の差があります。ただし金利、保証料、団信などの条件が異なれば優劣は逆転することもあります。これらは比較方法を示す仮定であり、特定の商品を示すものではありません。</p>
        <p>団信は保障の対象、支払事由、免責、保障終了年齢、上乗せ金利などを確認します。保障名だけで同じ内容と判断せず、約款や商品説明書を見比べましょう。</p>
      </section>

      <section id="budget">
        <h2>借りられる金額と、無理なく返せる金額は別</h2>
        <p>金融機関が示す借入可能額は審査上の目安であり、家計にとって安全な金額を保証するものではありません。住宅のために使える毎月の金額から、ローン以外の住居費を引いて返済予算を考えます。</p>
        <figure className="mortgage-editorial-example">
          <figcaption><strong>家計から返済予算を逆算する例</strong><span>住居関連の予算が月12万円、税・保険・修繕の積立が月2万円の場合</span></figcaption>
          <dl className="mortgage-budget-example">
            <div><dt>住居関連の予算</dt><dd>120,000円</dd></div>
            <div><dt>税・保険・修繕への備え</dt><dd>−20,000円</dd></div>
            <div><dt>ローン返済に使える金額</dt><dd>100,000円</dd></div>
          </dl>
          <p className="mortgage-editorial-note">あくまで考え方の例です。実際には物件ごとの費用、生活費、教育費、他の借入、収入の変化、緊急予備資金を反映してください。</p>
        </figure>
        <p>ボーナスや将来の昇給に頼らない返済案も用意し、収入が一時的に減った場合や金利上昇時にも対応できるか確認します。頭金を増やすために手元資金を使い切らず、入居後の支出にも備えましょう。</p>
      </section>

      <section id="okinawa">
        <h2>沖縄の住まいでは、入居後の維持費まで確認する</h2>
        <p>沖縄では台風・海沿いの塩害など、立地や建物の条件によって維持管理の負担が変わります。物件価格だけでなく、屋根・外壁・窓・防水の状態、修繕履歴、風災や水災に対する保険の補償範囲と自己負担額を確認しましょう。</p>
        <p>マンションなら管理費、修繕積立金、今後の増額予定も含めます。戸建てなら将来の修繕を自分で積み立てます。通勤や通学に伴う車の維持費、駐車場代も家計全体に含めて考えます。</p>
        <p>災害リスクは物件ごとに異なります。自治体のハザードマップや国土地理院等のハザードマップポータルで確認し、必要な場合は現地調査や専門家の説明を受けてください。</p>
      </section>

      <section id="questions">
        <h2>金融機関へ確認するときの質問</h2>
        <p>見積書と商品説明書を手元に置き、借入額・期間・返済方式をそろえ、各金融機関に同じ順序で確認します。</p>
        <ol className="knowledge-question-list">
          <li><strong>この金利が適用される条件は何か</strong><span>融資率、給与振込、団信の種類など、金利に影響する条件を確認します。</span></li>
          <li><strong>総返済額に含まれない費用はいくらか</strong><span>初期費用と、借入期間中に発生する費用を分けて確認します。</span></li>
          <li><strong>万一のときの保障範囲はどこまでか</strong><span>団信の対象事由、免責、上乗せ金利や保険料の扱いを確認します。</span></li>
          <li><strong>金利上昇や繰上返済で何が変わるか</strong><span>返済額の見直し方法と、期間短縮・返済額軽減の条件を確認します。</span></li>
        </ol>
      </section>

      <section id="mortgage-faq" className="knowledge-article-faq">
        <h2>よくある質問</h2>
        <details><summary>月々の返済額が少ない方が有利ですか？</summary><p>月々の返済額だけでは判断できません。借入期間全体の総返済額と、手数料や保証料などの費用も同じ条件で比較します。</p></details>
        <details><summary>元利均等返済と元金均等返済はどちらがよいですか？</summary><p>同条件では元金均等返済の総返済額が少なくなる傾向がありますが、返済開始時の負担が大きくなります。家計の余裕と将来の支出を含めて比較します。</p></details>
        <details><summary>シミュレーターの総返済額に諸費用は含まれますか？</summary><p>総返済額は借入元金と利息を中心にした概算です。契約・住宅取得に伴う費用は別に確認してください。</p></details>
        <details><summary>変動金利が上がったときはどうなりますか？</summary><p>金利上昇により利息負担が増える可能性があります。返済額の変更時期や上限、元金の減り方は商品ごとに異なるため、契約書で確認します。</p></details>
        <details><summary>繰上返済はいつ行えばよいですか？</summary><p>利息削減だけでなく、手元資金や今後の支出、手数料、期間短縮型・返済額軽減型の違いを確認します。金融機関ごとに条件が異なります。</p></details>
      </section>

      <p className="knowledge-article-disclaimer">この記事は一般的な比較項目を整理したものです。実際の適用金利、審査、費用、保障条件は金融機関・商品・申込時期によって異なります。</p>
    </KnowledgeArticleLayout>
  )
}

export default MortgageComparisonArticlePage
