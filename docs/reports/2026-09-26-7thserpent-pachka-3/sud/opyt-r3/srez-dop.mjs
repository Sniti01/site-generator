// Опыт раунда 3: чего срез окончаний (ngram-srez-okonchaniy.mjs) не видит — title, meta description,
// og:title, og:description и alt; и сколько слов он берёт из <main> (отказа на пустом извлечении у него нет).
// Логика слов и n-грамм — дословно из ngram-srez-okonchaniy.mjs (stem), корпус тот же. Только чтение.
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';

const root = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const dist = join(root, 'dist');
const N = 8;
const ent = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, k) => {
  if (k[0] === '#') return String.fromCodePoint(k[1] === 'x' || k[1] === 'X' ? parseInt(k.slice(2), 16) : Number(k.slice(1)));
  return { nbsp: ' ', amp: '&', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', mdash: '—', ndash: '–', quot: '"', apos: "'", hellip: '…' }[k.toLowerCase()] ?? ' ';
});
const txt = (h) => ent(h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' '));
const words = (s) => (s.toLowerCase().replace(/[’‘`]/g, "'").match(/[\p{L}\p{N}']+/gu) ?? []).map((w) => w.replace(/^'+|'+$/g, '')).filter(Boolean).map((w) => w.replace(/'s$/, '').replace(/(ies)$/, 'y').replace(/([a-z]{3,})(es|s)$/, '$1'));

const manifest = readFileSync(join(root, 'input/corpus/manifest.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const last = new Map();
for (const r of manifest) last.set(r.url, r);
const grams = new Map();
for (const r of last.values()) {
  if (r.outcome !== 'ok' || !r.file) continue;
  const p = join(root, 'input/corpus', r.file);
  if (!existsSync(p)) continue;
  const ws = words(txt(gunzipSync(readFileSync(p)).toString('utf8')));
  for (let i = 0; i + N <= ws.length; i++) { const g = ws.slice(i, i + N).join(' '); if (!grams.has(g)) grams.set(g, r.url); }
}
const atr = (tag, imya) => (tag.match(new RegExp(`\\s${imya}="([^"]*)"`, 'i')) || [])[1];
let vsego = 0;
for (const u of ['pc', 'games-like-max-payne', 'media', 'max-payne-1', 'max-payne-2', 'max-payne-3', 'remake', 'story', 'voice-and-face', 'cheats', 'mods']) {
  const h = readFileSync(join(dist, u, 'index.html'), 'utf8');
  const main = h.slice(h.search(/<main\b/i), h.search(/<\/main>/i));
  const slovMain = words(txt(main)).length;
  const golova = h.slice(0, h.search(/<\/head>/i));
  const dop = [
    ['title', (golova.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || ''],
    ...[...golova.matchAll(/<meta\b[^>]*>/gi)].filter((m) => /\s(?:name|property)="(?:description|og:title|og:description)"/i.test(m[0])).map((m) => [m[0].match(/(?:name|property)="([^"]+)"/)[1], atr(m[0], 'content') || '']),
    ...[...main.matchAll(/<img\b[^>]*>/gi)].map((m) => ['alt', atr(m[0], 'alt') || '']),
  ];
  const nakhodki = [];
  for (const [chto, s] of dop) {
    const ws = words(ent(s));
    for (let i = 0; i + N <= ws.length; i++) { const g = ws.slice(i, i + N).join(' '); if (grams.has(g)) nakhodki.push(`${chto}: «${g}» — ${grams.get(g)}`); }
  }
  vsego += nakhodki.length;
  console.log(`/${u}/: слов <main> у среза ${slovMain}; строк вне <main> (title, meta, og, alt) ${dop.length}; совпадений в них ${nakhodki.length}`);
  for (const n of nakhodki) console.log('   ' + n);
}
console.log('итого совпадений вне <main>: ' + vsego);
