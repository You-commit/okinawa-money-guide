import { describe, expect, it } from 'vitest'
import {
  NISA_ALLOWANCE_LIMITS,
  assessNisaAllowance,
} from './nisaAllowance'

describe('2026 NISA allowance assessment', () => {
  it('treats 1.2 million yen as within the annual tsumitate limit', () => {
    const result = assessNisaAllowance({
      monthlyContribution: 100_000,
      months: 120,
    })

    expect(result.annualContribution).toBe(1_200_000)
    expect(result.annualStatus).toBe('within-tsumitate')
  })

  it('does not automatically allocate an amount over 1.2 million yen to the growth allowance', () => {
    const result = assessNisaAllowance({
      monthlyContribution: 100_001,
      months: 120,
    })

    expect(result.annualStatus).toBe(
      'outside-tsumitate-within-combined',
    )
    expect(result.annualDescription).toContain(
      '成長投資枠へ自動的に振り分けてはいません',
    )
  })

  it('treats 3.6 million yen as within the combined annual limit', () => {
    expect(assessNisaAllowance({
      monthlyContribution: 300_000,
      months: 120,
    }).annualStatus).toBe('outside-tsumitate-within-combined')
  })

  it('reports an annual contribution over 3.6 million yen', () => {
    const result = assessNisaAllowance({
      monthlyContribution: 300_001,
      months: 120,
    })

    expect(result.annualStatus).toBe('over-combined')
    expect(result.annualTitle).toContain('年間投資枠合計を超えます')
  })

  it('flags only formal principal above the 18 million yen lifetime amount', () => {
    const atLimit = assessNisaAllowance({
      monthlyContribution: 100_000,
      months: 180,
    })
    const overLimit = assessNisaAllowance({
      monthlyContribution: 100_000,
      months: 181,
    })

    expect(atLimit.formalPrincipal).toBe(
      NISA_ALLOWANCE_LIMITS.lifetimeAcquisition,
    )
    expect(atLimit.requiresLifetimeLimitReview).toBe(false)
    expect(overLimit.requiresLifetimeLimitReview).toBe(true)
  })

  it('rejects invalid assessment inputs instead of returning NaN', () => {
    expect(() => assessNisaAllowance({
      monthlyContribution: Number.NaN,
      months: 120,
    })).toThrow(RangeError)
    expect(() => assessNisaAllowance({
      monthlyContribution: 10_000,
      months: 0,
    })).toThrow(RangeError)
  })
})
