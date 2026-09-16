# OMG Codex SEO / Content Rebuild Brief v1.0

Date: 2026-09-16
Status: Approved implementation brief / work branch only
Target branch: `feature/seo-content-codex-rebuild`
Base: `main` at `e3ec9c53bf1d8cf21c8b8b2f99ecba4769455d27`

## 1. Non-negotiable operating rules

- Work from the current `main` only.
- Do NOT cherry-pick, copy, or reuse implementation code from `feature/seo-simulator-content-foundation` unless the user explicitly re-approves an individual element. That branch contains rejected UI/content work and is retained only as history.
- Protect any unrelated uncommitted work if operating locally.
- Do not reset, force-reset, merge to `main`, push to Production, or deploy Production without explicit user approval.
- Before any implementation, inspect the repository broadly enough to understand existing approved patterns.
- Treat OMG Design Language and approved existing pages as constraints, not inspiration that may be freely reinterpreted.

## 2. Product principles to preserve

Core OMG principle: `信頼 × 先進性 × 穏やかさ`.

Priority order for this work:
1. Trust / user value
2. Okinawa-specific usefulness where genuinely relevant
3. Monetization

Do not make the site look “AI-generated”. Avoid visual devices that are generic, ornamental, or mechanically repeated.

## 3. Mandatory audit before coding

Read and summarize the current architecture and approved patterns before editing code. At minimum inspect:

- `src/pages/HomePage.tsx`
- `src/pages/KnowledgePage.tsx`
- `src/pages/NisaPage.tsx`
- `src/pages/MortgagePage.tsx`
- `src/pages/IdecoPage.tsx`
- `src/pages/MilitaryLandPage.tsx`
- `src/pages/TaxableIncomePage.tsx`
- `src/components/simulator/SimulatorPageShell.tsx`
- `src/components/simulator/SimulatorNotes.tsx`
- calculator components and their CSS for NISA / mortgage / iDeCo / military land / taxable income
- `src/App.css`
- `src/app/seo.ts`
- `src/app/seoMarkup.ts`
- `src/app/routes.ts`
- `public/sitemap.xml`
- `public/robots.txt`
- `public/_redirects`
- `vite.config.ts`
- relevant tests
- formal docs under `docs/`, especially OMG-DL, WBS addendum, SEO/content growth plan, monetization / partnership policy if present

Audit output must identify:
- which existing patterns are approved and should be reused,
- where current SEO is already technically correct,
- what is actually missing for simulator search visibility,
- how article pages should fit into the existing `/knowledge` information architecture,
- what should NOT be changed.

Do not start implementation until this audit is complete.

## 4. Simulator SEO objective

Current simulator pages already have individual URLs, title/description/canonical, `index, follow`, sitemap entries, and robots crawl permission. Do not claim these are missing and do not rebuild them without a concrete reason.

Goal: improve the probability that each simulator is understood as a useful standalone search result by strengthening unique, visible, user-helpful page content and internal linking without harming the calculator experience.

Pages:
- `/simulators/military-land`
- `/simulators/mortgage`
- `/simulators/nisa`
- `/simulators/ideco`
- `/simulators/taxable-income`

Requirements:
- unique explanatory content per simulator,
- content must help a human make sense of the calculation,
- content pattern may differ by simulator,
- do not append the same generic 3-card SEO block to all five pages,
- do not add hidden keyword text,
- do not make claims unsupported by primary sources / approved calculation specs,
- connect each simulator to genuinely relevant knowledge content,
- preserve existing simulator UI, calculations, approved affiliate placement, and consultation-summary behavior unless required by the approved design.

Investigate whether the current static-SEO build approach should be enhanced so meaningful page-specific content is present in initial HTML. If proposing SSG/prerendering, keep the React/Vite architecture stable and justify the smallest safe change.

## 5. Article/content objective

Articles are not “SEO filler”. They must function as editorial decision-support content that naturally feeds into simulators.

Initial article direction:
- NISA: focus on understanding tax-free limits / contribution planning / what the simulator result means.
- Mortgage: focus on what to compare when evaluating a home loan, including repayment method and cost items; add Okinawa specificity only where supported and genuinely useful.

Next article candidates after the first two are accepted:
- military-land multiplier vs yield,
- iDeCo contribution limits / regime timing,
- taxable income vs income-tax rate,
- car insurance / fire insurance / Okinawa financial institution comparison where primary data is available.

Article requirements:
- use primary sources first,
- show publication/update date and basis date where conditions can change,
- clear source section,
- article-specific internal links,
- article -> simulator link at the point where a user logically needs to test their own numbers,
- simulator -> article link where explanation is needed,
- no forced Okinawa keyword insertion,
- no unverified rankings or payout-driven recommendations.

## 6. Visual / editorial design rules

Do NOT create a generic “AI article template” made from stacked rounded cards.

Forbidden unless meaningfully justified:
- automatic `01 / 02 / 03` numbering everywhere,
- arbitrary metric tiles,
- decorative gradients,
- fake charts or illustrative numbers presented as facts,
- generic AI illustrations,
- identical card layouts for every section,
- icons added only to make a section look busy,
- every paragraph enclosed in a panel,
- oversized CTA blocks repeated mechanically.

Preferred approach:
- normal editorial typography and whitespace for prose,
- comparison table only when there is a real comparison,
- chart only for real quantitative relationships/data,
- timeline only for a real sequence or regime date,
- callout only for a material warning / definition / decision point,
- formulas / worked examples where they improve understanding,
- diagrams should explain a financial concept, not decorate it,
- reuse existing OMG spacing, typography, navigation, header/footer, surface language, and accessibility patterns.

The article visual system should feel like an extension of the existing approved OMG site, not a new mini-site.

## 7. Monetization rules

Monetization must follow the approved financial affiliate / partnership policy.

- Trust and user usefulness come first.
- Do not alter comparison order because of commission.
- Do not recommend an advertiser unnaturally.
- Clearly satisfy legal/ASP/advertiser disclosure requirements.
- Do not connect calculator result values to an ad recommendation.
- Article monetization may be added only after the article information architecture is sound.
- Existing DMM NISA affiliate behavior must not regress.

## 8. SEO implementation requirements

For approved article pages and simulator enhancements, verify as applicable:
- unique title,
- meta description,
- canonical,
- robots,
- sitemap,
- trailing-slash canonicalization / redirects,
- Open Graph,
- Twitter metadata,
- structured data only where truthful and supported,
- internal links,
- 404 behavior,
- static initial HTML / crawlability.

Do not use structured data to describe content that is not visibly present.

## 9. Quality gate

Before requesting user visual approval:
- `git diff --check`
- full test suite
- build
- lint
- verify generated static HTML for relevant routes
- verify canonical / robots / sitemap
- verify 404
- PC layout
- smartphone layout
- no horizontal overflow
- no console errors
- no failed resources
- confirm existing DMM affiliate placement still works
- confirm rejected branch code was not imported

Then deploy only to a Cloudflare Preview / feature branch environment.

## 10. Approval boundary

Stop at Preview after QA and report:
- audit findings,
- files changed,
- reasons for each design choice,
- test/build/lint results,
- Preview URLs,
- known limitations.

Do not merge to `main` or deploy Production until the user explicitly approves the Preview.

## 11. First Codex deliverable

Before writing implementation code, produce a concise audit/design memo containing:
1. current architecture findings,
2. simulator SEO diagnosis,
3. article IA proposal,
4. visual/editorial rules mapped to existing OMG components,
5. minimal technical plan,
6. files expected to change,
7. risks and non-goals.

Only after that memo is reviewed against this brief should implementation begin.
