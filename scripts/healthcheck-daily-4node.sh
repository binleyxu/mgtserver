#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SSH_MATRIX_SCRIPT="$ROOT_DIR/scripts/healthcheck-4node-ssh-matrix.sh"
SERVICE_SCRIPT="$ROOT_DIR/scripts/healthcheck-3node.sh"

ok=0
fail=0

run_step() {
  local step_name="$1"
  local script_path="$2"

  echo "========================================"
  echo "[RUN] $step_name"

  if [[ ! -x "$script_path" ]]; then
    echo "[FAIL] $step_name"
    echo "       script not executable: $script_path"
    fail=$((fail+1))
    return
  fi

  if "$script_path"; then
    echo "[OK]  $step_name"
    ok=$((ok+1))
  else
    echo "[FAIL] $step_name"
    fail=$((fail+1))
  fi
}

run_step "4-node SSH matrix" "$SSH_MATRIX_SCRIPT"
run_step "3-node services" "$SERVICE_SCRIPT"

echo "========================================"
echo "daily healthcheck summary: ok=$ok fail=$fail"
[[ "$fail" -eq 0 ]]
