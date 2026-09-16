import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  affiliatePrograms,
  isAffiliateProgramVisible,
  isAffiliateVisualPreviewEnabled,
} from '../../affiliate/affiliateConfig'
import AffiliateProgramPlacement from './AffiliateProgramPlacement'

const PORTAL_ID = 'nisa-affiliate-before-consultation-summary'

function NisaAffiliatePlacementController() {
  const program = affiliatePrograms.nisa
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null)

  const shouldRender = useMemo(
    () => isAffiliateVisualPreviewEnabled() || isAffiliateProgramVisible(program),
    [program],
  )

  useEffect(() => {
    if (!shouldRender) return undefined

    const syncPlacement = () => {
      const summary = document.querySelector<HTMLElement>(
        '.nisa-consultation-summary',
      )
      const existingHost = document.getElementById(PORTAL_ID)

      if (!summary) {
        existingHost?.remove()
        setPortalHost(null)
        return
      }

      const parent = summary.parentElement
      if (!parent) return

      const host = existingHost ?? document.createElement('div')
      host.id = PORTAL_ID
      host.className =
        'nisa-affiliate-placement nisa-affiliate-placement--post-simulation'

      if (!existingHost || host.nextElementSibling !== summary) {
        parent.insertBefore(host, summary)
      }

      setPortalHost(host)
    }

    syncPlacement()

    const calculator = document.querySelector('.simulator-page__calculator')
    const observer = new MutationObserver(syncPlacement)
    observer.observe(calculator ?? document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
      document.getElementById(PORTAL_ID)?.remove()
    }
  }, [shouldRender])

  if (!shouldRender) return null

  const banner = (
    <AffiliateProgramPlacement
      program={program}
      placement="nisa-before-consultation-summary"
    />
  )

  if (portalHost) {
    return createPortal(banner, portalHost)
  }

  return (
    <div className="nisa-affiliate-placement nisa-affiliate-placement--pre-simulation">
      {banner}
    </div>
  )
}

export default NisaAffiliatePlacementController
