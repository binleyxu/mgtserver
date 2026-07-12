#!/usr/bin/env bash
set -euo pipefail

# Run this script from the orchestration node (usually mgtserver).
# It makes the 4-node aliases and SSH public-key trust fully connected.

NODES=("mgtserver" "apiserver" "dbserver" "mcpserver")

declare -A IPS=(
  [mgtserver]="192.168.0.99"
  [apiserver]="192.168.0.206"
  [dbserver]="192.168.0.12"
  [mcpserver]="192.168.0.210"
)

declare -A USERS=(
  [mgtserver]="mgtadmin"
  [apiserver]="apiadmin"
  [dbserver]="dbadmin"
  [mcpserver]="mcpadmin"
)

echo "[1/6] Ensure local SSH reachability to all 4 aliases"
for node in "${NODES[@]}"; do
  echo "  - probe $node"
  ssh -o BatchMode=yes -o ConnectTimeout=8 "$node" "hostname >/dev/null"
done

echo "[2/6] Ensure keypair exists on each node"
for node in "${NODES[@]}"; do
  ssh "$node" "mkdir -p ~/.ssh && chmod 700 ~/.ssh && [ -f ~/.ssh/id_ed25519 ] || ssh-keygen -t ed25519 -N '' -f ~/.ssh/id_ed25519 >/dev/null"
done

echo "[3/6] Collect each node public key"
declare -A PUBKEYS
for node in "${NODES[@]}"; do
  PUBKEYS[$node]="$(ssh "$node" "cat ~/.ssh/id_ed25519.pub")"
done

echo "[4/6] Write unified alias config on each node"
for node in "${NODES[@]}"; do
  ssh "$node" "mkdir -p ~/.ssh/config.d && touch ~/.ssh/config && chmod 700 ~/.ssh && chmod 700 ~/.ssh/config.d && chmod 600 ~/.ssh/config"
  ssh "$node" "grep -vF 'Include ~/.ssh/config.d/*' ~/.ssh/config > ~/.ssh/config.tmp || true; printf 'Include ~/.ssh/config.d/*\\n\\n' > ~/.ssh/config; cat ~/.ssh/config.tmp >> ~/.ssh/config; rm -f ~/.ssh/config.tmp; chmod 600 ~/.ssh/config"
  ssh "$node" "cat > ~/.ssh/config.d/cluster-4node.conf <<'CONF'
Host mgtserver
  HostName 192.168.0.99
  User mgtadmin
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  PreferredAuthentications publickey,password
  StrictHostKeyChecking accept-new

Host apiserver
  HostName 192.168.0.206
  User apiadmin
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  PreferredAuthentications publickey,password
  StrictHostKeyChecking accept-new

Host dbserver
  HostName 192.168.0.12
  User dbadmin
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  PreferredAuthentications publickey,password
  StrictHostKeyChecking accept-new

Host mcpserver
  HostName 192.168.0.210
  User mcpadmin
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  PreferredAuthentications publickey,password
  StrictHostKeyChecking accept-new
CONF"
  ssh "$node" "chmod 600 ~/.ssh/config.d/cluster-4node.conf"
done

echo "[5/6] Distribute keys to form full matrix"
for dst in "${NODES[@]}"; do
  for src in "${NODES[@]}"; do
    key="${PUBKEYS[$src]}"
    ssh "$dst" "touch ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && grep -qxF '$key' ~/.ssh/authorized_keys || echo '$key' >> ~/.ssh/authorized_keys"
  done
done

echo "[6/6] Warm known_hosts and verify matrix links"
ok=0
fail=0

for src in "${NODES[@]}"; do
  for dst in "${NODES[@]}"; do
    if [[ "$src" == "$dst" ]]; then
      continue
    fi
    if ssh -o BatchMode=yes "$src" "ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new $dst 'hostname >/dev/null'" >/dev/null 2>&1; then
      echo "[OK]   $src -> $dst"
      ok=$((ok+1))
    else
      echo "[FAIL] $src -> $dst"
      fail=$((fail+1))
    fi
  done
done

echo "----------------------------------------"
echo "matrix check done: ok=$ok fail=$fail"
[[ "$fail" -eq 0 ]]
