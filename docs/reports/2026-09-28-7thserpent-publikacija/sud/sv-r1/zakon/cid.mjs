// SV1-Z: хеш области видимости стилей (data-astro-cid-*) — от какого пути он посчитан?
// Если cid компонентов ядра (core/, вне корня сайта) совпадает с хешем АБСОЛЮТНОГО пути Windows,
// то на раннере (/home/runner/work/...) cid будет иным — HTML и CSS сборки CI не равны принятой побайтно.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

const REPO = 'D:/SEO/cloud/site-generator';
const SAYT = REPO + '/sites/7thserpent.com';
const DIST = SAYT + '/dist';

const obhod = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? obhod(join(d, n)) : [join(d, n)]));

// Хеш как у компилятора Astro (Go-версия: sha256 → base32 → первые 8 → нижний регистр).
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32(buf) {
  let bits = 0, val = 0, out = '';
  for (const b of buf) {
    val = (val << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}
const hash = (s) => base32(createHash('sha256').update(s).digest()).slice(0, 8).toLowerCase();

// Все cid в dist (HTML и CSS).
const cidy = new Map();
for (const f of obhod(DIST)) {
  if (!/\.(html|css)$/.test(f)) continue;
  const t = readFileSync(f, 'utf8');
  for (const m of t.matchAll(/data-astro-cid-([a-z0-9]{8})/g)) {
    const k = m[1];
    if (!cidy.has(k)) cidy.set(k, new Set());
    cidy.get(k).add(relative(DIST, f).replace(/\\/g, '/'));
  }
}

// Кандидаты: .astro сайта (путь от корня сайта) и ядра (абсолютный путь, оба регистра диска; и путь раннера).
const astroSayta = obhod(SAYT + '/src').filter((f) => f.endsWith('.astro')).map((f) => '/' + relative(SAYT, f).replace(/\\/g, '/'));
const astroYadra = obhod(REPO + '/core').filter((f) => f.endsWith('.astro')).map((f) => relative(REPO, f).replace(/\\/g, '/'));
const kandidaty = [];
for (const p of astroSayta) kandidaty.push({ gde: 'сайт', put: p, h: hash(p) });
for (const p of astroYadra) {
  for (const koren of ['D:/SEO/cloud/site-generator/', 'd:/SEO/cloud/site-generator/', '/home/runner/work/site-generator/site-generator/']) {
    kandidaty.push({ gde: 'ядро', put: koren + p, h: hash(koren + p) });
  }
}

let yadroWin = 0, yadroRunner = 0, sayt = 0, neizv = 0;
for (const [k, fajly] of [...cidy].sort()) {
  const k2 = kandidaty.filter((c) => c.h === k);
  const opis = k2.length ? k2.map((c) => `${c.gde} ${c.put}`).join(' | ') : 'не опознан';
  if (!k2.length) neizv += 1;
  else if (k2[0].gde === 'сайт') sayt += 1;
  else if (k2[0].put.startsWith('/home/')) yadroRunner += 1;
  else yadroWin += 1;
  console.log(`cid ${k} — ${opis} — файлов dist: ${fajly.size}`);
}
const vseFajly = new Set([...cidy.values()].flatMap((s) => [...s]));
const sYadrom = new Set([...cidy].filter(([k]) => kandidaty.some((c) => c.h === k && c.gde === 'ядро')).flatMap(([, s]) => [...s]));
console.log(`ИТОГ: cid всего ${cidy.size}; от путей сайта ${sayt}; от АБСОЛЮТНОГО пути Windows (ядро) ${yadroWin}; от пути раннера ${yadroRunner}; не опознано ${neizv}; файлов dist с cid ${vseFajly.size}, из них с cid ядра ${sYadrom.size}: ${[...sYadrom].sort().join(', ')}`);
