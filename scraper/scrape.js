// scrape.js — Captura enlaces de recompensas gratis (tiradas/dados) de varios juegos,
// desde fuentes públicas, filtra los frescos por la FECHA embebida en la URL, verifica
// que estén vivos, y escribe un JSON por juego en ../data/.
//
// Validado 26-ago-2026: los links de Coin Master siguen el patrón
//   https://rewards.coinmaster.com/rewards/rewards.html?c=CODE_YYYYMMDD
// La fecha va en la URL → filtrar frescos es trivial. Verificar = HTTP 200.
//
// Uso:  node scrape.js            (todos los juegos)
//       node scrape.js coinmaster (uno)
// Sin dependencias externas: usa curl (ya está en el server) vía child_process.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Safari/537.36';
const VALID_DAYS = 3;        // los links de Coin Master viven ~3 días
const VERIFY = true;         // pegarle a cada link fresco y quedarse con los 200
const VERIFY_CONCURRENCY = 8;

// Config por juego: cómo se llama, de dónde se agrega, y el patrón del link.
const GAMES = {
  coinmaster: {
    name: 'Coin Master',
    unit: 'tiradas',
    sources: [
      'https://www.coinmaster-links.com/',
      'https://coinmasterfreespins.cc/',
      'https://levvvel.com/coin-master/free-spins/',
      'https://rezortricks.com/coin-master-free-spins/',
      'https://mycoinmaster.com/',
    ],
    // rewards.coinmaster.com/rewards/rewards.html?c=CODE_YYYYMMDD
    linkRe: /https?:\/\/rewards\.coinmaster\.com\/rewards\/rewards\.html\?c=[a-zA-Z0-9_]+/g,
    dateRe: /_(\d{8})(?:$|[^\d])/,
  },
  // TODO: monopolygo (dados) — patrón mnplygo.onelink.me / distinto; agregar tras validar.
};

function log(m) { console.log(`[${new Date().toISOString()}] ${m}`); }

function fetchHtml(url) {
  try {
    return execSync(`curl -s -L -A "${UA}" --max-time 25 "${url}"`,
      { maxBuffer: 20 * 1024 * 1024 }).toString();
  } catch (e) { return ''; }
}

function ymd(d) {
  const x = new Date(Date.now() - d * 86400000);
  return x.toISOString().slice(0, 10).replace(/-/g, '');
}

function verifyLive(url) {
  try {
    const code = execSync(
      `curl -s -o /dev/null -w '%{http_code}' -A "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)" --max-time 12 "${url}"`,
      { timeout: 15000 }).toString().trim();
    return code === '200' || code === '301' || code === '302';
  } catch (e) { return false; }
}

async function scrapeGame(key) {
  const g = GAMES[key];
  log(`== ${g.name} ==`);
  // 1) juntar links de todas las fuentes
  const found = new Set();
  for (const src of g.sources) {
    const html = fetchHtml(src);
    const m = html.match(g.linkRe) || [];
    m.forEach(u => found.add(u.replace(/^http:/, 'https:')));
    log(`  ${src} → ${m.length} links`);
  }
  // 2) filtrar frescos por la fecha embebida
  const fresh = ymd(0), win = [];
  for (let d = 0; d <= VALID_DAYS; d++) win.push(ymd(d));
  let links = [...found].map(url => {
    const dm = url.match(g.dateRe);
    return { url, date: dm ? dm[1] : null };
  }).filter(l => l.date && win.includes(l.date));
  // dedupe por código
  const seen = new Set();
  links = links.filter(l => { if (seen.has(l.url)) return false; seen.add(l.url); return true; });
  log(`  frescos (últimos ${VALID_DAYS}d): ${links.length} de ${found.size} totales`);

  // 3) verificar que vivan (concurrencia limitada)
  if (VERIFY && links.length) {
    let i = 0;
    async function worker() {
      while (i < links.length) { const j = i++; links[j].live = verifyLive(links[j].url); }
    }
    await Promise.all(Array.from({ length: VERIFY_CONCURRENCY }, worker));
    const before = links.length;
    links = links.filter(l => l.live);
    log(`  vivos: ${links.length} (descartados ${before - links.length} muertos)`);
  }

  // 4) ordenar (más nuevos primero) y guardar
  links.sort((a, b) => b.date.localeCompare(a.date));
  const out = {
    game: key, name: g.name, unit: g.unit,
    updated_at: new Date().toISOString(),
    count: links.length,
    links: links.map(l => ({ url: l.url, date: l.date })),
  };
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, `${key}.json`), JSON.stringify(out, null, 2) + '\n');
  log(`  ✅ guardado data/${key}.json (${links.length} links vivos)`);
  return out.count;
}

(async () => {
  const only = process.argv[2];
  const keys = only ? [only] : Object.keys(GAMES);
  let total = 0;
  for (const k of keys) { if (GAMES[k]) total += await scrapeGame(k); }
  log(`FIN — ${total} links vivos en total`);
})();
