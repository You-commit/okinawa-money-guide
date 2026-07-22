import MilitaryLandCalculator from './MilitaryLandCalculator'
import './App.css'

const tools = [
  {
    title: '軍用地利回り計算',
    description: '年間借地料や購入価格から、軍用地の利回りを計算します。',
    status: '準備中',
  },
  {
    title: '住宅ローン返済計算',
    description: '借入金額・金利・返済期間から、毎月の返済額を計算します。',
    status: '準備中',
  },
  {
    title: 'NISA積立計算',
    description: '毎月の積立額と運用期間から、将来の資産額を試算します。',
    status: '準備中',
  },
]

function App() {
  return (
    <div className="site">
      <header className="header">
        <div className="header-inner">
          <a className="site-name" href="/">
            沖縄マネーガイド
          </a>

          <nav className="navigation" aria-label="メインメニュー">
            <a href="#tools">無料ツール</a>
            <a href="#categories">お金の知識</a>
            <a href="#about">このサイトについて</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-inner">
            <p className="hero-label">沖縄で暮らす人のお金の情報サイト</p>

            <h1>
              沖縄のお金を、
              <br />
              もっと分かりやすく。
            </h1>

            <p className="hero-description">
              ローン、資産運用、軍用地など、沖縄に関係するお金の情報と
              便利な計算ツールを提供します。
            </p>

            <a className="primary-button" href="#tools">
              無料ツールを見る
            </a>
          </div>
        </section>

        <section className="section" id="tools">
          <div className="section-inner">
            <p className="section-label">FREE TOOLS</p>
            <h2>無料シミュレーター</h2>
            <p className="section-description">
              数字を入力するだけで、簡単に試算できます。
            </p>

            <div className="tool-grid">
              {tools.map((tool) => (
                <article className="tool-card" key={tool.title}>
                  <span className="status">{tool.status}</span>
                  <h3>{tool.title}</h3>
                  <p>{tool.description}</p>
                  <button type="button" disabled>
                    公開までお待ちください
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="section calculator-section">
          <div className="section-inner">
            <MilitaryLandCalculator />
          </div>
        </section>
        <section className="section category-section" id="categories">
          <div className="section-inner">
            <p className="section-label">MONEY GUIDE</p>
            <h2>沖縄のお金を学ぶ</h2>

            <div className="category-grid">
              <article>
                <h3>ローン</h3>
                <p>住宅・自動車・教育・軍用地ローンの基礎知識</p>
              </article>

              <article>
                <h3>資産運用</h3>
                <p>NISA・iDeCo・投資信託を分かりやすく解説</p>
              </article>

              <article>
                <h3>軍用地</h3>
                <p>仕組み・利回り・購入時の注意点を紹介</p>
              </article>

              <article>
                <h3>保険・家計</h3>
                <p>保険や家計管理に役立つ情報を紹介</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section about-section" id="about">
          <div className="section-inner narrow">
            <p className="section-label">ABOUT</p>
            <h2>沖縄マネーガイドについて</h2>
            <p>
              沖縄マネーガイドは、沖縄で暮らす人がお金について調べる際に、
              複雑な情報をできるだけ分かりやすく理解できることを目指す情報サイトです。
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <p className="footer-name">沖縄マネーガイド</p>
          <p>© 2026 Okinawa Money Guide</p>
        </div>
      </footer>
    </div>
  )
}

export default App