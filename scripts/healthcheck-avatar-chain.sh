#!/usr/bin/env bash
set -euo pipefail

ADMIN_ID="${1:-267}"
FRONT_HOST="${FRONT_HOST:-http://192.168.0.99:5173}"
API_HOST="${API_HOST:-http://192.168.0.206:8080}"
LOCAL_DIR="/home/mgtadmin/public/static/avatar/${ADMIN_ID}"
REMOTE_DIR="/home/apiadmin/static/avatar/${ADMIN_ID}"

echo "[1/5] local frontend project dir"
if [[ -d "$LOCAL_DIR" ]]; then
  ls -l "$LOCAL_DIR"
else
  echo "missing: $LOCAL_DIR"
fi

echo
echo "[2/5] backend storage dir on apiserver"
ssh -o BatchMode=yes apiserver "if [[ -d '$REMOTE_DIR' ]]; then ls -l '$REMOTE_DIR'; else echo 'missing: $REMOTE_DIR'; fi"

echo
echo "[3/5] proxy static headers via frontend origin"
for size in 32 128; do
  url="${FRONT_HOST}/api/static/avatar/${ADMIN_ID}/avatar_${size}.jpg"
  echo "=== $url"
  curl -sS -m 8 -I "$url" | sed -n '1,8p'
done

echo
echo "[4/5] direct static headers via apiserver"
for size in 32 128; do
  url="${API_HOST}/static/avatar/${ADMIN_ID}/avatar_${size}.jpg"
  echo "=== $url"
  curl -sS -m 8 -I "$url" | sed -n '1,8p'
done

echo
echo "[5/5] checksum consistency (frontend /api/static vs backend file)"
tmp32="$(mktemp /tmp/avatar_${ADMIN_ID}_32_XXXX.jpg)"
tmp128="$(mktemp /tmp/avatar_${ADMIN_ID}_128_XXXX.jpg)"
cleanup() {
  rm -f "$tmp32" "$tmp128"
}
trap cleanup EXIT

curl -sS -m 10 -o "$tmp32" "${FRONT_HOST}/api/static/avatar/${ADMIN_ID}/avatar_32.jpg"
curl -sS -m 10 -o "$tmp128" "${FRONT_HOST}/api/static/avatar/${ADMIN_ID}/avatar_128.jpg"

local_md5_32="$(md5sum "$tmp32" | awk '{print $1}')"
local_md5_128="$(md5sum "$tmp128" | awk '{print $1}')"

remote_md5_32="$(ssh -o BatchMode=yes apiserver "md5sum '${REMOTE_DIR}/avatar_32.jpg' 2>/dev/null | cut -d' ' -f1")"
remote_md5_128="$(ssh -o BatchMode=yes apiserver "md5sum '${REMOTE_DIR}/avatar_128.jpg' 2>/dev/null | cut -d' ' -f1")"

echo "proxy-32 : ${local_md5_32}"
echo "remote-32: ${remote_md5_32:-<missing>}"
echo "proxy-128 : ${local_md5_128}"
echo "remote-128: ${remote_md5_128:-<missing>}"

if [[ -n "${remote_md5_32}" && -n "${remote_md5_128}" && "$local_md5_32" == "$remote_md5_32" && "$local_md5_128" == "$remote_md5_128" ]]; then
  echo "result: PASS (proxy bytes match backend storage)"
else
  echo "result: CHECK NEEDED (checksum mismatch or missing backend file)"
fi
