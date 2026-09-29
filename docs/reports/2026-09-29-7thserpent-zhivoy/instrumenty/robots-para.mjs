// Пара запросов robots.txt хостера (сессия 24, П111 «Как прочитано» п. 5): node robots-para.mjs <номер пары>
// Форма запросов — как у проверок 3 и 4 check-live: GET https://www.7thserpent.com/robots.txt?live-check=<метка>
// и GET …/robots.txt, без редиректов, user-agent инструмента, таймаут 15 с. Запись — байты тела (base64 и строкой),
// заголовки целиком, время — в robots-para-<номер>.json рядом с этим файлом; печать — сверка тел внутри пары
// (побайтно и после CR и BOM, как проверка 4) и с телом прогона 1 live:check (sha256).
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const nomer = process.argv[2];
if (!/^[12]$/.test(nomer ?? '')) {
  console.error('node robots-para.mjs <1|2>');
  process.exit(2);
}
const PROGON_1 = 'c93c53ed70d9c4664eba58ca21d946a6a7a22e6e81f0d433fc06ecaefaf01295';
const metka = Date.now();
const zapros = async (url) => {
  const vremya = new Date().toISOString();
  const r = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'factory-check-live/2' } });
  const baity = Buffer.from(await r.arrayBuffer());
  return { url, vremya, status: r.status, zagolovki: [...r.headers], dlina: baity.length, sha256: createHash('sha256').update(baity).digest('hex'), telo: baity.toString('utf8'), teloBase64: baity.toString('base64') };
};
const s = await zapros(`https://www.7thserpent.com/robots.txt?live-check=${metka}`);
const bez = await zapros('https://www.7thserpent.com/robots.txt');
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), `robots-para-${nomer}.json`), JSON.stringify({ para: Number(nomer), metka: String(metka), s, bez }, null, 2) + '\n');
const norm = (t) => t.replace(/\r\n?/g, '\n').replace(/^﻿/, '');
for (const [imya, o] of [['с параметром', s], ['без', bez]]) console.log(`пара ${nomer}, ${imya}: ${o.vremya} ${o.status} ${o.dlina} байт sha256 ${o.sha256}${o.sha256 === PROGON_1 ? ' = тело прогона 1' : ' ≠ тело прогона 1'}; ${o.zagolovki.map(([k, v]) => `${k}: ${v}`).join(' | ')}`);
console.log(`тела внутри пары: побайтно ${s.sha256 === bez.sha256 ? 'равны' : 'различаются'}; после CR и BOM ${norm(s.telo) === norm(bez.telo) ? 'равны' : 'различаются'}`);
