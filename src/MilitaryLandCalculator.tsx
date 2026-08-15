import { useMemo, useRef, useState } from 'react'

type CalculationResult = {
  calculatedMultiple: number | null
  surfaceYield: number | null
  estimatedPrice: number | null
}

const emptyResult: CalculationResult = {
  calculatedMultiple: null,
  surfaceYield: null,
  estimatedPrice: null,
}

const MOBILE_VIEWPORT_QUERY = '(max-width: 760px)'

const scrollToMobileTarget = (target: HTMLElement | null) => {
  if (target === null ||
      !window.matchMedia(MOBILE_VIEWPORT_QUERY).matches) {
    return
  }

  const behavior = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
    ? 'auto'
    : 'smooth'

  window.requestAnimationFrame(() => {
    target.scrollIntoView({
      behavior,
      block: 'start',
    })
  })
}

const formatYen = (value: number) =>
  new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value)

/**
 * 全角の数字や記号を半角へ変換します。
 *
 * 例：
 * ３００，０００ → 300,000
 * ５０．５ → 50.5
 */
const convertToHalfWidth = (value: string) => {
  return value.normalize('NFKC')
}

/**
 * 金額欄から数字以外を取り除きます。
 */
const getMoneyDigits = (value: string) => {
  return convertToHalfWidth(value).replace(/[^\d]/g, '')
}

/**
 * 金額を3桁ごとのカンマ区切りにします。
 */
const formatMoneyInput = (value: string) => {
  const digits = getMoneyDigits(value)

  if (digits === '') {
    return ''
  }

  return Number(digits).toLocaleString('ja-JP')
}

/**
 * 倍率欄では数字と小数点1つだけを残します。
 *
 * 例：
 * ５０．５倍 → 50.5
 */
const normalizeMultipleInput = (value: string) => {
  const converted = convertToHalfWidth(value)
    .replace(/,/g, '')
    .replace(/[^\d.]/g, '')

  const [integerPart, ...decimalParts] = converted.split('.')

  if (decimalParts.length === 0) {
    return integerPart
  }

  return `${integerPart}.${decimalParts.join('')}`
}

/**
 * 入力内容から各計算結果を求めます。
 */
const calculateResults = (
  annualRent: string,
  purchasePrice: string,
  multiple: string,
): CalculationResult => {
  const rent = Number(getMoneyDigits(annualRent))
  const price = Number(getMoneyDigits(purchasePrice))
  const selectedMultiple = Number(normalizeMultipleInput(multiple))

  return {
    calculatedMultiple:
      rent > 0 && price > 0
        ? price / rent
        : null,

    surfaceYield:
      rent > 0 && price > 0
        ? (rent / price) * 100
        : null,

    estimatedPrice:
      rent > 0 && selectedMultiple > 0
        ? rent * selectedMultiple
        : null,
  }
}

function MilitaryLandCalculator() {
  const formRef = useRef<HTMLDivElement>(null)
  const annualRentInputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [annualRent, setAnnualRent] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [multiple, setMultiple] = useState('')

  /**
   * false：ボタンを押したときに計算
   * true：入力と同時に自動計算
   *
   * 初期値をfalseにしているため、
   * デフォルトはボタン計算方式です。
   */
  const [isAutoCalculation, setIsAutoCalculation] = useState(false)

  /**
   * ボタンを押して計算した結果を保存します。
   */
  const [manualResult, setManualResult] =
    useState<CalculationResult | null>(null)

  /**
   * 自動計算用の結果です。
   * 入力内容が変わるたびに再計算されます。
   */
  const autoResult = useMemo(
    () => calculateResults(
      annualRent,
      purchasePrice,
      multiple,
    ),
    [annualRent, purchasePrice, multiple],
  )

  /**
   * 現在の計算方式に応じて、
   * 表示する結果を切り替えます。
   */
  const displayedResult = isAutoCalculation
    ? autoResult
    : manualResult ?? emptyResult

  const hasDisplayedResult = Object.values(
    displayedResult,
  ).some((value) => value !== null)

  const rentValue = Number(getMoneyDigits(annualRent))
  const priceValue = Number(getMoneyDigits(purchasePrice))
  const multipleValue = Number(normalizeMultipleInput(multiple))

  /**
   * 年間借地料に加え、
   * 購入価格または倍率のどちらかが入力されていれば
   * シミュレートボタンを使用できます。
   */
  const canSimulate =
    rentValue > 0 &&
    (priceValue > 0 || multipleValue > 0)

  /**
   * 手動計算モード中に入力内容が変わった場合、
   * 古い結果を消します。
   *
   * 入力内容と結果が食い違うことを防ぐためです。
   */
  const clearManualResult = () => {
    if (!isAutoCalculation) {
      setManualResult(null)
    }
  }

  const handleAnnualRentChange = (value: string) => {
    setAnnualRent(value)
    clearManualResult()
  }

  const handlePurchasePriceChange = (value: string) => {
    setPurchasePrice(value)
    clearManualResult()
  }

  const handleMultipleChange = (value: string) => {
    setMultiple(value)
    clearManualResult()
  }

  const simulate = () => {
    setManualResult(
      calculateResults(
        annualRent,
        purchasePrice,
        multiple,
      ),
    )

    scrollToMobileTarget(resultsRef.current)
  }

  const returnToInputs = () => {
    scrollToMobileTarget(formRef.current)

    if (!window.matchMedia(MOBILE_VIEWPORT_QUERY).matches) {
      return
    }

    window.requestAnimationFrame(() => {
      annualRentInputRef.current?.focus({
        preventScroll: true,
      })
    })
  }

  const resetCalculator = () => {
    setAnnualRent('')
    setPurchasePrice('')
    setMultiple('')
    setManualResult(null)
  }

  const changeCalculationMode = (checked: boolean) => {
    setIsAutoCalculation(checked)
    setManualResult(null)
  }

  return (
    <section
      className="calculator"
      aria-labelledby="military-land-title"
    >
      <div className="calculator-heading calculator-heading--military">
        <p className="section-label">
          MILITARY LAND CALCULATOR
        </p>

        <h2 id="military-land-title">
          <span>軍用地利回り</span>
          <wbr />
          <span>シミュレーター</span>
        </h2>

        <p>
          <span className="text-keep">年間借地料と購入価格を</span>
          <wbr />
          <span className="text-keep">入力すると、</span>
          <wbr />
          <span className="text-keep">倍率と表面利回りを</span>
          <wbr />
          <span className="text-keep">計算します。</span>
        </p>
      </div>

      <div className="calculator-layout">
        <div
          className="calculator-form"
          ref={formRef}
        >
          <label>
            <span>年間借地料</span>

            <div className="input-with-unit">
              <input
                ref={annualRentInputRef}
                type="text"
                inputMode="numeric"
                value={annualRent}
                onChange={(event) => {
                  const value = event.target.value

                  if (event.nativeEvent instanceof InputEvent &&
                      event.nativeEvent.isComposing) {
                    handleAnnualRentChange(value)
                    return
                  }

                  handleAnnualRentChange(
                    formatMoneyInput(value),
                  )
                }}
                onCompositionEnd={(event) => {
                  handleAnnualRentChange(
                    formatMoneyInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                onBlur={(event) => {
                  handleAnnualRentChange(
                    formatMoneyInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                placeholder="例：300,000"
              />

              <span>円</span>
            </div>
          </label>

          <label>
            <span>購入価格</span>

            <div className="input-with-unit">
              <input
                type="text"
                inputMode="numeric"
                value={purchasePrice}
                onChange={(event) => {
                  const value = event.target.value

                  if (event.nativeEvent instanceof InputEvent &&
                      event.nativeEvent.isComposing) {
                    handlePurchasePriceChange(value)
                    return
                  }

                  handlePurchasePriceChange(
                    formatMoneyInput(value),
                  )
                }}
                onCompositionEnd={(event) => {
                  handlePurchasePriceChange(
                    formatMoneyInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                onBlur={(event) => {
                  handlePurchasePriceChange(
                    formatMoneyInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                placeholder="例：15,000,000"
              />

              <span>円</span>
            </div>
          </label>

          <label>
            <span>確認したい倍率</span>

            <div className="input-with-unit">
              <input
                type="text"
                inputMode="decimal"
                value={multiple}
                onChange={(event) => {
                  const value = event.target.value

                  if (event.nativeEvent instanceof InputEvent &&
                      event.nativeEvent.isComposing) {
                    handleMultipleChange(value)
                    return
                  }

                  handleMultipleChange(
                    normalizeMultipleInput(value),
                  )
                }}
                onCompositionEnd={(event) => {
                  handleMultipleChange(
                    normalizeMultipleInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                onBlur={(event) => {
                  handleMultipleChange(
                    normalizeMultipleInput(
                      event.currentTarget.value,
                    ),
                  )
                }}
                placeholder="例：50"
              />

              <span>倍</span>
            </div>
          </label>

            <div className="form-spacer" aria-hidden="true"></div>

            <div className="calculation-mode">
              <label className="mode-checkbox">
                <input
                  type="checkbox"
                  checked={isAutoCalculation}
                  onChange={(event) =>
                    changeCalculationMode(event.target.checked)
                  }
                />

                <span className="mode-checkbox__title">
                  <span>入力と同時に</span>
                  <span>計算結果を更新する</span>
                </span>
              </label>

              <p className="calculation-mode__description">
                {isAutoCalculation ? (
                  <>
                    <span>入力内容を変更すると、</span>
                    <span>結果が自動更新されます。</span>
                  </>
                ) : (
                  <>
                    <span>シミュレートボタンを押すと</span>
                    <span>結果が表示されます。</span>
                  </>
                )}
              </p>
            </div>

            {!isAutoCalculation && (

            <button
              className="simulate-button"
              type="button"
              onClick={simulate}
              disabled={!canSimulate}
            >
              シミュレートする
            </button>
          )}

          <button
            className="reset-button"
            type="button"
            onClick={resetCalculator}
          >
            入力内容をリセット
          </button>
        </div>

        <div
          className="calculator-results"
          ref={resultsRef}
          role="region"
          aria-label="シミュレーション結果"
          aria-live="polite"
          tabIndex={-1}
        >
          {hasDisplayedResult && (
            <div className="mobile-result-toolbar">
              <strong className="mobile-result-title">
                シミュレーション結果
              </strong>

              <button
                className="mobile-result-back"
                type="button"
                aria-label="入力条件に戻る"
                onClick={returnToInputs}
              >
                入力条件に戻る
              </button>
            </div>
          )}
          <div className="result-card">
            <span>購入倍率</span>

            <strong>
              {displayedResult.calculatedMultiple === null
                ? '―'
                : `${displayedResult.calculatedMultiple.toFixed(2)}倍`}
            </strong>

            <small>
              購入価格 ÷ 年間借地料
            </small>
          </div>

          <div className="result-card">
            <span>表面利回り</span>

            <strong>
              {displayedResult.surfaceYield === null
                ? '―'
                : `${displayedResult.surfaceYield.toFixed(2)}%`}
            </strong>

            <small>
              年間借地料 ÷ 購入価格 × 100
            </small>
          </div>

          <div className="result-card">
            <span>
              <span className="text-keep">入力倍率による</span>
              <wbr />
              <span className="text-keep">想定購入価格</span>
            </span>

            <strong>
              {displayedResult.estimatedPrice === null
                ? '―'
                : formatYen(
                    displayedResult.estimatedPrice,
                  )}
            </strong>

            <small>
              年間借地料 × 倍率
            </small>
          </div>
        </div>
      </div>

      <p className="calculator-note">
        <span className="text-keep">本シミュレーターの結果は</span>
        <wbr />
        <span className="text-keep">概算です。</span>
        <wbr />
        <span className="text-keep">税金、手数料、借入利息、</span>
        <wbr />
        <span className="text-keep">借地料の変動などは</span>
        <wbr />
        <span className="text-keep">含んでいません。</span>
      </p>
    </section>
  )
}

export default MilitaryLandCalculator