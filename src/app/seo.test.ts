import { describe, expect, it } from 'vitest'
import indexTemplate from '../../index.html?raw'
import redirects from '../../public/_redirects?raw'
import robotsTxt from '../../public/robots.txt?raw'
import sitemapXml from '../../public/sitemap.xml?raw'
import { knowledgeArticles } from '../content/knowledgeArticles'
import { routes } from './routes'
import {
  canonicalOrigin,
  getRouteSeo,
  getRouteStructuredData,
  notFoundSeo,
  routeSeoEntries,
  siteName,
  websiteStructuredData,
} from './seo'
import { injectSeoHead } from './seoMarkup'

const expectedRoutes = [
  ...Object.values(routes),
  ...knowledgeArticles.map(({ path }) => path),
]

describe('technical SEO source of truth', () => {
  it('defines complete, indexable metadata for every formal route and published article', () => {
    expect(routeSeoEntries).toHaveLength(expectedRoutes.length)
    expect(routeSeoEntries.map(({ path }) => path)).toEqual(expectedRoutes)
    expect(new Set(routeSeoEntries.map(({ path }) => path)).size)
      .toBe(expectedRoutes.length)

    for (const metadata of routeSeoEntries) {
      expect(metadata.title).not.toBe('')
      expect(metadata.description).not.toBe('')
      expect(metadata.canonical).toBe(`${canonicalOrigin}${metadata.path}`)
      expect(metadata.robots).toBe('index, follow')
      expect(metadata.openGraph).toEqual(expect.objectContaining({
        title: metadata.title,
        description: metadata.description,
        url: metadata.canonical,
        type: 'website',
        siteName,
        locale: 'ja_JP',
      }))
      expect(metadata.twitter).toEqual({
        card: 'summary',
        title: metadata.title,
        description: metadata.description,
      })
    }
  })

  it('canonicalizes query, hash, and trailing-slash variants to the formal URL', () => {
    const canonical = `${canonicalOrigin}${routes.ideco}`
    const articleCanonical = `${canonicalOrigin}${knowledgeArticles[0].path}`

    expect(getRouteSeo(`${routes.ideco}?incomeTaxRate=10`)?.canonical)
      .toBe(canonical)
    expect(getRouteSeo(`${routes.ideco}#result`)?.canonical).toBe(canonical)
    expect(getRouteSeo(`${routes.ideco}/`)?.canonical).toBe(canonical)
    expect(getRouteSeo(`${knowledgeArticles[0].path}/`)?.canonical)
      .toBe(articleCanonical)
    expect(getRouteSeo('/this-page-does-not-exist')).toBeUndefined()
  })

  it('renders complete initial HTML metadata from the shared route source', () => {
    for (const metadata of routeSeoEntries) {
      const html = injectSeoHead(
        indexTemplate,
        metadata,
        getRouteStructuredData(metadata.path),
      )

      expect(html).toContain(`<title>${metadata.title}</title>`)
      expect(html).toContain(`name="description" content="${metadata.description}"`)
      expect(html).toContain('name="robots" content="index, follow"')
      expect(html).toContain(`rel="canonical" href="${metadata.canonical}"`)
      expect(html).toContain(`property="og:title" content="${metadata.title}"`)
      expect(html).toContain(`property="og:url" content="${metadata.canonical}"`)
      expect(html).toContain('name="twitter:card" content="summary"')
      expect(html.match(/rel="canonical"/g)).toHaveLength(1)
    }
  })

  it('renders a noindex 404 document without canonical or social metadata', () => {
    const html = injectSeoHead(indexTemplate, notFoundSeo)

    expect(html).toContain(`<title>${notFoundSeo.title}</title>`)
    expect(html).toContain('name="robots" content="noindex, follow"')
    expect(html).not.toContain('rel="canonical"')
    expect(html).not.toContain('property="og:')
    expect(html).not.toContain('name="twitter:')
  })

  it('uses only factual WebSite structured data on the homepage', () => {
    expect(getRouteStructuredData(routes.home)).toEqual(websiteStructuredData)
    expect(getRouteStructuredData(routes.mortgage)).toBeUndefined()
    expect(getRouteStructuredData(knowledgeArticles[0].path)).toBeUndefined()
    expect(websiteStructuredData).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      url: `${canonicalOrigin}/`,
    })
  })

  it('keeps sitemap URLs synchronized with every indexable route', () => {
    const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((match) => match[1])

    expect(sitemapUrls).toEqual(
      routeSeoEntries.map(({ canonical }) => canonical),
    )
    expect(new Set(sitemapUrls).size).toBe(expectedRoutes.length)
  })

  it('keeps robots.txt indexable and points to the canonical sitemap', () => {
    expect(robotsTxt).toMatch(/^User-agent: \*$/m)
    expect(robotsTxt).toMatch(/^Allow: \/$/m)
    expect(robotsTxt).toContain(
      `Sitemap: ${canonicalOrigin}/sitemap.xml`,
    )
    expect(robotsTxt).not.toContain('Disallow:')
  })

  it('removes the SPA catch-all while normalizing known trailing slashes', () => {
    expect(redirects).not.toContain('/* /index.html 200')

    for (const path of expectedRoutes.filter((path) => path !== '/')) {
      expect(redirects).toContain(`${path}/ ${path} 301`)
    }
  })
})
