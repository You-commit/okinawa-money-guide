// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
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
  })

  it('renders a 404 page for an unknown URL', () => {
    renderAt('/missing-page')
    expect(screen.getByRole('heading', { level: 1, name: 'ページが見つかりません' })).toBeTruthy()
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, follow')
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

  it('accepts allowed income tax rates and ignores invalid query values', () => {
    renderAt('/simulators/ideco?incomeTaxRate=23')
    expect((screen.getByLabelText('所得税率') as HTMLSelectElement).value).toBe('23')

    cleanup()
    renderAt('/simulators/ideco?incomeTaxRate=17')
    expect((screen.getByLabelText('所得税率') as HTMLSelectElement).value).toBe('10')
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
