# Mortgage Regression Gate — 2026-11-24 (Draft)

Baseline main commit: ae7df437d43333754ea2a707385d969ac66078e5
Scope: src/MortgageCalculator.tsx, plus CI workflow only.

## Root causes
The two failures in src/MortgageCalculator.test.tsx were missing metadata on .mortgage-trajectory-difference__visual:
- Zero-interest case had no data-mobile-crossover-label="期間内のマイナス転換なし".
- 10-year-1-month crossover case had no data-mobile-axis-layout="months" or the monthly negative crossover label.

The monthly trajectory itself is already calculated; the chart already samples crossoverMonth and renders the crossover marker. This patch adds only derived view metadata without changing formulas, inputs, Reset/Undo, state, chart positions, sizes, styles, labels currently visible, or tests.

## Gates
- npm ci / lint / build / full npm test in mandatory GitHub Actions.
- Pre-existing tests are unchanged, including the two previously failing assertions.
- This is isolated from editorial PR #15 and PR #16. Do not merge main / production without user acceptance.
- Follow-up: mobile visual QA in isolated Preview for 0% and crossover monthly conditions. Metadata test PASS alone does not establish full screen UX quality.
