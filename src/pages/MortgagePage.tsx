import MortgageCalculator from '../MortgageCalculator'
import SimulatorNotes from '../components/simulator/SimulatorNotes'
import SimulatorPageShell from '../components/simulator/SimulatorPageShell'

function MortgagePage() {
  return (
    <SimulatorPageShell
      theme="mortgage"
      eyebrow="MORTGAGE CALCULATOR"
      title="住宅ローンシミュレーター"
      description="借入額・金利・返済期間から、元利均等返済と元金均等返済を比較します。"
      benefits={[
        { title: 'かんたん入力', description: '必要な条件を入力するだけ' },
        { title: '2方式を比較', description: '元利均等と元金均等を同時表示' },
        { title: '差額を確認', description: '毎月返済と総返済額を整理' },
      ]}
      notes={<SimulatorNotes knowledgeTitle="住宅ローンの基本を知る" knowledgeItems={['返済方式の違い', '金利と返済期間', '無理のない借入条件']} />}
    >
      <MortgageCalculator />
    </SimulatorPageShell>
  )
}

export default MortgagePage
