# TurnosGratis — agregador de recompensas gratis de juegos

Sitio de contenido LIMPIO (para AdSense, sin DMCA) que junta los enlaces de **tiradas/dados/códigos
gratis** de juegos populares (empieza con Coin Master) en un solo lugar, frescos y verificados.
Mismo patrón que un sitio de cupones: no vendemos ni alojamos nada — juntamos enlaces públicos y
monetizamos con ads el tráfico que trae la comodidad.

## Cómo funciona (arquitectura)
```
scraper (cron) → public/data/*.json → sitio estático (nginx) → usuario
```
1. **`scraper/scrape.js`** agrega los enlaces de varias fuentes públicas, filtra los frescos por la
   FECHA embebida en la URL (`..._YYYYMMDD`), verifica que estén vivos (HTTP 200), y escribe
   `public/data/<juego>.json`. Sin dependencias (usa `curl`).
2. **`public/index.html`** es el sitio (rápido, mobile-first). Lee el JSON con `fetch` y lista los
   enlaces con botón "Reclamar", frescura, instrucciones (SEO) y slots de AdSense.
3. **Cron** (`scraper/scrape-cron.sh`, cada 3h) refresca la data. Como `public/data/` es un **volumen
   montado** en el contenedor, los enlaces se actualizan **sin redeploy**.

## Estado (26-ago-2026)
- ✅ Scraper funcionando y validado (28 enlaces vivos de Coin Master en la última corrida).
- ✅ Sitio hecho, probado localmente (index + JSON sirven 200).
- ✅ Deploy scaffolding listo (Dockerfile + nginx.conf + docker-compose con volumen de data).
- ✅ Cron activo (cada 3h).
- ⏳ **PENDIENTE (acción del dueño):** registrar el dominio + crear el servicio en Coolify + DNS + AdSense.
- ⏳ **SEO**: un dominio nuevo tarda 6-12 meses en rankear. Queda publicando/madurando desde ya.

## Cómo desplegarlo (cuando tengas el dominio)
1. Registrá el dominio (ej. `turnosgratis.com`) y apuntá el DNS a Cloudflare → server.
2. En Coolify: nuevo servicio tipo Docker Compose usando `/opt/turnosgratis/docker-compose.yml`.
3. Configurá el dominio en Coolify (inyecta Traefik + SSL solo).
4. Verificá: la home carga y `/data/coinmaster.json` devuelve 200.
5. **AdSense**: cuando el sitio esté vivo con contenido, aplicá en Google AdSense con tu cuenta;
   al aprobarte, pegá el `<script>` de AdSense en `public/index.html` (hay un comentario marcando dónde)
   y reemplazá los `<div class="ad">` por tus bloques de anuncio.

## Cómo agregar un juego nuevo
1. En `scraper/scrape.js`, agregá una entrada a `GAMES` con: `name`, `unit`, `sources` (URLs públicas
   de donde salen los enlaces), `linkRe` (regex del patrón del enlace) y `dateRe` (regex de la fecha).
2. En `public/index.html`, activá el ítem del `<nav>` y armá su página (o generá una por juego).
3. Correr `node scraper/scrape.js <juego>` para probar.

**Monopoly GO (dados)** es el próximo candidato natural (misma mecánica, patrón de enlace distinto:
`mnplygo.onelink.me`/similar — hay que validar la fuente y el regex, como se hizo con Coin Master).

## Notas
- **Fuentes del scraper**: hoy agrega de sitios públicos (funciona con `curl`+regex). La vía más
  robusta/original es suscribirse al **newsletter oficial de Moon Active** y parsear los emails (IMAP),
  de donde salen los códigos `pe_EMAIL...`. Facebook/Instagram directo = anti-scraping, no necesario.
- **Limpio y sin DMCA**: solo se listan enlaces de recompensas de acceso público del propio juego.
- Mantené este proyecto **separado** de la plataforma de streaming (otro dominio, otra cuenta AdSense).
