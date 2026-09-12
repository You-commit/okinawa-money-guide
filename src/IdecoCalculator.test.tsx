// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import IdecoCalculator from './IdecoCalculator'
import {
  IDECO_SUPPORTED_EFFECTIVE_DATE_ERROR,
  IDECO_SUPPORTED_EFFECTIVE_DATE_FROM,
  IDECO_SUPPORTED_EFFECTIVE_DATE_TO,
} from './idecoRules'

const scrollIntoView = vi.fn()

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
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

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
  fireEvent.change(screen.getByLabelText('計算基準日'), {
    target: { value: '2026-11-30' },
  })
  fireEvent.change(screen.getByLabelText('現在の年齢'), {
    target: { value: '40' },
  })
  fireEvent.change(screen.getByLabelText('加入区分'), {
    target: { value: 'category2-no-pension' },
  })
  fireEvent.change(screen.getByLabelText('毎月の掛金'), {
    target: { value: '23000' },
  })
  fireEvent.change(screen.getByLabelText('今年の掛金拠出月数'), {
    target: { value: '12' },
  })
  fireEvent.change(screen.getByLabelText('所得税率'), {
    target: { value: '10' },
  })
  fireEvent.change(screen.getByLabelText('住民税所得割率'), {
    target: { value: '10' },
  })
  fireEvent.change(screen.getByLabelText('長期試算期間'), {
    target: { value: '20' },
  })
}

const switchToDetailedMode = () => {
  fireEvent.click(
    screen.getByRole('button', {
      name: /課税所得から詳しく計算/,
    }),
  )
}

const fillValidDetailedInputs = () => {
  fillValidInputs()
  switchToDetailedMode()
  fireEvent.change(
    screen.getByLabelText('掛金控除前の課税所得'),
    { target: { value: '3500000' } },
  )
}

describe('IdecoCalculator formal eligibility UX', () => {
  it('starts with both tax rates empty and shows the formal fields', () => {
    renderCalculator()

    const calculationDate = screen.getByLabelText('計算基準日')
    expect(calculationDate).toBeTruthy()
    expect(calculationDate.getAttribute('min')).toBe(
      IDECO_SUPPORTED_EFFECTIVE_DATE_FROM,
    )
    expect(calculationDate.getAttribute('max')).toBe(
      IDECO_SUPPORTED_EFFECTIVE_DATE_TO,
    )
    expect(screen.getByLabelText('現在の年齢')).toBeTruthy()
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
    fireEvent.change(screen.getByLabelText('今年の掛金拠出月数'), {
      target: { value: '13' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))

    expect(screen.getAllByText(/月額上限は23,000円/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/今年の掛金拠出月数は1〜12の整数/).length).toBeGreaterThanOrEqual(1)

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
    expect(screen.getAllByText('今年の掛金拠出月数').length)
      .toBeGreaterThanOrEqual(1)
  })

  it('moves to results only after a successful manual simulation', () => {
    renderCalculator()
    fillValidInputs()

    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))

    const results = document.querySelector('.calculator-results')!
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
    expect(scrollIntoView.mock.instances[0]).toBe(results)
    expect(document.activeElement).toBe(results)

    scrollIntoView.mockClear()
    fireEvent.change(screen.getByLabelText('毎月の掛金'), {
      target: { value: '4000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('does not move to results during automatic calculation', () => {
    renderCalculator()
    fillValidInputs()
    scrollIntoView.mockClear()

    fireEvent.click(screen.getByRole('checkbox', {
      name: '入力と同時に計算結果を更新する',
    }))

    expect(screen.getAllByText('￥55,780').length).toBeGreaterThanOrEqual(1)
    expect(scrollIntoView).not.toHaveBeenCalled()
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

  it('blocks out-of-range calculation dates in manual and auto modes', () => {
    renderCalculator()
    fillValidInputs()
    const calculationDate = screen.getByLabelText('計算基準日')

    fireEvent.change(calculationDate, {
      target: { value: '2028-01-01' },
    })
    expect(screen.queryByText(IDECO_SUPPORTED_EFFECTIVE_DATE_ERROR))
      .toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))
    expect(screen.getAllByText(IDECO_SUPPORTED_EFFECTIVE_DATE_ERROR).length)
      .toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('￥55,780')).toBeNull()

    fireEvent.change(calculationDate, {
      target: { value: '2026-11-30' },
    })
    fireEvent.click(screen.getByRole('checkbox', {
      name: '入力と同時に計算結果を更新する',
    }))
    expect(screen.getAllByText('￥55,780').length).toBeGreaterThanOrEqual(1)

    fireEvent.change(calculationDate, {
      target: { value: '2025-12-31' },
    })
    expect(screen.getAllByText(IDECO_SUPPORTED_EFFECTIVE_DATE_ERROR).length)
      .toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('￥55,780')).toBeNull()
  })

  it('resets all formal inputs and the auto-calculation setting', () => {
    renderCalculator()
    fillValidInputs()
    const auto = screen.getByRole('checkbox', {
      name: '入力と同時に計算結果を更新する',
    })
    fireEvent.click(auto)
    fireEvent.click(screen.getByRole('button', { name: '入力内容をリセット' }))

    expect((auto as HTMLInputElement).checked).toBe(false)
    expect((screen.getByLabelText('計算基準日') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText('現在の年齢') as HTMLInputElement).value).toBe('')
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
    expect(onOpenTaxableIncome).toHaveBeenCalledWith({
      calculationMode: 'simple',
      taxableIncomeBeforeContribution: '',
    })
  })

  it('keeps the taxable-income helper accessible in detailed mode', async () => {
    const user = userEvent.setup()
    const { onOpenTaxableIncome } = renderCalculator()

    switchToDetailedMode()
    fireEvent.change(
      screen.getByLabelText('掛金控除前の課税所得'),
      { target: { value: '3500000' } },
    )

    const lookup = screen.getByRole('button', {
      name: '自分の所得税率を調べる',
    })
    lookup.focus()
    await user.keyboard('{Enter}')

    expect(onOpenTaxableIncome).toHaveBeenCalledWith({
      calculationMode: 'detailed',
      taxableIncomeBeforeContribution: '3,500,000',
    })
  })

  it('starts in simple mode and exposes an accessible two-mode selector', () => {
    renderCalculator()

    const simple = screen.getByRole('button', {
      name: /簡易税率で計算/,
    })
    const detailed = screen.getByRole('button', {
      name: /課税所得から詳しく計算/,
    })

    expect(simple.getAttribute('aria-pressed')).toBe('true')
    expect(detailed.getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByLabelText('所得税率')).toBeTruthy()
    expect(
      screen.queryByLabelText('掛金控除前の課税所得'),
    ).toBeNull()
  })

  it('supports keyboard mode switching and preserves common inputs', async () => {
    const user = userEvent.setup()
    renderCalculator()
    fillValidInputs()

    const detailed = screen.getByRole('button', {
      name: /課税所得から詳しく計算/,
    })
    detailed.focus()
    await user.keyboard(' ')

    expect(detailed.getAttribute('aria-pressed')).toBe('true')
    expect(
      (screen.getByLabelText('毎月の掛金') as HTMLInputElement).value,
    ).toBe('23,000')
    expect(
      (screen.getByLabelText('今年の掛金拠出月数') as HTMLInputElement).value,
    ).toBe('12')
    expect(screen.getByLabelText('掛金控除前の課税所得')).toBeTruthy()
  })

  it('keeps detailed-mode typing quiet until the manual action validates it', () => {
    renderCalculator()
    switchToDetailedMode()
    fireEvent.change(
      screen.getByLabelText('掛金控除前の課税所得'),
      { target: { value: '' } },
    )

    expect(
      screen.queryByText('掛金控除前の課税所得を入力してください。'),
    ).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))
    expect(
      screen.getAllByText('掛金控除前の課税所得を入力してください。').length,
    ).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('alert')).toBe(document.activeElement)
  })

  it('calculates detailed pre/post tax and shows the breakdown', () => {
    renderCalculator()
    fillValidDetailedInputs()
    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))

    expect(screen.getAllByText('￥76,200').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('課税所得と所得税額の変化')).toBeTruthy()
    expect(screen.getByText('￥3,500,000')).toBeTruthy()
    expect(screen.getByText('￥3,224,000')).toBeTruthy()
    expect(screen.getByText(/20%/)).toBeTruthy()
    expect(screen.getByText(/掛金全額に1つの税率を掛けた金額ではなく/)).toBeTruthy()
  })

  it('uses the formal special-income-tax names from 2027', () => {
    renderCalculator()
    fillValidDetailedInputs()
    fireEvent.change(screen.getByLabelText('計算基準日'), {
      target: { value: '2027-01-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))

    expect(
      screen.getByText(/防衛特別所得税1%・復興特別所得税1.1%/),
    ).toBeTruthy()
  })

  it('invalidates a calculated result when the mode changes', () => {
    renderCalculator()
    fillValidInputs()
    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))
    expect(screen.getAllByText('￥55,780').length).toBeGreaterThanOrEqual(1)

    switchToDetailedMode()

    expect(screen.queryByText('￥55,780')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('calculates detailed mode automatically only after valid inputs are present', () => {
    renderCalculator()
    fillValidDetailedInputs()
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: '入力と同時に計算結果を更新する',
      }),
    )

    expect(screen.getAllByText('￥76,200').length).toBeGreaterThanOrEqual(1)

    fireEvent.change(
      screen.getByLabelText('掛金控除前の課税所得'),
      { target: { value: '' } },
    )
    expect(screen.queryByText('￥76,200')).toBeNull()
    expect(
      screen.queryByText('掛金控除前の課税所得を入力してください。'),
    ).toBeNull()
  })

  it('does not calculate detailed mode when Enter is pressed in the taxable-income field', () => {
    renderCalculator()
    fillValidDetailedInputs()

    fireEvent.keyDown(
      screen.getByLabelText('掛金控除前の課税所得'),
      { key: 'Enter', code: 'Enter' },
    )

    expect(screen.queryByText('￥76,200')).toBeNull()
  })

  it('keeps the resident tax rate empty until the user explicitly chooses the standard-rate helper', async () => {
    const user = userEvent.setup()
    renderCalculator()

    const residentTaxRate = screen.getByLabelText(
      '住民税所得割率',
    ) as HTMLInputElement
    const standardRateButton = screen.getByRole('button', {
      name: '標準税率10%を入力',
    })

    expect(residentTaxRate.value).toBe('')
    expect(standardRateButton.getAttribute('type')).toBe('button')
    await user.click(standardRateButton)
    expect(residentTaxRate.value).toBe('10')
    expect(screen.queryByText('￥55,780')).toBeNull()
  })

  it('supports keyboard access to the resident-tax helper and info', async () => {
    const user = userEvent.setup()
    renderCalculator()

    const info = screen.getByRole('button', {
      name: '住民税所得割率の確認方法',
    })
    const incomeTaxInfo = screen.getByRole('button', {
      name: '課税所得についての説明',
    })

    expect(info.textContent).toBe('?')
    expect(info.className).toBe(incomeTaxInfo.className)
    info.focus()
    expect(document.activeElement).toBe(info)
    expect(screen.getByText(
      /所得の種類や課税方式によって異なる場合があるため/,
    )).toBeTruthy()

    const standardRateButton = screen.getByRole('button', {
      name: '標準税率10%を入力',
    })
    standardRateButton.focus()
    await user.keyboard('{Enter}')
    expect(
      (screen.getByLabelText('住民税所得割率') as HTMLInputElement).value,
    ).toBe('10')

    fireEvent.change(screen.getByLabelText('住民税所得割率'), {
      target: { value: '' },
    })
    standardRateButton.focus()
    await user.keyboard(' ')
    expect(
      (screen.getByLabelText('住民税所得割率') as HTMLInputElement).value,
    ).toBe('10')
  })

  it('explains the calculation date and contribution months accessibly', async () => {
    const user = userEvent.setup()
    renderCalculator()

    expect(screen.getByText(
      /この日付時点のiDeCo制度で計算します。掛金の開始日ではありません。/,
    )).toBeTruthy()
    expect(screen.getByText(/対応期間は2026年1月1日〜2027年12月31日/))
      .toBeTruthy()
    expect(screen.getByText('加入可能年齢の確認に使用します。'))
      .toBeTruthy()
    expect(screen.getByText(
      '今年、実際に掛金を拠出する月数を入力してください。',
    )).toBeTruthy()
    expect(screen.getByText(
      /現在の掛金・税率・制度が続くと仮定して/,
    )).toBeTruthy()

    const dateHelp = screen.getByRole('button', {
      name: '計算基準日の説明',
    })
    const monthsHelp = screen.getByRole('button', {
      name: '今年の掛金拠出月数の説明',
    })
    expect(dateHelp.textContent).toBe('?')
    expect(monthsHelp.className).toBe(dateHelp.className)
    dateHelp.focus()
    expect(document.activeElement).toBe(dateHelp)
    await user.keyboard('{Tab}')
    expect(document.activeElement).not.toBe(dateHelp)
  })

  it('sets 12 contribution months only through the compact helper', async () => {
    const user = userEvent.setup()
    renderCalculator()

    const months = screen.getByLabelText(
      '今年の掛金拠出月数',
    ) as HTMLInputElement
    const helper = screen.getByRole('button', {
      name: '12か月で計算',
    })

    expect(months.value).toBe('')
    expect(helper.getAttribute('type')).toBe('button')
    helper.focus()
    await user.keyboard('{Enter}')
    expect(months.value).toBe('12')
    expect(screen.queryByText('￥55,780')).toBeNull()

    fireEvent.change(months, { target: { value: '' } })
    helper.focus()
    await user.keyboard(' ')
    expect(months.value).toBe('12')

    fireEvent.click(screen.getByRole('button', {
      name: '入力内容をリセット',
    }))
    expect(months.value).toBe('')
    fireEvent.click(screen.getByRole('button', { name: '元に戻す' }))
    expect(months.value).toBe('12')
  })

  it('recalculates from the 12-month helper only when AUTO is on and inputs are valid', () => {
    renderCalculator()
    fillValidInputs()
    fireEvent.change(screen.getByLabelText('今年の掛金拠出月数'), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('checkbox', {
      name: '入力と同時に計算結果を更新する',
    }))

    expect(screen.queryByText('￥55,780')).toBeNull()
    fireEvent.click(screen.getByRole('button', {
      name: '12か月で計算',
    }))
    expect(screen.getAllByText('￥55,780').length).toBeGreaterThanOrEqual(1)
  })

  it('groups eligibility, contribution, and tax inputs by meaning', () => {
    renderCalculator()

    const eligibility = screen.getByRole('region', {
      name: '制度・加入条件',
    })
    const contribution = screen.getByRole('region', {
      name: '掛金・期間',
    })
    const tax = screen.getByRole('region', { name: '税率' })

    expect(eligibility.contains(screen.getByLabelText('計算基準日'))).toBe(true)
    expect(eligibility.contains(screen.getByLabelText('現在の年齢'))).toBe(true)
    expect(eligibility.contains(screen.getByLabelText('加入区分'))).toBe(true)
    expect(contribution.contains(screen.getByLabelText('毎月の掛金'))).toBe(true)
    expect(contribution.contains(screen.getByLabelText('今年の掛金拠出月数'))).toBe(true)
    expect(contribution.contains(screen.getByLabelText('長期試算期間'))).toBe(true)
    expect(tax.contains(screen.getByLabelText('所得税率'))).toBe(true)
    expect(tax.contains(screen.getByLabelText('住民税所得割率'))).toBe(true)
    expect(tax.contains(screen.getByRole('button', {
      name: '標準税率10%を入力',
    }))).toBe(true)
  })

  it('keeps the effective-date and age fields in the same alignment row', () => {
    renderCalculator()

    const dateField = screen.getByLabelText('計算基準日')
      .closest('.ideco-field')
    const ageField = screen.getByLabelText('現在の年齢')
      .closest('.ideco-field')

    expect(dateField?.classList.contains(
      'ideco-field--alignment-peer',
    )).toBe(true)
    expect(ageField?.classList.contains(
      'ideco-field--alignment-peer',
    )).toBe(true)

    const dateLabelRow = screen.getByText('計算基準日').parentElement
    const monthsLabelRow = screen.getByText(
      '今年の掛金拠出月数',
    ).parentElement
    const incomeTaxLabelRow = screen.getByText('所得税率').parentElement
    const residentTaxLabelRow = screen.getByText(
      '住民税所得割率',
    ).parentElement
    expect(dateLabelRow?.classList.contains(
      'ideco-field-label-row',
    )).toBe(true)
    expect(monthsLabelRow?.classList.contains(
      'ideco-field-label-row',
    )).toBe(true)
    expect(incomeTaxLabelRow?.classList.contains(
      'ideco-field-label-row',
    )).toBe(true)
    expect(residentTaxLabelRow?.classList.contains(
      'ideco-field-label-row',
    )).toBe(true)

    expect(screen.getByLabelText('所得税率')
      .closest('.ideco-tax-rate-field')).toBeTruthy()
  })

  it('recalculates after the standard resident-tax action only when AUTO is on and all other values are valid', () => {
    renderCalculator()
    fillValidInputs()
    fireEvent.change(screen.getByLabelText('住民税所得割率'), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('checkbox', {
      name: '入力と同時に計算結果を更新する',
    }))

    expect(screen.queryByText('￥55,780')).toBeNull()
    fireEvent.click(screen.getByRole('button', {
      name: '標準税率10%を入力',
    }))
    expect(screen.getAllByText('￥55,780').length).toBeGreaterThanOrEqual(1)
  })

  it('validates age at the formal regime boundary and does not calculate an ineligible condition', () => {
    renderCalculator()
    fillValidInputs()
    fireEvent.change(screen.getByLabelText('現在の年齢'), {
      target: { value: '65' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))

    expect(screen.getAllByText(/65歳以上はこの試算の対象外/).length)
      .toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('￥55,780')).toBeNull()
  })

  it('offers one-generation undo without restoring the previous result', () => {
    renderCalculator()
    fillValidInputs()
    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))
    expect(screen.getAllByText('￥55,780').length).toBeGreaterThanOrEqual(1)

    fireEvent.click(screen.getByRole('button', { name: '入力内容をリセット' }))
    expect(screen.getAllByText('入力内容をリセットしました。').length)
      .toBeGreaterThanOrEqual(1)
    expect((screen.getByLabelText('住民税所得割率') as HTMLInputElement).value).toBe('')
    expect(screen.queryByText('￥55,780')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '元に戻す' }))
    expect((screen.getByLabelText('住民税所得割率') as HTMLInputElement).value).toBe('10')
    expect((screen.getByLabelText('現在の年齢') as HTMLInputElement).value).toBe('40')
    expect(screen.queryByRole('button', { name: '元に戻す' })).toBeNull()
    expect(screen.queryByText('￥55,780')).toBeNull()
  })

  it('does not restore an unsupported calculation date through reset undo', () => {
    renderCalculator()
    fireEvent.change(screen.getByLabelText('計算基準日'), {
      target: { value: '2028-01-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: '入力内容をリセット' }))
    fireEvent.click(screen.getByRole('button', { name: '元に戻す' }))

    expect(
      (screen.getByLabelText('計算基準日') as HTMLInputElement).value,
    ).toBe('')
  })

  it('restores a resident rate entered with the standard helper', () => {
    renderCalculator()
    fireEvent.click(screen.getByRole('button', {
      name: '標準税率10%を入力',
    }))
    fireEvent.click(screen.getByRole('button', { name: '入力内容をリセット' }))
    fireEvent.click(screen.getByRole('button', { name: '元に戻す' }))

    expect(
      (screen.getByLabelText('住民税所得割率') as HTMLInputElement).value,
    ).toBe('10')
  })

  it('expires reset undo when new input or a calculation-mode change begins', () => {
    renderCalculator()
    fillValidInputs()
    fireEvent.click(screen.getByRole('button', { name: '入力内容をリセット' }))
    fireEvent.change(screen.getByLabelText('現在の年齢'), {
      target: { value: '40' },
    })
    expect(screen.queryByRole('button', { name: '元に戻す' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '入力内容をリセット' }))
    fireEvent.click(screen.getByRole('button', {
      name: /課税所得から詳しく計算/,
    }))
    expect(screen.queryByRole('button', { name: '元に戻す' })).toBeNull()
  })

  it('shows the simple consultation summary only after a successful calculation', () => {
    renderCalculator()
    expect(screen.queryByRole('region', { name: '相談用サマリー' })).toBeNull()

    fillValidInputs()
    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))

    const summary = screen.getByRole('region', { name: '相談用サマリー' })
    expect(summary.textContent).toContain('計算基準日2026-11-30')
    expect(summary.textContent).toContain('今年の掛金拠出月数12か月')
    expect(summary.textContent).toContain('長期試算期間20年')
    expect(summary.textContent).toContain('現在の年齢40歳')
    expect(summary.textContent).toContain('住民税所得割率10%')
    expect(summary.textContent).toContain('適用月額上限23,000円')
    expect(summary.textContent).toContain('未考慮事項')
    expect(summary.textContent).toContain('一次資料')
    expect(summary.textContent).not.toMatch(/OMG-DS-IDECO|モデル版|計算日時/)
  })

  it('shows detailed taxable-income values in the consultation summary', () => {
    renderCalculator()
    fillValidDetailedInputs()
    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))

    const summary = screen.getByRole('region', { name: '相談用サマリー' })
    expect(summary.textContent).toContain('詳細課税所得モード')
    expect(summary.textContent).toContain('控除前課税所得3,500,000円')
    expect(summary.textContent).toContain('iDeCo所得控除額276,000円')
    expect(summary.textContent).toContain('控除後課税所得3,224,000円')
  })

  it('copies the plain-text summary and excludes developer metadata', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    renderCalculator()
    fillValidInputs()
    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))

    fireEvent.click(screen.getByRole('button', {
      name: '相談用サマリーをコピー',
    }))

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledOnce())
    const copied = writeText.mock.calls[0][0] as string
    expect(copied).toContain('iDeCo節税シミュレーター 相談用サマリー')
    expect(copied).toContain('計算基準日: 2026-11-30')
    expect(copied).toContain('今年の掛金拠出月数: 12か月')
    expect(copied).toContain('長期試算期間: 20年')
    expect(copied).toContain('年間節税効果: 55,780円')
    expect(copied).not.toMatch(/OMG-DS-IDECO|モデル版|計算日時|debug/i)
    expect(await screen.findByText('相談用サマリーをコピーしました。')).toBeTruthy()
  })

  it('reports a copy failure without removing the summary', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })
    renderCalculator()
    fillValidInputs()
    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))
    fireEvent.click(screen.getByRole('button', {
      name: '相談用サマリーをコピー',
    }))

    expect(await screen.findByText('コピーできませんでした。もう一度お試しください。')).toBeTruthy()
    expect(screen.getByRole('region', { name: '相談用サマリー' })).toBeTruthy()
  })

  it('prints only after calculation and keeps the printable summary metadata-free', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    renderCalculator()
    expect(screen.queryByRole('button', { name: '印刷する' })).toBeNull()

    fillValidInputs()
    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))
    fireEvent.click(screen.getByRole('button', { name: '印刷する' }))

    expect(print).toHaveBeenCalledOnce()
    expect(screen.getByLabelText('相談用サマリー本文').textContent)
      .not.toMatch(/OMG-DS-IDECO|モデル版|計算日時/)
  })

  it('states the formal privacy policy without exposing developer metadata', () => {
    renderCalculator()

    expect(screen.queryByLabelText('入力データの取り扱い')).toBeNull()
    expect(document.body.textContent).toContain(
      '入力内容はこのページの計算にのみ使用し、保存・外部送信しません。',
    )
    expect(document.body.textContent).not.toContain('AI学習')
    expect(document.body.textContent).not.toMatch(/internal timestamp|debug snapshot|model version/i)
  })

  it('summarizes the current calculation conditions as compact user-facing items', () => {
    renderCalculator()
    fillValidInputs()
    fireEvent.click(screen.getByRole('button', { name: 'シミュレートする' }))

    const context = document.querySelector('.ideco-result-context')
    expect(context?.textContent).toContain('今回の計算条件')
    expect(context?.textContent).toContain('計算基準2026-11-30')
    expect(context?.textContent).toContain('月額掛金￥23,000')
    expect(context?.textContent).toContain('今年の掛金拠出月数12か月')
    expect(context?.textContent).toContain('長期試算期間20年')
    expect(context?.textContent).not.toContain('現在の年齢')
    expect(context?.textContent).not.toMatch(/model|仕様ID|timestamp/i)
  })
})
