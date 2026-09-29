// Кеш статики сейчас — для шага 6 листа сессии 23 (сессия 24, П111: «прочее — несколько запросов для доклада»):
//   node statika.mjs <otvety прогона 1 .json>
// Имя главной таблицы стилей — из записанного тела главной прогона 1 (на сервере — сборка раннера, хеш имени может
// отличаться от локальной). Два запроса GET без редиректов: /favicon.svg (иконка без хеша в имени) и эта таблица
// (/_astro/, хеш в имени). Печать — статус и заголовки целиком; признак кеша — Cache-Control, Expires, Age.
import { readFileSync } from 'node:fs';

const zapis = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const glavnaya = zapis.zapisi.find((z) => z.url === 'https://www.7thserpent.com/');
const html = Buffer.from(glavnaya.teloBase64, 'base64').toString('utf8');
const css = [...html.matchAll(/href="(\/_astro\/[^"]+\.css)"/g)].map((m) => m[1]);
console.log(`таблицы стилей главной на сервере: ${css.join(', ')}`);
for (const put of ['/favicon.svg', css.find((c) => /\/index\./.test(c)) ?? css[0]]) {
  const url = `https://www.7thserpent.com${put}`;
  const r = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'factory-check-live/2' } });
  const baity = Buffer.from(await r.arrayBuffer());
  console.log(`\n${new Date().toISOString()} ${r.status} ${url} — ${baity.length} байт`);
  for (const [k, v] of r.headers) console.log(`    ${k}: ${v}`);
}
