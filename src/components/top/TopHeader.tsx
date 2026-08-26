import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { routes, simulatorRoutes } from '../../app/routes'
import { ChevronDownIcon, SearchIcon } from './TopIcons'

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
  const [isOpen, setIsOpen] = useState(false)
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false)
  const simulatorMenuRef = useRef<HTMLDetailsElement>(null)

  const closeNavigation = () => {
    setIsOpen(false)
    setIsSimulatorOpen(false)
    simulatorMenuRef.current?.removeAttribute('open')
  }

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
          <details
            className="top-option02__simulator-menu"
            ref={simulatorMenuRef}
            onToggle={(event) => setIsSimulatorOpen(event.currentTarget.open)}
          >
            <summary className="top-option02__nav-simulators">
              シミュレーター
              <ChevronDownIcon className="top-option02__nav-chevron" />
            </summary>
            <div className="top-option02__simulator-menu-panel">
              {simulatorRoutes.map((item) => (
                <Link to={item.path} key={item.path} onClick={closeNavigation}>
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
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
      <nav
        className={
          isSimulatorOpen
            ? 'top-option02__simulator-subnav is-open'
            : 'top-option02__simulator-subnav'
        }
        aria-label="シミュレーター一覧"
      >
        {simulatorRoutes.map((item) => (
          <Link to={item.path} key={item.path} onClick={closeNavigation}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}

export default TopHeader
