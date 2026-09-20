import { routes } from './routes.ts'

export type StaticPageContent = {
  heading: string
  intro: string
  sections?: Array<{ heading: string; text: string }>
  links?: Array<{ href: string; label: string }>
}

export const staticPageContentByPath: Record<string, StaticPageContent> = {
  [routes.home]: {
    heading: '沖縄で暮らす人のお金の判断を、もっと分かりやすく。',
    intro: 'ローン、資産運用、軍用地など、沖縄に関係するお金の情報と無料シミュレーターを提供します。',
    links: [
      { href: routes.knowledge, label: 'お金の知識を見る' },
      { href: routes.mortgage, label: '住宅ローンを試算する' },
      { href: routes.nisa, label: 'NISAを試算する' },
    ],
  },
  [routes.militaryLand]: {
    heading: '軍用地利回りシミュレーター',
    intro: '購入価格や年間借地料から、表面利回り・費用控除後利回り・年間収支・回収期間を概算します。',
    sections: [{ heading: '倍率と利回りの読み方', text: '表面利回りを確認したあと、固定資産税や管理費を差し引いた収支を確認します。' }],
    links: [{ href: routes.knowledge, label: '関連するお金の知識を見る' }],
  },
  [routes.mortgage]: {
    heading: '住宅ローンシミュレーター',
    intro: '借入額・金利・返済期間から、元利均等返済と元金均等返済の返済額や利息を比較します。',
    sections: [{ heading: '比較するときの視点', text: '毎月返済額だけでなく、初回返済額、支払利息、借入期間全体の費用を同じ条件で確認します。' }],
    links: [{ href: routes.knowledgeMortgageComparison, label: '住宅ローン比較の記事を読む' }],
  },
  [routes.nisa]: {
    heading: 'NISAシミュレーター',
    intro: '積立額・想定利回り・期間から、将来額、必要積立額、必要期間とNISA制度枠の目安を試算します。',
    sections: [{ heading: '制度枠と将来額', text: '制度枠は買付額を基準にし、将来額は想定利回りに基づく概算として分けて確認します。' }],
    links: [{ href: routes.knowledgeNisaLimits, label: 'NISAの非課税枠の記事を読む' }],
  },
  [routes.ideco]: {
    heading: 'iDeCo節税シミュレーター',
    intro: '制度適用日、加入区分、掛金、所得状況から、所得税・住民税の軽減額を概算します。',
    sections: [{ heading: '結果の読み方', text: '拠出時の所得控除による軽減額と、将来の受取時に関係する税制を分けて確認します。' }],
    links: [{ href: routes.taxableIncome, label: '課税所得と所得税率を調べる' }],
  },
  [routes.taxableIncome]: {
    heading: '課税所得・所得税率シミュレーター',
    intro: '給与収入と所得控除から、2026年分の課税所得・所得税率・所得税額を概算します。',
    sections: [{ heading: '計算の流れ', text: '給与収入から給与所得を求め、所得控除を差し引いた課税所得に所得税率を適用します。' }],
    links: [{ href: routes.trust, label: 'シミュレーターの計算方針を見る' }],
  },
  [routes.knowledge]: {
    heading: '今の目的から、知るべきお金のことへ',
    intro: '借りる・貯める・増やす・備えるの目的から、基礎知識と無料シミュレーターを選べる入口です。',
    links: [
      { href: routes.knowledgeNisaLimits, label: 'NISAの非課税枠と積立額を読む' },
      { href: routes.knowledgeMortgageComparison, label: '住宅ローン比較の項目を読む' },
    ],
  },
  [routes.knowledgeNisaLimits]: {
    heading: 'NISAの非課税枠と、積立額・将来額の考え方',
    intro: '年間の投資枠と将来の資産額を分け、制度上の上限と運用結果の試算を読み違えないための基礎を整理します。',
    sections: [
      { heading: '年間投資枠と非課税保有限度額', text: 'つみたて投資枠は年間120万円、成長投資枠は年間240万円、合計の年間投資枠は360万円です。非課税保有限度額は簿価で1,800万円です。' },
      { heading: '将来額は仮定に基づく試算', text: '将来額は積立額・期間・想定利回りで変わり、将来の成果を保証するものではありません。' },
    ],
    links: [{ href: routes.nisa, label: 'NISAシミュレーターを使う' }],
  },
  [routes.knowledgeMortgageComparison]: {
    heading: '住宅ローン比較で見るべき項目',
    intro: '返済方式、金利、総返済額、諸費用、保証、団信を同じ条件で比較するための順序を整理します。',
    sections: [
      { heading: '返済方式の違い', text: '元利均等返済は返済額が原則一定、元金均等返済は当初の返済額が大きく、その後少しずつ減ります。' },
      { heading: '返済額の外にある費用', text: '融資事務手数料、保証料、登記費用、保険、団信なども別に確認します。' },
    ],
    links: [{ href: routes.mortgage, label: '住宅ローンを2方式で試算する' }],
  },
  [routes.about]: {
    heading: '沖縄のお金の判断を、落ち着いて整理できる場所へ',
    intro: '沖縄マネーガイドの目的、対象、情報とシミュレーターの読み方をご案内します。',
  },
  [routes.trust]: {
    heading: '判断材料を届けるための、情報と運営の方針',
    intro: '情報源、基準時点、更新・訂正、計算方針、データ、広告・提携に関する運営方針を公開しています。',
  },
}

export const notFoundStaticPageContent: StaticPageContent = {
  heading: 'ページが見つかりません',
  intro: 'お探しのページは移動または削除された可能性があります。',
  links: [{ href: routes.home, label: 'トップへ戻る' }],
}
