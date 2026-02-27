#!/usr/bin/env bash
# ============================================================
# test-all-log.sh
# Runs unit tests + coverage for all three projects and writes
# a human-readable report to test-result.log.
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$ROOT_DIR/test-result.log"
PROJECTS=("shell" "mfe-customers" "mfe-accounts")
PASS_ICON="✔"
FAIL_ICON="✘"
OVERALL_EXIT=0

# ── helpers ────────────────────────────────────────────────

print_banner() {
  echo ""
  echo "  ██████████████████████████████████████████████"
  echo "  ██  MFE-POC  ·  Unit Tests + Coverage        ██"
  echo "  ██████████████████████████████████████████████"
  echo ""
}

print_step() {
  echo ""
  echo "  ▶  $1"
}

print_ok()   { echo "  $PASS_ICON  $1"; }
print_fail() { echo "  $FAIL_ICON  $1"; }

divider() { printf '%0.s─' {1..60}; echo ""; }

# ── log helpers ────────────────────────────────────────────

log()     { echo "$1" >> "$LOG_FILE"; }
log_div() { printf '%0.s─' {1..60} >> "$LOG_FILE"; echo "" >> "$LOG_FILE"; }

# ── init log file ──────────────────────────────────────────

cd "$ROOT_DIR"

{
  echo "════════════════════════════════════════════════════════════"
  echo "  MFE-POC · Unit Test & Coverage Report"
  echo "  Generated: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "════════════════════════════════════════════════════════════"
  echo ""
} > "$LOG_FILE"

# ── run tests per project ──────────────────────────────────

print_banner
TOTAL_TESTS=0
TOTAL_FILES=0
FAILED_PROJECTS=()
COVERAGE_ROWS=()

for PROJECT in "${PROJECTS[@]}"; do
  print_step "Testing  $PROJECT ..."

  TMP_FILE=$(mktemp)

  if ng test "$PROJECT" --no-watch --coverage > "$TMP_FILE" 2>&1; then
    EXIT_CODE=0
  else
    EXIT_CODE=$?
    OVERALL_EXIT=1
    FAILED_PROJECTS+=("$PROJECT")
  fi

  # Strip ANSI colour codes so grep/sed can reliably parse the summary
  CLEAN_FILE=$(mktemp)
  sed 's/\x1b\[[0-9;]*m//g' "$TMP_FILE" > "$CLEAN_FILE"

  # ── extract summary numbers from Vitest output
  FILES_LINE=$(grep "Test Files" "$CLEAN_FILE" || true)
  TESTS_LINE=$(grep -E "^ *Tests +[0-9]" "$CLEAN_FILE" || true)

  FILES_COUNT=$(echo "$FILES_LINE" | grep -oE "[0-9]+ passed" | grep -oE "^[0-9]+" | head -1 || echo "?")
  TESTS_COUNT=$(echo "$TESTS_LINE" | grep -oE "[0-9]+ passed" | grep -oE "^[0-9]+" | head -1 || echo "?")
  DURATION=$(grep "Duration" "$CLEAN_FILE" | \
    grep -oE "[0-9]+\.[0-9]+s" | head -1 || echo "unknown")

  if [[ "$TESTS_COUNT" =~ ^[0-9]+$ ]]; then
    TOTAL_TESTS=$(( TOTAL_TESTS + TESTS_COUNT ))
  fi
  if [[ "$FILES_COUNT" =~ ^[0-9]+$ ]]; then
    TOTAL_FILES=$(( TOTAL_FILES + FILES_COUNT ))
  fi

  # ── extract coverage "All files" summary line
  COV_LINE=$(grep "^All files" "$CLEAN_FILE" || true)
  COV_STMTS=$(echo "$COV_LINE"  | awk -F'|' '{gsub(/ /,"",$2); print $2}')
  COV_BRANCH=$(echo "$COV_LINE" | awk -F'|' '{gsub(/ /,"",$3); print $3}')
  COV_FUNCS=$(echo "$COV_LINE"  | awk -F'|' '{gsub(/ /,"",$4); print $4}')
  COV_LINES=$(echo "$COV_LINE"  | awk -F'|' '{gsub(/ /,"",$5); print $5}')

  # Store for terminal summary table
  COVERAGE_ROWS+=("$(printf '  %-18s | %6s | %6s | %6s | %6s | %s tests · %s' \
    "$PROJECT" "${COV_STMTS:--}" "${COV_BRANCH:--}" "${COV_FUNCS:--}" "${COV_LINES:--}" \
    "$TESTS_COUNT" "$DURATION")")

  # ── terminal feedback
  if [[ $EXIT_CODE -eq 0 ]]; then
    print_ok "$PROJECT → $TESTS_COUNT tests in $FILES_COUNT file(s) · $DURATION"
    echo "     Stmts: ${COV_STMTS:--}%  Branch: ${COV_BRANCH:--}%  Funcs: ${COV_FUNCS:--}%  Lines: ${COV_LINES:--}%"
  else
    print_fail "$PROJECT → FAILED (exit $EXIT_CODE)"
  fi

  # ── write project section to log
  {
    echo ""
    echo "┌─────────────────────────────────────────────────────────┐"
    printf  "│  Project : %-46s│\n" "$PROJECT"
    printf  "│  Status  : %-46s│\n" "$([ $EXIT_CODE -eq 0 ] && echo 'PASSED ✔' || echo 'FAILED ✘')"
    printf  "│  Files   : %-46s│\n" "$FILES_COUNT passed"
    printf  "│  Tests   : %-46s│\n" "$TESTS_COUNT passed"
    printf  "│  Duration: %-46s│\n" "$DURATION"
    echo "└─────────────────────────────────────────────────────────┘"
    echo ""
    echo "  ── Coverage ──────────────────────────────────────────────"
    echo ""
    # Extract just the coverage table (from "% Coverage report" to end of file)
    awk '/% Coverage report/,0' "$CLEAN_FILE" | sed 's/^/  /' || echo "  (no coverage data)"
    echo ""
    echo "  ── Full Output ───────────────────────────────────────────"
    echo ""
    # Print full output but strip the coverage section to avoid duplication
    awk '/% Coverage report/{exit} {print}' "$CLEAN_FILE" | sed 's/^/  /'
    echo ""
  } >> "$LOG_FILE"

  log_div

  rm -f "$TMP_FILE" "$CLEAN_FILE"
done

# ── summary ───────────────────────────────────────────────

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# terminal
echo ""
divider
echo ""
echo "  Coverage Summary"
echo ""
printf '  %-18s | %6s | %6s | %6s | %6s\n' "Project" "Stmts" "Branch" "Funcs" "Lines"
printf '  %.0s─' {1..55}; echo ""
for ROW in "${COVERAGE_ROWS[@]}"; do
  echo "$ROW"
done
echo ""
divider
if [[ $OVERALL_EXIT -eq 0 ]]; then
  echo "  $PASS_ICON  ALL TESTS PASSED  ·  $TOTAL_TESTS tests across $TOTAL_FILES spec file(s)"
else
  echo "  $FAIL_ICON  FAILURES IN: ${FAILED_PROJECTS[*]}"
  echo "  Passing: $TOTAL_TESTS tests across $TOTAL_FILES spec file(s)"
fi
echo "  Log: $LOG_FILE"
divider
echo ""

# log footer
{
  echo ""
  echo "════════════════════════════════════════════════════════════"
  echo "  SUMMARY"
  echo "════════════════════════════════════════════════════════════"
  echo ""
  if [[ $OVERALL_EXIT -eq 0 ]]; then
    echo "  Result    : ALL PASSED ✔"
  else
    echo "  Result    : FAILED ✘  →  ${FAILED_PROJECTS[*]}"
  fi
  echo "  Total     : $TOTAL_TESTS tests  |  $TOTAL_FILES spec files"
  echo "  Completed : $TIMESTAMP"
  echo ""
  echo "════════════════════════════════════════════════════════════"
} >> "$LOG_FILE"

exit $OVERALL_EXIT
