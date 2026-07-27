export const MORTGAGE_MODEL_VERSION = 'fixed-monthly-v1' as const

export const MORTGAGE_LIMITS = {
    principal: {
        min: 100_000,
        max: 1_000_000_000,
    },
    annualRate: {
        min: 0,
        max: 20,
        maxDecimalPlaces: 3,
    },
    repaymentYears: {
        min: 1,
        max: 50,
    },
    paymentCount: {
        min: 12,
        max: 600,
    },
} as const

export type RepaymentMethod =
    | 'equal-payment'
    | 'equal-principal'

export type MortgageFieldName =
    | 'loanAmount'
    | 'annualInterestRate'
    | 'repaymentYears'

export type MortgageFieldValues = Record<
    MortgageFieldName,
    string
>

export type MortgageFieldErrorCode =
    | 'LOAN_AMOUNT_REQUIRED'
    | 'LOAN_AMOUNT_INVALID_FORMAT'
    | 'LOAN_AMOUNT_OUT_OF_RANGE'
    | 'ANNUAL_RATE_REQUIRED'
    | 'ANNUAL_RATE_INVALID_FORMAT'
    | 'ANNUAL_RATE_OUT_OF_RANGE'
    | 'REPAYMENT_YEARS_REQUIRED'
    | 'REPAYMENT_YEARS_INVALID_FORMAT'
    | 'REPAYMENT_YEARS_OUT_OF_RANGE'

export type MortgageFieldError = {
    code: MortgageFieldErrorCode
    message: string
}

export type MortgageFieldErrors = Partial<
    Record<MortgageFieldName, MortgageFieldError>
>

export type MortgageInput = {
    principal: number
    annualRate: number
    paymentCount: number
}

export type MortgageValidationResult =
    | {
        ok: true
        input: MortgageInput
        errors: {}
    }
    | {
        ok: false
        input: null
        errors: MortgageFieldErrors
    }

export type MortgageCalculationError =
    | 'INVALID_PRINCIPAL'
    | 'INVALID_RATE'
    | 'INVALID_PAYMENT_COUNT'
    | 'NON_FINITE_INTERMEDIATE'
    | 'NON_FINITE_RESULT'

export type RepaymentSummary = {
    method: RepaymentMethod
    firstPayment: number
    lastPayment: number
    totalPayment: number
    totalInterest: number
    paymentCount: number
    modelVersion: typeof MORTGAGE_MODEL_VERSION
}

export type MortgageCalculationResult =
    | {
        ok: true
        result: RepaymentSummary
    }
    | {
        ok: false
        error: MortgageCalculationError
    }

const FULL_WIDTH_NORMALIZATION_FORM = 'NFKC'
const UNSIGNED_INTEGER_PATTERN = /^\d+$/
const ANNUAL_RATE_PATTERN = /^\d+(?:\.\d{1,3})?$/
const DECIMAL_PRECISION_EPSILON = 1e-9

const FIELD_ERROR_MESSAGES: Record<
    MortgageFieldErrorCode,
    string
> = {
    LOAN_AMOUNT_REQUIRED:
        '借入金額を入力してください。',
    LOAN_AMOUNT_INVALID_FORMAT:
        '借入金額は数字だけで入力してください。',
    LOAN_AMOUNT_OUT_OF_RANGE:
        '借入金額は10万円～10億円の整数で入力してください。',
    ANNUAL_RATE_REQUIRED:
        '年利を入力してください。',
    ANNUAL_RATE_INVALID_FORMAT:
        '年利は数字と小数点を使い、小数第3位までで入力してください。',
    ANNUAL_RATE_OUT_OF_RANGE:
        '年利は0～20％で入力してください。',
    REPAYMENT_YEARS_REQUIRED:
        '返済期間を入力してください。',
    REPAYMENT_YEARS_INVALID_FORMAT:
        '返済期間は年単位の整数で入力してください。',
    REPAYMENT_YEARS_OUT_OF_RANGE:
        '返済期間は1～50年で入力してください。',
}

const createFieldError = (
    code: MortgageFieldErrorCode,
): MortgageFieldError => ({
    code,
    message: FIELD_ERROR_MESSAGES[code],
})

export const convertMortgageTextToHalfWidth = (
    value: string,
) => value.normalize(FULL_WIDTH_NORMALIZATION_FORM)

const removePermittedSeparators = (value: string) =>
    value.replace(/,/g, '').replace(/\s/g, '')

export const normalizeLoanAmountText = (
    value: string,
) =>
    removePermittedSeparators(
        convertMortgageTextToHalfWidth(value),
    )

export const normalizeAnnualRateText = (
    value: string,
) =>
    removePermittedSeparators(
        convertMortgageTextToHalfWidth(value),
    )

export const normalizeRepaymentYearsText = (
    value: string,
) =>
    removePermittedSeparators(
        convertMortgageTextToHalfWidth(value),
    )

export const formatLoanAmountForDisplay = (
    value: string,
) => {
    const normalized = normalizeLoanAmountText(value)

    if (!UNSIGNED_INTEGER_PATTERN.test(normalized)) {
        return convertMortgageTextToHalfWidth(value)
    }

    const canonicalDigits =
        normalized.replace(/^0+(?=\d)/, '') || '0'

    return canonicalDigits.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        ',',
    )
}

const hasAtMostThreeDecimalPlaces = (
    value: number,
) => {
    const scaled = value * 1_000

    return (
        Math.abs(scaled - Math.round(scaled)) <=
        DECIMAL_PRECISION_EPSILON
    )
}

const validateLoanAmount = (
    value: string,
): MortgageFieldError | null => {
    const normalized = normalizeLoanAmountText(value)

    if (normalized === '') {
        return createFieldError('LOAN_AMOUNT_REQUIRED')
    }

    if (!UNSIGNED_INTEGER_PATTERN.test(normalized)) {
        return createFieldError(
            'LOAN_AMOUNT_INVALID_FORMAT',
        )
    }

    const principal = Number(normalized)

    if (
        !Number.isSafeInteger(principal) ||
        principal < MORTGAGE_LIMITS.principal.min ||
        principal > MORTGAGE_LIMITS.principal.max
    ) {
        return createFieldError(
            'LOAN_AMOUNT_OUT_OF_RANGE',
        )
    }

    return null
}

const validateAnnualRate = (
    value: string,
): MortgageFieldError | null => {
    const normalized = normalizeAnnualRateText(value)

    if (normalized === '') {
        return createFieldError('ANNUAL_RATE_REQUIRED')
    }

    if (!ANNUAL_RATE_PATTERN.test(normalized)) {
        return createFieldError(
            'ANNUAL_RATE_INVALID_FORMAT',
        )
    }

    const annualRate = Number(normalized)

    if (
        !Number.isFinite(annualRate) ||
        annualRate < MORTGAGE_LIMITS.annualRate.min ||
        annualRate > MORTGAGE_LIMITS.annualRate.max
    ) {
        return createFieldError(
            'ANNUAL_RATE_OUT_OF_RANGE',
        )
    }

    return null
}

const validateRepaymentYears = (
    value: string,
): MortgageFieldError | null => {
    const normalized = normalizeRepaymentYearsText(value)

    if (normalized === '') {
        return createFieldError(
            'REPAYMENT_YEARS_REQUIRED',
        )
    }

    if (!UNSIGNED_INTEGER_PATTERN.test(normalized)) {
        return createFieldError(
            'REPAYMENT_YEARS_INVALID_FORMAT',
        )
    }

    const years = Number(normalized)

    if (
        !Number.isSafeInteger(years) ||
        years < MORTGAGE_LIMITS.repaymentYears.min ||
        years > MORTGAGE_LIMITS.repaymentYears.max
    ) {
        return createFieldError(
            'REPAYMENT_YEARS_OUT_OF_RANGE',
        )
    }

    return null
}

export const validateMortgageFields = (
    values: MortgageFieldValues,
): MortgageValidationResult => {
    const errors: MortgageFieldErrors = {}

    const loanAmountError = validateLoanAmount(
        values.loanAmount,
    )
    const annualRateError = validateAnnualRate(
        values.annualInterestRate,
    )
    const repaymentYearsError =
        validateRepaymentYears(values.repaymentYears)

    if (loanAmountError) {
        errors.loanAmount = loanAmountError
    }

    if (annualRateError) {
        errors.annualInterestRate = annualRateError
    }

    if (repaymentYearsError) {
        errors.repaymentYears = repaymentYearsError
    }

    if (Object.keys(errors).length > 0) {
        return {
            ok: false,
            input: null,
            errors,
        }
    }

    const principal = Number(
        normalizeLoanAmountText(values.loanAmount),
    )
    const annualRate = Number(
        normalizeAnnualRateText(
            values.annualInterestRate,
        ),
    )
    const years = Number(
        normalizeRepaymentYearsText(
            values.repaymentYears,
        ),
    )

    return {
        ok: true,
        input: {
            principal,
            annualRate,
            paymentCount: years * 12,
        },
        errors: {},
    }
}

const validateCalculationInput = (
    input: MortgageInput,
): MortgageCalculationError | null => {
    const { principal, annualRate, paymentCount } = input

    if (
        !Number.isSafeInteger(principal) ||
        principal < MORTGAGE_LIMITS.principal.min ||
        principal > MORTGAGE_LIMITS.principal.max
    ) {
        return 'INVALID_PRINCIPAL'
    }

    if (
        !Number.isFinite(annualRate) ||
        annualRate < MORTGAGE_LIMITS.annualRate.min ||
        annualRate > MORTGAGE_LIMITS.annualRate.max ||
        !hasAtMostThreeDecimalPlaces(annualRate)
    ) {
        return 'INVALID_RATE'
    }

    if (
        !Number.isSafeInteger(paymentCount) ||
        paymentCount < MORTGAGE_LIMITS.paymentCount.min ||
        paymentCount > MORTGAGE_LIMITS.paymentCount.max
    ) {
        return 'INVALID_PAYMENT_COUNT'
    }

    return null
}

const allValuesAreFiniteAndNonNegative = (
    values: number[],
) =>
    values.every(
        (value) => Number.isFinite(value) && value >= 0,
    )

export const calculateMortgage = (
    input: MortgageInput,
    method: RepaymentMethod,
): MortgageCalculationResult => {
    const inputError = validateCalculationInput(input)

    if (inputError) {
        return {
            ok: false,
            error: inputError,
        }
    }

    const { principal, annualRate, paymentCount } = input
    const monthlyRate = annualRate / 100 / 12

    if (!Number.isFinite(monthlyRate)) {
        return {
            ok: false,
            error: 'NON_FINITE_INTERMEDIATE',
        }
    }

    if (method === 'equal-payment') {
        let payment: number

        if (monthlyRate === 0) {
            payment = principal / paymentCount
        } else {
            const compoundFactor = Math.pow(
                1 + monthlyRate,
                paymentCount,
            )
            const denominator = compoundFactor - 1

            if (
                !Number.isFinite(compoundFactor) ||
                !Number.isFinite(denominator) ||
                denominator <= 0
            ) {
                return {
                    ok: false,
                    error: 'NON_FINITE_INTERMEDIATE',
                }
            }

            payment =
                principal *
                ((monthlyRate * compoundFactor) /
                    denominator)
        }

        const totalPayment =
            monthlyRate === 0
                ? principal
                : payment * paymentCount
        const totalInterest =
            monthlyRate === 0
                ? 0
                : totalPayment - principal

        if (
            !allValuesAreFiniteAndNonNegative([
                payment,
                totalPayment,
                totalInterest,
            ])
        ) {
            return {
                ok: false,
                error: 'NON_FINITE_RESULT',
            }
        }

        return {
            ok: true,
            result: {
                method,
                firstPayment: payment,
                lastPayment: payment,
                totalPayment,
                totalInterest,
                paymentCount,
                modelVersion: MORTGAGE_MODEL_VERSION,
            },
        }
    }

    const principalPayment = principal / paymentCount
    const firstPayment =
        principalPayment + principal * monthlyRate
    const lastPayment =
        principalPayment + principalPayment * monthlyRate
    const totalInterest =
        monthlyRate *
        principal *
        ((paymentCount + 1) / 2)
    const totalPayment = principal + totalInterest

    if (
        !allValuesAreFiniteAndNonNegative([
            principalPayment,
            firstPayment,
            lastPayment,
            totalPayment,
            totalInterest,
        ])
    ) {
        return {
            ok: false,
            error: 'NON_FINITE_RESULT',
        }
    }

    return {
        ok: true,
        result: {
            method,
            firstPayment,
            lastPayment,
            totalPayment,
            totalInterest,
            paymentCount,
            modelVersion: MORTGAGE_MODEL_VERSION,
        },
    }
}

export const roundMortgageYen = (value: number) => {
    if (!Number.isFinite(value) || value < 0) {
        throw new RangeError(
            'A mortgage amount must be finite and non-negative.',
        )
    }

    return Math.round(value)
}

export const formatMortgageYen = (value: number) =>
    `${roundMortgageYen(value).toLocaleString('ja-JP')}円`

export const formatApproxMortgageYen = (
    value: number,
) => `約${formatMortgageYen(value)}`

export const createMortgageInputKey = (
    input: MortgageInput,
    method: RepaymentMethod,
) =>
    [
        input.principal,
        input.annualRate.toFixed(
            MORTGAGE_LIMITS.annualRate.maxDecimalPlaces,
        ),
        input.paymentCount,
        method,
        MORTGAGE_MODEL_VERSION,
    ].join('|')
