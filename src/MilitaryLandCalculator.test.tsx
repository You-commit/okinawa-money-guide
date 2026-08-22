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
