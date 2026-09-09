import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import MoneyInput from './components/form/MoneyInput'
import {
  createIdecoConsultationSummaryText,
  formatIdecoYen,
  getIdecoCalculationModeLabel,
  getIdecoEligibilitySummary,
  IDECO_CONFIRMATION_ITEMS,
  IDECO_PRIMARY_SOURCES,
  IDECO_UNCONSIDERED_ITEMS,
  type IdecoConsultationRecord,
} from './idecoConsultationSummary'
import {
  calculateIdeco,
  roundHalfUp,
  type IdecoCalculationSuccess,
} from './idecoCalculation'
import {
  getIdecoContributionLimit,
  getIdecoParticipantLabel,
  getIdecoRegimeLabel,
  getIdecoRelatedContributionLabel,
  IDECO_PARTICIPANT_OPTIONS,
  requiresIdecoRelatedContribution,
  type IdecoCalculationMode,
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
  'currentAge',
  'participantCategory',
  'relatedMonthlyContribution',
  'monthlyContribution',
  'actualContributionMonths',
  'incomeTaxRate',
  'taxableIncomeBeforeContribution',
  'residentTaxRate',
  'referenceYears',
]

type IdecoCalculatorProps = {
  initialIncomeTaxRate?: number
  onOpenTaxableIncome: () => void
}

type IdecoResetSnapshot = {
  calculationMode: IdecoCalculationMode
  effectiveDate: string
  currentAge: string
  participantCategory: IdecoParticipantCategory | ''
  relatedMonthlyContribution: string
  monthlyContribution: string
  actualContributionMonths: string
  incomeTaxRate: string
  taxableIncomeBeforeContribution: string
  residentTaxRate: string
  contributionYears: string
  isAutoCalculation: boolean
}

type IdecoSummaryActionStatus = 'copied' | 'copy-error' | null

function IdecoCalculator({
  initialIncomeTaxRate,
  onOpenTaxableIncome,
}: IdecoCalculatorProps) {
  const [calculationMode, setCalculationMode] =
    useState<IdecoCalculationMode>('simple')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [currentAge, setCurrentAge] = useState('')
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
  const [taxableIncomeBeforeContribution, setTaxableIncomeBeforeContribution] =
    useState('')
  const [residentTaxRate, setResidentTaxRate] =
    useState('')
  const [contributionYears, setContributionYears] =
    useState('')
  const [isAutoCalculation, setIsAutoCalculation] =
    useState(false)
  const [manualResult, setManualResult] =
    useState<IdecoCalculationSuccess | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [resetSnapshot, setResetSnapshot] =
    useState<IdecoResetSnapshot | null>(null)
  const [summaryActionStatus, setSummaryActionStatus] =
    useState<IdecoSummaryActionStatus>(null)
  const [liveMessage, setLiveMessage] = useState('')
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const summaryStatusTimerRef = useRef<number | null>(null)
  const copyRequestIdRef = useRef(0)
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
      calculationMode,
      effectiveDate,
      currentAge: parseDecimalValue(currentAge),
      participantCategory,
      relatedMonthlyContribution:
        parseMoneyValue(relatedMonthlyContribution),
      monthlyContribution:
        parseMoneyValue(monthlyContribution),
      actualContributionMonths:
        parseDecimalValue(actualContributionMonths),
      incomeTaxRate: parseDecimalValue(incomeTaxRate),
      taxableIncomeBeforeContribution:
        parseMoneyValue(taxableIncomeBeforeContribution),
      residentTaxRate: parseDecimalValue(residentTaxRate),
      referenceYears: parseDecimalValue(contributionYears),
    }),
    [
      calculationMode,
      effectiveDate,
      currentAge,
      participantCategory,
      relatedMonthlyContribution,
      monthlyContribution,
      actualContributionMonths,
      incomeTaxRate,
      taxableIncomeBeforeContribution,
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
  const detailedTax = rawDisplayedResult?.detailedTax ?? null
  const consultationRecord = useMemo<IdecoConsultationRecord | null>(() => {
    if (
      displayedCalculation === null ||
      input.currentAge === null ||
      !input.participantCategory ||
      input.monthlyContribution === null ||
      input.actualContributionMonths === null ||
      input.residentTaxRate === null ||
      input.referenceYears === null
    ) {
      return null
    }

    return {
      input: {
        calculationMode: input.calculationMode,
        effectiveDate: input.effectiveDate,
        currentAge: input.currentAge,
        participantCategory: input.participantCategory,
        relatedMonthlyContribution: input.relatedMonthlyContribution,
        monthlyContribution: input.monthlyContribution,
        actualContributionMonths: input.actualContributionMonths,
        incomeTaxRate: input.incomeTaxRate,
        taxableIncomeBeforeContribution:
          input.taxableIncomeBeforeContribution,
        residentTaxRate: input.residentTaxRate,
        referenceYears: input.referenceYears,
      },
      calculation: displayedCalculation,
    }
  }, [displayedCalculation, input])
  const consultationSummary = useMemo(
    () => consultationRecord
      ? createIdecoConsultationSummaryText(consultationRecord)
      : null,
    [consultationRecord],
  )
  const years = input.referenceYears ?? 0
  const selectedCategory = participantCategory || null
  const needsRelatedContribution = Boolean(
    selectedCategory &&
    requiresIdecoRelatedContribution(selectedCategory),
  )
  const contributionLimit = getIdecoContributionLimit(input)
  const specialIncomeTaxDescription =
    input.effectiveDate >= '2027-01-01'
      ? '防衛特別所得税1%・復興特別所得税1.1%を含む概算'
      : '復興特別所得税2.1%を含む概算'
  const calculationModeLabel = calculationMode === 'simple'
    ? '簡易税率モード'
    : '詳細課税所得モード'
  const incomeTaxResultDescription = calculationMode === 'detailed'
    ? `控除前後の所得税額の差（${specialIncomeTaxDescription}）`
    : specialIncomeTaxDescription

  const fieldsWithValues: Record<IdecoRuleField, boolean> = {
    effectiveDate: effectiveDate !== '',
    currentAge: currentAge !== '',
    participantCategory: participantCategory !== '',
    relatedMonthlyContribution:
      relatedMonthlyContribution !== '',
    monthlyContribution: monthlyContribution !== '',
    actualContributionMonths:
      actualContributionMonths !== '',
    incomeTaxRate: incomeTaxRate !== '',
    taxableIncomeBeforeContribution:
      taxableIncomeBeforeContribution !== '',
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

  useEffect(() => {
    copyRequestIdRef.current += 1
    setSummaryActionStatus(null)

    if (summaryStatusTimerRef.current !== null) {
      window.clearTimeout(summaryStatusTimerRef.current)
      summaryStatusTimerRef.current = null
    }
  }, [displayedCalculation])

  useEffect(() => () => {
    copyRequestIdRef.current += 1

    if (summaryStatusTimerRef.current !== null) {
      window.clearTimeout(summaryStatusTimerRef.current)
    }
  }, [])

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

  const dismissResetUndo = () => {
    setResetSnapshot(null)
  }

  const invalidateManualResult = () => {
    dismissResetUndo()
    setLiveMessage('')
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

  const handleTaxableIncomeChange = (value: string) => {
    setTaxableIncomeBeforeContribution(value)
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
    const shouldOfferUndo =
      calculationMode !== 'simple' ||
      effectiveDate !== '' ||
      currentAge !== '' ||
      participantCategory !== '' ||
      relatedMonthlyContribution !== '' ||
      monthlyContribution !== '' ||
      actualContributionMonths !== '' ||
      incomeTaxRate !== '' ||
      taxableIncomeBeforeContribution !== '' ||
      residentTaxRate !== '' ||
      contributionYears !== '' ||
      isAutoCalculation

    setResetSnapshot(shouldOfferUndo
      ? {
          calculationMode,
          effectiveDate,
          currentAge,
          participantCategory,
          relatedMonthlyContribution,
          monthlyContribution,
          actualContributionMonths,
          incomeTaxRate,
          taxableIncomeBeforeContribution,
          residentTaxRate,
          contributionYears,
          isAutoCalculation,
        }
      : null)
    setCalculationMode('simple')
    setEffectiveDate('')
    setCurrentAge('')
    setParticipantCategory('')
    setRelatedMonthlyContribution('')
    setMonthlyContribution('')
    setActualContributionMonths('')
    setIncomeTaxRate('')
    setTaxableIncomeBeforeContribution('')
    setResidentTaxRate('')
    setContributionYears('')
    setIsAutoCalculation(false)
    setManualResult(null)
    setHasSubmitted(false)
    setLiveMessage(
      shouldOfferUndo ? '入力内容をリセットしました。' : '',
    )
  }

  const restoreReset = () => {
    if (resetSnapshot === null) return

    setCalculationMode(resetSnapshot.calculationMode)
    setEffectiveDate(resetSnapshot.effectiveDate)
    setCurrentAge(resetSnapshot.currentAge)
    setParticipantCategory(resetSnapshot.participantCategory)
    setRelatedMonthlyContribution(
      resetSnapshot.relatedMonthlyContribution,
    )
    setMonthlyContribution(resetSnapshot.monthlyContribution)
    setActualContributionMonths(
      resetSnapshot.actualContributionMonths,
    )
    setIncomeTaxRate(resetSnapshot.incomeTaxRate)
    setTaxableIncomeBeforeContribution(
      resetSnapshot.taxableIncomeBeforeContribution,
    )
    setResidentTaxRate(resetSnapshot.residentTaxRate)
    setContributionYears(resetSnapshot.contributionYears)
    setIsAutoCalculation(resetSnapshot.isAutoCalculation)
    setManualResult(null)
    setHasSubmitted(false)
    setResetSnapshot(null)
    setLiveMessage('入力内容を元に戻しました。')
  }

  const changeCalculationMode = (
    checked: boolean,
  ) => {
    dismissResetUndo()
    setIsAutoCalculation(checked)
    setManualResult(null)
    setHasSubmitted(false)
  }

  const changeTaxCalculationMode = (
    nextMode: IdecoCalculationMode,
  ) => {
    if (nextMode === calculationMode) {
      return
    }

    setCalculationMode(nextMode)
    invalidateManualResult()
  }

  const openTaxableIncomeCalculator = () => {
    onOpenTaxableIncome()
  }

  const useStandardResidentTaxRate = () => {
    handleResidentTaxRateChange('10')
  }

  const copyConsultationSummary = async () => {
    if (consultationSummary === null) return

    if (summaryStatusTimerRef.current !== null) {
      window.clearTimeout(summaryStatusTimerRef.current)
      summaryStatusTimerRef.current = null
    }

    const requestId = copyRequestIdRef.current + 1
    copyRequestIdRef.current = requestId

    try {
      await navigator.clipboard.writeText(consultationSummary)

      if (requestId !== copyRequestIdRef.current) return

      setSummaryActionStatus('copied')
      summaryStatusTimerRef.current = window.setTimeout(() => {
        if (requestId === copyRequestIdRef.current) {
          setSummaryActionStatus(null)
          summaryStatusTimerRef.current = null
        }
      }, 3000)
    } catch {
      if (requestId !== copyRequestIdRef.current) return
      setSummaryActionStatus('copy-error')
    }
  }

  const printConsultationSummary = () => {
    if (consultationSummary === null) return
    window.print()
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
          毎月の掛金と税率・課税所得から、
          iDeCoによる所得税・住民税の軽減額を
          概算します。
        </p>
      </div>

      <p className="sr-only" aria-live="polite">
        {liveMessage}
      </p>

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

          <div
            className="ideco-tax-mode-selector"
            role="group"
            aria-labelledby="ideco-tax-mode-label"
          >
            <strong id="ideco-tax-mode-label">計算方法</strong>
            <div>
              <button
                type="button"
                aria-pressed={calculationMode === 'simple'}
                onClick={() => changeTaxCalculationMode('simple')}
              >
                <span>簡易税率で計算</span>
                <small>確認した税率から概算</small>
              </button>
              <button
                type="button"
                aria-pressed={calculationMode === 'detailed'}
                onClick={() => changeTaxCalculationMode('detailed')}
              >
                <span>課税所得から詳しく計算</span>
                <small>控除前後の所得税額を比較</small>
              </button>
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

          <div className="ideco-field">
            <label htmlFor="ideco-current-age">
              現在の年齢
            </label>
            <div className="input-with-unit">
              <input
                ref={(node) => {
                  fieldRefs.current.currentAge = node ?? undefined
                }}
                id="ideco-current-age"
                type="text"
                inputMode="numeric"
                value={currentAge}
                aria-invalid={Boolean(visibleErrors.currentAge)}
                aria-describedby={`ideco-current-age-help${visibleErrors.currentAge ? ' ideco-currentAge-error' : ''}`}
                onChange={(event) => {
                  setCurrentAge(
                    normalizeDecimalInput(event.target.value),
                  )
                  invalidateManualResult()
                }}
                placeholder="例：40"
              />
              <span>歳</span>
            </div>
            <p id="ideco-current-age-help" className="ideco-field__help">
              年齢だけで加入期間や受給開始年齢を推測せず、制度上の基本年齢範囲だけを確認します。
            </p>
            {visibleErrors.currentAge && (
              <p
                id="ideco-currentAge-error"
                className="ideco-field__error"
              >
                {visibleErrors.currentAge}
              </p>
            )}
          </div>

          <div className="ideco-field">
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
              <span>計算モード：{calculationModeLabel}</span>
              <p>
                この条件での月額上限は
                <b>{contributionLimit.monthlyLimit.toLocaleString('ja-JP')}円</b>
                です。
              </p>
            </aside>
          )}

          <p className="ideco-tax-mode-note">
            {calculationMode === 'simple'
              ? '税率区分をまたぐ場合などは実額と異なるため、課税所得から詳しく計算する方法も選べます。'
              : '掛金全額に1つの税率を掛けず、控除前後の所得税額の差を計算します。'}
          </p>

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

          {calculationMode === 'simple' ? (
            <>
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

                    <span className="tax-rate-divider">|</span>

                    <span className="tax-rate-guide">
                      {selectedIncomeTaxRate
                        ? selectedIncomeTaxRate.taxableIncomeGuide
                        : '所得税率を選択してください'}
                    </span>

                    <span className="tax-rate-arrow">▼</span>
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
                      handleIncomeTaxRateChange(event.target.value)
                    }
                  >
                    <option value="">選択してください</option>
                    {incomeTaxRates.map((item) => (
                      <option key={item.rate} value={item.rate}>
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
            </>
          ) : (
            <div className="ideco-field ideco-field--wide ideco-taxable-income-field">
              <label htmlFor="ideco-taxable-income-before">
                掛金控除前の課税所得
              </label>
              <div className="input-with-unit">
                <MoneyInput
                  ref={(node) => {
                    fieldRefs.current.taxableIncomeBeforeContribution =
                      node ?? undefined
                  }}
                  id="ideco-taxable-income-before"
                  value={taxableIncomeBeforeContribution}
                  onValueChange={handleTaxableIncomeChange}
                  aria-invalid={Boolean(
                    visibleErrors.taxableIncomeBeforeContribution,
                  )}
                  aria-describedby={getErrorDescription(
                    'taxableIncomeBeforeContribution',
                  )}
                  placeholder="例：3,500,000"
                />
                <span>円</span>
              </div>
              <p className="ideco-field__help">
                給与収入ではなく、各種所得控除を差し引いた後の所得税の課税所得を入力してください。
              </p>
              {visibleErrors.taxableIncomeBeforeContribution && (
                <p
                  id="ideco-taxableIncomeBeforeContribution-error"
                  className="ideco-field__error"
                >
                  {visibleErrors.taxableIncomeBeforeContribution}
                </p>
              )}
            </div>
          )}

          <div className="ideco-field">
            <div className="ideco-field-label-row">
              <label htmlFor="ideco-resident-tax-rate">
                住民税所得割率
              </label>
              <span className="ideco-info-tooltip">
                <button
                  type="button"
                  className="ideco-info-tooltip__trigger"
                  aria-label="住民税所得割率の確認方法"
                  aria-describedby="ideco-resident-tax-tooltip"
                >
                  i
                </button>
                <span
                  id="ideco-resident-tax-tooltip"
                  className="ideco-info-tooltip__content"
                  role="tooltip"
                >
                  通常の給与所得などでは、市区町村民税と都道府県民税を合わせて10%となることが一般的です。
                  所得の種類や課税方式によって異なる場合があるため、お住まいの市区町村の公式情報や住民税の税額決定通知書でご確認ください。
                </span>
              </span>
            </div>

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
            <button
              className="ideco-resident-tax-helper"
              type="button"
              onClick={useStandardResidentTaxRate}
            >
              一般的な標準税率10%を入力
            </button>
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

          {resetSnapshot && (
            <div
              className="ideco-reset-undo"
              role="group"
              aria-label="リセットの取り消し"
            >
              <strong>入力内容をリセットしました。</strong>
              <button type="button" onClick={restoreReset}>
                元に戻す
              </button>
            </div>
          )}

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
              <span>計算モード：{calculationModeLabel}</span>
              <span>
                現在の年齢：{input.currentAge}歳
              </span>
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
                {incomeTaxResultDescription}
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

          {detailedTax && (
            <section
              className="ideco-detailed-tax-breakdown"
              aria-labelledby="ideco-detailed-tax-title"
            >
              <div>
                <p>DETAILED TAX BREAKDOWN</p>
                <h3 id="ideco-detailed-tax-title">
                  課税所得と所得税額の変化
                </h3>
              </div>
              <dl>
                <div>
                  <dt>掛金控除前課税所得</dt>
                  <dd>{formatYen(detailedTax.taxableIncomeBeforeContribution)}</dd>
                </div>
                <div>
                  <dt>iDeCo所得控除額</dt>
                  <dd>{formatYen(detailedTax.idecoIncomeDeduction)}</dd>
                </div>
                <div>
                  <dt>掛金控除後課税所得</dt>
                  <dd>{formatYen(detailedTax.taxableIncomeAfterContribution)}</dd>
                </div>
                <div>
                  <dt>所得税の適用税率</dt>
                  <dd>
                    {(detailedTax.before.marginalRate * 100).toLocaleString('ja-JP')}%
                    <span aria-hidden="true"> → </span>
                    <span className="sr-only">から</span>
                    {(detailedTax.after.marginalRate * 100).toLocaleString('ja-JP')}%
                  </dd>
                </div>
                <div>
                  <dt>控除前の所得税額</dt>
                  <dd>{formatYen(roundHalfUp(detailedTax.before.totalIncomeTax))}</dd>
                </div>
                <div>
                  <dt>控除後の所得税額</dt>
                  <dd>{formatYen(roundHalfUp(detailedTax.after.totalIncomeTax))}</dd>
                </div>
              </dl>
              <p>
                掛金全額に1つの税率を掛けた金額ではなく、控除前後の所得税額の差から算出しています。
                所得税の課税所得は1,000円未満を切り捨てて計算します。
              </p>
            </section>
          )}

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

      {consultationRecord && (
        <section
          className="ideco-consultation-summary"
          aria-labelledby="ideco-consultation-summary-title"
        >
          <header className="ideco-consultation-summary__heading">
            <div>
              <p>CONSULTATION SUMMARY</p>
              <h3 id="ideco-consultation-summary-title">
                相談用サマリー
              </h3>
              <span>
                金融機関・勤務先・年金事務所・税務専門家への相談時に、入力条件と概算結果を確認するための資料です。
              </span>
            </div>
            <div className="ideco-consultation-summary__actions">
              <button type="button" onClick={copyConsultationSummary}>
                相談用サマリーをコピー
              </button>
              <button type="button" onClick={printConsultationSummary}>
                印刷する
              </button>
            </div>
          </header>

          {summaryActionStatus && (
            <p
              className="ideco-consultation-summary__status"
              data-tone={summaryActionStatus === 'copied' ? 'success' : 'error'}
              role="status"
            >
              {summaryActionStatus === 'copied'
                ? '相談用サマリーをコピーしました。'
                : 'コピーできませんでした。もう一度お試しください。'}
            </p>
          )}

          <IdecoConsultationSummaryContent record={consultationRecord} />
        </section>
      )}

      <aside className="ideco-privacy-note" aria-label="入力データの取り扱い">
        <strong>入力データについて</strong>
        <p>
          入力した金額や条件は、このページでの計算にのみ使用します。保存・外部送信・広告利用・AI学習には利用しません。
        </p>
      </aside>

      <p className="calculator-note">
        本シミュレーターは概算です。
        実際の税額は課税所得、所得控除、
        税率区分、掛金の拠出月数などにより
        異なります。運用益、手数料、
        受取時の税金は含んでいません。
        原則60歳まで資産を引き出せず、受給開始可能年齢は通算加入期間等で異なります。
      </p>
    </section>
  )
}

const IdecoConsultationSummaryContent = ({
  record,
}: {
  record: IdecoConsultationRecord
}) => {
  const { input, calculation } = record
  const { rounded, detailedTax } = calculation.result
  const hasRelatedContribution = requiresIdecoRelatedContribution(
    input.participantCategory,
  )

  return (
    <div
      className="ideco-consultation-summary__content"
      aria-label="相談用サマリー本文"
    >
      <header className="ideco-consultation-summary__document-heading">
        <p>沖縄マネーガイド</p>
        <h4>iDeCo節税シミュレーター 相談用サマリー</h4>
        <span>
          入力条件と概算結果を整理した、相談時の確認用資料です。
        </span>
      </header>

      <section className="ideco-consultation-summary__section">
        <h5>入力条件</h5>
        <dl>
          <div>
            <dt>計算モード</dt>
            <dd>{getIdecoCalculationModeLabel(input.calculationMode)}</dd>
          </div>
          <div><dt>制度適用日</dt><dd>{input.effectiveDate}</dd></div>
          <div><dt>適用制度</dt><dd>{calculation.regimeLabel}</dd></div>
          <div><dt>現在の年齢</dt><dd>{input.currentAge}歳</dd></div>
          <div><dt>加入区分</dt><dd>{calculation.participantLabel}</dd></div>
          <div><dt>毎月の掛金</dt><dd>{formatIdecoYen(input.monthlyContribution)}</dd></div>
          <div><dt>実拠出月数</dt><dd>{input.actualContributionMonths}か月</dd></div>
          <div><dt>年間掛金</dt><dd>{formatIdecoYen(rounded.annualContribution)}</dd></div>
          {hasRelatedContribution && (
            <div>
              <dt>{getIdecoRelatedContributionLabel(input.participantCategory)}</dt>
              <dd>{formatIdecoYen(input.relatedMonthlyContribution ?? 0)}</dd>
            </div>
          )}
          {input.calculationMode === 'simple' ? (
            <div><dt>所得税率</dt><dd>{input.incomeTaxRate}%</dd></div>
          ) : (
            <div>
              <dt>掛金控除前の課税所得</dt>
              <dd>{formatIdecoYen(input.taxableIncomeBeforeContribution ?? 0)}</dd>
            </div>
          )}
          <div><dt>住民税所得割率</dt><dd>{input.residentTaxRate}%</dd></div>
          <div><dt>長期参考期間</dt><dd>{input.referenceYears}年</dd></div>
        </dl>
        <p className="ideco-consultation-summary__supplement">
          {getIdecoEligibilitySummary(record)}
        </p>
      </section>

      <section className="ideco-consultation-summary__section">
        <h5>概算結果</h5>
        <dl>
          <div><dt>年間所得税軽減額</dt><dd>{formatIdecoYen(rounded.incomeTaxSaving)}</dd></div>
          <div><dt>年間住民税軽減額</dt><dd>{formatIdecoYen(rounded.residentTaxSaving)}</dd></div>
          <div><dt>年間節税効果</dt><dd>{formatIdecoYen(rounded.annualTaxSaving)}</dd></div>
          <div><dt>年間掛金</dt><dd>{formatIdecoYen(rounded.annualContribution)}</dd></div>
          <div><dt>掛金累計</dt><dd>{formatIdecoYen(rounded.totalContribution)}</dd></div>
          <div><dt>期間中の節税額合計</dt><dd>{formatIdecoYen(rounded.totalTaxSaving)}</dd></div>
          {detailedTax && (
            <>
              <div><dt>控除前課税所得</dt><dd>{formatIdecoYen(detailedTax.taxableIncomeBeforeContribution)}</dd></div>
              <div><dt>iDeCo所得控除額</dt><dd>{formatIdecoYen(detailedTax.idecoIncomeDeduction)}</dd></div>
              <div><dt>控除後課税所得</dt><dd>{formatIdecoYen(detailedTax.taxableIncomeAfterContribution)}</dd></div>
            </>
          )}
        </dl>
      </section>

      <section className="ideco-consultation-summary__section">
        <h5>制度条件</h5>
        <dl>
          <div><dt>適用した制度基準</dt><dd>{calculation.regimeLabel}</dd></div>
          <div><dt>加入区分</dt><dd>{calculation.participantLabel}</dd></div>
          <div><dt>適用月額上限</dt><dd>{formatIdecoYen(calculation.contributionLimit.monthlyLimit)}</dd></div>
          <div>
            <dt>合算条件</dt>
            <dd>
              {hasRelatedContribution
                ? `${getIdecoRelatedContributionLabel(input.participantCategory)}との合算を反映`
                : 'この加入区分では合算対象額の入力なし'}
            </dd>
          </div>
        </dl>
      </section>

      <section className="ideco-consultation-summary__section">
        <h5>未考慮事項</h5>
        <ul>
          {IDECO_UNCONSIDERED_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="ideco-consultation-summary__section">
        <h5>金融機関・勤務先・年金事務所・税務専門家へ確認する項目</h5>
        <ul>
          {IDECO_CONFIRMATION_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="ideco-consultation-summary__section">
        <h5>一次資料</h5>
        <ul className="ideco-primary-source-list">
          {IDECO_PRIMARY_SOURCES.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${source.label}を新しいタブで開く`}
              >
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="ideco-consultation-summary__notice">
        本サマリーは相談時の条件整理を目的とした概算資料であり、申込書・税務証明ではありません。
        加入可否、正式な税額、運用成果、受取額を確定または保証するものではありません。
      </p>
    </div>
  )
}

export default IdecoCalculator
