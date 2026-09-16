#!/bin/zsh
set -euo pipefail

RUNTIME="$HOME/Library/Application Support/YukiNoteAutomation"
AUTH="$RUNTIME/.auth/note-profile"
ARTICLE="$RUNTIME/package-current-issue22-paid-draft/note第22号_画像承認済み_正式下書きパッケージ_v1/第22号有料"
ENGINE="$RUNTIME/scripts/102-engine-final-draft-a4-only.mjs"
HELPER="$RUNTIME/scripts/102-helper-auto-leave-dialog.mjs"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=9421
CDP_URL="http://127.0.0.1:$PORT"
STATE="$RUNTIME/state/issue22-paid-draft-fixed"
DRAFT_STATE="$STATE/draft_url.txt"
COMPLETE_STATE="$STATE/draft_audit_complete.txt"
AUTH_CHROME_PID=""
OLD102="$HOME/Downloads/102_note第22号_有料記事_AI実務テンプレ12選_最終下書き保存_A4監査_1ファイル完結.command"

cleanup() {
  if [ -n "${AUTH_CHROME_PID:-}" ]; then
    kill "$AUTH_CHROME_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

wait_cdp() {
  local tries=0
  while [ "$tries" -lt 100 ]; do
    if /usr/bin/curl -sS --max-time 1 "$CDP_URL/json/version" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
    tries=$((tries+1))
  done
  return 1
}

mkdir -p "$STATE" "$RUNTIME/logs" "$AUTH"

echo "================================================"
echo " 第22号 修正版 最終下書き保存 / A4監査 103番"
echo "================================================"
echo "✅ 102番の本文ファイル形式不整合を自動修正"
echo "✅ 有料680円 / 返金OFF"
echo "✅ 下書き保存＋A4監査まで"
echo "✅ 公開設定・投稿ボタンへ進みません"

# 102番が展開した実行環境が消えている場合だけ、自動で102番を使って再展開する。
if [ ! -d "$ARTICLE" ] || [ ! -f "$ENGINE" ] || [ ! -f "$HELPER" ]; then
  if [ ! -f "$OLD102" ]; then
    echo "❌ 102番の実行環境が見つかりません。103番を作り直す必要があります。"
    exit 1
  fi
  echo "STEP 0/5: 102番パッケージを自動再展開"
  set +e
  zsh "$OLD102" >/dev/null 2>&1
  set -e
fi

[ -d "$ARTICLE" ] || { echo "❌ 第22号パッケージが見つかりません"; exit 1; }
[ -f "$ENGINE" ] || { echo "❌ ENGINEが見つかりません"; exit 1; }
[ -f "$HELPER" ] || { echo "❌ HELPERが見つかりません"; exit 1; }

echo "STEP 1/5: 第22号パッケージ修正"

python3 - "$ARTICLE" <<'PY'
from pathlib import Path
import hashlib, json, re, sys

d = Path(sys.argv[1])
src = d / "01_本文.md"
dst = d / "01_投稿用_タイトル本文一体.txt"

if src.exists():
    text = src.read_text(encoding="utf-8")
elif dst.exists():
    text = dst.read_text(encoding="utf-8")
else:
    raise SystemExit("本文ファイルが見つかりません")

lines = text.splitlines()
if lines and lines[0].startswith("# "):
    lines[0] = lines[0][2:]

circled = {"1":"①","2":"②","3":"③","4":"④","5":"⑤","6":"⑥","7":"⑦","8":"⑧","9":"⑨"}
fixed = []
for line in lines:
    if re.fullmatch(r">\s*", line):
        fixed.append("> 　")
        continue
    m = re.match(r"^(>\s+)([1-9])\.\s+(.*)$", line)
    if m:
        fixed.append(f"{m.group(1)}{circled[m.group(2)]} {m.group(3)}")
        continue
    fixed.append(line)

text = "\n".join(fixed) + "\n"
dst.write_text(text, encoding="utf-8")
if src.exists():
    src.unlink()

(d / "10_ハッシュタグ案.txt").write_text(
    "#AI活用 #仕事効率化 #業務効率化 #ChatGPT #テンプレート #仕事術\n",
    encoding="utf-8"
)

(d / "11_投稿設定ガイド.txt").write_text(
    """記事タイプ: 有料
タイトル: 仕事が速くなる。AI実務テンプレ12選【コピペ可】
販売価格: 680円
返金申請受付: OFF
本文画像: 0枚
有料ライン: あり
有料開始位置: テンプレート① 長文メールを要約する
タグ: #AI活用 #仕事効率化 #業務効率化 #ChatGPT #テンプレート #仕事術
監査扱い: 下書きA4監査を最終監査とする
""",
    encoding="utf-8"
)

manifest_path = d / "00_投稿パッケージ.json"
data = json.loads(manifest_path.read_text(encoding="utf-8"))
data["article_type"] = "paid"
data["price"] = 680
data["refund"] = "off"
data["body_image_count"] = 0
data["paywall_marker_required"] = True
data["paid_body_image_policy"] = "all_after_paywall"
data["paid_start_heading"] = "テンプレート① 長文メールを要約する"
data["tags"] = ["AI活用","仕事効率化","業務効率化","ChatGPT","テンプレート","仕事術"]
data["body_sha256"] = hashlib.sha256(dst.read_bytes()).hexdigest()
manifest_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

print("✅ 本文TXT形式へ修正")
print("✅ 有料設定ガイド・タグ追加")
print("✅ 引用記法をENGINE互換へ修正")
print("✅ body_sha256再計算")
PY

node --check "$ENGINE"
node --check "$HELPER"

echo "STEP 2/5: ENGINE Preflight"
NOTE_AUTH_DIR="$AUTH" NOTE_ENGINE_PREFLIGHT_ONLY=1 node "$ENGINE" "$ARTICLE"

if [ -f "$COMPLETE_STATE" ] && [ -s "$DRAFT_STATE" ]; then
  echo "✅ 第22号は下書き保存・監査まで既に完了しています"
  echo "下書きURL: $(cat "$DRAFT_STATE")"
  exit 0
fi

echo "STEP 3/5: 専用Chrome起動"
/usr/bin/pkill -f -- "--user-data-dir=$AUTH" >/dev/null 2>&1 || true
/usr/bin/pkill -f -- "remote-debugging-port=$PORT" >/dev/null 2>&1 || true
sleep 1
rm -f "$AUTH/SingletonLock" "$AUTH/SingletonSocket" "$AUTH/SingletonCookie" 2>/dev/null || true

"$CHROME" \
  "--user-data-dir=$AUTH" \
  "--remote-debugging-port=$PORT" \
  --no-first-run \
  --no-default-browser-check \
  --start-maximized \
  "https://note.com/new" \
  >"$RUNTIME/logs/issue22-fixed-chrome.log" 2>&1 &
AUTH_CHROME_PID=$!

wait_cdp || { echo "❌ Chrome/CDP起動失敗"; exit 1; }
node "$HELPER" wait-editor "$CDP_URL"

echo "STEP 4/5: 第22号 最終下書き作成 → A4監査"
LOG="$RUNTIME/logs/issue22-fixed-final-draft-$(date +%Y%m%d-%H%M%S).log"

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
echo "✅ 第22号 下書き保存・最終監査 完了"
echo "================================================"
echo "下書きURL: $DRAFT_URL"
echo "✅ 有料680円 / 返金OFF"
echo "✅ A4監査PASS"
echo "✅ 公開操作なし"
