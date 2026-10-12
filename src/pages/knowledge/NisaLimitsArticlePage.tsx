import './nisa-v08-fidelity.css'

function NisaLimitsArticlePage() {
  return (
    <div className="n8-page site">
    <a className="n8-skip-link" href="#main-content">本文へ移動</a>
    
    
    <header className="n8-masthead">
      <div className="n8-logo-wrap">
        <div className="n8-logo-mark"></div>
        <div className="n8-logo-name">沖縄マネーガイド</div>
        <div className="n8-logo-tag">okinawa money guide</div>
      </div>
      <div className="n8-masthead-right">信頼できる金融情報とシミュレーション</div>
    </header>
    
    <div className="n8-globalbar">
      <nav className="n8-globalnav">
        <div className="n8-items">
          <a href="/">ホーム</a>
          <a href="/knowledge" className="n8-active">お金の知識</a>
          <a href="/simulators/nisa">シミュレーター</a>
          <span className="n8-nav-disabled">比較・ランキング</span>
          <a href="/trust">信頼情報</a>
          <a href="/about">はじめての方へ</a>
        </div>
        <a className="n8-search" href="/simulators/nisa" aria-label="NISAシミュレーターを試す">⌕</a>
      </nav>
    </div>
    
    <div className="n8-shell">
      <div className="n8-breadcrumb">ホーム 〉 お金の知識 〉 資産形成 〉 NISA（少額投資非課税制度）</div>
    
      <div className="n8-layout">
        <aside className="n8-leftnav">
          <div className="n8-left-actions">
            <a className="n8-left-primary" href="/simulators/nisa">NISAシミュレーター<br />を試す</a>
            <a className="n8-left-secondary" href="/about">はじめての方へ<br />お金の判断ガイド</a>
          </div>
          <div className="n8-left-group">
            <div className="n8-left-group-title">お金の知識</div>
            <a href="/knowledge">資産形成の基本</a>
            <a className="n8-active" href="#nisa-top">NISA</a>
            <a href="#basic">制度の基本</a>
            <a href="#compare">投資枠の違い</a>
            <a href="#cases">活用例</a>
            <a href="#faq">Q&amp;A</a>
          </div>
          <div className="n8-left-group"><div className="n8-left-group-title">住宅ローン</div></div>
          <div className="n8-left-group"><div className="n8-left-group-title">iDeCo</div></div>
          <div className="n8-left-group"><div className="n8-left-group-title">課税所得</div></div>
          <div className="n8-left-group"><div className="n8-left-group-title">軍用地</div></div>
        </aside>
    
        <main className="n8-main" id="main-content">
          <section className="n8-page-intro" id="nisa-top">
            <div className="n8-page-intro-copy">
              <h1>NISA（少額投資非課税制度）</h1>
              <div className="n8-catch">NISAで<br />資産形成を始めよう</div>
              <div className="n8-notice-links">
                <a className="n8-warn" href="#nisa-important"><span className="n8-warnmark">!</span> 投資前に確認したい重要事項</a>
                <span>公開日：<time dateTime="2026-09-21">2026.09.21</time></span><span>制度・情報の基準日：<time dateTime="2026-10-04">2026.10.04</time></span>
                <a href="#nisa-sources">〉 金融庁の一次資料はこちら</a>
              </div>
            </div>
            <div className="n8-seal"><div><small>SOURCE CHECK</small><strong>一次資料</strong><em>優先して確認</em></div></div>
            <div className="n8-seal-caption">制度・税制は金融庁等の一次資料を優先<strong>基準日を明示して確認</strong></div>
          </section>
    
          <div className="n8-tabs">
            <a className="n8-tab n8-active" href="#nisa-top">NISAトップ</a>
            <a className="n8-tab" href="#nisa-frames-tsumitate">つみたて投資枠</a>
            <a className="n8-tab" href="#nisa-frames-growth">成長投資枠</a>
          </div>
    
          <nav className="n8-anchor-nav">
            <a href="#caution">制度の注意点<b>⌄</b></a>
            <a href="#compare">投資枠の違い・活用例<b>⌄</b></a>
            <a href="#merits">判断のポイント<b>⌄</b></a>
            <a href="#faq">Q&amp;A<b>⌄</b></a>
          </nav>
    
          <section className="n8-section" id="basic">
            <header className="n8-section-head"><h2>NISAとは</h2></header>
            <p className="n8-body-copy">NISAは、投資信託や株式などの金融商品から得られる利益が非課税になる制度です。通常の課税口座との違いを、まず数字で確認します。</p>
            <div className="n8-hero-statement">NISAなら運用益が非課税。<br />通常の投資との違いを見てみましょう。</div>
            <div className="n8-footnote">※ 投資成果や元本を保証する制度ではありません。</div>
    
            <div className="n8-tax-title">100万円の利益が出た場合</div>
            <div className="n8-tax-figure" role="img" aria-label="100万円の利益が出た場合の通常の課税口座とNISA口座の税負担比較">
              <div className="n8-tax-cols">
                <div className="n8-tax-col n8-taxed">
                  <div className="n8-tax-label">通常の課税口座</div>
                  <div className="n8-tax-rate">税率 <strong>20.315%</strong></div>
                  <div className="n8-tax-callout">約20万円を納税</div>
                  <div className="n8-profit-area"><div className="n8-tax-loss-note">税金 約20万円</div><div className="n8-profit-bar">約80万円</div></div>
                </div>
                <div className="n8-tax-col n8-nisa">
                  <div className="n8-tax-label">NISA口座なら</div>
                  <div className="n8-tax-rate">税率 <strong>0%</strong></div>
                  <div className="n8-tax-callout">利益は非課税</div>
                  <div className="n8-profit-area n8-profit-area--nisa">
                    <div className="n8-profit-bar">100万円</div>
                    <div className="n8-profit-brace"><span>利益</span></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
    
          <section className="n8-section" id="caution">
            <header className="n8-section-head"><h2>事前に確認したい<br />NISA制度の注意点</h2></header>
            <div className="n8-accordions">
              <details className="n8-acc"><summary>NISAは元本を保証する制度ではありません</summary><p>非課税制度であって、投資商品の値動きによる損失は生じる可能性があります。</p></details>
              <details className="n8-acc"><summary>年間投資枠と非課税保有限度額は別です</summary><p>1年ごとの投資上限と、生涯を通じた非課税保有の総枠を分けて確認します。</p></details>
              <details className="n8-acc"><summary>売却した枠の再利用時期にはルールがあります</summary><p>売却した商品の簿価分は、翌年以降に総枠として再利用できます。</p></details>
            </div>
          </section>
    
          <section className="n8-section n8-gray" id="compare">
            <header className="n8-section-head"><h2>つみたて投資枠と<br />成長投資枠の違い</h2></header>
            <div className="n8-compare-wrap">
              <div className="n8-compare-table">
                <div className="n8-compare-cols">
                  <div className="n8-compare-col" id="nisa-frames-tsumitate">
                    <div className="n8-compare-icon">
                      <svg viewBox="0 0 50 40" fill="none"><path d="M9 30h8V22H9v8Zm12 0h8V16h-8v14Zm12 0h8V9h-8v21Z" stroke="#0b8075" strokeWidth="2"/></svg>
                    </div>
                    <h3>つみたて投資枠</h3>
                    <p>長期・積立・分散投資に適した一定の商品を、積立中心で購入する枠。</p>
                  </div>
                  <div className="n8-compare-col" id="nisa-frames-growth">
                    <div className="n8-compare-icon">
                      <svg viewBox="0 0 50 40" fill="none"><path d="m8 30 10-12 8 7 15-18" stroke="#0b8075" strokeWidth="2"/><circle cx="8" cy="30" r="2" fill="#0b8075"/><circle cx="18" cy="18" r="2" fill="#0b8075"/><circle cx="26" cy="25" r="2" fill="#0b8075"/><circle cx="41" cy="7" r="2" fill="#0b8075"/></svg>
                    </div>
                    <h3>成長投資枠</h3>
                    <p>投資対象や買付方法を広げて利用できる枠。つみたて投資枠と併用可能。</p>
                  </div>
                </div>
                <div className="n8-compare-label">非課税期間</div>
                <div className="n8-compare-span"><strong>無期限</strong></div>
                <div className="n8-compare-label">年間の投資上限額</div>
                <div className="n8-compare-split"><div><strong>120</strong>万円</div><div><strong>240</strong>万円</div></div>
                <div className="n8-compare-label">非課税保有限度額（総枠）</div>
                <div className="n8-compare-span">合計 <strong>1,800</strong>万円<br /><span style={{ fontSize: '12px' }}>うち成長投資枠は1,200万円まで</span></div>
                <div className="n8-compare-label">併用</div>
                <div className="n8-compare-span"><strong>可</strong><br /><span style={{ fontSize: '12px' }}>同じ年に両方の枠を利用できます</span></div>
                <div className="n8-compare-label">購入方法</div>
                <div className="n8-compare-split"><div>積立買付</div><div>積立・一括</div></div>
                <div className="n8-compare-label">詳細</div>
                <div className="n8-compare-buttons"><a href="#nisa-frames-tsumitate">〉 つみたて投資枠</a><a href="#nisa-frames-growth">〉 成長投資枠</a></div>
              </div>
              <div className="n8-notes">※ 制度の対象商品や利用条件は、金融庁・金融機関の最新情報を確認してください。<br />※ 本ページは制度理解のための一般的な情報です。</div>
            </div>
          </section>
    
          <section className="n8-section" id="cases">
            <header className="n8-section-head"><h2>2つの枠の活用例</h2></header>
            <p className="n8-persona-intro">毎月の積立額や追加投資の金額は、それぞれの上限の中で調整できます。</p>
            <div className="n8-persona-help">ⓘ どのくらい積み立てる？</div>
            <div className="n8-personas">
              <article className="n8-persona-row">
                <div className="n8-person-wrap">
                  <div className="n8-person">
                    <svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="19" r="10" stroke="#566976" strokeWidth="2"/><path d="M16 52c2-12 8-18 14-18s12 6 14 18" stroke="#566976" strokeWidth="2"/><path d="M22 17c3-7 14-7 17 0" stroke="#566976" strokeWidth="2"/></svg>
                  </div>
                  <span className="n8-case-pill">Aさんの場合</span>
                  <div className="n8-bubble">買うタイミングに悩むから、毎月同じ金額で積み立てる方が向いているかも。</div>
                  <h3>つみたて投資枠のみを活用</h3>
                  <p>毎月<strong style={{ fontSize: '22px', color: '#173c83' }}>5万円</strong>の積立を続ける例。</p>
                </div>
                <div className="n8-case-chart" role="img" aria-label="毎月5万円を積み立てる期間別イメージ">
                  <div className="n8-chart-note">毎月5万円を積立</div>
                  <div className="n8-bar"><i></i><small>1年</small></div><div className="n8-bar"><i></i><small>5年</small></div><div className="n8-bar"><i></i><small>10年</small></div><div className="n8-bar"><i></i><small>15年</small></div><div className="n8-bar"><i></i><small>20年</small></div><div className="n8-bar"><i></i><small>30年</small></div>
                </div>
              </article>
    
              <article className="n8-persona-row">
                <div className="n8-person-wrap">
                  <div className="n8-person n8-red">
                    <svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="19" r="10" stroke="#566976" strokeWidth="2"/><path d="M16 52c2-12 8-18 14-18s12 6 14 18" stroke="#566976" strokeWidth="2"/><rect x="21" y="16" width="8" height="6" rx="2" stroke="#566976"/><rect x="32" y="16" width="8" height="6" rx="2" stroke="#566976"/><path d="M29 19h3" stroke="#566976"/></svg>
                  </div>
                  <span className="n8-case-pill n8-red">Bさんの場合</span>
                  <div className="n8-bubble">毎月同じ金額を積み立てながら、余裕がある時は追加でも買いたい。</div>
                  <h3 className="n8-red">つみたて投資枠＋成長投資枠</h3>
                  <p>積立に加えて、余裕資金で追加投資する例。</p>
                </div>
                <div className="n8-case-chart n8-red" role="img" aria-label="積立に加えて追加投資する期間別イメージ">
                  <div className="n8-chart-note">積立＋追加投資</div>
                  <div className="n8-bar"><i></i><small>1年</small></div><div className="n8-bar"><i></i><small>2年</small></div><div className="n8-bar"><i></i><small>4年</small></div><div className="n8-bar"><i></i><small>6年</small></div><div className="n8-bar"><i></i><small>8年</small></div><div className="n8-bar"><i></i><small>10年</small></div>
                </div>
              </article>
            </div>
          </section>
    
          <section className="n8-section n8-gray" id="merits">
            <header className="n8-section-head"><h2>NISAの判断で<br />押さえておきたいポイント</h2></header>
            <div className="n8-benefits-area">
              <div className="n8-benefit-grid">
                <article className="n8-benefit">
                  <small>- POINT 1 -</small>
                  <h3>制度の上限と<br />将来額を分ける</h3>
                  <div className="n8-benefit-illus">
                    <svg viewBox="0 0 100 100" fill="none"><rect x="18" y="40" width="64" height="42" rx="4" stroke="#485b66" strokeWidth="2"/><path d="M50 40V18M40 28l10-10 10 10" stroke="#0b8075" strokeWidth="4"/></svg>
                  </div>
                  <p>投資できる枠と、運用後の結果は同じ数字ではありません。</p>
                </article>
                <article className="n8-benefit">
                  <small>- POINT 2 -</small>
                  <h3>年間枠と生涯の総枠を<br />混同しない</h3>
                  <div className="n8-benefit-illus">
                    <svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="28" stroke="#0b8075" strokeWidth="3"/><path d="M50 35v18l12 8" stroke="#485b66" strokeWidth="3"/></svg>
                  </div>
                  <p>年間360万円と非課税保有限度額1,800万円を分けて確認します。</p>
                </article>
                <article className="n8-benefit">
                  <small>- POINT 3 -</small>
                  <h3>売却後の再利用時期を<br />確認する</h3>
                  <div className="n8-benefit-illus">
                    <svg viewBox="0 0 100 100" fill="none"><path d="M25 55a28 28 0 0 0 50 8M75 45a28 28 0 0 0-50-8" stroke="#0b8075" strokeWidth="3"/><path d="m72 29 4 16-15-5M28 71l-4-16 15 5" stroke="#0b8075" strokeWidth="3"/></svg>
                  </div>
                  <p>売却した年の年間枠が増えるわけではありません。</p>
                </article>
                <article className="n8-benefit">
                  <small>- POINT 4 -</small>
                  <h3>試算結果を保証と<br />受け取らない</h3>
                  <div className="n8-benefit-illus">
                    <svg viewBox="0 0 100 100" fill="none"><path d="M20 78h60M25 72V38M38 72V55M51 72V46M64 72V32M77 72V23" stroke="#485b66" strokeWidth="3"/><path d="m28 45 13-8 12 3 20-18" stroke="#0b8075" strokeWidth="3"/></svg>
                  </div>
                  <p>想定利回りを使った将来額は、あくまでシミュレーションです。</p>
                </article>
              </div>
            </div>
          </section>
    
          <section className="n8-section">
            <header className="n8-section-head"><h2>NISAを理解して<br />試算するまでの5ステップ</h2></header>
            <div className="n8-steps">
              <article className="n8-step"><div className="n8-num">1</div><svg viewBox="0 0 80 80" fill="none"><rect x="19" y="14" width="42" height="52" rx="4" stroke="#0b8075" strokeWidth="3"/><path d="M28 28h24M28 38h24M28 48h18" stroke="#4c5f6a" strokeWidth="2"/></svg><strong>制度を知る</strong><p>非課税の仕組みと投資枠を確認。</p></article>
              <article className="n8-step"><div className="n8-num">2</div><svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="22" stroke="#0b8075" strokeWidth="3"/><path d="M29 34h22M29 44h22M36 25v30" stroke="#4c5f6a" strokeWidth="2"/></svg><strong>毎月額を決める</strong><p>生活資金とは別に無理のない額を設定。</p></article>
              <article className="n8-step"><div className="n8-num">3</div><svg viewBox="0 0 80 80" fill="none"><path d="M18 61h44M22 57V29M31 57V42M40 57V36M49 57V25M58 57V17" stroke="#4c5f6a" strokeWidth="3"/><path d="m24 34 10-7 9 2 13-13" stroke="#0b8075" strokeWidth="3"/></svg><strong>将来額を試算</strong><p>期間・想定利回りを変えて比較。</p></article>
              <article className="n8-step"><div className="n8-num">4</div><svg viewBox="0 0 80 80" fill="none"><path d="M40 13 65 61H15L40 13Z" stroke="#0b8075" strokeWidth="3"/><path d="M40 31v14M40 52v2" stroke="#4c5f6a" strokeWidth="3"/></svg><strong>リスクを確認</strong><p>元本保証ではない点を確認。</p></article>
              <article className="n8-step"><div className="n8-num">5</div><svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="24" stroke="#0b8075" strokeWidth="3"/><path d="m28 41 8 8 17-19" stroke="#4c5f6a" strokeWidth="3"/></svg><strong>公式情報で確認</strong><p>金融庁・金融機関で最終条件を確認。</p></article>
            </div>
          </section>
    
          <section className="n8-section" id="faq">
            <header className="n8-section-head"><h2>NISAに関する<br />よくあるご質問</h2></header>
            <div className="n8-faq">
              <details><summary>年間360万円まで投資しないといけませんか？</summary><p>いいえ。年間360万円は上限です。利用額はご自身で決められます。</p></details>
              <details><summary>売却したら、その年に投資枠が戻りますか？</summary><p>その年の年間投資枠は戻りません。簿価分の総枠は翌年以降に再利用できます。</p></details>
              <details><summary>NISAなら損をしませんか？</summary><p>NISAは税制優遇制度です。商品の値動きによる損失を防ぐ制度ではありません。</p></details>
              <details><summary>シミュレーターの将来額は保証されますか？</summary><p>保証されません。入力条件と想定利回りにもとづく概算です。</p></details>
            </div>
          </section>
    
          <section className="n8-section n8-gray">
            <header className="n8-section-head"><h2>NISAについて<br />さらに学ぶ</h2></header>
            <div className="n8-learning-grid">
              <article className="n8-learning-card"><div className="n8-thumb">▶</div><strong>NISAの基本を動画感覚で整理</strong><p>制度の仕組みを短く確認。</p></article>
              <article className="n8-learning-card"><div className="n8-thumb">?</div><strong>金融用語を確認</strong><p>分からない言葉を一つずつ。</p></article>
              <article className="n8-learning-card"><div className="n8-thumb">↗</div><strong>金融庁の一次資料</strong><p>最新制度は公式情報で確認。</p></article>
            </div>
          </section>
    
          <section className="n8-section" id="nisa-sources">
            <header className="n8-section-head"><h2>あわせて確認する</h2></header>
            <div className="n8-linkrows">
              <a href="/simulators/nisa"><b>NISA</b><span>NISAシミュレーター →</span></a>
              <a href="#cases"><b>積立</b><span>積立額・将来額の考え方 →</span></a>
              <a href="/simulators/ideco"><b>関連制度</b><span>iDeCoを確認 →</span></a>
              <a href="https://www.fsa.go.jp/policy/nisa2/know/" target="_blank" rel="noreferrer"><b>一次資料</b><span>金融庁「NISAを知る」 ↗</span></a>
              <a href="https://www.fsa.go.jp/policy/nisa2/question/" target="_blank" rel="noreferrer"><b>一次資料</b><span>金融庁「NISAに関するよくある質問」 ↗</span></a>
            </div>
          </section>
    
          <section className="n8-section" id="nisa-important">
            <header className="n8-section-head"><h2>投資前に確認しておきたい重要事項</h2></header>
            <div className="n8-legal">
              <h3>制度・投資リスクに関する注意</h3>
              <ul>
                <li>NISAは税制優遇制度であり、元本や将来の運用成果を保証する制度ではありません。</li>
                <li>制度内容は変更される可能性があります。基準日と金融庁の一次資料をご確認ください。</li>
                <li>シミュレーター結果は概算であり、実際の運用成果・税額・金融機関の手続きを保証しません。</li>
              </ul>
            </div>
          </section>
        </main>
      </div>
    </div>
    
    <div className="n8-sticky">
      <a className="n8-primary" href="/simulators/nisa">NISAシミュレーターで試算する</a>
      <a className="n8-secondary" href="https://www.fsa.go.jp/policy/nisa2/know/" target="_blank" rel="noreferrer">金融庁のNISA公式情報を確認</a>
    </div>
    
    <footer className="n8-footer">
      <div className="n8-footer-inner">
        <div>
          <p className="n8-footer-name">沖縄マネーガイド</p>
          <p>© 2026 Okinawa Money Guide</p>
        </div>
        <nav aria-label="フッターメニュー">
          <a href="/knowledge">お金の知識</a>
          <a href="/about">このサイトについて</a>
          <a href="/trust">信頼情報</a>
          <a href="/trust#ads">運営・提携方針</a>
        </nav>
      </div>
    </footer>
    
    </div>
  )
}

export default NisaLimitsArticlePage
