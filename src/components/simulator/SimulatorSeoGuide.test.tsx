// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import SimulatorSeoGuide from './SimulatorSeoGuide'
import type { SimulatorTheme } from './SimulatorPageShell'

const cases: Array<{ theme: SimulatorTheme; heading: string }> = [
  { theme: 'military', heading: '軍用地の利回りを判断するときの見方' },
  { theme: 'mortgage', heading: '住宅ローンの試算結果を比較するときの見方' },
  { theme: 'nisa', heading: 'NISAの積立試算を使うときの見方' },
  { theme: 'ideco', heading: 'iDeCoの節税試算を使うときの見方' },
  { theme: 'taxable', heading: '課税所得と所得税率の試算を使うときの見方' },
]

afterEach(() => cleanup())

describe('SimulatorSeoGuide', () => {
  for (const testCase of cases) {
    it(`renders useful visible guide content for ${testCase.theme}`, () => {
      render(
        <MemoryRouter>
          <SimulatorSeoGuide theme={testCase.theme} />
        </MemoryRouter>,
      )

      expect(screen.getByRole('heading', { name: testCase.heading })).toBeTruthy()
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3)
      expect(screen.getByRole('navigation', { name: '関連ページ' })).toBeTruthy()
      expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(2)
    })
  }
})
