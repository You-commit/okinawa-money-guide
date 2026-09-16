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
  disclosureLabel: 'PR',
  riskDisclosure: '投資には価格変動リスクがあります。',
  riskUrl: 'https://example.com/risk',
  trackingPixelUrl: 'https://example.com/pixel.gif',
}

describe('AffiliateCard', () => {
  afterEach(() => {
    cleanup()
    Reflect.deleteProperty(window, 'gtag')
  })

  it('keeps every production program disabled by default', () => {
    expect(Object.values(affiliatePrograms).every((program) => (
      !program.enabled
    ))).toBe(true)
    expect(affiliatePrograms.nisa.provider).toBe('DMM 株')
    expect(affiliatePrograms.nisa.url).toContain('px.a8.net')
    expect(affiliatePrograms.nisa.disclosureLabel).toBe('PR')
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

  it('shows PR, disclosure details, and safe external-link attributes', () => {
    const { container } = render(<AffiliateCard program={enabledProgram} />)

    expect(screen.getByText('RELATED SERVICE')).toBeTruthy()
    expect(screen.getByText('PR')).toBeTruthy()
    expect(screen.getByText(/テスト提供者/)).toBeTruthy()
    expect(screen.getByText(/価格変動リスク/)).toBeTruthy()

    const riskLink = screen.getByRole('link', { name: '公式情報' })
    expect(riskLink.getAttribute('href')).toBe(enabledProgram.riskUrl)
    expect(riskLink.getAttribute('rel')).toBe('noopener noreferrer')

    const link = screen.getByRole('link', { name: /サービスを確認する/ })
    expect(link.getAttribute('href')).toBe(enabledProgram.url)
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('sponsored noopener noreferrer')

    const pixel = container.querySelector('.affiliate-card__tracking-pixel')
    expect(pixel?.getAttribute('src')).toBe(enabledProgram.trackingPixelUrl)
  })

  it('does not render an insecure tracking pixel or risk link', () => {
    const { container } = render(
      <AffiliateCard
        program={{
          ...enabledProgram,
          riskUrl: 'http://example.com/risk',
          trackingPixelUrl: 'http://example.com/pixel.gif',
        }}
      />,
    )

    expect(screen.queryByRole('link', { name: '公式情報' })).toBeNull()
    expect(container.querySelector('.affiliate-card__tracking-pixel')).toBeNull()
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

  it('supports a development-only generic preview without an active link', () => {
    render(<AffiliatePreviewCard category="ideco" />)

    expect(screen.getByText('RELATED SERVICE')).toBeTruthy()
    expect(screen.queryByText('PR')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('リンク準備中').getAttribute('aria-disabled'))
      .toBe('true')
  })

  it('shows the configured DMM NISA card in preview without firing live tracking', () => {
    const { container } = render(<AffiliatePreviewCard category="nisa" />)

    expect(screen.getByText('NISA口座を検討している方へ')).toBeTruthy()
    expect(screen.getByText('PR')).toBeTruthy()
    expect(screen.getByText(/DMM 株/)).toBeTruthy()
    expect(screen.queryByRole('link', { name: /DMM 株の詳細を見る/ }))
      .toBeNull()
    expect(screen.getByText('DMM 株の詳細を見る').getAttribute('aria-disabled'))
      .toBe('true')
    expect(container.querySelector('.affiliate-card__tracking-pixel')).toBeNull()
  })
})
