// Общий помощник инструментов, которые меряют страницу на порту: какую сборку отдаёт
// сервер («судью судят», раунд 2, R2-POLNOTA-2 — числа без проверки сборки).
// Отданные / и листы стилей, на которые он ссылается, побайтно сверяются с dist/;
// в выгрузку идут sha256, коммит и грязь дерева сайта. Расхождение — отказ
// инструмента: число, снятое не с той сборки, не пишется.
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TU = dirname(fileURLToPath(import.meta.url));
export const REPO = resolve(TU, '../../../..');
export const SITE = join(REPO, 'sites/7thserpent.com');
export const ZAMERY = resolve(TU, '../zamery');
export const PW = 'C:/Users/MSI/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/package.json';
export const CHROME = 'C:/Users/MSI/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
export const sha = (b) => createHash('sha256').update(b).digest('hex');
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' }).trim();

export async function sborka(url) {
  const origin = new URL(url).origin;
  const pobierz = async (p) => {
    const r = await fetch(origin + p);
    if (!r.ok) throw new Error(`сервер ${origin}: ${p} — ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  };
  const html = await pobierz('/');
  const css = [...html.toString('utf8').matchAll(/<link\b[^>]*>/g)]
    .map((m) => m[0])
    .filter((t) => /\brel="?stylesheet"?/.test(t))
    .map((t) => /\bhref="?([^"\s>]+)"?/.exec(t)?.[1])
    .filter(Boolean);
  const pliki = [];
  for (const [put, buf] of [['/', html], ...(await Promise.all(css.map(async (p) => [p, await pobierz(p)])))]) {
    const f = join(SITE, 'dist', put === '/' ? 'index.html' : put);
    const dist = existsSync(f) ? readFileSync(f) : null;
    pliki.push({ put, sha256: sha(buf), rowny_dist: !!dist && dist.equals(buf) });
  }
  const bledy = pliki.filter((p) => !p.rowny_dist).map((p) => `${p.put} с сервера не равен dist/`);
  if (!css.length) bledy.push('в отданном / нет листа стилей');
  return {
    adres: url,
    kommit: git('rev-parse', 'HEAD'),
    gryaz_sajta: git('status', '--porcelain', '--', 'sites/7thserpent.com').split('\n').filter(Boolean),
    pliki,
    bledy,
  };
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
