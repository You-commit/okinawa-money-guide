import { useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import IdecoCalculator, {
  type IdecoTaxLookupContext,
} from '../IdecoCalculator'
import { routes } from '../app/routes'
import SimulatorNotes from '../components/simulator/SimulatorNotes'
import SimulatorPageShell from '../components/simulator/SimulatorPageShell'

const allowedIncomeTaxRates = [0, 5, 10, 20, 23, 33, 40, 45] as const

type IdecoLookupNavigationState = {
  idecoTaxLookupContext?: IdecoTaxLookupContext
}

const readLookupContext = (
  state: unknown,
): IdecoTaxLookupContext | undefined => {
  if (state === null || typeof state !== 'object') return undefined

  const context = (state as IdecoLookupNavigationState)
    .idecoTaxLookupContext

  if (
    context === undefined ||
    context.calculationMode !== 'detailed' ||
    typeof context.taxableIncomeBeforeContribution !== 'string'
  ) {
    return undefined
  }

  return context
}

function IdecoPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const lookupContext = readLookupContext(location.state)
  const initialIncomeTaxRate = useMemo(() => {
    const parameter = searchParams.get('incomeTaxRate')

    if (parameter === null || parameter === '') {
      return undefined
    }

    const value = Number(parameter)
    return allowedIncomeTaxRates.includes(value as (typeof allowedIncomeTaxRates)[number]) ? value : undefined
  }, [searchParams])

  return (
    <SimulatorPageShell
      theme="ideco"
      eyebrow="IDECO TAX SAVING CALCULATOR"
      title="iDeCo節税シミュレーター"
      description="毎月の掛金と税率から、所得税・住民税の軽減額と期間中の節税額を概算します。"
      benefits={[
        { title: '掛金が所得控除', description: '税負担の軽減額を試算' },
        { title: '所得税・住民税', description: 'それぞれの軽減額を確認' },
        { title: '長期効果を整理', description: '積立期間の合計額を表示' },
      ]}
      notes={<SimulatorNotes knowledgeTitle="iDeCoの基礎知識を学ぶ" knowledgeItems={['所得控除の仕組み', '掛金と加入期間', '受取時の税制']} accent="ideco" />}
    >
      <IdecoCalculator
        initialIncomeTaxRate={initialIncomeTaxRate}
        initialCalculationMode={lookupContext?.calculationMode}
        initialTaxableIncomeBeforeContribution={
          lookupContext?.taxableIncomeBeforeContribution
        }
        onOpenTaxableIncome={(context) => navigate(
          `${routes.taxableIncome}?return=ideco`,
          {
            state: context.calculationMode === 'detailed'
              ? { idecoTaxLookupContext: context }
              : undefined,
          },
        )}
      />
    </SimulatorPageShell>
  )
}

export default IdecoPage
