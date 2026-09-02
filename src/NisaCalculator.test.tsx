// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import NisaCalculator from './NisaCalculator'

const change = (label: string, value: string) => {
  fireEvent.change(screen.getByLabelText(label), {
    target: { value },
  })
}

const calculate = () => {
  fireEvent.click(screen.getByRole('button', { name: '計算する' }))
}

const selectMode = (name: string) => {
  fireEvent.click(screen.getByRole('tab', { name: new RegExp(name) }))
}

const fillFuture = ({
  monthly = '10000',
  rate = '5',
  years = '20',
  months = '',
  inflation = '',
}: {
  monthly?: string
  rate?: string
  years?: string
  months?: string
  inflation?: string
} = {}) => {
  change('毎月積立額', monthly)
  change('想定利回り', rate)
  change('積立期間（年）', years)
  if (months !== '') change('積立期間（か月）', months)
  if (inflation !== '') change('想定インフレ率（任意）', inflation)
}

describe('NISA planning modes', () => {
  afterEach(cleanup)

  it('starts in future-value mode and exposes all three modes', () => {
    render(<NisaCalculator />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
    expect(screen.getByRole('tab', { name: /将来額を調べる/ })
      .getAttribute('aria-selected')).toBe('true')
    expect(screen.getByLabelText(/初期投資額/)).toBeTruthy()
  })

  it('changes modes, preserves shared values, and clears the old result', () => {
    render(<NisaCalculator />)
    fillFuture()
    calculate()
    expect(screen.getAllByText('￥4,058,045')).toHaveLength(2)

    selectMode('必要な毎月積立額を調べる')
    expect(screen.queryByText('￥4,058,045')).toBeNull()
    change('目標額', '10000000')
    selectMode('必要な積立期間を調べる')

    expect((screen.getByLabelText('毎月積立額') as HTMLInputElement).value)
      .toBe('10,000')
    expect((screen.getByLabelText('目標額') as HTMLInputElement).value)
      .toBe('10,000,000')
    expect((screen.getByLabelText('想定利回り') as HTMLInputElement).value)
      .toBe('5')
    expect(screen.queryByText('￥4,058,045')).toBeNull()
    expect(screen.queryByLabelText(/初期投資額/)).toBeNull()
  })

  it('formats the reverse-mode target with the shared MoneyInput', () => {
    render(<NisaCalculator />)
    selectMode('必要な毎月積立額を調べる')
    change('目標額', '10000000')

    expect((screen.getByLabelText('目標額') as HTMLInputElement).value)
      .toBe('10,000,000')
  })

  it('converts a one-month period without rounding it to years', () => {
    render(<NisaCalculator />)
    fillFuture({ monthly: '1000', rate: '0', years: '0', months: '1' })
    calculate()

    expect(screen.getAllByText('￥1,000').length).toBeGreaterThan(0)
    expect(screen.getByText('運用期間 1か月')).toBeTruthy()
  })

  it('accepts the 960-month boundary', () => {
    render(<NisaCalculator />)
    fillFuture({ monthly: '1000', rate: '0', years: '80', months: '0' })
    calculate()

    expect(screen.getAllByText('￥960,000').length).toBeGreaterThan(0)
    expect(screen.getByText('運用期間 80年')).toBeTruthy()
  })

  it('rejects zero months and 961 months only on explicit calculation', () => {
    render(<NisaCalculator />)
    fillFuture({ years: '0', months: '0' })
    expect(screen.queryByText(/積立期間は1～960か月/)).toBeNull()
    calculate()
    expect(screen.getAllByText(/積立期間は1～960か月/).length)
      .toBeGreaterThan(0)

    cleanup()
    render(<NisaCalculator />)
    fillFuture({ years: '80', months: '1' })
    calculate()
    expect(screen.getAllByText(/積立期間は1～960か月/).length)
      .toBeGreaterThan(0)
  })

  it('accepts -20% and 20% without removing the minus sign', () => {
    render(<NisaCalculator />)
    fillFuture({ rate: '-20', years: '1' })
    expect((screen.getByLabelText('想定利回り') as HTMLInputElement).value)
      .toBe('-20')
    calculate()
    expect(screen.queryByText(/想定利回りは-20.00%/)).toBeNull()

    change('想定利回り', '20')
    calculate()
    expect(screen.queryByText(/想定利回りは-20.00%/)).toBeNull()
  })

  it('shows inflation-adjusted value only when inflation is entered', () => {
    render(<NisaCalculator />)
    fillFuture({ inflation: '0' })
    calculate()
    expect(screen.getByText('インフレ調整後価値')).toBeTruthy()

    change('想定インフレ率（任意）', '')
    calculate()
    expect(screen.queryByText('インフレ調整後価値')).toBeNull()

    change('想定インフレ率（任意）', '10')
    calculate()
    expect(screen.getByText('インフレ調整後価値')).toBeTruthy()
  })

  it('calculates the formal required monthly contribution of 24,643 yen', () => {
    render(<NisaCalculator />)
    selectMode('必要な毎月積立額を調べる')
    change('目標額', '10000000')
    change('想定利回り', '5')
    change('積立期間（年）', '20')
    calculate()

    expect(screen.getByText('必要な毎月積立額')).toBeTruthy()
    expect(screen.getByText('￥24,643')).toBeTruthy()
  })

  it('calculates 211 months as 17 years 7 months', () => {
    render(<NisaCalculator />)
    selectMode('必要な積立期間を調べる')
    change('目標額', '10000000')
    change('毎月積立額', '30000')
    change('想定利回り', '5')
    calculate()

    expect(screen.getByText('17年7か月')).toBeTruthy()
    expect(screen.getByText('211か月（1か月単位で切り上げ）')).toBeTruthy()
  })

  it('shows a clear unreachable result instead of NaN or Infinity', () => {
    render(<NisaCalculator />)
    selectMode('必要な積立期間を調べる')
    change('目標額', '2000000')
    change('毎月積立額', '30000')
    change('想定利回り', '-20')
    calculate()

    expect(screen.getByText('この条件では目標額に到達しません。'))
      .toBeTruthy()
    expect(screen.queryByText(/NaN|Infinity/)).toBeNull()
  })
})

describe('NISA 2026 allowance UI', () => {
  afterEach(cleanup)

  const calculateAnnual = (monthly: string, years = '1', months = '') => {
    fillFuture({ monthly, rate: '0', years, months })
    calculate()
  }

  it('shows the 1.2 million yen annual boundary as within tsumitate', () => {
    render(<NisaCalculator />)
    calculateAnnual('100000')

    expect(screen.getByText('つみたて投資枠の年間上限内')).toBeTruthy()
    expect(screen.getAllByText('￥1,200,000').length).toBeGreaterThan(0)
    expect(screen.getByText(/成長投資枠240万円／合計360万円/)).toBeTruthy()
  })

  it('does not auto-allocate an amount over 1.2 million yen to the growth allowance', () => {
    render(<NisaCalculator />)
    calculateAnnual('100001')

    expect(screen.getByText('つみたて投資枠だけには収まりません'))
      .toBeTruthy()
    expect(screen.getByText(/成長投資枠へ自動的に振り分けてはいません/))
      .toBeTruthy()
  })

  it('keeps 3.6 million yen at the combined boundary and flags values above it', () => {
    const { unmount } = render(<NisaCalculator />)
    calculateAnnual('300000')
    expect(screen.getByText('つみたて投資枠だけには収まりません'))
      .toBeTruthy()
    unmount()

    render(<NisaCalculator />)
    calculateAnnual('300001')
    expect(screen.getByText('現行NISAの年間投資枠合計を超えます'))
      .toBeTruthy()
  })

  it('shows a lifetime-limit review only above 18 million yen', () => {
    render(<NisaCalculator />)
    calculateAnnual('100000', '15', '1')

    expect(screen.getByText('非課税保有限度額について確認が必要です'))
      .toBeTruthy()
    expect(screen.getByText(/売却後の枠再利用等もあるため/)).toBeTruthy()
  })

  it('excludes the current initial-investment extension from allowance checks', () => {
    render(<NisaCalculator />)
    change('初期投資額（任意）', '100000000')
    calculateAnnual('100000')

    expect(screen.queryByText('非課税保有限度額について確認が必要です'))
      .toBeNull()
    expect(screen.getByText('枠判定対象の積立元本').parentElement
      ?.textContent).toContain('￥1,200,000')
  })

  it('does not expose initial investment in either reverse mode', () => {
    render(<NisaCalculator />)
    selectMode('必要な毎月積立額を調べる')
    expect(screen.queryByLabelText(/初期投資額/)).toBeNull()
    selectMode('必要な積立期間を調べる')
    expect(screen.queryByLabelText(/初期投資額/)).toBeNull()
  })
})

describe('NISA validation timing', () => {
  afterEach(cleanup)

  it('keeps manual input quiet until Calculate and clears errors on editing', () => {
    render(<NisaCalculator />)
    change('毎月積立額', '10000')
    change('想定利回り', '21')

    expect(screen.queryByText('入力内容を確認してください（2件）')).toBeNull()
    expect(screen.getByLabelText('想定利回り')
      .getAttribute('aria-invalid')).toBe('false')

    calculate()
    expect(screen.getByText(/入力内容を確認してください/)).toBeTruthy()
    expect(screen.getByLabelText('想定利回り')
      .getAttribute('aria-invalid')).toBe('true')

    change('想定利回り', '5')
    expect(screen.queryByText(/入力内容を確認してください/)).toBeNull()
    expect(screen.getByLabelText('想定利回り')
      .getAttribute('aria-invalid')).toBe('false')
  })

  it('validates non-empty invalid values and calculates complete valid values in auto mode', () => {
    render(<NisaCalculator />)
    fireEvent.click(screen.getByLabelText('入力と同時に計算結果を更新する'))
    change('想定利回り', '21')
    expect(screen.getByLabelText('想定利回り')
      .getAttribute('aria-invalid')).toBe('true')
    expect(screen.queryByText(/毎月積立額を入力してください/)).toBeNull()

    fillFuture()
    expect(screen.getAllByText('￥4,058,045')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: '計算する' })).toBeNull()
  })

  it('does not calculate when Enter is pressed in an input', async () => {
    const user = userEvent.setup()
    render(<NisaCalculator />)
    fillFuture()
    const monthly = screen.getByLabelText('毎月積立額')
    monthly.focus()
    await user.keyboard('{Enter}')

    expect(screen.queryByText('￥4,058,045')).toBeNull()
    calculate()
    expect(screen.getAllByText('￥4,058,045')).toHaveLength(2)
  })
})
