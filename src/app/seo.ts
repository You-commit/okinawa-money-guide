import { knowledgeArticles } from '../content/knowledgeArticles.ts'
import { routes } from './routes.ts'

export const siteName = '沖縄マネーガイド'
export const canonicalOrigin = 'https://okinawamoneyguide.jp'

export type RouteSeo = {
  path: string
  title: string
  description: string
  canonical: string
  robots: 'index, follow'
  openGraph: {
    title: string
    description: string
    url: string
    type: 'website'
    siteName: string
    locale: 'ja_JP'
  }
  twitter: {
    card: 'summary'
    title: string
    description: string
  }
}

type RouteSeoInput = {
  path: string
  title: string
  description: string
}

const routeSeoInputs: RouteSeoInput[] = [
  {
    path: routes.home,
    title: siteName,
    description: 'ローン、資産運用、軍用地など、沖縄に関係するお金の情報と無料計算ツールを提供する沖縄マネーガイドです。',
  },
  {
    path: routes.militaryLand,
    title: `軍用地利回りシミュレーター | ${siteName}`,
    description: '購入価格、年間借地料、固定資産税などから、軍用地の表面利回り・費用控除後利回り・年間収支・回収期間・長期収支を概算します。',
  },
  {
    path: routes.mortgage,
    title: `住宅ローンシミュレーター | ${siteName}`,
    description: '借入金額、金利、返済期間から、元利均等返済と元金均等返済の返済額・利息・返済推移を比較できる無料シミュレーターです。',
  },
  {
    path: routes.nisa,
    title: `NISAシミュレーター | ${siteName}`,
    description: '毎月積立額、目標額、想定利回り、積立期間から、将来額・必要積立額・必要期間とNISA制度枠の目安を試算します。',
  },
  {
    path: routes.ideco,
    title: `iDeCo節税シミュレーター | ${siteName}`,
    description: '制度適用日、加入区分、掛金、所得状況から、iDeCoによる所得税・住民税の軽減額を簡易または詳細に試算します。',
  },
  {
    path: routes.taxableIncome,
    title: `課税所得・所得税率シミュレーター | ${siteName}`,
    description: '給与収入と所得控除から、2026年分の課税所得・所得税率・所得税額を概算します。',
  },
  {
    path: routes.knowledge,
    title: `お金の知識 | ${siteName}`,
    description: '借りる・貯める・増やす・備えるの目的から、基礎知識と無料シミュレーターを探せます。',
  },
  {
    path: routes.about,
    title: `このサイトについて | ${siteName}`,
    description: '沖縄マネーガイドの目的、対象、情報とシミュレーターの読み方をご案内します。',
  },
  {
    path: routes.trust,
    title: `信頼情報 | ${siteName}`,
    description: '情報源、基準時点、更新・訂正、計算方針、データ、広告・提携に関する運営方針です。',
  },
  ...knowledgeArticles.map((article) => ({
    path: article.path,
    title: `${article.title} | ${siteName}`,
    description: article.description,
  })),
]

function createRouteSeo({ path, title, description }: RouteSeoInput): RouteSeo {
  const canonical = `${canonicalOrigin}${path}`

  return {
    path,
    title,
    description,
    canonical,
    robots: 'index, follow',
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      siteName,
      locale: 'ja_JP',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export const routeSeoEntries = routeSeoInputs.map(createRouteSeo)

const routeSeoByPath = new Map(
  routeSeoEntries.map((metadata) => [metadata.path, metadata]),
)

export const notFoundSeo = {
  title: `ページが見つかりません | ${siteName}`,
  description: 'お探しのページは見つかりませんでした。',
  robots: 'noindex, follow',
} as const

export const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteName,
  url: `${canonicalOrigin}/`,
} as const

export function normalizePathname(value: string) {
  const pathname = value.split(/[?#]/, 1)[0] || routes.home

  if (pathname === routes.home) return routes.home

  return pathname.replace(/\/+$/, '') || routes.home
}

export function getRouteSeo(value: string) {
  return routeSeoByPath.get(normalizePathname(value))
}

export function getRouteStructuredData(value: string) {
  return normalizePathname(value) === routes.home
    ? websiteStructuredData
    : undefined
}
