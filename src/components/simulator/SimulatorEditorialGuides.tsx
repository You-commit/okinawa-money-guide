import { Link } from 'react-router-dom'
import { routes } from '../../app/routes'

export function MilitaryLandEditorialGuide() {
  return (
    <section className="simulator-guide simulator-guide--military" aria-labelledby="military-guide-title">
      <header>
        <p>RESULT GUIDE</p>
        <h2 id="military-guide-title">倍率と利回りを、同じ条件から読み解く</h2>
        <span>軍用地の価格は倍率で示されることがありますが、利回りとの関係を分けて確認すると比較しやすくなります。</span>
      </header>
      <div className="simulator-guide__formula-pair">
        <p><strong>購入価格</strong><span>年間借地料 × 倍率</span></p>
        <p><strong>表面利回り</strong><span>年間借地料 ÷ 購入価格 × 100</span></p>
      </div>
      <div className="simulator-guide__body">
        <div>
          <h3>結果を見る順序</h3>
          <p>表面利回りで収入と価格の関係を見たあと、固定資産税や管理費を差し引いた費用控除後利回りを確認します。借入返済は物件そのものの収支と分けて読みます。</p>
        </div>
        <ul>
          <li>年間借地料の根拠と改定条件</li>
          <li>固定資産税・管理費など継続費用</li>
          <li>共有持分の場合の権利範囲と手続き</li>
          <li>売却時の価格や流動性を別途確認</li>
        </ul>
      </div>
    </section>
  )
}

export function MortgageEditorialGuide() {
  return (
    <section className="simulator-guide simulator-guide--mortgage" aria-labelledby="mortgage-guide-title">
      <header>
        <p>HOW TO READ</p>
        <h2 id="mortgage-guide-title">返済額は「毎月・利息・総額」の順で確認する</h2>
        <span>月々の負担だけでなく、支払利息と返済期間全体の総負担まで同じ条件で並べて確認すると、返済方式の違いを整理しやすくなります。</span>
      </header>

      <dl className="simulator-guide__definitions" aria-label="住宅ローン結果を見る3つのポイント">
        <div>
          <dt>1. 毎月の返済額</dt>
          <dd>家計から無理なく支払い続けられる水準かを確認します。</dd>
        </div>
        <div>
          <dt>2. 支払利息</dt>
          <dd>借入期間を通じて、元金以外にどれだけ負担するかを確認します。</dd>
        </div>
        <div>
          <dt>3. 総返済額</dt>
          <dd>元金と利息を合わせた返済全体の大きさを比較します。</dd>
        </div>
      </dl>

      <div className="simulator-guide__comparison" aria-label="元利均等返済と元金均等返済の比較">
        <div>
          <strong>元利均等返済</strong>
          <span>毎月返済額が原則一定で、家計管理をしやすい一方、元金の減り方は比較的ゆるやかです。</span>
        </div>
        <div>
          <strong>元金均等返済</strong>
          <span>当初の返済額は大きくなりますが、元金の減りが早く、条件によっては支払利息を抑えやすい方式です。</span>
        </div>
      </div>

      <div className="simulator-guide__body">
        <div>
          <h3>この試算に含まれない主な費用</h3>
          <p>事務手数料、保証料、登記費用、火災・地震保険、団信の上乗せ金利などは金融機関や商品によって異なるため、返済額とは分けて確認します。</p>
        </div>
        <ul>
          <li>変動金利の場合の将来の金利変動</li>
          <li>繰上返済による返済額・返済期間の変化</li>
          <li>金融機関ごとの端数処理や返済日の扱い</li>
          <li>諸費用を含めた借入時の総負担</li>
        </ul>
      </div>

      <p className="simulator-guide__decision-link">
        シミュレーション結果を候補条件の整理に使い、最後は金利タイプ・諸費用・団信・繰上返済条件まで金融機関ごとに確認してください。
        <Link to={routes.knowledgeMortgageComparison}>住宅ローン比較の記事を読む <span aria-hidden="true">→</span></Link>
      </p>
    </section>
  )
}

export function NisaEditorialGuide() {
  return (
    <section className="simulator-guide simulator-guide--nisa" aria-labelledby="nisa-guide-title">
      <header>
        <p>READ THE RESULT</p>
        <h2 id="nisa-guide-title">制度枠と将来額を混同しない</h2>
        <span>NISAの枠は買付額を基準にし、将来資産額は想定利回りに基づく試算として読みます。</span>
      </header>
      <dl className="simulator-guide__definitions">
        <div><dt>元本</dt><dd>積み立てた金額の合計。制度枠との比較の基礎になります。</dd></div>
        <div><dt>運用収益</dt><dd>将来額と元本の差。相場によってマイナスになる可能性があります。</dd></div>
        <div><dt>想定利回り</dt><dd>将来を考えるための仮定で、成果の保証ではありません。</dd></div>
      </dl>
      <p className="simulator-guide__decision-link">
        年間120万円・360万円の枠と、1,800万円の総枠は役割が異なります。
        <Link to={routes.knowledgeNisaLimits}>NISAの枠と積立額の記事を読む <span aria-hidden="true">→</span></Link>
      </p>
    </section>
  )
}

export function IdecoEditorialGuide() {
  return (
    <section className="simulator-guide simulator-guide--ideco" aria-labelledby="ideco-guide-title">
      <header>
        <p>RESULT GUIDE</p>
        <h2 id="ideco-guide-title">今の節税額と、受取時の税制を分けて考える</h2>
        <span>掛金による所得控除の効果は現在の所得状況で変わり、将来の受取時には別の税制が関係します。</span>
      </header>
      <div className="simulator-guide__timeline">
        <div><strong>拠出時</strong><span>加入区分・制度適用日・掛金上限を確認</span></div>
        <i aria-hidden="true" />
        <div><strong>毎年</strong><span>所得税・住民税の軽減額を概算</span></div>
        <i aria-hidden="true" />
        <div><strong>受取時</strong><span>受取方法とその時点の税制を別途確認</span></div>
      </div>
      <p className="simulator-guide__decision-link">
        詳細計算に使う課税所得が分からない場合は、先に給与収入と控除を整理できます。
        <Link to={`${routes.taxableIncome}?return=ideco`}>自分の所得税率を調べる <span aria-hidden="true">→</span></Link>
      </p>
    </section>
  )
}

export function TaxableIncomeEditorialGuide() {
  return (
    <section className="simulator-guide simulator-guide--taxable" aria-labelledby="taxable-guide-title">
      <header>
        <p>CALCULATION FLOW</p>
        <h2 id="taxable-guide-title">収入・所得・課税所得・税率は別の段階</h2>
        <span>表示された税率だけでなく、どの金額から計算されたかを順にたどります。</span>
      </header>
      <div className="simulator-guide__flow" aria-label="所得税計算の流れ">
        <span>給与収入</span><b aria-hidden="true">→</b><span>給与所得</span><b aria-hidden="true">→</b><span>課税所得</span><b aria-hidden="true">→</b><span>所得税率</span>
      </div>
      <div className="simulator-guide__body">
        <div><h3>所得税</h3><p>課税所得に応じた超過累進税率と控除額を使います。</p></div>
        <div><h3>住民税</h3><p>所得税とは控除・税率・計算時期が異なるため、参考値として分けて確認します。</p></div>
      </div>
    </section>
  )
}
