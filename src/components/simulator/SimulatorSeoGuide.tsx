import { Link } from 'react-router-dom'
import { routes } from '../../app/routes'
import type { SimulatorTheme } from './SimulatorPageShell'
import './SimulatorSeoGuide.css'

type GuideSection = {
  title: string
  body: string
}

type GuideConfig = {
  heading: string
  intro: string
  sections: GuideSection[]
  relatedLinks: Array<{ to: string; label: string }>
}

const guideByTheme: Record<SimulatorTheme, GuideConfig> = {
  military: {
    heading: '軍用地の利回りを判断するときの見方',
    intro:
      '軍用地は、購入価格だけでなく年間借地料、倍率、税金・費用、保有期間を同じ条件で確認すると比較しやすくなります。このシミュレーターは、複数の条件を自分の数字に置き換えて整理するための目安です。',
    sections: [
      {
        title: '倍率と利回りは同じ意味ではありません',
        body:
          '倍率は購入価格が年間借地料の何年分に相当するかを見る指標です。利回りは年間収入を購入価格で割って確認します。費用を含めると、表面利回りと実際の手取りに近い利回りは変わります。',
      },
      {
        title: '年間費用も一緒に確認',
        body:
          '固定資産税などの年間費用を入力すると、収入だけを見た場合との差を確認できます。共有持分や個別契約の条件がある場合は、売買資料や登記・契約内容も別途確認してください。',
      },
      {
        title: '価格上昇や売却価格は保証しません',
        body:
          '本シミュレーションは入力した条件に基づく概算です。将来の借地料改定、売却価格、流動性、借入コスト、税務上の個別事情までを保証するものではありません。',
      },
    ],
    relatedLinks: [
      { to: `${routes.knowledge}#borrow`, label: '軍用地・借入に関する知識を見る' },
      { to: routes.mortgage, label: '住宅ローンの返済額も試算する' },
    ],
  },
  mortgage: {
    heading: '住宅ローンの試算結果を比較するときの見方',
    intro:
      '毎月返済額だけでなく、総返済額、利息、返済方式の違いを同じ借入条件で比べると、返済計画を立てやすくなります。実際の住宅ローンでは、金利以外の費用や商品条件も確認が必要です。',
    sections: [
      {
        title: '毎月返済額と総返済額を分けて見る',
        body:
          '返済期間を長くすると毎月返済額は下がりやすい一方、同じ金利なら支払う利息が増える場合があります。月々の負担だけでなく、期間全体の総返済額も確認してください。',
      },
      {
        title: '元利均等と元金均等を同条件で比較',
        body:
          '元利均等返済は返済計画を立てやすく、元金均等返済は当初負担が大きい一方で元金の減りが早い特徴があります。取扱可否は金融機関や商品によって異なります。',
      },
      {
        title: '実際の契約費用は別に確認',
        body:
          '保証料、融資手数料、団体信用生命保険、登記費用、繰上返済条件、金利見直しルールなどは商品ごとに異なります。最終判断では各金融機関の正式な商品説明を確認してください。',
      },
    ],
    relatedLinks: [
      { to: `${routes.knowledge}#borrow`, label: '住宅ローンの基礎知識を見る' },
      { to: routes.taxableIncome, label: '課税所得・所得税率も確認する' },
    ],
  },
  nisa: {
    heading: 'NISAの積立試算を使うときの見方',
    intro:
      'NISAは投資商品の名前ではなく、一定の投資から得られる利益を非課税で保有できる制度です。このシミュレーターは、積立額・期間・想定利回りを変えて将来額の幅を考えるために使います。',
    sections: [
      {
        title: '想定利回りは将来の保証ではありません',
        body:
          '一定の利回りが毎年続く前提で試算しても、実際の価格は上下します。複数の利回りで比較し、低いケースでも無理のない積立額かを確認する使い方が重要です。',
      },
      {
        title: 'NISAの投資枠と資産額は別に考える',
        body:
          '年間投資枠や非課税保有限度額は、投資できる金額を管理する制度上の枠です。運用後の資産額そのものが投資枠になるわけではありません。制度枠と運用結果を分けて確認してください。',
      },
      {
        title: '商品ごとのリスクと費用も確認',
        body:
          '投資信託や株式には価格変動等による元本割れの可能性があります。信託報酬、売買手数料、商品特性などは、利用する金融機関と商品の公式情報で確認してください。',
      },
    ],
    relatedLinks: [
      { to: `${routes.knowledge}#grow`, label: 'NISA・資産形成の知識を見る' },
      { to: routes.ideco, label: 'iDeCoの節税額も試算する' },
    ],
  },
  ideco: {
    heading: 'iDeCoの節税試算を使うときの見方',
    intro:
      'iDeCoでは、掛金が所得控除の対象になることで所得税・住民税の負担が軽くなる場合があります。節税額は掛金だけでなく、所得状況、税率、加入区分、制度適用日により変わります。',
    sections: [
      {
        title: '掛金が同じでも節税額は同じとは限りません',
        body:
          '所得税率が異なれば所得税の軽減額も変わります。詳細モードでは課税所得を確認し、簡易モードでは入力した税率が自分の状況に合っているかを確認してください。',
      },
      {
        title: '加入区分と掛金上限を確認',
        body:
          '拠出できる掛金上限は加入区分や企業年金等の状況、制度適用日によって異なります。シミュレーターは適用日を分けて扱いますが、勤務先制度の最新情報も確認してください。',
      },
      {
        title: '受取時の税制は別の論点です',
        body:
          '掛金拠出時の所得控除だけでiDeCo全体の有利・不利は決まりません。運用商品、手数料、受取方法、受取時の税制も含めて判断する必要があります。',
      },
    ],
    relatedLinks: [
      { to: `${routes.knowledge}#grow`, label: 'iDeCo・資産形成の知識を見る' },
      { to: routes.taxableIncome, label: '課税所得・所得税率を確認する' },
    ],
  },
  taxable: {
    heading: '課税所得と所得税率の試算を使うときの見方',
    intro:
      'このシミュレーターは、給与収入と所得控除から2026年分の課税所得・所得税率・所得税額を概算するためのものです。確定申告や年末調整の正式税額を確定するものではありません。',
    sections: [
      {
        title: '給与収入と課税所得は同じではありません',
        body:
          '給与収入から給与所得控除を反映し、さらに所得控除を差し引いた後の金額を基に所得税率を確認します。入力する控除額が変わると、課税所得と税率区分も変わる場合があります。',
      },
      {
        title: '税額控除・給与以外の所得は別途確認',
        body:
          '住宅ローン控除などの税額控除、給与以外の所得、所得金額調整控除等は本シミュレーターの対象外です。該当する場合は国税庁の案内や専門家へ確認してください。',
      },
      {
        title: '住民税は所得税と計算方法が異なります',
        body:
          '住民税には所得税と異なる控除・税率・均等割等があります。OMGでは住民税の正式計算仕様を別工程で扱い、現時点では標準税率だけで正式額を確定しません。',
      },
    ],
    relatedLinks: [
      { to: `${routes.knowledge}#save`, label: '家計・税金の知識を見る' },
      { to: routes.ideco, label: 'iDeCoの節税額へ戻る' },
    ],
  },
}

function SimulatorSeoGuide({ theme }: { theme: SimulatorTheme }) {
  const guide = guideByTheme[theme]
  const headingId = `simulator-guide-${theme}`

  return (
    <section className="simulator-seo-guide" aria-labelledby={headingId}>
      <div className="simulator-seo-guide__heading">
        <p className="simulator-seo-guide__eyebrow">HOW TO READ</p>
        <h2 id={headingId}>{guide.heading}</h2>
        <p>{guide.intro}</p>
      </div>

      <div className="simulator-seo-guide__grid">
        {guide.sections.map((section, index) => (
          <article key={section.title}>
            <div className="simulator-seo-guide__number" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </div>
            <div className="simulator-seo-guide__card-content">
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </div>
          </article>
        ))}
      </div>

      <nav className="simulator-seo-guide__links" aria-label="関連ページ">
        {guide.relatedLinks.map((link) => (
          <Link key={link.to} to={link.to}>
            {link.label}
            <span aria-hidden="true">→</span>
          </Link>
        ))}
      </nav>
    </section>
  )
}

export default SimulatorSeoGuide
