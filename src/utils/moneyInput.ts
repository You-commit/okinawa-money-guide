export type InvalidMoneyCharacterPolicy =
  | 'strip'
  | 'preserve'

type FormatMoneyInputOptions = {
  invalidCharacterPolicy?: InvalidMoneyCharacterPolicy
}

export type MoneyInputEdit = {
  value: string
  caret: number
}

export const normalizeMoneyInputCharacters = (
  value: string,
) => value.normalize('NFKC')

export const getMoneyInputDigits = (
  value: string,
) => normalizeMoneyInputCharacters(value).replace(/[^\d]/g, '')

const groupMoneyDigits = (digits: string) => {
  const normalizedDigits = digits.replace(/^0+(?=\d)/, '')

  return normalizedDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export const formatMoneyInputValue = (
  value: string,
  {
    invalidCharacterPolicy = 'strip',
  }: FormatMoneyInputOptions = {},
) => {
  const normalized = normalizeMoneyInputCharacters(value)
  const withoutSeparators = normalized
    .replace(/,/g, '')
    .replace(/\s/g, '')

  if (withoutSeparators === '') {
    return ''
  }

  if (
    invalidCharacterPolicy === 'preserve' &&
    !/^\d+$/.test(withoutSeparators)
  ) {
    return normalized.replace(/\s/g, '')
  }

  const digits = invalidCharacterPolicy === 'strip'
    ? getMoneyInputDigits(normalized)
    : withoutSeparators

  return digits === '' ? '' : groupMoneyDigits(digits)
}

const findCaretAfterDigitCount = (
  value: string,
  digitCount: number,
) => {
  if (digitCount <= 0) {
    return 0
  }

  let seenDigits = 0

  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) {
      seenDigits += 1
    }

    if (seenDigits === digitCount) {
      return index + 1
    }
  }

  return value.length
}

export const formatMoneyInputEdit = (
  rawValue: string,
  rawCaret: number | null,
  options: FormatMoneyInputOptions = {},
): MoneyInputEdit => {
  const normalized = normalizeMoneyInputCharacters(rawValue)
  const caret = rawCaret === null
    ? normalized.length
    : Math.max(0, Math.min(rawCaret, normalized.length))
  const digitsBeforeCaret = getMoneyInputDigits(
    normalized.slice(0, caret),
  ).length
  const value = formatMoneyInputValue(normalized, options)

  if (
    options.invalidCharacterPolicy === 'preserve' &&
    /[^\d,\s]/.test(normalized)
  ) {
    return {
      value,
      caret: Math.min(caret, value.length),
    }
  }

  return {
    value,
    caret: findCaretAfterDigitCount(
      value,
      digitsBeforeCaret,
    ),
  }
}
