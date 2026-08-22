import { Link } from 'react-router-dom'
import { routes } from '../app/routes'
import SiteLayout from '../layouts/SiteLayout'

function NotFoundPage() {
  return (
    <SiteLayout className="dedicated-page not-found-page">
      <main id="main-content" className="not-found-page__main">
        <p>404</p>
        <h1>ページが見つかりません</h1>
        <p>URLをご確認いただくか、トップページから目的の情報をお探しください。</p>
        <Link to={routes.home}>トップへ戻る</Link>
      </main>
    </SiteLayout>
  )
}

export default NotFoundPage
