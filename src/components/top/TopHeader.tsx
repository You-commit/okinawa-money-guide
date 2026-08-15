import { useState } from 'react'
import { ChevronDownIcon, SearchIcon } from './TopIcons'

function BrandMark() {
  return (
    <span className="top-option02__brand-mark" aria-hidden="true">
      <span className="top-option02__brand-stone" />
      <span className="top-option02__brand-wave top-option02__brand-wave--blue" />
      <span className="top-option02__brand-wave top-option02__brand-wave--mint" />
    </span>
  )
}

function TopHeader() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="top-option02__header">
      <div className="top-option02__header-inner">
        <a
          className="top-option02__brand"
          href="#top"
          aria-label="沖縄マネーガイド トップへ戻る"
        >
          <BrandMark />
          <span className="top-option02__brand-copy">
            <strong>沖縄マネーガイド</strong>
            <small>okinawa money guide</small>
          </span>
        </a>

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
          <a
            className="top-option02__nav-simulators"
            href="#popular-simulators"
            onClick={() => setIsOpen(false)}
          >
            シミュレーター
            <ChevronDownIcon className="top-option02__nav-chevron" />
          </a>
          <span aria-disabled="true">記事・コラム</span>
          <span aria-disabled="true">比較・ランキング</span>
          <span aria-disabled="true">はじめての方へ</span>
          <span aria-disabled="true">お問い合わせ</span>
          <button
            className="top-option02__search"
            type="button"
            aria-label="検索（準備中）"
            disabled
          >
            <SearchIcon />
          </button>
          <a
            className="top-option02__header-cta"
            href="#popular-simulators"
            onClick={() => setIsOpen(false)}
          >
            シミュレーターを試す
          </a>
        </nav>
      </div>
    </header>
  )
}

export default TopHeader
