#!/usr/bin/env bash
# ============================================================
# test-all-log.sh
# Runs 3 testing layers and writes a human-readable report:
#   1) Unit tests (with coverage)
#   2) Render tests
#   3) End-to-end tests (Playwright)
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$ROOT_DIR/test-result.log"

PASS_ICON="✔"
FAIL_ICON="✘"
OVERALL_EXIT=0
FAILED_PHASES=()

UNIT_TESTS=0
UNIT_FILES=0
RENDER_TESTS=0
RENDER_FILES=0
E2E_TESTS=0

print_banner() {
  echo ""
  echo "  ██████████████████████████████████████████████"
  echo "  ██  MFE-POC  ·  Unit + Render + E2E Tests    ██"
  echo "  ██████████████████████████████████████████████"
  echo ""
}

print_step() {
  echo ""
  echo "  ▶  $1"
}

print_ok()   { echo "  $PASS_ICON  $1"; }
print_fail() { echo "  $FAIL_ICON  $1"; }
divider()    { printf '%0.s─' {1..70}; echo ""; }

strip_ansi() {
  sed 's/\x1b\[[0-9;]*m//g' "$1"
}

sum_matches() {
  local file="$1"
  local pattern="$2"
  grep -E "$pattern" "$file" | grep -oE '[0-9]+ passed' | grep -oE '^[0-9]+' | awk '{s+=$1} END {print s+0}'
}

write_log_block() {
  local title="$1"
  local status="$2"
  local stats="$3"
  local output_file="$4"

  {
    echo ""
    echo "┌──────────────────────────────────────────────────────────────┐"
    printf "│  Phase   : %-51s│\n" "$title"
    printf "│  Status  : %-51s│\n" "$status"
    printf "│  Summary : %-51s│\n" "$stats"
    echo "└──────────────────────────────────────────────────────────────┘"
    echo ""
    echo "  ── Full Output ───────────────────────────────────────────────"
    echo ""
    sed 's/^/  /' "$output_file"
    echo ""
    printf '%0.s─' {1..70}; echo ""
  } >> "$LOG_FILE"
}

cd "$ROOT_DIR"

{
  echo "══════════════════════════════════════════════════════════════════════"
  echo "  MFE-POC · Full Test Report (Unit + Render + E2E)"
  echo "  Generated: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "══════════════════════════════════════════════════════════════════════"
  echo ""
} > "$LOG_FILE"

print_banner

# ------------------------------------------------------------------
# 1) UNIT (with coverage)
# ------------------------------------------------------------------
print_step "Unit tests (coverage) ..."

UNIT_TMP=$(mktemp)
if npm run test:all > "$UNIT_TMP" 2>&1; then
  UNIT_EXIT=0
  UNIT_STATUS="PASSED ✔"
else
  UNIT_EXIT=$?
  UNIT_STATUS="FAILED ✘"
  OVERALL_EXIT=1
  FAILED_PHASES+=("unit")
fi

UNIT_CLEAN=$(mktemp)
strip_ansi "$UNIT_TMP" > "$UNIT_CLEAN"
UNIT_TESTS=$(sum_matches "$UNIT_CLEAN" '^ *Tests +[0-9]')
UNIT_FILES=$(sum_matches "$UNIT_CLEAN" '^ *Test Files')

if [[ $UNIT_EXIT -eq 0 ]]; then
  print_ok "Unit → $UNIT_TESTS tests in $UNIT_FILES file(s)"
else
  print_fail "Unit → FAILED (exit $UNIT_EXIT)"
fi

write_log_block "Unit (npm run test:all)" "$UNIT_STATUS" "$UNIT_TESTS tests · $UNIT_FILES files" "$UNIT_CLEAN"

rm -f "$UNIT_TMP" "$UNIT_CLEAN"

# ------------------------------------------------------------------
# 2) RENDER
# ------------------------------------------------------------------
print_step "Render tests ..."

RENDER_TMP=$(mktemp)
if npm run test:render > "$RENDER_TMP" 2>&1; then
  RENDER_EXIT=0
  RENDER_STATUS="PASSED ✔"
else
  RENDER_EXIT=$?
  RENDER_STATUS="FAILED ✘"
  OVERALL_EXIT=1
  FAILED_PHASES+=("render")
fi

RENDER_CLEAN=$(mktemp)
strip_ansi "$RENDER_TMP" > "$RENDER_CLEAN"
RENDER_TESTS=$(sum_matches "$RENDER_CLEAN" '^ *Tests +[0-9]')
RENDER_FILES=$(sum_matches "$RENDER_CLEAN" '^ *Test Files')

if [[ $RENDER_EXIT -eq 0 ]]; then
  print_ok "Render → $RENDER_TESTS tests in $RENDER_FILES file(s)"
else
  print_fail "Render → FAILED (exit $RENDER_EXIT)"
fi

write_log_block "Render (npm run test:render)" "$RENDER_STATUS" "$RENDER_TESTS tests · $RENDER_FILES files" "$RENDER_CLEAN"

rm -f "$RENDER_TMP" "$RENDER_CLEAN"

# ------------------------------------------------------------------
# 3) E2E (Playwright)
# ------------------------------------------------------------------
print_step "E2E tests (Playwright) ..."

E2E_TMP=$(mktemp)
if npm run test:e2e > "$E2E_TMP" 2>&1; then
  E2E_EXIT=0
  E2E_STATUS="PASSED ✔"
else
  E2E_EXIT=$?
  E2E_STATUS="FAILED ✘"
  OVERALL_EXIT=1
  FAILED_PHASES+=("e2e")
fi

E2E_CLEAN=$(mktemp)
strip_ansi "$E2E_TMP" > "$E2E_CLEAN"
E2E_TESTS=$(grep -oE '[0-9]+ passed' "$E2E_CLEAN" | tail -1 | grep -oE '^[0-9]+' || echo "0")

if [[ $E2E_EXIT -eq 0 ]]; then
  print_ok "E2E → $E2E_TESTS test(s)"
else
  print_fail "E2E → FAILED (exit $E2E_EXIT)"
fi

write_log_block "E2E (npm run test:e2e)" "$E2E_STATUS" "$E2E_TESTS tests" "$E2E_CLEAN"

rm -f "$E2E_TMP" "$E2E_CLEAN"

# ------------------------------------------------------------------
# Final summary
# ------------------------------------------------------------------
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
TOTAL_TESTS=$((UNIT_TESTS + RENDER_TESTS + E2E_TESTS))
TOTAL_FILES=$((UNIT_FILES + RENDER_FILES))

echo ""
divider
echo ""
echo "  Test Layer Summary"
echo ""
printf '  %-10s | %8s | %8s\n' "Layer" "Tests" "Files"
printf '  %.0s─' {1..36}; echo ""
printf '  %-10s | %8s | %8s\n' "Unit"   "$UNIT_TESTS" "$UNIT_FILES"
printf '  %-10s | %8s | %8s\n' "Render" "$RENDER_TESTS" "$RENDER_FILES"
printf '  %-10s | %8s | %8s\n' "E2E"    "$E2E_TESTS" "-"
echo ""

if [[ $OVERALL_EXIT -eq 0 ]]; then
  print_ok "ALL TESTS PASSED · $TOTAL_TESTS tests"
else
  print_fail "FAILED PHASES: ${FAILED_PHASES[*]}"
fi
echo "  Log: $LOG_FILE"
divider
echo ""

{
  echo ""
  echo "══════════════════════════════════════════════════════════════════════"
  echo "  SUMMARY"
  echo "══════════════════════════════════════════════════════════════════════"
  echo ""
  if [[ $OVERALL_EXIT -eq 0 ]]; then
    echo "  Result        : ALL PASSED ✔"
  else
    echo "  Result        : FAILED ✘  →  ${FAILED_PHASES[*]}"
  fi
  echo "  Unit          : $UNIT_TESTS tests | $UNIT_FILES files"
  echo "  Render        : $RENDER_TESTS tests | $RENDER_FILES files"
  echo "  E2E           : $E2E_TESTS tests"
  echo "  Total         : $TOTAL_TESTS tests"
  echo "  Completed     : $TIMESTAMP"
  echo ""
  echo "══════════════════════════════════════════════════════════════════════"
} >> "$LOG_FILE"

exit $OVERALL_EXIT
