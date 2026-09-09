export const navigateToSimulationResult = (
  target: HTMLElement | null,
) => {
  if (target === null) {
    return
  }

  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const navigate = () => {
    if (typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      })
    }

    target.focus({ preventScroll: true })
  }

  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(navigate)
    return
  }

  navigate()
}
