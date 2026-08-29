export type MilitaryLandCalculationResult = {
  calculatedMultiple: number | null
  surfaceYield: number | null
  expenseAdjustedYield: number | null
  coreAnnualIncome: number | null
  paybackYears: number | null
  annualRent: number | null
  purchasePrice: number | null
  fixedAssetTax: number | null
  managementExpenses: number | null
  monthlyPayment: number | null
  annualPayment: number | null
  afterRepaymentAnnualIncome: number | null
  loanTermYears: number | null
  leaseYears: number | null
}

export type MilitaryLandCalculationInputs = {
  annualRent: string
  purchasePrice: string
  leaseYears: string
  fixedAssetTax: string
  managementExpenses: string
  hasLoan: boolean
  loanAmount: string
  loanTerm: string
  interestRate: string
}

export const emptyMilitaryLandResult: MilitaryLandCalculationResult = {
  calculatedMultiple: null,
  surfaceYield: null,
  expenseAdjustedYield: null,
  coreAnnualIncome: null,
  paybackYears: null,
  annualRent: null,
  purchasePrice: null,
  fixedAssetTax: null,
  managementExpenses: null,
  monthlyPayment: null,
  annualPayment: null,
  afterRepaymentAnnualIncome: null,
  loanTermYears: null,
  leaseYears: null,
}

export type LevelPaymentLoanResult = {
  monthlyPayment: number
  annualPayment: number
  termYears: number
}

export type MilitaryLandScenarioPoint = {
  year: number
  propertyValue: number
  repaymentValue: number | null
}

const convertToHalfWidth = (value: string) =>
  value.normalize('NFKC')

const getMoneyDigits = (value: string) =>
  convertToHalfWidth(value).replace(/[^\d]/g, '')

const normalizeDecimalInput = (value: string) => {
  const converted = convertToHalfWidth(value)
    .replace(/,/g, '')
    .replace(/[^\d.]/g, '')
  const [integerPart, ...decimalParts] = converted.split('.')

  return decimalParts.length === 0
    ? integerPart
    : `${integerPart}.${decimalParts.join('')}`
}

const normalizeIntegerInput = (value: string) =>
  convertToHalfWidth(value).replace(/[^\d]/g, '')

const parseMoney = (value: string) => Number(getMoneyDigits(value))

const parseRequiredDecimal = (value: string) => {
  const normalized = normalizeDecimalInput(value)

  if (normalized === '' || normalized === '.') {
    return null
  }

  const parsed = Number(normalized)

  return Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : null
}

export const calculateLevelPaymentLoan = ({
  principal,
  annualRatePercent,
  termYears,
}: {
  principal: number
  annualRatePercent: number
  termYears: number
}): LevelPaymentLoanResult | null => {
  if (
    !Number.isFinite(principal) ||
    !Number.isFinite(annualRatePercent) ||
    !Number.isFinite(termYears) ||
    principal <= 0 ||
    annualRatePercent < 0 ||
    termYears <= 0
  ) {
    return null
  }

  const paymentCount = Math.trunc(termYears) * 12

  if (paymentCount <= 0) {
    return null
  }

  const monthlyRate = annualRatePercent / 12 / 100
  const monthlyPayment = monthlyRate === 0
    ? principal / paymentCount
    : (
      principal *
      monthlyRate *
      ((1 + monthlyRate) ** paymentCount)
    ) / (((1 + monthlyRate) ** paymentCount) - 1)

  if (!Number.isFinite(monthlyPayment)) {
    return null
  }

  return {
    monthlyPayment,
    annualPayment: monthlyPayment * 12,
    termYears: Math.trunc(termYears),
  }
}

export const calculateAnnualIncomeAfterRepayment = ({
  coreAnnualIncome,
  annualPayment,
  loanTermYears,
  year,
}: {
  coreAnnualIncome: number
  annualPayment: number
  loanTermYears: number
  year: number
}) => year <= loanTermYears
  ? coreAnnualIncome - annualPayment
  : coreAnnualIncome

export const buildMilitaryLandScenario = ({
  coreAnnualIncome,
  scenarioYears,
  annualPayment,
  loanTermYears,
}: {
  coreAnnualIncome: number | null
  scenarioYears: number | null
  annualPayment: number | null
  loanTermYears: number | null
}): MilitaryLandScenarioPoint[] => {
  if (coreAnnualIncome === null || scenarioYears === null) {
    return []
  }

  const hasRepayment =
    annualPayment !== null &&
    loanTermYears !== null &&
    loanTermYears > 0
  const checkpoints = new Set(
    Array.from({ length: 6 }, (_, index) =>
      Math.round((scenarioYears * index) / 5),
    ),
  )

  if (hasRepayment && loanTermYears < scenarioYears) {
    checkpoints.add(loanTermYears)
  }

  return [...checkpoints]
    .sort((left, right) => left - right)
    .map((year) => ({
      year,
      propertyValue: coreAnnualIncome * year,
      repaymentValue: hasRepayment
        ? (
          coreAnnualIncome * year -
          annualPayment * Math.min(year, loanTermYears)
        )
        : null,
    }))
}

export const calculateMilitaryLandResults = ({
  annualRent,
  purchasePrice,
  leaseYears,
  fixedAssetTax,
  managementExpenses,
  hasLoan,
  loanAmount,
  loanTerm,
  interestRate,
}: MilitaryLandCalculationInputs): MilitaryLandCalculationResult => {
  const rent = parseMoney(annualRent)
  const price = parseMoney(purchasePrice)

  if (rent <= 0 || price <= 0) {
    return emptyMilitaryLandResult
  }

  const tax = parseMoney(fixedAssetTax)
  const expenses = parseMoney(managementExpenses)
  const parsedLeaseYears = Number(normalizeIntegerInput(leaseYears))
  const selectedLeaseYears = parsedLeaseYears > 0
    ? parsedLeaseYears
    : null
  const coreAnnualIncome = rent - tax - expenses
  const loanResult = hasLoan
    ? calculateLevelPaymentLoan({
      principal: parseMoney(loanAmount),
      annualRatePercent: parseRequiredDecimal(interestRate) ?? Number.NaN,
      termYears: Number(normalizeIntegerInput(loanTerm)),
    })
    : null

  return {
    calculatedMultiple: price / rent,
    surfaceYield: (rent / price) * 100,
    expenseAdjustedYield: (coreAnnualIncome / price) * 100,
    coreAnnualIncome,
    paybackYears: coreAnnualIncome > 0
      ? price / coreAnnualIncome
      : null,
    annualRent: rent,
    purchasePrice: price,
    fixedAssetTax: tax,
    managementExpenses: expenses,
    monthlyPayment: loanResult?.monthlyPayment ?? null,
    annualPayment: loanResult?.annualPayment ?? null,
    afterRepaymentAnnualIncome: loanResult
      ? coreAnnualIncome - loanResult.annualPayment
      : null,
    loanTermYears: loanResult?.termYears ?? null,
    leaseYears: selectedLeaseYears,
  }
}
