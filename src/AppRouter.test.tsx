// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const renderAt = (path: string) => {
  window.history.replaceState({}, '', path)
  return render(<App />)
}

describe('dedicated page routing', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn())
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 0
    })
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it.each([
    ['/', '沖縄で暮らす人のお金の判断を、もっと分かりやすく。'],
    ['/simulators/military-land', '軍用地利回りシミュレーター'],
    ['/simulators/mortgage', '住宅ローンシミュレーター'],
    ['/simulators/nisa', 'NISAシミュレーター'],
    ['/simulators/ideco', 'iDeCo節税シミュレーター'],
    ['/simulators/taxable-income', '課税所得・所得税率シミュレーター'],
    ['/knowledge', '今の目的から、知るべきお金のことへ'],
    ['/about', '沖縄のお金の判断を、落ち着いて整理できる場所へ'],
    ['/trust', '判断材料を届けるための、情報と運営の方針'],
  ])('renders %s as a dedicated route', (path, heading) => {
    renderAt(path)
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeTruthy()
    expect(document.querySelectorAll('h1')).toHaveLength(1)
  })

  it('renders a 404 page for an unknown URL', () => {
    renderAt('/missing-page')
    expect(screen.getByRole('heading', { level: 1, name: 'ページが見つかりません' })).toBeTruthy()
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, follow')
    expect(document.querySelector('link[rel="canonical"]')).toBeNull()
    expect(document.querySelector('meta[property^="og:"]')).toBeNull()
  })

  it('keeps the Trust Center content without an unexplained decorative count', () => {
    const { container } = renderAt('/trust')
    const trustConsole = container.querySelector<HTMLElement>('.trust-console')!

    expect(within(trustConsole).getByText('TRUST CENTER')).toBeTruthy()
    expect(within(trustConsole).getAllByText(
      /一次資料|更新・訂正|計算方針|データ保護|広告・提携|問い合わせ/,
    )).toHaveLength(6)
    expect(within(trustConsole).queryByText('06')).toBeNull()
  })

  it.each([
    ['/', 'https://okinawamoneyguide.jp/'],
    ['/simulators/military-land', 'https://okinawamoneyguide.jp/simulators/military-land'],
    ['/simulators/mortgage', 'https://okinawamoneyguide.jp/simulators/mortgage'],
    ['/simulators/nisa', 'https://okinawamoneyguide.jp/simulators/nisa'],
    ['/simulators/ideco?incomeTaxRate=10', 'https://okinawamoneyguide.jp/simulators/ideco'],
    ['/simulators/taxable-income', 'https://okinawamoneyguide.jp/simulators/taxable-income'],
    ['/knowledge', 'https://okinawamoneyguide.jp/knowledge'],
    ['/about', 'https://okinawamoneyguide.jp/about'],
    ['/trust', 'https://okinawamoneyguide.jp/trust'],
  ])('applies complete runtime metadata on %s', (path, canonical) => {
    renderAt(path)

    const title = document.title
    const description = document.querySelector('meta[name="description"]')
      ?.getAttribute('content')
    expect(title).not.toBe('')
    expect(description).toBeTruthy()
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content'))
      .toBe('index, follow')
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href'))
      .toBe(canonical)
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content'))
      .toBe(title)
    expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content'))
      .toBe(description)
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content'))
      .toBe(canonical)
    expect(document.querySelector('meta[name="twitter:title"]')?.getAttribute('content'))
      .toBe(title)
  })

  it('renders the approved NISA hero content without the retired motion layer', () => {
    const { container } = renderAt('/simulators/nisa')

    expect(container.querySelector('.nisa-hero-motion')).toBeNull()
    expect(screen.getByText('毎月の積立を試算')).toBeTruthy()
    expect(screen.getByText('将来資産を可視化')).toBeTruthy()
    expect(screen.getByText('NISA枠も確認')).toBeTruthy()
  })

  it('provides an accessible overlay simulator menu and closes it predictably', async () => {
    const user = userEvent.setup()
    renderAt('/simulators/mortgage')

    const trigger = screen.getByRole('button', { name: 'シミュレーター' })
    const panelId = trigger.getAttribute('aria-controls')
    const panel = document.getElementById(panelId!)!

    expect(trigger.getAttribute('aria-haspopup')).toBe('true')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    await user.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(within(panel).getAllByRole('link')).toHaveLength(5)
    expect(within(panel).getByText('SIMULATORS')).toBeTruthy()
    expect(within(panel).getByText('目的に合わせてシミュレーターを選択'))
      .toBeTruthy()

    const currentLink = within(panel).getByRole('link', {
      name: /住宅ローン.*表示中/,
    })
    expect(currentLink.getAttribute('aria-current')).toBe('page')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)

    await user.click(trigger)
    fireEvent.pointerDown(screen.getByRole('heading', {
      level: 1,
      name: '住宅ローンシミュレーター',
    }))
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    await user.click(trigger)
    await user.click(within(panel).getByRole('link', { name: /^NISA/ }))
    expect(window.location.pathname).toBe('/simulators/nisa')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('keeps the existing mobile navigation trigger and nested simulator links', async () => {
    const user = userEvent.setup()
    renderAt('/simulators/nisa')

    const navigationTrigger = screen.getByRole('button', {
      name: 'メニューを開閉する',
    })
    expect(navigationTrigger.getAttribute('aria-expanded')).toBe('false')
    await user.click(navigationTrigger)
    expect(navigationTrigger.getAttribute('aria-expanded')).toBe('true')
    expect(document.body.classList.contains('top-option02-navigation-open'))
      .toBe(true)
    const backdrop = document.querySelector(
      '.top-option02__navigation-backdrop',
    ) as HTMLButtonElement
    expect(backdrop).toBeTruthy()
    expect(backdrop.closest('header')).toBeNull()

    await user.click(backdrop)
    expect(navigationTrigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.body.classList.contains('top-option02-navigation-open'))
      .toBe(false)

    await user.click(navigationTrigger)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(navigationTrigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(navigationTrigger)

    await user.click(navigationTrigger)

    const simulatorTrigger = screen.getByRole('button', {
      name: 'シミュレーター',
    })
    await user.click(simulatorTrigger)
    expect(simulatorTrigger.getAttribute('aria-expanded')).toBe('true')
    expect(document.querySelectorAll(
      '#top-option02-simulator-menu .top-option02__simulator-menu-card',
    )).toHaveLength(5)

    await user.click(screen.getByRole('link', { name: '記事・コラム' }))
    expect(window.location.pathname).toBe('/knowledge')
    expect(navigationTrigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.body.classList.contains('top-option02-navigation-open'))
      .toBe(false)
  })

  it.each([
    '/simulators/military-land',
    '/simulators/mortgage',
    '/simulators/nisa',
    '/simulators/ideco',
    '/simulators/taxable-income',
  ])('renders the shared hero wave on %s', (path) => {
    const { container } = renderAt(path)

    expect(container.querySelectorAll('.simulator-page__hero-wave'))
      .toHaveLength(1)
  })

  it.each([
    '/simulators/military-land',
    '/simulators/mortgage',
    '/simulators/nisa',
    '/simulators/ideco',
    '/simulators/taxable-income',
  ])('uses the shared manual simulation CTA on %s', (path) => {
    renderAt(path)

    expect(screen.getByRole('button', {
      name: 'シミュレートする',
    })).toBeTruthy()
    expect(screen.queryByRole('button', {
      name: '計算する',
    })).toBeNull()
  })

  it('links the taxable income page to its verified primary sources', () => {
    renderAt('/simulators/taxable-income')

    const links = screen.getAllByRole('link', {
      name: /令和8年度税制改正|令和8年4月 源泉所得税|所得税の税率/,
    })
    expect(links).toHaveLength(3)

    for (const link of links) {
      expect(link.getAttribute('href')).toMatch(/^https:\/\/www\.nta\.go\.jp\//)
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noreferrer')
      expect(link.lastElementChild?.textContent).toBe('↗')
      expect(link.lastElementChild?.getAttribute('aria-hidden')).toBe('true')
    }
  })

  it.each([
    '/simulators/military-land',
    '/simulators/mortgage',
    '/simulators/nisa',
    '/simulators/ideco',
    '/simulators/taxable-income',
  ])('does not expose AI-related wording on %s', (path) => {
    renderAt(path)

    expect(document.body.textContent ?? '').not.toMatch(
      /生成AI|人工知能|ChatGPT|OpenAI|\bGPT\b|\bLLM\b|機械学習|\bAI\b/i,
    )
  })

  it.each([
    '/simulators/military-land',
    '/simulators/mortgage',
    '/simulators/nisa',
    '/simulators/ideco',
    '/simulators/taxable-income',
  ])('keeps developer metadata out of the visible UI on %s', (path) => {
    renderAt(path)

    const visibleText = document.body.textContent ?? ''
    for (const internalLabel of [
      '計算モデル',
      'モデル版',
      '仕様版',
      '計算日時',
      '入力スナップショット',
      'OMG-DS-',
      'fixed-monthly-v1',
    ]) {
      expect(visibleText).not.toContain(internalLabel)
    }
  })

  it.each([
    '/simulators/military-land',
    '/simulators/mortgage',
    '/simulators/nisa',
    '/simulators/ideco',
    '/simulators/taxable-income',
  ])('uses the shared reset label on %s', (path) => {
    renderAt(path)

    expect(screen.getByRole('button', { name: '入力内容をリセット' }))
      .toBeTruthy()
  })

  it('keeps the NISA caution messages concise and role-specific', () => {
    renderAt('/simulators/nisa')

    expect(screen.getByText(
      '一定の利回りで毎月末に積み立てる想定の概算であり、将来の運用成果を保証するものではありません。',
    )).toBeTruthy()
    expect(screen.getByText(
      '手数料、価格変動、商品ごとの条件を完全に反映した試算ではありません。',
    )).toBeTruthy()
    expect(screen.getByText(
      '制度変更などにより、実際の結果や利用可能なNISA枠と異なる場合があります。',
    )).toBeTruthy()
  })

  it('connects top simulator cards to their dedicated pages and keeps insurance disabled', async () => {
    const user = userEvent.setup()
    renderAt('/')

    await user.click(screen.getAllByRole('link', { name: /シミュレーションする/ })[0])
    expect(window.location.pathname).toBe('/simulators/military-land')

    window.history.replaceState({}, '', '/')
    cleanup()
    render(<App />)
    expect((screen.getByRole('button', { name: '保険見直しは準備中' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it.each([
    ['#tool-panel-military', '/simulators/military-land'],
    ['#tool-panel-mortgage', '/simulators/mortgage'],
    ['#tool-panel-nisa', '/simulators/nisa'],
    ['#tool-panel-ideco', '/simulators/ideco'],
  ])('replaces old hash %s with %s', (hash, destination) => {
    renderAt(`/${hash}`)
    expect(window.location.pathname).toBe(destination)
  })

  it('connects purpose links to knowledge anchors', () => {
    renderAt('/')
    expect(screen.getByRole('link', { name: /借りる/ }).getAttribute('href')).toBe('/knowledge#borrow')
    expect(screen.getByRole('link', { name: /貯める/ }).getAttribute('href')).toBe('/knowledge#save')
    expect(screen.getByRole('link', { name: /増やす/ }).getAttribute('href')).toBe('/knowledge#grow')
    expect(document.querySelector('a[href="/knowledge#protect"]')).toBeTruthy()
  })

  it('adds meaningful homepage guidance using only existing destinations', () => {
    renderAt('/')

    const useCases = screen.getByRole('heading', {
      level: 2,
      name: 'こんなときに使えます',
    }).closest('section')!
    expect(within(useCases).getByRole('link', { name: /住宅を買う前に/ }).getAttribute('href'))
      .toBe('/simulators/mortgage')
    expect(within(useCases).getByRole('link', { name: /将来のお金を準備したい/ }).getAttribute('href'))
      .toBe('/simulators/nisa')
    expect(within(useCases).getByRole('link', { name: /節税額を確認したい/ }).getAttribute('href'))
      .toBe('/simulators/ideco')
    expect(within(useCases).getByRole('link', { name: /沖縄ならではの資産を検討したい/ }).getAttribute('href'))
      .toBe('/simulators/military-land')

    expect(screen.getByRole('heading', {
      level: 2,
      name: '数字を入れるだけで、判断材料が見えてきます',
    })).toBeTruthy()
    expect(screen.getByRole('link', { name: /お金の知識を見る/ }).getAttribute('href'))
      .toBe('/knowledge')
    expect(screen.getByRole('link', { name: /情報と運営の方針を見る/ }).getAttribute('href'))
      .toBe('/trust')
    expect(screen.getByRole('link', { name: /シミュレーターを選ぶ/ }).getAttribute('href'))
      .toBe('#popular-simulators')
  })

  it('keeps the floating simulator CTA reusable by pointer and keyboard', async () => {
    const user = userEvent.setup()
    renderAt('/')

    const simulatorList = document.getElementById('popular-simulators')!
    const scrollIntoView = vi.mocked(simulatorList.scrollIntoView)
    scrollIntoView.mockClear()

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const callCountBefore = scrollIntoView.mock.calls.length
      const cta = screen.getByRole('link', {
        name: '人気のシミュレーターへ移動する',
      })
      await user.click(cta)
      expect(cta.hasAttribute('disabled')).toBe(false)
      expect(scrollIntoView.mock.calls.length).toBeGreaterThan(callCountBefore)
    }

    expect(scrollIntoView).toHaveBeenLastCalledWith({
      behavior: 'smooth',
      block: 'start',
    })

    const cta = screen.getByRole('link', {
      name: '人気のシミュレーターへ移動する',
    })
    cta.focus()
    const callCountBeforeKeyboard = scrollIntoView.mock.calls.length
    await user.keyboard('{Enter}')
    await user.keyboard(' ')

    expect(scrollIntoView.mock.calls.length).toBe(callCountBeforeKeyboard + 2)
    expect(document.activeElement).toBe(cta)
  })

  it('uses immediate scrolling for the floating CTA when reduced motion is preferred', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    const user = userEvent.setup()
    renderAt('/')

    const simulatorList = document.getElementById('popular-simulators')!
    const scrollIntoView = vi.mocked(simulatorList.scrollIntoView)

    await user.click(screen.getByRole('link', {
      name: '人気のシミュレーターへ移動する',
    }))

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'start',
    })
  })

  it('moves from iDeCo to taxable income and returns only the calculated rate', async () => {
    const user = userEvent.setup()
    renderAt('/simulators/ideco')
    await user.click(screen.getByRole('button', { name: '自分の所得税率を調べる' }))
    expect(`${window.location.pathname}${window.location.search}`).toBe('/simulators/taxable-income?return=ideco')

    await user.type(screen.getByPlaceholderText('例：5,000,000'), '5000000')
    await user.click(screen.getByRole('button', { name: 'シミュレートする' }))
    await user.click(screen.getByRole('button', { name: /をiDeCoに反映する/ }))

    expect(window.location.pathname).toBe('/simulators/ideco')
    expect(window.location.search).toMatch(/^\?incomeTaxRate=(0|5|10|20|23|33|40|45)$/)
    expect(window.location.search).not.toContain('5000000')
  })

  it('returns to detailed iDeCo without applying the lookup rate to its calculation', async () => {
    const user = userEvent.setup()
    renderAt('/simulators/ideco')

    await user.click(screen.getByRole('button', {
      name: /課税所得から詳しく計算/,
    }))
    await user.type(
      screen.getByLabelText('掛金控除前の課税所得'),
      '3500000',
    )

    const lookup = screen.getByRole('button', {
      name: '自分の所得税率を調べる',
    })
    lookup.focus()
    await user.keyboard('{Enter}')
    expect(`${window.location.pathname}${window.location.search}`)
      .toBe('/simulators/taxable-income?return=ideco')

    await user.type(screen.getByPlaceholderText('例：5,000,000'), '5000000')
    await user.click(screen.getByRole('button', { name: 'シミュレートする' }))
    await user.click(screen.getByRole('button', { name: /をiDeCoに反映する/ }))

    expect(window.location.pathname).toBe('/simulators/ideco')
    expect(screen.getByRole('button', {
      name: /課税所得から詳しく計算/,
    }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.queryByLabelText('所得税率')).toBeNull()
    expect((screen.getByLabelText(
      '掛金控除前の課税所得',
    ) as HTMLInputElement).value).toBe('3,500,000')

    fireEvent.change(screen.getByLabelText('計算基準日'), {
      target: { value: '2026-11-30' },
    })
    fireEvent.change(screen.getByLabelText('現在の年齢'), {
      target: { value: '40' },
    })
    fireEvent.change(screen.getByLabelText('加入区分'), {
      target: { value: 'category2-no-pension' },
    })
    fireEvent.change(screen.getByLabelText('毎月の掛金'), {
      target: { value: '23000' },
    })
    fireEvent.change(screen.getByLabelText('今年の掛金拠出月数'), {
      target: { value: '12' },
    })
    fireEvent.change(screen.getByLabelText('住民税所得割率'), {
      target: { value: '10' },
    })
    fireEvent.change(screen.getByLabelText('長期試算期間'), {
      target: { value: '20' },
    })
    await user.click(screen.getByRole('button', { name: 'シミュレートする' }))

    expect(screen.getAllByText('￥76,200').length).toBeGreaterThanOrEqual(1)
  })

  it('starts iDeCo with a blank rate, accepts allowed rates, and ignores invalid query values', () => {
    renderAt('/simulators/ideco')
    expect((screen.getByLabelText('所得税率') as HTMLSelectElement).value).toBe('')

    cleanup()
    renderAt('/simulators/ideco?incomeTaxRate=23')
    expect((screen.getByLabelText('所得税率') as HTMLSelectElement).value).toBe('23')

    cleanup()
    renderAt('/simulators/ideco?incomeTaxRate=17')
    expect((screen.getByLabelText('所得税率') as HTMLSelectElement).value).toBe('')
  })

  it('offers basic and detailed taxable-income input modes', async () => {
    const user = userEvent.setup()
    renderAt('/simulators/taxable-income')
    expect(screen.queryByText('社会保険料控除')).toBeNull()
    await user.click(screen.getByRole('button', { name: '詳細' }))
    expect(screen.getByText('社会保険料控除')).toBeTruthy()
  })

  it('supports browser back navigation between dedicated pages', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await user.click(screen.getByRole('link', { name: /住宅ローンや教育ローン/ }))
    expect(window.location.pathname).toBe('/knowledge')

    window.history.back()
    await waitFor(() => expect(window.location.pathname).toBe('/'))
  })
})
