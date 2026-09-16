// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  affiliatePrograms,
  type AffiliateProgramConfig,
} from '../../affiliate/affiliateConfig'
import AffiliateCard from './AffiliateCard'
import AffiliatePreviewCard from './AffiliatePreviewCard'

const enabledProgram: AffiliateProgramConfig = {
  id: 'test-program',
  enabled: true,
  provider: 'テスト提供者',
  category: 'nisa',
  placement: 'nisa-after-consultation-summary',
  url: 'https://example.com/application',
  title: 'テスト用サービス',
  description: '表示条件を確認するためのテストデータです。',
  ctaLabel: 'サービスを確認する',
}

describe('AffiliateCard', () => {
  afterEach(() => {
    cleanup()
    Reflect.deleteProperty(window, 'gtag')
  })

  it('keeps every production program disabled by default', () => {
    expect(Object.values(affiliatePrograms).every((program) => (
      !program.enabled && program.url === ''
    ))).toBe(true)
  })

  it('does not render when the program is disabled', () => {
    const { container } = render(
      <AffiliateCard program={{ ...enabledProgram, enabled: false }} />,
    )

    expect(container.innerHTML).toBe('')
  })

  it('does not render when the URL is missing', () => {
    const { container } = render(
      <AffiliateCard program={{ ...enabledProgram, url: '' }} />,
    )

    expect(container.innerHTML).toBe('')
  })

  it('does not render an insecure or malformed URL', () => {
    const { container, rerender } = render(
      <AffiliateCard program={{ ...enabledProgram, url: 'http://example.com' }} />,
    )

    expect(container.innerHTML).toBe('')

    rerender(
      <AffiliateCard program={{ ...enabledProgram, url: 'not-a-url' }} />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('starts with RELATED SERVICE and uses safe external-link attributes', () => {
    render(<AffiliateCard program={enabledProgram} />)

    expect(screen.getByText('RELATED SERVICE')).toBeTruthy()
    expect(screen.getByText(/テスト提供者/)).toBeTruthy()
    expect(screen.queryByText('広告・PR')).toBeNull()
    const link = screen.getByRole('link', { name: /サービスを確認する/ })
    expect(link.getAttribute('href')).toBe(enabledProgram.url)
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('sponsored noopener noreferrer')
  })

  it('tracks affiliate_click with provider, category, and placement only', () => {
    const gtag = vi.fn()
    Object.defineProperty(window, 'gtag', {
      configurable: true,
      value: gtag,
    })
    render(<AffiliateCard program={enabledProgram} />)

    fireEvent.click(screen.getByRole('link', { name: /サービスを確認する/ }))

    expect(gtag).toHaveBeenCalledWith('event', 'affiliate_click', {
      provider: 'テスト提供者',
      category: 'nisa',
      placement: 'nisa-after-consultation-summary',
    })
  })

  it('does not throw when GA4 has not loaded', () => {
    render(<AffiliateCard program={enabledProgram} />)
    const link = screen.getByRole('link', { name: /サービスを確認する/ })

    expect(() => fireEvent.click(link)).not.toThrow()
  })

  it('supports a development-only visual preview without an active link', () => {
    render(<AffiliatePreviewCard category="ideco" />)

    expect(screen.getByText('RELATED SERVICE')).toBeTruthy()
    expect(screen.queryByText('広告・PR')).toBeNull()
    expect(screen.queryByText('表示確認用・申込不可')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('リンク準備中').getAttribute('aria-disabled'))
      .toBe('true')
  })
})
