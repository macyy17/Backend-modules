#!/usr/bin/env bash
set -u

OUT_FILE="${OUT_FILE:-$HOME/out.txt}"
MODULE_NAME="${MODULE:-translator}"
PORT_NUMBER="${PORT:-3399}"
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/module_runner}"
INTERVAL_SECONDS="${INTERVAL_SECONDS:-8}"

while true; do
  {
    echo "=== module runner diagnostic ==="
    date -Is
    echo
    echo "--- location ---"
    pwd
    echo
    echo "--- versions ---"
    node -v || true
    npm -v || true
    echo
    echo "--- git status ---"
    git status --short || true
    echo
    echo "--- server files ---"
    find server -maxdepth 4 -type f | sort || true
    echo
    echo "--- package.json ---"
    cat server/package.json || true
    echo
    echo "--- env selected for smoke ---"
    echo "MODULE=$MODULE_NAME"
    echo "PORT=$PORT_NUMBER"
    python3 - <<PY || true
from urllib.parse import urlsplit, urlunsplit
value = '''$DB_URL'''
try:
    parsed = urlsplit(value)
    netloc = parsed.netloc
    if '@' in netloc and ':' in netloc.split('@')[0]:
        auth, host = netloc.split('@', 1)
        user = auth.split(':', 1)[0]
        netloc = user + ':****@' + host
    print('DATABASE_URL=' + urlunsplit((parsed.scheme, netloc, parsed.path, parsed.query, parsed.fragment)))
except Exception:
    print('DATABASE_URL=<could not mask>')
PY
    echo
    echo "--- npm install ---"
    (cd server && npm install) || true
    echo
    echo "--- typecheck ---"
    (cd server && npm run check) || true
    echo
    echo "--- build ---"
    (cd server && npm run build) || true
    rm -rf server/dist
    echo
    echo "--- startup and http smoke ---"
    LOG_FILE="$(mktemp)"
    (cd server && MODULE="$MODULE_NAME" PORT="$PORT_NUMBER" DATABASE_URL="$DB_URL" npm run dev > "$LOG_FILE" 2>&1) &
    RUNNER_PID="$!"
    sleep 3
    echo "runner pid: $RUNNER_PID"
    echo
    echo "GET /runner/config"
    curl -sS "http://localhost:$PORT_NUMBER/runner/config" || true
    echo
    echo
    echo "GET /moduleinfo first bytes"
    curl -sS "http://localhost:$PORT_NUMBER/moduleinfo" | head -c 400 || true
    echo
    echo
    echo "GET /app/presets"
    curl -sS "http://localhost:$PORT_NUMBER/app/presets" || true
    echo
    echo
    echo "GET /db/health"
    curl -sS "http://localhost:$PORT_NUMBER/db/health" || true
    echo
    echo
    echo "--- runner log ---"
    cat "$LOG_FILE" || true
    kill "$RUNNER_PID" 2>/dev/null || true
    wait "$RUNNER_PID" 2>/dev/null || true
    rm -f "$LOG_FILE"
    echo
    echo "=== end diagnostic ==="
  } > "$OUT_FILE" 2>&1
  echo "wrote $OUT_FILE at $(date -Is)"
  sleep "$INTERVAL_SECONDS"
done
