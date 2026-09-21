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
      notes={(
        <SimulatorNotes
          knowledgeTitle="結果の次に確認すること"
          knowledgeItems={[
            '元利均等返済と元金均等返済の違い',
            '金利・返済期間が支払利息に与える影響',
            '事務手数料・保証料・登記費用・団信を含めた総負担',
          ]}
          warningItems={[
            '入力した金利が返済期間中続く前提の概算です。変動金利の将来の金利変動は反映していません。',
            '事務手数料・保証料・登記費用・保険料など、金融機関や商品ごとに異なる諸費用は返済額に含めていません。',
            '繰上返済、団信の上乗せ金利、金融機関固有の端数処理などにより、実際の返済額と異なる場合があります。',
          ]}
        />
      )}
      guide={<MortgageEditorialGuide />}
    >
      <MortgageCalculator />
    </SimulatorPageShell>
  )
}

export default MortgagePage
