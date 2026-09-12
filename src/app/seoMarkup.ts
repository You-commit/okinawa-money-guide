import type { RouteSeo } from './seo.ts'

const seoHeadStart = '<!-- SEO_HEAD_START -->'
const seoHeadEnd = '<!-- SEO_HEAD_END -->'

type NotFoundSeo = {
  title: string
  description: string
  robots: 'noindex, follow'
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function renderStructuredData(structuredData: object | undefined) {
  if (!structuredData) return ''

  const json = JSON.stringify(structuredData).replaceAll('<', '\\u003c')
  return `\n    <script id="website-structured-data" type="application/ld+json">${json}</script>`
}

export function renderSeoHead(
  metadata: RouteSeo | NotFoundSeo,
  structuredData?: object,
) {
  const common = [
    `    <title>${escapeHtml(metadata.title)}</title>`,
    `    <meta name="description" content="${escapeHtml(metadata.description)}" />`,
    `    <meta name="robots" content="${metadata.robots}" />`,
  ]

  if (!('canonical' in metadata)) {
    return `${seoHeadStart}\n${common.join('\n')}${renderStructuredData(structuredData)}\n    ${seoHeadEnd}`
  }

  const social = [
    `    <link rel="canonical" href="${escapeHtml(metadata.canonical)}" />`,
    `    <meta property="og:title" content="${escapeHtml(metadata.openGraph.title)}" />`,
    `    <meta property="og:description" content="${escapeHtml(metadata.openGraph.description)}" />`,
    `    <meta property="og:url" content="${escapeHtml(metadata.openGraph.url)}" />`,
    `    <meta property="og:type" content="${metadata.openGraph.type}" />`,
    `    <meta property="og:site_name" content="${escapeHtml(metadata.openGraph.siteName)}" />`,
    `    <meta property="og:locale" content="${metadata.openGraph.locale}" />`,
    `    <meta name="twitter:card" content="${metadata.twitter.card}" />`,
    `    <meta name="twitter:title" content="${escapeHtml(metadata.twitter.title)}" />`,
    `    <meta name="twitter:description" content="${escapeHtml(metadata.twitter.description)}" />`,
  ]

  return `${seoHeadStart}\n${[...common, ...social].join('\n')}${renderStructuredData(structuredData)}\n    ${seoHeadEnd}`
}

export function injectSeoHead(
  html: string,
  metadata: RouteSeo | NotFoundSeo,
  structuredData?: object,
) {
  const startIndex = html.indexOf(seoHeadStart)
  const endIndex = html.indexOf(seoHeadEnd)

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error('SEO head markers are missing from index.html')
  }

  return `${html.slice(0, startIndex)}${renderSeoHead(metadata, structuredData)}${html.slice(endIndex + seoHeadEnd.length)}`
}
