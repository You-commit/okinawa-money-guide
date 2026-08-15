import type { CSSProperties } from 'react'
import actionArrowRight from '../../assets/top-icons/action-arrow-right.svg'
import actionCalculator from '../../assets/top-icons/action-calculator.svg'
import actionChevronRight from '../../assets/top-icons/action-chevron-right.svg'
import actionChevronUp from '../../assets/top-icons/action-chevron-up.svg'
import actionPlayCircle from '../../assets/top-icons/action-play-circle.svg'
import headerSearch from '../../assets/top-icons/header-search.svg'
import navigationChevronDown from '../../assets/top-icons/navigation-chevron-down.svg'
import popularHeadingHub from '../../assets/top-icons/popular-heading-hub.svg'
import popularIdeco from '../../assets/top-icons/popular-ideco.png'
import popularInsurance from '../../assets/top-icons/popular-insurance.png'
import popularMilitary from '../../assets/top-icons/popular-military.png'
import popularMortgage from '../../assets/top-icons/popular-mortgage.png'
import popularNisa from '../../assets/top-icons/popular-nisa.png'
import purposeBorrow from '../../assets/top-icons/purpose-borrow.png'
import purposeGrow from '../../assets/top-icons/purpose-grow.png'
import purposeProtect from '../../assets/top-icons/purpose-protect.png'
import purposeSave from '../../assets/top-icons/purpose-save.png'
import stepCalculator from '../../assets/top-icons/step-calculator.png'
import stepInput from '../../assets/top-icons/step-input.png'
import stepResults from '../../assets/top-icons/step-results.png'
import trustDisclaimer from '../../assets/top-icons/trust-disclaimer.svg'
import trustReliable from '../../assets/top-icons/trust-reliable.svg'
import trustUpdate from '../../assets/top-icons/trust-update.svg'

type IconProps = {
  className?: string
}

function AssetIcon({ className, src }: IconProps & { src: string }) {
  return (
    <img
      className={className ? `top-option02__asset-icon ${className}` : 'top-option02__asset-icon'}
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  )
}

function MaskIcon({ className, src }: IconProps & { src: string }) {
  const style = {
    '--top-option02-icon-mask': `url("${src}")`,
  } as CSSProperties

  return (
    <span
      className={className ? `top-option02__mask-icon ${className}` : 'top-option02__mask-icon'}
      style={style}
      aria-hidden="true"
    />
  )
}

export function CalculatorIcon({ className }: IconProps) {
  return <MaskIcon className={className} src={actionCalculator} />
}

export function PlayCircleIcon({ className }: IconProps) {
  return <MaskIcon className={className} src={actionPlayCircle} />
}

export function ArrowRightIcon({ className }: IconProps) {
  return <MaskIcon className={className} src={actionArrowRight} />
}

export function ChevronDownIcon({ className }: IconProps) {
  return <MaskIcon className={className} src={navigationChevronDown} />
}

export function ChevronRightIcon({ className }: IconProps) {
  return <MaskIcon className={className} src={actionChevronRight} />
}

export function ChevronUpIcon({ className }: IconProps) {
  return <MaskIcon className={className} src={actionChevronUp} />
}

export function SearchIcon({ className }: IconProps) {
  return <MaskIcon className={className} src={headerSearch} />
}

export function SimulatorHubIcon({ className }: IconProps) {
  return <MaskIcon className={className} src={popularHeadingHub} />
}

export function BuildingIcon({ className }: IconProps) {
  return <AssetIcon className={className} src={popularMilitary} />
}

export function HouseIcon({ className }: IconProps) {
  return <AssetIcon className={className} src={popularMortgage} />
}

export function GrowthChartIcon({ className }: IconProps) {
  return <AssetIcon className={className} src={popularNisa} />
}

export function SproutIcon({ className }: IconProps) {
  return <AssetIcon className={className} src={popularIdeco} />
}

export function ShieldHeartIcon({ className }: IconProps) {
  return <AssetIcon className={className} src={popularInsurance} />
}

export function HandYenIcon({ className }: IconProps) {
  return <AssetIcon className={className} src={purposeBorrow} />
}

export function PiggyBankIcon({ className }: IconProps) {
  return <AssetIcon className={className} src={purposeSave} />
}

export function PurposeGrowthIcon({ className }: IconProps) {
  return <AssetIcon className={className} src={purposeGrow} />
}

export function PurposeShieldIcon({ className }: IconProps) {
  return <AssetIcon className={className} src={purposeProtect} />
}

export function StepInputIcon({ className }: IconProps) {
  return <AssetIcon className={className} src={stepInput} />
}

export function StepCalculatorIcon({ className }: IconProps) {
  return <AssetIcon className={className} src={stepCalculator} />
}

export function StepResultsIcon({ className }: IconProps) {
  return <AssetIcon className={className} src={stepResults} />
}

export function TrustReliableIcon({ className }: IconProps) {
  return <AssetIcon className={className} src={trustReliable} />
}

export function TrustUpdateIcon({ className }: IconProps) {
  return <AssetIcon className={className} src={trustUpdate} />
}

export function TrustDisclaimerIcon({ className }: IconProps) {
  return <AssetIcon className={className} src={trustDisclaimer} />
}
