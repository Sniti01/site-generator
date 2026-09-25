// Общий помощник инструментов, которые меряют страницу на порту: какую сборку отдаёт
// сервер и чем снято число («судью судят»: раунд 2 — R2-POLNOTA-2; раунд 3 —
// R3-BRAUZER-7, -11, -12, R3-PROZA-9, -10, R3-MATERIALY-8).
//
// sborka(адрес): отданный / и всё, на что он ссылается со своего адреса (листы стилей,
// href, src и srcset элементов, url() внутри отданных листов), побайтно сверяется
// с dist/; ответ не 200 — отказ. В выгрузку идут sha256 каждого файла.
// pochodzenie(import.meta.url): чем снято — имя и sha256 самого инструмента,
// HEAD на момент прогона (коммит, где инструмента в этой редакции может ещё не быть:
// это отметка времени, не адрес кода — адрес кода даёт sha256), грязь дерева сайта
// и папки инструментов. Сборку dist/ с коммитом не связывает ничто: dist/ вне git,
// связь — только sha256 отданных файлов.
// Пути к Playwright и Chromium — здесь, в одном месте (временный кеш npx и кеш
// Playwright; бэклог 60 п. 9).
import { readFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const TU = dirname(fileURLToPath(import.meta.url));
export const REPO = resolve(TU, '../../../..');
export const SITE = join(REPO, 'sites/7thserpent.com');
export const RAPORT = resolve(TU, '..');
export const ZAMERY = resolve(TU, '../zamery');
export const PW = 'C:/Users/MSI/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/package.json';
export const CHROME = 'C:/Users/MSI/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
export const sha = (b) => createHash('sha256').update(b).digest('hex');
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' }).trim();

export function pochodzenie(url) {
  const plik = fileURLToPath(url);
  return {
    instrument: basename(plik),
    instrument_sha256: sha(readFileSync(plik)),
    pomoshchnik_sha256: sha(readFileSync(fileURLToPath(import.meta.url))),
    head_pri_progone: git('rev-parse', 'HEAD'),
    gryaz_sajta: git('status', '--porcelain', '--', 'sites/7thserpent.com').split('\n').filter(Boolean),
    gryaz_instrumentov: git('status', '--porcelain', '--', TU).split('\n').filter(Boolean),
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
  const svoi = (u) => { try { const x = new URL(u, origin + '/'); return x.origin === origin ? x.pathname : null; } catch { return null; } };
  const html = (await sverit('/')).toString('utf8');
  const teg = [...html.matchAll(/<(link|script|img|source|video|audio|iframe)\b[^>]*>/gi)].map((m) => m[0]);
  const atr = (t, a) => new RegExp(`\\s${a}=("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(t);
  const adresa = new Set();
  const css = [];
  for (const t of teg) {
    for (const a of ['href', 'src']) { const m = atr(t, a); const v = m && (m[2] ?? m[3] ?? m[4]); const p = v && svoi(v); if (p) { adresa.add(p); if (/\brel=("?)stylesheet\1/i.test(t) && a === 'href') css.push(p); } }
    for (const a of ['srcset', 'imagesrcset']) { const m = atr(t, a); const v = m && (m[2] ?? m[3] ?? m[4]); if (v) for (const kand of v.split(',')) { const p = svoi(kand.trim().split(/\s+/)[0]); if (p) adresa.add(p); } }
  }
  if (!css.length) bledy.push('в отданном / нет листа стилей');
  for (const p of adresa) {
    const buf = await sverit(p);
    if (buf && css.includes(p)) for (const m of buf.toString('utf8').matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) { const q = svoi(new URL(m[2], origin + p).href); if (q) await sverit(q); }
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
