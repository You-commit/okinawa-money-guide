import { describe, expect, it } from 'vitest'
import {
    calculateMortgageComparison,
    type MortgageInput,
} from './mortgage'
import {
    createMortgageConsultationSummary,
    MORTGAGE_MODEL_DISPLAY_NAME,
    MORTGAGE_SPEC_VERSION,
} from './mortgageConsultationSummary'

const calculateComparison = (input: MortgageInput) => {
    const result = calculateMortgageComparison(input)

    if (!result.ok) {
        throw new Error(
            `Expected a successful comparison, received ${result.error}`,
        )
    }

    return result.comparison
}

describe('mortgage consultation summary', () => {
    const calculatedAt = '2026-09-01T03:34:56.000Z'

    it('creates a plain-text consultation summary from the calculated comparison', () => {
        const summary = createMortgageConsultationSummary({
            comparison: calculateComparison({
                principal: 30_000_000,
                annualRate: 1,
                paymentCount: 420,
            }),
            repaymentMethod: 'equal-principal',
            calculatedAt,
        })

        expect(summary).toContain(
            '住宅ローンシミュレーター 相談用サマリー',
        )
        expect(summary).toContain('借入金額: 30,000,000円')
        expect(summary).toContain('年利: 1%')
        expect(summary).toContain('返済期間: 35年')
        expect(summary).toContain('返済回数: 420回')
        expect(summary).toContain(
            '強調表示中の返済方式: 元金均等返済',
        )
        expect(summary).toContain(
            '毎月返済額: 約84,686円',
        )
        expect(summary).toContain(
            '初年度年間返済額（概算）: 約1,016,229円',
        )
        expect(summary).toContain(
            '初回返済額: 約96,429円',
        )
        expect(summary).toContain(
            '初年度年間返済額（概算）: 約1,153,214円',
        )
        expect(summary).toContain(
            '初回返済額の差: 約11,743円',
        )
        expect(summary).toContain(
            '支払利息の差: 約305,498円',
        )
        expect(summary).toContain('- 事務手数料')
        expect(summary).toContain('- 団信')
        expect(summary).toContain('- 繰上返済条件')
        expect(summary).toContain(
            '計算日時: 2026/09/01 12:34:56',
        )
        expect(summary).toContain(
            `計算モデル: ${MORTGAGE_MODEL_DISPLAY_NAME}`,
        )
        expect(summary).toContain(
            `仕様版: ${MORTGAGE_SPEC_VERSION}`,
        )
        expect(summary).not.toContain('<')
        expect(summary).not.toContain('http')
        expect(summary).not.toContain('fixed-monthly-v1')
    })

    it('shows zero differences naturally for a zero-interest calculation', () => {
        const summary = createMortgageConsultationSummary({
            comparison: calculateComparison({
                principal: 30_000_000,
                annualRate: 0,
                paymentCount: 420,
            }),
            repaymentMethod: 'equal-payment',
            calculatedAt,
        })

        expect(summary).toContain(
            '初年度年間返済額（概算）: 約857,143円',
        )
        expect(summary).toContain('初回返済額の差: 0円')
        expect(summary).toContain('支払利息の差: 0円')
        expect(summary).not.toMatch(
            /0円(?:高い|低い|多い|少ない)/,
        )
    })
})
