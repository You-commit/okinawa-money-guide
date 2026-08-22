import {
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import MilitaryLandCalculator from './MilitaryLandCalculator'
import MortgageCalculator from './MortgageCalculator'
import NisaCalculator from './NisaCalculator'
import IdecoCalculator from './IdecoCalculator'
import TopHeader from './components/top/TopHeader'
import TopHero from './components/top/TopHero'
import PopularSimulators, {
  type TopSimulatorId,
} from './components/top/PopularSimulators'
import PurposeGuide from './components/top/PurposeGuide'
import TrustSection from './components/top/TrustSection'
import FloatingSimulatorCta from './components/top/FloatingSimulatorCta'
// import TaxableIncomeCalculator from './TaxableIncomeCalculator'
import './App.css'
import './styles/top-redesign-option02.css'
type ToolId =
  | 'military'
  | 'mortgage'
  | 'nisa'
  | 'ideco'

const tools: Array<{
  id: ToolId
  title: string
  description: ReactNode
  summary: ReactNode
}> = [
    {
      id: 'military',
      title: '軍用地利回り',
      description: (
        <>
          <span className="text-keep">購入価格と</span>
          <wbr />
          <span className="text-keep">年間借地料から</span>
          <wbr />
          <span className="text-keep">利回りを計算</span>
        </>
      ),
      summary: (
        <>
          <span className="text-keep">軍用地の購入を</span>
          <wbr />
          <span className="text-keep">検討するときに、</span>
          <wbr />
          <span className="text-keep">年間借地料から</span>
          <wbr />
          <span className="text-keep">おおよその利回りを</span>
          <wbr />
          <span className="text-keep">確認できます。</span>
        </>
      ),
    },
    {
      id: 'mortgage',
      title: '住宅ローン',
      description: (
        <>
          <span className="text-keep">借入金額から</span>
          <wbr />
          <span className="text-keep">毎月の返済額を計算</span>
        </>
      ),
      summary: (
        <>
          <span className="text-keep">借入金額や金利、</span>
          <wbr />
          <span className="text-keep">返済期間から、</span>
          <wbr />
          <span className="text-keep">毎月の返済額と</span>
          <wbr />
          <span className="text-keep">総返済額の目安を</span>
          <wbr />
          <span className="text-keep">確認できます。</span>
        </>
      ),
    },
    {
      id: 'nisa',
      title: 'NISA積立',
      description: (
        <>
          <span className="text-keep">積立による</span>
          <wbr />
          <span className="text-keep">将来の資産額を計算</span>
        </>
      ),
      summary: (
        <>
          <span className="text-keep">毎月の積立額と</span>
          <wbr />
          <span className="text-keep">運用期間から、</span>
          <wbr />
          <span className="text-keep">将来の資産額の</span>
          <wbr />
          <span className="text-keep">目安を</span>
          <wbr />
          <span className="text-keep">シミュレーションできます。</span>
        </>
      ),
    },
    {
      id: 'ideco',
      title: 'iDeCo節税',
      description: (
        <>
          <span className="text-keep">掛金による</span>
          <wbr />
          <span className="text-keep">節税額を計算</span>
        </>
      ),
      summary: (
        <>
          <span className="text-keep">掛金や所得税率から、</span>
          <wbr />
          <span className="text-keep">将来の資産額と</span>
          <wbr />
          <span className="text-keep">節税効果の目安を</span>
          <wbr />
          <span className="text-keep">確認できます。</span>
        </>
      ),
    },
  ]

function ToolIcon({ toolId }: { toolId: ToolId }) {
  if (toolId === 'military') {
    return (
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M8 38h32" />
        <path d="M14 38V17h20v21" />
        <path d="M19 22h4v4h-4zM27 22h4v4h-4zM19 30h4v4h-4zM27 30h4v4h-4z" />
        <path d="M10 33c2-4 5-5 8-5M38 33c-2-4-5-5-8-5" />
      </svg>
    )
  }

  if (toolId === 'mortgage') {
    return (
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M7 23 24 9l17 14" />
        <path d="M12 21v18h24V21" />
        <path d="M20 39V28h8v11" />
      </svg>
    )
  }

  if (toolId === 'nisa') {
    return (
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M10 38V27h7v11M21 38V20h7v18M32 38V13h7v25" />
        <path d="m10 20 10-7 8 3 11-9" />
        <path d="M34 7h5v5" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="24" cy="15" r="7" />
      <path d="M11 39c1-9 6-14 13-14s12 5 13 14" />
      <path d="M16 32h16" />
    </svg>
  )
}

function App() {
  const [
    selectedTool,
    setSelectedTool,
  ] = useState<ToolId>('military')

  const selectedToolData =
    tools.find(
      (tool) => tool.id === selectedTool,
    ) ?? tools[0]

  const [
    isTaxableIncomeOpen,
    setIsTaxableIncomeOpen,
  ] = useState(false)

  const toggleTaxableIncome = () => {
    setIsTaxableIncomeOpen(
      (currentState) => !currentState,
    )
  }

  const handleMobileToolSelect = (
    toolId: ToolId,
  ) => {
    setSelectedTool(toolId)

    window.setTimeout(() => {
      const behavior = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
        ? 'auto'
        : 'smooth'

      document
        .getElementById(
          `tool-panel-${toolId}`,
        )
        ?.scrollIntoView({
          behavior,
          block: 'start',
        })
    }, 0)
  }

  const handleTopSimulatorSelect = (
    toolId: TopSimulatorId,
  ) => {
    setSelectedTool(toolId)

    window.setTimeout(() => {
      const behavior = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
        ? 'auto'
        : 'smooth'

      document
        .getElementById(
          `tool-panel-${toolId}`,
        )
        ?.scrollIntoView({
          behavior,
          block: 'start',
        })
    }, 0)
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
    <div className="site top-option02" id="top">
      <TopHeader />

      <main>
        <TopHero />
        <PopularSimulators
          onSelectSimulator={
            handleTopSimulatorSelect
          }
        />
        <PurposeGuide />
        <TrustSection />

        <section className="section tools-section">
          <div className="section-inner">
            <div
              className="section-heading tools-heading"
              id="tools"
            >
              <div>
                <p className="section-label">
                  FREE TOOLS
                </p>
                <h2>無料シミュレーター</h2>
              </div>

              <p className="section-description">
                <span className="text-keep">目的に合うツールを選び、</span>
                <wbr />
                <span className="text-keep">条件を入力するだけで</span>
                <wbr />
                <span className="text-keep">試算できます。</span>
                <wbr />
                <span className="text-keep">結果は判断材料の</span>
                <wbr />
                <span className="text-keep">ひとつとして</span>
                <wbr />
                <span className="text-keep">ご利用ください。</span>
              </p>
            </div>

            <div className="simulator-shell">
              <div className="tool-tabs-heading">
                <span>シミュレーターを選択</span>
                <small>
                  目的に合った計算ツールを選んでください
                </small>
              </div>

              <div className="mobile-tool-selector">
                <div className="mobile-tool-selector__heading">
                  <div>
                    <strong>ツールの内容を確認</strong>
                    <small>
                      選ぶと説明が切り替わります
                    </small>
                  </div>
                  <span>全4ツール</span>
                </div>

                <label className="mobile-tool-select">
                  <span className="sr-only">
                    内容を確認するシミュレーターを選択
                  </span>
                  <span
                    className={`mobile-tool-icon mobile-tool-icon--${selectedToolData.id}`}
                    aria-hidden="true"
                  >
                    <ToolIcon toolId={selectedToolData.id} />
                  </span>
                  <select
                    value={selectedTool}
                    onChange={(event) =>
                      setSelectedTool(
                        event.target.value as ToolId,
                      )
                    }
                  >
                    {tools.map((tool) => (
                      <option value={tool.id} key={tool.id}>
                        {tool.title}
                      </option>
                    ))}
                  </select>
                  <span
                    className="mobile-tool-select__chevron"
                    aria-hidden="true"
                  />
                </label>

                <article
                  className="mobile-tool-summary"
                  id="mobile-selected-tool"
                >
                  <div className="mobile-tool-summary__header">
                    <span
                      className={`mobile-tool-icon mobile-tool-icon--${selectedToolData.id}`}
                      aria-hidden="true"
                    >
                      <ToolIcon toolId={selectedToolData.id} />
                    </span>
                    <div>
                      <h3>{selectedToolData.title}</h3>
                      <p>{selectedToolData.description}</p>
                    </div>
                  </div>

                  <p className="mobile-tool-summary__description">
                    {selectedToolData.summary}
                  </p>

                  <a
                    className="mobile-tool-summary__action"
                    href={`#tool-panel-${selectedToolData.id}`}
                  >
                    このシミュレーターを使う
                    <span aria-hidden="true">→</span>
                  </a>
                </article>

                <div className="mobile-tool-grid-heading">
                  <span>4つのシミュレーター</span>
                  <small>
                    選ぶとシミュレーターへ移動します
                  </small>
                </div>

                <div
                  className="mobile-tool-grid"
                  role="group"
                  aria-label="4つのシミュレーター"
                >
                  {tools.map((tool) => {
                    const isSelected =
                      selectedTool === tool.id

                    return (
                      <button
                        className={
                          isSelected
                            ? 'mobile-tool-card is-active'
                            : 'mobile-tool-card'
                        }
                        type="button"
                        aria-pressed={isSelected}
                        key={tool.id}
                        onClick={() =>
                          handleMobileToolSelect(
                            tool.id,
                          )
                        }
                      >
                        <span
                          className={`mobile-tool-icon mobile-tool-icon--${tool.id}`}
                          aria-hidden="true"
                        >
                          <ToolIcon toolId={tool.id} />
                        </span>

                        {isSelected && (
                          <span className="mobile-tool-card__status">
                            選択中
                          </span>
                        )}

                        <strong>{tool.title}</strong>
                        <small>{tool.description}</small>
                        <span
                          className="mobile-tool-card__chevron"
                          aria-hidden="true"
                        >
                          ›
                        </span>
                      </button>
                    )
                  })}
                </div>
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

        <section className="section category-section">
          <div className="section-inner">
            <div
              className="section-anchor-heading"
              id="categories"
            >
              <p className="section-label">MONEY GUIDE</p>
              <h2>沖縄のお金を学ぶ</h2>
            </div>

            <div className="category-grid">
              <article>
                <h3>ローン</h3>
                <p>
                  <span className="text-keep">住宅・自動車・教育・</span>
                  <wbr />
                  <span className="text-keep">軍用地ローンの</span>
                  <wbr />
                  <span className="text-keep">基礎知識</span>
                </p>
              </article>

              <article>
                <h3>資産運用</h3>
                <p>
                  <span className="text-keep">NISA・iDeCo・投資信託を</span>
                  <wbr />
                  <span className="text-keep">分かりやすく解説</span>
                </p>
              </article>

              <article>
                <h3>軍用地</h3>
                <p>
                  <span className="text-keep">仕組み・利回り・</span>
                  <wbr />
                  <span className="text-keep">購入時の注意点を紹介</span>
                </p>
              </article>

              <article>
                <h3>保険・家計</h3>
                <p>
                  <span className="text-keep">保険や家計管理に役立つ</span>
                  <wbr />
                  <span className="text-keep">情報を紹介</span>
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section about-section">
          <div className="section-inner narrow">
            <div
              className="section-anchor-heading"
              id="about"
            >
              <p className="section-label">ABOUT</p>
              <h2>
                <span className="text-keep">沖縄マネーガイド</span>
                <wbr />
                <span className="text-keep">について</span>
              </h2>
            </div>
            <p>
              <span className="text-keep">沖縄マネーガイドは、</span>
              <wbr />
              <span className="text-keep">沖縄で暮らす人が</span>
              <wbr />
              <span className="text-keep">お金について調べる際に、</span>
              <wbr />
              <span className="text-keep">複雑な情報を</span>
              <wbr />
              <span className="text-keep">できるだけ分かりやすく</span>
              <wbr />
              <span className="text-keep">理解できることを目指す</span>
              <wbr />
              <span className="text-keep">情報サイトです。</span>
            </p>
          </div>
        </section>
      </main>

      <FloatingSimulatorCta />

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
