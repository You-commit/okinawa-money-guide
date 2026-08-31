// @vitest-environment jsdom

import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    within,
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
import MortgageCalculator from './MortgageCalculator'

const fillValidConditions = async () => {
    const user = userEvent.setup()

    await user.type(
        screen.getByLabelText('借入金額'),
        '30000000',
    )
    await user.type(
        screen.getByLabelText('年利'),
        '1',
    )
    await user.type(
        screen.getByLabelText('返済期間'),
        '35',
    )

    return user
}

const expectDefinitionValue = (
    scope: HTMLElement,
    label: string,
    value: string,
) => {
    const term = within(scope).getByText(label)
    const row = term.closest('div')

    expect(row).not.toBeNull()
    expect(within(row!).getByText(value)).toBeTruthy()
}

const expectManualResultCleared = () => {
    expect(
        screen
            .getByText('シミュレーション結果')
            .closest('section')
            ?.getAttribute('data-empty'),
    ).toBe('true')
    expect(screen.queryByText('約84,686円')).toBeNull()
    expect(document.querySelectorAll(
        '.mortgage-trajectory--empty',
    )).toHaveLength(2)
    expect(screen.getByText(
        '条件を変更しました。シミュレートすると結果を更新します。',
    )).toBeTruthy()
    expect(screen.queryByText(
        /前回の結果を表示しています/,
    )).toBeNull()
    expect(screen.queryByText(
        /条件変更前の結果です/,
    )).toBeNull()
}

describe('MortgageCalculator', () => {
    afterEach(() => {
        cleanup()
        vi.useRealTimers()
        vi.unstubAllGlobals()
    })

    beforeEach(() => {
        vi.stubGlobal(
            'requestAnimationFrame',
            (callback: FrameRequestCallback) => {
                callback(0)
                return 0
            },
        )
    })

    it('starts without field errors', () => {
        render(<MortgageCalculator />)

        expect(
            screen.getByText(
                '借入条件を入力してください。',
            ),
        ).toBeTruthy()
        expect(
            screen.queryByRole('alert'),
        ).toBeNull()
        expect(
            screen
                .getByText('シミュレーション結果')
                .closest('section')
                ?.getAttribute('data-empty'),
        ).toBe('true')
        expect(
            (screen.getByLabelText(
                '返済期間スライダー',
            ) as HTMLInputElement).value,
        ).toBe('1')
        expect(
            screen
                .getByLabelText('返済期間スライダー')
                .getAttribute('aria-valuetext'),
        ).toBe('未入力')
    })

    it('does not submit or validate the whole form when Enter is pressed in an incomplete field', async () => {
        const user = userEvent.setup()

        render(<MortgageCalculator />)

        const loanAmount =
            screen.getByLabelText('借入金額')

        await user.type(loanAmount, '30000000')
        await user.type(loanAmount, '{Enter}')

        expect(screen.queryByRole('alert')).toBeNull()
        expect(
            screen.queryByText('年利を入力してください。'),
        ).toBeNull()
        expect(
            screen.queryByText('返済期間を入力してください。'),
        ).toBeNull()
        expect(
            screen
                .getByText('シミュレーション結果')
                .closest('section')
                ?.getAttribute('data-empty'),
        ).toBe('true')
    })

    it('does not calculate when Enter is pressed in a field after valid input', async () => {
        render(<MortgageCalculator />)
        const user = await fillValidConditions()

        await user.type(
            screen.getByLabelText('返済期間'),
            '{Enter}',
        )

        expect(
            screen
                .getByText('シミュレーション結果')
                .closest('section')
                ?.getAttribute('data-empty'),
        ).toBe('true')
        expect(
            screen.queryByText('概算結果を更新しました。'),
        ).toBeNull()
    })

    it('focuses the error summary after a manual submit and links to each invalid field', async () => {
        const user = userEvent.setup()

        render(<MortgageCalculator />)

        await user.click(
            screen.getByRole('button', {
                name: 'シミュレートする',
            }),
        )

        const errorSummary =
            await screen.findByRole('alert')

        expect(errorSummary.className).toContain(
            'mortgage-error-summary',
        )
        expect(
            document
                .querySelector('.mortgage-status')
                ?.getAttribute('data-tone'),
        ).not.toBe('success')

        expect(
            errorSummary.textContent,
        ).toContain(
            '入力内容を確認してください',
        )
        expect(
            errorSummary.textContent,
        ).toContain('3件')
        expect(document.activeElement).toBe(
            errorSummary,
        )

        const loanAmountLink = within(
            errorSummary,
        ).getByRole('link', {
            name: '借入金額を入力してください。',
        })
        expect(
            within(errorSummary).getByRole('link', {
                name: '年利を入力してください。',
            }),
        ).toBeTruthy()
        expect(
            within(errorSummary).getByRole('link', {
                name: '返済期間を入力してください。',
            }),
        ).toBeTruthy()

        await user.click(loanAmountLink)

        expect(document.activeElement).toBe(
            screen.getByLabelText('借入金額'),
        )
    })

    it('displays both repayment methods and their comparison explanation', async () => {
        render(<MortgageCalculator />)

        const user = await fillValidConditions()

        await user.click(
            screen.getByRole('button', {
                name: 'シミュレートする',
            }),
        )

        expect(screen.getByText('概算結果を更新しました。')).toBeTruthy()

        const equalPayment = screen.getByRole('article', { name: '元利均等返済' })
        const equalPrincipal = screen.getByRole('article', { name: '元金均等返済' })

        expectDefinitionValue(
            equalPayment,
            '毎月返済額',
            '約84,686円',
        )
        expectDefinitionValue(
            equalPayment,
            '最終回返済額',
            '約84,686円',
        )
        expectDefinitionValue(
            equalPrincipal,
            '初回返済額',
            '約96,429円',
        )
        expectDefinitionValue(
            equalPrincipal,
            '最終回返済額',
            '約71,488円',
        )
        expect(screen.getByText('元金均等返済は、元利均等返済より初回返済額が約11,743円高い一方、支払利息総額は約305,498円少ない試算です。')).toBeTruthy()
        expect(screen.getByText('強調して表示する返済方式')).toBeTruthy()
        expect(within(equalPayment).getByText('選択中')).toBeTruthy()
        expect(screen.queryByText(/主に確認/)).toBeNull()
        expect(equalPayment.getAttribute('data-selected')).toBe('true')
        expect(
            screen.getByRole('heading', {
                name: '累計返済額の推移',
            }),
        ).toBeTruthy()
        const graphGuide = screen.getByRole(
            'complementary',
            { name: 'グラフの見方' },
        )
        expect(graphGuide.textContent).toContain(
            '濃色は累計元金、淡色は累計利息',
        )
        expect(graphGuide.textContent).toContain(
            '金融機関固有の端数処理',
        )
        expect(
            screen
                .getByText('概算結果を更新しました。')
                .closest('.mortgage-status')
                ?.getAttribute('data-tone'),
        ).toBe('success')
        expect(
            screen
                .getByText('概算結果')
                .closest('section')
                ?.getAttribute('data-empty'),
        ).toBe('false')
    })

    it('calculates when the focused simulate button is activated with Enter', async () => {
        const user = userEvent.setup()

        render(<MortgageCalculator />)

        await fillValidConditions()

        const simulateButton = screen.getByRole(
            'button',
            { name: 'シミュレートする' },
        )
        simulateButton.focus()
        await user.keyboard('{Enter}')

        expect(
            screen.getByText('概算結果'),
        ).toBeTruthy()
        expectDefinitionValue(
            screen.getByRole('article', {
                name: '元利均等返済',
            }),
            '毎月返済額',
            '約84,686円',
        )
    })

    it('keeps the repayment period input and slider synchronized at both limits without calculating in manual mode', async () => {
        const user = userEvent.setup()

        render(<MortgageCalculator />)

        const periodInput = screen.getByLabelText(
            '返済期間',
        ) as HTMLInputElement
        const slider = screen.getByLabelText(
            '返済期間スライダー',
        ) as HTMLInputElement

        fireEvent.change(slider, {
            target: { value: '2' },
        })
        fireEvent.change(slider, {
            target: { value: '1' },
        })
        expect(periodInput.value).toBe('1')
        expect(slider.value).toBe('1')

        fireEvent.change(slider, {
            target: { value: '50' },
        })
        expect(periodInput.value).toBe('50')
        expect(slider.value).toBe('50')

        await user.clear(periodInput)
        await user.type(periodInput, '20')

        expect(slider.value).toBe('20')
        expect(slider.getAttribute('aria-valuetext')).toBe(
            '20年',
        )
        expect(
            screen
                .getByText('シミュレーション結果')
                .closest('section')
                ?.getAttribute('data-empty'),
        ).toBe('true')
    })

    it('automatically recalculates when the repayment period slider changes in auto mode', async () => {
        const user = userEvent.setup()

        render(<MortgageCalculator />)

        await user.click(screen.getByRole('checkbox', {
            name: '入力と同時に計算結果を更新する',
        }))
        await user.type(
            screen.getByLabelText('借入金額'),
            '30000000',
        )
        await user.type(
            screen.getByLabelText('借入金額'),
            '{Enter}',
        )
        await user.type(
            screen.getByLabelText('年利'),
            '1',
        )

        fireEvent.change(
            screen.getByLabelText('返済期間スライダー'),
            { target: { value: '35' } },
        )

        expect(screen.getByText('概算結果')).toBeTruthy()
        expectDefinitionValue(
            screen.getByRole('article', {
                name: '元利均等返済',
            }),
            '毎月返済額',
            '約84,686円',
        )
    })

    it('clears the previous manual result after an annual-rate change and recalculates only on simulate', async () => {
        render(<MortgageCalculator />)

        const user = await fillValidConditions()

        await user.click(
            screen.getByRole('button', {
                name: 'シミュレートする',
            }),
        )

        const annualRate =
            screen.getByLabelText('年利')

        await user.clear(annualRate)
        await user.type(annualRate, '1.5')

        expectManualResultCleared()
        expect(screen.queryByRole('alert')).toBeNull()

        await user.click(screen.getByRole('button', {
            name: 'シミュレートする',
        }))

        const recalculatedResult = screen.getByRole(
            'article',
            { name: '元利均等返済' },
        )
        expect(within(recalculatedResult).queryByText(
            '約84,686円',
        )).toBeNull()
        expect(screen.getByText(
            '概算結果を更新しました。',
        )).toBeTruthy()
        expect(screen.queryByText(
            '条件を変更しました。シミュレートすると結果を更新します。',
        )).toBeNull()
        expect(screen.queryByText(
            /前回の結果を表示しています/,
        )).toBeNull()
    })

    it('keeps an invalid loan amount edit validation-free in manual mode until simulate is requested again', async () => {
        render(<MortgageCalculator />)

        const user = await fillValidConditions()
        await user.click(screen.getByRole('button', {
            name: 'シミュレートする',
        }))

        const loanAmount = screen.getByLabelText(
            '借入金額',
        )

        await user.clear(loanAmount)

        expectManualResultCleared()
        expect(screen.queryByRole('alert')).toBeNull()
        expect(screen.queryByText(
            '借入金額を入力してください。',
        )).toBeNull()
        expect(loanAmount.getAttribute('aria-invalid')).toBe(
            'false',
        )

        await user.click(screen.getByRole('button', {
            name: 'シミュレートする',
        }))

        expect(await screen.findByRole('alert')).toBeTruthy()
        expect(document.getElementById(
            'mortgage-loan-amount-error',
        )?.textContent).toBe(
            '借入金額を入力してください。',
        )
        expect(loanAmount.getAttribute('aria-invalid')).toBe(
            'true',
        )
    })

    it('does not show validation while the annual rate is cleared in manual mode', async () => {
        render(<MortgageCalculator />)

        const user = await fillValidConditions()
        await user.click(screen.getByRole('button', {
            name: 'シミュレートする',
        }))

        const annualRate = screen.getByLabelText('年利')
        await user.clear(annualRate)
        await user.tab()

        expect(screen.queryByRole('alert')).toBeNull()
        expect(screen.queryByText(
            '年利を入力してください。',
        )).toBeNull()
        expect(annualRate.getAttribute('aria-invalid')).toBe(
            'false',
        )
    })

    it('does not show validation while the repayment period is deleted in manual mode', async () => {
        render(<MortgageCalculator />)

        const user = await fillValidConditions()
        await user.click(screen.getByRole('button', {
            name: 'シミュレートする',
        }))

        const repaymentYears = screen.getByLabelText(
            '返済期間',
        )
        await user.clear(repaymentYears)
        await user.type(repaymentYears, '{Enter}')

        expect(screen.queryByRole('alert')).toBeNull()
        expect(screen.queryByText(
            '返済期間を入力してください。',
        )).toBeNull()
        expect(
            repaymentYears.getAttribute('aria-invalid'),
        ).toBe('false')
    })

    it('clears manual results for both repayment-period input and slider changes', async () => {
        render(<MortgageCalculator />)

        const user = await fillValidConditions()
        const simulateButton = screen.getByRole('button', {
            name: 'シミュレートする',
        })
        await user.click(simulateButton)

        const repaymentYears = screen.getByLabelText(
            '返済期間',
        )
        await user.clear(repaymentYears)
        await user.type(repaymentYears, '20')

        expectManualResultCleared()

        await user.click(simulateButton)
        expect(screen.getByRole('article', {
            name: '元利均等返済',
        })).toBeTruthy()

        fireEvent.change(
            screen.getByLabelText('返済期間スライダー'),
            { target: { value: '25' } },
        )

        expectManualResultCleared()
        expect(screen.queryByRole('alert')).toBeNull()
    })

    it('clears submitted manual errors when editing resumes and does not revalidate during input', async () => {
        const user = userEvent.setup()

        render(<MortgageCalculator />)

        await user.click(screen.getByRole('button', {
            name: 'シミュレートする',
        }))

        expect(await screen.findByRole('alert')).toBeTruthy()
        expect(screen.getByLabelText(
            '借入金額',
        ).getAttribute('aria-invalid')).toBe('true')

        await user.type(
            screen.getByLabelText('借入金額'),
            '30000000',
        )

        expect(screen.queryByRole('alert')).toBeNull()
        expect(screen.queryByText(
            '年利を入力してください。',
        )).toBeNull()
        expect(screen.queryByText(
            '返済期間を入力してください。',
        )).toBeNull()
        expect(screen.getByLabelText(
            '借入金額',
        ).getAttribute('aria-invalid')).toBe('false')
    })

    it('shows real-time validation in auto mode and clears it after a valid correction', async () => {
        const user = userEvent.setup()

        render(<MortgageCalculator />)

        await user.click(screen.getByRole('checkbox', {
            name: '入力と同時に計算結果を更新する',
        }))
        await user.type(
            screen.getByLabelText('借入金額'),
            '30000000',
        )
        await user.type(
            screen.getByLabelText('年利'),
            '1',
        )
        await user.type(
            screen.getByLabelText('返済期間'),
            '35',
        )

        const annualRate = screen.getByLabelText('年利')
        await user.clear(annualRate)

        expect(screen.getByText(
            '年利を入力してください。',
        )).toBeTruthy()
        expect(annualRate.getAttribute('aria-invalid')).toBe(
            'true',
        )
        expect(document.body.textContent).not.toContain('NaN')

        await user.type(annualRate, '1.5')

        expect(screen.queryByText(
            '年利を入力してください。',
        )).toBeNull()
        expect(annualRate.getAttribute('aria-invalid')).toBe(
            'false',
        )
        expect(screen.getByText(
            '概算結果を更新しました。',
        )).toBeTruthy()
        expect(screen.queryByText(
            '条件を変更しました。シミュレートすると結果を更新します。',
        )).toBeNull()
        expect(screen.queryByText(
            /前回の結果を表示しています/,
        )).toBeNull()
    })

    it('does not show required errors for untouched fields in auto mode', async () => {
        const user = userEvent.setup()

        render(<MortgageCalculator />)

        await user.click(
            screen.getByRole('checkbox', {
                name: '入力と同時に計算結果を更新する',
            }),
        )

        await user.type(
            screen.getByLabelText('借入金額'),
            '30000000',
        )

        expect(
            screen.queryByText(
                '年利を入力してください。',
            ),
        ).toBeNull()
        expect(
            screen.queryByText(
                '返済期間を入力してください。',
            ),
        ).toBeNull()

        const annualRate =
            screen.getByLabelText('年利')

        await user.type(annualRate, '21')
        await user.tab()

        const annualRateError =
            document.getElementById(
                'mortgage-interest-rate-error',
            )

        expect(
            annualRateError?.textContent,
        ).toBe(
            '年利は0～20％で入力してください。',
        )
        expect(
            screen.queryByText(
                '返済期間を入力してください。',
            ),
        ).toBeNull()
        expect(
            screen.queryByRole('alert'),
        ).toBeNull()
        expect(document.body.textContent).not.toContain('NaN')
    })

    it('automatically calculates once all valid conditions are present', async () => {
        const user = userEvent.setup()

        render(<MortgageCalculator />)

        await user.click(
            screen.getByRole('checkbox', {
                name: '入力と同時に計算結果を更新する',
            }),
        )

        await user.type(
            screen.getByLabelText('借入金額'),
            '30000000',
        )
        await user.type(
            screen.getByLabelText('年利'),
            '1',
        )
        await user.type(
            screen.getByLabelText('返済期間'),
            '35',
        )

        expect(
            screen.getByText(
                '概算結果を更新しました。',
            ),
        ).toBeTruthy()
        expectDefinitionValue(
            screen.getByRole('article', {
                name: '元利均等返済',
            }),
            '毎月返済額',
            '約84,686円',
        )
    })

    it('keeps the current valid result when switching from auto to manual calculation', async () => {
        const user = userEvent.setup()

        render(<MortgageCalculator />)

        const autoCalculation = screen.getByRole(
            'checkbox',
            {
                name: '入力と同時に計算結果を更新する',
            },
        )

        await user.click(autoCalculation)
        await user.type(
            screen.getByLabelText('借入金額'),
            '30000000',
        )
        await user.type(
            screen.getByLabelText('年利'),
            '1',
        )
        await user.type(
            screen.getByLabelText('返済期間'),
            '35',
        )

        expectDefinitionValue(
            screen.getByRole('article', {
                name: '元利均等返済',
            }),
            '毎月返済額',
            '約84,686円',
        )

        await user.click(autoCalculation)

        expect(
            screen.getByRole('button', {
                name: 'シミュレートする',
            }),
        ).toBeTruthy()
        expect(
            screen.getByText('概算結果'),
        ).toBeTruthy()
        expectDefinitionValue(
            screen.getByRole('article', {
                name: '元利均等返済',
            }),
            '毎月返済額',
            '約84,686円',
        )
    })

    it('changes only the highlighted result when the preferred method changes', async () => {
        render(<MortgageCalculator />)
        const user = await fillValidConditions()
        await user.click(screen.getByRole('button', { name: 'シミュレートする' }))

        const equalPayment = screen.getByRole('article', { name: '元利均等返済' })
        const equalPrincipal = screen.getByRole('article', { name: '元金均等返済' })
        await user.click(screen.getByRole('radio', { name: /元金均等返済/ }))

        expect(equalPayment.getAttribute('data-selected')).toBe('false')
        expect(within(equalPayment).queryByText('選択中')).toBeNull()
        expect(equalPrincipal.getAttribute('data-selected')).toBe('true')
        expect(within(equalPrincipal).getByText('選択中')).toBeTruthy()
        expect(screen.queryByText('前回の概算結果')).toBeNull()
        expect(screen.getByText('概算結果を更新しました。')).toBeTruthy()
    })

    it('returns focus to the loan amount field from the result conditions', async () => {
        render(<MortgageCalculator />)
        const user = await fillValidConditions()
        await user.click(screen.getByRole('button', { name: 'シミュレートする' }))
        await user.click(screen.getByRole('button', { name: '入力条件を確認・変更する' }))
        expect(document.activeElement).toBe(screen.getByLabelText('借入金額'))
    })

    it('restores the previous input, preferred method, calculation mode, and result once after reset', async () => {
        render(<MortgageCalculator />)

        const user = await fillValidConditions()

        await user.click(
            screen.getByRole('radio', {
                name: /元金均等返済/,
            }),
        )
        await user.click(
            screen.getByRole('checkbox', {
                name: '入力と同時に計算結果を更新する',
            }),
        )

        await user.click(
            screen.getByRole('button', {
                name: '入力内容をリセット',
            }),
        )

        expect(
            (screen.getByLabelText(
                '借入金額',
            ) as HTMLInputElement).value,
        ).toBe('')
        expect(
            screen
                .getByLabelText('返済期間スライダー')
                .getAttribute('aria-valuetext'),
        ).toBe('未入力')
        expect(
            (screen.getByRole('radio', {
                name: /元利均等返済/,
            }) as HTMLInputElement).checked,
        ).toBe(true)
        expect(
            (screen.getByRole('checkbox', {
                name: '入力と同時に計算結果を更新する',
            }) as HTMLInputElement).checked,
        ).toBe(false)
        const resetUndo = screen.getByRole(
            'group',
            { name: 'リセットの取り消し' },
        )
        expect(
            within(resetUndo).getByText(
                '入力内容をリセットしました。',
            ),
        ).toBeTruthy()
        expect(
            within(resetUndo).queryByText(/10秒/),
        ).toBeNull()

        await user.click(
            within(resetUndo).getByRole('button', {
                name: '元に戻す',
            }),
        )

        expect(
            (screen.getByLabelText(
                '借入金額',
            ) as HTMLInputElement).value,
        ).toBe('30,000,000')
        expect(
            (screen.getByLabelText(
                '年利',
            ) as HTMLInputElement).value,
        ).toBe('1')
        expect(
            (screen.getByLabelText(
                '返済期間',
            ) as HTMLInputElement).value,
        ).toBe('35')
        expect(
            (screen.getByLabelText(
                '返済期間スライダー',
            ) as HTMLInputElement).value,
        ).toBe('35')
        expect(
            (screen.getByRole('radio', {
                name: /元金均等返済/,
            }) as HTMLInputElement).checked,
        ).toBe(true)
        expect(
            (screen.getByRole('checkbox', {
                name: '入力と同時に計算結果を更新する',
            }) as HTMLInputElement).checked,
        ).toBe(true)
        expect(
            screen.getByText(
                'リセット前の入力内容を元に戻しました。',
            ),
        ).toBeTruthy()
        expect(
            screen.queryByRole('button', {
                name: '元に戻す',
            }),
        ).toBeNull()
        expect(
            screen
                .getByRole('article', {
                    name: '元金均等返済',
                })
                .getAttribute('data-selected'),
        ).toBe('true')
        expect(document.activeElement).toBe(
            screen.getByLabelText('借入金額'),
        )
    })

    it('keeps the reset undo available without a time limit', () => {
        vi.useFakeTimers()

        render(<MortgageCalculator />)

        fireEvent.change(
            screen.getByLabelText('借入金額'),
            {
                target: { value: '30000000' },
            },
        )
        fireEvent.click(
            screen.getByRole('button', {
                name: '入力内容をリセット',
            }),
        )

        act(() => {
            vi.advanceTimersByTime(60_000)
        })

        expect(
            screen.getByRole('button', {
                name: '元に戻す',
            }),
        ).toBeTruthy()
    })

    it('does not offer undo when reset is used with no input', async () => {
        const user = userEvent.setup()

        render(<MortgageCalculator />)

        await user.click(
            screen.getByRole('button', {
                name: '入力内容をリセット',
            }),
        )

        expect(
            screen.queryByRole('button', {
                name: '元に戻す',
            }),
        ).toBeNull()
        expect(document.activeElement).toBe(
            screen.getByLabelText('借入金額'),
        )
    })

    it('explains that the loan amount range is a simulator limit, not a lending condition', () => {
        render(<MortgageCalculator />)

        const help = document.getElementById(
            'mortgage-loan-amount-help',
        )

        expect(help?.textContent).toContain(
            '本シミュレーター上の計算範囲',
        )
        expect(help?.textContent).toContain(
            '金融機関の融資条件や審査基準',
        )
    })

    it('limits live announcements to the compact status region', () => {
        const { container } = render(
            <MortgageCalculator />,
        )

        expect(
            container.querySelectorAll('[aria-live]'),
        ).toHaveLength(1)
        expect(
            container
                .querySelector('.mortgage-results')
                ?.hasAttribute('aria-live'),
        ).toBe(false)
    })
})
