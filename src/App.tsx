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

        <section
          className="section tools-section"
          id="tools"
        >
          <div className="section-inner">
            <p className="section-label">
              FREE TOOLS
            </p>

            <h2>無料シミュレーター</h2>

            <p className="section-description">
              数字を入力するだけで、
              簡単に試算できます。
            </p>

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