// Пара запросов robots.txt (сессия 25, П113 «Как прочитано» п. 4): node robots-para.mjs <номер пары>
// Копия instrumenty/robots-para.mjs сессии 24 (docs/reports/2026-09-29-7thserpent-zhivoy/): форма запросов проверок 3 и 4
// check-live — GET https://www.7thserpent.com/robots.txt?live-check=<метка> и GET …/robots.txt, без редиректов,
// user-agent инструмента, таймаут 15 с. Запись — байты тела (base64 и строкой), заголовки целиком, время —
// в ../zamery/robots-para-<номер>.json. Печать — сверка тел внутри пары (побайтно и после CR и BOM) и с замером владельца
// 2026-09-30 06:35 UTC (500 байт, sha256 d1a2779c…8bb3, блока хостера нет): длина, начало и конец sha256, CR, BOM, перевод
// строки в конце, метки «Managed content», закрытые роботы (Disallow: / их группы) против перечня владельца, Allow: /
// у Googlebot, строка Sitemap; тело — целиком.
import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const nomer = process.argv[2];
if (!/^[12]$/.test(nomer ?? '')) {
  console.error('node robots-para.mjs <1|2>');
  process.exit(2);
}
const VLADELEC = { dlina: 500, nachalo: 'd1a2779c', konec: '8bb3' };
const ZAKRYTY = ['AhrefsBot', 'MJ12bot', 'DataForSeoBot', 'barkrowler', 'Bytespider', 'meta-externalagent', 'Baiduspider', 'meta-webindexer', 'AhrefsSiteAudit', 'SemrushBot', 'serpstatbot'];
const SITEMAP = 'Sitemap: https://www.7thserpent.com/sitemap-index.xml';
const metka = Date.now();
const zapros = async (url) => {
  const vremya = new Date().toISOString();
  const r = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'factory-check-live/2' } });
  const baity = Buffer.from(await r.arrayBuffer());
  return { url, vremya, status: r.status, zagolovki: [...r.headers], dlina: baity.length, sha256: createHash('sha256').update(baity).digest('hex'), telo: baity.toString('utf8'), teloBase64: baity.toString('base64') };
};
const s = await zapros(`https://www.7thserpent.com/robots.txt?live-check=${metka}`);
const bez = await zapros('https://www.7thserpent.com/robots.txt');
const ZAMERY = join(dirname(fileURLToPath(import.meta.url)), '../zamery');
mkdirSync(ZAMERY, { recursive: true });
writeFileSync(join(ZAMERY, `robots-para-${nomer}.json`), JSON.stringify({ para: Number(nomer), metka: String(metka), s, bez }, null, 2) + '\n');

/** Группы файла: подряд идущие User-agent и правила до следующего User-agent после правила. */
function gruppy(telo) {
  const out = [];
  let tek = null;
  let pravilo = false;
  for (const s0 of telo.split('\n')) {
    const st = s0.replace(/#.*$/, '').trim();
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(st);
    if (!m) continue;
    const [k, v] = [m[1].toLowerCase(), m[2].trim()];
    if (k === 'user-agent') {
      if (!tek || pravilo) {
        tek = { agenty: [], pravila: [] };
        out.push(tek);
        pravilo = false;
      }
      tek.agenty.push(v);
    } else if (k === 'allow' || k === 'disallow') {
      pravilo = true;
      if (tek) tek.pravila.push(`${k}:${v}`);
    }
  }
  return out;
}
const norm = (t) => t.replace(/\r\n?/g, '\n').replace(/^﻿/, '');
for (const [imya, o] of [['с параметром', s], ['без', bez]]) {
  const b = Buffer.from(o.teloBase64, 'base64');
  const gr = gruppy(o.telo);
  const zakryty = gr.filter((g) => g.pravila.includes('disallow:/')).flatMap((g) => g.agenty);
  const google = gr.filter((g) => g.agenty.some((a) => a.toLowerCase() === 'googlebot'));
  console.log(`пара ${nomer}, ${imya}: ${o.vremya} ${o.status} ${o.dlina} байт sha256 ${o.sha256}`);
  console.log(`  заголовки: ${o.zagolovki.map(([k, v]) => `${k}: ${v}`).join(' | ')}`);
  console.log(`  против замера владельца: длина ${o.dlina === VLADELEC.dlina ? 'та же' : 'ИНАЯ'}, sha256 ${o.sha256.startsWith(VLADELEC.nachalo) && o.sha256.endsWith(VLADELEC.konec) ? 'тот же (начало и конец)' : 'ИНОЙ'}`);
  console.log(`  CR ${b.includes(13) ? 'ЕСТЬ' : 'нет'}; BOM ${b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf ? 'ЕСТЬ' : 'нет'}; перевод строки в конце ${b[b.length - 1] === 10 ? 'есть' : 'нет'}; не-ASCII байтов ${[...b].filter((x) => x > 0x7f).length}; «Managed content» ${/Managed\s+content/i.test(o.telo) ? 'ЕСТЬ' : 'нет'}`);
  console.log(`  закрыты (Disallow: /): ${zakryty.join(', ') || '—'}; перечень владельца — ${ZAKRYTY.every((x) => zakryty.includes(x)) && zakryty.every((x) => ZAKRYTY.includes(x)) ? 'совпадает' : 'НЕ СОВПАДАЕТ'}`);
  console.log(`  Googlebot: ${google.map((g) => g.pravila.join(' ')).join(' / ') || '—'}; строка Sitemap ${norm(o.telo).split('\n').some((x) => x.trim() === SITEMAP) ? 'есть' : 'НЕТ'}; групп ${gr.length}`);
}
console.log(`тела внутри пары: побайтно ${s.sha256 === bez.sha256 ? 'равны' : 'различаются'}; после CR и BOM ${norm(s.telo) === norm(bez.telo) ? 'равны' : 'различаются'}`);
console.log(`тело (без параметра), как есть:\n${bez.telo}\n[конец тела]`);
