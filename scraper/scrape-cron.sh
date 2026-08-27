#!/usr/bin/env bash
# Cada pocas horas: actualiza enlaces frescos → commitea → pushea → redeploy en Coolify.
# El build de Coolify hornea el JSON del repo, así que el redeploy publica los enlaces nuevos.
# Cron sugerido:  0 */3 * * *  /opt/turnosgratis/scraper/scrape-cron.sh >> /tmp/turnosgratis_scrape.log 2>&1
set -uo pipefail
PROJ=/opt/turnosgratis
COOLIFY_APP="qzcx41xw9aapmk32uljyv203"
CTOKEN=$(grep '^coolify_api=' /opt/video-platform/.env | cut -d= -f2)

echo "=== $(date -u +%FT%TZ) ==="
cd "$PROJ/scraper" || exit 1
node scrape.js

cd "$PROJ" || exit 1
git add -A
if git diff --cached --quiet; then
  echo "sin cambios en los enlaces — no redeploy"
  exit 0
fi
git commit -q -m "enlaces $(date -u +%F\ %H:%M)" && git push -q origin main
# redeploy del frontend en Coolify (solo esta app; no toca nada más)
curl -s -X POST "http://localhost:8000/api/v1/applications/$COOLIFY_APP/restart" \
  -H "Authorization: Bearer $CTOKEN" -o /dev/null -w "redeploy HTTP %{http_code}\n"
