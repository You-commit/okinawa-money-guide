// @vitest-environment jsdom

import {
  cleanup,
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
import MilitaryLandCalculator from './MilitaryLandCalculator'
import { calculateMilitaryLandResults } from './militaryLandCalculation'

const baseCalculationInputs = {
  annualRent: '300000',
  purchasePrice: '15000000',
  leaseYears: '50',
  fixedAssetTax: '35000',
  managementExpenses: '15000',
  saleCostRate: '5',
  hasLoan: false,
  loanAmount: '',
  interestRate: '',
}

const setMobileViewport = (matches: boolean) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches:
        query === '(max-width: 760px)'
          ? matches
          : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

const fillValidConditions = async () => {
  const user = userEvent.setup()

  await user.type(
    screen.getByLabelText(/年間借地料/),
    '300000',
  )
  await user.type(
    screen.getByLabelText(/購入価格/),
    '15000000',
  )

  return user
}

const fillAnnualCosts = async (
  user: ReturnType<typeof userEvent.setup>,
) => {
  await user.type(
    screen.getByLabelText(/固定資産税/),
    '35000',
  )
  await user.type(
    screen.getByLabelText(/管理費・その他経費/),
    '15000',
  )
}

const runManualCalculationWithAnnualCosts = async () => {
  const user = await fillValidConditions()
  await fillAnnualCosts(user)
  await user.click(
    screen.getByRole('button', {
      name: 'シミュレートする',
    }),
  )

  return user
}

describe('MilitaryLandCalculator mobile result navigation', () => {
  const scrollIntoView = vi.fn()

  beforeEach(() => {
    vi.stubGlobal(
      'requestAnimationFrame',
      (callback: FrameRequestCallback) => {
        callback(0)
        return 0
      },
    )
    Object.defineProperty(
      HTMLElement.prototype,
      'scrollIntoView',
      {
        configurable: true,
        writable: true,
        value: scrollIntoView,
      },
    )
  })

  afterEach(() => {
    cleanup()
    scrollIntoView.mockClear()
    Reflect.deleteProperty(
      HTMLElement.prototype,
      'scrollIntoView',
    )
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('moves to the result region after a successful manual calculation on mobile', async () => {
    setMobileViewport(true)
    render(<MilitaryLandCalculator />)

    const user = await fillValidConditions()
    await user.click(
      screen.getByRole('button', {
        name: 'シミュレートする',
      }),
    )

    const results = screen.getByRole('region', {
      name: 'シミュレーション結果',
    })

    expect(screen.getByText('50.00倍')).toBeTruthy()
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
    expect(
      scrollIntoView.mock.instances[0],
    ).toBe(results)
  })

  it('does not move the viewport after a manual calculation on desktop', async () => {
    setMobileViewport(false)
    render(<MilitaryLandCalculator />)

    const user = await fillValidConditions()
    await user.click(
      screen.getByRole('button', {
        name: 'シミュレートする',
      }),
    )

    expect(screen.getByText('50.00倍')).toBeTruthy()
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('reflects annual taxes and expenses in the net yield results', async () => {
    setMobileViewport(false)
    render(<MilitaryLandCalculator />)

    const user = await fillValidConditions()
    await fillAnnualCosts(user)
    await user.click(
      screen.getByRole('button', {
        name: 'シミュレートする',
      }),
    )

    expect(screen.getAllByText('1.67%').length).toBeGreaterThan(0)
    expect(screen.getByText('25.0万円')).toBeTruthy()
    expect(screen.getByText('60.0年')).toBeTruthy()
  })

  it('does not move the viewport while automatic calculation updates', async () => {
    setMobileViewport(true)
    render(<MilitaryLandCalculator />)

    const user = userEvent.setup()
    await user.click(
      screen.getByRole('checkbox', {
        name: '入力と同時に計算結果を更新する',
      }),
    )
    await user.type(
      screen.getByLabelText(/年間借地料/),
      '300000',
    )
    await user.type(
      screen.getByLabelText(/購入価格/),
      '15000000',
    )

    expect(screen.getByText('50.00倍')).toBeTruthy()
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('returns to the input form and focuses the first field on mobile', async () => {
    setMobileViewport(true)
    const { container } = render(
      <MilitaryLandCalculator />,
    )

    const user = await fillValidConditions()
    await user.click(
      screen.getByRole('button', {
        name: 'シミュレートする',
      }),
    )

    scrollIntoView.mockClear()

    await user.click(
      screen.getByRole('button', {
        name: '入力条件に戻る',
      }),
    )

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
    expect(
      scrollIntoView.mock.instances[0],
    ).toBe(
      container.querySelector('.calculator-form'),
    )
    expect(document.activeElement).toBe(
      screen.getByLabelText(/年間借地料/),
    )
  })
})

describe('MilitaryLandCalculator approved core calculation rules', () => {
  it('calculates surface yield from annual rent and purchase price', () => {
    const result = calculateMilitaryLandResults(baseCalculationInputs)

    expect(result.surfaceYield).toBe(2)
  })

  it('calculates core annual income without borrowing costs', () => {
    const result = calculateMilitaryLandResults(baseCalculationInputs)

    expect(result.coreAnnualIncome).toBe(250000)
  })

  it('calculates the expense-adjusted yield from core annual income', () => {
    const result = calculateMilitaryLandResults(baseCalculationInputs)

    expect(result.expenseAdjustedYield).toBeCloseTo(1.666666, 5)
  })

  it('calculates the purchase-price-based payback period', () => {
    const result = calculateMilitaryLandResults(baseCalculationInputs)

    expect(result.paybackYears).toBe(60)
  })

  it('does not calculate a payback period when core annual income is zero or less', () => {
    const result = calculateMilitaryLandResults({
      ...baseCalculationInputs,
      fixedAssetTax: '300000',
      managementExpenses: '50000',
    })

    expect(result.coreAnnualIncome).toBe(-50000)
    expect(result.paybackYears).toBeNull()
  })

  it('uses zero annual interest when borrowing is disabled', () => {
    const result = calculateMilitaryLandResults({
      ...baseCalculationInputs,
      loanAmount: '10000000',
      interestRate: '1.5',
    })

    expect(result.annualInterest).toBe(0)
    expect(result.interestAdjustedAnnualIncome).toBe(250000)
  })

  it('calculates borrowing reference values when borrowing is enabled', () => {
    const result = calculateMilitaryLandResults({
      ...baseCalculationInputs,
      hasLoan: true,
      loanAmount: '10000000',
      interestRate: '1.5',
    })

    expect(result.annualInterest).toBe(150000)
    expect(result.interestAdjustedAnnualIncome).toBe(100000)
  })

  it('calculates approximate annual interest as loan amount times rate', () => {
    const result = calculateMilitaryLandResults({
      ...baseCalculationInputs,
      hasLoan: true,
      loanAmount: '10000000',
      interestRate: '1.5',
    })

    expect(result.annualInterest).toBe(150000)
  })

  it('does not mix borrowing interest into core annual income', () => {
    const result = calculateMilitaryLandResults({
      ...baseCalculationInputs,
      hasLoan: true,
      loanAmount: '10000000',
      interestRate: '1.5',
    })

    expect(result.coreAnnualIncome).toBe(250000)
  })

  it('does not mix borrowing interest into expense-adjusted yield', () => {
    const result = calculateMilitaryLandResults({
      ...baseCalculationInputs,
      hasLoan: true,
      loanAmount: '10000000',
      interestRate: '1.5',
    })

    expect(result.expenseAdjustedYield).toBeCloseTo(1.666666, 5)
  })

  it('does not mix borrowing interest into the core payback period', () => {
    const result = calculateMilitaryLandResults({
      ...baseCalculationInputs,
      hasLoan: true,
      loanAmount: '10000000',
      interestRate: '1.5',
    })

    expect(result.paybackYears).toBe(60)
  })

  it('calculates interest-adjusted annual income as a separate reference value', () => {
    const result = calculateMilitaryLandResults({
      ...baseCalculationInputs,
      hasLoan: true,
      loanAmount: '10000000',
      interestRate: '1.5',
    })

    expect(result.interestAdjustedAnnualIncome).toBe(100000)
  })

  it('returns empty results instead of dividing by zero', () => {
    const result = calculateMilitaryLandResults({
      ...baseCalculationInputs,
      purchasePrice: '0',
    })

    expect(result.surfaceYield).toBeNull()
    expect(result.expenseAdjustedYield).toBeNull()
    expect(result.paybackYears).toBeNull()
  })

  it('prevents invalid decimal input from producing NaN', () => {
    const result = calculateMilitaryLandResults({
      ...baseCalculationInputs,
      saleCostRate: '.',
      hasLoan: true,
      loanAmount: '10000000',
      interestRate: '.',
    })

    expect(result.saleCosts).toBe(0)
    expect(result.annualInterest).toBe(0)
    expect(result.interestAdjustedAnnualIncome).toBe(250000)
    expect(Object.values(result).some(Number.isNaN)).toBe(false)
  })
})

describe('MilitaryLandCalculator long-term scenario and state behavior', () => {
  beforeEach(() => {
    setMobileViewport(false)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('shows the long-term total as core annual income multiplied by years', async () => {
    render(<MilitaryLandCalculator />)

    await runManualCalculationWithAnnualCosts()

    expect(screen.getByText('50年後の累計 1,250.0万円')).toBeTruthy()
  })

  it('does not mix sale costs into the long-term scenario', async () => {
    render(<MilitaryLandCalculator />)

    const user = await fillValidConditions()
    await fillAnnualCosts(user)
    const saleCostInput = screen.getByLabelText(/売却時の諸費用/)
    await user.clear(saleCostInput)
    await user.type(saleCostInput, '99')
    await user.click(
      screen.getByRole('button', {
        name: 'シミュレートする',
      }),
    )

    expect(screen.getByText('50年後の累計 1,250.0万円')).toBeTruthy()
  })

  it('does not mix borrowing interest into the core long-term scenario', async () => {
    render(<MilitaryLandCalculator />)

    const user = await fillValidConditions()
    await fillAnnualCosts(user)
    await user.click(screen.getByRole('radio', { name: 'あり' }))
    await user.type(screen.getByLabelText(/借入額/), '10000000')
    await user.type(screen.getByLabelText(/金利（年率）/), '1.5')
    await user.click(
      screen.getByRole('button', {
        name: 'シミュレートする',
      }),
    )

    expect(screen.getByText('50年後の累計 1,250.0万円')).toBeTruthy()
    expect(screen.getByText('￥150,000')).toBeTruthy()
    expect(screen.getByText('￥100,000')).toBeTruthy()
  })

  it('keeps automatic calculation enabled after reset and clears result inputs', async () => {
    render(<MilitaryLandCalculator />)

    const user = userEvent.setup()
    const automaticCalculation = screen.getByRole('checkbox', {
      name: '入力と同時に計算結果を更新する',
    }) as HTMLInputElement
    await user.click(automaticCalculation)
    await user.type(screen.getByLabelText(/年間借地料/), '300000')
    await user.type(screen.getByLabelText(/購入価格/), '15000000')
    await user.click(screen.getByRole('button', { name: 'リセット' }))

    expect(automaticCalculation.checked).toBe(true)
    expect((screen.getByLabelText(/年間借地料/) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/購入価格/) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/借地期間/) as HTMLInputElement).value).toBe('50')
  })

  it('supports an automatic-to-manual-to-automatic calculation round trip', async () => {
    render(<MilitaryLandCalculator />)

    const user = userEvent.setup()
    const automaticCalculation = screen.getByRole('checkbox', {
      name: '入力と同時に計算結果を更新する',
    })
    await user.click(automaticCalculation)
    await user.type(screen.getByLabelText(/年間借地料/), '300000')
    await user.type(screen.getByLabelText(/購入価格/), '15000000')
    expect(screen.getByText('50.00倍')).toBeTruthy()

    await user.click(automaticCalculation)
    expect(screen.queryByText('50.00倍')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'シミュレートする' }))
    expect(screen.getByText('50.00倍')).toBeTruthy()

    await user.click(automaticCalculation)
    expect(screen.getByText('50.00倍')).toBeTruthy()
  })

  it('warns when either annual cost is left blank', async () => {
    render(<MilitaryLandCalculator />)

    const user = await fillValidConditions()
    await user.click(
      screen.getByRole('button', {
        name: 'シミュレートする',
      }),
    )

    expect(screen.getByText(
      '未入力の年間費用は0円として仮計算しています。実際の費用をご確認ください。',
    )).toBeTruthy()
  })

  it('removes the missing-cost warning when both annual costs are entered', async () => {
    render(<MilitaryLandCalculator />)

    await runManualCalculationWithAnnualCosts()

    expect(screen.queryByText(
      '未入力の年間費用は0円として仮計算しています。実際の費用をご確認ください。',
    )).toBeNull()
  })
})
