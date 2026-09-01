// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest'
import IdecoCalculator from './IdecoCalculator'
import MilitaryLandCalculator from './MilitaryLandCalculator'
import MortgageCalculator from './MortgageCalculator'
import NisaCalculator from './NisaCalculator'
import TaxableIncomeCalculator from './TaxableIncomeCalculator'
import MoneyInput from './components/form/MoneyInput'
import { useState } from 'react'

const inputValue = (input: HTMLElement) =>
  (input as HTMLInputElement).value

function MoneyInputHarness() {
  const [value, setValue] = useState('')

  return (
    <MoneyInput
      aria-label="共通金額"
      value={value}
      onValueChange={setValue}
    />
  )
}

describe('shared money input behavior', () => {
  afterEach(cleanup)

  it('formats while typing and preserves a natural caret for middle edits and Backspace', async () => {
    const user = userEvent.setup()
    render(<MoneyInputHarness />)

    const input = screen.getByLabelText('共通金額') as HTMLInputElement
    await user.type(input, '1000')

    expect(input.value).toBe('1,000')

    input.setSelectionRange(1, 1)
    await user.type(input, '9', { skipClick: true })

    expect(input.value).toBe('19,000')
    expect(input.selectionStart).toBe(2)

    await user.keyboard('{Backspace}')

    expect(input.value).toBe('1,000')
    expect(input.selectionStart).toBe(1)
  })

  it('normalizes full-width input and comma-separated paste', async () => {
    const user = userEvent.setup()
    render(<MoneyInputHarness />)

    const input = screen.getByLabelText('共通金額')
    fireEvent.change(input, {
      target: { value: '３０００００００' },
    })
    expect(inputValue(input)).toBe('30,000,000')

    await user.clear(input)
    await user.click(input)
    await user.paste('30,000,000')

    expect(inputValue(input)).toBe('30,000,000')
  })
})

describe('simulator money fields', () => {
  afterEach(cleanup)

  it('keeps all military-land money fields grouped', () => {
    render(<MilitaryLandCalculator />)

    const fields = [
      screen.getByLabelText(/購入価格/),
      screen.getByLabelText(/年間借地料/),
      screen.getByLabelText(/固定資産税/),
      screen.getByLabelText(/管理費・その他経費/),
    ]

    for (const field of fields) {
      fireEvent.change(field, {
        target: { value: '1000000' },
      })
      expect(inputValue(field)).toBe('1,000,000')
    }

    fireEvent.click(screen.getByLabelText('あり'))
    const loanAmount = screen.getByLabelText(/借入額/)
    fireEvent.change(loanAmount, {
      target: { value: '10000000' },
    })
    expect(inputValue(loanAmount)).toBe('10,000,000')
  })

  it('formats the mortgage loan amount and validates it only after an explicit manual simulation', () => {
    render(<MortgageCalculator />)

    const loanAmount = screen.getByLabelText('借入金額')
    fireEvent.change(loanAmount, {
      target: { value: '30000000' },
    })
    expect(inputValue(loanAmount)).toBe('30,000,000')

    fireEvent.change(loanAmount, {
      target: { value: '100円' },
    })
    fireEvent.blur(loanAmount)
    expect(inputValue(loanAmount)).toBe('100円')
    expect(
      screen.queryByText('借入金額は数字だけで入力してください。'),
    ).toBeNull()

    fireEvent.click(screen.getByRole('button', {
      name: 'シミュレートする',
    }))

    expect(document.getElementById(
      'mortgage-loan-amount-error',
    )?.textContent).toBe(
      '借入金額は数字だけで入力してください。',
    )
  })

  it('formats and resets both NISA money fields', () => {
    render(<NisaCalculator />)

    const initial = screen.getByLabelText(/初期投資額/)
    const monthly = screen.getByLabelText(/毎月積立額/)
    fireEvent.change(initial, {
      target: { value: '1000000' },
    })
    fireEvent.change(monthly, {
      target: { value: '30000' },
    })

    expect(inputValue(initial)).toBe('1,000,000')
    expect(inputValue(monthly)).toBe('30,000')

    fireEvent.click(screen.getByRole('button', {
      name: '入力内容をリセット',
    }))
    expect(inputValue(initial)).toBe('')
    expect(inputValue(monthly)).toBe('')
  })

  it('uses the formal effective monthly rate in the current NISA result', () => {
    render(<NisaCalculator />)

    fireEvent.change(screen.getByLabelText(/毎月積立額/), {
      target: { value: '10000' },
    })
    fireEvent.change(screen.getByLabelText(/想定年利/), {
      target: { value: '5' },
    })
    fireEvent.change(screen.getByLabelText(/積立期間/), {
      target: { value: '20' },
    })
    fireEvent.click(screen.getByRole('button', {
      name: 'シミュレートする',
    }))

    expect(screen.getAllByText('￥4,058,045')).toHaveLength(2)
    expect(screen.queryByText('￥4,110,337')).toBeNull()
  })

  it('formats and resets the iDeCo contribution field', () => {
    render(
      <IdecoCalculator onOpenTaxableIncome={() => undefined} />,
    )

    const contribution = screen.getByLabelText(/毎月の掛金/)
    fireEvent.change(contribution, {
      target: { value: '23000' },
    })
    expect(inputValue(contribution)).toBe('23,000')

    fireEvent.click(screen.getByRole('button', {
      name: '入力内容をリセット',
    }))
    expect(inputValue(contribution)).toBe('')
  })

  it('formats salary and every detailed taxable-income deduction field', () => {
    render(
      <TaxableIncomeCalculator
        onApplyIncomeTaxRate={() => undefined}
      />,
    )

    const salary = screen.getByLabelText(/年間の給与収入/)
    fireEvent.change(salary, {
      target: { value: '5000000' },
    })
    expect(inputValue(salary)).toBe('5,000,000')

    fireEvent.click(screen.getByRole('button', { name: '詳細' }))

    const deductionLabels = [
      '社会保険料控除',
      '配偶者控除・配偶者特別控除',
      '扶養控除',
      '生命保険料控除',
      '地震保険料控除',
      '医療費控除',
      '寄附金控除',
      'その他の所得控除',
    ]

    for (const label of deductionLabels) {
      const input = screen.getByLabelText(
        new RegExp(label),
      )
      fireEvent.change(input, {
        target: { value: '100000' },
      })
      expect(inputValue(input)).toBe('100,000')
    }
  })
})
