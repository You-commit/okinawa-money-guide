import { Link } from 'react-router-dom'
import MilitaryLandCalculator from '../MilitaryLandCalculator'
import { routes } from '../app/routes'
import SimulatorPageShell from '../components/simulator/SimulatorPageShell'
import { MilitaryLandEditorialGuide } from '../components/simulator/SimulatorEditorialGuides'

function MilitaryLandPage() {
  return (
    <SimulatorPageShell
      theme="military"
      eyebrow="MILITARY LAND CALCULATOR"
      title="軍用地利回りシミュレーター"
      description="軍用地の購入価格や年間借地料から、利回りや将来の収益をシミュレーションします。"
      benefits={[
        { title: '実質利回りを試算', description: '表面利回りと経費控除後を確認' },
        { title: '将来の収益を可視化', description: '期間ごとの手取り収益を確認' },
        { title: '税金・経費も考慮', description: '年間費用を差し引いて概算' },
      ]}
      notes={(
        <>
          <article className="simulator-note-card simulator-note-card--warning">
            <h2>ご注意</h2>
            <ul>
              <li>価格や借地料はエリア・契約内容によって異なります。</li>
              <li>借地料は改定される場合があります。</li>
              <li>本シミュレーションは概算で、収益を保証するものではありません。</li>
            </ul>
          </article>
          <article className="simulator-note-card simulator-note-card--military">
            <h2>関連するお金の知識</h2>
            <ul>
              <li>軍用地の仕組みとメリット・デメリット</li>
              <li>借地料改定と契約条件の確認</li>
              <li>購入前に確認したい税金・費用</li>
            </ul>
            <Link to={`${routes.knowledge}#borrow`}>
              一覧を見る <span aria-hidden="true">→</span>
            </Link>
          </article>
          <article className="simulator-note-card simulator-note-card--next">
            <h2>次のステップ</h2>
            <p>気になる条件が見つかったら、費用や借入条件を変えて比較しましょう。</p>
            <a href="#military-land-title">
              条件を変えて試算する <span aria-hidden="true">→</span>
            </a>
          </article>
          <article className="simulator-note-card simulator-note-card--share">
            <h2>この結果を保存・共有</h2>
            <p>保存・共有機能は現在準備中です。</p>
            <button type="button" disabled>結果を保存（準備中）</button>
            <button type="button" disabled>共有リンク（準備中）</button>
          </article>
        </>
      )}
      guide={<MilitaryLandEditorialGuide />}
    >
      <MilitaryLandCalculator />
    </SimulatorPageShell>
  )
}

export default MilitaryLandPage
