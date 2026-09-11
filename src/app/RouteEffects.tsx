import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  getRouteSeo,
  getRouteStructuredData,
  notFoundSeo,
} from './seo'

function updateMeta(name: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.name = name
    document.head.append(element)
  }
  element.content = content
}

function updatePropertyMeta(property: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.append(element)
  }
  element.content = content
}

function removeMeta(selector: string) {
  document.querySelector(selector)?.remove()
}

function updateCanonical(href: string | undefined) {
  const current = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  if (!href) {
    current?.remove()
    return
  }

  const canonical = current ?? document.createElement('link')
  canonical.rel = 'canonical'
  canonical.href = href
  if (!current) document.head.append(canonical)
}

function updateStructuredData(structuredData: object | undefined) {
  const current = document.querySelector<HTMLScriptElement>(
    '#website-structured-data',
  )

  if (!structuredData) {
    current?.remove()
    return
  }

  const element = current ?? document.createElement('script')
  element.id = 'website-structured-data'
  element.type = 'application/ld+json'
  element.textContent = JSON.stringify(structuredData)
  if (!current) document.head.append(element)
}

function RouteEffects() {
  const location = useLocation()

  useEffect(() => {
    const current = getRouteSeo(location.pathname)
    document.title = current?.title ?? notFoundSeo.title
    updateMeta('description', current?.description ?? notFoundSeo.description)
    updateMeta('robots', current?.robots ?? notFoundSeo.robots)
    updateCanonical(current?.canonical)
    updateStructuredData(getRouteStructuredData(location.pathname))

    if (current) {
      updatePropertyMeta('og:title', current.openGraph.title)
      updatePropertyMeta('og:description', current.openGraph.description)
      updatePropertyMeta('og:url', current.openGraph.url)
      updatePropertyMeta('og:type', current.openGraph.type)
      updatePropertyMeta('og:site_name', current.openGraph.siteName)
      updatePropertyMeta('og:locale', current.openGraph.locale)
      updateMeta('twitter:card', current.twitter.card)
      updateMeta('twitter:title', current.twitter.title)
      updateMeta('twitter:description', current.twitter.description)
    } else {
      for (const property of [
        'og:title',
        'og:description',
        'og:url',
        'og:type',
        'og:site_name',
        'og:locale',
      ]) {
        removeMeta(`meta[property="${property}"]`)
      }
      for (const name of [
        'twitter:card',
        'twitter:title',
        'twitter:description',
      ]) {
        removeMeta(`meta[name="${name}"]`)
      }
    }
  }, [location.pathname])

  useEffect(() => {
    if (location.hash) {
      window.requestAnimationFrame(() => {
        document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' })
      })
      return
    }
    window.scrollTo({ top: 0, left: 0 })
  }, [location.pathname, location.hash])

  return null
}

export default RouteEffects
