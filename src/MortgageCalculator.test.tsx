// @vitest-environment jsdom

import {
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

describe('MortgageCalculator', () => {
    afterEach(() => {
        cleanup()
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
        expect(equalPayment.getAttribute('data-selected')).toBe('true')
    })

    it('submits through the form, supporting Enter-key form behavior', async () => {
        const { container } = render(
            <MortgageCalculator />,
        )

        await fillValidConditions()

        const form = container.querySelector('form')

        expect(form).not.toBeNull()

        fireEvent.submit(form!)

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

    it('marks a previous manual result as stale after conditions change', async () => {
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

        expect(
            screen.getByText(
                '条件が変更されました。再計算してください。前回の結果を表示しています。',
            ),
        ).toBeTruthy()
        expect(
            screen.getByText('前回の概算結果'),
        ).toBeTruthy()
        expectDefinitionValue(
            screen.getByRole('article', {
                name: '元利均等返済',
            }),
            '毎月返済額',
            '約84,686円',
        )
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
        expect(equalPrincipal.getAttribute('data-selected')).toBe('true')
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
