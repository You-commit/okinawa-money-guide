// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { navigateToSimulationResult } from './simulationResultNavigation'

describe('navigateToSimulationResult', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses immediate scrolling when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    vi.stubGlobal(
      'requestAnimationFrame',
      (callback: FrameRequestCallback) => {
        callback(0)
        return 0
      },
    )

    const target = document.createElement('section')
    target.tabIndex = -1
    target.scrollIntoView = vi.fn()
    document.body.appendChild(target)

    navigateToSimulationResult(target)

    expect(target.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'start',
    })
    expect(document.activeElement).toBe(target)
    target.remove()
  })
})
