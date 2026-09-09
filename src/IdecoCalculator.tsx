import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import MoneyInput from './components/form/MoneyInput'
import {
  calculateIdeco,
  type IdecoCalculationSuccess,
} from './idecoCalculation'
import {
  getIdecoContributionLimit,
  getIdecoParticipantLabel,
  getIdecoRegimeLabel,
  getIdecoRelatedContributionLabel,
  IDECO_PARTICIPANT_OPTIONS,
  requiresIdecoRelatedContribution,
  type IdecoParticipantCategory,
  type IdecoRuleField,
  type IdecoRuleInput,
  type IdecoValidationErrors,
  validateIdecoRuleInput,
} from './idecoRules'
import {
  getMoneyInputDigits,
  normalizeMoneyInputCharacters,
} from './utils/moneyInput'

type DisplayedIdecoResult = {
  annualContribution: number | null
  totalContribution: number | null
  incomeTaxSaving: number | null
  residentTaxSaving: number | null
  annualTaxSaving: number | null
  totalTaxSaving: number | null
}

const emptyResult: DisplayedIdecoResult = {
  annualContribution: null,
  totalContribution: null,
  incomeTaxSaving: null,
  residentTaxSaving: null,
  annualTaxSaving: null,
  totalTaxSaving: null,
}

const incomeTaxRates = [
  {
    rate: 0,
    taxableIncomeGuide: '課税所得なし',
  },
  {
    rate: 5,
    taxableIncomeGuide: '課税所得 195万円未満',
  },
  {
    rate: 10,
    taxableIncomeGuide:
      '課税所得 195万円以上～330万円未満',
  },
  {
    rate: 20,
    taxableIncomeGuide:
      '課税所得 330万円以上～695万円未満',
  },
  {
    rate: 23,
    taxableIncomeGuide:
      '課税所得 695万円以上～900万円未満',
  },
  {
    rate: 33,
    taxableIncomeGuide:
      '課税所得 900万円以上～1,800万円未満',
  },
  {
    rate: 40,
    taxableIncomeGuide:
      '課税所得 1,800万円以上～4,000万円未満',
  },
  {
    rate: 45,
    taxableIncomeGuide:
      '課税所得 4,000万円以上',
  },
]

const normalizeDecimalInput = (value: string) => {
  const converted = normalizeMoneyInputCharacters(value)
    .replace(/,/g, '')
    .replace(/[^\d.-]/g, '')

  const isNegative = converted.startsWith('-')
  const unsigned = converted.replace(/-/g, '')

  const [integerPart, ...decimalParts] =
    unsigned.split('.')

  const normalized = decimalParts.length === 0
    ? integerPart
    : `${integerPart}.${decimalParts.join('')}`

  if (isNegative && normalized !== '') {
    return `-${normalized}`
  }

  return normalized
}

const formatYen = (value: number) =>
  new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value)

const parseMoneyValue = (value: string) => {
  const digits = getMoneyInputDigits(value)
  return digits === '' ? null : Number(digits)
}

const parseDecimalValue = (value: string) => {
  const normalized = normalizeDecimalInput(value)
  return normalized === '' || normalized === '-'
    ? null
    : Number(normalized)
}

const toDisplayedResult = (
  calculation: IdecoCalculationSuccess | null,
): DisplayedIdecoResult =>
  calculation
    ? calculation.result.rounded
    : emptyResult

const IDECO_FIELD_ORDER: IdecoRuleField[] = [
  'effectiveDate',
  'participantCategory',
  'relatedMonthlyContribution',
  'monthlyContribution',
  'actualContributionMonths',
  'incomeTaxRate',
  'residentTaxRate',
  'referenceYears',
]

type IdecoCalculatorProps = {
  initialIncomeTaxRate?: number
  onOpenTaxableIncome: () => void
}

function IdecoCalculator({
  initialIncomeTaxRate,
  onOpenTaxableIncome,
}: IdecoCalculatorProps) {
  const [effectiveDate, setEffectiveDate] = useState('')
  const [participantCategory, setParticipantCategory] =
    useState<IdecoParticipantCategory | ''>('')
  const [relatedMonthlyContribution, setRelatedMonthlyContribution] =
    useState('')
  const [monthlyContribution, setMonthlyContribution] =
    useState('')
  const [actualContributionMonths, setActualContributionMonths] =
    useState('')
  const [incomeTaxRate, setIncomeTaxRate] =
    useState(() => String(initialIncomeTaxRate ?? ''))
  const [residentTaxRate, setResidentTaxRate] =
    useState('')
  const [contributionYears, setContributionYears] =
    useState('')
  const [isAutoCalculation, setIsAutoCalculation] =
    useState(false)
  const [manualResult, setManualResult] =
    useState<IdecoCalculationSuccess | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const fieldRefs = useRef<
    Partial<Record<IdecoRuleField, HTMLElement>>
  >({})

  useEffect(() => {
    if (initialIncomeTaxRate !== undefined) {
      setIncomeTaxRate(String(initialIncomeTaxRate))
      setManualResult(null)
      setHasSubmitted(false)
    }
  }, [initialIncomeTaxRate])

  const input = useMemo<IdecoRuleInput>(
    () => ({
      effectiveDate,
      participantCategory,
      relatedMonthlyContribution:
        parseMoneyValue(relatedMonthlyContribution),
      monthlyContribution:
        parseMoneyValue(monthlyContribution),
      actualContributionMonths:
        parseDecimalValue(actualContributionMonths),
      incomeTaxRate: parseDecimalValue(incomeTaxRate),
      residentTaxRate: parseDecimalValue(residentTaxRate),
      referenceYears: parseDecimalValue(contributionYears),
    }),
    [
      effectiveDate,
      participantCategory,
      relatedMonthlyContribution,
      monthlyContribution,
      actualContributionMonths,
      incomeTaxRate,
      residentTaxRate,
      contributionYears,
    ],
  )

  const validationErrors = useMemo(
    () => validateIdecoRuleInput(input),
    [input],
  )
  const autoOutcome = useMemo(
    () => calculateIdeco(input),
    [input],
  )
  const autoResult = autoOutcome.ok ? autoOutcome : null
  const displayedCalculation = isAutoCalculation
    ? autoResult
    : manualResult
  const displayedResult = toDisplayedResult(displayedCalculation)
  const rawDisplayedResult = displayedCalculation?.result ?? null
  const years = input.referenceYears ?? 0
  const selectedCategory = participantCategory || null
  const needsRelatedContribution = Boolean(
    selectedCategory &&
    requiresIdecoRelatedContribution(selectedCategory),
  )
  const contributionLimit = getIdecoContributionLimit(input)
  const specialIncomeTaxDescription =
    input.effectiveDate >= '2027-01-01'
      ? '防衛特別所得税・復興特別所得税を含む概算'
      : '復興特別所得税を含む概算'

  const fieldsWithValues: Record<IdecoRuleField, boolean> = {
    effectiveDate: effectiveDate !== '',
    participantCategory: participantCategory !== '',
    relatedMonthlyContribution:
      relatedMonthlyContribution !== '',
    monthlyContribution: monthlyContribution !== '',
    actualContributionMonths:
      actualContributionMonths !== '',
    incomeTaxRate: incomeTaxRate !== '',
    residentTaxRate: residentTaxRate !== '',
    referenceYears: contributionYears !== '',
  }

  const visibleErrors: IdecoValidationErrors =
    isAutoCalculation
      ? Object.fromEntries(
        Object.entries(validationErrors).filter(([field]) =>
          fieldsWithValues[field as IdecoRuleField],
        ),
      ) as IdecoValidationErrors
      : hasSubmitted
        ? validationErrors
        : {}
  const visibleErrorEntries = IDECO_FIELD_ORDER.flatMap((field) => {
    const message = visibleErrors[field]
    return message ? [[field, message] as const] : []
  })

  useEffect(() => {
    if (hasSubmitted && visibleErrorEntries.length > 0) {
      errorSummaryRef.current?.focus()
    }
  }, [hasSubmitted, visibleErrorEntries.length])

  const longTermDisplayMax = Math.max(
    rawDisplayedResult?.totalContribution ?? 0,
    rawDisplayedResult?.totalTaxSaving ?? 0,
  )

  const idecoTrajectory = useMemo(() => {
    if (
      rawDisplayedResult === null ||
      longTermDisplayMax <= 0
    ) {
      return []
    }

    return Array.from({ length: 7 }, (_, index) => {
      const ratio = index / 6

      return {
        ratio,
        label: ratio === 0
          ? '開始'
          : ratio === 1
            ? '終了'
            : `${Math.max(1, Math.round(years * ratio))}年後`,
        contribution: rawDisplayedResult.totalContribution * ratio,
        saving: rawDisplayedResult.totalTaxSaving * ratio,
      }
    })
  }, [
    rawDisplayedResult,
    longTermDisplayMax,
    years,
  ])

  const idecoAreaGraph = useMemo(() => {
    if (idecoTrajectory.length === 0 || longTermDisplayMax <= 0) {
      return null
    }

    const width = 600
    const bottom = 180
    const plotHeight = 150
    const pointStep = width / (idecoTrajectory.length - 1)
    const toY = (value: number) =>
      bottom - value / longTermDisplayMax * plotHeight
    const contributionPoints = idecoTrajectory.map((point, index) =>
      `${index * pointStep},${toY(point.contribution)}`,
    )
    const savingPoints = idecoTrajectory.map((point, index) =>
      `${index * pointStep},${toY(point.saving)}`,
    )

    return {
      contributionArea: `0,${bottom} ${contributionPoints.join(' ')} ${width},${bottom}`,
      contributionLine: contributionPoints.join(' '),
      savingArea: `0,${bottom} ${savingPoints.join(' ')} ${width},${bottom}`,
      savingLine: savingPoints.join(' '),
    }
  }, [idecoTrajectory, longTermDisplayMax])

  const invalidateManualResult = () => {
    setHasSubmitted(false)
    setManualResult(null)
  }

  const handleMonthlyContributionChange = (
    value: string,
  ) => {
    setMonthlyContribution(value)
    invalidateManualResult()
  }

  const handleIncomeTaxRateChange = (
    value: string,
  ) => {
    setIncomeTaxRate(value)
    invalidateManualResult()
  }

  const handleResidentTaxRateChange = (
    value: string,
  ) => {
    setResidentTaxRate(value)
    invalidateManualResult()
  }

  const handleContributionYearsChange = (
    value: string,
  ) => {
    setContributionYears(value)
    invalidateManualResult()
  }

  const simulate = () => {
    const outcome = calculateIdeco(input)

    setHasSubmitted(true)
    setManualResult(outcome.ok ? outcome : null)
  }

  const resetCalculator = () => {
    setEffectiveDate('')
    setParticipantCategory('')
    setRelatedMonthlyContribution('')
    setMonthlyContribution('')
    setActualContributionMonths('')
    setIncomeTaxRate('')
    setResidentTaxRate('')
    setContributionYears('')
    setManualResult(null)
    setHasSubmitted(false)
  }

  const changeCalculationMode = (
    checked: boolean,
  ) => {
    setIsAutoCalculation(checked)
    setManualResult(null)
    setHasSubmitted(false)
  }

  const openTaxableIncomeCalculator = () => {
    onOpenTaxableIncome()
  }

  const selectedIncomeTaxRate =
    incomeTaxRates.find(
      (item) =>
        String(item.rate) === incomeTaxRate,
    ) ?? null

  const focusField = (field: IdecoRuleField) => {
    fieldRefs.current[field]?.focus()
  }

  const preventInputEnter = (
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    if (
      event.key === 'Enter' &&
      event.target instanceof HTMLInputElement
    ) {
      event.preventDefault()
    }
  }

  const getErrorDescription = (field: IdecoRuleField) =>
    visibleErrors[field] ? `ideco-${field}-error` : undefined

  return (
    <section
      className="calculator"
      aria-labelledby="ideco-title"
    >
      <div className="calculator-heading">
        <p className="section-label">
          IDECO TAX SAVING CALCULATOR
        </p>

        <h2 id="ideco-title">
          <span>iDeCo節税</span>
          <wbr />
          <span>シミュレーター</span>
        </h2>

        <p>
          毎月の掛金と税率から、
          iDeCoによる所得税・住民税の軽減額を
          概算します。
        </p>
      </div>

      <div className="calculator-layout">
        <div
          className="calculator-form"
          onKeyDown={preventInputEnter}
        >
          <div className="simulator-panel-heading">
            <span aria-hidden="true">01</span>
            <div>
              <p>INPUT</p>
              <h3>条件を入力する</h3>
            </div>
          </div>

          {visibleErrorEntries.length > 0 && (
            <div
              ref={errorSummaryRef}
              className="ideco-error-summary"
              role="alert"
              tabIndex={-1}
              aria-labelledby="ideco-error-summary-title"
            >
              <strong id="ideco-error-summary-title">
                入力内容を確認してください
              </strong>
              <ul>
                {visibleErrorEntries.map(([field, message]) => (
                  <li key={field}>
                    <button
                      type="button"
                      onClick={() => focusField(field)}
                    >
                      {message}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="ideco-field ideco-field--wide">
            <label htmlFor="ideco-effective-date">
              制度適用日
            </label>
            <input
              ref={(node) => {
                fieldRefs.current.effectiveDate = node ?? undefined
              }}
              id="ideco-effective-date"
              type="date"
              value={effectiveDate}
              aria-invalid={Boolean(visibleErrors.effectiveDate)}
              aria-describedby={getErrorDescription('effectiveDate')}
              onChange={(event) => {
                setEffectiveDate(event.target.value)
                invalidateManualResult()
              }}
            />
            {visibleErrors.effectiveDate && (
              <p
                id="ideco-effectiveDate-error"
                className="ideco-field__error"
              >
                {visibleErrors.effectiveDate}
              </p>
            )}
          </div>

          <div className="ideco-field ideco-field--wide">
            <label htmlFor="ideco-participant-category">
              加入区分
            </label>
            <select
              ref={(node) => {
                fieldRefs.current.participantCategory = node ?? undefined
              }}
              id="ideco-participant-category"
              value={participantCategory}
              aria-invalid={Boolean(visibleErrors.participantCategory)}
              aria-describedby={getErrorDescription('participantCategory')}
              onChange={(event) => {
                setRelatedMonthlyContribution('')
                setParticipantCategory(
                  event.target.value as IdecoParticipantCategory | '',
                )
                invalidateManualResult()
              }}
            >
              <option value="">選択してください</option>
              {IDECO_PARTICIPANT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {visibleErrors.participantCategory && (
              <p
                id="ideco-participantCategory-error"
                className="ideco-field__error"
              >
                {visibleErrors.participantCategory}
              </p>
            )}
          </div>

          {needsRelatedContribution && selectedCategory && (
            <div className="ideco-field ideco-field--wide">
              <label htmlFor="ideco-related-contribution">
                {getIdecoRelatedContributionLabel(selectedCategory)}
              </label>
              <div className="input-with-unit">
                <MoneyInput
                  ref={(node) => {
                    fieldRefs.current.relatedMonthlyContribution =
                      node ?? undefined
                  }}
                  id="ideco-related-contribution"
                  value={relatedMonthlyContribution}
                  aria-invalid={Boolean(
                    visibleErrors.relatedMonthlyContribution,
                  )}
                  aria-describedby={getErrorDescription(
                    'relatedMonthlyContribution',
                  )}
                  onValueChange={(value) => {
                    setRelatedMonthlyContribution(value)
                    invalidateManualResult()
                  }}
                  placeholder="該当額がない場合は0"
                />
                <span>円</span>
              </div>
              <p className="ideco-field__help">
                掛金上限と合算する月額です。該当額がない場合も0円と入力してください。
              </p>
              {visibleErrors.relatedMonthlyContribution && (
                <p
                  id="ideco-relatedMonthlyContribution-error"
                  className="ideco-field__error"
                >
                  {visibleErrors.relatedMonthlyContribution}
                </p>
              )}
            </div>
          )}

          {contributionLimit && selectedCategory && (
            <aside className="ideco-rule-summary">
              <strong>{getIdecoRegimeLabel(contributionLimit.regime)}</strong>
              <span>{getIdecoParticipantLabel(selectedCategory)}</span>
              <span>計算モード：簡易税率モード</span>
              <p>
                この条件での月額上限は
                <b>{contributionLimit.monthlyLimit.toLocaleString('ja-JP')}円</b>
                です。
              </p>
            </aside>
          )}

          <div className="ideco-field">
            <label htmlFor="ideco-monthly-contribution">
              毎月の掛金
            </label>

            <div className="input-with-unit">
              <MoneyInput
                ref={(node) => {
                  fieldRefs.current.monthlyContribution = node ?? undefined
                }}
                id="ideco-monthly-contribution"
                value={monthlyContribution}
                onValueChange={handleMonthlyContributionChange}
                aria-invalid={Boolean(visibleErrors.monthlyContribution)}
                aria-describedby={getErrorDescription('monthlyContribution')}
                placeholder="例：23,000"
              />

              <span>円</span>
            </div>
            <p className="ideco-field__help">
              月5,000円以上、1,000円単位で入力してください。
            </p>
            {visibleErrors.monthlyContribution && (
              <p
                id="ideco-monthlyContribution-error"
                className="ideco-field__error"
              >
                {visibleErrors.monthlyContribution}
              </p>
            )}
          </div>

          <div className="ideco-field">
            <label htmlFor="ideco-actual-months">
              実拠出月数
            </label>
            <div className="input-with-unit">
              <input
                ref={(node) => {
                  fieldRefs.current.actualContributionMonths =
                    node ?? undefined
                }}
                id="ideco-actual-months"
                type="text"
                inputMode="numeric"
                value={actualContributionMonths}
                aria-invalid={Boolean(
                  visibleErrors.actualContributionMonths,
                )}
                aria-describedby={getErrorDescription(
                  'actualContributionMonths',
                )}
                onChange={(event) => {
                  setActualContributionMonths(
                    normalizeDecimalInput(event.target.value),
                  )
                  invalidateManualResult()
                }}
                placeholder="例：12"
              />
              <span>か月</span>
            </div>
            <p className="ideco-field__help">
              この年に実際に掛金を拠出する月数（1〜12か月）です。
            </p>
            {visibleErrors.actualContributionMonths && (
              <p
                id="ideco-actualContributionMonths-error"
                className="ideco-field__error"
              >
                {visibleErrors.actualContributionMonths}
              </p>
            )}
          </div>

          <div
            id="ideco-income-tax-rate-field"
            className="calculator-field"
          >
            <div className="field-label-row">
              <label htmlFor="ideco-income-tax-rate-select">
                所得税率
              </label>

              <span className="tooltip-container">
                <button
                  className="tooltip-button"
                  type="button"
                  aria-label="課税所得についての説明"
                  aria-describedby="taxable-income-tooltip"
                >
                  ?
                </button>

                <span
                  id="taxable-income-tooltip"
                  className="tooltip-content"
                  role="tooltip"
                >
                  課税所得は、給与収入から給与所得控除や
                  社会保険料控除、基礎控除などを
                  差し引いた後の金額です。
                </span>
              </span>
            </div>

            <div className="tax-rate-select">
              <div
                className="tax-rate-select-display"
                aria-hidden="true"
              >
                <strong className="tax-rate-value">
                  {selectedIncomeTaxRate
                    ? `${selectedIncomeTaxRate.rate}%`
                    : '未選択'}
                </strong>

                <span className="tax-rate-divider">
                  |
                </span>

                <span className="tax-rate-guide">
                  {selectedIncomeTaxRate
                    ? selectedIncomeTaxRate.taxableIncomeGuide
                    : '所得税率を選択してください'}
                </span>

                <span className="tax-rate-arrow">
                  ▼
                </span>
              </div>

              <select
                ref={(node) => {
                  fieldRefs.current.incomeTaxRate = node ?? undefined
                }}
                id="ideco-income-tax-rate-select"
                className="tax-rate-native-select"
                value={incomeTaxRate}
                aria-label="所得税率"
                aria-invalid={Boolean(visibleErrors.incomeTaxRate)}
                aria-describedby={getErrorDescription('incomeTaxRate')}
                onChange={(event) =>
                  handleIncomeTaxRateChange(
                    event.target.value,
                  )
                }
              >
                <option value="">選択してください</option>
                {incomeTaxRates.map((item) => (
                  <option
                    key={item.rate}
                    value={item.rate}
                  >
                    {item.rate}%｜{item.taxableIncomeGuide}
                  </option>
                ))}
              </select>
            </div>
            {visibleErrors.incomeTaxRate && (
              <p
                id="ideco-incomeTaxRate-error"
                className="ideco-field__error"
              >
                {visibleErrors.incomeTaxRate}
              </p>
            )}
          </div>

          <button
            className="calculator-helper-link"
            type="button"
            onClick={openTaxableIncomeCalculator}
          >
            自分の所得税率を調べる
          </button>

          <div className="ideco-field">
            <label htmlFor="ideco-resident-tax-rate">
              住民税所得割率
            </label>

            <div className="input-with-unit">
              <input
                ref={(node) => {
                  fieldRefs.current.residentTaxRate = node ?? undefined
                }}
                id="ideco-resident-tax-rate"
                type="text"
                inputMode="decimal"
                value={residentTaxRate}
                aria-invalid={Boolean(visibleErrors.residentTaxRate)}
                aria-describedby={getErrorDescription('residentTaxRate')}
                onChange={(event) => {
                  const value = event.target.value

                  if (
                    event.nativeEvent instanceof InputEvent &&
                    event.nativeEvent.isComposing
                  ) {
                    handleResidentTaxRateChange(
                      value,
                    )
                    return
                  }

                  handleResidentTaxRateChange(
                    normalizeDecimalInput(value),
                  )
                }}
                onCompositionEnd={(event) => {
                  handleResidentTaxRateChange(
                    normalizeDecimalInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                onBlur={(event) => {
                  handleResidentTaxRateChange(
                    normalizeDecimalInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                placeholder="例：10"
              />

              <span>%</span>
            </div>
            <p className="ideco-field__help">
              ご自身の住民税所得割率を入力してください。標準値は自動設定しません。
            </p>
            {visibleErrors.residentTaxRate && (
              <p
                id="ideco-residentTaxRate-error"
                className="ideco-field__error"
              >
                {visibleErrors.residentTaxRate}
              </p>
            )}
          </div>

          <div className="ideco-field">
            <label htmlFor="ideco-reference-years">
              長期参考期間
            </label>

            <div className="input-with-unit">
              <input
                ref={(node) => {
                  fieldRefs.current.referenceYears = node ?? undefined
                }}
                id="ideco-reference-years"
                type="text"
                inputMode="numeric"
                value={contributionYears}
                aria-invalid={Boolean(visibleErrors.referenceYears)}
                aria-describedby={getErrorDescription('referenceYears')}
                onChange={(event) => {
                  const value = event.target.value

                  if (
                    event.nativeEvent instanceof InputEvent &&
                    event.nativeEvent.isComposing
                  ) {
                    handleContributionYearsChange(
                      value,
                    )
                    return
                  }

                  handleContributionYearsChange(
                    normalizeDecimalInput(value),
                  )
                }}
                onCompositionEnd={(event) => {
                  handleContributionYearsChange(
                    normalizeDecimalInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                onBlur={(event) => {
                  handleContributionYearsChange(
                    normalizeDecimalInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                placeholder="例：20"
              />

              <span>年</span>
            </div>
            <p className="ideco-field__help">
              税率・掛金・制度が毎年変わらないと仮定した参考期間です。
            </p>
            {visibleErrors.referenceYears && (
              <p
                id="ideco-referenceYears-error"
                className="ideco-field__error"
              >
                {visibleErrors.referenceYears}
              </p>
            )}
          </div>

          <div
            className="form-spacer"
            aria-hidden="true"
          ></div>

          <div className="calculation-mode">
            <label className="mode-checkbox">
              <input
                type="checkbox"
                checked={isAutoCalculation}
                onChange={(event) =>
                  changeCalculationMode(
                    event.target.checked,
                  )
                }
              />

              <span>
                入力と同時に計算結果を更新する
              </span>
            </label>

            <p>
              {isAutoCalculation
                ? '入力内容を変更すると、結果が自動更新されます。'
                : 'シミュレートボタンを押すと結果が表示されます。'}
            </p>
          </div>

          <div
            className="simulator-form-actions"
            data-single={isAutoCalculation}
          >
            <button
              className="reset-button"
              type="button"
              onClick={resetCalculator}
            >
              入力内容をリセット
            </button>

            {!isAutoCalculation && (
              <button
                className="simulate-button"
                type="button"
                onClick={simulate}
              >
                シミュレートする
              </button>
            )}
          </div>

          <aside className="simulator-input-point simulator-input-point--ideco">
            <strong>入力のポイント</strong>
            <p>
              加入区分と制度適用日による上限を確認し、実際に拠出する月数で概算します。
            </p>
          </aside>
        </div>

        <div className="calculator-results">
          <div className="simulator-results-heading">
            <div>
              <p>RESULT</p>
              <h3>シミュレーション結果</h3>
            </div>
            <span>所得税・住民税の軽減額</span>
          </div>

          <p className="sr-only" aria-live="polite">
            {displayedResult.annualTaxSaving === null
              ? ''
              : `年間節税効果は${formatYen(displayedResult.annualTaxSaving)}です。`}
          </p>

          {displayedCalculation && (
            <aside className="ideco-result-context">
              <strong>{displayedCalculation.regimeLabel}</strong>
              <span>{displayedCalculation.participantLabel}</span>
              <span>計算モード：簡易税率モード</span>
              <span>
                制度適用日：{input.effectiveDate}
              </span>
              <span>
                実拠出月数：{input.actualContributionMonths}か月
              </span>
              <span>
                月額上限：
                {displayedCalculation.contributionLimit.monthlyLimit.toLocaleString('ja-JP')}円
              </span>
            </aside>
          )}

          <div className="ideco-kpi-grid" aria-label="iDeCoの主要結果">
          <div className="simulator-summary-grid simulator-summary-grid--ideco">
            <div className="result-card">
              <span>年間の所得税軽減額</span>

              <strong>
                {displayedResult
                  .incomeTaxSaving === null
                  ? '―'
                  : formatYen(
                    displayedResult
                      .incomeTaxSaving,
                  )}
              </strong>

              <small>
                {specialIncomeTaxDescription}
              </small>
            </div>

            <div className="result-card">
              <span>年間の住民税軽減額</span>

              <strong>
                {displayedResult
                  .residentTaxSaving === null
                  ? '―'
                  : formatYen(
                    displayedResult
                      .residentTaxSaving,
                  )}
              </strong>

              <small>
                年間掛金額 × 住民税率
              </small>
            </div>

            <div className="result-card emphasis-result">
              <span>年間節税効果（合計）</span>

              <strong>
                {displayedResult
                  .annualTaxSaving === null
                  ? '―'
                  : formatYen(
                    displayedResult
                      .annualTaxSaving,
                  )}
              </strong>

              <small>
                所得税軽減額＋住民税軽減額
              </small>
            </div>

          </div>

          <div className="ideco-longterm-summary" aria-label="掛金と節税効果の期間累計">
            <div className="result-card">
              <span>年間掛金額</span>

              <strong>
                {displayedResult
                  .annualContribution === null
                  ? '―'
                  : formatYen(
                    displayedResult
                      .annualContribution,
                  )}
              </strong>

              <small>
                毎月の掛金 × 実拠出月数
              </small>
            </div>

            <div className="result-card result-card--contribution-total">
              <span>掛金累計</span>

              <strong>
                {displayedResult
                  .totalContribution === null
                  ? '―'
                  : formatYen(
                    displayedResult
                      .totalContribution,
                  )}
              </strong>

              <small>
                年間掛金額 × 長期参考期間
              </small>
            </div>

            <div className="result-card result-card--total">
              <span>期間中の節税額合計</span>

              <strong>
                {displayedResult
                  .totalTaxSaving === null
                  ? '―'
                  : formatYen(
                    displayedResult
                      .totalTaxSaving,
                  )}
              </strong>

              <small>
                年間節税額 × 長期参考期間
              </small>
            </div>
          </div>
          </div>

          <div className="ideco-visual-grid">
            <div className="simulator-chart-panel simulator-chart-panel--ideco">
              <div className="simulator-subheading">
                <div>
                  <p>LONG-TERM TRAJECTORY</p>
                  <h3>掛金累計と節税効果の推移</h3>
                </div>
                <span>{years > 0 ? `${years.toLocaleString('ja-JP')}年間` : '条件入力後に表示'}</span>
              </div>

              {idecoAreaGraph ? (
                <div className="ideco-trajectory-wrap">
                  <div className="ideco-trajectory-legend" aria-hidden="true">
                    <span><i />掛金累計</span>
                    <span><i />節税額累計</span>
                  </div>
                  <div className="ideco-area-graph" aria-label="掛金累計と期間中の節税額推移グラフ">
                    <svg viewBox="0 0 600 200" role="img" aria-hidden="true" preserveAspectRatio="none">
                      <g className="ideco-area-graph__grid">
                        <line x1="0" y1="30" x2="600" y2="30" />
                        <line x1="0" y1="80" x2="600" y2="80" />
                        <line x1="0" y1="130" x2="600" y2="130" />
                        <line x1="0" y1="180" x2="600" y2="180" />
                      </g>
                      <polygon className="ideco-area-graph__contribution" points={idecoAreaGraph.contributionArea} />
                      <polygon className="ideco-area-graph__saving" points={idecoAreaGraph.savingArea} />
                      <polyline className="ideco-area-graph__contribution-line" points={idecoAreaGraph.contributionLine} />
                      <polyline className="ideco-area-graph__saving-line" points={idecoAreaGraph.savingLine} />
                    </svg>
                    <div className="ideco-area-graph__labels" aria-hidden="true">
                      {idecoTrajectory.map((point) => (
                        <span key={point.ratio}>{point.label}</span>
                      ))}
                    </div>
                  </div>
                  <p className="ideco-trajectory-note">掛金累計には運用益を含みません。</p>
                </div>
              ) : (
                <div className="ideco-area-graph ideco-area-graph--empty" aria-label="掛金累計と節税額推移（未計算）">
                  <svg viewBox="0 0 600 200" aria-hidden="true" preserveAspectRatio="none">
                    <g className="ideco-area-graph__grid">
                      <line x1="0" y1="30" x2="600" y2="30" />
                      <line x1="0" y1="80" x2="600" y2="80" />
                      <line x1="0" y1="130" x2="600" y2="130" />
                      <line x1="0" y1="180" x2="600" y2="180" />
                    </g>
                    <polyline className="ideco-area-graph__placeholder" points="0,180 100,170 200,150 300,125 400,96 500,64 600,30" />
                  </svg>
                  <div className="ideco-area-graph__labels" aria-hidden="true">
                    <span>開始</span><span>―</span><span>―</span><span>―</span><span>―</span><span>―</span><span>終了</span>
                  </div>
                  <p>条件を入力すると、掛金累計と節税額を表示します。</p>
                </div>
              )}
            </div>

            <div className="simulator-breakdown-panel simulator-breakdown-panel--ideco">
              <div className="simulator-subheading">
                <div>
                  <p>ANNUAL BREAKDOWN</p>
                  <h3>年間節税額の内訳</h3>
                </div>
              </div>
              <div className="tax-saving-bars">
                <div>
                  <span>所得税</span>
                  <i><b style={{ width: `${displayedResult.annualTaxSaving && displayedResult.incomeTaxSaving !== null ? displayedResult.incomeTaxSaving / displayedResult.annualTaxSaving * 100 : 0}%` }} /></i>
                  <strong>{displayedResult.incomeTaxSaving === null ? '―' : formatYen(displayedResult.incomeTaxSaving)}</strong>
                </div>
                <div>
                  <span>住民税</span>
                  <i><b style={{ width: `${displayedResult.annualTaxSaving && displayedResult.residentTaxSaving !== null ? displayedResult.residentTaxSaving / displayedResult.annualTaxSaving * 100 : 0}%` }} /></i>
                  <strong>{displayedResult.residentTaxSaving === null ? '―' : formatYen(displayedResult.residentTaxSaving)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="calculator-note">
        本シミュレーターは概算です。
        実際の税額は課税所得、所得控除、
        税率区分、掛金の拠出月数などにより
        異なります。運用益、手数料、
        受取時の税金は含んでいません。
      </p>
    </section>
  )
}

export default IdecoCalculator
