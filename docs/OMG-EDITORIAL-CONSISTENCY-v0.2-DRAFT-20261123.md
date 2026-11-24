# OMG Editorial Consistency v0.2 — Draft / Site-wide editorial surfaces
Date: 2026-11-23
Status: Design review / CI requested; not accepted for production.

## Base
main: ae7df437d43333754ea2a707385d969ac66078e5.
PR #14 NISA (Draft) is not merged; its classes are supported for future integration.
OMG-DL v1.0 / confirmed simulator specifications remain authoritative.

## Protected scope
No edits to any of 5 calculators, calculations, chart data, input semantics, Reset/Undo, or affiliate/ad control.
The approved homepage and top header/footer have no styling changes.
No production deployment / merge without user visual acceptance.

## Changes
- src/App.tsx: one late-scoped CSS import.
- src/styles/editorial-consistency.css: headings, body, captions, cards, NISA article chart labels, focus styles, Trust hero guard.
- scripts/check-editorial-scope.mjs: guards selectors against accidental calculator/top/global style.
- .github/workflows/editorial-review.yml: CI lint, build, route tests, full suite baseline tracking.

## Acceptance gates
1. Native build/lint/unit tests in GitHub Actions.
2. Inspect Cloudflare branch Preview for Knowledge Hub, NISA article, mortgage article, About, Trust and 404 on PC+mobile.
3. Compare five existing simulators to main both visually and functionally.
4. User visual acceptance, then explicit merge / production approval.
Full suite baseline previously had 2 mortgage test failures; re-measure rather than silently changing test expectations.

## Outstanding
Until actual Preview visual review, this branch is Draft.
Do not merge PR #14 automatically; it has its own separate approval.
The formal WBS and OMG-DL are not overwritten.
