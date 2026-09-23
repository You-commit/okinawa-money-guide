// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { affiliatePrograms } from '../../affiliate/affiliateConfig'
import TaxableAffiliatePlacementController from './TaxableAffiliatePlacementController'

function TestLayout({ hasResult }: { hasResult: boolean }) {
  return (
    <>
      <div className="simulator-page__calculator">
        <section className="calculator">
          <div className="calculator-layout">calculator</div>
          {hasResult && (
            <div
              id="taxable-affiliate-after-results"
              className="taxable-affiliate-placement taxable-affiliate-placement--post-simulation"
            />
          )}
        </section>
      </div>
      <div className="simulator-page__notes">
        <TaxableAffiliatePlacementController />
        <div>ご注意</div>
      </div>
    </>
  )
}

describe('TaxableAffiliatePlacementController', () => {
  const originalEnabled = affiliatePrograms.taxable.enabled

  beforeEach(() => {
    affiliatePrograms.taxable.enabled = true
  })

  afterEach(() => {
    affiliatePrograms.taxable.enabled = originalEnabled
    cleanup()
  })

  it('shows the banner below the simulator and above notes before simulation', () => {
    render(<TestLayout hasResult={false} />)

    expect(document.querySelector(
      '.taxable-affiliate-placement--pre-simulation',
    )).toBeTruthy()
    expect(screen.getByRole('img', { name: '松井証券 iDeCo' })).toBeTruthy()
    expect(document.querySelector(
      '.taxable-affiliate-placement--post-simulation .affiliate-banner',
    )).toBeNull()
  })

  it('moves the same banner to the post-result anchor after simulation', async () => {
    const { rerender } = render(<TestLayout hasResult={false} />)

    rerender(<TestLayout hasResult />)

    await waitFor(() => {
      expect(document.querySelector(
        '.taxable-affiliate-placement--post-simulation .affiliate-banner',
      )).toBeTruthy()
      expect(document.querySelector(
        '.taxable-affiliate-placement--pre-simulation',
      )).toBeNull()
    })

    expect(screen.getAllByRole('img', { name: '松井証券 iDeCo' })).toHaveLength(1)
  })
})
