import { describe, expect, it } from 'vitest'
import {
    MORTGAGE_LIMITS,
    MORTGAGE_MODEL_VERSION,
    calculateMortgage,
    createMortgageInputKey,
    formatApproxMortgageYen,
    formatLoanAmountForDisplay,
    normalizeAnnualRateText,
    normalizeLoanAmountText,
    normalizeRepaymentYearsText,
    roundMortgageYen,
    validateMortgageFields,
    type MortgageInput,
    type RepaymentMethod,
} from './mortgage'

const expectSuccessfulCalculation = (
    input: MortgageInput,
    method: RepaymentMethod,
) => {
    const calculation = calculateMortgage(input, method)

    expect(calculation.ok).toBe(true)

    if (!calculation.ok) {
        throw new Error(
            `Expected a successful calculation, received ${calculation.error}`,
        )
    }

    return calculation.result
}

describe('mortgage input normalization', () => {
    it('converts full-width numbers and removes permitted separators', () => {
        expect(
            normalizeLoanAmountText('３０，０００，０００'),
        ).toBe('30000000')
        expect(normalizeAnnualRateText(' １．２３４ ')).toBe(
            '1.234',
        )
        expect(normalizeRepaymentYearsText(' ３５ ')).toBe(
            '35',
        )
    })

    it('does not silently remove signs, letters, percent signs, or suffixes', () => {
        expect(normalizeLoanAmountText('-100')).toBe('-100')
        expect(normalizeLoanAmountText('100円')).toBe('100円')
        expect(normalizeAnnualRateText('1%')).toBe('1%')
        expect(normalizeRepaymentYearsText('三十五')).toBe(
            '三十五',
        )
    })

    it('formats valid loan amounts only after confirmation', () => {
        expect(formatLoanAmountForDisplay('30000000')).toBe(
            '30,000,000',
        )
        expect(formatLoanAmountForDisplay('００１００００００')).toBe(
            '1,000,000',
        )
        expect(formatLoanAmountForDisplay('100円')).toBe('100円')
    })
})

describe('mortgage field validation', () => {
    it.each([
        ['100,000', '0', '1'],
        ['３０，０００，０００', '1.234', '35'],
        ['1,000,000,000', '２０．０００', '５０'],
    ])(
        'accepts loan=%s rate=%s years=%s',
        (loanAmount, annualInterestRate, repaymentYears) => {
            const result = validateMortgageFields({
                loanAmount,
                annualInterestRate,
                repaymentYears,
            })

            expect(result.ok).toBe(true)
        },
    )

    it.each([
        ['', 'LOAN_AMOUNT_REQUIRED'],
        ['-100', 'LOAN_AMOUNT_INVALID_FORMAT'],
        ['abc', 'LOAN_AMOUNT_INVALID_FORMAT'],
        ['100円', 'LOAN_AMOUNT_INVALID_FORMAT'],
        ['99,999', 'LOAN_AMOUNT_OUT_OF_RANGE'],
        ['1,000,000,001', 'LOAN_AMOUNT_OUT_OF_RANGE'],
    ])('rejects loan amount %s', (loanAmount, errorCode) => {
        const result = validateMortgageFields({
            loanAmount,
            annualInterestRate: '1',
            repaymentYears: '35',
        })

        expect(result.ok).toBe(false)

        if (!result.ok) {
            expect(result.errors.loanAmount?.code).toBe(errorCode)
        }
    })

    it.each([
        ['', 'ANNUAL_RATE_REQUIRED'],
        ['1.2345', 'ANNUAL_RATE_INVALID_FORMAT'],
        ['1.2.3', 'ANNUAL_RATE_INVALID_FORMAT'],
        ['-1', 'ANNUAL_RATE_INVALID_FORMAT'],
        ['1%', 'ANNUAL_RATE_INVALID_FORMAT'],
        ['21', 'ANNUAL_RATE_OUT_OF_RANGE'],
    ])('rejects annual rate %s', (annualInterestRate, errorCode) => {
        const result = validateMortgageFields({
            loanAmount: '30,000,000',
            annualInterestRate,
            repaymentYears: '35',
        })

        expect(result.ok).toBe(false)

        if (!result.ok) {
            expect(result.errors.annualInterestRate?.code).toBe(
                errorCode,
            )
        }
    })

    it.each([
        ['', 'REPAYMENT_YEARS_REQUIRED'],
        ['35.5', 'REPAYMENT_YEARS_INVALID_FORMAT'],
        ['-1', 'REPAYMENT_YEARS_INVALID_FORMAT'],
        ['三十五', 'REPAYMENT_YEARS_INVALID_FORMAT'],
        ['0', 'REPAYMENT_YEARS_OUT_OF_RANGE'],
        ['51', 'REPAYMENT_YEARS_OUT_OF_RANGE'],
    ])('rejects repayment years %s', (repaymentYears, errorCode) => {
        const result = validateMortgageFields({
            loanAmount: '30,000,000',
            annualInterestRate: '1',
            repaymentYears,
        })

        expect(result.ok).toBe(false)

        if (!result.ok) {
            expect(result.errors.repaymentYears?.code).toBe(
                errorCode,
            )
        }
    })

    it('returns normalized numeric input on success', () => {
        const result = validateMortgageFields({
            loanAmount: '３０，０００，０００',
            annualInterestRate: '１．０００',
            repaymentYears: '３５',
        })

        expect(result).toEqual({
            ok: true,
            input: {
                principal: 30_000_000,
                annualRate: 1,
                paymentCount: 420,
            },
            errors: {},
        })
    })
})

describe('fixed monthly mortgage model', () => {
    const standardInput: MortgageInput = {
        principal: 30_000_000,
        annualRate: 1,
        paymentCount: 420,
    }

    it('matches the equal-payment reference values', () => {
        const result = expectSuccessfulCalculation(
            standardInput,
            'equal-payment',
        )

        expect(result.firstPayment).toBeCloseTo(
            84_685.70968101347,
            6,
        )
        expect(result.lastPayment).toBeCloseTo(
            84_685.70968101347,
            6,
        )
        expect(roundMortgageYen(result.firstPayment)).toBe(84_686)
        expect(roundMortgageYen(result.totalPayment)).toBe(
            35_567_998,
        )
        expect(roundMortgageYen(result.totalInterest)).toBe(
            5_567_998,
        )
        expect(result.modelVersion).toBe(
            MORTGAGE_MODEL_VERSION,
        )
    })

    it('matches the equal-principal reference values', () => {
        const result = expectSuccessfulCalculation(
            standardInput,
            'equal-principal',
        )

        expect(roundMortgageYen(result.firstPayment)).toBe(96_429)
        expect(roundMortgageYen(result.lastPayment)).toBe(71_488)
        expect(roundMortgageYen(result.totalPayment)).toBe(
            35_262_500,
        )
        expect(roundMortgageYen(result.totalInterest)).toBe(
            5_262_500,
        )
    })

    it.each([
        ['equal-payment' as const, 12],
        ['equal-payment' as const, 600],
        ['equal-principal' as const, 12],
        ['equal-principal' as const, 600],
    ])(
        'handles zero interest for %s and %i payments',
        (method, paymentCount) => {
            const input: MortgageInput = {
                principal: 30_000_000,
                annualRate: 0,
                paymentCount,
            }
            const result = expectSuccessfulCalculation(input, method)

            expect(result.totalInterest).toBe(0)
            expect(result.totalPayment).toBe(input.principal)
            expect(result.firstPayment).toBe(
                input.principal / paymentCount,
            )
            expect(result.lastPayment).toBe(
                input.principal / paymentCount,
            )
        },
    )

    it('keeps the lower boundary finite and above zero when displayed', () => {
        const result = expectSuccessfulCalculation(
            {
                principal: MORTGAGE_LIMITS.principal.min,
                annualRate: 0,
                paymentCount: MORTGAGE_LIMITS.paymentCount.max,
            },
            'equal-payment',
        )

        expect(Number.isFinite(result.firstPayment)).toBe(true)
        expect(roundMortgageYen(result.firstPayment)).toBeGreaterThan(0)
    })

    it('keeps the upper boundary finite and non-negative', () => {
        for (const method of [
            'equal-payment',
            'equal-principal',
        ] as const) {
            const result = expectSuccessfulCalculation(
                {
                    principal: MORTGAGE_LIMITS.principal.max,
                    annualRate: MORTGAGE_LIMITS.annualRate.max,
                    paymentCount: MORTGAGE_LIMITS.paymentCount.max,
                },
                method,
            )

            for (const value of [
                result.firstPayment,
                result.lastPayment,
                result.totalPayment,
                result.totalInterest,
            ]) {
                expect(Number.isFinite(value)).toBe(true)
                expect(value).toBeGreaterThanOrEqual(0)
            }
        }
    })

    it.each([
        'equal-payment' as const,
        'equal-principal' as const,
    ])('preserves total = principal + interest for %s', (method) => {
        const result = expectSuccessfulCalculation(
            standardInput,
            method,
        )

        expect(
            Math.abs(
                result.totalPayment -
                (standardInput.principal + result.totalInterest),
            ),
        ).toBeLessThanOrEqual(1e-6)
    })

    it('does not reduce payment or interest when the rate rises', () => {
        const lowRate = expectSuccessfulCalculation(
            { ...standardInput, annualRate: 0.5 },
            'equal-payment',
        )
        const highRate = expectSuccessfulCalculation(
            { ...standardInput, annualRate: 1.5 },
            'equal-payment',
        )

        expect(highRate.firstPayment).toBeGreaterThanOrEqual(
            lowRate.firstPayment,
        )
        expect(highRate.totalInterest).toBeGreaterThanOrEqual(
            lowRate.totalInterest,
        )
    })

    it('makes the first equal-principal payment larger than the last when rate is positive', () => {
        const result = expectSuccessfulCalculation(
            standardInput,
            'equal-principal',
        )

        expect(result.firstPayment).toBeGreaterThan(
            result.lastPayment,
        )
    })

    it('keeps equal-principal total interest at or below equal-payment interest for a representative case', () => {
        const equalPayment = expectSuccessfulCalculation(
            standardInput,
            'equal-payment',
        )
        const equalPrincipal = expectSuccessfulCalculation(
            standardInput,
            'equal-principal',
        )

        expect(equalPrincipal.totalInterest).toBeLessThanOrEqual(
            equalPayment.totalInterest,
        )
    })
})

describe('calculation error contract', () => {
    it.each([
        [
            {
                principal: Number.NaN,
                annualRate: 1,
                paymentCount: 420,
            },
            'INVALID_PRINCIPAL',
        ],
        [
            {
                principal: 99_999,
                annualRate: 1,
                paymentCount: 420,
            },
            'INVALID_PRINCIPAL',
        ],
        [
            {
                principal: 30_000_000,
                annualRate: Number.POSITIVE_INFINITY,
                paymentCount: 420,
            },
            'INVALID_RATE',
        ],
        [
            {
                principal: 30_000_000,
                annualRate: 1.2345,
                paymentCount: 420,
            },
            'INVALID_RATE',
        ],
        [
            {
                principal: 30_000_000,
                annualRate: 1,
                paymentCount: 0,
            },
            'INVALID_PAYMENT_COUNT',
        ],
        [
            {
                principal: 30_000_000,
                annualRate: 1,
                paymentCount: 420.5,
            },
            'INVALID_PAYMENT_COUNT',
        ],
    ] as const)(
        'returns %s for invalid input',
        (input, expectedError) => {
            const result = calculateMortgage(
                input,
                'equal-payment',
            )

            expect(result).toEqual({
                ok: false,
                error: expectedError,
            })
        },
    )
})

describe('display and snapshot helpers', () => {
    it('rounds and formats displayed yen consistently', () => {
        expect(roundMortgageYen(84_685.709)).toBe(84_686)
        expect(formatApproxMortgageYen(84_685.709)).toBe(
            '約84,686円',
        )
    })

    it('rejects non-finite display values', () => {
        expect(() => roundMortgageYen(Number.NaN)).toThrow(
            RangeError,
        )
        expect(() =>
            roundMortgageYen(Number.POSITIVE_INFINITY),
        ).toThrow(RangeError)
    })

    it('creates a canonical input key including method and model', () => {
        const input: MortgageInput = {
            principal: 30_000_000,
            annualRate: 1,
            paymentCount: 420,
        }

        expect(
            createMortgageInputKey(input, 'equal-payment'),
        ).toBe(
            '30000000|1.000|420|equal-payment|fixed-monthly-v1',
        )
        expect(
            createMortgageInputKey(
                { ...input, annualRate: 1.0 },
                'equal-payment',
            ),
        ).toBe(
            createMortgageInputKey(input, 'equal-payment'),
        )
    })
})
