import type { RouteSeo } from './seo.ts'
import type { StaticPageContent } from './staticPageContent.ts'

const seoHeadStart = '<!-- SEO_HEAD_START -->'
const seoHeadEnd = '<!-- SEO_HEAD_END -->'
const staticBodyStart = '<!-- STATIC_BODY_START -->'
const staticBodyEnd = '<!-- STATIC_BODY_END -->'

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
    ...(metadata.article?.publishedAt
      ? [
          `    <meta property="article:published_time" content="${metadata.article.publishedAt}" />`,
        ]
      : []),
    ...(metadata.article?.modifiedAt
      ? [
          `    <meta property="article:modified_time" content="${metadata.article.modifiedAt}" />`,
        ]
      : []),
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

export function renderStaticPageContent(content: StaticPageContent) {
  const sections = content.sections?.map((section) => `
        <section>
          <h2>${escapeHtml(section.heading)}</h2>
          <p>${escapeHtml(section.text)}</p>
        </section>`).join('') ?? ''
  const links = content.links?.length
    ? `
        <nav aria-label="関連ページ">
          ${content.links.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join('\n          ')}
        </nav>`
    : ''

  return `${staticBodyStart}
      <main class="seo-static-page" data-static-page>
        <p class="seo-static-page__brand">沖縄マネーガイド</p>
        <h1>${escapeHtml(content.heading)}</h1>
        <p>${escapeHtml(content.intro)}</p>${sections}${links}
      </main>
      ${staticBodyEnd}`
}

export function injectStaticPageContent(
  html: string,
  content: StaticPageContent,
) {
  const rendered = renderStaticPageContent(content)
  const startIndex = html.indexOf(staticBodyStart)
  const endIndex = html.indexOf(staticBodyEnd)

  if (startIndex !== -1 && endIndex > startIndex) {
    return `${html.slice(0, startIndex)}${rendered}${html.slice(endIndex + staticBodyEnd.length)}`
  }

  const root = '<div id="root"></div>'
  if (!html.includes(root)) {
    throw new Error('React root marker is missing from index.html')
  }

  return html.replace(root, `<div id="root">${rendered}</div>`)
}
