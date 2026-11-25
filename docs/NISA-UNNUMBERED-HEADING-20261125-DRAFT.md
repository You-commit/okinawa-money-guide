# NISA Article — unnumbered headings and sequential sources
Date: 2026-11-25. Draft / not merged.

Reference is current illustration-containing NISA article, PR #19 SHA 31f92fff42395b04c56a47b38970e0d4a846de4d.

## Evidence
User screenshot shows two issues: duplicated 01–08 labels in sidebar and h2 headings; sources section rendered alongside FAQ on desktop.
Official NISA resource examples: 琉球銀行 https://www.ryugin.co.jp/unyou/toushin/nisa/ ; MUFG https://www.bk.mufg.jp/tameru/nisa/column/index.html ; みずほ https://www.mizuhobank.co.jp/academy/index.html .
These inform Japanese editorial reading hierarchy rather than copying visual designs.

## Changes
1. Remove only 16 decorative chapter-number span tags. Keep eight chapter ids, names and order, all body text, illustration, charts, external sources and CTA.
2. Simple full-width h2 with understated underline; natural TOC without badges.
3. Place 参考・一次資料 below FAQ in full-width reading flow, improve source link and FAQ readability.
4. Add AppRouter regression test and mandatory strict lint/build/full-suite and real-browser comparison of 1440/390/320 layouts.

User visual acceptance before merge to prior PR and before release. No simulator or top page code change.
