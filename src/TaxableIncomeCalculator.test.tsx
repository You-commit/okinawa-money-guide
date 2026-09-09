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
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import TaxableIncomeCalculator from './TaxableIncomeCalculator'

const scrollIntoView = vi.fn()

const enterSalary = (value = '5000000') => {
  fireEvent.change(screen.getByLabelText(/^年間の給与収入/), {
    target: { value },
  })
}

describe('TaxableIncomeCalculator public UX', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'requestAnimationFrame',
      (callback: FrameRequestCallback) => {
        callback(0)
        return 0
      },
    )
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoView,
    })
  })

  afterEach(() => {
    cleanup()
    scrollIntoView.mockClear()
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
    vi.unstubAllGlobals()
  })

  it('moves to results only after a successful manual simulation', () => {
    render(<TaxableIncomeCalculator onApplyIncomeTaxRate={vi.fn()} />)

    const simulateButton = screen.getByRole('button', {
      name: 'シミュレートする',
    })
    expect((simulateButton as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(simulateButton)
    expect(scrollIntoView).not.toHaveBeenCalled()

    enterSalary()
    fireEvent.click(simulateButton)

    const results = document.querySelector('.calculator-results')!
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
    expect(scrollIntoView.mock.instances[0]).toBe(results)
    expect(document.activeElement).toBe(results)
  })

  it('does not move during automatic calculation', () => {
    render(<TaxableIncomeCalculator onApplyIncomeTaxRate={vi.fn()} />)
    fireEvent.click(screen.getByRole('checkbox', {
      name: /入力と同時に計算結果を.*更新する/,
    }))
    enterSalary()

    expect(screen.getByRole('button', {
      name: /この.+%をiDeCoに反映する/,
    })).toBeTruthy()
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('operates deduction disclosures by keyboard and preserves closed values', async () => {
    const user = userEvent.setup()
    render(<TaxableIncomeCalculator onApplyIncomeTaxRate={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '詳細' }))

    const socialTrigger = screen.getByRole('button', {
      name: /社会保険・人的控除/,
    })
    const otherTrigger = screen.getByRole('button', {
      name: /その他の所得控除/,
    })
    expect(socialTrigger.getAttribute('aria-expanded')).toBe('true')
    expect(otherTrigger.getAttribute('aria-expanded')).toBe('false')

    otherTrigger.focus()
    await user.keyboard('{Enter}')
    expect(otherTrigger.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(otherTrigger)

    await user.type(screen.getByLabelText(/^生命保険料控除/), '100000')
    await user.click(otherTrigger)
    expect(otherTrigger.getAttribute('aria-expanded')).toBe('false')
    await user.click(otherTrigger)
    expect((screen.getByLabelText(/^生命保険料控除/) as HTMLInputElement).value)
      .toBe('100,000')
  })

  it('keeps detailed deductions in the calculation and preserves the iDeCo action', () => {
    const onApplyIncomeTaxRate = vi.fn()
    render(
      <TaxableIncomeCalculator
        onApplyIncomeTaxRate={onApplyIncomeTaxRate}
      />,
    )
    enterSalary()
    fireEvent.click(screen.getByRole('button', { name: '詳細' }))
    fireEvent.change(screen.getByLabelText(/^社会保険料控除/), {
      target: { value: '500000' },
    })
    fireEvent.click(screen.getByRole('button', {
      name: 'シミュレートする',
    }))

    expect(screen.getAllByText('￥500,000').length).toBeGreaterThan(0)
    const applyButton = screen.getByRole('button', {
      name: /をiDeCoに反映する/,
    })
    fireEvent.click(applyButton)
    expect(onApplyIncomeTaxRate).toHaveBeenCalledTimes(1)
    expect(onApplyIncomeTaxRate).toHaveBeenCalledWith(expect.any(Number))
  })
})
