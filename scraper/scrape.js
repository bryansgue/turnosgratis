// scrape.js — Captura recompensas gratis (tiradas/dados/códigos) de varios juegos
// desde fuentes públicas y escribe un JSON por juego en ../public/data/.
//
// Tipos de juego:
//   link (Coin Master): enlaces rewards.coinmaster.com con FECHA en la URL + spin_count.
//                       Se filtran frescos por fecha y se verifican (HTTP 200).
//   link (Monopoly GO): enlaces mply.io SIN fecha → se toman los del día de la fuente.
//   code (Free Fire):   códigos de texto de 12 chars (letras+dígitos), se canjean en la web oficial.
//
// Sin dependencias externas: usa curl (ya está en el server).
//
// Uso:  node scrape.js            (todos)   |   node scrape.js coinmaster (uno)

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127 Safari/537.36';

const GAMES = {
  coinmaster: {
    type: 'link', name: 'Coin Master', unit: 'giros', validDays: 3, verify: true, dated: true,
    sources: ['https://www.coinmaster-links.com/','https://coinmasterfreespins.cc/','https://levvvel.com/coin-master/free-spins/','https://rezortricks.com/coin-master-free-spins/','https://mycoinmaster.com/'],
    linkRe: /https?:\/\/rewards\.coinmaster\.com\/rewards\/rewards\.html\?c=[a-zA-Z0-9_]+/g,
    dateRe: /_(\d{8})(?:$|[^\d])/,
    richRe: /link_url\\?":\\?"(https:\/\/rewards\.coinmaster\.com\/rewards\/rewards\.html\?c=[a-zA-Z0-9_]+)\\?"[^}]*?spin_count\\?":(\d+)/g,
  },
  monopolygo: {
    type: 'link', name: 'Monopoly GO', unit: 'dados', validDays: 2, verify: false, dated: false, max: 24,
    sources: ['https://www.eldorado.gg/blog/monopoly-go-free-dice-links-today/','https://monopolygo.game/es/today-monopoly-go-free-dice-links','https://www.gamsgo.com/es/blog/dados-gratis-monopoly-go','https://egamersworld.com/blog/monopoly-go-free-dice-links-8eojWtXkuJ'],
    linkRe: /https?:\/\/mply\.io\/[a-zA-Z0-9]{8,}/g,
  },
  freefire: {
    type: 'code', name: 'Free Fire', unit: 'código', max: 24,
    sources: ['https://codigosfreefire.com/','https://trucoteca.com/codigos-de-free-fire-para-hoy-canjea-recompensas-gratis/','https://www.gamsgo.com/es/blog/codigos-de-free-fire'],
    codeRe: /\b[A-Z0-9]{12}\b/g,
  },
};

function log(m) { console.log(`[${new Date().toISOString()}] ${m}`); }
function fetchHtml(url) {
  try { return execSync(`curl -s -L -A "${UA}" --max-time 25 "${url}"`, { maxBuffer: 20 * 1024 * 1024 }).toString(); }
  catch (e) { return ''; }
}
function ymd(d) { return new Date(Date.now() - d * 86400000).toISOString().slice(0, 10).replace(/-/g, ''); }
function verifyLive(url) {
  try { const c = execSync(`curl -s -o /dev/null -w '%{http_code}' -A "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)" --max-time 12 "${url}"`, { timeout: 15000 }).toString().trim();
        return c === '200' || c === '301' || c === '302'; } catch (e) { return false; }
}

function scrapeLinks(key, g) {
  const found = new Set(), spins = {};
  for (const src of g.sources) {
    const html = fetchHtml(src);
    let rich = 0;
    if (g.richRe) { let m; g.richRe.lastIndex = 0; while ((m = g.richRe.exec(html)) !== null) { const u = m[1].replace(/^http:/, 'https:'); found.add(u); spins[u] = parseInt(m[2]); rich++; } }
    const m = html.match(g.linkRe) || [];
    m.forEach(u => found.add(u.replace(/^http:/, 'https:')));
    log(`  ${src.slice(0, 46)} → ${m.length}${rich ? ` (${rich} c/cantidad)` : ''}`);
  }
  let links = [...found].map(url => ({ url, date: g.dated ? ((url.match(g.dateRe) || [])[1] || null) : ymd(0), spins: spins[url] || null }));
  if (g.dated) { const win = []; for (let d = 0; d <= g.validDays; d++) win.push(ymd(d)); links = links.filter(l => l.date && win.includes(l.date)); }
  log(`  candidatos: ${links.length}`);
  if (g.verify && links.length) {
    let i = 0; const worker = async () => { while (i < links.length) { const j = i++; links[j].live = verifyLive(links[j].url); } };
    return Promise.all(Array.from({ length: 8 }, worker)).then(() => {
      const before = links.length; links = links.filter(l => l.live);
      log(`  vivos: ${links.length} (−${before - links.length})`);
      return finishLinks(key, g, links);
    });
  }
  if (g.max) links = links.slice(0, g.max);
  return Promise.resolve(finishLinks(key, g, links));
}
function finishLinks(key, g, links) {
  links.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return { game: key, name: g.name, type: 'link', unit: g.unit, updated_at: new Date().toISOString(),
           count: links.length, items: links.map(l => ({ url: l.url, date: l.date, spins: l.spins })) };
}

function scrapeCodes(key, g) {
  const found = new Set();
  for (const src of g.sources) {
    const html = fetchHtml(src);
    const m = (html.match(g.codeRe) || []).filter(c => /[A-Z]/.test(c) && /[0-9]/.test(c)); // real: letras+dígitos
    m.forEach(c => found.add(c));
    log(`  ${src.slice(0, 46)} → ${m.length} códigos`);
  }
  let codes = [...found].slice(0, g.max);
  return Promise.resolve({ game: key, name: g.name, type: 'code', unit: g.unit, updated_at: new Date().toISOString(),
                           count: codes.length, items: codes.map(c => ({ code: c })) });
}

async function scrapeGame(key) {
  const g = GAMES[key]; log(`== ${g.name} ==`);
  const out = g.type === 'code' ? await scrapeCodes(key, g) : await scrapeLinks(key, g);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, `${key}.json`), JSON.stringify(out, null, 2) + '\n');
  log(`  ✅ data/${key}.json (${out.count})`);
  return out.count;
}

(async () => {
  const only = process.argv[2];
  const keys = only ? [only] : Object.keys(GAMES);
  let total = 0;
  for (const k of keys) if (GAMES[k]) total += await scrapeGame(k);
  log(`FIN — ${total} recompensas`);
})();
