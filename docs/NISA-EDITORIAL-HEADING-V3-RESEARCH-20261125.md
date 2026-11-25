# NISA記事のタイトル帯 改訂案 v3（2026-11-25）

研究証跡: GitHub Actions 45546605019, branch review/editorial-reference-20261125。1440×900の実ブラウザ画面を確認。
- SMBC Money VIVA: https://www.smbc.co.jp/kojin/money-viva/nisa2024/0003/ （HTTP 200、Noto Sans JP 28px、淡い緑のタイトル帯約180px、余計な装飾なし）
- MUFG Money Canvas: https://moneycanvas.bk.mufg.jp/know/column/yZKQSiCHjWxV4n4/ （200、Noto Sans JP 24px、記事テーマ画像と本文のタイトルを分離）
- 野村證券: https://www.nomura.co.jp/solution/financial-assets/nisa/reserve/ （200、Noto Serif JP 50px、タイトル領域231px、カテゴリに応じたタイポグラフィ）
- 金融庁: https://www.fsa.go.jp/policy/nisa2/know/ （200、36px、約140pxの単色タイトル帯）
- 政府広報: 403、視覚比較対象から除外。

採用: SMBCと金融庁の簡潔な色面・タイトルの階層。OMG既存のネイビー文字、青緑のブランドアクセント、既存タイポグラフィに合わせ、装飾のない青系単色帯に限定する。曲線、数字パネル、画像、追加テキスト、影、グラデーションは採用しない。既存見出しの改行をCSSで自然な折り返しにし、PCの巨大な余白を縮小する。

変更範囲: NISA記事タイトル帯CSSのみ。元の受入済み候補5d0e2b4から派生し、拒否されたPR #22、#23は取り込まない。既存本文・グラフ・ナビゲーション・全シミュレーターを維持。正式採用はユーザー承認後。main、本番変更なし。
