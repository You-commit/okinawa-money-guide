import NisaCalculator from '../NisaCalculator'
import SimulatorNotes from '../components/simulator/SimulatorNotes'
import SimulatorPageShell from '../components/simulator/SimulatorPageShell'

function NisaPage() {
  return (
    <SimulatorPageShell
      theme="nisa"
      eyebrow="NISA ASSET CALCULATOR"
      title="NISAシミュレーター"
      description="積立額や想定利回りから、将来の資産形成イメージを分かりやすく試算します。"
      benefits={[
        { title: '積立額を試算', description: '毎月の積立と初期投資を入力' },
        { title: '将来資産を可視化', description: '元本と運用益の目安を確認' },
        { title: '長期運用を比較', description: '期間や利回りを変えて検討' },
      ]}
      notes={<SimulatorNotes knowledgeTitle="NISAの基礎知識を学ぶ" knowledgeItems={['NISA制度の基本', '長期・分散・積立', '元本割れリスク']} accent="nisa" />}
    >
      <NisaCalculator />
    </SimulatorPageShell>
  )
}

export default NisaPage
