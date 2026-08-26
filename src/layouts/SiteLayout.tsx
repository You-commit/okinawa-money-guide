import type { ReactNode } from 'react'
import TopHeader from '../components/top/TopHeader'
import SiteFooter from '../components/site/SiteFooter'

type SiteLayoutProps = {
  children: ReactNode
  className?: string
}

function SiteLayout({ children, className = '' }: SiteLayoutProps) {
  return (
    <div className={`site ${className}`.trim()} id="top">
      <a className="skip-link" href="#main-content">本文へ移動</a>
      <TopHeader />
      {children}
      <SiteFooter />
    </div>
  )
}

export default SiteLayout
