#!/usr/bin/env bash
set -e

echo ""
echo " =========================================="
echo "  Smart Quetta Hotel - Starting..."
echo " =========================================="
echo ""

# ── Check Node.js ─────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    echo " [ERROR] Node.js is not installed!"
    echo ""
    echo " Install it from: https://nodejs.org  (LTS version)"
    echo " Or via nvm:  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
    exit 1
fi

NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo " [ERROR] Node.js v$NODE_MAJOR found, v18+ required."
    echo " Update from: https://nodejs.org"
    exit 1
fi
echo " [OK] Node.js v$(node -v) found"
echo ""

# ── Create .env if missing ────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo " [OK] Created .env from .env.example"
    else
        printf "NODE_ENV=development\nJWT_SECRET=local-dev-secret\n" > .env
        echo " [OK] Created default .env"
    fi
else
    echo " [OK] .env already exists"
fi
echo ""

# ── Install dependencies ───────────────────────────────────────────────────────
echo " Installing dependencies (first run may take a few minutes)..."
echo ""
npm install --legacy-peer-deps --loglevel=error || npm install --force --loglevel=warn
echo ""
echo " [OK] Dependencies installed"
echo ""

# ── Rebuild native modules ────────────────────────────────────────────────────
echo " Rebuilding native modules (better-sqlite3)..."
npm rebuild better-sqlite3 --loglevel=error 2>/dev/null || true
echo " [OK] Native modules ready"
echo ""

# ── Open browser ──────────────────────────────────────────────────────────────
(sleep 4 && \
    if command -v xdg-open &>/dev/null; then xdg-open http://localhost:3000; \
    elif command -v open &>/dev/null; then open http://localhost:3000; fi \
) &

# ── Start dev server ──────────────────────────────────────────────────────────
echo " =========================================="
echo "  App is starting at http://localhost:3000"
echo "  Press Ctrl+C to stop"
echo " =========================================="
echo ""
npm run dev
