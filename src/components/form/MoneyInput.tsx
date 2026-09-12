import {
  forwardRef,
  type ChangeEvent,
  type CompositionEvent,
  type InputHTMLAttributes,
} from 'react'
import {
  formatMoneyInputEdit,
  formatMoneyInputValue,
  type InvalidMoneyCharacterPolicy,
} from '../../utils/moneyInput'

type MoneyInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | 'inputMode'
  | 'onChange'
  | 'onCompositionEnd'
  | 'type'
  | 'value'
> & {
  value: string
  onValueChange: (value: string) => void
  invalidCharacterPolicy?: InvalidMoneyCharacterPolicy
}

const restoreCaret = (
  input: HTMLInputElement,
  caret: number,
) => {
  const applyCaret = () => {
    if (document.activeElement !== input) {
      return
    }

    const nextCaret = Math.min(caret, input.value.length)
    input.setSelectionRange(nextCaret, nextCaret)
  }

  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(applyCaret)
    return
  }

  queueMicrotask(applyCaret)
}

const MoneyInput = forwardRef<
  HTMLInputElement,
  MoneyInputProps
>(function MoneyInput(
  {
    value,
    onValueChange,
    invalidCharacterPolicy = 'strip',
    onBlur,
    ...inputProps
  },
  ref,
) {
  const formatCurrentValue = (
    input: HTMLInputElement,
  ) => {
    const formatted = formatMoneyInputValue(
      input.value,
      { invalidCharacterPolicy },
    )

    onValueChange(formatted)
  }

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    if (
      event.nativeEvent instanceof InputEvent &&
      event.nativeEvent.isComposing
    ) {
      onValueChange(event.currentTarget.value)
      return
    }

    const input = event.currentTarget
    const edit = formatMoneyInputEdit(
      input.value,
      input.selectionStart,
      { invalidCharacterPolicy },
    )

    onValueChange(edit.value)
    restoreCaret(input, edit.caret)
  }

  const handleCompositionEnd = (
    event: CompositionEvent<HTMLInputElement>,
  ) => {
    const input = event.currentTarget
    const edit = formatMoneyInputEdit(
      input.value,
      input.selectionStart,
      { invalidCharacterPolicy },
    )

    onValueChange(edit.value)
    restoreCaret(input, edit.caret)
  }

  return (
    <input
      {...inputProps}
      ref={ref}
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      onCompositionEnd={handleCompositionEnd}
      onBlur={(event) => {
        formatCurrentValue(event.currentTarget)
        onBlur?.(event)
      }}
    />
  )
})

export default MoneyInput
