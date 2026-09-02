import NisaCalculator from '../NisaCalculator'
import NisaHeroMotion from '../components/simulator/NisaHeroMotion'
import SimulatorNotes from '../components/simulator/SimulatorNotes'
import SimulatorPageShell from '../components/simulator/SimulatorPageShell'

function NisaPage() {
  return (
    <SimulatorPageShell
      theme="nisa"
      eyebrow="NISA SIMULATOR"
      title="NISAシミュレーター"
      description="積立額や想定利回りから、将来の資産形成イメージを分かりやすく試算します。"
      benefits={[
        { title: '毎月の積立を試算', description: '積立額・利回り・期間から将来を確認' },
        { title: '将来資産を可視化', description: '元本と運用による変化を分かりやすく確認' },
        { title: 'NISA枠も確認', description: '年間投資枠や非課税保有限度額との関係を確認' },
      ]}
      heroVisual={<NisaHeroMotion />}
      notes={<SimulatorNotes knowledgeTitle="NISAの基礎知識を学ぶ" knowledgeItems={['NISA制度の基本', '長期・分散・積立', '元本割れリスク']} accent="nisa" />}
    >
      <NisaCalculator />
    </SimulatorPageShell>
  )
}

export default NisaPage
