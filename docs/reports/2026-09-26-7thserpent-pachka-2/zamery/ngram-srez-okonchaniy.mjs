// Независимая проверка n-грамм: без свёртки имён, строчные, апострофы сведены.
// node ngram.mjs <html страницы> <N>
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';

const root = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const [, , htmlPath, nArg] = process.argv;
const N = Number(nArg || 8);
const ent = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, k) => {
  if (k[0] === '#') return String.fromCodePoint(k[1] === 'x' || k[1] === 'X' ? parseInt(k.slice(2), 16) : Number(k.slice(1)));
  return { nbsp: ' ', amp: '&', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', mdash: '—', ndash: '–', quot: '"', apos: "'", hellip: '…' }[k.toLowerCase()] ?? ' ';
});
const txt = (h) => ent(h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' '));
const words = (s) => (s.toLowerCase().replace(/[’‘`]/g, "'").match(/[\p{L}\p{N}']+/gu) ?? []).map((w) => w.replace(/^'+|'+$/g, '')).filter(Boolean).map((w) => process.argv[4] === 'stem' ? w.replace(/'s$/, '').replace(/(ies)$/, 'y').replace(/([a-z]{3,})(es|s)$/, '$1') : w);

const h = readFileSync(htmlPath, 'utf8');
const main = h.slice(h.search(/<main\b/i), h.search(/<\/main>/i));
// по абзацам: блочные теги — перевод строки
const blocks = txt(main.replace(/<\/?(p|h1|h2|h3|h4|li|div|section|header|footer|nav|ul|ol|figcaption|dd|dt)\b[^>]*>/gi, '\n'))
  .split('\n').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);

const manifest = readFileSync(join(root, 'input/corpus/manifest.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const last = new Map();
for (const r of manifest) last.set(r.url, r);
const grams = new Map();
let nd = 0;
for (const r of last.values()) {
  if (r.outcome !== 'ok' || !r.file) continue;
  const p = join(root, 'input/corpus', r.file);
  if (!existsSync(p)) continue;
  nd++;
  const ws = words(txt(gunzipSync(readFileSync(p)).toString('utf8')));
  for (let i = 0; i + N <= ws.length; i++) {
    const g = ws.slice(i, i + N).join(' ');
    if (!grams.has(g)) grams.set(g, r.url);
  }
}
console.log(`документов ${nd}, N=${N}`);
let hits = 0;
for (const b of blocks) {
  const ws = words(b);
  const seen = new Set();
  for (let i = 0; i + N <= ws.length; i++) {
    const g = ws.slice(i, i + N).join(' ');
    if (grams.has(g) && !seen.has(g)) {
      seen.add(g);
      hits++;
      console.log(`«${g}» — ${grams.get(g)}\n   в строке: ${b.slice(0, 140)}`);
    }
  }
}
console.log(`совпадений: ${hits}`);
