import { Link } from 'react-router-dom'
import { routes } from '../../app/routes'
import KnowledgeArticleLayout from '../../components/knowledge/KnowledgeArticleLayout'

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
] as const

function MortgageComparisonArticlePage() {
  return (
    <KnowledgeArticleLayout
      eyebrow="MORTGAGE BASICS"
      title="住宅ローン比較で見るべき項目"
      lead="返済方式、金利、総返済額、諸費用、保証、団信。月々の返済額だけでは見えにくい比較の順序を整理します。"
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

      <section className="knowledge-article-takeaways" aria-labelledby="mortgage-article-takeaways">
        <h2 id="mortgage-article-takeaways">この記事で分かること</h2>
        <ul>
          <li>表示金利や月々の返済額だけで住宅ローンを比較しない理由</li>
          <li>元利均等返済と元金均等返済の負担の現れ方の違い</li>
          <li>手数料、保証料、登記費用、団信など、返済額以外に確認する項目</li>
          <li>自分の借入条件をシミュレーターで比較する流れ</li>
        </ul>
      </section>

      <section id="repayment-methods">
        <h2>元利均等と元金均等は、返済額の動きが違う</h2>
        <div className="knowledge-data-table" role="region" aria-label="住宅ローン返済方式の比較" tabIndex={0}>
          <table>
            <thead><tr><th scope="col">比較項目</th><th scope="col">元利均等返済</th><th scope="col">元金均等返済</th></tr></thead>
            <tbody>
              <tr><th scope="row">毎月返済額</th><td>元金と利息の合計が原則一定</td><td>初回が大きく、その後少しずつ減る</td></tr>
              <tr><th scope="row">元金の減り方</th><td>返済当初は元金の減りが緩やか</td><td>毎月同じ元金を返すため早い</td></tr>
              <tr><th scope="row">当初の家計負担</th><td>比較的抑えやすい</td><td>元利均等より大きくなりやすい</td></tr>
              <tr><th scope="row">同条件の総返済額</th><td>元金均等より多くなる傾向</td><td>元利均等より少なくなる傾向</td></tr>
            </tbody>
          </table>
        </div>
        <p>どちらが合うかは、総額だけでなく、返済開始時の収入・支出と将来の家計変化によって異なります。初回返済額と利息総額の両方を見ると、負担の時期と総額のトレードオフを確認できます。</p>
        <Link className="knowledge-inline-cta" to={routes.mortgage}>同じ借入条件で2つの返済方式を比べる <span aria-hidden="true">→</span></Link>
      </section>

      <section id="interest-and-total">
        <h2>金利は「表示された率」だけでなく条件をそろえる</h2>
        <p>固定金利か変動金利か、金利がいつ見直されるか、優遇条件がいつまで続くかで、返済額の見通しは変わります。比較するときは借入額・期間・返済方式・ボーナス返済の有無をそろえます。</p>
        <p>シミュレーターの総返済額は、借入元金と利息を中心にした概算です。契約時や住宅取得時に必要な費用を含めた「支払総額」とは一致しません。</p>
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
      </section>

      <section id="questions">
        <h2>金融機関へ確認するときの質問</h2>
        <ol className="knowledge-question-list">
          <li><strong>この金利が適用される条件は何か</strong><span>融資率、給与振込、団信の種類など、金利に影響する条件を確認します。</span></li>
          <li><strong>総返済額に含まれない費用はいくらか</strong><span>初期費用と、借入期間中に発生する費用を分けて確認します。</span></li>
          <li><strong>万一のときの保障範囲はどこまでか</strong><span>団信の対象事由、免責、上乗せ金利や保険料の扱いを確認します。</span></li>
          <li><strong>金利上昇や繰上返済で何が変わるか</strong><span>返済額の見直し方法と、期間短縮・返済額軽減の条件を確認します。</span></li>
        </ol>
      </section>

      <p className="knowledge-article-disclaimer">この記事は一般的な比較項目を整理したものです。実際の適用金利、審査、費用、保障条件は金融機関・商品・申込時期によって異なります。</p>
    </KnowledgeArticleLayout>
  )
}

export default MortgageComparisonArticlePage
