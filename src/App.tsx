import {
  useState,
  type KeyboardEvent,
} from 'react'
import MilitaryLandCalculator from './MilitaryLandCalculator'
import MortgageCalculator from './MortgageCalculator'
import NisaCalculator from './NisaCalculator'
import IdecoCalculator from './IdecoCalculator'
// import TaxableIncomeCalculator from './TaxableIncomeCalculator'
import './App.css'
type ToolId =
  | 'military'
  | 'mortgage'
  | 'nisa'
  | 'ideco'

const tools: Array<{
  id: ToolId
  title: string
  description: string
}> = [
    {
      id: 'military',
      title: '軍用地利回り',
      description:
        '購入価格と年間借地料から利回りを計算',
    },
    {
      id: 'mortgage',
      title: '住宅ローン',
      description:
        '借入金額から毎月の返済額を計算',
    },
    {
      id: 'nisa',
      title: 'NISA積立',
      description:
        '積立による将来の資産額を計算',
    },
    {
      id: 'ideco',
      title: 'iDeCo節税',
      description:
        '掛金による節税額を計算',
    },
  ]

function App() {
  const [
    isNavigationOpen,
    setIsNavigationOpen,
  ] = useState(false)

  const [
    selectedTool,
    setSelectedTool,
  ] = useState<ToolId>('military')

  const [
    isTaxableIncomeOpen,
    setIsTaxableIncomeOpen,
  ] = useState(false)

  const toggleTaxableIncome = () => {
    setIsTaxableIncomeOpen(
      (currentState) => !currentState,
    )
  }

  const handleToolTabKeyDown = (
    event:
      KeyboardEvent<HTMLButtonElement>,
    currentToolId: ToolId,
  ) => {
    const currentIndex =
      tools.findIndex(
        (tool) =>
          tool.id === currentToolId,
      )

    let nextIndex = currentIndex

    if (
      event.key === 'ArrowRight' ||
      event.key === 'ArrowDown'
    ) {
      nextIndex =
        (currentIndex + 1) %
        tools.length
    } else if (
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowUp'
    ) {
      nextIndex =
        (currentIndex -
          1 +
          tools.length) %
        tools.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = tools.length - 1
    } else {
      return
    }

    event.preventDefault()

    const nextTool = tools[nextIndex]

    setSelectedTool(nextTool.id)

    window.setTimeout(() => {
      document
        .getElementById(
          `tool-tab-${nextTool.id}`,
        )
        ?.focus()
    }, 0)
  }

  return (
    <div className="site" id="top">
      <header className="header">
        <div className="header-inner">
          <a
            className="site-brand"
            href="#top"
            aria-label="沖縄マネーガイド トップへ戻る"
          >
            <span
              className="site-brand__mark"
              aria-hidden="true"
            >
              <span className="site-brand__stone" />
              <span className="site-brand__wave site-brand__wave--blue" />
              <span className="site-brand__wave site-brand__wave--green" />
            </span>

            <span className="site-brand__copy">
              <strong>沖縄マネーガイド</strong>
              <small>OKINAWA MONEY GUIDE</small>
            </span>
          </a>

          <button
            className="navigation-toggle"
            type="button"
            aria-expanded={isNavigationOpen}
            aria-controls="site-navigation"
            onClick={() =>
              setIsNavigationOpen(
                (currentState) =>
                  !currentState,
              )
            }
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span className="sr-only">
              メニューを開閉する
            </span>
          </button>

          <nav
            id="site-navigation"
            className={
              isNavigationOpen
                ? 'navigation is-open'
                : 'navigation'
            }
            aria-label="メインメニュー"
          >
            <a
              className="navigation__primary"
              href="#tools"
              onClick={() =>
                setIsNavigationOpen(false)
              }
            >
              無料ツール
            </a>
            <a
              href="#categories"
              onClick={() =>
                setIsNavigationOpen(false)
              }
            >
              お金の知識
            </a>
            <a
              href="#about"
              onClick={() =>
                setIsNavigationOpen(false)
              }
            >
              このサイトについて
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section
          className="hero"
          aria-labelledby="hero-title"
        >
          <div className="hero-inner">
            <div className="hero-copy">
              <p className="hero-kicker">
                <span aria-hidden="true" />
                沖縄で暮らす人のお金の情報サイト
              </p>

              <h1 id="hero-title">
                <span>沖縄で暮らす人の</span>
                <span>
                  <em>お金の判断</em>を、
                </span>
                <span>もっと分かりやすく。</span>
              </h1>

              <p className="hero-description">
                軍用地、住宅ローン、NISA、iDeCo。
                沖縄に身近なお金のテーマを、
                試算と解説で落ち着いて理解できる場所を目指します。
              </p>

              <div className="hero-actions">
                <a
                  className="primary-button"
                  href="#tools"
                >
                  無料ツールを使う
                  <span aria-hidden="true">→</span>
                </a>
                <a
                  className="secondary-button"
                  href="#categories"
                >
                  お金の知識を見る
                </a>
              </div>

              <ul
                className="hero-points"
                aria-label="サイトの特徴"
              >
                <li>無料で利用</li>
                <li>登録不要</li>
                <li>沖縄に身近なテーマ</li>
              </ul>
            </div>

            <div
              className="hero-visual"
              aria-label="条件入力から比較までの利用イメージ"
            >
              <div
                className="hero-visual__halo"
                aria-hidden="true"
              />
              <div className="hero-visual__card">
                <p className="hero-visual__label">
                  MONEY DECISION SUPPORT
                </p>
                <strong>
                  数字を、納得できる
                  <span>判断へ。</span>
                </strong>
                <p className="hero-visual__description">
                  条件に応じた試算と、
                  地域に根ざした解説をひとつの場所に。
                </p>

                <ol className="hero-steps">
                  <li>
                    <span>01</span>
                    <div>
                      <strong>条件を入力</strong>
                      <small>数字を入れるだけ</small>
                    </div>
                  </li>
                  <li>
                    <span>02</span>
                    <div>
                      <strong>結果を比較</strong>
                      <small>違いを見える化</small>
                    </div>
                  </li>
                  <li>
                    <span>03</span>
                    <div>
                      <strong>意味を理解</strong>
                      <small>判断材料を整理</small>
                    </div>
                  </li>
                </ol>

                <div
                  className="hero-visual__topics"
                  aria-label="主なテーマ"
                >
                  <span>軍用地</span>
                  <span>住宅ローン</span>
                  <span>NISA</span>
                  <span>iDeCo</span>
                </div>
              </div>
              <div
                className="hero-visual__wave hero-visual__wave--blue"
                aria-hidden="true"
              />
              <div
                className="hero-visual__wave hero-visual__wave--green"
                aria-hidden="true"
              />
            </div>
          </div>
        </section>

        <section
          className="section tools-section"
          id="tools"
        >
          <div className="section-inner">
            <div className="section-heading tools-heading">
              <div>
                <p className="section-label">
                  FREE TOOLS
                </p>
                <h2>無料シミュレーター</h2>
              </div>

              <p className="section-description">
                目的に合うツールを選び、
                条件を入力するだけで試算できます。
                結果は判断材料のひとつとしてご利用ください。
              </p>
            </div>

            <div className="simulator-shell">
              <div className="tool-tabs-heading">
                <span>シミュレーターを選択</span>
                <small>
                  目的に合った計算ツールを選んでください
                </small>
              </div>

              <div
                className="tool-tabs"
                role="tablist"
                aria-label="シミュレーターを選択"
              >
                {tools.map((tool) => {
                  const isSelected =
                    selectedTool === tool.id

                  return (
                    <button
                      id={`tool-tab-${tool.id}`}
                      className={
                        isSelected
                          ? 'tool-tab is-active'
                          : 'tool-tab'
                      }
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      aria-controls={
                        `tool-panel-${tool.id}`
                      }
                      tabIndex={
                        isSelected ? 0 : -1
                      }
                      key={tool.id}
                      onClick={() =>
                        setSelectedTool(tool.id)
                      }
                      onKeyDown={(event) =>
                        handleToolTabKeyDown(
                          event,
                          tool.id,
                        )
                      }
                    >
                      <strong>
                        {tool.title}
                      </strong>

                      <small>
                        {tool.description}
                      </small>
                    </button>
                  )
                })}
              </div>

              <div className="simulator-panels">
                <div
                  id="tool-panel-military"
                  className="tool-panel"
                  role="tabpanel"
                  aria-labelledby="tool-tab-military"
                  hidden={
                    selectedTool !== 'military'
                  }
                >
                  <MilitaryLandCalculator />
                </div>

                <div
                  id="tool-panel-mortgage"
                  className="tool-panel"
                  role="tabpanel"
                  aria-labelledby="tool-tab-mortgage"
                  hidden={
                    selectedTool !== 'mortgage'
                  }
                >
                  <MortgageCalculator />
                </div>

                <div
                  id="tool-panel-nisa"
                  className="tool-panel"
                  role="tabpanel"
                  aria-labelledby="tool-tab-nisa"
                  hidden={
                    selectedTool !== 'nisa'
                  }
                >
                  <NisaCalculator />
                </div>

                <div
                  id="tool-panel-ideco"
                  className="tool-panel"
                  role="tabpanel"
                  aria-labelledby="tool-tab-ideco"
                  hidden={
                    selectedTool !== 'ideco'
                  }
                >
                  <IdecoCalculator
                    isTaxableIncomeOpen={
                      isTaxableIncomeOpen
                    }
                    onToggleTaxableIncome={
                      toggleTaxableIncome
                    }
                  />
                </div>
              </div>
            </div>
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