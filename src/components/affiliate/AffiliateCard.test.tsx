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
  creativeType: 'text',
  url: 'https://example.com/application',
  title: 'テスト用サービス',
  description: '表示条件を確認するためのテストデータです。',
  ctaLabel: 'サービスを確認する',
  disclosureLabel: 'PR',
  riskDisclosure: '投資には価格変動リスクがあります。',
  riskUrl: 'https://example.com/risk',
  trackingPixelUrl: 'https://example.com/pixel.gif',
}

const bannerProgram: AffiliateProgramConfig = {
  ...enabledProgram,
  id: 'test-banner',
  creativeType: 'banner',
  title: 'バナー広告',
  description: '',
  ctaLabel: '',
  bannerImageUrl: 'https://example.com/banner.png',
  bannerAlt: 'テストバナー',
  bannerWidth: 468,
  bannerHeight: 60,
}

describe('AffiliateCard', () => {
  afterEach(() => {
    cleanup()
    Reflect.deleteProperty(window, 'gtag')
    window.history.pushState({}, '', '/')
  })

  it('enables the approved NISA program while keeping unapproved programs disabled', () => {
    expect(affiliatePrograms.nisa.enabled).toBe(true)
    expect(affiliatePrograms.ideco.enabled).toBe(false)
    expect(affiliatePrograms.mortgage.enabled).toBe(false)
    expect(affiliatePrograms.nisa.provider).toBe('DMM 株')
    expect(affiliatePrograms.nisa.creativeType).toBe('banner')
    expect(affiliatePrograms.nisa.placement)
      .toBe('nisa-before-consultation-summary')
    expect(affiliatePrograms.nisa.url).toContain('px.a8.net')
    expect(affiliatePrograms.nisa.bannerImageUrl).toContain('a8.net')
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

  it('shows PR, disclosure details, and safe external-link attributes for text creatives', () => {
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

  it('renders a banner creative as the clickable ad surface', () => {
    const { container } = render(<AffiliateCard program={bannerProgram} />)

    expect(screen.getByText('PR')).toBeTruthy()
    const banner = screen.getByRole('img', { name: 'テストバナー' })
    expect(banner.getAttribute('src')).toBe(bannerProgram.bannerImageUrl)
    expect(banner.getAttribute('width')).toBe('468')
    expect(banner.getAttribute('height')).toBe('60')

    const link = screen.getByRole('link', { name: 'テスト提供者の詳細を見る' })
    expect(link.getAttribute('href')).toBe(bannerProgram.url)
    expect(link.getAttribute('rel')).toBe('sponsored noopener noreferrer')
    expect(container.querySelector('.affiliate-card__tracking-pixel')).toBeTruthy()
    expect(screen.queryByText('RELATED SERVICE')).toBeNull()
  })

  it('does not render a banner with a missing or insecure creative URL', () => {
    const { container, rerender } = render(
      <AffiliateCard program={{ ...bannerProgram, bannerImageUrl: '' }} />,
    )
    expect(container.innerHTML).toBe('')

    rerender(
      <AffiliateCard
        program={{
          ...bannerProgram,
          bannerImageUrl: 'http://example.com/banner.png',
        }}
      />,
    )
    expect(container.innerHTML).toBe('')
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
    render(<AffiliateCard program={bannerProgram} />)

    fireEvent.click(screen.getByRole('link', { name: 'テスト提供者の詳細を見る' }))

    expect(gtag).toHaveBeenCalledWith('event', 'affiliate_click', {
      provider: 'テスト提供者',
      category: 'nisa',
      placement: 'nisa-after-consultation-summary',
    })
  })

  it('does not throw when GA4 has not loaded', () => {
    render(<AffiliateCard program={bannerProgram} />)
    const link = screen.getByRole('link', { name: 'テスト提供者の詳細を見る' })

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

  it('suppresses the legacy NISA slot reserved for dynamic placement', () => {
    const { container, rerender } = render(
      <AffiliatePreviewCard category="nisa" />,
    )
    expect(container.innerHTML).toBe('')

    rerender(
      <AffiliateCard
        program={{ ...affiliatePrograms.nisa, enabled: true }}
      />,
    )
    expect(container.innerHTML).toBe('')
  })
})
