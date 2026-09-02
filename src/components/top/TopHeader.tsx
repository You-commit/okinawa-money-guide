import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { routes, simulatorRoutes } from '../../app/routes'
import {
  BuildingIcon,
  CalculatorIcon,
  ChevronDownIcon,
  GrowthChartIcon,
  HouseIcon,
  SearchIcon,
  SproutIcon,
} from './TopIcons'

const simulatorMenuDetails = {
  [routes.militaryLand]: {
    id: 'military',
    description: '利回り・倍率・収支を確認',
    Icon: BuildingIcon,
  },
  [routes.mortgage]: {
    id: 'mortgage',
    description: '返済額と2つの返済方式を比較',
    Icon: HouseIcon,
  },
  [routes.nisa]: {
    id: 'nisa',
    description: '積立・目標額・期間を試算',
    Icon: GrowthChartIcon,
  },
  [routes.ideco]: {
    id: 'ideco',
    description: '掛金と節税効果を確認',
    Icon: SproutIcon,
  },
  [routes.taxableIncome]: {
    id: 'taxable',
    description: '課税所得と税率の目安を確認',
    Icon: CalculatorIcon,
  },
} as const

function BrandMark() {
  return (
    <img
      className="top-option02__brand-mark"
      src="/favicon-192x192.png"
      alt=""
      aria-hidden="true"
      width="44"
      height="44"
      draggable={false}
    />
  )
}

function TopHeader() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false)
  const simulatorMenuRef = useRef<HTMLDivElement>(null)
  const simulatorTriggerRef = useRef<HTMLButtonElement>(null)

  const closeNavigation = () => {
    setIsOpen(false)
    setIsSimulatorOpen(false)
  }

  useEffect(() => {
    if (!isSimulatorOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !simulatorMenuRef.current?.contains(event.target)
      ) {
        setIsSimulatorOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      setIsSimulatorOpen(false)
      simulatorTriggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isSimulatorOpen])

  return (
    <header className="top-option02__header">
      <div className="top-option02__header-inner">
        <Link
          className="top-option02__brand"
          to={routes.home}
          aria-label="沖縄マネーガイド トップへ戻る"
          onClick={closeNavigation}
        >
          <BrandMark />
          <span className="top-option02__brand-copy">
            <strong>沖縄マネーガイド</strong>
            <small>okinawa money guide</small>
          </span>
        </Link>

        <button
          className="top-option02__menu-toggle"
          type="button"
          aria-expanded={isOpen}
          aria-controls="top-option02-navigation"
          onClick={() => setIsOpen((current) => !current)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span className="sr-only">メニューを開閉する</span>
        </button>

        <nav
          id="top-option02-navigation"
          className={
            isOpen
              ? 'top-option02__navigation is-open'
              : 'top-option02__navigation'
          }
          aria-label="メインメニュー"
        >
          <div
            className="top-option02__simulator-menu"
            ref={simulatorMenuRef}
          >
            <button
              className="top-option02__nav-simulators"
              type="button"
              aria-expanded={isSimulatorOpen}
              aria-controls="top-option02-simulator-menu"
              aria-haspopup="true"
              ref={simulatorTriggerRef}
              onClick={() => setIsSimulatorOpen((current) => !current)}
            >
              シミュレーター
              <ChevronDownIcon className="top-option02__nav-chevron" />
            </button>
            <div
              id="top-option02-simulator-menu"
              className={
                isSimulatorOpen
                  ? 'top-option02__simulator-menu-panel is-open'
                  : 'top-option02__simulator-menu-panel'
              }
              aria-label="シミュレーター一覧"
            >
              <div className="top-option02__simulator-menu-heading">
                <div>
                  <p>SIMULATORS</p>
                  <strong>目的に合わせてシミュレーターを選択</strong>
                </div>
              </div>
              <div className="top-option02__simulator-menu-grid">
                {simulatorRoutes.map((item) => {
                  const details = simulatorMenuDetails[item.path]
                  const isCurrent = location.pathname === item.path
                  const Icon = details.Icon

                  return (
                    <Link
                      className="top-option02__simulator-menu-card"
                      data-simulator={details.id}
                      to={item.path}
                      key={item.path}
                      aria-current={isCurrent ? 'page' : undefined}
                      onClick={closeNavigation}
                    >
                      <span className="top-option02__simulator-menu-icon">
                        <Icon />
                      </span>
                      <span className="top-option02__simulator-menu-copy">
                        <strong>{item.label}</strong>
                        <small>{details.description}</small>
                      </span>
                      {isCurrent && (
                        <span className="top-option02__simulator-menu-current">
                          表示中
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
          <Link to={routes.knowledge} onClick={closeNavigation}>記事・コラム</Link>
          <span aria-disabled="true">比較・ランキング<span className="sr-only">（準備中）</span></span>
          <Link to={routes.about} onClick={closeNavigation}>はじめての方へ</Link>
          <Link to={routes.trust} onClick={closeNavigation}>信頼情報</Link>
          <span aria-disabled="true">お問い合わせ<span className="sr-only">（準備中）</span></span>
          <button
            className="top-option02__search"
            type="button"
            aria-label="検索（準備中）"
            disabled
          >
            <SearchIcon />
          </button>
          <Link
            className="top-option02__header-cta"
            to="/#popular-simulators"
            onClick={closeNavigation}
          >
            シミュレーターを試す
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default TopHeader
