#!/bin/bash
# Mentora Pre-Deploy Health Check
# Usage: bash scripts/check_deploy.sh [BASE_URL]
BASE="${1:-https://mentora.su}"
FAIL=0; PASS=0
ok()   { echo "  ✅ $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL+1)); }
h()    { echo ""; echo "━━━ $1 ━━━"; }

check_http() {
  local label="$1" url="$2" expected="$3"
  local code; code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url")
  if [[ "$code" == "$expected" || ("$expected" == "3xx" && "$code" =~ ^3) ]]; then
    ok "$label → $code"
  else
    fail "$label → $code (expected $expected)"
  fi
}

echo ""; echo "═══ Mentora Pre-Deploy Check → $BASE ═══"

h "1. Public pages (200)"
check_http "/" "$BASE/" "200"
check_http "/pricing" "$BASE/pricing" "200"
check_http "/privacy" "$BASE/privacy" "200"
check_http "/terms" "$BASE/terms" "200"
check_http "/knowledge" "$BASE/knowledge" "200"
check_http "/robots.txt" "$BASE/robots.txt" "200"
check_http "/sitemap.xml" "$BASE/sitemap.xml" "200"

h "2. Protected pages (redirect)"
check_http "/dashboard" "$BASE/dashboard" "3xx"
check_http "/profile" "$BASE/profile" "3xx"
check_http "/learn/russian-history" "$BASE/learn/russian-history" "3xx"

h "3. API auth guard (401)"
for ep in "/api/chat" "/api/payments/create" "/api/onboarding/complete"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{}' --max-time 8 "$BASE$ep")
  [[ "$code" == "401" || "$code" == "403" ]] && ok "$ep → $code" || fail "$ep → $code"
done

h "4. Demo API"
DEMO=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"message":"Пётр I — кратко"}' --max-time 25 "$BASE/api/demo" 2>/dev/null || echo "{}")
echo "$DEMO" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if 'message' in d else 1)" 2>/dev/null \
  && ok "Demo API → AI ответил" || fail "Demo API: ${DEMO:0:80}"

h "5. Landing content"
LAND=$(curl -s --max-time 10 "$BASE/")
echo "$LAND" | grep -q "Mentora"       && ok "Логотип" || fail "Логотип отсутствует"
echo "$LAND" | grep -q "mentora-theme" && ok "Anti-FOUC dark" || fail "Anti-FOUC отсутствует"
echo "$LAND" | grep -q "live"          && ok "LIVE предметы" || fail "LIVE предметы не найдены"

h "6. Sitemap (≥3 URLs)"
N=$(curl -s --max-time 5 "$BASE/sitemap.xml" | grep -c "<loc>" 2>/dev/null || echo 0)
[ "$N" -ge 3 ] && ok "Sitemap: $N URLs" || fail "Sitemap: только $N URL"

echo ""
echo "═══ PASS: $PASS | FAIL: $FAIL ═══"
if [ "$FAIL" -gt 0 ]; then
  echo "⛔ Deploy BLOCKED — fix $FAIL issue(s)"; exit 1
else
  echo "🚀 All checks passed — safe to deploy!"; exit 0
fi
