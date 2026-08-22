import { Link } from 'react-router-dom'
import { routes } from '../../app/routes'

type SimulatorNotesProps = {
  knowledgeTitle: string
  knowledgeItems: string[]
  accent?: string
}

function SimulatorNotes({ knowledgeTitle, knowledgeItems, accent = 'blue' }: SimulatorNotesProps) {
  return (
    <>
      <article className="simulator-note-card simulator-note-card--warning">
        <h2>ご注意</h2>
        <ul>
          <li>本シミュレーションは概算であり、結果を保証するものではありません。</li>
          <li>制度・金利・税制などの変更により、実際の結果と異なる場合があります。</li>
          <li>重要な判断は一次資料や専門窓口でも確認してください。</li>
        </ul>
      </article>
      <article className={`simulator-note-card simulator-note-card--${accent}`}>
        <h2>{knowledgeTitle}</h2>
        <ul>{knowledgeItems.map((item) => <li key={item}>{item}</li>)}</ul>
        <Link to={routes.knowledge}>お金の知識を見る <span aria-hidden="true">→</span></Link>
      </article>
      <article className="simulator-note-card simulator-note-card--next">
        <h2>次のステップ</h2>
        <p>結果だけで決めず、前提条件や制度の一次資料まで確認しましょう。</p>
        <Link to={routes.trust}>シミュレーターの位置づけを見る <span aria-hidden="true">→</span></Link>
      </article>
    </>
  )
}

export default SimulatorNotes
