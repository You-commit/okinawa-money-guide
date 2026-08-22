import MilitaryLandCalculator from '../MilitaryLandCalculator'
import SimulatorNotes from '../components/simulator/SimulatorNotes'
import SimulatorPageShell from '../components/simulator/SimulatorPageShell'

function MilitaryLandPage() {
  return (
    <SimulatorPageShell
      theme="military"
      eyebrow="MILITARY LAND CALCULATOR"
      title="軍用地利回りシミュレーター"
      description="年間借地料と購入価格から、倍率・表面利回り・購入価格の目安を確認します。"
      benefits={[
        { title: '倍率を自動計算', description: '購入価格と年間借地料から確認' },
        { title: '利回りを可視化', description: '条件を自分の数字へ置き換え' },
        { title: '購入価格の目安', description: '希望倍率から逆算して試算' },
      ]}
      notes={<SimulatorNotes knowledgeTitle="関連するお金の知識" knowledgeItems={['軍用地の倍率と利回り', '契約更新と借地料', '購入前に確認する条件']} accent="military" />}
    >
      <MilitaryLandCalculator />
    </SimulatorPageShell>
  )
}

export default MilitaryLandPage
