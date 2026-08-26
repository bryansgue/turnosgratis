#!/usr/bin/env bash
# Actualiza los enlaces frescos cada pocas horas. La data cae en public/data/,
# que el contenedor sirve por volumen → los enlaces se refrescan sin redeploy.
# Cron sugerido (cada 3 horas):
#   0 */3 * * *  /opt/turnosgratis/scraper/scrape-cron.sh >> /tmp/turnosgratis_scrape.log 2>&1
set -uo pipefail
cd /opt/turnosgratis/scraper || exit 1
echo "=== $(date -u +%FT%TZ) ==="
node scrape.js
