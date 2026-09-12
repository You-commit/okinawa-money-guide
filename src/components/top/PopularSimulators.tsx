import { Link } from 'react-router-dom'
import { routes } from '../../app/routes'
import {
  ArrowRightIcon,
  BuildingIcon,
  GrowthChartIcon,
  HouseIcon,
  ShieldHeartIcon,
  SimulatorHubIcon,
  SproutIcon,
} from './TopIcons'

export type TopSimulatorId = 'military' | 'mortgage' | 'nisa' | 'ideco'

function SimulatorIcon({ id }: { id: TopSimulatorId | 'insurance' }) {
  if (id === 'military') {
    return <BuildingIcon />
  }

  if (id === 'mortgage') {
    return <HouseIcon />
  }

  if (id === 'nisa') {
    return <GrowthChartIcon />
  }

  if (id === 'ideco') {
    return <SproutIcon />
  }

  return <ShieldHeartIcon />
}

const simulators: Array<{
  id: TopSimulatorId | 'insurance'
  title: string
  description: string
  action: string
  href: string | null
}> = [
  {
    id: 'military',
    title: '軍用地投資シミュレーター',
    description: '利回りや地主金の配当をもとに、収益をシミュレーション',
    action: 'シミュレーションする',
    href: routes.militaryLand,
  },
  {
    id: 'mortgage',
    title: '住宅ローンシミュレーター',
    description: '借入可能額や返済額、金利比較で最適なプランを見つける',
    action: 'シミュレーションする',
    href: routes.mortgage,
  },
  {
    id: 'nisa',
    title: 'NISAシミュレーター',
    description: '積立額や利回りから将来の資産額をシミュレーション',
    action: 'シミュレーションする',
    href: routes.nisa,
  },
  {
    id: 'ideco',
    title: 'iDeCoシミュレーター',
    description: '節税メリットや受取額を見通し、老後資産を整理する',
    action: 'シミュレーションする',
    href: routes.ideco,
  },
  {
    id: 'insurance',
    title: '保険見直し',
    description: '保険のバランスや保障内容を学び、見直しをサポート',
    action: '準備中',
    href: null,
  },
]

function PopularSimulators() {
  return (
    <section
      className="top-option02__popular"
      id="popular-simulators"
      aria-labelledby="popular-simulators-title"
    >
      <div className="top-option02__section-title top-option02__section-title--popular">
        <span className="top-option02__section-title-icon" aria-hidden="true">
          <SimulatorHubIcon />
        </span>
        <h2 id="popular-simulators-title">人気のシミュレーター</h2>
      </div>
      <div className="top-option02__popular-grid">
        {simulators.map((simulator) => (
          <article
            className={`top-option02__simulator-card top-option02__simulator-card--${simulator.id}`}
            key={simulator.id}
          >
            <span className="top-option02__simulator-icon">
              <SimulatorIcon id={simulator.id} />
            </span>
            <h3>{simulator.title}</h3>
            <p>{simulator.description}</p>
            {simulator.href ? (
              <Link to={simulator.href}>
                {simulator.action}
                <ArrowRightIcon className="top-option02__card-arrow" />
              </Link>
            ) : (
              <button
                className="top-option02__simulator-status"
                type="button"
                disabled
                aria-label={`${simulator.title}は準備中`}
              >
                {simulator.action}
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

export default PopularSimulators
