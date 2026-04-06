#!/usr/bin/env bash
# ============================================================
# ClassiFi: Validate-and-Push Hook Script (Bash/Linux/macOS)
# Triggered by: Stop event (end of agent session)
# Purpose: Run all tests, builds, and lint checks.
#          Push to remote only if every check passes.
# ============================================================

OVERALL_FAILED=0

# Resolve workspace root via git
WORKSPACE_ROOT=$(git rev-parse --show-toplevel 2>&1)
if [ $? -ne 0 ]; then
  echo "ERROR: Not inside a git repository. Aborting."
  exit 2
fi

run_check() {
  local label="$1"
  shift
  echo ""
  echo "--- [$label] ---"
  "$@"
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    echo "FAILED: $label"
    OVERALL_FAILED=1
  else
    echo "PASSED: $label"
  fi
}

echo ""
echo "============================================="
echo " ClassiFi: Pre-Push Validation Starting..."
echo "============================================="

# ── Backend Checks ────────────────────────────────────────
cd "$WORKSPACE_ROOT/backend-ts"

run_check "Backend | TypeScript Check" npm run typecheck
run_check "Backend | Lint Check"       npm run lint
run_check "Backend | Unit Tests"       npm test

# ── Frontend Checks ───────────────────────────────────────
cd "$WORKSPACE_ROOT/frontend"

run_check "Frontend | Build (TypeScript + Vite)" npm run build
run_check "Frontend | Lint Check"                npm run lint
run_check "Frontend | Unit Tests"                npx vitest run

# ── Result ────────────────────────────────────────────────
cd "$WORKSPACE_ROOT"

echo ""
if [ "$OVERALL_FAILED" -eq 1 ]; then
  echo "============================================="
  echo " VALIDATION FAILED — Push aborted."
  echo " Fix all errors above before pushing."
  echo "============================================="
  exit 2
fi

echo "============================================="
echo " All checks passed! Pushing to remote..."
echo "============================================="

git push
if [ $? -ne 0 ]; then
  echo "ERROR: git push failed."
  exit 2
fi

echo ""
echo "Push complete!"
exit 0
