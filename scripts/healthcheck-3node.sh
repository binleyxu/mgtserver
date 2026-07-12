#!/usr/bin/env bash
set -euo pipefail

ok=0
fail=0

check() {
  local name="$1"
  shift
  if "$@" >/tmp/hc.out 2>/tmp/hc.err; then
    echo "[OK]   $name"
    ok=$((ok+1))
  else
    echo "[FAIL] $name"
    sed -n '1,3p' /tmp/hc.err | sed 's/^/       /'
    sed -n '1,3p' /tmp/hc.out | sed 's/^/       /'
    fail=$((fail+1))
  fi
}

check "mgtserver ssh alias" ssh -o BatchMode=yes mgtserver hostname
check "apiserver ssh alias" ssh -o BatchMode=yes apiserver hostname
check "dbserver ssh alias" ssh -o BatchMode=yes dbserver hostname

check "frontend service active" ssh -o BatchMode=yes mgtserver "systemctl is-active --quiet mgtserver.service"
check "frontend url 200" bash -lc "curl -sS -m 8 -I http://192.168.0.99:5173 | grep -q '200 OK'"

check "apiserver user service active" ssh -o BatchMode=yes apiserver "export XDG_RUNTIME_DIR=/run/user/\$(id -u); systemctl --user is-active --quiet apiserver.service"
check "apiserver /login reachable" bash -lc "curl -sS -m 8 -o /tmp/hc_login.out -w '%{http_code}' -X POST http://192.168.0.206:8000/login -H 'content-type: application/json' -d '{\"username\":\"x\",\"password\":\"x\",\"human_token\":\"x\"}' | grep -Eq '^(200|400|401)$'"
check "apiserver /auth/login 404" bash -lc "curl -sS -m 8 -o /tmp/hc_auth_login.out -w '%{http_code}' -X POST http://192.168.0.206:8000/auth/login -H 'content-type: application/json' -d '{\"username\":\"x\",\"password\":\"x\",\"human_token\":\"x\"}' | grep -q '^404$'"

check "db 5432 reachable" python3 - <<'PY'
import socket
s=socket.socket(); s.settimeout(3)
s.connect(('192.168.0.12',5432))
s.close()
print('ok')
PY

echo "----------------------------------------"
echo "healthcheck done: ok=$ok fail=$fail"
[[ "$fail" -eq 0 ]]
