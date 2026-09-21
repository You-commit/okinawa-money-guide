import MortgageCalculator from '../MortgageCalculator'
import SimulatorNotes from '../components/simulator/SimulatorNotes'
import SimulatorPageShell from '../components/simulator/SimulatorPageShell'
import { MortgageEditorialGuide } from '../components/simulator/SimulatorEditorialGuides'

function MortgagePage() {
  return (
    <SimulatorPageShell
      theme="mortgage"
      eyebrow="MORTGAGE CALCULATOR"
      title="住宅ローンシミュレーター"
      description="借入額・金利・返済期間から、元利均等返済と元金均等返済を比較します。"
      benefits={[
        { title: 'カンタン入力', description: '必要な情報を入力するだけ' },
        { title: '2つの返済方法を比較', description: '元利均等と元金均等を比較' },
        { title: '結果をグラフで確認', description: '返済総額や差額を一目で把握' },
      ]}
      notes={<SimulatorNotes knowledgeTitle="住宅ローンの基本を知る" knowledgeItems={['返済方式の違い', '金利と返済期間', '無理のない借入条件']} />}
      guide={<MortgageEditorialGuide />}
    >
      <MortgageCalculator />
    </SimulatorPageShell>
  )
}

export default MortgagePage
