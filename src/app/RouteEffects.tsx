import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { routes } from './routes'

const siteName = '沖縄マネーガイド'
const canonicalOrigin = 'https://okinawamoneyguide.jp'

const metadata: Record<string, { title: string; description: string }> = {
  [routes.home]: { title: siteName, description: 'ローン、資産運用、軍用地など、沖縄に関係するお金の情報と無料計算ツールを提供する沖縄マネーガイドです。' },
  [routes.militaryLand]: { title: `軍用地利回りシミュレーター | ${siteName}`, description: '年間借地料と購入価格から、軍用地の倍率・表面利回り・購入価格の目安を無料で試算できます。' },
  [routes.mortgage]: { title: `住宅ローンシミュレーター | ${siteName}`, description: '元利均等返済と元金均等返済の毎月返済額・総返済額を比較できる無料シミュレーターです。' },
  [routes.nisa]: { title: `NISAシミュレーター | ${siteName}`, description: '積立額、想定利回り、運用期間から将来の資産額と運用益の目安を試算できます。' },
  [routes.ideco]: { title: `iDeCo節税シミュレーター | ${siteName}`, description: '毎月の掛金と税率から、iDeCoによる所得税・住民税の軽減額を無料で試算できます。' },
  [routes.taxableIncome]: { title: `課税所得・所得税率シミュレーター | ${siteName}`, description: '給与収入と所得控除から、2026年分の課税所得・所得税率・所得税額を概算します。' },
  [routes.knowledge]: { title: `お金の知識 | ${siteName}`, description: '借りる・貯める・増やす・備えるの目的から、基礎知識と無料シミュレーターを探せます。' },
  [routes.about]: { title: `このサイトについて | ${siteName}`, description: '沖縄マネーガイドの目的、対象、情報とシミュレーターの読み方をご案内します。' },
  [routes.trust]: { title: `信頼情報 | ${siteName}`, description: '情報源、基準時点、更新・訂正、計算方針、データ、広告・提携に関する運営方針です。' },
}

function updateMeta(name: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.name = name
    document.head.append(element)
  }
  element.content = content
}

function RouteEffects() {
  const location = useLocation()

  useEffect(() => {
    const current = metadata[location.pathname]
    document.title = current?.title ?? `ページが見つかりません | ${siteName}`
    updateMeta('description', current?.description ?? 'お探しのページは見つかりませんでした。')
    updateMeta('robots', current ? 'index, follow' : 'noindex, follow')

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.append(canonical)
    }
    canonical.href = `${canonicalOrigin}${location.pathname}`
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
