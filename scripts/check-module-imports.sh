#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="${1:-src/modules}"

if [[ ! -d "$TARGET_DIR" ]]; then
  echo "ERROR: target directory not found: $TARGET_DIR" >&2
  exit 3
fi

if ! command -v rg >/dev/null 2>&1; then
  echo "ERROR: rg (ripgrep) is required." >&2
  exit 3
fi

PATTERN="from ['\"](\.\./){2,}(admin|auth|region|user|login)/"
LEGACY_AUTH_PATTERN="from ['\"]((\.\./)+auth([/'\"])|\.\./modules/auth([/'\"])|@/modules/auth([/'\"]))"

set +e
MATCHES=$(rg -n "$PATTERN" "$TARGET_DIR")
STATUS=$?
set -e

if [[ $STATUS -eq 0 ]]; then
  echo "FAILED: found cross-module deep imports (use module entry index.ts instead):"
  echo "$MATCHES"
  exit 2
fi

if [[ $STATUS -eq 1 ]]; then
  :
else
  echo "ERROR: failed to run import check." >&2
  exit 3
fi

set +e
LEGACY_AUTH_MATCHES=$(rg -n "$LEGACY_AUTH_PATTERN" src)
LEGACY_AUTH_STATUS=$?
set -e

if [[ $LEGACY_AUTH_STATUS -eq 0 ]]; then
  echo "FAILED: found legacy auth import paths (use '@/auth' only):"
  echo "$LEGACY_AUTH_MATCHES"
  exit 2
fi

if [[ $LEGACY_AUTH_STATUS -eq 1 ]]; then
  echo "OK: import checks passed for $TARGET_DIR and auth path policy"
  exit 0
fi

echo "ERROR: failed to run legacy auth import check." >&2
exit 3
