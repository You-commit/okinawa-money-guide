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
    type: 'website' | 'article'
    siteName: string
    locale: 'ja_JP'
  }
  twitter: {
    card: 'summary'
    title: string
    description: string
  }
  article?: {
    publishedAt?: string
    modifiedAt?: string
  }
}

type RouteSeoInput = {
  path: string
  title: string
  description: string
  article?: RouteSeo['article']
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
    path: routes.knowledgeNisaLimits,
    title: `NISAの非課税枠と積立額・将来額の考え方 | ${siteName}`,
    description: 'NISAの年間投資枠、非課税保有限度額、毎月の積立額、将来資産額の違いを、金融庁の一次資料を基に分かりやすく整理します。',
    article: {},
  },
  {
    path: routes.knowledgeMortgageComparison,
    title: `住宅ローン比較で見るべき項目 | ${siteName}`,
    description: '元利均等・元金均等、金利、総返済額、事務手数料、保証料、登記費用、団信など、住宅ローン比較の確認順序を整理します。',
    article: {},
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
]

function createRouteSeo({ path, title, description, article }: RouteSeoInput): RouteSeo {
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
      type: article ? 'article' : 'website',
      siteName,
      locale: 'ja_JP',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    article,
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
  const pathname = normalizePathname(value)
  if (pathname === routes.home) return websiteStructuredData

  const metadata = routeSeoByPath.get(pathname)
  if (!metadata) return undefined

  const pageName = metadata.title.replace(` | ${siteName}`, '')
  const webPage = {
    '@type': metadata.article ? 'Article' : 'WebPage',
    name: pageName,
    description: metadata.description,
    url: metadata.canonical,
    ...(metadata.article
      ? {
          headline: pageName,
          mainEntityOfPage: metadata.canonical,
          ...(metadata.article.publishedAt
            ? { datePublished: metadata.article.publishedAt }
            : {}),
          ...(metadata.article.modifiedAt
            ? { dateModified: metadata.article.modifiedAt }
            : {}),
        }
      : {}),
  }

  const isBreadcrumbPage = pathname.startsWith('/simulators/')
    || pathname.startsWith('/knowledge/')
  const breadcrumbItems = pathname.startsWith('/knowledge/')
    ? [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${canonicalOrigin}/` },
        { '@type': 'ListItem', position: 2, name: 'お金の知識', item: `${canonicalOrigin}${routes.knowledge}` },
        { '@type': 'ListItem', position: 3, name: pageName, item: metadata.canonical },
      ]
    : [
        { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${canonicalOrigin}/` },
        { '@type': 'ListItem', position: 2, name: pageName, item: metadata.canonical },
      ]

  return {
    '@context': 'https://schema.org',
    '@graph': [
      webPage,
      ...(isBreadcrumbPage
        ? [{ '@type': 'BreadcrumbList', itemListElement: breadcrumbItems }]
        : []),
    ],
  }
}
