#!/bin/bash
# ============================================
# Weather Bot — Auto-Update Script
# ============================================
# Spusti toto na svojom NTB/serveri.
# Automaticky pullne zmeny z GitHubu a reštartne bota ak sa niečo zmenilo.
#
# Použitie:
#   chmod +x scripts/auto-update.sh
#   ./scripts/auto-update.sh          (jednorazovo)
#   Alebo cez cron/Task Scheduler     (automaticky)
# ============================================

cd "$(dirname "$0")/.." || exit 1

echo "[UPDATE] $(date) — Kontrolujem zmeny..."

# Fetch zmeny z remote
git fetch origin main 2>/dev/null

# Porovnaj lokálny a remote
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "[UPDATE] Žiadne zmeny."
    exit 0
fi

echo "[UPDATE] Najdene zmeny! Stahujem..."
git pull origin main

echo "[UPDATE] Instalam dependencies..."
npm install

echo "[UPDATE] Deployujem commandy..."
npm run deploy

# Restartni bota
if command -v pm2 &> /dev/null; then
    echo "[UPDATE] Reštartujem cez PM2..."
    pm2 restart nimbus
elif command -v systemctl &> /dev/null && systemctl is-active --quiet nimbus; then
    echo "[UPDATE] Reštartujem cez systemd..."
    sudo systemctl restart nimbus
else
    echo "[UPDATE] PM2/systemd nenájdený. Reštartni bota manuálne!"
    echo "[UPDATE] Alebo použi: npm start"
fi

echo "[UPDATE] Hotovo! Nová verzia: $(git rev-parse --short HEAD)"
