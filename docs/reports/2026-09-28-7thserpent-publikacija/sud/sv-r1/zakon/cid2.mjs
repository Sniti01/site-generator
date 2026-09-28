// SV1-Z: хеш области видимости стилей (data-astro-cid-*) считает сам компилятор Astro сайта
// (@astrojs/compiler-rs из node_modules репозитория) — по normalizedFilename, как в astro/dist/core/compile/compile.js:
// путь внутри корня сайта — «/src/…», путь ВНЕ корня (ядро core/) — абсолютный путь целиком.
// Сверяем cid из dist с тем, что даёт компилятор для путей Windows и для пути раннера GitHub.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = 'D:/SEO/cloud/site-generator';
const SAYT = REPO + '/sites/7thserpent.com';
const DIST = SAYT + '/dist';
const { transform } = await import(pathToFileURL(REPO + '/node_modules/@astrojs/compiler-rs/dist/index.mjs').href);

const obhod = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? obhod(join(d, n)) : [join(d, n)]));

const cidy = new Map();
for (const f of obhod(DIST)) {
  if (!/\.(html|css)$/.test(f)) continue;
  const t = readFileSync(f, 'utf8');
  for (const m of t.matchAll(/data-astro-cid-([a-z0-9]{8})/g)) {
    if (!cidy.has(m[1])) cidy.set(m[1], new Set());
    cidy.get(m[1]).add(relative(DIST, f).replace(/\\/g, '/'));
  }
}

const scope = (src, filename, normalizedFilename) => transform(src, { filename, normalizedFilename }).scope;

const kandidaty = [];
for (const f of obhod(SAYT + '/src').filter((x) => x.endsWith('.astro'))) {
  const src = readFileSync(f, 'utf8');
  const n = '/' + relative(SAYT, f).replace(/\\/g, '/');
  kandidaty.push({ gde: 'сайт', fajl: n, put: n, h: scope(src, f, n) });
}
const KORNI = { win: 'D:/SEO/cloud/site-generator/', winLower: 'd:/SEO/cloud/site-generator/', runner: '/home/runner/work/site-generator/site-generator/' };
for (const f of obhod(REPO + '/core').filter((x) => x.endsWith('.astro'))) {
  const src = readFileSync(f, 'utf8');
  const r = relative(REPO, f).replace(/\\/g, '/');
  for (const [kak, koren] of Object.entries(KORNI)) kandidaty.push({ gde: 'ядро', kak, fajl: r, put: koren + r, h: scope(src, koren + r, koren + r) });
}

let izYadraWin = 0, izSayta = 0, neizv = 0;
const fajlySYadrom = new Set();
for (const [k, fajly] of [...cidy].sort()) {
  const s = kandidaty.filter((c) => c.h === k);
  if (!s.length) neizv += 1;
  else if (s[0].gde === 'сайт') izSayta += 1;
  else { izYadraWin += 1; for (const f of fajly) fajlySYadrom.add(f); }
  const runner = s.length && s[0].gde === 'ядро' ? kandidaty.find((c) => c.gde === 'ядро' && c.kak === 'runner' && c.fajl === s[0].fajl).h : null;
  console.log(`cid ${k} — ${s.length ? s.map((c) => `${c.gde} ${c.put}`).join(' | ') : 'не опознан'}${runner ? ` — на раннере был бы ${runner}` : ''} — файлов dist: ${fajly.size}`);
}
console.log(`ИТОГ: cid в dist ${cidy.size}: от пути внутри сайта ${izSayta}, от АБСОЛЮТНОГО пути Windows (ядро) ${izYadraWin}, не опознано ${neizv}; файлов dist с cid ядра ${fajlySYadrom.size}: ${[...fajlySYadrom].sort().join(', ')}`);
