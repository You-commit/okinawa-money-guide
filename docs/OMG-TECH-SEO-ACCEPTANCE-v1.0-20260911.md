# OMG Technical SEO Acceptance

- Document ID: `OMG-TECH-SEO-ACCEPTANCE-v1.0-20260911`
- Date: 2026-09-11
- Branch: `feature/phase3-dedicated-pages-pc`
- Baseline SHA: `446505e61a3027d2b8dfbccf156d1e949a839492`
- Canonical origin: `https://okinawamoneyguide.jp`
- Overall result: **A — 正式受入可能**

## Scope

Indexable routes are limited to these nine routes:

1. `/`
2. `/simulators/military-land`
3. `/simulators/mortgage`
4. `/simulators/nisa`
5. `/simulators/ideco`
6. `/simulators/taxable-income`
7. `/knowledge`
8. `/about`
9. `/trust`

## Before

- Route metadata was applied only after React mounted.
- The initial HTTP HTML for deep links contained homepage metadata.
- `/* /index.html 200` made unknown paths return HTTP 200, creating a soft-404 risk.
- Basic OGP and X/Twitter metadata were not present.

The pre-change Cloudflare Preview reproduced these issues: a deep iDeCo URL and an unknown URL both returned homepage initial metadata, and the unknown URL returned HTTP 200.

## Implementation

- Added one typed SEO source shared by build-time HTML generation and runtime navigation.
- Vite now generates route-specific static HTML files for the eight non-home routes while preserving `index.html` for `/`.
- Added a top-level `404.html` with `noindex, follow` and no canonical/social tags.
- Removed the SPA catch-all rewrite and added explicit trailing-slash 301 redirects for the eight non-home formal routes.
- Added route-specific title, description, canonical, robots, OGP, and X/Twitter metadata.
- Added a factual homepage-only `WebSite` JSON-LD block.
- Preserved `BrowserRouter`, the approved UI, all simulator calculations, and all hero assets.

This structure follows Cloudflare Pages' documented static HTML and top-level `404.html` behavior: [Serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/) and [Redirects](https://developers.cloudflare.com/pages/configuration/redirects/).

## Initial HTTP HTML

All values below were read from the built `dist` through a local static HTTP server, before relying on client-side metadata updates.

| Route | HTTP | Title | Canonical | Robots | OGP / X |
| --- | ---: | --- | --- | --- | --- |
| `/` | 200 | 沖縄マネーガイド | `https://okinawamoneyguide.jp/` | index, follow | PASS |
| `/simulators/military-land` | 200 | 軍用地利回りシミュレーター \| 沖縄マネーガイド | canonical route | index, follow | PASS |
| `/simulators/mortgage` | 200 | 住宅ローンシミュレーター \| 沖縄マネーガイド | canonical route | index, follow | PASS |
| `/simulators/nisa` | 200 | NISAシミュレーター \| 沖縄マネーガイド | canonical route | index, follow | PASS |
| `/simulators/ideco` | 200 | iDeCo節税シミュレーター \| 沖縄マネーガイド | canonical route | index, follow | PASS |
| `/simulators/taxable-income` | 200 | 課税所得・所得税率シミュレーター \| 沖縄マネーガイド | canonical route | index, follow | PASS |
| `/knowledge` | 200 | お金の知識 \| 沖縄マネーガイド | canonical route | index, follow | PASS |
| `/about` | 200 | このサイトについて \| 沖縄マネーガイド | canonical route | index, follow | PASS |
| `/trust` | 200 | 信頼情報 \| 沖縄マネーガイド | canonical route | index, follow | PASS |

Each route also has a page-specific, non-promotional description. Every page has exactly one canonical. OGP includes `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, and `og:locale`. X metadata includes `twitter:card`, `twitter:title`, and `twitter:description`.

No `og:image` was added because no dedicated approved social image was identified in scope.

## URL normalization and 404

| Request | Result |
| --- | --- |
| `/simulators/ideco?incomeTaxRate=10` | HTTP 200; canonical excludes the query |
| `/simulators/ideco/` | HTTP 301 to `/simulators/ideco` |
| `/this-page-does-not-exist` | HTTP 404; noindex, follow; no canonical; assets load |
| `/simulators/not-real` | HTTP 404; noindex, follow; no canonical; assets load |
| `/abc123` | HTTP 404; noindex, follow; no canonical; assets load |

## robots.txt and sitemap.xml

- `robots.txt`: `User-agent: *`, `Allow: /`, canonical sitemap URL, no unintended `Disallow`.
- `sitemap.xml`: exactly nine unique HTTPS canonical URLs.
- No unknown, noindex, design-mock, or insurance route is included.
- No fabricated `lastmod` values are present.

## Structured data

Adopted:

- Homepage-only `WebSite` JSON-LD containing only the site name and canonical URL.

Not adopted:

- `SoftwareApplication`, FAQ, rating, review, award, price, author, and Organization claims: not required by or fully supported by the visible page content.
- `BreadcrumbList`: deferred to avoid introducing a partial schema implementation before a dedicated cross-route breadcrumb policy is approved.

## Semantics, images, and links

- All nine routes render exactly one H1.
- All rendered `<img>` elements have an `alt` attribute; decorative images use empty alt text where appropriate.
- CSS hero backgrounds remain decorative and were not given artificial alt text.
- No broken rendered images were found.
- No internal link to a non-formal path was found.
- No `target="_blank"` external link without `noopener` or `noreferrer` was found.
- `lang="ja"` and the approved favicon/icon declarations remain present.

## Automated and browser QA

- Tests: PASS — 17 files, 431 tests.
- Build: PASS.
- Lint: PASS.
- `git diff --check`: PASS.
- Local built-output HTTP checks: nine formal routes returned 200; three unknown routes returned 404.
- Browser 1440×900: Home and five simulator routes passed without horizontal scroll, broken images, metadata regressions, or missing structural regions.
- Browser 1200×900: same result.
- Console errors: 0.
- Console warnings: 0.

## Acceptance matrix

| Item | Result | Note |
| --- | --- | --- |
| Initial HTML metadata | PASS | Route-specific in built HTTP HTML |
| Title | PASS | Nine unique, accurate page titles |
| Description | PASS | Nine page-specific descriptions |
| Canonical | PASS | One canonical per indexable page |
| Robots meta | PASS | Indexable pages index/follow; 404 noindex/follow |
| robots.txt | PASS | Canonical sitemap and no accidental blocking |
| sitemap.xml | PASS | Exact nine-route set |
| OGP | PASS WITH FOLLOW-UP | Required text fields complete; approved dedicated image pending |
| X metadata | PASS | Summary card and route-specific text |
| Structured data | PASS | Minimal factual WebSite schema only |
| H1 | PASS | One per formal route |
| Image alt | PASS | No missing alt attributes |
| Internal links | PASS | No invalid internal destinations found |
| External links | PASS | Safe rel usage confirmed |
| Direct deep links | PASS | Built route HTML returns 200 |
| Query canonicalization | PASS | Query and hash excluded |
| Unknown route HTTP 404 | PASS | Three representative paths return 404 |
| 404 noindex | PASS | Initial HTML and runtime agree |
| Build output | PASS | Static route files and `404.html` generated |
| Browser regression | PASS | 1440×900 and 1200×900 |

## Follow-up

- Create and approve a dedicated social sharing image before adding `og:image`.
- After this branch is pushed in a separate approved step, repeat the status and initial-HTML checks against the new Cloudflare Preview. The current task intentionally does not push or deploy.

No P0 Technical SEO issue remains in the implementation. The follow-ups above do not block acceptance.
