#!/usr/bin/env bash
# PAL360 — Local Dev Launcher
# Starts FastAPI backend + Next.js frontend on available ports.
# Usage: bash dev.sh

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND="$ROOT/frontend"
BACKEND="$ROOT/backend"

# ── Port finder ────────────────────────────────────────────────────────────────
find_port() {
  local port=$1
  while true; do
    if ! (echo >/dev/tcp/localhost/$port) 2>/dev/null; then
      echo $port
      return
    fi
    port=$((port + 1))
  done
}

API_PORT=$(find_port 8000)
UI_PORT=$(find_port 4001)

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║   PAL360 — Local Dev Server          ║"
echo "  ╚══════════════════════════════════════╝"
echo ""
echo "  Backend  → http://localhost:$API_PORT"
echo "  Frontend → http://localhost:$UI_PORT"
echo "  API Docs → http://localhost:$API_PORT/docs"
echo ""

# ── Write .env.local with correct API URL ──────────────────────────────────────
ENV_FILE="$FRONTEND/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  cp "$FRONTEND/.env.local.example" "$ENV_FILE"
  echo "  Created $ENV_FILE from example."
fi

# Update NEXT_PUBLIC_API_URL to reflect the resolved port
if grep -q "NEXT_PUBLIC_API_URL" "$ENV_FILE"; then
  sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://localhost:$API_PORT|" "$ENV_FILE"
else
  echo "NEXT_PUBLIC_API_URL=http://localhost:$API_PORT" >> "$ENV_FILE"
fi

# ── Check Python venv ──────────────────────────────────────────────────────────
VENV="$BACKEND/.venv"
if [ ! -d "$VENV" ]; then
  echo "  Creating Python venv..."
  python -m venv "$VENV"
fi

# ── Install dependencies (quiet if already installed) ─────────────────────────
echo "  Checking backend deps..."
"$VENV/bin/pip" install -q -r "$BACKEND/requirements.txt"

echo "  Checking frontend deps..."
(cd "$FRONTEND" && npm install --silent 2>/dev/null)

# ── Launch both servers ────────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo "  Shutting down PAL360..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

# Backend
(cd "$BACKEND" && \
  "$VENV/bin/uvicorn" main:app \
    --host 127.0.0.1 \
    --port "$API_PORT" \
    --reload \
    --log-level warning \
    2>&1 | sed 's/^/  [api] /' \
) &
BACKEND_PID=$!

# Give backend a moment to bind
sleep 1

# Frontend
(cd "$FRONTEND" && \
  PORT="$UI_PORT" npm run dev \
    2>&1 | sed 's/^/  [ui]  /' \
) &
FRONTEND_PID=$!

echo ""
echo "  Running. Press Ctrl+C to stop."
echo ""

wait "$BACKEND_PID" "$FRONTEND_PID"
