// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
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
    expect(screen.getByRole('tab', { name: /将来額を調べる/ }).textContent)
      .toContain('選択中')
    expect(screen.getByLabelText(/初期投資額/)).toBeTruthy()
  })

  it('supports roving focus and mode selection with arrow keys', () => {
    render(<NisaCalculator />)
    const futureTab = screen.getByRole('tab', { name: /将来額を調べる/ })
    const contributionTab = screen.getByRole('tab', {
      name: /必要な毎月積立額を調べる/,
    })

    futureTab.focus()
    fireEvent.keyDown(futureTab, { key: 'ArrowRight' })

    expect(contributionTab.getAttribute('aria-selected')).toBe('true')
    expect(contributionTab.getAttribute('tabindex')).toBe('0')
    expect(document.activeElement).toBe(contributionTab)
  })

  it('changes modes, preserves shared values, and clears the old result', () => {
    render(<NisaCalculator />)
    fillFuture()
    calculate()
    expect(screen.getAllByText('￥4,058,045').length).toBeGreaterThanOrEqual(2)

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
    expect(screen.getAllByText('インフレ調整後価値').length).toBeGreaterThan(0)

    change('想定インフレ率（任意）', '')
    calculate()
    expect(screen.queryByText('インフレ調整後価値')).toBeNull()

    change('想定インフレ率（任意）', '10')
    calculate()
    expect(screen.getAllByText('インフレ調整後価値').length).toBeGreaterThan(0)
  })

  it('calculates the formal required monthly contribution of 24,643 yen', () => {
    render(<NisaCalculator />)
    selectMode('必要な毎月積立額を調べる')
    change('目標額', '10000000')
    change('想定利回り', '5')
    change('積立期間（年）', '20')
    calculate()

    expect(screen.getAllByText('必要な毎月積立額').length).toBeGreaterThan(0)
    expect(screen.getAllByText('￥24,643').length).toBeGreaterThan(0)
  })

  it('calculates 211 months as 17 years 7 months', () => {
    render(<NisaCalculator />)
    selectMode('必要な積立期間を調べる')
    change('目標額', '10000000')
    change('毎月積立額', '30000')
    change('想定利回り', '5')
    calculate()

    expect(screen.getAllByText('17年7か月').length).toBeGreaterThan(0)
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
    expect(screen.getAllByText('NISA枠判定対象の積立元本')[0].parentElement
      ?.textContent).toContain('￥1,200,000')
    expect(screen.getAllByText('初期投資額はNISA枠判定に含めていません。').length)
      .toBeGreaterThan(0)
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
    expect(screen.getAllByText('￥4,058,045').length).toBeGreaterThanOrEqual(2)
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
    expect(screen.getAllByText('￥4,058,045').length).toBeGreaterThanOrEqual(2)
  })
})

describe('NISA recovery, accessible graph, and consultation tools', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('offers one undo generation without a time limit and does not restore stale results', () => {
    vi.useFakeTimers()
    render(<NisaCalculator />)
    fillFuture()
    calculate()
    expect(screen.getByRole('region', { name: '相談用サマリー' }))
      .toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '入力をリセット' }))
    expect(screen.getByText('入力内容をリセットしました。')).toBeTruthy()
    expect(screen.queryByRole('region', { name: '相談用サマリー' })).toBeNull()

    act(() => vi.advanceTimersByTime(10 * 60 * 1000))
    fireEvent.click(screen.getByRole('button', { name: '元に戻す' }))

    expect((screen.getByLabelText('毎月積立額') as HTMLInputElement).value)
      .toBe('10,000')
    expect((screen.getByLabelText('想定利回り') as HTMLInputElement).value)
      .toBe('5')
    expect(screen.queryByRole('button', { name: '元に戻す' })).toBeNull()
    expect(screen.queryByRole('region', { name: '相談用サマリー' })).toBeNull()
  })

  it('restores the mode, every shared input, initial investment, and AUTO setting', () => {
    render(<NisaCalculator />)
    change('初期投資額（任意）', '500000')
    fillFuture({ monthly: '30000', rate: '4.5', years: '20', months: '6', inflation: '2' })
    selectMode('必要な積立期間を調べる')
    change('目標額', '10000000')
    fireEvent.click(screen.getByLabelText('入力と同時に計算結果を更新する'))

    fireEvent.click(screen.getByRole('button', { name: '入力をリセット' }))
    fireEvent.click(screen.getByRole('button', { name: '元に戻す' }))

    expect(screen.getByRole('tab', { name: /必要な積立期間を調べる/ })
      .getAttribute('aria-selected')).toBe('true')
    expect((screen.getByLabelText('毎月積立額') as HTMLInputElement).value)
      .toBe('30,000')
    expect((screen.getByLabelText('目標額') as HTMLInputElement).value)
      .toBe('10,000,000')
    expect((screen.getByLabelText('入力と同時に計算結果を更新する') as HTMLInputElement).checked)
      .toBe(true)

    selectMode('将来額を調べる')
    expect((screen.getByLabelText(/初期投資額/) as HTMLInputElement).value)
      .toBe('500,000')
    expect((screen.getByLabelText('積立期間（年）') as HTMLInputElement).value)
      .toBe('20')
    expect((screen.getByLabelText('積立期間（か月）') as HTMLInputElement).value)
      .toBe('6')
    expect((screen.getByLabelText('想定インフレ率（任意）') as HTMLInputElement).value)
      .toBe('2')
  })

  it('invalidates undo on new input or a mode change and keeps only the latest reset snapshot', () => {
    render(<NisaCalculator />)
    change('毎月積立額', '10000')
    fireEvent.click(screen.getByRole('button', { name: '入力をリセット' }))
    change('毎月積立額', '20000')
    expect(screen.queryByRole('button', { name: '元に戻す' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '入力をリセット' }))
    fireEvent.click(screen.getByRole('button', { name: '元に戻す' }))
    expect((screen.getByLabelText('毎月積立額') as HTMLInputElement).value)
      .toBe('20,000')

    fireEvent.click(screen.getByRole('button', { name: '入力をリセット' }))
    selectMode('必要な毎月積立額を調べる')
    expect(screen.queryByRole('button', { name: '元に戻す' })).toBeNull()
  })

  it('provides a semantic major-point table with an exact partial final month', () => {
    render(<NisaCalculator />)
    fillFuture({ monthly: '30000', rate: '5', years: '17', months: '7' })
    calculate()

    const table = screen.getByRole('table', {
      name: '資産推移の主要時点（概算）',
    })
    expect(within(table).getAllByRole('columnheader')).toHaveLength(4)
    expect(within(table).getByRole('columnheader', { name: '時点' })
      .getAttribute('scope')).toBe('col')
    expect(within(table).getByRole('rowheader', { name: '最終（17年7か月）' })
      .getAttribute('scope')).toBe('row')
    expect(within(table).getByText('運用収益')).toBeTruthy()
    expect(within(table).getByText('将来資産額')).toBeTruthy()
  })

  it('shows zero-return data and explicitly describes a negative-return loss', () => {
    const { unmount } = render(<NisaCalculator />)
    fillFuture({ monthly: '10000', rate: '0', years: '10' })
    calculate()
    const zeroTable = screen.getByRole('table', {
      name: '資産推移の主要時点（概算）',
    })
    expect(within(zeroTable).getAllByText('￥0').length).toBeGreaterThan(0)
    unmount()

    render(<NisaCalculator />)
    fillFuture({ monthly: '10000', rate: '-20', years: '10' })
    calculate()
    expect(screen.getByText(/運用収益はマイナスで、元本を下回る試算です/))
      .toBeTruthy()
    const lossTable = screen.getByRole('table', {
      name: '資産推移の主要時点（概算）',
    })
    expect(lossTable.textContent).toMatch(/-￥|−￥/)
  })

  it('clarifies principal labels and separates the tax-free note from KPI cards', () => {
    const { container } = render(<NisaCalculator />)
    change('初期投資額（任意）', '500000')
    fillFuture()
    calculate()

    const kpiGrid = container.querySelector('.nisa-result-grid')
    expect(kpiGrid?.textContent).toContain('投資元本（初期投資額を含む）')
    expect(kpiGrid?.textContent).not.toContain('非課税メリット')
    expect(screen.getByText('NISAの非課税効果について')).toBeTruthy()
    expect(screen.getByText('別途確認')).toBeTruthy()
    expect(screen.getAllByText('NISA枠判定対象の積立元本').length)
      .toBeGreaterThan(0)
  })

  it('renders five dynamic yen labels on the asset graph Y axis', () => {
    const { container } = render(<NisaCalculator />)
    fillFuture()
    calculate()

    const labels = Array.from(
      container.querySelectorAll('.nisa-area-graph__y-axis span'),
    ).map((label) => label.textContent)
    expect(labels).toHaveLength(5)
    expect(labels.at(-1)).toBe('0')
    expect(labels.slice(0, -1).every((label) => /円$/.test(label ?? '')))
      .toBe(true)
  })

  it('associates calculation and inflation explanations with focusable tooltips', () => {
    render(<NisaCalculator />)

    const inflationTrigger = screen.getByRole('button', {
      name: '想定インフレ率の説明',
    })
    const inflationTooltipId = inflationTrigger.getAttribute('aria-describedby')
    expect(inflationTooltipId).toBeTruthy()
    expect(document.getElementById(inflationTooltipId!)?.getAttribute('role'))
      .toBe('tooltip')
    inflationTrigger.focus()
    expect(document.activeElement).toBe(inflationTrigger)

    const calculationTrigger = screen.getByRole('button', {
      name: '計算方法の説明',
    })
    expect(calculationTrigger.getAttribute('aria-describedby'))
      .toBe('nisa-effective-monthly-rate-tooltip')
    expect(screen.getByText('毎月末に積み立てる前提で試算')).toBeTruthy()
  })

  it('renders the future-value consultation summary with allowance, lists, and reproduction information', () => {
    render(<NisaCalculator />)
    change('初期投資額（任意）', '500000')
    fillFuture({ inflation: '2' })
    calculate()

    const summary = screen.getByRole('region', { name: '相談用サマリー' })
    expect(within(summary).getByText('入力条件')).toBeTruthy()
    expect(within(summary).getByText('概算結果')).toBeTruthy()
    expect(within(summary).getByText('NISA枠との関係')).toBeTruthy()
    expect(within(summary).getByText('商品固有の信託報酬等')).toBeTruthy()
    expect(within(summary).getByText('現在の利用可能枠')).toBeTruthy()
    const disclosure = within(summary).getByText('計算条件・参照情報')
      .closest('details') as HTMLDetailsElement
    expect(disclosure.open).toBe(false)
    fireEvent.click(within(disclosure).getByText('計算条件・参照情報'))
    expect(disclosure.open).toBe(true)
    expect(within(summary).getAllByText('OMG-DS-NISA-v1.0-20260730'))
      .toHaveLength(2)
    expect(within(summary).getByText('NISA積立シミュレーションモデル'))
      .toBeTruthy()
    expect(within(summary).getByText('2026年現行NISA制度')).toBeTruthy()
    expect(within(summary).getByText('2026年9月2日')).toBeTruthy()
    expect(within(summary).queryByText(/未設定|未記録/)).toBeNull()
    const primarySource = within(summary).getByRole('link', {
      name: '金融庁 NISA特設サイトを新しいタブで開く',
    })
    expect(primarySource.getAttribute('target')).toBe('_blank')
    expect(primarySource.getAttribute('rel')).toBe('noopener noreferrer')
    expect(within(summary).getByText(/計算モード=将来額を調べる/))
      .toBeTruthy()
  })

  it('renders mode-specific summaries for required contribution and required months', () => {
    const { unmount } = render(<NisaCalculator />)
    selectMode('必要な毎月積立額を調べる')
    change('目標額', '10000000')
    change('想定利回り', '5')
    change('積立期間（年）', '20')
    calculate()
    let summary = screen.getByRole('region', { name: '相談用サマリー' })
    expect(within(summary).getAllByText('必要な毎月積立額').length)
      .toBeGreaterThan(0)
    expect(within(summary).getByText('￥24,643')).toBeTruthy()
    unmount()

    render(<NisaCalculator />)
    selectMode('必要な積立期間を調べる')
    change('目標額', '10000000')
    change('毎月積立額', '30000')
    change('想定利回り', '5')
    calculate()
    summary = screen.getByRole('region', { name: '相談用サマリー' })
    expect(within(summary).getAllByText('必要期間').length).toBeGreaterThan(0)
    expect(within(summary).getByText('17年7か月')).toBeTruthy()
    expect(within(summary).getByText('211か月')).toBeTruthy()
  })

  it('removes copy and print access for stale manual input and unreachable results', () => {
    render(<NisaCalculator />)
    fillFuture()
    calculate()
    expect(screen.getByRole('button', { name: '相談用サマリーをコピー' }))
      .toBeTruthy()

    change('毎月積立額', '20000')
    expect(screen.queryByRole('region', { name: '相談用サマリー' })).toBeNull()
    expect(screen.queryByRole('button', { name: '印刷する' })).toBeNull()

    selectMode('必要な積立期間を調べる')
    change('目標額', '2000000')
    change('毎月積立額', '30000')
    change('想定利回り', '-20')
    calculate()
    expect(screen.getByText('この条件では目標額に到達しません。'))
      .toBeTruthy()
    expect(screen.queryByRole('region', { name: '相談用サマリー' })).toBeNull()
  })

  it('copies explicit plain text, resets the timer on recopy, and clears after three seconds', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    render(<NisaCalculator />)
    fillFuture()
    calculate()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '相談用サマリーをコピー' }))
      await Promise.resolve()
    })
    expect(writeText).toHaveBeenCalledTimes(1)
    const copiedText = writeText.mock.calls[0][0] as string
    expect(copiedText).toContain('【入力条件】')
    expect(copiedText).toContain('【概算結果】')
    expect(copiedText).toContain('【NISA枠との関係】')
    expect(copiedText).toContain('【計算条件・参照情報】')
    expect(copiedText).toContain('入力スナップショット:')
    expect(copiedText).toContain('制度基準: 2026年現行NISA制度')
    expect(copiedText).toContain('一次資料確認日: 2026年9月2日')
    expect(copiedText).toContain('https://www.fsa.go.jp/policy/nisa2/')
    expect(screen.getByRole('status').textContent)
      .toBe('相談用サマリーをコピーしました。')

    act(() => vi.advanceTimersByTime(2000))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '相談用サマリーをコピー' }))
      await Promise.resolve()
    })
    act(() => vi.advanceTimersByTime(1500))
    expect(screen.getByRole('status')).toBeTruthy()
    act(() => vi.advanceTimersByTime(1500))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('reports clipboard failure and invokes browser print only for a current result', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    render(<NisaCalculator />)
    expect(screen.queryByRole('button', { name: '印刷する' })).toBeNull()
    fillFuture()
    calculate()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '相談用サマリーをコピー' }))
      await Promise.resolve()
    })
    expect(screen.getByRole('status').textContent)
      .toContain('コピーできませんでした')

    fireEvent.click(screen.getByRole('button', { name: '印刷する' }))
    expect(print).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText('相談用サマリー本文').textContent)
      .toContain('一次資料')
  })

  it('keeps AUTO calculation summaries synchronized with the latest valid input', async () => {
    render(<NisaCalculator />)
    fireEvent.click(screen.getByLabelText('入力と同時に計算結果を更新する'))
    fillFuture()
    await waitFor(() => {
      expect(screen.getByRole('region', { name: '相談用サマリー' }))
        .toBeTruthy()
    })

    change('毎月積立額', '20000')
    const summary = screen.getByRole('region', { name: '相談用サマリー' })
    expect(within(summary).getAllByText('￥20,000').length).toBeGreaterThan(0)
    expect(within(summary).queryByText('￥10,000')).toBeNull()
  })
})
