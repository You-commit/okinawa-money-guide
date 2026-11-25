import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { routes } from '../../app/routes'
import SiteLayout from '../../layouts/SiteLayout'

type ArticleSource = {
  title: string
  organization: string
  url: string
}

type KnowledgeArticleLayoutProps = {
  eyebrow?: string
  topic?: string
  sections: ReadonlyArray<{ id: string; label: string }>
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
  topic,
  sections,
  title,
  lead,
  publishedAt,
  updatedAt,
  basisDate,
  children,
  sources,
  related,
}: KnowledgeArticleLayoutProps) {
  const [active, setActive] = useState(sections[0]?.id ?? 'article-sources')
  const items = [...sections, { id: 'article-sources', label: '参考・一次資料' }]

  useEffect(() => {
    const sync = () => {
      const ids = [...sections.map(section => section.id), 'article-sources']
      const current = ids.filter(id => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= 170).at(-1)
      setActive(current ?? ids[0])
    }
    sync()
    window.addEventListener('scroll', sync, { passive: true })
    return () => window.removeEventListener('scroll', sync)
  }, [sections])

  const toc = (className: string) => (
    <nav className={className} aria-label="記事内メニュー">
      {items.map(item => <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? 'location' : undefined} onClick={() => setActive(item.id)}>{item.label}</a>)}
    </nav>
  )
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
              <span aria-current="page">{topic ?? title}</span>
            </nav>
            <div className="knowledge-article-hero__copy">
            {eyebrow ? <p className="info-eyebrow">{eyebrow}</p> : null}
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
          </div>
        </header>

        <div className="knowledge-article-layout">
          <aside className="knowledge-article-aside" aria-label="この記事の内容">
            <section className="knowledge-article-toc">
              <h2>この記事の内容</h2>
              {toc('knowledge-article-toc__links')}
            </section>
          </aside>
          <div className="knowledge-article-mobile-toc">
            <details><summary>この記事の内容</summary>{toc('knowledge-article-toc__links')}</details>
          </div>
          <article className="knowledge-article-body">
            {children}
            <section id="article-sources" className="knowledge-article-sources">
              <h2>参考・一次資料</h2>
              <p>制度や計算条件は、次の公的機関の情報を基準に確認しています。</p>
              <ul>
                {sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}<span aria-hidden="true"> ↗</span></a><small>{source.organization}</small></li>)}
              </ul>
            </section>
            <section className="knowledge-article-end-links">
              <h2>関連コンテンツ</h2>
              {related}
            </section>
          </article>
        </div>
      </main>
    </SiteLayout>
  )
}

export default KnowledgeArticleLayout
