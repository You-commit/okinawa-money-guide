import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  affiliatePrograms,
  isAffiliateProgramVisible,
  isAffiliateVisualPreviewEnabled,
} from '../../affiliate/affiliateConfig'
import AffiliateProgramPlacement from './AffiliateProgramPlacement'

const PORTAL_ID = 'taxable-affiliate-after-results'

function TaxableAffiliatePlacementController() {
  const program = affiliatePrograms.taxable
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null)

  const shouldRender = useMemo(
    () => isAffiliateVisualPreviewEnabled() || isAffiliateProgramVisible(program),
    [program],
  )

  useEffect(() => {
    if (!shouldRender) return undefined

    const syncPlacement = () => {
      setPortalHost(document.getElementById(PORTAL_ID))
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
      setPortalHost(null)
    }
  }, [shouldRender])

  if (!shouldRender) return null

  const banner = (
    <AffiliateProgramPlacement
      program={program}
      placement="taxable-after-results"
    />
  )

  if (portalHost) {
    return createPortal(banner, portalHost)
  }

  return (
    <div className="taxable-affiliate-placement taxable-affiliate-placement--pre-simulation">
      {banner}
    </div>
  )
}

export default TaxableAffiliatePlacementController
