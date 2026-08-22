import { Link } from 'react-router-dom'
import { routes } from '../../app/routes'

function SiteFooter() {
  return (
    <footer className="footer site-footer">
      <div className="footer-inner">
        <div>
          <p className="footer-name">沖縄マネーガイド</p>
          <p>© 2026 Okinawa Money Guide</p>
        </div>
        <nav aria-label="フッターメニュー">
          <Link to={routes.knowledge}>お金の知識</Link>
          <Link to={routes.about}>このサイトについて</Link>
          <Link to={routes.trust}>信頼情報</Link>
        </nav>
      </div>
    </footer>
  )
}

export default SiteFooter
