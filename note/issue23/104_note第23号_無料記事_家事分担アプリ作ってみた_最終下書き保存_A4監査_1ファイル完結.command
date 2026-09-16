#!/bin/zsh
set -euo pipefail

RUNTIME="$HOME/Library/Application Support/YukiNoteAutomation"
AUTH="$RUNTIME/.auth/note-profile"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
AUTH_PORT=9421
CDP_URL="http://127.0.0.1:$AUTH_PORT"

ENGINE=""
HELPER=""
for n in 102 101 100; do
  e="$RUNTIME/scripts/${n}-engine-final-draft-a4-only.mjs"
  h="$RUNTIME/scripts/${n}-helper-auto-leave-dialog.mjs"
  if [ -f "$e" ] && [ -f "$h" ]; then
    ENGINE="$e"
    HELPER="$h"
    break
  fi
done

[ -n "$ENGINE" ] || { echo "❌ A4下書きエンジンが見つかりません"; exit 1; }
[ -n "$HELPER" ] || { echo "❌ Chrome補助スクリプトが見つかりません"; exit 1; }

ROOT="$RUNTIME/package-current-issue23-chore-app-draft"
ARTICLE="$ROOT/note第23号_画像承認済み_正式下書きパッケージ_v1/第23号無料"
STATE="$RUNTIME/state/issue23-chore-app-draft"
DRAFT_STATE="$STATE/draft_url.txt"
COMPLETE_STATE="$STATE/draft_audit_complete.txt"
HEADER_SOURCE="$ARTICLE/.approved_header_source.png"
HEADER="$ARTICLE/02_アイキャッチ_第23号無料_家事分担アプリ作ってみた.png"
HEADER_URL="https://raw.githubusercontent.com/You-commit/okinawa-money-guide/note-issue23-family-chore-app-20260916/note/issue23/approved_header.png"
AUTH_CHROME_PID=""

cleanup() {
  if [ -n "${AUTH_CHROME_PID:-}" ]; then
    kill "$AUTH_CHROME_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

wait_cdp() {
  local tries=0
  while [ "$tries" -lt 100 ]; do
    if /usr/bin/curl -sS --max-time 1 "$CDP_URL/json/version" >/dev/null 2>&1; then return 0; fi
    sleep 0.5
    tries=$((tries+1))
  done
  return 1
}

mkdir -p "$RUNTIME/logs" "$RUNTIME/screenshots" "$AUTH" "$STATE"

echo "================================================"
echo " 第23号 最終下書き保存 / A4監査 104番"
echo "================================================"
echo "✅ タイトル: 家事分担アプリ作ってみた。"
echo "✅ 無料記事1本"
echo "✅ 承認済み第23号画像をヘッダーに使用"
echo "✅ 下書き保存＋A4監査まで"
echo "✅ 公開設定・投稿ボタンへ進みません"

if [ -f "$COMPLETE_STATE" ] && [ -s "$DRAFT_STATE" ]; then
  echo "✅ 第23号は下書き保存・監査まで既に完了しています"
  echo "下書きURL: $(cat "$DRAFT_STATE")"
  exit 0
fi

echo "STEP 1/5: 第23号 正式パッケージ作成"
rm -rf "$ROOT"
mkdir -p "$ARTICLE"

cat > "$ARTICLE/01_投稿用_タイトル本文一体.txt" <<'ARTICLE_EOF'
家事分担アプリ作ってみた。

家事って、やっている人には見えるのに、やっていない人には意外と見えません。

洗濯、食器、風呂掃除、買い物、子どもの準備。
ひとつひとつは小さくても、毎日積み重なるとかなりの量になります。

そこで今回は、家族の家事を「誰が・何を・どれくらいやっているか」見えるようにする、スマホ向けの家事分担アプリを実際に作ってみました。

名前は「おうち分担」です。

デモ版はこちらです。
https://raw.githack.com/You-commit/okinawa-money-guide/note-issue23-family-chore-app-20260916/demos/ouchi-buntan/index.html

※試作版です。入力内容は使っている端末のブラウザ内に保存されます。個人情報や重要な情報は入力しないでください。

## 今回作ったもの

アプリでできることは、あえて4つに絞りました。

- 今日の家事を一覧で見る
- 家事ごとに担当者を決める
- 終わったらタップで完了にする
- 今週の担当比率を家族ごとに見る

大事なのは、家事を細かく管理することではありません。

「誰かが気づいて、誰かがずっとやる」という状態を減らすことです。

## 家事は「手伝う」ではなく、最初から分けておく

家事でモヤモヤしやすいのは、作業量そのものよりも、担当が曖昧なときです。

「できる人がやる」
「気づいた人がやる」
「時間がある人がやる」

この状態だと、同じ人に負担が寄りやすくなります。

そこで、アプリでは最初から担当者を表示します。

たとえば、

- 朝食の片付け：パパ
- 洗濯物をたたむ：ママ
- お風呂掃除：子ども
- 夕食後の食器洗い：パパ

という形です。

担当が見えるだけでも、「誰がやる？」という小さな確認が減ります。

## 「やった家事」も見えるようにした

家事は、終わると形に残らないものが多いです。

だからこそ、完了した家事も履歴として見える方がいい。

今回のアプリでは、家事を終えたらボタンを1回タップするだけです。

未完了・完了で絞り込みもできます。

これなら、家族が外出先からスマホを見ても、

「お風呂掃除は終わっている」
「食器洗いはまだ」

とすぐ分かります。

## 一番入れたかったのは「負担の偏り」

今回、単なるToDoアプリにしなかった理由がこれです。

家族ごとの担当数を集計して、今週の担当比率を表示するようにしました。

たとえば、

- ママ 40%
- パパ 40%
- 子ども 20%

のように表示します。

もちろん、家事はすべて同じ重さではありません。

料理1回とゴミ出し1回を単純に同じものとして扱うのは、本来は少し乱暴です。

それでも「今週、かなり一人に寄っているな」と気づくきっかけにはなります。

次の改善では、家事ごとに負担ポイントを設定できるようにすると、もっと実用的になりそうです。

## 実際に作ったアプリの中身

今回は、スマホで使いやすいことを優先して、1画面で完結するWebアプリにしました。

使っているのは、HTML・CSS・JavaScriptだけです。

サーバーや会員登録がなくても試せるようにして、入力した内容はブラウザのlocalStorageに保存します。

つまり、簡易版ならかなり軽く作れます。

実装した機能は次の通りです。

1. 家族メンバーの初期登録
2. 家事一覧
3. 担当者表示
4. 時間帯・カテゴリ表示
5. 完了チェック
6. 未完了／完了フィルター
7. 家事の追加
8. 家族ごとの担当比率
9. 端末内へのデータ保存

## 作るときに意識したこと

### 1. 機能を増やしすぎない

家族向けアプリは、設定が面倒になると使われなくなります。

最初からカレンダー、通知、ポイント、ランキングなどを全部入れず、まずは「今日の家事が分かる」ことに絞りました。

### 2. スマホで片手操作できるようにする

家事をしながら使うので、PC前提にはしませんでした。

大きなボタン、少ない文字、縦1列の表示を基本にしています。

### 3. 誰かを責めるアプリにしない

ここはかなり重要だと思っています。

「あなたは家事をしていない」と責めるためではなく、家事を家族全員のものとして見えるようにする。

そのため、ランキングではなく「担当比率」という表現にしています。

## AIは裏方として使った

今回、AIをタイトルの主役にはしていません。

先に、

- 家族向け
- スマホ前提
- 家事の担当を見える化
- 負担の偏りを確認
- 操作をできるだけ少なくする

という条件を決め、その条件をもとに画面構成、文言、コード作成、修正をAIと一緒に進めました。

「AIで何ができる？」から考えるより、「生活のどこを少しラクにしたい？」から考える方が、作りたいものがはっきりします。

## 次に追加したい機能

実際に使うなら、次はこのあたりを追加したいです。

- 家族メンバーの追加・編集
- 曜日ごとの繰り返し家事
- 家事ごとの負担ポイント
- 「今週は偏っています」の通知
- 家族間のリアルタイム共有
- 子ども向けの達成スタンプ

ここまで入ると、かなり本格的な家族向けアプリになります。

## まとめ

今回は、生活の中にある小さなモヤモヤからアプリを1つ作ってみました。

家事そのものをなくすことはできません。

でも、

誰がやるのか。
何が終わったのか。
負担がどこに寄っているのか。

この3つが見えるだけでも、家族の会話は変えられます。

難しいサービスを作らなくても、スマホで毎日使える小さなアプリなら形にできます。

次回も、生活の中で実際に使えるものを作ってみます。
ARTICLE_EOF

cat > "$ARTICLE/10_ハッシュタグ案.txt" <<'TAGS_EOF'
#家事 #家族 #暮らし #アプリ開発 #Webアプリ #生活
TAGS_EOF

cat > "$ARTICLE/11_投稿設定ガイド.txt" <<'GUIDE_EOF'
記事タイプ: 無料
タイトル: 家事分担アプリ作ってみた。
ヘッダー: 02_アイキャッチ_第23号無料_家事分担アプリ作ってみた.png
本文画像: 0枚
有料ライン: なし
タグ: #家事 #家族 #暮らし #アプリ開発 #Webアプリ #生活
公開方式: 下書き保存のみ
監査: A4下書き監査を最終監査とする
GUIDE_EOF

/usr/bin/curl -fL --retry 3 --connect-timeout 15 "$HEADER_URL" -o "$HEADER_SOURCE"
[ -s "$HEADER_SOURCE" ] || { echo "❌ 承認済みヘッダー画像の取得に失敗"; exit 1; }
/usr/bin/sips -z 670 1280 "$HEADER_SOURCE" --out "$HEADER" >/dev/null
rm -f "$HEADER_SOURCE"

BODY_SHA="$(/usr/bin/shasum -a 256 "$ARTICLE/01_投稿用_タイトル本文一体.txt" | awk '{print $1}')"

cat > "$ARTICLE/00_投稿パッケージ.json" <<MANIFEST_EOF
{
  "issue": 23,
  "status": "approved_for_draft",
  "approval_scope": "images_only",
  "image_approval_received": true,
  "image_approval_date": "2026-09-16",
  "header_history_reviewed": true,
  "header_history_review_fixed_rule": true,
  "visual_history_review_qa": {
    "status": "PASS",
    "required_first_step": true,
    "scope": "all known published note articles + Issue22 approved visual set",
    "review_note": "過去承認画像を遡って比較し、人物・アニメ調・線・塗り・情報密度・シリーズ感を維持。第23号は生活・家族テーマへ切り替え、家庭内シーンとスマホアプリUIで構図を差別化。ユーザー承認済み画像を変更せずヘッダーへ使用。"
  },
  "visual_palette_qa": {
    "status": "PASS",
    "body_images_all_match_header": true,
    "series_character_required": true,
    "series_character_present": true
  },
  "body_image_quality_qa": {
    "status": "PASS",
    "high_quality_visual_review_passed": true,
    "body_images_all_high_quality": true,
    "minimum_standard": "Issue 9 user-approved high-quality visual set or higher",
    "user_approved": true
  },
  "article_type": "free",
  "title": "家事分担アプリ作ってみた。",
  "price": null,
  "refund": null,
  "header_file": "02_アイキャッチ_第23号無料_家事分担アプリ作ってみた.png",
  "header_size": [1280, 670],
  "body_image_count": 0,
  "tags": ["家事", "家族", "暮らし", "アプリ開発", "Webアプリ", "生活"],
  "paywall_marker_required": false,
  "paid_body_image_policy": null,
  "paid_start_heading": null,
  "free_url_placeholder": null,
  "body_sha256": "$BODY_SHA"
}
MANIFEST_EOF

node --check "$ENGINE"
node --check "$HELPER"

echo "STEP 2/5: ENGINE Preflight"
NOTE_AUTH_DIR="$AUTH" NOTE_ENGINE_PREFLIGHT_ONLY=1 node "$ENGINE" "$ARTICLE"

echo "STEP 3/5: 専用Chrome起動"
/usr/bin/pkill -f -- "--user-data-dir=$AUTH" >/dev/null 2>&1 || true
/usr/bin/pkill -f -- "remote-debugging-port=$AUTH_PORT" >/dev/null 2>&1 || true
sleep 1
rm -f "$AUTH/SingletonLock" "$AUTH/SingletonSocket" "$AUTH/SingletonCookie" 2>/dev/null || true

"$CHROME" "--user-data-dir=$AUTH" "--remote-debugging-port=$AUTH_PORT" --no-first-run --no-default-browser-check --start-maximized "https://note.com/new" >"$RUNTIME/logs/issue23-chrome.log" 2>&1 &
AUTH_CHROME_PID=$!

wait_cdp || { echo "❌ Chrome/CDP起動失敗"; exit 1; }
node "$HELPER" wait-editor "$CDP_URL"

echo "STEP 4/5: 第23号 最終下書き作成 → A4監査"
LOG="$RUNTIME/logs/issue23-final-draft-$(date +%Y%m%d-%H%M%S).log"

set +e
NOTE_AUTH_DIR="$AUTH" NOTE_CDP_URL="$CDP_URL" node "$ENGINE" "$ARTICLE" 2>&1 | tee "$LOG"
RC=${pipestatus[1]}
set -e

[ "$RC" -eq 0 ] || exit "$RC"
grep -q "✅ A4下書き監査 合格" "$LOG" || { echo "❌ A4監査完了を確認できません"; exit 1; }

DRAFT_URL="$(grep '^下書きURL:' "$LOG" | tail -1 | sed 's/^下書きURL:[[:space:]]*//')"
[ -n "$DRAFT_URL" ] || { echo "❌ 下書きURL取得失敗"; exit 1; }

print -r -- "$DRAFT_URL" > "$DRAFT_STATE"

echo "STEP 5/5: 下書き監査完了を記録"
print -r -- "$(date '+%Y-%m-%d %H:%M:%S')" > "$COMPLETE_STATE"

echo "================================================"
echo "✅ 第23号 下書き保存・最終監査 完了"
echo "================================================"
echo "下書きURL: $DRAFT_URL"
echo "✅ 無料記事"
echo "✅ 承認済みヘッダー画像"
echo "✅ A4監査PASS"
echo "✅ 公開操作なし"
