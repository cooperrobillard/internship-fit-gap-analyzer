#!/usr/bin/env bash
# Start the local full-stack web demo: FastAPI (background) + Next.js (foreground).
#
# Run from the repository root:
#   chmod +x scripts/run_local_full_stack_demo.sh
#   ./scripts/run_local_full_stack_demo.sh
#
# Local development only — not deployment. Does not read or store resume/job text.

set -euo pipefail

API_PID=""

cleanup() {
  if [[ -n "${API_PID}" ]] && kill -0 "${API_PID}" 2>/dev/null; then
    echo ""
    echo "Stopping FastAPI (PID ${API_PID})..."
    kill "${API_PID}" 2>/dev/null || true
    wait "${API_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

if [[ ! -f "api/main.py" ]]; then
  echo "Error: api/main.py not found." >&2
  echo "Run this script from the repository root:" >&2
  echo "  ./scripts/run_local_full_stack_demo.sh" >&2
  exit 1
fi

if [[ ! -f "web/package.json" ]]; then
  echo "Error: web/package.json not found." >&2
  echo "Run this script from the repository root:" >&2
  echo "  ./scripts/run_local_full_stack_demo.sh" >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 is not installed or not on PATH." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed or not on PATH." >&2
  exit 1
fi

if [[ ! -f "web/.env.local" ]]; then
  echo "Warning: web/.env.local is missing."
  echo "Clerk sign-in and Supabase dashboard features need env values in web/.env.local."
  echo "Copy web/.env.example to web/.env.local and add your development keys."
  echo ""
fi

health_ok() {
  python3 - <<'PY'
import sys
import urllib.request

try:
    with urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=1) as response:
        sys.exit(0 if response.status == 200 else 1)
except Exception:
    sys.exit(1)
PY
}

echo "Starting FastAPI on http://127.0.0.1:8000 ..."
python3 -m uvicorn api.main:app --reload --port 8000 &
API_PID=$!

echo "Waiting for FastAPI health check..."
attempt=1
max_attempts=30
while [[ "${attempt}" -le "${max_attempts}" ]]; do
  if health_ok; then
    echo "FastAPI is ready: http://127.0.0.1:8000/health"
    break
  fi
  if ! kill -0 "${API_PID}" 2>/dev/null; then
    echo "Error: FastAPI exited before the health check passed." >&2
    API_PID=""
    exit 1
  fi
  sleep 0.5
  attempt=$((attempt + 1))
done

if [[ "${attempt}" -gt "${max_attempts}" ]]; then
  echo "Error: FastAPI did not become ready at http://127.0.0.1:8000/health" >&2
  echo "Check that port 8000 is free and uvicorn is installed (pip install -r requirements.txt)." >&2
  exit 1
fi

echo ""
echo "Starting Next.js on http://localhost:3000 ..."
echo "Dashboard: http://localhost:3000/dashboard"
echo "Press Control+C to stop both servers."
echo ""

cd web
npm run dev
