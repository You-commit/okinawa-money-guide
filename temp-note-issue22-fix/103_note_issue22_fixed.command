#!/bin/zsh
set -euo pipefail
URL="https://raw.githubusercontent.com/You-commit/okinawa-money-guide/temp-note-issue22-fix-20260916/temp-note-issue22-fix/103_note%E7%AC%AC22%E5%8F%B7_%E6%9C%89%E6%96%99%E8%A8%98%E4%BA%8B_AI%E5%AE%9F%E5%8B%99%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC12%E9%81%B8_%E4%BF%AE%E6%AD%A3%E7%89%88_%E6%9C%80%E7%B5%82%E4%B8%8B%E6%9B%B8%E3%81%8D%E4%BF%9D%E5%AD%98_A4%E7%9B%A3%E6%9F%BB_1%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E5%AE%8C%E7%B5%90.command"
TMP="$(mktemp -t note-issue22-fixed).command"
cleanup(){ rm -f "$TMP" >/dev/null 2>&1 || true; }
trap cleanup EXIT INT TERM
/usr/bin/curl -fL --retry 3 --connect-timeout 10 "$URL" -o "$TMP"
/bin/chmod +x "$TMP"
/bin/zsh "$TMP"
