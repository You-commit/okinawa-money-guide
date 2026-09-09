// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import IdecoCalculator from './IdecoCalculator'

afterEach(cleanup)

const renderCalculator = (
  onOpenTaxableIncome = vi.fn(),
) => {
  render(
    <IdecoCalculator
      onOpenTaxableIncome={onOpenTaxableIncome}
    />,
  )

  return { onOpenTaxableIncome }
}

const fillValidInputs = () => {
  fireEvent.change(screen.getByLabelText('制度適用日'), {
    target: { value: '2026-11-30' },
  })
  fireEvent.change(screen.getByLabelText('加入区分'), {
    target: { value: 'category2-no-pension' },
  })
  fireEvent.change(screen.getByLabelText('毎月の掛金'), {
    target: { value: '23000' },
  })
  fireEvent.change(screen.getByLabelText('実拠出月数'), {
    target: { value: '12' },
  })
  fireEvent.change(screen.getByLabelText('所得税率'), {
    target: { value: '10' },
  })
  fireEvent.change(screen.getByLabelText('住民税所得割率'), {
    target: { value: '10' },
  })
  fireEvent.change(screen.getByLabelText('長期参考期間'), {
    target: { value: '20' },
  })
}

describe('IdecoCalculator formal eligibility UX', () => {
  it('starts with both tax rates empty and shows the formal fields', () => {
    renderCalculator()

    expect(screen.getByLabelText('制度適用日')).toBeTruthy()
    expect(screen.getByLabelText('加入区分')).toBeTruthy()
    expect((screen.getByLabelText('所得税率') as HTMLSelectElement).value).toBe('')
    expect((screen.getByLabelText('住民税所得割率') as HTMLInputElement).value).toBe('')
  })

  it('shows the aggregation input only for relevant categories', () => {
    renderCalculator()
    const category = screen.getByLabelText('加入区分')

    fireEvent.change(category, { target: { value: 'category1' } })
    expect(
      screen.getByLabelText('国民年金基金・付加保険料等（月額）'),
    ).toBeTruthy()

    fireEvent.change(category, {
      target: { value: 'category2-with-pension' },
    })
    expect(
      screen.getByLabelText('企業年金等の合算対象額（月額）'),
    ).toBeTruthy()

    fireEvent.change(category, { target: { value: 'category3' } })
    expect(
      screen.queryByLabelText('企業年金等の合算対象額（月額）'),
    ).toBeNull()
  })

  it('keeps manual-mode typing quiet until simulate is pressed', () => {
    renderCalculator()
    fireEvent.change(screen.getByLabelText('毎月の掛金'), {
      target: { value: '4000' },
    })

    expect(
      screen.queryByText('毎月の掛金は5,000円以上で入力してください。'),
    ).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))
    expect(
      screen.getAllByText('毎月の掛金は5,000円以上で入力してください。').length,
    ).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('alert')).toBe(document.activeElement)
  })

  it('validates the 1,000-yen step, category cap, and actual months', () => {
    renderCalculator()
    fillValidInputs()
    fireEvent.change(screen.getByLabelText('毎月の掛金'), {
      target: { value: '24000' },
    })
    fireEvent.change(screen.getByLabelText('実拠出月数'), {
      target: { value: '13' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))

    expect(screen.getAllByText(/月額上限は23,000円/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/実拠出月数は1〜12の整数/).length).toBeGreaterThanOrEqual(1)

    fireEvent.change(screen.getByLabelText('毎月の掛金'), {
      target: { value: '5500' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))
    expect(screen.getAllByText(/1,000円単位/).length).toBeGreaterThanOrEqual(1)
  })

  it('prevents Enter in an input from calculating', () => {
    renderCalculator()
    fillValidInputs()

    fireEvent.keyDown(screen.getByLabelText('毎月の掛金'), {
      key: 'Enter',
      code: 'Enter',
    })

    expect(screen.queryByText('￥55,780')).toBeNull()
  })

  it('calculates only after the manual action and uses actual months', () => {
    renderCalculator()
    fillValidInputs()

    expect(screen.queryByText('￥55,780')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))

    expect(screen.getAllByText('￥55,780').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('￥276,000').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('実拠出月数：12か月')).toBeTruthy()
  })

  it('clears a manual result and validation when editing resumes', () => {
    renderCalculator()
    fillValidInputs()
    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))
    expect(screen.getAllByText('￥55,780').length).toBeGreaterThanOrEqual(1)

    fireEvent.change(screen.getByLabelText('毎月の掛金'), {
      target: { value: '24000' },
    })

    expect(screen.queryByText('￥55,780')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByText(/月額上限は23,000円/)).toBeNull()
  })

  it('calculates automatically when valid and shows nonempty invalid fields', () => {
    renderCalculator()
    fillValidInputs()
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: '入力と同時に計算結果を更新する',
      }),
    )
    expect(screen.getAllByText('￥55,780').length).toBeGreaterThanOrEqual(1)

    fireEvent.change(screen.getByLabelText('毎月の掛金'), {
      target: { value: '24000' },
    })
    expect(screen.queryByText('￥55,780')).toBeNull()
    expect(screen.getAllByText(/月額上限は23,000円/).length).toBeGreaterThanOrEqual(1)

    fireEvent.change(screen.getByLabelText('毎月の掛金'), {
      target: { value: '23000' },
    })
    expect(screen.getAllByText('￥55,780').length).toBeGreaterThanOrEqual(1)
  })

  it('resets formal inputs but preserves the auto-calculation setting', () => {
    renderCalculator()
    fillValidInputs()
    const auto = screen.getByRole('checkbox', {
      name: '入力と同時に計算結果を更新する',
    })
    fireEvent.click(auto)
    fireEvent.click(screen.getByRole('button', { name: '入力内容をリセット' }))

    expect((auto as HTMLInputElement).checked).toBe(true)
    expect((screen.getByLabelText('制度適用日') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText('毎月の掛金') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText('所得税率') as HTMLSelectElement).value).toBe('')
    expect((screen.getByLabelText('住民税所得割率') as HTMLInputElement).value).toBe('')
  })

  it('keeps the taxable-income helper action', async () => {
    const user = userEvent.setup()
    const { onOpenTaxableIncome } = renderCalculator()

    await user.click(
      screen.getByRole('button', { name: '自分の所得税率を調べる' }),
    )
    expect(onOpenTaxableIncome).toHaveBeenCalledOnce()
  })
})
