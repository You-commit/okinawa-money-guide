import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import './MortgageCalculator.css'
import MoneyInput from './components/form/MoneyInput'
import { navigateToSimulationResult } from './utils/simulationResultNavigation'
import {
  createMortgageConsultationSummary,
  MORTGAGE_EXCLUDED_ITEMS,
  MORTGAGE_LENDER_CONFIRMATION_ITEMS,
} from './mortgageConsultationSummary'
import {
  calculateMortgageComparison,
  calculateMortgageTrajectory,
  createMortgageComparisonExplanation,
  createMortgageComparisonInputKey,
  formatApproxMortgageYen,
  formatLoanAmountForDisplay,
  MORTGAGE_LIMITS,
  normalizeAnnualRateText,
  normalizeRepaymentYearsText,
  validateMortgageFields,
  type MortgageCalculationError,
  type MortgageFieldErrors,
  type MortgageFieldName,
  type MortgageFieldValues,
  type MortgageComparison,
  type MortgageInput,
  type MortgageTrajectoryPoint,
  type RepaymentMethod,
} from './mortgage'
import {
  affiliatePrograms,
  isAffiliateVisualPreviewEnabled,
} from './affiliate/affiliateConfig'
import AffiliateCard from './components/affiliate/AffiliateCard'
import AffiliatePreviewCard from './components/affiliate/AffiliatePreviewCard'

type TouchedFields = Record<MortgageFieldName, boolean>

type StoredCalculation = {
  input: MortgageInput
  inputKey: string
  comparison: MortgageComparison
  calculatedAt: string
}

type ResetSnapshot = {
  values: MortgageFieldValues
  touchedFields: TouchedFields
  repaymentMethod: RepaymentMethod
  isAutoCalculation: boolean
  hasSubmitted: boolean
  manualCalculation: StoredCalculation | null
  isManualCalculationInvalidated: boolean
  manualCalculationError: MortgageCalculationError | null
}

type CalculatorViewState =
  | 'idle'
  | 'incomplete'
  | 'invalid'
  | 'ready'
  | 'calculated'
  | 'calculation-error'

type MortgageTrajectoryChartProps = {
  title: string
  tone: 'blue' | 'green'
  points: MortgageTrajectoryPoint[]
  paymentCount: number
  scaleMax: number
}

const formatMortgageChartYen = (value: number) =>
  `${Math.round(value / 10_000).toLocaleString('ja-JP')}万円`

const formatMortgageChartBarYen = (value: number) =>
  `${Math.round(value / 10_000).toLocaleString('ja-JP')}万`

const formatMortgageChartBarMobileYen = (value: number) =>
  Math.round(value / 10_000).toLocaleString('ja-JP')

const formatMortgageDifferenceMobileYen = (value: number) => {
  if (Math.round(value) === 0) {
    return '0'
  }

  const sign = value > 0 ? '+' : '−'
  const absoluteValue = Math.abs(value)
  const manYen = absoluteValue / 10_000
  const formatted =
    manYen < 10
      ? manYen.toLocaleString('ja-JP', {
          maximumFractionDigits: 1,
          minimumFractionDigits: 1,
        })
      : Math.round(manYen).toLocaleString('ja-JP')

  return `${sign}${formatted}万`
}

const createMortgageTrajectoryAxisMax = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return 10_000
  }

  const targetStep = value / 4
  const magnitude = 10 ** Math.floor(Math.log10(targetStep))
  const normalized = targetStep / magnitude
  const stepFactor =
    normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 2.5
          ? 2.5
          : normalized <= 5
            ? 5
            : 10
  const step = stepFactor * magnitude

  return Math.ceil(value / step) * step
}

const formatMortgageDifferenceYen = (value: number) => {
  const absoluteDifference = Math.abs(value)

  return Math.round(absoluteDifference) === 0
    ? '0円'
    : formatApproxMortgageYen(absoluteDifference)
}

const formatMortgageDifferenceAxisYen = (value: number) => {
  if (Math.round(value) === 0) {
    return '0円'
  }

  const sign = value > 0 ? '+' : '−'
  const absoluteValue = Math.abs(value)

  return absoluteValue >= 10_000
    ? `${sign}${Math.round(absoluteValue / 10_000).toLocaleString('ja-JP')}万円`
    : `${sign}${Math.round(absoluteValue).toLocaleString('ja-JP')}円`
}

const formatMortgageTermMonth = (paymentNumber: number) => {
  const years = Math.floor(paymentNumber / 12)
  const months = paymentNumber % 12

  if (months === 0) {
    return `${years}年目`
  }

  return `${years}年${months}か月目`
}

const createMortgageDifferenceAxisMax = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return 1
  }

  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = magnitude / 5

  return Math.ceil(value / step) * step
}

function MortgageTrajectoryChart({
  title,
  tone,
  points,
  paymentCount,
  scaleMax,
}: MortgageTrajectoryChartProps) {
  const finalPoint = points.find(
    (point) => point.paymentNumber === paymentCount,
  )
  const finalTotal = finalPoint
    ? finalPoint.cumulativePrincipal + finalPoint.cumulativeInterest
    : 0
  const axisValues = [
    scaleMax,
    scaleMax * 0.75,
    scaleMax * 0.5,
    scaleMax * 0.25,
    0,
  ]

  return (
    <article
      className="mortgage-trajectory-card"
      data-tone={tone}
    >
      <header>
        <h4>{title}</h4>
        <span>
          <i className="mortgage-trajectory-legend__principal" />
          元金
          <i className="mortgage-trajectory-legend__interest" />
          利息
        </span>
        <strong className="mortgage-trajectory-card__total">
          完済時 {formatMortgageChartYen(finalTotal)}
        </strong>
      </header>
      <div className="mortgage-trajectory-frame">
        <div className="mortgage-trajectory__axis" aria-hidden="true">
          {axisValues.map((value) => (
            <span
              data-mobile-label={Math.round(value / 10_000).toLocaleString('ja-JP')}
              key={value}
            >
              {formatMortgageChartYen(value)}
            </span>
          ))}
        </div>
        <div
          className="mortgage-trajectory"
          aria-label={`${title}の元金と利息の累計推移`}
        >
          <div className="mortgage-trajectory__gridlines" aria-hidden="true">
            {axisValues.map((value) => (
              <i key={value} />
            ))}
          </div>
          {points.map((point, index) => {
          const total =
            point.cumulativePrincipal +
            point.cumulativeInterest
          const totalHeight = total / scaleMax * 100
          const interestRatio =
            total > 0
              ? point.cumulativeInterest / total * 100
              : 0

          return (
            <div
              className="mortgage-trajectory__point"
              data-mobile-label-row={index % 2 === 0 ? 'high' : 'low'}
              key={point.paymentNumber}
            >
              <span
                className="mortgage-trajectory__value"
                data-mobile-label={formatMortgageChartBarMobileYen(total)}
              >
                {formatMortgageChartBarYen(total)}
              </span>
              <div className="mortgage-trajectory__plot">
                <i style={{ height: `${totalHeight}%` }}>
                  <b style={{ height: `${interestRatio}%` }} />
                </i>
              </div>
              <small>
                {point.paymentNumber === 0
                  ? '開始'
                  : point.paymentNumber === paymentCount
                    ? '完済'
                    : `${Math.round(point.paymentNumber / 12)}年`}
              </small>
            </div>
          )
          })}
        </div>
      </div>
    </article>
  )
}

type MortgageTrajectoryDifferencePoint = {
  paymentNumber: number
  label: string
  difference: number
}

type MortgageTrajectoryDifferenceSummary = {
  axisMax: number
  maxPositiveDifference: number
  maxPositiveMonth: number | null
  crossoverMonth: number | null
  finalDifference: number
  paymentCount: number
}

function MortgageTrajectoryDifferenceChart({
  points,
  summary,
}: {
  points: MortgageTrajectoryDifferencePoint[]
  summary: MortgageTrajectoryDifferenceSummary
}) {
  const crossoverIndex = summary.crossoverMonth === null
    ? -1
    : points.findIndex(
        (point) => point.paymentNumber === summary.crossoverMonth,
      )
  const crossoverPosition = crossoverIndex < 0
    ? null
    : ((crossoverIndex + 0.5) / points.length) * 100
  const maxPositiveLabel =
    summary.maxPositiveDifference > 0 &&
    summary.maxPositiveMonth !== null
      ? `+${formatMortgageDifferenceYen(summary.maxPositiveDifference)}`
      : '0円'
  const finalDifferenceLabel =
    Math.round(summary.finalDifference) === 0
      ? '0円'
      : `${summary.finalDifference > 0 ? '+' : '−'}${formatMortgageDifferenceYen(summary.finalDifference)}`
  const axisValues = [
    summary.axisMax,
    summary.axisMax / 2,
    0,
    -summary.axisMax / 2,
    -summary.axisMax,
  ]
  const displayedPeakPoint = points.reduce(
    (currentMax, point) =>
      point.difference > currentMax.difference ? point : currentMax,
    points[0],
  )
  const lastPositiveBeforeCrossover = summary.crossoverMonth === null
    ? null
    : [...points]
        .reverse()
        .find(
          (point) =>
            point.paymentNumber < summary.crossoverMonth! &&
            point.difference > 0,
        ) ?? null
  const firstNegativePoint = points.find((point) => point.difference < 0) ?? null
  const nextNegativePoint = firstNegativePoint
    ? points.find(
        (point) =>
          point.paymentNumber > firstNegativePoint.paymentNumber &&
          point.difference < 0 &&
          point.paymentNumber < summary.paymentCount,
      ) ?? null
    : null

  return (
    <article
      className="mortgage-trajectory-difference"
      aria-labelledby="mortgage-trajectory-difference-title"
    >
      <header>
        <div>
          <p>DIFFERENCE</p>
          <h5 id="mortgage-trajectory-difference-title">2方式の累計返済額の差</h5>
        </div>
        <span className="mortgage-trajectory-difference__meaning">
          <b data-tone="higher">＋ 元金均等の累計支払額が多い</b>
          <b data-tone="lower">− 元金均等の累計支払額が少ない</b>
        </span>
      </header>

      <div className="mortgage-trajectory-difference__summary">
        <div>
          <span>最大差（元金均等の方が多い）</span>
          <strong>{maxPositiveLabel}</strong>
          <small>
            {summary.maxPositiveMonth === null
              ? '差なし'
              : `${formatMortgageTermMonth(summary.maxPositiveMonth)}時点`}
          </small>
        </div>
        <div>
          <span>元金均等の方が少なくなる時期</span>
          <strong>
            {summary.crossoverMonth === null
              ? '期間内になし'
              : formatMortgageTermMonth(summary.crossoverMonth)}
          </strong>
          <small>
            {summary.crossoverMonth === null
              ? '返済期間中は元金均等の累計支払額が下回りません'
              : 'この月から元金均等の累計支払額が元利均等を下回ります'}
          </small>
        </div>
        <div>
          <span>完済時差額</span>
          <strong>{finalDifferenceLabel}</strong>
          <small>
            {summary.finalDifference < 0
              ? '元金均等の累計支払額が少ない'
              : summary.finalDifference > 0
                ? '元金均等の累計支払額が多い'
                : '2方式の累計支払額は同じ'}
          </small>
        </div>
      </div>

      <div
        className="mortgage-trajectory-difference__visual"
        aria-label="元金均等返済と元利均等返済の累計返済額の差額推移"
        data-mobile-crossover-label={summary.crossoverMonth === null
          ? '期間内のマイナス転換なし'
          : `${formatMortgageTermMonth(summary.crossoverMonth)}からマイナス（破線）`}
        data-mobile-axis-layout={summary.crossoverMonth !== null && summary.crossoverMonth % 12 !== 0
          ? 'months'
          : 'years'}
      >
        <div className="mortgage-trajectory-difference__axis" aria-hidden="true">
          {axisValues.map((value) => (
            <span key={value}>{formatMortgageDifferenceAxisYen(value)}</span>
          ))}
        </div>

        <div className="mortgage-trajectory-difference__chart">
          <div className="mortgage-trajectory-difference__gridlines" aria-hidden="true">
            {axisValues.map((value, index) => (
              <i
                className={index === 2 ? 'is-zero' : undefined}
                key={value}
              />
            ))}
          </div>

          {crossoverPosition !== null && (
            <div
              className="mortgage-trajectory-difference__crossover"
              style={{ left: `${crossoverPosition}%` }}
              aria-label={`元金均等返済の累計支払額が少なくなる時期: ${formatMortgageTermMonth(summary.crossoverMonth!)}`}
            >
              <i aria-hidden="true" />
            </div>
          )}

          <div
            className="mortgage-trajectory-difference__columns"
            style={{
              gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))`,
            }}
          >
            {points.map((point) => {
              const magnitude = Math.min(
                1,
                Math.abs(point.difference) / summary.axisMax,
              )
              const direction =
                point.difference > 0
                  ? 'higher'
                  : point.difference < 0
                    ? 'lower'
                    : 'same'
              const isMobileValueKey =
                point.paymentNumber === displayedPeakPoint.paymentNumber ||
                point.paymentNumber === firstNegativePoint?.paymentNumber ||
                point.paymentNumber === summary.paymentCount
              const isMobileAxisKey =
                point.paymentNumber === 0 ||
                point.paymentNumber === displayedPeakPoint.paymentNumber ||
                point.paymentNumber === lastPositiveBeforeCrossover?.paymentNumber ||
                point.paymentNumber === firstNegativePoint?.paymentNumber ||
                point.paymentNumber === nextNegativePoint?.paymentNumber ||
                point.paymentNumber === summary.paymentCount

              return (
                <div
                  className="mortgage-trajectory-difference__point"
                  data-direction={direction}
                  data-mobile-value={isMobileValueKey ? 'show' : 'hide'}
                  data-mobile-axis={isMobileAxisKey ? 'show' : 'hide'}
                  key={point.paymentNumber}
                >
                  <span
                    className="mortgage-trajectory-difference__value"
                    data-mobile-label={formatMortgageDifferenceMobileYen(point.difference)}
                  >
                    {formatMortgageDifferenceAxisYen(point.difference)}
                  </span>
                  <div className="mortgage-trajectory-difference__plot" aria-hidden="true">
                    <i style={{ height: `${magnitude * 50}%` }} />
                  </div>
                  <small>{point.label}</small>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <p className="mortgage-trajectory-difference__note">
        棒の高さは差額に比例します。元金均等の方が少なくなる時期は、固定月次モデルの毎月の累計返済額から判定しています。
      </p>
    </article>
  )
}

function MortgageEmptyResults() {
  const emptyMethods = [
    { title: '元利均等返済', tone: 'blue' as const },
    { title: '元金均等返済', tone: 'green' as const },
  ]

  return (
    <div className="mortgage-empty-skeleton">
      <div
        className="mortgage-results-overview mortgage-results-overview--empty"
        aria-label="返済方式の比較結果（未計算）"
      >
        {emptyMethods.map((method) => (
          <article
            className="mortgage-comparison-card"
            data-tone={method.tone}
            key={method.title}
          >
            <header className="mortgage-comparison-card__heading">
              <div>
                <p>条件入力後に表示</p>
                <h4>{method.title}</h4>
              </div>
            </header>
            <dl className="mortgage-comparison-card__values">
              {['毎月返済額', '初年度年間返済額（概算）', '最終回返済額', '総返済額', '支払利息総額'].map((label) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>―</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}

        <article className="mortgage-comparison-delta">
          <header>
            <p>COMPARISON</p>
            <h4>2方式の差額</h4>
          </header>
          <dl>
            <div><dt>初回返済額の差</dt><dd>―</dd></div>
            <div><dt>支払利息の差</dt><dd>―</dd></div>
          </dl>
          <p>条件を入力すると、2つの返済方式の差額を表示します。</p>
        </article>
      </div>

      <section className="mortgage-trajectories-section mortgage-trajectories-section--empty">
        <header>
          <div>
            <p>PAYMENT TRAJECTORY</p>
            <h4>累計返済額の推移</h4>
          </div>
          <span>条件入力後に表示</span>
        </header>
        <div className="mortgage-trajectories-grid">
          {emptyMethods.map((method) => (
            <article
              className="mortgage-trajectory-card"
              data-tone={method.tone}
              key={method.title}
            >
              <header>
                <h4>{method.title}</h4>
                <span>元金・利息</span>
              </header>
              <div className="mortgage-trajectory mortgage-trajectory--empty" aria-hidden="true">
                {[12, 24, 36, 48, 60, 72, 84].map((height, index) => (
                  <div className="mortgage-trajectory__point" key={height}>
                    <span />
                    <div className="mortgage-trajectory__plot">
                      <i style={{ height: `${height}%` }}><b /></i>
                    </div>
                    <small>{index === 0 ? '開始' : index === 6 ? '完済' : '―'}</small>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="mortgage-results__condition-heading mortgage-results__condition-heading--compact">
        <strong>入力条件</strong>
        <span>条件入力後に表示</span>
      </div>
      <dl className="mortgage-conditions mortgage-conditions--compact">
        {['借入金額', '年利', '返済期間', '返済回数'].map((label) => (
          <div key={label}><dt>{label}</dt><dd>―</dd></div>
        ))}
      </dl>
    </div>
  )
}

type MortgageConsultationSummaryContentProps = {
  calculation: StoredCalculation
  repaymentMethod: RepaymentMethod
}

function MortgageConsultationSummaryContent({
  calculation,
  repaymentMethod,
}: MortgageConsultationSummaryContentProps) {
  const { comparison, input } = calculation
  const repaymentMethodLabel = repaymentMethod === 'equal-payment'
    ? '元利均等返済'
    : '元金均等返済'

  return (
    <div
      className="mortgage-consultation-summary__content"
      aria-label="相談用サマリー本文"
    >
      <header className="mortgage-consultation-summary__document-heading">
        <p>沖縄マネーガイド</p>
        <h4>住宅ローンシミュレーター 相談用サマリー</h4>
        <span>
          金融機関への相談時に、入力条件と概算結果を確認するための資料です。
        </span>
      </header>

      <section className="mortgage-consultation-summary__section">
        <h5>入力条件</h5>
        <dl>
          <div><dt>借入金額</dt><dd>{input.principal.toLocaleString('ja-JP')}円</dd></div>
          <div><dt>年利</dt><dd>{input.annualRate.toLocaleString('ja-JP', { maximumFractionDigits: 3 })}%</dd></div>
          <div><dt>返済期間</dt><dd>{input.paymentCount / 12}年</dd></div>
          <div><dt>返済回数</dt><dd>{input.paymentCount.toLocaleString('ja-JP')}回</dd></div>
          <div><dt>強調表示中の返済方式</dt><dd>{repaymentMethodLabel}</dd></div>
        </dl>
      </section>

      <section className="mortgage-consultation-summary__section">
        <h5>元利均等返済</h5>
        <dl>
          <div><dt>毎月返済額</dt><dd>{formatApproxMortgageYen(comparison.equalPayment.firstPayment)}</dd></div>
          <div><dt>初年度年間返済額（概算）</dt><dd>{formatApproxMortgageYen(comparison.equalPayment.firstYearPaymentTotal)}</dd></div>
          <div><dt>最終回返済額</dt><dd>{formatApproxMortgageYen(comparison.equalPayment.lastPayment)}</dd></div>
          <div><dt>総返済額</dt><dd>{formatApproxMortgageYen(comparison.equalPayment.totalPayment)}</dd></div>
          <div><dt>支払利息総額</dt><dd>{formatApproxMortgageYen(comparison.equalPayment.totalInterest)}</dd></div>
        </dl>
      </section>

      <section className="mortgage-consultation-summary__section">
        <h5>元金均等返済</h5>
        <dl>
          <div><dt>初回返済額</dt><dd>{formatApproxMortgageYen(comparison.equalPrincipal.firstPayment)}</dd></div>
          <div><dt>初年度年間返済額（概算）</dt><dd>{formatApproxMortgageYen(comparison.equalPrincipal.firstYearPaymentTotal)}</dd></div>
          <div><dt>最終回返済額</dt><dd>{formatApproxMortgageYen(comparison.equalPrincipal.lastPayment)}</dd></div>
          <div><dt>総返済額</dt><dd>{formatApproxMortgageYen(comparison.equalPrincipal.totalPayment)}</dd></div>
          <div><dt>支払利息総額</dt><dd>{formatApproxMortgageYen(comparison.equalPrincipal.totalInterest)}</dd></div>
        </dl>
      </section>

      <section className="mortgage-consultation-summary__section">
        <h5>2方式の差額</h5>
        <dl>
          <div><dt>初回返済額の差</dt><dd>{formatMortgageDifferenceYen(comparison.differences.firstPayment)}</dd></div>
          <div><dt>支払利息の差</dt><dd>{formatMortgageDifferenceYen(comparison.differences.totalInterest)}</dd></div>
        </dl>
      </section>

      <section className="mortgage-consultation-summary__section">
        <h5>計算上含まれない費用・条件</h5>
        <ul>
          {MORTGAGE_EXCLUDED_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mortgage-consultation-summary__section">
        <h5>金融機関へ確認する項目</h5>
        <ul>
          {MORTGAGE_LENDER_CONFIRMATION_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <p className="mortgage-consultation-summary__notice">
        本サマリーは概算結果です。実際の返済条件は金融機関へご確認ください。
      </p>
    </div>
  )
}

const FIELD_NAMES: MortgageFieldName[] = [
  'loanAmount',
  'annualInterestRate',
  'repaymentYears',
]

const FIELD_INPUT_IDS: Record<MortgageFieldName, string> = {
  loanAmount: 'mortgage-loan-amount',
  annualInterestRate: 'mortgage-interest-rate',
  repaymentYears: 'mortgage-repayment-years',
}

const EMPTY_VALUES: MortgageFieldValues = {
  loanAmount: '',
  annualInterestRate: '',
  repaymentYears: '',
}

const EMPTY_TOUCHED_FIELDS: TouchedFields = {
  loanAmount: false,
  annualInterestRate: false,
  repaymentYears: false,
}

const CALCULATION_ERROR_MESSAGE =
  '計算処理中に問題が発生しました。入力内容を確認して、もう一度お試しください。'

const getRepaymentYearsSliderState = (
  value: string,
) => {
  const normalized = normalizeRepaymentYearsText(value)
  const parsed = Number(normalized)
  const isValid =
    /^\d+$/.test(normalized) &&
    parsed >= MORTGAGE_LIMITS.repaymentYears.min &&
    parsed <= MORTGAGE_LIMITS.repaymentYears.max

  if (isValid) {
    return {
      value: String(parsed),
      valueText: `${parsed}年`,
      isEmpty: false,
    }
  }

  return {
    value: String(MORTGAGE_LIMITS.repaymentYears.min),
    valueText: normalized === ''
      ? '未入力'
      : '入力値を確認してください',
    isEmpty: normalized === '',
  }
}

const hasAnyInput = (values: MortgageFieldValues) =>
  FIELD_NAMES.some((fieldName) => values[fieldName] !== '')

const normalizeConfirmedDecimalText = (
  value: string,
  normalizer: (text: string) => string,
) => {
  const normalized = normalizer(value)

  if (normalized.endsWith('.')) {
    return normalized.slice(0, -1)
  }

  return normalized
}

const normalizeFieldForConfirmation = (
  fieldName: MortgageFieldName,
  value: string,
) => {
  switch (fieldName) {
    case 'loanAmount':
      return formatLoanAmountForDisplay(value)
    case 'annualInterestRate':
      return normalizeConfirmedDecimalText(
        value,
        normalizeAnnualRateText,
      )
    case 'repaymentYears':
      return normalizeConfirmedDecimalText(
        value,
        normalizeRepaymentYearsText,
      )
  }
}

const normalizeAllFieldsForConfirmation = (
  values: MortgageFieldValues,
): MortgageFieldValues => ({
  loanAmount: normalizeFieldForConfirmation(
    'loanAmount',
    values.loanAmount,
  ),
  annualInterestRate: normalizeFieldForConfirmation(
    'annualInterestRate',
    values.annualInterestRate,
  ),
  repaymentYears: normalizeFieldForConfirmation(
    'repaymentYears',
    values.repaymentYears,
  ),
})

const createStoredCalculation = (
  input: MortgageInput,
  comparison: MortgageComparison,
): StoredCalculation => ({
  input,
  inputKey: createMortgageComparisonInputKey(input),
  comparison,
  calculatedAt: new Date().toISOString(),
})

const getResultHeading = (hasResult: boolean) => {
  if (hasResult) {
    return '概算結果'
  }

  return 'シミュレーション結果'
}

const getStatusMessage = (
  viewState: CalculatorViewState,
) => {
  switch (viewState) {
    case 'idle':
      return '借入条件を入力してください。'
    case 'incomplete':
      return '入力を続けてください。すべての条件がそろうと計算できます。'
    case 'invalid':
      return '入力内容を確認してください。'
    case 'ready':
      return '入力内容を確認し、シミュレートしてください。'
    case 'calculated':
      return '概算結果を更新しました。'
    case 'calculation-error':
      return CALCULATION_ERROR_MESSAGE
  }
}

const getStatusTone = (
  viewState: CalculatorViewState,
) => {
  switch (viewState) {
    case 'invalid':
    case 'calculation-error':
      return 'error'
    case 'calculated':
      return 'success'
    case 'ready':
      return 'ready'
    default:
      return 'neutral'
  }
}

const getCalculationErrorLabel = (
  error: MortgageCalculationError | null,
) => (error ? CALCULATION_ERROR_MESSAGE : null)

function MortgageCalculator() {
  const [values, setValues] =
    useState<MortgageFieldValues>(EMPTY_VALUES)
  const [touchedFields, setTouchedFields] =
    useState<TouchedFields>(EMPTY_TOUCHED_FIELDS)
  const [repaymentMethod, setRepaymentMethod] =
    useState<RepaymentMethod>('equal-payment')
  const [isAutoCalculation, setIsAutoCalculation] =
    useState(false)
  const [hasSubmitted, setHasSubmitted] =
    useState(false)
  const [manualCalculation, setManualCalculation] =
    useState<StoredCalculation | null>(null)
  const [
    isManualCalculationInvalidated,
    setIsManualCalculationInvalidated,
  ] = useState(false)
  const [
    manualCalculationError,
    setManualCalculationError,
  ] = useState<MortgageCalculationError | null>(null)
  const [resetSnapshot, setResetSnapshot] =
    useState<ResetSnapshot | null>(null)
  const [statusMessageOverride, setStatusMessageOverride] =
    useState<string | null>(null)
  const [summaryActionStatus, setSummaryActionStatus] =
    useState<'copied' | 'copy-error' | null>(null)

  const errorSummaryRef =
    useRef<HTMLDivElement>(null)
  const pendingErrorSummaryFocusRef =
    useRef(false)
  const summaryStatusTimerRef =
    useRef<number | null>(null)
  const copyRequestIdRef =
    useRef(0)
  const loanAmountRef =
    useRef<HTMLInputElement>(null)
  const annualInterestRateRef =
    useRef<HTMLInputElement>(null)
  const repaymentYearsRef =
    useRef<HTMLInputElement>(null)
  const resultsRef =
    useRef<HTMLElement>(null)

  const fieldRefs = {
    loanAmount: loanAmountRef,
    annualInterestRate: annualInterestRateRef,
    repaymentYears: repaymentYearsRef,
  }

  const dismissResetUndo = () => {
    setResetSnapshot(null)
    setStatusMessageOverride(null)
  }

  const validation = useMemo(
    () => validateMortgageFields(values),
    [values],
  )

  const currentInputKey =
    validation.ok
      ? createMortgageComparisonInputKey(
        validation.input,
      )
      : null

  const autoCalculationOutcome = useMemo(() => {
    if (!isAutoCalculation || !validation.ok) {
      return null
    }

    const calculation = calculateMortgageComparison(
      validation.input,
    )

    if (!calculation.ok) {
      return {
        ok: false as const,
        error: calculation.error,
      }
    }

    return {
      ok: true as const,
      stored: createStoredCalculation(
        validation.input,
        calculation.comparison,
      ),
    }
  }, [isAutoCalculation, validation])

  const visibleErrors = useMemo(() => {
    if (validation.ok) {
      return {} as MortgageFieldErrors
    }

    const errors: MortgageFieldErrors = {}

    if (!isAutoCalculation && !hasSubmitted) {
      return errors
    }

    for (const fieldName of FIELD_NAMES) {
      const error = validation.errors[fieldName]

      if (
        error &&
        (!isAutoCalculation || touchedFields[fieldName])
      ) {
        errors[fieldName] = error
      }
    }

    return errors
  }, [
    hasSubmitted,
    isAutoCalculation,
    touchedFields,
    validation,
  ])

  const visibleErrorEntries = FIELD_NAMES.flatMap(
    (fieldName) => {
      const error = visibleErrors[fieldName]

      return error
        ? [{
            fieldName,
            message: error.message,
          }]
        : []
    },
  )

  const hasVisibleErrors =
    visibleErrorEntries.length > 0
  const shouldShowErrorSummary =
    !isAutoCalculation &&
    hasSubmitted &&
    hasVisibleErrors

  useEffect(() => {
    if (
      !shouldShowErrorSummary ||
      !pendingErrorSummaryFocusRef.current
    ) {
      return
    }

    errorSummaryRef.current?.focus()
    pendingErrorSummaryFocusRef.current = false
  }, [shouldShowErrorSummary])

  const activeCalculation =
    isAutoCalculation
      ? autoCalculationOutcome?.ok
        ? autoCalculationOutcome.stored
        : null
      : isManualCalculationInvalidated
        ? null
        : manualCalculation

  const mortgageTrajectories = useMemo(() => {
    if (activeCalculation === null) {
      return null
    }

    const equalPayment = calculateMortgageTrajectory(
      activeCalculation.input,
      'equal-payment',
    )
    const equalPrincipal = calculateMortgageTrajectory(
      activeCalculation.input,
      'equal-principal',
    )

    if (!equalPayment.ok || !equalPrincipal.ok) {
      return null
    }

    const rawScaleMax = Math.max(
      1,
      ...equalPayment.points.map(
        (point) => point.cumulativePrincipal + point.cumulativeInterest,
      ),
      ...equalPrincipal.points.map(
        (point) => point.cumulativePrincipal + point.cumulativeInterest,
      ),
    )
    const scaleMax = createMortgageTrajectoryAxisMax(rawScaleMax)

    const monthlyEqualPayment = calculateMortgageTrajectory(
      activeCalculation.input,
      'equal-payment',
      activeCalculation.input.paymentCount,
    )
    const monthlyEqualPrincipal = calculateMortgageTrajectory(
      activeCalculation.input,
      'equal-principal',
      activeCalculation.input.paymentCount,
    )

    if (!monthlyEqualPayment.ok || !monthlyEqualPrincipal.ok) {
      return null
    }

    const monthlyPrincipalByPaymentNumber = new Map(
      monthlyEqualPrincipal.points.map((point) => [point.paymentNumber, point]),
    )
    const monthlyDifferences = monthlyEqualPayment.points.map((paymentPoint) => {
      const principalPoint = monthlyPrincipalByPaymentNumber.get(
        paymentPoint.paymentNumber,
      )
      const paymentTotal =
        paymentPoint.cumulativePrincipal + paymentPoint.cumulativeInterest
      const principalTotal = principalPoint
        ? principalPoint.cumulativePrincipal + principalPoint.cumulativeInterest
        : paymentTotal

      return {
        paymentNumber: paymentPoint.paymentNumber,
        difference: principalTotal - paymentTotal,
      }
    })

    const maxPositivePoint = monthlyDifferences.reduce(
      (currentMax, point) =>
        point.difference > currentMax.difference ? point : currentMax,
      { paymentNumber: 0, difference: 0 },
    )

    let sawPositiveDifference = false
    let crossoverMonth: number | null = null

    for (const point of monthlyDifferences) {
      if (point.difference > 0) {
        sawPositiveDifference = true
        continue
      }

      if (sawPositiveDifference && point.difference < 0) {
        crossoverMonth = point.paymentNumber
        break
      }
    }

    const maxAbsoluteDifference = Math.max(
      1,
      ...monthlyDifferences.map((point) => Math.abs(point.difference)),
    )
    const finalDifference =
      monthlyDifferences.at(-1)?.difference ?? 0

    const differenceByPaymentNumber = new Map(
      monthlyDifferences.map((point) => [point.paymentNumber, point.difference]),
    )
    const samplePaymentNumbers = new Set(
      equalPayment.points.map((point) => point.paymentNumber),
    )

    if (crossoverMonth !== null) {
      for (const offset of [-24, -12, 0, 12, 24]) {
        samplePaymentNumbers.add(
          Math.min(
            activeCalculation.input.paymentCount,
            Math.max(0, crossoverMonth + offset),
          ),
        )
      }
    }

    const differencePoints = Array.from(samplePaymentNumbers)
      .sort((left, right) => left - right)
      .map((paymentNumber) => ({
        paymentNumber,
        label:
          paymentNumber === 0
            ? '開始'
            : paymentNumber === activeCalculation.input.paymentCount
              ? '完済'
              : paymentNumber % 12 === 0
                ? `${paymentNumber / 12}年`
                : `${Math.floor(paymentNumber / 12)}年${paymentNumber % 12}月`,
        difference: differenceByPaymentNumber.get(paymentNumber) ?? 0,
      }))

    return {
      equalPayment: equalPayment.points,
      equalPrincipal: equalPrincipal.points,
      scaleMax,
      differencePoints,
      differenceSummary: {
        axisMax: createMortgageDifferenceAxisMax(maxAbsoluteDifference),
        maxPositiveDifference: maxPositivePoint.difference,
        maxPositiveMonth:
          maxPositivePoint.difference > 0
            ? maxPositivePoint.paymentNumber
            : null,
        crossoverMonth,
        finalDifference,
        paymentCount: activeCalculation.input.paymentCount,
      },
    }
  }, [activeCalculation])

  const consultationSummary = useMemo(
    () => activeCalculation
      ? createMortgageConsultationSummary({
          comparison: activeCalculation.comparison,
          repaymentMethod,
          calculatedAt: activeCalculation.calculatedAt,
        })
      : null,
    [activeCalculation, repaymentMethod],
  )

  useEffect(() => {
    if (summaryStatusTimerRef.current !== null) {
      window.clearTimeout(summaryStatusTimerRef.current)
      summaryStatusTimerRef.current = null
    }

    copyRequestIdRef.current += 1
    setSummaryActionStatus(null)
  }, [activeCalculation, repaymentMethod])

  useEffect(() => () => {
    copyRequestIdRef.current += 1

    if (summaryStatusTimerRef.current !== null) {
      window.clearTimeout(summaryStatusTimerRef.current)
    }
  }, [])

  const calculationError =
    isAutoCalculation
      ? autoCalculationOutcome &&
        !autoCalculationOutcome.ok
        ? autoCalculationOutcome.error
        : null
      : manualCalculationError

  const viewState: CalculatorViewState = (() => {
    if (!hasAnyInput(values)) {
      return 'idle'
    }

    if (calculationError) {
      return 'calculation-error'
    }

    if (hasVisibleErrors) {
      return 'invalid'
    }

    if (isAutoCalculation) {
      if (
        validation.ok &&
        autoCalculationOutcome?.ok
      ) {
        return 'calculated'
      }

      return 'incomplete'
    }

    if (
      manualCalculation &&
      currentInputKey === manualCalculation.inputKey
    ) {
      return 'calculated'
    }

    if (validation.ok) {
      return 'ready'
    }

    return 'incomplete'
  })()

  const statusMessage =
    statusMessageOverride ??
    getStatusMessage(viewState)

  const updateFieldValue = (
    fieldName: MortgageFieldName,
    value: string,
    clearManualValidation = true,
  ) => {
    dismissResetUndo()

    if (!isAutoCalculation && clearManualValidation) {
      pendingErrorSummaryFocusRef.current = false
      setHasSubmitted(false)
      setTouchedFields(EMPTY_TOUCHED_FIELDS)
      setIsManualCalculationInvalidated(
        (currentInvalidated) =>
          currentInvalidated || manualCalculation !== null,
      )
    }

    setValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }))
    setManualCalculationError(null)
  }

  const handleFieldChange = (
    fieldName: MortgageFieldName,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    updateFieldValue(fieldName, event.target.value)
  }

  const handleFieldBlur = (
    fieldName: MortgageFieldName,
    event: FocusEvent<HTMLInputElement>,
  ) => {
    setTouchedFields((currentTouchedFields) => ({
      ...currentTouchedFields,
      [fieldName]: true,
    }))

    updateFieldValue(
      fieldName,
      normalizeFieldForConfirmation(
        fieldName,
        event.currentTarget.value,
      ),
      false,
    )
  }

  const focusFirstInvalidField = (
    errors: MortgageFieldErrors,
  ) => {
    const firstInvalidField = FIELD_NAMES.find(
      (fieldName) => Boolean(errors[fieldName]),
    )

    if (!firstInvalidField) {
      return
    }

    window.requestAnimationFrame(() => {
      fieldRefs[firstInvalidField].current?.focus()
    })
  }

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    dismissResetUndo()

    const confirmedValues =
      normalizeAllFieldsForConfirmation(values)

    setValues(confirmedValues)

    const confirmedValidation =
      validateMortgageFields(confirmedValues)

    if (isAutoCalculation) {
      if (!confirmedValidation.ok) {
        setTouchedFields({
          loanAmount: true,
          annualInterestRate: true,
          repaymentYears: true,
        })
        focusFirstInvalidField(
          confirmedValidation.errors,
        )
      }

      return
    }

    setHasSubmitted(true)
    setTouchedFields({
      loanAmount: true,
      annualInterestRate: true,
      repaymentYears: true,
    })
    setManualCalculationError(null)

    if (!confirmedValidation.ok) {
      pendingErrorSummaryFocusRef.current = true
      return
    }

    const calculation = calculateMortgageComparison(
      confirmedValidation.input,
    )

    if (!calculation.ok) {
      setManualCalculationError(
        calculation.error,
      )
      return
    }

    setManualCalculation(
      createStoredCalculation(
        confirmedValidation.input,
        calculation.comparison,
      ),
    )
    setIsManualCalculationInvalidated(false)
    navigateToSimulationResult(resultsRef.current)
  }

  const handleFormKeyDown = (
    event: KeyboardEvent<HTMLFormElement>,
  ) => {
    if (
      event.key === 'Enter' &&
      event.target instanceof HTMLInputElement
    ) {
      event.preventDefault()
    }
  }

  const handleRepaymentMethodChange = (
    method: RepaymentMethod,
  ) => {
    dismissResetUndo()
    setRepaymentMethod(method)
  }

  const handleCalculationModeChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    dismissResetUndo()
    const nextIsAutoCalculation = event.target.checked

    if (
      isAutoCalculation &&
      !nextIsAutoCalculation &&
      autoCalculationOutcome?.ok
    ) {
      setManualCalculation(
        autoCalculationOutcome.stored,
      )
      setIsManualCalculationInvalidated(false)
    }

    pendingErrorSummaryFocusRef.current = false
    setIsAutoCalculation(nextIsAutoCalculation)
    setHasSubmitted(false)
    setManualCalculationError(null)
  }

  const copyConsultationSummary = async () => {
    if (!consultationSummary) {
      return
    }

    if (summaryStatusTimerRef.current !== null) {
      window.clearTimeout(summaryStatusTimerRef.current)
      summaryStatusTimerRef.current = null
    }

    const requestId = copyRequestIdRef.current + 1
    copyRequestIdRef.current = requestId

    try {
      await navigator.clipboard.writeText(
        consultationSummary,
      )

      if (requestId !== copyRequestIdRef.current) {
        return
      }

      setSummaryActionStatus('copied')
      summaryStatusTimerRef.current = window.setTimeout(
        () => {
          if (requestId === copyRequestIdRef.current) {
            setSummaryActionStatus(null)
            summaryStatusTimerRef.current = null
          }
        },
        3000,
      )
    } catch {
      if (requestId !== copyRequestIdRef.current) {
        return
      }

      setSummaryActionStatus('copy-error')
    }
  }

  const printConsultationSummary = () => {
    if (!consultationSummary) {
      return
    }

    window.print()
  }

  const resetCalculator = () => {
    const shouldOfferUndo = hasAnyInput(values)

    if (shouldOfferUndo) {
      setResetSnapshot({
        values: { ...values },
        touchedFields: { ...touchedFields },
        repaymentMethod,
        isAutoCalculation,
        hasSubmitted,
        manualCalculation,
        isManualCalculationInvalidated,
        manualCalculationError,
      })
      setStatusMessageOverride(
        '入力内容をリセットしました。',
      )
    } else {
      setResetSnapshot(null)
      setStatusMessageOverride(null)
    }

    pendingErrorSummaryFocusRef.current = false
    setValues(EMPTY_VALUES)
    setTouchedFields(EMPTY_TOUCHED_FIELDS)
    setRepaymentMethod('equal-payment')
    setIsAutoCalculation(false)
    setHasSubmitted(false)
    setManualCalculation(null)
    setIsManualCalculationInvalidated(false)
    setManualCalculationError(null)

    if (!shouldOfferUndo) {
      loanAmountRef.current?.focus()
    }
  }

  const restoreReset = () => {
    if (!resetSnapshot) {
      return
    }

    pendingErrorSummaryFocusRef.current = false
    setValues(resetSnapshot.values)
    setTouchedFields(resetSnapshot.touchedFields)
    setRepaymentMethod(resetSnapshot.repaymentMethod)
    setIsAutoCalculation(resetSnapshot.isAutoCalculation)
    setHasSubmitted(resetSnapshot.hasSubmitted)
    setManualCalculation(resetSnapshot.manualCalculation)
    setIsManualCalculationInvalidated(
      resetSnapshot.isManualCalculationInvalidated,
    )
    setManualCalculationError(
      resetSnapshot.manualCalculationError,
    )
    setResetSnapshot(null)
    setStatusMessageOverride(
      'リセット前の入力内容を元に戻しました。',
    )

    window.requestAnimationFrame(() => {
      loanAmountRef.current?.focus()
    })
  }

  const resultHeading = getResultHeading(
    Boolean(activeCalculation),
  )
  const repaymentYearsSlider =
    getRepaymentYearsSliderState(
      values.repaymentYears,
    )

  return (
    <section
      className="mortgage-calculator"
      aria-labelledby="mortgage-title"
    >
      <header className="mortgage-calculator__heading">
        <p className="section-label">
          MORTGAGE CALCULATOR
        </p>

        <h2 id="mortgage-title">
          <span>住宅ローン返済</span>
          <wbr />
          <span>シミュレーター</span>
        </h2>

        <p>
          借入金額・年利・返済期間から、
          元利均等返済と元金均等返済を
          同じ条件で比較します。
        </p>
      </header>

      <div
        className="mortgage-status"
        data-tone={getStatusTone(viewState)}
        aria-live="polite"
        aria-atomic="true"
      >
        <span aria-hidden="true" />
        <strong>{statusMessage}</strong>
      </div>

      <div className="mortgage-calculator__layout">
        <form
          className="mortgage-form"
          aria-labelledby="mortgage-title"
          onSubmit={handleSubmit}
          onKeyDown={handleFormKeyDown}
          noValidate
        >
          <div className="simulator-panel-heading">
            <span aria-hidden="true">01</span>
            <div>
              <p>INPUT</p>
              <h3>ローン条件を入力</h3>
            </div>
          </div>

          <fieldset className="mortgage-method">
            <legend>強調して表示する返済方式</legend>

            <div className="mortgage-method__options">
              <label
                className="mortgage-method__option"
                data-selected={
                  repaymentMethod === 'equal-payment'
                }
              >
                <input
                  type="radio"
                  name="repayment-method"
                  value="equal-payment"
                  checked={
                    repaymentMethod === 'equal-payment'
                  }
                  onChange={() =>
                    handleRepaymentMethodChange(
                      'equal-payment',
                    )
                  }
                />

                <span>
                  <strong>元利均等返済</strong>
                  <small>
                    毎月の返済額が原則一定
                  </small>
                </span>
              </label>

              <label
                className="mortgage-method__option"
                data-selected={
                  repaymentMethod === 'equal-principal'
                }
              >
                <input
                  type="radio"
                  name="repayment-method"
                  value="equal-principal"
                  checked={
                    repaymentMethod ===
                    'equal-principal'
                  }
                  onChange={() =>
                    handleRepaymentMethodChange(
                      'equal-principal',
                    )
                  }
                />

                <span>
                  <strong>元金均等返済</strong>
                  <small>
                    返済額が徐々に減少
                  </small>
                </span>
              </label>
            </div>

            <p className="mortgage-method__help">
              両方式を同じ条件で計算し、
              選択した方式を結果で強調表示します。
            </p>
          </fieldset>

          {shouldShowErrorSummary && (
            <div
              ref={errorSummaryRef}
              className="mortgage-error-summary"
              role="alert"
              aria-labelledby="mortgage-error-title"
              tabIndex={-1}
            >
              <strong id="mortgage-error-title">
                入力内容を確認してください
                （{visibleErrorEntries.length}件）
              </strong>

              <ul>
                {visibleErrorEntries.map(
                  ({ fieldName, message }) => (
                    <li key={fieldName}>
                      <a
                        href={`#${FIELD_INPUT_IDS[fieldName]}`}
                        onClick={(event) => {
                          event.preventDefault()
                          fieldRefs[
                            fieldName
                          ].current?.focus()
                        }}
                      >
                        {message}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          <div className="mortgage-field">
            <label htmlFor="mortgage-loan-amount">
              借入金額
            </label>

            <div className="mortgage-input-with-unit">
              <MoneyInput
                ref={loanAmountRef}
                id="mortgage-loan-amount"
                name="loanAmount"
                autoComplete="off"
                value={values.loanAmount}
                invalidCharacterPolicy="preserve"
                placeholder="例：30,000,000"
                aria-required="true"
                aria-invalid={Boolean(
                  visibleErrors.loanAmount,
                )}
                aria-describedby={
                  visibleErrors.loanAmount
                    ? 'mortgage-loan-amount-help mortgage-loan-amount-error'
                    : 'mortgage-loan-amount-help'
                }
                onValueChange={(value) =>
                  updateFieldValue(
                    'loanAmount',
                    value,
                  )
                }
                onBlur={(event) =>
                  handleFieldBlur(
                    'loanAmount',
                    event,
                  )
                }
              />

              <span>円</span>
            </div>

            <small
              id="mortgage-loan-amount-help"
              className="mortgage-field__help"
            >
              10万円～10億円の整数で入力してください。
              本シミュレーター上の計算範囲であり、
              金融機関の融資条件や審査基準を
              示すものではありません。
            </small>

            {visibleErrors.loanAmount && (
              <small
                id="mortgage-loan-amount-error"
                className="mortgage-field__error"
              >
                {visibleErrors.loanAmount.message}
              </small>
            )}
          </div>

          <div className="mortgage-field">
            <label htmlFor="mortgage-interest-rate">
              年利
            </label>

            <div className="mortgage-input-with-unit">
              <input
                ref={annualInterestRateRef}
                id="mortgage-interest-rate"
                name="annualInterestRate"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={values.annualInterestRate}
                placeholder="例：1.0"
                aria-required="true"
                aria-invalid={Boolean(
                  visibleErrors.annualInterestRate,
                )}
                aria-describedby={
                  visibleErrors.annualInterestRate
                    ? 'mortgage-interest-rate-help mortgage-interest-rate-error'
                    : 'mortgage-interest-rate-help'
                }
                onChange={(event) =>
                  handleFieldChange(
                    'annualInterestRate',
                    event,
                  )
                }
                onBlur={(event) =>
                  handleFieldBlur(
                    'annualInterestRate',
                    event,
                  )
                }
              />

              <span>%</span>
            </div>

            <small
              id="mortgage-interest-rate-help"
              className="mortgage-field__help"
            >
              0～20％、小数第3位まで入力できます。
            </small>

            {visibleErrors.annualInterestRate && (
              <small
                id="mortgage-interest-rate-error"
                className="mortgage-field__error"
              >
                {
                  visibleErrors.annualInterestRate
                    .message
                }
              </small>
            )}
          </div>

          <div className="mortgage-field">
            <label htmlFor="mortgage-repayment-years">
              返済期間
            </label>

            <div className="mortgage-input-with-unit">
              <input
                ref={repaymentYearsRef}
                id="mortgage-repayment-years"
                name="repaymentYears"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={values.repaymentYears}
                placeholder="例：35"
                aria-required="true"
                aria-invalid={Boolean(
                  visibleErrors.repaymentYears,
                )}
                aria-describedby={
                  visibleErrors.repaymentYears
                    ? 'mortgage-repayment-years-help mortgage-repayment-years-error'
                    : 'mortgage-repayment-years-help'
                }
                onChange={(event) =>
                  handleFieldChange(
                    'repaymentYears',
                    event,
                  )
                }
                onBlur={(event) =>
                  handleFieldBlur(
                    'repaymentYears',
                    event,
                  )
                }
              />

              <span>年</span>
            </div>

            <div
              className="mortgage-repayment-slider"
              data-empty={repaymentYearsSlider.isEmpty}
            >
              <input
                id="mortgage-repayment-years-slider"
                type="range"
                min={MORTGAGE_LIMITS.repaymentYears.min}
                max={MORTGAGE_LIMITS.repaymentYears.max}
                step="1"
                value={repaymentYearsSlider.value}
                aria-label="返済期間スライダー"
                aria-valuetext={repaymentYearsSlider.valueText}
                aria-describedby="mortgage-repayment-years-help"
                onChange={(event) =>
                  updateFieldValue(
                    'repaymentYears',
                    event.target.value,
                  )
                }
              />
              <output
                htmlFor="mortgage-repayment-years-slider"
              >
                {repaymentYearsSlider.valueText}
              </output>
            </div>

            <small
              id="mortgage-repayment-years-help"
              className="mortgage-field__help"
            >
              1～50年の整数で入力してください。
            </small>

            {visibleErrors.repaymentYears && (
              <small
                id="mortgage-repayment-years-error"
                className="mortgage-field__error"
              >
                {
                  visibleErrors.repaymentYears.message
                }
              </small>
            )}
          </div>

          <div className="mortgage-mode">
            <label>
              <input
                type="checkbox"
                checked={isAutoCalculation}
                onChange={
                  handleCalculationModeChange
                }
              />

              <span>
                入力と同時に計算結果を更新する
              </span>
            </label>

            <p>
              {isAutoCalculation
                ? '未操作の項目にはエラーを表示せず、有効な条件がそろった時点で自動計算します。'
                : '入力後にシミュレートボタンを押すと計算できます。'}
            </p>
          </div>

          <div
            className="mortgage-form-actions"
            data-single={isAutoCalculation}
          >
            <button
              className="mortgage-button mortgage-button--secondary"
              type="button"
              onClick={resetCalculator}
            >
              入力内容をリセット
            </button>

            {!isAutoCalculation && (
              <button
                className="mortgage-button mortgage-button--primary"
                type="submit"
              >
                シミュレートする
              </button>
            )}
          </div>

          {resetSnapshot && (
            <div
              className="mortgage-reset-undo"
              role="group"
              aria-label="リセットの取り消し"
            >
              <p>
                <strong>入力内容をリセットしました。</strong>
              </p>

              <button
                className="mortgage-reset-undo__button"
                type="button"
                onClick={restoreReset}
              >
                元に戻す
              </button>
            </div>
          )}

          <aside className="simulator-input-point simulator-input-point--mortgage">
            <strong>入力のポイント</strong>
            <p>
              同じ借入条件で2つの返済方式を比較します。
              期間や金利を変えて、毎月返済額と総返済額の違いを確認してください。
            </p>
          </aside>
        </form>

        <section
          className="mortgage-results simulation-result-anchor"
          ref={resultsRef}
          aria-labelledby="mortgage-result-title"
          tabIndex={-1}
          data-empty={
            activeCalculation === null &&
            calculationError === null
          }
        >
          <div className="mortgage-results__heading">
            <div>
              <p className="mortgage-results__eyebrow">
                RESULT
              </p>

              <h3 id="mortgage-result-title">
                {resultHeading}
              </h3>
            </div>

          </div>

          {!isAutoCalculation &&
            isManualCalculationInvalidated &&
            !hasVisibleErrors && (
              <p className="mortgage-results-helper">
                条件を変更しました。シミュレートすると結果を更新します。
              </p>
            )}

          {getCalculationErrorLabel(
            calculationError,
          ) && (
              <div
                className="mortgage-calculation-error"
                role="alert"
              >
                {getCalculationErrorLabel(
                  calculationError,
                )}
              </div>
            )}

          {activeCalculation ? (
            <>
              <div className="mortgage-results-overview" aria-label="返済方式の比較結果">
                <article className="mortgage-comparison-card" data-selected={repaymentMethod === 'equal-payment'} aria-labelledby="mortgage-equal-payment-title">
                  <header className="mortgage-comparison-card__heading">
                    <div><p>毎月の安定を重視</p><h4 id="mortgage-equal-payment-title">元利均等返済</h4></div>
                    {repaymentMethod === 'equal-payment' && <span>選択中</span>}
                  </header>
                  <dl className="mortgage-comparison-card__values">
                    <div><dt>毎月返済額</dt><dd>{formatApproxMortgageYen(activeCalculation.comparison.equalPayment.firstPayment)}</dd><small>毎月の返済額が原則一定</small></div>
                    <div><dt>初年度年間返済額（概算）</dt><dd>{formatApproxMortgageYen(activeCalculation.comparison.equalPayment.firstYearPaymentTotal)}</dd></div>
                    <div><dt>最終回返済額</dt><dd>{formatApproxMortgageYen(activeCalculation.comparison.equalPayment.lastPayment)}</dd></div>
                    <div><dt>総返済額</dt><dd>{formatApproxMortgageYen(activeCalculation.comparison.equalPayment.totalPayment)}</dd></div>
                    <div><dt>支払利息総額</dt><dd>{formatApproxMortgageYen(activeCalculation.comparison.equalPayment.totalInterest)}</dd></div>
                  </dl>
                </article>

                <article className="mortgage-comparison-card" data-selected={repaymentMethod === 'equal-principal'} aria-labelledby="mortgage-equal-principal-title">
                  <header className="mortgage-comparison-card__heading">
                    <div><p>利息の軽減を重視</p><h4 id="mortgage-equal-principal-title">元金均等返済</h4></div>
                    {repaymentMethod === 'equal-principal' && <span>選択中</span>}
                  </header>
                  <dl className="mortgage-comparison-card__values">
                    <div><dt>初回返済額</dt><dd>{formatApproxMortgageYen(activeCalculation.comparison.equalPrincipal.firstPayment)}</dd><small>返済額は徐々に減少</small></div>
                    <div><dt>初年度年間返済額（概算）</dt><dd>{formatApproxMortgageYen(activeCalculation.comparison.equalPrincipal.firstYearPaymentTotal)}</dd></div>
                    <div><dt>最終回返済額</dt><dd>{formatApproxMortgageYen(activeCalculation.comparison.equalPrincipal.lastPayment)}</dd></div>
                    <div><dt>総返済額</dt><dd>{formatApproxMortgageYen(activeCalculation.comparison.equalPrincipal.totalPayment)}</dd></div>
                    <div><dt>支払利息総額</dt><dd>{formatApproxMortgageYen(activeCalculation.comparison.equalPrincipal.totalInterest)}</dd></div>
                  </dl>
                </article>

                <article className="mortgage-comparison-delta" role="note">
                  <header>
                    <p>COMPARISON</p>
                    <h4>2方式の差額</h4>
                  </header>
                  <dl>
                    <div>
                      <dt>初回返済額の差</dt>
                      <dd>{formatMortgageDifferenceYen(activeCalculation.comparison.differences.firstPayment)}</dd>
                    </div>
                    <div>
                      <dt>支払利息の差</dt>
                      <dd>{formatMortgageDifferenceYen(activeCalculation.comparison.differences.totalInterest)}</dd>
                    </div>
                  </dl>
                  <p>{createMortgageComparisonExplanation(activeCalculation.comparison)}</p>
                </article>
              </div>

              {mortgageTrajectories && (
                <section className="mortgage-trajectories-section" aria-labelledby="mortgage-trajectories-title">
                  <header>
                    <div>
                      <p>PAYMENT TRAJECTORY</p>
                      <h4 id="mortgage-trajectories-title">累計返済額の推移</h4>
                    </div>
                    <span>元金と利息の累計</span>
                  </header>
                  <div className="mortgage-trajectories-grid">
                    <MortgageTrajectoryChart
                      title="元利均等返済"
                      tone="blue"
                      points={mortgageTrajectories.equalPayment}
                      paymentCount={activeCalculation.input.paymentCount}
                      scaleMax={mortgageTrajectories.scaleMax}
                    />
                    <MortgageTrajectoryChart
                      title="元金均等返済"
                      tone="green"
                      points={mortgageTrajectories.equalPrincipal}
                      paymentCount={activeCalculation.input.paymentCount}
                      scaleMax={mortgageTrajectories.scaleMax}
                    />
                  </div>
                  <MortgageTrajectoryDifferenceChart
                    points={mortgageTrajectories.differencePoints}
                    summary={mortgageTrajectories.differenceSummary}
                  />
                  <aside
                    className="mortgage-trajectory-guide"
                    aria-label="グラフの見方"
                  >
                    <strong>グラフの見方</strong>
                    <p>
                      濃色は累計元金、淡色は累計利息です。
                      各時点までの返済内訳の積み上がりを示し、
                      下の差額グラフでは2方式の累計返済額の差を拡大して確認できます。
                      金融機関固有の端数処理などを
                      完全に再現するものではありません。
                    </p>
                  </aside>
                </section>
              )}

              <div className="mortgage-results__condition-heading mortgage-results__condition-heading--compact">
                <strong>入力条件</strong>
                <button
                  className="mortgage-results__edit-button"
                  type="button"
                  onClick={() =>
                    loanAmountRef.current?.focus()
                  }
                >
                  入力条件を確認・変更する
                </button>
              </div>

              <dl className="mortgage-conditions mortgage-conditions--compact">
                <div><dt>借入金額</dt><dd>{activeCalculation.input.principal.toLocaleString('ja-JP')}円</dd></div>
                <div><dt>年利</dt><dd>{activeCalculation.input.annualRate.toLocaleString('ja-JP', { maximumFractionDigits: 3 })}%</dd></div>
                <div><dt>返済期間</dt><dd>{activeCalculation.input.paymentCount / 12}年</dd></div>
                <div><dt>返済回数</dt><dd>{activeCalculation.input.paymentCount.toLocaleString('ja-JP')}回</dd></div>
              </dl>
            </>
          ) : (
            <MortgageEmptyResults />
          )}
        </section>
      </div>

      <aside
        className="mortgage-note"
        aria-label="計算上の注意"
      >
        <strong>計算上の前提</strong>

        <p>
          入力した金利が返済期間中変わらず、
          毎月1回返済するものとして算出した概算です。
          計算途中では円未満を丸めず、画面表示時に
          円単位へ四捨五入します。
        </p>

        <p>
          金融機関ごとの各回返済額の端数処理、
          最終回調整、事務手数料、保証料、
          団体信用生命保険料、登記費用、
          火災保険料、金利変動などは含みません。
          実際の返済予定表とは差が生じる場合があります。
        </p>
      </aside>

      <section
        className="mortgage-consultation-summary"
        data-empty={consultationSummary === null}
        aria-labelledby="mortgage-consultation-summary-title"
      >
        <header className="mortgage-consultation-summary__heading">
          <div>
            <p>CONSULTATION SUMMARY</p>
            <h3 id="mortgage-consultation-summary-title">
              相談用サマリー
            </h3>
            <span>
              計算結果を金融機関への相談用に整理します。
              入力内容は保存・外部送信しません。
            </span>
          </div>

          <div className="mortgage-consultation-summary__actions">
            <button
              type="button"
              disabled={!consultationSummary}
              onClick={copyConsultationSummary}
            >
              相談用サマリーをコピー
            </button>
            <button
              type="button"
              disabled={!consultationSummary}
              onClick={printConsultationSummary}
            >
              印刷する
            </button>
          </div>
        </header>

        {summaryActionStatus && (
          <p
            className="mortgage-consultation-summary__status"
            data-tone={summaryActionStatus === 'copied'
              ? 'success'
              : 'error'}
            role="status"
            aria-live="polite"
          >
            {summaryActionStatus === 'copied'
              ? '相談用サマリーをコピーしました。'
              : 'コピーできませんでした。もう一度お試しください。'}
          </p>
        )}

        {activeCalculation ? (
          <MortgageConsultationSummaryContent
            calculation={activeCalculation}
            repaymentMethod={repaymentMethod}
          />
        ) : (
          <p className="mortgage-consultation-summary__empty">
            シミュレーション後にコピー・印刷できます。
          </p>
        )}
      </section>

      {activeCalculation && (
        isAffiliateVisualPreviewEnabled()
          ? <AffiliatePreviewCard category="mortgage" />
          : <AffiliateCard program={affiliatePrograms.mortgage} />
      )}
    </section>
  )
}

export default MortgageCalculator
