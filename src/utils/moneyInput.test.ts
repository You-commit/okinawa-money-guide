import {
  describe,
  expect,
  it,
} from 'vitest'
import {
  formatMoneyInputEdit,
  formatMoneyInputValue,
  getMoneyInputDigits,
} from './moneyInput'

describe('money input helpers', () => {
  it.each([
    ['1', '1'],
    ['10', '10'],
    ['1000', '1,000'],
    ['1000000', '1,000,000'],
    ['30000000', '30,000,000'],
  ])('formats %s as %s', (input, expected) => {
    expect(formatMoneyInputValue(input)).toBe(expected)
  })

  it('normalizes full-width digits and pasted separators', () => {
    expect(formatMoneyInputValue('３０００００００')).toBe(
      '30,000,000',
    )
    expect(formatMoneyInputValue('30,000,000')).toBe(
      '30,000,000',
    )
  })

  it('keeps an empty value empty and strips invalid characters by default', () => {
    expect(formatMoneyInputValue('')).toBe('')
    expect(formatMoneyInputValue('12a 3円')).toBe('123')
  })

  it('can preserve invalid characters for existing validation', () => {
    expect(formatMoneyInputValue('100円', {
      invalidCharacterPolicy: 'preserve',
    })).toBe('100円')
  })

  it('returns ungrouped calculation digits', () => {
    expect(getMoneyInputDigits('３０,０００,０００')).toBe(
      '30000000',
    )
  })

  it('keeps the caret beside the edited digit after grouping', () => {
    expect(formatMoneyInputEdit('1000', 4)).toEqual({
      value: '1,000',
      caret: 5,
    })
    expect(formatMoneyInputEdit('19,000', 2)).toEqual({
      value: '19,000',
      caret: 2,
    })
    expect(formatMoneyInputEdit('1,00', 4)).toEqual({
      value: '100',
      caret: 3,
    })
  })
})
