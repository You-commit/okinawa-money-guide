import type { NisaAllowanceAssessment } from './nisaAllowance'
import {
  roundHalfUp,
  type NisaCalculationMode,
} from './nisaCalculation'
import {
  getNisaScenarioResults,
  type NisaScenarioComparison,
} from './nisaScenarioComparison'

export const NISA_DESIGN_SPEC_VERSION =
  'OMG-DS-NISA-v1.0-20260730' as const

export const NISA_CALCULATION_MODEL_VERSION: string | null = null
export const NISA_CALCULATION_MODEL_NAME =
  'NISA積立シミュレーションモデル' as const
export const NISA_CALCULATION_SPEC_VERSION = NISA_DESIGN_SPEC_VERSION
export const NISA_POLICY_STANDARD = '2026年現行NISA制度' as const
export const NISA_POLICY_REFERENCE_DATE = NISA_POLICY_STANDARD
export const NISA_PRIMARY_SOURCE_REVIEW_DATE = '2026年9月2日' as const

export const NISA_UNCONSIDERED_ITEMS = [
  '商品固有の信託報酬等',
  '売買費用',
  '為替影響',
  '個別税務事情',
  '実際の値動き',
  'NISA枠の実利用残高',
  '売却後の枠再利用',
] as const

export const NISA_CONFIRMATION_ITEMS = [
  '対象商品',
  '商品費用',
  '積立設定',
  '現在の利用可能枠',
  'リスク',
  '解約・売却',
  '売却後の枠再利用',
] as const

export const NISA_PRIMARY_SOURCES = [
  {
    label: '金融庁 NISA特設サイト',
    url: 'https://www.fsa.go.jp/policy/nisa2/',
  },
  {
    label: '金融庁 NISA制度概要',
    url: 'https://www.fsa.go.jp/policy/nisa2/know/index.html',
  },
] as const

export type NisaConsultationInputSnapshot = {
  mode: NisaCalculationMode
  initialInvestment: number | null
  monthlyContribution: number | null
  targetAmount: number | null
  annualRatePercent: number
  inputMonths: number | null
  inflationRatePercent: number | null
  scenarioComparisonEnabled: boolean
  lowScenarioAnnualRatePercent: number | null
  highScenarioAnnualRatePercent: number | null
}

export type NisaConsultationResult = {
  futureValue: number
  principal: number
  gain: number
  monthlyContribution: number
  months: number
  targetAmount: number | null
  inflationAdjustedValue: number | null
  allowance: NisaAllowanceAssessment
  scenarioComparison: NisaScenarioComparison | null
}

export type NisaConsultationRecord = {
  input: NisaConsultationInputSnapshot
  result: NisaConsultationResult
  calculatedAt: string
}

const MODE_LABELS: Record<NisaCalculationMode, string> = {
  'future-value': '将来額を調べる',
  'required-contribution': '必要な毎月積立額を調べる',
  'required-months': '必要な積立期間を調べる',
}

export const formatNisaYen = (value: number) =>
  `${roundHalfUp(value).toLocaleString('ja-JP')}円`

export const formatNisaMonths = (months: number) => {
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  if (years === 0) return `${remainingMonths}か月`
  if (remainingMonths === 0) return `${years}年`
  return `${years}年${remainingMonths}か月`
}

export const formatNisaCalculationDateTime = (calculatedAt: string) =>
  new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(calculatedAt))

export const getNisaModelVersionDisplay = () =>
  NISA_CALCULATION_MODEL_VERSION ?? NISA_CALCULATION_MODEL_NAME

export const getNisaPolicyReferenceDateDisplay = () =>
  NISA_POLICY_REFERENCE_DATE

export const getNisaPrimarySourceReviewDateDisplay = () =>
  NISA_PRIMARY_SOURCE_REVIEW_DATE

export const getNisaPrincipalLabel = (
  input: NisaConsultationInputSnapshot,
) => input.mode === 'future-value' && (input.initialInvestment ?? 0) > 0
  ? '投資元本（初期投資額を含む）'
  : '投資元本'

export const getNisaAllowanceRelation = (
  assessment: NisaAllowanceAssessment,
) => ({
  annualTsumitate:
    assessment.annualStatus === 'within-tsumitate'
      ? 'つみたて投資枠の年間上限120万円以内'
      : 'つみたて投資枠の年間上限120万円を超える',
  annualCombined:
    assessment.annualStatus === 'over-combined'
      ? '年間投資枠合計360万円を超える'
      : '年間投資枠合計360万円以内',
  lifetime:
    assessment.requiresLifetimeLimitReview
      ? '非課税保有限度額1,800万円について確認が必要'
      : '積立元本は1,800万円以内の試算',
})

export const createNisaInputSnapshotText = (
  input: NisaConsultationInputSnapshot,
) => {
  const values = [
    `計算モード=${MODE_LABELS[input.mode]}`,
    input.monthlyContribution === null
      ? null
      : `毎月積立額=${formatNisaYen(input.monthlyContribution)}`,
    input.targetAmount === null
      ? null
      : `目標額=${formatNisaYen(input.targetAmount)}`,
    `想定利回り=${input.annualRatePercent}%`,
    input.inputMonths === null
      ? null
      : `積立期間=${formatNisaMonths(input.inputMonths)}（${input.inputMonths}か月）`,
    input.inflationRatePercent === null
      ? null
      : `想定インフレ率=${input.inflationRatePercent}%`,
    input.mode === 'future-value' && input.initialInvestment !== null
      ? `初期投資額=${formatNisaYen(input.initialInvestment)}`
      : null,
    input.mode === 'future-value'
      ? `シナリオ比較=${input.scenarioComparisonEnabled ? 'ON' : 'OFF'}`
      : null,
    input.mode === 'future-value' && input.scenarioComparisonEnabled
      ? `低位シナリオ利回り=${input.lowScenarioAnnualRatePercent === null ? '未入力' : `${input.lowScenarioAnnualRatePercent}%`}`
      : null,
    input.mode === 'future-value' && input.scenarioComparisonEnabled
      ? `基準シナリオ利回り=${input.annualRatePercent}%`
      : null,
    input.mode === 'future-value' && input.scenarioComparisonEnabled
      ? `高位シナリオ利回り=${input.highScenarioAnnualRatePercent === null ? '未入力' : `${input.highScenarioAnnualRatePercent}%`}`
      : null,
  ].filter((value): value is string => value !== null)

  return values.join('／')
}

const createInputLines = (record: NisaConsultationRecord) => {
  const { input } = record
  const lines = [
    `計算モード: ${MODE_LABELS[input.mode]}`,
    `想定利回り: ${input.annualRatePercent}%`,
  ]

  if (input.monthlyContribution !== null) {
    lines.push(`毎月積立額: ${formatNisaYen(input.monthlyContribution)}`)
  }

  if (input.targetAmount !== null) {
    lines.push(`目標額: ${formatNisaYen(input.targetAmount)}`)
  }

  if (input.inputMonths !== null) {
    lines.push(
      `積立期間: ${formatNisaMonths(input.inputMonths)}（${input.inputMonths.toLocaleString('ja-JP')}か月）`,
    )
  }

  if (input.inflationRatePercent !== null) {
    lines.push(`想定インフレ率: ${input.inflationRatePercent}%`)
  }

  if (
    input.mode === 'future-value' &&
    input.initialInvestment !== null
  ) {
    lines.push(`初期投資額: ${formatNisaYen(input.initialInvestment)}`)
  }

  if (input.mode === 'future-value') {
    lines.push(`シナリオ比較: ${input.scenarioComparisonEnabled ? 'ON' : 'OFF'}`)
  }

  return lines
}

const createScenarioComparisonLines = (
  comparison: NisaScenarioComparison | null,
) => {
  if (comparison === null) return []

  return [
    '',
    '【シナリオ比較】',
    ...getNisaScenarioResults(comparison).flatMap((scenario) => [
      `${scenario.label}:`,
      `  想定利回り: ${scenario.annualRatePercent}%`,
      `  将来資産額: ${formatNisaYen(scenario.futureValue)}`,
      `  運用収益: ${formatNisaYen(scenario.gain)}`,
      scenario.inflationAdjustedValue === null
        ? null
        : `  インフレ調整後価値: ${formatNisaYen(scenario.inflationAdjustedValue)}`,
    ]).filter((value): value is string => value !== null),
  ]
}

const createResultLines = (record: NisaConsultationRecord) => {
  const { input, result } = record
  const principalLabel = getNisaPrincipalLabel(input)

  if (input.mode === 'future-value') {
    return [
      `将来資産額: ${formatNisaYen(result.futureValue)}`,
      `${principalLabel}: ${formatNisaYen(result.principal)}`,
      `運用収益: ${formatNisaYen(result.gain)}`,
      result.inflationAdjustedValue === null
        ? null
        : `インフレ調整後価値: ${formatNisaYen(result.inflationAdjustedValue)}`,
    ].filter((value): value is string => value !== null)
  }

  if (input.mode === 'required-contribution') {
    return [
      `必要な毎月積立額: ${formatNisaYen(result.monthlyContribution)}`,
      `年間換算額: ${formatNisaYen(result.allowance.annualContribution)}`,
      `${principalLabel}: ${formatNisaYen(result.principal)}`,
      `目標額: ${formatNisaYen(result.targetAmount ?? 0)}`,
    ]
  }

  return [
    `必要期間: ${formatNisaMonths(result.months)}`,
    `必要月数: ${result.months.toLocaleString('ja-JP')}か月`,
    `毎月積立額: ${formatNisaYen(result.monthlyContribution)}`,
    `${principalLabel}: ${formatNisaYen(result.principal)}`,
    `目標額: ${formatNisaYen(result.targetAmount ?? 0)}`,
  ]
}

export const createNisaConsultationSummaryText = (
  record: NisaConsultationRecord,
) => {
  const allowanceRelation = getNisaAllowanceRelation(record.result.allowance)
  const bulletLines = (items: readonly string[]) =>
    items.map((item) => `- ${item}`).join('\n')

  return [
    '沖縄マネーガイド',
    'NISAシミュレーター 相談用サマリー',
    '',
    '【入力条件】',
    ...createInputLines(record),
    '',
    '【概算結果】',
    ...createResultLines(record),
    ...createScenarioComparisonLines(record.result.scenarioComparison),
    '',
    '【NISA枠との関係】',
    `年間換算額: ${formatNisaYen(record.result.allowance.annualContribution)}`,
    `NISA枠判定対象の積立元本: ${formatNisaYen(record.result.allowance.formalPrincipal)}`,
    `120万円との関係: ${allowanceRelation.annualTsumitate}`,
    `360万円との関係: ${allowanceRelation.annualCombined}`,
    `1,800万円との関係: ${allowanceRelation.lifetime}`,
    '初期投資額はNISA枠判定に含めていません。',
    '成長投資枠へ自動配分していません。実際の利用可能枠は金融機関等でご確認ください。',
    '',
    '【未考慮事項】',
    bulletLines(NISA_UNCONSIDERED_ITEMS),
    '',
    '【金融機関・FPへ確認する項目】',
    bulletLines(NISA_CONFIRMATION_ITEMS),
    '',
    '【一次資料】',
    bulletLines(NISA_PRIMARY_SOURCES.map((source) => `${source.label}: ${source.url}`)),
    '',
    '本サマリーは一定の利回りを仮定した概算です。実際の運用成果や利用可能なNISA枠を保証するものではありません。',
  ].join('\n')
}

export const getNisaModeLabel = (mode: NisaCalculationMode) =>
  MODE_LABELS[mode]
