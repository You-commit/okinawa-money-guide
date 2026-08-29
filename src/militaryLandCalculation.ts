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
  annualInterest: number | null
  interestAdjustedAnnualIncome: number | null
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
  annualInterest: null,
  interestAdjustedAnnualIncome: null,
  leaseYears: null,
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

const parseDecimal = (value: string) => {
  const parsed = Number(normalizeDecimalInput(value))

  return Number.isFinite(parsed) ? parsed : 0
}

export const calculateMilitaryLandResults = ({
  annualRent,
  purchasePrice,
  leaseYears,
  fixedAssetTax,
  managementExpenses,
  hasLoan,
  loanAmount,
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
  const annualInterest = hasLoan
    ? parseMoney(loanAmount) * (parseDecimal(interestRate) / 100)
    : 0
  const coreAnnualIncome = rent - tax - expenses

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
    annualInterest,
    interestAdjustedAnnualIncome: coreAnnualIncome - annualInterest,
    leaseYears: selectedLeaseYears,
  }
}
