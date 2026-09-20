import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { routes } from '../../app/routes'
import SiteLayout from '../../layouts/SiteLayout'

type ArticleSource = {
  title: string
  organization: string
  url: string
}

type KnowledgeArticleLayoutProps = {
  eyebrow: string
  title: string
  lead: string
  publishedAt?: string
  updatedAt?: string
  basisDate?: string
  children: ReactNode
  sources: ArticleSource[]
  related: ReactNode
}

function KnowledgeArticleLayout({
  eyebrow,
  title,
  lead,
  publishedAt,
  updatedAt,
  basisDate,
  children,
  sources,
  related,
}: KnowledgeArticleLayoutProps) {
  return (
    <SiteLayout className="dedicated-page knowledge-article-page">
      <main id="main-content">
        <header className="knowledge-article-hero">
          <div className="knowledge-article-hero__inner">
            <nav className="knowledge-article-breadcrumb" aria-label="パンくずリスト">
              <Link to={routes.home}>ホーム</Link>
              <span aria-hidden="true">›</span>
              <Link to={routes.knowledge}>お金の知識</Link>
              <span aria-hidden="true">›</span>
              <span aria-current="page">{title}</span>
            </nav>
            <p className="info-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="knowledge-article-hero__lead">{lead}</p>
            {publishedAt || updatedAt || basisDate ? (
              <dl className="knowledge-article-meta">
                {publishedAt ? <div><dt>公開日</dt><dd><time dateTime={publishedAt}>{publishedAt.replaceAll('-', '.')}</time></dd></div> : null}
                {updatedAt ? <div><dt>更新日</dt><dd><time dateTime={updatedAt}>{updatedAt.replaceAll('-', '.')}</time></dd></div> : null}
                {basisDate ? <div><dt>制度・情報の基準日</dt><dd><time dateTime={basisDate}>{basisDate.replaceAll('-', '.')}</time></dd></div> : null}
              </dl>
            ) : null}
          </div>
        </header>

        <div className="knowledge-article-layout">
          <article className="knowledge-article-body">{children}</article>
          <aside className="knowledge-article-aside" aria-label="記事の補足情報">
            <section>
              <h2>一次資料</h2>
              <p>制度や計算条件は、次の公的機関の情報を基準に確認しています。</p>
              <ul>
                {sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.title}<span aria-hidden="true">↗</span>
                    </a>
                    <small>{source.organization}</small>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2>あわせて確認</h2>
              {related}
            </section>
          </aside>
        </div>
      </main>
    </SiteLayout>
  )
}

export default KnowledgeArticleLayout
