import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { oldToolHashRoutes } from '../app/routes'
import FloatingSimulatorCta from '../components/top/FloatingSimulatorCta'
import PopularSimulators from '../components/top/PopularSimulators'
import PurposeGuide from '../components/top/PurposeGuide'
import TopHero from '../components/top/TopHero'
import TrustSection from '../components/top/TrustSection'
import SiteLayout from '../layouts/SiteLayout'

function HomePage() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const target = oldToolHashRoutes[location.hash]
    if (target) {
      navigate(target, { replace: true })
    }
  }, [location.hash, navigate])

  return (
    <SiteLayout className="top-option02">
      <main id="main-content">
        <TopHero />
        <PopularSimulators />
        <PurposeGuide />
        <TrustSection />
      </main>
      <FloatingSimulatorCta />
    </SiteLayout>
  )
}

export default HomePage
