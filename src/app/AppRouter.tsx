import { BrowserRouter, Route, Routes } from 'react-router-dom'
import RouteEffects from './RouteEffects'
import AboutPage from '../pages/AboutPage'
import HomePage from '../pages/HomePage'
import IdecoPage from '../pages/IdecoPage'
import KnowledgePage from '../pages/KnowledgePage'
import MilitaryLandPage from '../pages/MilitaryLandPage'
import MortgagePage from '../pages/MortgagePage'
import NisaPage from '../pages/NisaPage'
import NotFoundPage from '../pages/NotFoundPage'
import TaxableIncomePage from '../pages/TaxableIncomePage'
import TrustPage from '../pages/TrustPage'
import { routes } from './routes'

function AppRouter() {
  return (
    <BrowserRouter>
      <RouteEffects />
      <Routes>
        <Route path={routes.home} element={<HomePage />} />
        <Route path={routes.militaryLand} element={<MilitaryLandPage />} />
        <Route path={routes.mortgage} element={<MortgagePage />} />
        <Route path={routes.nisa} element={<NisaPage />} />
        <Route path={routes.ideco} element={<IdecoPage />} />
        <Route path={routes.taxableIncome} element={<TaxableIncomePage />} />
        <Route path={routes.knowledge} element={<KnowledgePage />} />
        <Route path={routes.about} element={<AboutPage />} />
        <Route path={routes.trust} element={<TrustPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
