export const routes = {
  home: '/',
  militaryLand: '/simulators/military-land',
  mortgage: '/simulators/mortgage',
  nisa: '/simulators/nisa',
  ideco: '/simulators/ideco',
  taxableIncome: '/simulators/taxable-income',
  knowledge: '/knowledge',
  about: '/about',
  trust: '/trust',
} as const

export const simulatorRoutes = [
  { path: routes.militaryLand, label: '軍用地' },
  { path: routes.mortgage, label: '住宅ローン' },
  { path: routes.nisa, label: 'NISA' },
  { path: routes.ideco, label: 'iDeCo' },
  { path: routes.taxableIncome, label: '課税所得' },
] as const

export const oldToolHashRoutes: Record<string, string> = {
  '#tool-panel-military': routes.militaryLand,
  '#tool-panel-mortgage': routes.mortgage,
  '#tool-panel-nisa': routes.nisa,
  '#tool-panel-ideco': routes.ideco,
}
