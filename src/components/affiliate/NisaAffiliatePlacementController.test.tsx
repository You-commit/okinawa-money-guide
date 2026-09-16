// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { affiliatePrograms } from '../../affiliate/affiliateConfig'
import NisaAffiliatePlacementController from './NisaAffiliatePlacementController'

function TestLayout({ hasSummary }: { hasSummary: boolean }) {
  return (
    <>
      <div className="simulator-page__calculator">
        <section className="nisa-calculator">
          <div className="calculator-layout">calculator</div>
          {hasSummary && (
            <section className="nisa-consultation-summary">
              consultation summary
            </section>
          )}
        </section>
      </div>
      <div className="simulator-page__notes">
        <NisaAffiliatePlacementController />
        <div>ご注意</div>
      </div>
    </>
  )
}

describe('NisaAffiliatePlacementController', () => {
  const originalEnabled = affiliatePrograms.nisa.enabled

  beforeEach(() => {
    affiliatePrograms.nisa.enabled = true
  })

  afterEach(() => {
    affiliatePrograms.nisa.enabled = originalEnabled
    cleanup()
    document.getElementById('nisa-affiliate-before-consultation-summary')?.remove()
  })

  it('shows the banner below the simulator and above notes before simulation', () => {
    render(<TestLayout hasSummary={false} />)

    const placement = document.querySelector(
      '.nisa-affiliate-placement--pre-simulation',
    )
    expect(placement).toBeTruthy()
    expect(screen.getByRole('img', { name: 'DMM 株' })).toBeTruthy()
    expect(document.querySelector(
      '.nisa-affiliate-placement--post-simulation',
    )).toBeNull()
  })

  it('moves the same banner immediately before the consultation summary after simulation', async () => {
    const { rerender } = render(<TestLayout hasSummary={false} />)

    rerender(<TestLayout hasSummary />)

    await waitFor(() => {
      const postPlacement = document.querySelector(
        '.nisa-affiliate-placement--post-simulation',
      )
      const summary = document.querySelector('.nisa-consultation-summary')

      expect(postPlacement).toBeTruthy()
      expect(postPlacement?.nextElementSibling).toBe(summary)
      expect(document.querySelector(
        '.nisa-affiliate-placement--pre-simulation',
      )).toBeNull()
    })

    expect(screen.getAllByRole('img', { name: 'DMM 株' })).toHaveLength(1)
  })
})
