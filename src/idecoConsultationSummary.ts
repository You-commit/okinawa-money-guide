import {
  roundHalfUp,
  type IdecoCalculationSuccess,
} from './idecoCalculation'
import {
  getIdecoRelatedContributionLabel,
  requiresIdecoRelatedContribution,
  type IdecoCalculationMode,
  type IdecoParticipantCategory,
} from './idecoRules'

export const IDECO_UNCONSIDERED_ITEMS = [
  '所得税・住民税の税額控除、人的控除、均等割などの個別事情',
  '加入時・掛金納付時・運営管理機関・信託銀行・商品・給付時の手数料',
  '運用商品の値動き、運用益および元本割れの可能性',
  '受取方法に応じた退職所得控除・公的年金等控除と受取時の税金',
  '将来の制度・税制・掛金・所得・税率の変更',
] as const

export const IDECO_CONFIRMATION_ITEMS = [
  '現在の加入資格と加入可能年齢',
  '加入区分と実際の月額掛金上限',
  '勤務先の企業年金・事業主掛金・マッチング拠出の状況',
  '国民年金基金・付加保険料・保険料免除等との関係',
  '金融機関・運営管理機関・商品ごとの手数料',
  '選択する運用商品のリスクと費用',
  '受給開始可能年齢、受取方法および受取時の税金',
] as const

export const IDECO_PRIMARY_SOURCES = [
  {
    label: 'iDeCo公式 加入資格・掛金・受取方法等',
    url: 'https://www.ideco-koushiki.jp/guide/structure.html',
  },
  {
    label: '厚生労働省 2025年の制度改正',
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/nenkin/nenkin/kyoshutsu/2025kaisei.html',
  },
  {
    label: '国税庁 所得税の税率',
    url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm',
  },
  {
    label: '国税庁 防衛特別所得税及び復興特別所得税Q&A',
    url: 'https://www.nta.go.jp/publication/pamph/pdf/0026005-024_03.pdf',
  },
] as const

export type IdecoConsultationInputSnapshot = {
  calculationMode: IdecoCalculationMode
  effectiveDate: string
  currentAge: number
  participantCategory: IdecoParticipantCategory
  relatedMonthlyContribution: number | null
  monthlyContribution: number
  actualContributionMonths: number
  incomeTaxRate: number | null
  taxableIncomeBeforeContribution: number | null
  residentTaxRate: number
  referenceYears: number
}

export type IdecoConsultationRecord = {
  input: IdecoConsultationInputSnapshot
  calculation: IdecoCalculationSuccess
}

export const getIdecoCalculationModeLabel = (
  mode: IdecoCalculationMode,
) => mode === 'simple' ? '簡易税率モード' : '詳細課税所得モード'

export const formatIdecoYen = (value: number) =>
  `${roundHalfUp(value).toLocaleString('ja-JP')}円`

export const getIdecoEligibilitySummary = (
  record: IdecoConsultationRecord,
) => {
  const { input } = record

  if (
    input.participantCategory === 'category5' &&
    input.currentAge >= 60
  ) {
    return '第5号加入者の基本年齢範囲内です。加入歴、年金受給状況等の要件は公式窓口で確認が必要です。'
  }

  return '入力した制度・加入区分の基本年齢範囲内です。年齢だけでは加入可否や受給開始年齢を確定できません。'
}

const createInputLines = (record: IdecoConsultationRecord) => {
  const { input, calculation } = record
  const lines = [
    `計算モード: ${getIdecoCalculationModeLabel(input.calculationMode)}`,
    `計算基準日: ${input.effectiveDate}`,
    `適用制度: ${calculation.regimeLabel}`,
    `現在の年齢: ${input.currentAge}歳`,
    `年齢確認: ${getIdecoEligibilitySummary(record)}`,
    `加入区分: ${calculation.participantLabel}`,
    `毎月の掛金: ${formatIdecoYen(input.monthlyContribution)}`,
    `今年の掛金拠出月数: ${input.actualContributionMonths}か月`,
    `年間掛金: ${formatIdecoYen(calculation.result.rounded.annualContribution)}`,
  ]

  if (requiresIdecoRelatedContribution(input.participantCategory)) {
    lines.push(
      `${getIdecoRelatedContributionLabel(input.participantCategory)}: ${formatIdecoYen(input.relatedMonthlyContribution ?? 0)}`,
    )
  }

  if (input.calculationMode === 'simple') {
    lines.push(`所得税率: ${input.incomeTaxRate}%`)
  } else {
    lines.push(
      `掛金控除前の課税所得: ${formatIdecoYen(input.taxableIncomeBeforeContribution ?? 0)}`,
    )
  }

  lines.push(
    `住民税所得割率: ${input.residentTaxRate}%`,
    `長期試算期間: ${input.referenceYears}年`,
  )

  return lines
}

const createResultLines = (record: IdecoConsultationRecord) => {
  const { calculation } = record
  const { rounded, detailedTax } = calculation.result
  const lines = [
    `年間所得税軽減額: ${formatIdecoYen(rounded.incomeTaxSaving)}`,
    `年間住民税軽減額: ${formatIdecoYen(rounded.residentTaxSaving)}`,
    `年間節税効果: ${formatIdecoYen(rounded.annualTaxSaving)}`,
    `年間掛金: ${formatIdecoYen(rounded.annualContribution)}`,
    `掛金累計: ${formatIdecoYen(rounded.totalContribution)}`,
    `期間中の節税額合計: ${formatIdecoYen(rounded.totalTaxSaving)}`,
  ]

  if (detailedTax) {
    lines.push(
      `控除前課税所得: ${formatIdecoYen(detailedTax.taxableIncomeBeforeContribution)}`,
      `iDeCo所得控除額: ${formatIdecoYen(detailedTax.idecoIncomeDeduction)}`,
      `控除後課税所得: ${formatIdecoYen(detailedTax.taxableIncomeAfterContribution)}`,
    )
  }

  return lines
}

export const createIdecoConsultationSummaryText = (
  record: IdecoConsultationRecord,
) => {
  const { input, calculation } = record
  const bulletLines = (items: readonly string[]) =>
    items.map((item) => `- ${item}`)
  const relatedCondition = requiresIdecoRelatedContribution(
    input.participantCategory,
  )
    ? `${getIdecoRelatedContributionLabel(input.participantCategory)}との合算を反映`
    : 'この加入区分では合算対象額の入力なし'

  return [
    '沖縄マネーガイド',
    'iDeCo節税シミュレーター 相談用サマリー',
    '',
    '【入力条件】',
    ...createInputLines(record),
    '',
    '【概算結果】',
    ...createResultLines(record),
    '',
    '【制度条件】',
    `適用した制度基準: ${calculation.regimeLabel}`,
    `加入区分: ${calculation.participantLabel}`,
    `適用月額上限: ${formatIdecoYen(calculation.contributionLimit.monthlyLimit)}`,
    `合算条件: ${relatedCondition}`,
    '',
    '【未考慮事項】',
    ...bulletLines(IDECO_UNCONSIDERED_ITEMS),
    '',
    '【金融機関・勤務先・年金事務所・税務専門家へ確認する項目】',
    ...bulletLines(IDECO_CONFIRMATION_ITEMS),
    '',
    '【一次資料】',
    ...bulletLines(
      IDECO_PRIMARY_SOURCES.map(
        (source) => `${source.label}: ${source.url}`,
      ),
    ),
    '',
    '本サマリーは相談時の条件整理を目的とした概算資料であり、申込書・税務証明ではありません。加入可否、正式な税額、運用成果、受取額を確定または保証するものではありません。',
  ].join('\n')
}
