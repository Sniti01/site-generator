// Живой образец хостера для проб check-live (сессия 24, П111 «Как прочитано» п. 5–6):
//   node obrazec-v-proby.mjs <otvety прогона 1 .json> <robots-para-1.json> <robots-para-2.json> <выход.json>
// Из записи прогона 1 — каждый ответ: время, статус, заголовки как их отдаёт fetch (имена строчными), длина и sha256
// тела; тела robots.txt — строкой UTF-8 (байт в байт: sha256 строки = sha256 записи, иначе отказ). Тела HTML и карт
// не кладутся: в пробах страница = сборка, карта = структура. Пары robots.txt — те же поля и тела.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const [progon1, para1, para2, vykhod] = process.argv.slice(2);
if (!vykhod) {
  console.error('node obrazec-v-proby.mjs <otvety.json> <robots-para-1.json> <robots-para-2.json> <выход.json>');
  process.exit(2);
}
const sha = (b) => createHash('sha256').update(b).digest('hex');
const zapis = JSON.parse(readFileSync(progon1, 'utf8'));
const metka = /live-check=(\d+)/.exec(zapis.zapisi.map((z) => z.url).join(' '))[1];
const robots = (url) => new URL(url).pathname === '/robots.txt';
const sTelom = (o) => {
  const baity = Buffer.from(o.teloBase64, 'base64');
  const telo = baity.toString('utf8');
  if (sha(Buffer.from(telo, 'utf8')) !== o.sha256) throw new Error(`${o.url}: тело не переживает UTF-8 байт в байт`);
  return telo;
};
const otvety = {};
for (const z of zapis.zapisi) {
  if (z.oshibka) throw new Error(`${z.url}: ошибка сети в прогоне 1 — ${z.oshibka}`);
  otvety[z.url] = { vremya: z.vremya, status: z.status, zagolovki: z.zagolovki, dlina: z.dlina, sha256: z.sha256, ...(robots(z.url) ? { telo: sTelom(z) } : {}) };
}
const para = (fajl) => {
  const p = JSON.parse(readFileSync(fajl, 'utf8'));
  const odin = (o) => ({ url: o.url, vremya: o.vremya, status: o.status, zagolovki: o.zagolovki, dlina: o.dlina, sha256: o.sha256, telo: sTelom(o) });
  return { para: p.para, metka: p.metka, s: odin(p.s), bez: odin(p.bez) };
};
const obrazec = {
  _: [
    'Живой образец хостера www.7thserpent.com — сессия 24 (П111), 2026-09-29, после первой выкладки (прогон #4, add241a).',
    'otvety — ответы прогона 1 live:check (регистратор ответов через node --import: docs/reports/2026-09-29-7thserpent-zhivoy/instrumenty/zapis-otvetov.mjs): время, статус, заголовки как их отдаёт fetch (имена строчными), длина и sha256 тела.',
    'Тела robots.txt — строкой UTF-8, байт в байт (sha256 строки = sha256 записи); тела HTML и карт не записаны: в пробах страница = сборка, карта = структура.',
    'robotsPary — две пары robots.txt с параметром ?live-check=<метка> и без, с промежутком (instrumenty/robots-para.mjs). Наш файл в телах — public/robots.txt сборки add241a.',
  ],
  metka,
  otvety,
  robotsPary: [para(para1), para(para2)],
};
writeFileSync(vykhod, JSON.stringify(obrazec, null, 2) + '\n');
console.log(`ответов ${Object.keys(otvety).length}, с телом ${Object.values(otvety).filter((o) => 'telo' in o).length}; пар ${obrazec.robotsPary.length}; метка прогона 1 ${metka}`);
