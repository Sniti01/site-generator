// Раунд 2 «судью судят», линза «ложный ok»: общее для воспроизведений против sites/7thserpent.com/tools/check-live.mjs
// (коммит 816ba46). Сети нет: poluchit(url) — подставные ответы; образец здорового сайта повторяет zdorovyy() проб
// (tools/testy/check-live.test.mjs). Репозиторий только читается.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

export const REPO = 'D:/SEO/cloud/site-generator';
export const SAYT = join(REPO, 'sites/7thserpent.com');
export const CL = await import(pathToFileURL(join(SAYT, 'tools/check-live.mjs')).href);
export const struktura = JSON.parse(readFileSync(join(SAYT, 'structure/structure.json'), 'utf8'));
export const nashRobots = readFileSync(join(SAYT, 'public/robots.txt'), 'utf8');
export const HOST = 'www.7thserpent.com';
export const B = `https://${HOST}`;
export const METKA = 'm1';
export const YASHCHIK = 'box@7thserpent.com';
export const igra = struktura.pages.find((p) => p.type === 'game').url;

export const otvet = (status, telo = '', zag = {}, location = '') => ({ status, location, telo, zagolovok: (i) => zag[i.toLowerCase()] ?? '' });
export const title404 = struktura.pages.find((p) => p.url === '/404/').title;
export const stranica = (url, title = 'x', telo = '<p>text</p>') =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><link rel="canonical" href="${B}${url}"><script type="module">document.querySelector('.hdr__burger')</script></head><body><main>${telo}</main></body></html>`;
export const HTML = { 'cache-control': 'public, max-age=0, must-revalidate', 'x-ray': 'p542:wal', 'cf-cache-status': 'DYNAMIC', 'content-type': 'text/html' };
export const HOSTER = '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n# END adm.tools Managed content\n\n';
export const CLOUDFLARE =
  '# BEGIN Cloudflare Managed content\n# As a condition of accessing this website, you agree to abide by the following content signals:\nUser-agent: *\nContent-Signal: search=yes,ai-train=no\nAllow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n\nUser-agent: GPTBot\nDisallow: /\n# END Cloudflare Managed Content\n\n';
const urlset = (urls) => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${u}</loc></url>`).join('')}</urlset>`;
export const STRANICY = struktura.pages.filter((p) => p.url !== '/404/');
const KARTA = STRANICY.map((p) => `${B}${p.url}`);
export const PRIVACY = stranica('/privacy/', 'Privacy policy — 7thserpent.com', `<p>Requests about the logs go to <a href="mailto:${YASHCHIK}">${YASHCHIK}</a>.</p>`);
export const MIMO = `${B}/robots.txt?live-check=${METKA}`;
export const BEZ = `${B}/robots.txt`;

/** Образец здорового сайта: адрес → ответ (как zdorovyy() проб). */
export function zdorovyy() {
  const k = new Map();
  for (const put of ['/', igra]) {
    k.set(`http://${HOST}${put}`, otvet(301, '', {}, `${B}${put}`));
    k.set(`https://7thserpent.com${put}`, otvet(301, '', {}, `${B}${put}`));
    k.set(`http://7thserpent.com${put}`, otvet(301, '', {}, `${B}${put}`));
  }
  for (const p of STRANICY) k.set(`${B}${p.url}`, otvet(200, stranica(p.url, p.title), HTML));
  k.set(`${B}/privacy/`, otvet(200, PRIVACY, HTML));
  k.set(MIMO, otvet(200, HOSTER + nashRobots, { 'cf-cache-status': 'DYNAMIC' }));
  k.set(BEZ, otvet(200, HOSTER + nashRobots, { 'cf-cache-status': 'HIT', age: '120' }));
  k.set(`${B}/sitemap-index.xml`, otvet(200, `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${B}/sitemap-0.xml</loc></sitemap></sitemapindex>`));
  k.set(`${B}/sitemap-0.xml`, otvet(200, urlset(KARTA)));
  k.set(`${B}/net-takoy-stranicy-${METKA}/`, otvet(404, stranica('/404/', title404), HTML));
  k.set(`${B}/404/`, otvet(200, stranica('/404/', title404), HTML));
  return k;
}
export const zamenit = (karta, url, f) => karta.set(url, f(karta.get(url)));
export const sZag = (o, zag) => ({ ...o, zagolovok: (i) => (i.toLowerCase() in zag ? zag[i.toLowerCase()] : o.zagolovok(i)) });

/** Прогон инструмента на образце с порчей; `modul` — другой модуль инструмента (например, прежняя редакция). */
export async function progon(izmenit = () => {}, modul = CL) {
  const karta = zdorovyy();
  izmenit(karta);
  const poluchit = async (url) => {
    if (!karta.has(url)) throw new Error(`запрос вне образца: ${url}`);
    return karta.get(url);
  };
  const r = await modul.proverit({ poluchit, host: HOST, struktura, nashRobots, metka: METKA });
  const plokho = r.proverki.filter((c) => !c.ok);
  return { ...r, plokho, itog: `${r.proverki.length - plokho.length}/${r.proverki.length}`, najti: (imya) => r.proverki.find((c) => c.imya === imya) };
}

/** Прежняя редакция инструмента (45052d0) — файлом в папке скриптов, только для сравнения. */
export async function prezhniy() {
  const put = new URL('./check-live-45052d0.mjs', import.meta.url);
  const tekst = execFileSync('git', ['-C', REPO, 'show', '45052d0:sites/7thserpent.com/tools/check-live.mjs'], { encoding: 'utf8' });
  writeFileSync(put, tekst);
  return import(put.href);
}

/* ---------- модель разборщика Google: перенос RobotsMatcher из github.com/google/robotstxt (robots.cc) ----------
 * ParseRobotsTxt (строки по \n, \r, \r\n; # — комментарий; ключ до первого «:», без двоеточия — ровно два слова),
 * ParsedRobotsKey (StartsWithIgnoreCase: user-agent / useragent / user agent; allow; disallow и опечатки),
 * HandleUserAgent («*» и «* что-то» — общая группа; ExtractUserAgent — [A-Za-z_-]*), HandleAllow/HandleDisallow
 * (seen_separator_, specific/global приоритеты длиной образца), Matches (* и $ только в конце), disallow(). */
const WS = /^[ \t\n\v\f\r]+|[ \t\n\v\f\r]+$/g;
function matches(path, pattern) {
  const n = path.length;
  let pos = [0];
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '$' && i + 1 === pattern.length) return pos[pos.length - 1] === n;
    if (c === '*') {
      const out = [];
      for (let p = pos[0]; p <= n; p++) out.push(p);
      pos = out;
    } else {
      pos = pos.filter((p) => p < n && path[p] === c).map((p) => p + 1);
      if (!pos.length) return false;
    }
  }
  return true;
}
const escapePattern = (v) => v.replace(/%([0-9a-f]{2})/gi, (_, h) => '%' + h.toUpperCase()).replace(/[^\x00-\x7f]/gu, (ch) => [...Buffer.from(ch, 'utf8')].map((b) => '%' + b.toString(16).toUpperCase().padStart(2, '0')).join(''));
export function google(txt, agent, path) {
  let seenGlobal = false, seenSpecific = false, everSpecific = false, seenSep = false;
  const allow = { g: -1, s: -1 }, dis = { g: -1, s: -1 };
  for (let line of txt.replace(/^\uFEFF/, '').split(/\r\n|\r|\n/)) {
    const h = line.indexOf('#');
    if (h >= 0) line = line.slice(0, h);
    line = line.replace(WS, '');
    if (!line) continue;
    let key, val;
    const c = line.indexOf(':');
    if (c >= 0) {
      key = line.slice(0, c);
      val = line.slice(c + 1);
    } else {
      const m = /[ \t]/.exec(line);
      if (!m) continue;
      const rest = line.slice(m.index).replace(/^[ \t]+/, '');
      if (/[ \t]/.test(rest)) continue;
      key = line.slice(0, m.index);
      val = rest;
    }
    key = key.replace(WS, '');
    if (!key) continue;
    val = val.replace(WS, '');
    const k = key.toLowerCase();
    const isUA = ['user-agent', 'useragent', 'user agent'].some((t) => k.startsWith(t));
    const isAllow = !isUA && k.startsWith('allow');
    const isDis = !isUA && !isAllow && ['disallow', 'dissallow', 'dissalow', 'disalow', 'diasllow', 'disallaw'].some((t) => k.startsWith(t));
    if (isUA) {
      if (seenSep) seenSpecific = seenGlobal = seenSep = false;
      if (val.length >= 1 && val[0] === '*' && (val.length === 1 || /\s/.test(val[1]))) seenGlobal = true;
      else if ((/^[A-Za-z_-]*/.exec(val)[0]).toLowerCase() === agent.toLowerCase()) seenSpecific = everSpecific = true;
    } else if (isAllow || isDis) {
      if (!(seenGlobal || seenSpecific)) continue;
      seenSep = true;
      const pat = escapePattern(val);
      const pr = matches(path, pat) ? pat.length : -1;
      if (pr < 0) continue;
      const t = isAllow ? allow : dis;
      if (seenSpecific) t.s = Math.max(t.s, pr);
      else t.g = Math.max(t.g, pr);
    }
  }
  if (allow.s > 0 || dis.s > 0) return !(dis.s > allow.s);
  if (everSpecific) return true;
  if (dis.g > 0 || allow.g > 0) return !(dis.g > allow.g);
  return true;
}
export const googleVerdikt = (txt, agent, puti) => puti.map((p) => `${agent} ${p}: ${google(txt, agent, p) ? 'открыт' : 'ЗАКРЫТ'}`).join(', ');

/** Вывод — в консоль и файлом рядом со скриптом (`<имя>.txt`). */
export function vyvesti(imya, stroki) {
  const tekst = stroki.join('\n') + '\n';
  writeFileSync(new URL(`./${imya}.txt`, import.meta.url), tekst);
  process.stdout.write(tekst);
}

export const stroka = (c) => (c ? `${c.ok ? 'ok' : 'ПЛОХО'} «${c.imya}» — факт ${c.fakt}${c.otkuda ? ` — ${c.otkuda}` : ''}` : '—');
