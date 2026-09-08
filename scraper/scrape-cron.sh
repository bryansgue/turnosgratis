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
# frescura para search engines: lastmod del sitemap = hoy
sed -i "s#<lastmod>[0-9-]*</lastmod>#<lastmod>$(date -u +%F)</lastmod>#g" public/sitemap.xml 2>/dev/null
git add -A
if git diff --cached --quiet; then
  echo "sin cambios en los enlaces — no redeploy"
else
  git commit -q -m "enlaces $(date -u +%F\ %H:%M)" && git push -q origin main
  # redeploy del frontend en Coolify (solo esta app; no toca nada más)
  curl -s -X POST "http://localhost:8000/api/v1/applications/$COOLIFY_APP/restart" \
    -H "Authorization: Bearer $CTOKEN" -o /dev/null -w "redeploy HTTP %{http_code}\n"
fi
# IndexNow: avisar a Bing/Yandex que recrawleen (no depende del deploy)
INDEXNOW_KEY="3bfacb3c2c15b5f0c7c6c1f49d0cd7e0"
for u in "/" "/monopoly-go/" "/free-fire/"; do
  curl -s -o /dev/null "https://api.indexnow.org/indexnow?url=https://turnosgratis.com${u}&key=${INDEXNOW_KEY}"
done
echo "IndexNow ping enviado"
