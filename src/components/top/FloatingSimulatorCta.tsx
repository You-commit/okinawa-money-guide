import { Link } from 'react-router-dom'
import { CalculatorIcon, ChevronUpIcon } from './TopIcons'

function FloatingSimulatorCta() {
  return (
    <Link
      className="top-option02__floating-cta"
      to="/#popular-simulators"
      aria-label="人気のシミュレーターへ移動する"
    >
      <span className="top-option02__floating-icon" aria-hidden="true">
        <CalculatorIcon />
      </span>
      <span>シミュレーター<br />を試す</span>
      <span className="top-option02__floating-arrow" aria-hidden="true">
        <ChevronUpIcon />
      </span>
    </Link>
  )
}

export default FloatingSimulatorCta
