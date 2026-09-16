// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import KnowledgeArticlePage from './KnowledgeArticlePage'

function renderArticle(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/knowledge/:slug" element={<KnowledgeArticlePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => cleanup())

describe('KnowledgeArticlePage', () => {
  it('renders the NISA article with one H1, dates, simulator CTA and safe primary-source links', () => {
    const { container } = renderArticle('/knowledge/nisa-basics')

    expect(screen.getByRole('heading', {
      level: 1,
      name: 'NISAの基本｜非課税枠と始める前に確認したいこと',
    })).toBeTruthy()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(screen.getByText('公開：2026年9月16日')).toBeTruthy()
    expect(screen.getByText('更新：2026年9月16日')).toBeTruthy()

    const simulator = screen.getByRole('link', {
      name: /NISAシミュレーターで試算する/,
    })
    expect(simulator.getAttribute('href')).toBe('/simulators/nisa')

    const sourceLinks = screen.getAllByRole('link').filter((link) =>
      link.getAttribute('href')?.startsWith('https://www.fsa.go.jp/'),
    )
    expect(sourceLinks).toHaveLength(3)
    for (const link of sourceLinks) {
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    }
  })

  it('renders the mortgage article and links to the mortgage simulator', () => {
    renderArticle('/knowledge/mortgage-repayment-methods')

    expect(screen.getByRole('heading', {
      level: 1,
      name: '元利均等返済と元金均等返済の違い｜住宅ローンの返済方法を比較',
    })).toBeTruthy()
    expect(screen.getByRole('link', {
      name: /住宅ローンシミュレーターで比較する/,
    }).getAttribute('href')).toBe('/simulators/mortgage')
  })

  it('renders the real not-found page for an unpublished article slug', () => {
    renderArticle('/knowledge/not-published')

    expect(screen.getByRole('heading', {
      level: 1,
      name: 'ページが見つかりません',
    })).toBeTruthy()
  })
})
