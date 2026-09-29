// Разбор записи регистратора: node razbor-otvetov.mjs <otvety-….json>
// По каждому ответу — адрес, статус, длина, заголовки; признаки кэша (Age, X-Cache*, Via, Cache-Status и т. п.);
// тела robots.txt — строками с видимыми CR, BOM и хвостом; сравнение тел robots.txt с параметром и без.
import { readFileSync } from 'node:fs';

const { zapisi, zapisano } = JSON.parse(readFileSync(process.argv[2], 'utf8'));
console.log(`записано ${zapisano}, ответов ${zapisi.length}`);
const KESH = /^(age|x-cache.*|via|cache-status|x-proxy-cache|x-nginx-cache|x-srcache.*|x-cache-status|surrogate-.*|cdn-.*|x-varnish|x-served-by)$/i;
const imena = new Map();
for (const z of zapisi) {
  if (z.oshibka) {
    console.log(`\n${z.vremya} ${z.url} — ОШИБКА ${z.oshibka}`);
    continue;
  }
  const tip = z.zagolovki.find(([k]) => k === 'content-type')?.[1] ?? '';
  console.log(`\n${z.vremya} ${z.status} ${z.url}  ${z.dlina} байт  ${tip}`);
  for (const [k, v] of z.zagolovki) {
    console.log(`    ${k}: ${v}`);
    if (!imena.has(k)) imena.set(k, new Set());
    imena.get(k).add(/^text\/html/.test(tip) ? 'html' : new URL(z.url).pathname.endsWith('.txt') ? 'txt' : new URL(z.url).pathname.endsWith('.xml') ? 'xml' : `прочее ${z.status}`);
  }
  const kesh = z.zagolovki.filter(([k]) => KESH.test(k));
  if (kesh.length) console.log(`    >>> признаки кэша: ${kesh.map(([k, v]) => `${k}: ${v}`).join('; ')}`);
}
console.log('\nимена заголовков → у каких ответов:');
for (const [k, s] of [...imena].sort()) console.log(`  ${k}: ${[...s].join(', ')}`);

const robots = zapisi.filter((z) => !z.oshibka && new URL(z.url).pathname === '/robots.txt');
for (const z of robots) {
  const b = Buffer.from(z.teloBase64, 'base64');
  const t = b.toString('utf8');
  console.log(`\n=== ${z.url} — ${b.length} байт, sha256 ${z.sha256}; BOM ${b[0] === 0xef ? 'да' : 'нет'}; CR ${[...b].filter((x) => x === 13).length}; конец ${JSON.stringify(t.slice(-3))}`);
  t.split('\n').forEach((s, i) => console.log(`${String(i + 1).padStart(3)}| ${JSON.stringify(s).slice(1, -1)}`));
}
if (robots.length === 2) {
  const [a, b] = robots.map((z) => Buffer.from(z.teloBase64, 'base64'));
  console.log(`\nтела с параметром и без: ${a.equals(b) ? 'побайтно равны' : 'различаются'}`);
}
