import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { routes } from '../../app/routes'
import SiteLayout from '../../layouts/SiteLayout'

export type SimulatorTheme = 'military' | 'mortgage' | 'nisa' | 'ideco' | 'taxable'

type SimulatorPageShellProps = {
  theme: SimulatorTheme
  eyebrow: string
  title: string
  description: ReactNode
  benefits: Array<{ title: string; description: string }>
  heroVisual?: ReactNode
  children: ReactNode
  notes?: ReactNode
}

function SimulatorPageShell({
  theme,
  eyebrow,
  title,
  description,
  benefits,
  heroVisual,
  children,
  notes,
}: SimulatorPageShellProps) {
  return (
    <SiteLayout className={`dedicated-page simulator-page simulator-page--${theme}`}>
      <main id="main-content">
        <section className="simulator-page__hero">
          <div className="simulator-page__hero-inner">
            <div className="simulator-page__hero-copy">
              <nav className="breadcrumb" aria-label="パンくずリスト">
                <Link to={routes.home}>ホーム</Link>
                <span aria-hidden="true">›</span>
                <span>シミュレーター</span>
              </nav>
              <p className="simulator-page__eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            {heroVisual ? (
              <div className="simulator-page__hero-stage">
                {heroVisual}
                <Benefits title={title} benefits={benefits} />
              </div>
            ) : (
              <Benefits title={title} benefits={benefits} />
            )}
          </div>
        </section>

        <div className="simulator-page__main">
          <div className="simulator-page__calculator">{children}</div>
          {notes ? <div className="simulator-page__notes">{notes}</div> : null}
        </div>
      </main>
    </SiteLayout>
  )
}

const Benefits = ({
  title,
  benefits,
}: {
  title: string
  benefits: Array<{ title: string; description: string }>
}) => (
  <div className="simulator-page__benefits" aria-label={`${title}の特長`}>
    {benefits.map((benefit, index) => (
      <article key={benefit.title}>
        <b aria-hidden="true">0{index + 1}</b>
        <span>
          <strong>{benefit.title}</strong>
          <small>{benefit.description}</small>
        </span>
      </article>
    ))}
  </div>
)

export default SimulatorPageShell
