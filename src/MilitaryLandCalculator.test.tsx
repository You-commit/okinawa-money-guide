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
import {
  buildMilitaryLandScenario,
  calculateAnnualIncomeAfterRepayment,
  calculateLevelPaymentLoan,
  calculateMilitaryLandResults,
} from './militaryLandCalculation'

const baseCalculationInputs = {
  annualRent: '300000',
  purchasePrice: '15000000',
  leaseYears: '50',
  fixedAssetTax: '35000',
  managementExpenses: '15000',
  hasLoan: false,
  loanAmount: '',
  loanTerm: '',
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

const fillScenarioPeriod = async (
  user: ReturnType<typeof userEvent.setup>,
  years = '50',
) => {
  await user.type(
    screen.getByRole('textbox', {
      name: '長期シナリオ期間',
    }),
    years,
  )
}

const runManualCalculationWithAnnualCosts = async (
  scenarioYears?: string,
) => {
  const user = await fillValidConditions()
  await fillAnnualCosts(user)
  if (scenarioYears) {
    await fillScenarioPeriod(user, scenarioYears)
  }
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

  it('does not calculate borrowing references when borrowing is disabled', () => {
    const result = calculateMilitaryLandResults({
      ...baseCalculationInputs,
      loanAmount: '10000000',
      loanTerm: '20',
      interestRate: '1.5',
    })

    expect(result.monthlyPayment).toBeNull()
    expect(result.annualPayment).toBeNull()
    expect(result.afterRepaymentAnnualIncome).toBeNull()
  })

  it('calculates level-payment borrowing reference values when borrowing is enabled', () => {
    const result = calculateMilitaryLandResults({
      ...baseCalculationInputs,
      hasLoan: true,
      loanAmount: '10000000',
      loanTerm: '20',
      interestRate: '1.5',
    })

    expect(result.monthlyPayment).toBeCloseTo(48254.540888, 5)
    expect(result.annualPayment).toBeCloseTo(579054.490658, 5)
    expect(result.afterRepaymentAnnualIncome).toBeCloseTo(-329054.490658, 5)
  })

  it('calculates a zero-interest loan as principal divided by payment count', () => {
    const result = calculateLevelPaymentLoan({
      principal: 1200000,
      annualRatePercent: 0,
      termYears: 10,
    })

    expect(result?.monthlyPayment).toBe(10000)
    expect(result?.annualPayment).toBe(120000)
  })

  it.each([
    ['empty loan amount', '', '20', '1.5'],
    ['zero loan amount', '0', '20', '1.5'],
    ['empty loan term', '10000000', '', '1.5'],
    ['zero loan term', '10000000', '0', '1.5'],
    ['empty interest rate', '10000000', '20', ''],
  ])('leaves borrowing references uncalculated for %s', (
    _label,
    loanAmount,
    loanTerm,
    interestRate,
  ) => {
    const result = calculateMilitaryLandResults({
      ...baseCalculationInputs,
      hasLoan: true,
      loanAmount,
      loanTerm,
      interestRate,
    })

    expect(result.monthlyPayment).toBeNull()
    expect(result.annualPayment).toBeNull()
    expect(result.afterRepaymentAnnualIncome).toBeNull()
  })

  it('keeps all core KPIs unchanged when borrowing conditions change', () => {
    const withoutLoan = calculateMilitaryLandResults(baseCalculationInputs)
    const withLoan = calculateMilitaryLandResults({
      ...baseCalculationInputs,
      hasLoan: true,
      loanAmount: '10000000',
      loanTerm: '20',
      interestRate: '1.5',
    })

    expect(withLoan.surfaceYield).toBe(withoutLoan.surfaceYield)
    expect(withLoan.expenseAdjustedYield).toBe(withoutLoan.expenseAdjustedYield)
    expect(withLoan.coreAnnualIncome).toBe(withoutLoan.coreAnnualIncome)
    expect(withLoan.paybackYears).toBe(withoutLoan.paybackYears)
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
      hasLoan: true,
      loanAmount: '10000000',
      loanTerm: '20',
      interestRate: '.',
    })

    expect(result.monthlyPayment).toBeNull()
    expect(result.annualPayment).toBeNull()
    expect(result.afterRepaymentAnnualIncome).toBeNull()
    expect(Object.values(result).some(Number.isNaN)).toBe(false)
  })

  it('does not fall back to 50 years when the scenario period is blank', () => {
    const result = calculateMilitaryLandResults({
      ...baseCalculationInputs,
      leaseYears: '',
    })

    expect(result.leaseYears).toBeNull()
    expect(result.coreAnnualIncome).toBe(250000)
  })

  it('has no sale-cost result or calculation dependency', () => {
    const legacyInputs = {
      ...baseCalculationInputs,
      saleCostRate: '99',
    }
    const result = calculateMilitaryLandResults(legacyInputs)

    expect(result).not.toHaveProperty('saleCosts')
    expect(result.coreAnnualIncome).toBe(250000)
    expect(result.expenseAdjustedYield).toBeCloseTo(1.666666, 5)
  })
})

describe('MilitaryLandCalculator loan repayment and scenario rules', () => {
  const standardLoan = calculateLevelPaymentLoan({
    principal: 10000000,
    annualRatePercent: 1.5,
    termYears: 20,
  })!

  it('uses the repayment-adjusted annual income during the loan term only', () => {
    expect(calculateAnnualIncomeAfterRepayment({
      coreAnnualIncome: 1700000,
      annualPayment: standardLoan.annualPayment,
      loanTermYears: 20,
      year: 20,
    })).toBeCloseTo(1120945.509341, 5)
    expect(calculateAnnualIncomeAfterRepayment({
      coreAnnualIncome: 1700000,
      annualPayment: standardLoan.annualPayment,
      loanTermYears: 20,
      year: 21,
    })).toBe(1700000)
  })

  it('subtracts repayments only through the loan end in a longer scenario', () => {
    const scenario = buildMilitaryLandScenario({
      coreAnnualIncome: 1700000,
      scenarioYears: 50,
      annualPayment: standardLoan.annualPayment,
      loanTermYears: 20,
    })
    const year20 = scenario.find((point) => point.year === 20)
    const year50 = scenario.find((point) => point.year === 50)

    expect(year20?.repaymentValue).toBeCloseTo(22418910.186832, 5)
    expect(year50?.propertyValue).toBe(85000000)
    expect(year50?.repaymentValue).toBeCloseTo(73418910.186832, 5)
  })

  it('treats every displayed year as repayment period when the scenario is shorter than the loan', () => {
    const scenario = buildMilitaryLandScenario({
      coreAnnualIncome: 1700000,
      scenarioYears: 10,
      annualPayment: standardLoan.annualPayment,
      loanTermYears: 20,
    })
    const finalPoint = scenario[scenario.length - 1]

    expect(finalPoint.year).toBe(10)
    expect(finalPoint.repaymentValue).toBeCloseTo(
      (1700000 - standardLoan.annualPayment) * 10,
      5,
    )
  })

  it('does not generate a scenario without a long-term period', () => {
    expect(buildMilitaryLandScenario({
      coreAnnualIncome: 1700000,
      scenarioYears: null,
      annualPayment: standardLoan.annualPayment,
      loanTermYears: 20,
    })).toEqual([])
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

    await runManualCalculationWithAnnualCosts('50')

    expect(screen.getByText('物件単体：50年後 1,250.0万円')).toBeTruthy()
  })

  it('starts with an empty long-term scenario period instead of 50 years', () => {
    render(<MilitaryLandCalculator />)

    const scenarioPeriod = screen.getByRole('textbox', {
      name: '長期シナリオ期間',
    }) as HTMLInputElement

    expect(scenarioPeriod.value).toBe('')
    expect(scenarioPeriod.placeholder).toBe('表示年数を入力')
    expect(screen.queryByDisplayValue('50')).toBeNull()
  })

  it('calculates all core KPIs without a long-term scenario period', async () => {
    render(<MilitaryLandCalculator />)

    await runManualCalculationWithAnnualCosts()

    expect(screen.getAllByText('2.00%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('1.67%').length).toBeGreaterThan(0)
    expect(screen.getByText('25.0万円')).toBeTruthy()
    expect(screen.getByText('60.0年')).toBeTruthy()
  })

  it('does not generate long-term charts while the scenario period is blank', async () => {
    const { container } = render(<MilitaryLandCalculator />)

    await runManualCalculationWithAnnualCosts()

    expect(container.querySelector('.military-chart-total')).toBeNull()
    expect(screen.getAllByText('条件入力後に表示します')).toHaveLength(2)
  })

  it('uses the entered scenario period for the long-term calculation', async () => {
    render(<MilitaryLandCalculator />)

    await runManualCalculationWithAnnualCosts('20')

    expect(screen.getByText('物件単体：20年後 500.0万円')).toBeTruthy()
  })

  it('uses compact labels and equal columns when the period chart has six bars', async () => {
    const { container } = render(<MilitaryLandCalculator />)

    const user = await fillValidConditions()
    await fillAnnualCosts(user)
    await fillScenarioPeriod(user)
    await user.click(screen.getByRole('radio', { name: 'あり' }))
    await user.type(screen.getByLabelText(/借入額/), '10000000')
    await user.type(screen.getByLabelText(/借入期間/), '15')
    await user.type(screen.getByLabelText(/金利（年率）/), '1.5')
    await user.click(screen.getByRole('button', {
      name: 'シミュレートする',
    }))

    const periodChart = container.querySelector(
      '.military-period-bars',
    ) as HTMLDivElement

    expect(periodChart.style.gridTemplateColumns).toBe(
      'repeat(6, minmax(0, 1fr))',
    )
    expect(screen.getAllByText('250万円')).toHaveLength(4)
    expect(screen.getAllByText('125万円')).toHaveLength(2)
    expect(screen.queryByText('250.0万円')).toBeNull()
  })

  it('provides an accessible tooltip for the scenario period', () => {
    render(<MilitaryLandCalculator />)

    const trigger = screen.getByRole('button', {
      name: '長期シナリオ期間の説明',
    }) as HTMLButtonElement
    const tooltip = screen.getByRole('tooltip')

    expect(tooltip.textContent).toContain(
      '現在の入力条件が変わらないと仮定した単純シナリオを、何年間表示するかを指定します。',
    )
    expect(trigger.tabIndex).toBe(0)
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id)
    trigger.focus()
    expect(document.activeElement).toBe(trigger)
  })

  it('does not render a sale-cost input', () => {
    render(<MilitaryLandCalculator />)

    expect(screen.queryByLabelText(/売却時の諸費用/)).toBeNull()
  })

  it('shows level-payment results and a repayment-adjusted long-term comparison', async () => {
    render(<MilitaryLandCalculator />)

    const user = await fillValidConditions()
    await fillAnnualCosts(user)
    await fillScenarioPeriod(user)
    await user.click(screen.getByRole('radio', { name: 'あり' }))
    await user.type(screen.getByLabelText(/借入額/), '10000000')
    await user.type(screen.getByLabelText(/借入期間/), '20')
    await user.type(screen.getByLabelText(/金利（年率）/), '1.5')
    await user.click(
      screen.getByRole('button', {
        name: 'シミュレートする',
      }),
    )

    expect(screen.getByText('物件単体：50年後 1,250.0万円')).toBeTruthy()
    expect(screen.getByText('￥48,255')).toBeTruthy()
    expect(screen.getByText('￥579,054')).toBeTruthy()
    expect(screen.getByText('-￥329,054')).toBeTruthy()
    expect(screen.getByText(/返済考慮後：50年後/)).toBeTruthy()
    expect(screen.getByText('返済考慮後（参考）')).toBeTruthy()
  })

  it('keeps borrowing reference values uncalculated until all required loan inputs exist', async () => {
    render(<MilitaryLandCalculator />)

    const user = await fillValidConditions()
    await user.click(screen.getByRole('radio', { name: 'あり' }))
    await user.type(screen.getByLabelText(/借入額/), '10000000')
    await user.type(screen.getByLabelText(/借入期間/), '20')
    await user.click(screen.getByRole('button', { name: 'シミュレートする' }))

    expect(screen.getByText('借入条件の参考結果')).toBeTruthy()
    expect(screen.getAllByText('―')).toHaveLength(3)
    expect(screen.getAllByText('2.00%').length).toBeGreaterThan(0)
  })

  it('updates borrowing references automatically when loan conditions change', async () => {
    render(<MilitaryLandCalculator />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('checkbox', {
      name: '入力と同時に計算結果を更新する',
    }))
    await user.type(screen.getByLabelText(/年間借地料/), '300000')
    await user.type(screen.getByLabelText(/購入価格/), '15000000')
    await user.click(screen.getByRole('radio', { name: 'あり' }))
    await user.type(screen.getByLabelText(/借入額/), '10000000')
    await user.type(screen.getByLabelText(/借入期間/), '20')
    const rate = screen.getByLabelText(/金利（年率）/)
    await user.type(rate, '1.5')

    expect(screen.getByText('￥48,255')).toBeTruthy()
    await user.clear(rate)
    await user.type(rate, '0')
    expect(screen.getByText('￥41,667')).toBeTruthy()
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
    await user.click(screen.getByRole('radio', { name: 'あり' }))
    await user.type(screen.getByLabelText(/借入額/), '10000000')
    await user.type(screen.getByLabelText(/借入期間/), '20')
    await user.type(screen.getByLabelText(/金利（年率）/), '1.5')
    await user.type(screen.getByRole('textbox', { name: '長期シナリオ期間' }), '50')
    await user.click(screen.getByRole('button', { name: 'リセット' }))

    expect(automaticCalculation.checked).toBe(true)
    expect((screen.getByLabelText(/年間借地料/) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/購入価格/) as HTMLInputElement).value).toBe('')
    expect((screen.getByRole('textbox', { name: '長期シナリオ期間' }) as HTMLInputElement).value).toBe('')
    expect((screen.getByRole('radio', { name: 'なし' }) as HTMLInputElement).checked).toBe(true)
    await user.click(screen.getByRole('radio', { name: 'あり' }))
    expect((screen.getByLabelText(/借入額/) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/借入期間/) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/金利（年率）/) as HTMLInputElement).value).toBe('')
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
