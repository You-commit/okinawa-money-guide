import {
    formatApproxMortgageYen,
    type MortgageComparison,
    type RepaymentMethod,
} from './mortgage'

export const MORTGAGE_SPEC_VERSION =
    'OMG-DS-MORTGAGE-v1.1' as const

export const MORTGAGE_MODEL_DISPLAY_NAME =
    '固定金利・毎月返済モデル v1' as const

export const MORTGAGE_EXCLUDED_ITEMS = [
    '金融機関ごとの各回返済額の端数処理',
    '初回返済時の日割り計算',
    '最終回返済額の調整',
    '事務手数料',
    '保証料',
    '団体信用生命保険料',
    '登記費用',
    '火災保険料',
    '金利変動による影響',
] as const

export const MORTGAGE_LENDER_CONFIRMATION_ITEMS = [
    '実際の適用金利',
    '各回の端数処理',
    '初回日割り',
    '最終回調整',
    '事務手数料',
    '保証料',
    '登記費用',
    '団信',
    '繰上返済条件',
] as const

const REPAYMENT_METHOD_LABELS: Record<
    RepaymentMethod,
    string
> = {
    'equal-payment': '元利均等返済',
    'equal-principal': '元金均等返済',
}

const formatDifferenceYen = (value: number) => {
    const absoluteDifference = Math.abs(value)

    return Math.round(absoluteDifference) === 0
        ? '0円'
        : formatApproxMortgageYen(absoluteDifference)
}

export const formatMortgageCalculationDateTime = (
    calculatedAt: string,
) => new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
}).format(new Date(calculatedAt))

type MortgageConsultationSummaryInput = {
    comparison: MortgageComparison
    repaymentMethod: RepaymentMethod
    calculatedAt: string
}

export const createMortgageConsultationSummary = ({
    comparison,
    repaymentMethod,
}: MortgageConsultationSummaryInput) => {
    const {
        input,
        equalPayment,
        equalPrincipal,
        differences,
    } = comparison
    const formatResult = formatApproxMortgageYen
    const bulletLines = (items: readonly string[]) =>
        items.map((item) => `- ${item}`).join('\n')

    return [
        '沖縄マネーガイド',
        '住宅ローンシミュレーター 相談用サマリー',
        '',
        '【入力条件】',
        `借入金額: ${input.principal.toLocaleString('ja-JP')}円`,
        `年利: ${input.annualRate.toLocaleString('ja-JP', { maximumFractionDigits: 3 })}%`,
        `返済期間: ${input.paymentCount / 12}年`,
        `返済回数: ${input.paymentCount.toLocaleString('ja-JP')}回`,
        `強調表示中の返済方式: ${REPAYMENT_METHOD_LABELS[repaymentMethod]}`,
        '',
        '【元利均等返済】',
        `毎月返済額: ${formatResult(equalPayment.firstPayment)}`,
        `初年度年間返済額（概算）: ${formatResult(equalPayment.firstYearPaymentTotal)}`,
        `最終回返済額: ${formatResult(equalPayment.lastPayment)}`,
        `総返済額: ${formatResult(equalPayment.totalPayment)}`,
        `支払利息総額: ${formatResult(equalPayment.totalInterest)}`,
        '',
        '【元金均等返済】',
        `初回返済額: ${formatResult(equalPrincipal.firstPayment)}`,
        `初年度年間返済額（概算）: ${formatResult(equalPrincipal.firstYearPaymentTotal)}`,
        `最終回返済額: ${formatResult(equalPrincipal.lastPayment)}`,
        `総返済額: ${formatResult(equalPrincipal.totalPayment)}`,
        `支払利息総額: ${formatResult(equalPrincipal.totalInterest)}`,
        '',
        '【2方式の差額】',
        `初回返済額の差: ${formatDifferenceYen(differences.firstPayment)}`,
        `支払利息の差: ${formatDifferenceYen(differences.totalInterest)}`,
        '',
        '【計算上含まれない費用・条件】',
        bulletLines(MORTGAGE_EXCLUDED_ITEMS),
        '',
        '【金融機関へ確認する項目】',
        bulletLines(MORTGAGE_LENDER_CONFIRMATION_ITEMS),
        '',
        '本サマリーは概算結果です。実際の返済条件は金融機関へご確認ください。',
    ].join('\n')
}
