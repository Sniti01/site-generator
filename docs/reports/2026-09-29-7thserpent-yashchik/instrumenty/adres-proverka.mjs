// Адрес ящика на /privacy/ — правилом check-live (видимый текст <body>, без <title>, <noscript>, hidden, комментариев):
// сборка dist/ подаётся как ответы живого сайта, печатаются строки проверок /privacy/.
// node adres-proverka.mjs <папка сайта>
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const sayt = process.argv[2];
const { proverit, sborkaIzDist } = await import(pathToFileURL(join(sayt, 'tools/check-live.mjs')).href);
const struktura = JSON.parse(readFileSync(join(sayt, 'structure/structure.json'), 'utf8'));
const nashRobots = readFileSync(join(sayt, 'public/robots.txt'), 'utf8');
const dist = join(sayt, 'dist');
const host = 'www.7thserpent.com';
const poluchit = async (url) => {
  const u = new URL(url);
  const f = join(dist, decodeURIComponent(u.pathname).replace(/^\/+/, ''), u.pathname.endsWith('/') ? 'index.html' : '');
  if (u.protocol === 'https:' && u.host === host && existsSync(f)) {
    const baity = readFileSync(f);
    return { status: 200, location: '', zagolovok: (i) => ({ 'content-type': 'text/html', 'cache-control': 'public, max-age=0, must-revalidate' })[i.toLowerCase()] ?? '', telo: baity.toString('utf8'), baity };
  }
  return { status: 404, location: '', zagolovok: () => '', telo: '' };
};
const { proverki } = await proverit({ poluchit, host, struktura, nashRobots, metka: 'lokalno', sborka: sborkaIzDist(dist) });
for (const c of proverki.filter((x) => x.imya.startsWith('/privacy/'))) console.log(`${c.ok ? 'ok   ' : 'ПЛОХО'} ${c.imya}: ${c.fakt} — ${c.otkuda}`);
