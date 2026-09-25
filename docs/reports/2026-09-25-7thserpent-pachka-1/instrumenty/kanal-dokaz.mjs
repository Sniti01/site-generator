// Откуда адрес призыва /media/ (П89 п. 5 «Как прочитано»): ссылки на YouTube в сыром HTML
// документов корпуса издателя — страницы магазина Rockstar (store.rockstargames.com) и страницы
// поддержки. Текстовый снимок корпуса адресов не хранит, только подписи ссылок («судью судят»,
// раунд 2, R2-FAKT-12), поэтому доказательство — по сырому gzip. Только чтение.
//   node kanal-dokaz.mjs
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
const root = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const manifest = readFileSync(join(root, 'input/corpus/manifest.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const adresa = ['http://store.rockstargames.com/game/buy-max-payne-3', 'https://support.rockstargames.com/articles/4WfWrkEJIqfJrPvUIaP1Qs/max-payne-3-pc-system-requirements'];
let naydeno = 0;
for (const u of adresa) {
  const r = [...manifest].reverse().find((x) => x.url === u && x.outcome === 'ok' && x.file);
  if (!r || !existsSync(join(root, 'input/corpus', r.file))) { console.log(`${u}: нет скачанного документа`); continue; }
  const h = gunzipSync(readFileSync(join(root, 'input/corpus', r.file))).toString('utf8');
  // Подпись ссылки идёт после SVG-значка в несколько тысяч знаков — окно до 8000.
  const teg = [...h.matchAll(/<a\b[^>]*href="(https?:\/\/(?:www\.)?youtube\.com\/[^"]*)"[^>]*>([\s\S]{0,8000}?)<\/a>/gi)].map((m) => `${m[1]} — подпись «${m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}»`);
  const vse = [...new Set(h.match(/https?:\/\/(?:www\.)?youtube\.com\/[^"'<>\s]+/gi) || [])];
  console.log(`${u} (снимок ${r.fetched_at ?? '—'}, файл ${r.file}):`);
  console.log(`  адреса youtube.com в разметке: ${vse.join(', ') || '—'}`);
  for (const t of teg) console.log(`  ссылка: ${t}`);
  naydeno += teg.filter((t) => /youtube\.com\/rockstargames — подпись «YouTube»/i.test(t)).length;
}
console.log(naydeno ? 'итог: https://www.youtube.com/rockstargames — ссылка <a> с подписью «YouTube» на странице магазина издателя' : 'итог: ссылки <a> на канал с подписью «YouTube» в разметке нет');
process.exit(naydeno ? 0 : 1);
