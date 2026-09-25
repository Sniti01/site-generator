// Общий помощник инструментов, которые меряют страницу на порту: какую сборку отдаёт
// сервер и чем снято число («судью судят»: раунд 2 — R2-POLNOTA-2; раунд 3 —
// R3-BRAUZER-7, -11, -12, R3-PROZA-9, -10, R3-MATERIALY-8; раунд 4 — R4-BRAUZER-12, -13,
// R4-POLNOTA-6).
//
// sborka(адрес): отданный / и всё, на что он ссылается со своего адреса — href, src,
// srcset, imagesrcset, poster, data и xlink:href элементов link, script, img, source,
// video, audio, iframe, use, image, object; url() в атрибутах style; url() и @import
// внутри отданных листов (и их листов), — побайтно сверяется с dist/; ответ не 200 —
// отказ. В выгрузку идут sha256 каждого файла. ПРЕДЕЛ: это разбор текста, а не браузер —
// import() из скриптов и то, что страница просит позже, не видны (их видит wiernosc.mjs
// по ответам в окнах).
// pochodzenie(import.meta.url): чем снято — имя и sha256 самого инструмента и этого
// помощника, HEAD на момент прогона (коммит, где инструмента в этой редакции может ещё
// не быть: это отметка времени, не адрес кода — адрес кода даёт sha256), грязь дерева
// сайта и папки инструментов (строки git status целиком, с кодом состояния). Сборку
// dist/ с коммитом не связывает ничто: dist/ вне git, связь — только sha256 файлов.
// Пути к Playwright и Chromium — здесь, для судей и материалов доклада; у помощников
// эскиза (render.mjs, materialy.mjs раннего этапа) — свои (бэклог 60 п. 9).
//
//   node sborka.mjs --selftest — подмены своего сервера над dist/: чистая — ноль отказов;
//     лист 203 теми же байтами, шрифт из url() листа 404, / без листа стилей — свой отказ
import { readFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve, basename, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TU = dirname(fileURLToPath(import.meta.url));
export const REPO = resolve(TU, '../../../..');
export const SITE = join(REPO, 'sites/7thserpent.com');
export const RAPORT = resolve(TU, '..');
export const ZAMERY = resolve(TU, '../zamery');
export const PW = 'C:/Users/MSI/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/package.json';
export const CHROME = 'C:/Users/MSI/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
export const sha = (b) => createHash('sha256').update(b).digest('hex');
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' });
// Строки git status целиком: ведущий пробел первой строки — часть кода состояния (R4-BRAUZER-13).
const gryaz = (p) => git('status', '--porcelain', '--', p).split('\n').filter((l) => l.trim());

export function pochodzenie(url) {
  const plik = fileURLToPath(url);
  return {
    instrument: basename(plik),
    instrument_sha256: sha(readFileSync(plik)),
    pomoshchnik_sha256: sha(readFileSync(fileURLToPath(import.meta.url))),
    head_pri_progone: git('rev-parse', 'HEAD').trim(),
    gryaz_sajta: gryaz('sites/7thserpent.com'),
    gryaz_instrumentov: gryaz(TU),
  };
}

const plikDist = (p) => { const s = decodeURIComponent(p); return join(SITE, 'dist', s.endsWith('/') ? `${s}index.html` : s); };
export async function sborka(url) {
  const origin = new URL(url).origin;
  const bledy = [];
  const pliki = [];
  const vidennye = new Set();
  const pobierz = async (p) => {
    const r = await fetch(origin + p);
    const buf = Buffer.from(await r.arrayBuffer());
    if (r.status !== 200) bledy.push(`${p} — ответ ${r.status}, ждали 200`);
    return buf;
  };
  const sverit = async (p) => {
    if (vidennye.has(p)) return null;
    vidennye.add(p);
    const buf = await pobierz(p);
    const f = plikDist(p);
    const dist = existsSync(f) && statSync(f).isFile() ? readFileSync(f) : null;
    const rowny = !!dist && dist.equals(buf);
    pliki.push({ put: p, sha256: sha(buf), rowny_dist: rowny });
    if (!rowny) bledy.push(`${p} с сервера не равен dist/${dist ? '' : ' (в dist/ файла нет)'}`);
    return buf;
  };
  const svoi = (u, baza = origin + '/') => { try { const x = new URL(u, baza); return x.origin === origin ? x.pathname : null; } catch { return null; } };
  const html = (await sverit('/')).toString('utf8');
  const teg = [...html.matchAll(/<(link|script|img|source|video|audio|iframe|use|image|object)\b[^>]*>/gi)].map((m) => m[0]);
  const atr = (t, a) => new RegExp(`\\s${a}=("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(t);
  const wart = (t, a) => { const m = atr(t, a); return m && (m[2] ?? m[3] ?? m[4]); };
  const adresa = new Set();
  const css = [];
  for (const t of teg) {
    for (const a of ['href', 'src', 'poster', 'data', 'xlink:href']) { const v = wart(t, a); const p = v && svoi(v); if (p) { adresa.add(p); if (a === 'href' && /\brel=["']?stylesheet["']?/i.test(t)) css.push(p); } }
    for (const a of ['srcset', 'imagesrcset']) { const v = wart(t, a); if (v) for (const kand of v.split(',')) { const p = svoi(kand.trim().split(/\s+/)[0]); if (p) adresa.add(p); } }
  }
  for (const m of html.matchAll(/\sstyle=("([^"]*)"|'([^']*)')/gi)) for (const u of (m[2] ?? m[3]).matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) { const p = svoi(u[2]); if (p) adresa.add(p); }
  if (!css.length) bledy.push('в отданном / нет листа стилей');
  const listy = async (p, buf) => {
    const t = buf.toString('utf8');
    for (const m of t.matchAll(/@import\s+(?:url\(\s*)?(['"]?)([^'")\s;]+)\1/g)) { const q = svoi(m[2], origin + p); if (q) { const b = await sverit(q); if (b) await listy(q, b); } }
    for (const m of t.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) { const q = svoi(m[2], origin + p); if (q) await sverit(q); }
  };
  for (const p of adresa) {
    const buf = await sverit(p);
    if (buf && css.includes(p)) await listy(p, buf);
  }
  return { adres: url, pliki, bledy };
}

/** Сверка сборки с отказом: печатает и выходит с 1, если сервер отдаёт не dist/. */
export async function sborkaIliOtkaz(url, imie) {
  const s = await sborka(url);
  if (s.bledy.length) {
    console.error(`${imie}: ОТКАЗ — сервер ${url} отдаёт не ту сборку: ${s.bledy.join('; ')}`);
    process.exit(1);
  }
  mkdirSync(ZAMERY, { recursive: true });
  return s;
}

// ── Самопроверка: подмены своего сервера над dist/ ───────────────────────
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href && process.argv.includes('--selftest')) {
  const MIME = { '.html': 'text/html', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
  const proby = [
    { nazwa: 'чистая копия', odpowiedz: () => null, zhdem: null },
    { nazwa: 'лист 203 теми же байтами', odpowiedz: (p, b) => (p.endsWith('.css') ? { status: 203, b } : null), zhdem: ['ответ 203'] },
    { nazwa: 'шрифт из url() листа 404', odpowiedz: (p) => (p.endsWith('.woff2') ? { status: 404, b: Buffer.alloc(0) } : null), zhdem: ['ответ 404', 'не равен dist/'] },
    { nazwa: '/ без листа стилей', odpowiedz: (p, b) => (p === '/' ? { status: 200, b: Buffer.from(b.toString().replace(/<link[^>]*rel="stylesheet"[^>]*>/g, '')) } : null), zhdem: ['нет листа стилей', 'не равен dist/'] },
  ];
  let zle = 0;
  let port = 4997;
  for (const p of proby) {
    const s = http.createServer(async (rq, rs) => {
      const put = decodeURIComponent(new URL(rq.url, 'http://x').pathname);
      try { const b = await readFile(plikDist(put)); const z = p.odpowiedz(put, b); rs.writeHead(z?.status ?? 200, { 'content-type': MIME[extname(plikDist(put))] ?? 'application/octet-stream' }); rs.end(z?.b ?? b); } catch { rs.writeHead(404); rs.end(); }
    });
    await new Promise((r) => s.listen(port, r));
    const { bledy, pliki } = await sborka(`http://localhost:${port}/`);
    s.close();
    port++;
    const vidy = p.zhdem === null ? [] : p.zhdem;
    const ok = p.zhdem === null ? bledy.length === 0 : vidy.every((v) => bledy.some((b) => b.includes(v))) && bledy.every((b) => vidy.some((v) => b.includes(v)));
    if (!ok) zle++;
    console.log(`${ok ? 'ok ' : 'НЕТ'}  ${p.nazwa}: ждём ${p.zhdem ? `отказ «${vidy.join('» и «')}»` : 'сверено'}, факт ${bledy.length ? bledy.slice(0, 3).join('; ') : `сверено (${pliki.length} файлов)`}`);
  }
  console.log(`sborka --selftest: ${proby.length - zle}/${proby.length}`);
  if (zle) process.exitCode = 1;
}
