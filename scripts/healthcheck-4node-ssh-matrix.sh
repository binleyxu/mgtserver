#!/usr/bin/env bash
set -euo pipefail

NODES=("mgtserver" "apiserver" "dbserver" "mcpserver")

ok=0
fail=0

check() {
  local name="$1"
  shift
  if "$@" >/tmp/hc4.out 2>/tmp/hc4.err; then
    echo "[OK]   $name"
    ok=$((ok+1))
  else
    echo "[FAIL] $name"
    sed -n '1,3p' /tmp/hc4.err | sed 's/^/       /'
    sed -n '1,3p' /tmp/hc4.out | sed 's/^/       /'
    fail=$((fail+1))
  fi
}

for node in "${NODES[@]}"; do
  check "$node alias reachable" ssh -o BatchMode=yes -o ConnectTimeout=6 "$node" "hostname"
done

for src in "${NODES[@]}"; do
  for dst in "${NODES[@]}"; do
    if [[ "$src" == "$dst" ]]; then
      continue
    fi
    check "$src -> $dst passwordless" ssh -o BatchMode=yes -o ConnectTimeout=8 "$src" "ssh -o BatchMode=yes -o ConnectTimeout=8 $dst 'hostname && whoami'"
  done
done

echo "----------------------------------------"
echo "4node ssh matrix healthcheck done: ok=$ok fail=$fail"
[[ "$fail" -eq 0 ]]
