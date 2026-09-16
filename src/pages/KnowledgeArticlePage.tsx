import { Link, useParams } from 'react-router-dom'
import { routes } from '../app/routes'
import { knowledgeArticleBySlug } from '../content/knowledgeArticles'
import SiteLayout from '../layouts/SiteLayout'
import KnowledgeArticleVisual from './KnowledgeArticleVisual'
import NotFoundPage from './NotFoundPage'
import './KnowledgeArticlePage.css'

function formatDate(value: string) {
  const [year, month, day] = value.split('-')
  return `${year}年${Number(month)}月${Number(day)}日`
}

function KnowledgeArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const article = slug ? knowledgeArticleBySlug.get(slug) : undefined

  if (!article) return <NotFoundPage />

  return (
    <SiteLayout className="dedicated-page knowledge-article-page">
      <main id="main-content">
        <article className="knowledge-article">
          <header className="knowledge-article__header">
            <nav className="knowledge-article__breadcrumb" aria-label="パンくずリスト">
              <Link to={routes.home}>ホーム</Link>
              <span aria-hidden="true">›</span>
              <Link to={routes.knowledge}>お金の知識</Link>
              <span aria-hidden="true">›</span>
              <span>{article.categoryLabel}</span>
            </nav>

            <p className="knowledge-article__category">{article.categoryLabel}</p>
            <h1>{article.title}</h1>
            <p className="knowledge-article__summary">{article.summary}</p>
            <div className="knowledge-article__dates" aria-label="記事の日付">
              <span>公開：{formatDate(article.publishedAt)}</span>
              <span>更新：{formatDate(article.updatedAt)}</span>
            </div>
          </header>

          <KnowledgeArticleVisual slug={article.slug} />

          <div className="knowledge-article__body">
            {article.sections.map((section, index) => (
              <section key={section.heading} className={section.bullets ? 'knowledge-article__section knowledge-article__section--data' : 'knowledge-article__section'}>
                <div className="knowledge-article__section-index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="knowledge-article__section-content">
                  <h2>{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets ? (
                    <ul className="knowledge-article__fact-grid">
                      {section.bullets.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </div>

          <aside className="knowledge-article__simulator" aria-label="関連シミュレーター">
            <div className="knowledge-article__simulator-mark" aria-hidden="true">↗</div>
            <div>
              <p className="knowledge-article__label">SIMULATOR</p>
              <h2>自分の条件で数字を確認する</h2>
              <p>{article.simulator.description}</p>
              <Link to={article.simulator.path}>
                {article.simulator.label}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </aside>

          <section className="knowledge-article__sources" aria-labelledby="article-sources-title">
            <p className="knowledge-article__label">PRIMARY SOURCES</p>
            <h2 id="article-sources-title">主な一次情報・参考情報</h2>
            <p>
              制度・商品条件は変更される場合があります。重要な判断では、以下の公式情報と利用する金融機関の最新案内をご確認ください。
            </p>
            <ul>
              {article.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.title}
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <nav className="knowledge-article__footer-nav" aria-label="記事ナビゲーション">
            <Link to={routes.knowledge}>お金の知識一覧へ戻る</Link>
          </nav>
        </article>
      </main>
    </SiteLayout>
  )
}

export default KnowledgeArticlePage
