import { Link } from 'react-router-dom'
import { CalculatorIcon, ChevronUpIcon } from './TopIcons'

function FloatingSimulatorCta() {
  const scrollToSimulatorList = () => {
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    document.getElementById('popular-simulators')?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <Link
      className="top-option02__floating-cta"
      to="/#popular-simulators"
      aria-label="人気のシミュレーターへ移動する"
      onClick={scrollToSimulatorList}
      onKeyDown={(event) => {
        if (event.key === ' ') {
          event.preventDefault()
          event.currentTarget.click()
        }
      }}
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
