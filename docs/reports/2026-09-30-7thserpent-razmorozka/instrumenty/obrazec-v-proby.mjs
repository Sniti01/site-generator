// Новый живой образец robots.txt для проб check-live (сессия 25, П113 «Как прочитано» п. 6):
//   node obrazec-v-proby.mjs <robots-para-1.json> <robots-para-2.json> <выход.json>
// Форма — obrazec-v-proby.mjs сессии 24 без ответов прогона live:check (новый образец — две пары запросов robots.txt):
// каждый ответ — адрес, время, статус, заголовки как их отдаёт fetch (имена строчными), длина и sha256 тела, тело —
// строкой UTF-8 байт в байт (sha256 строки = sha256 записи, иначе отказ).
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const [para1, para2, vykhod] = process.argv.slice(2);
if (!vykhod) {
  console.error('node obrazec-v-proby.mjs <robots-para-1.json> <robots-para-2.json> <выход.json>');
  process.exit(2);
}
const sha = (b) => createHash('sha256').update(b).digest('hex');
const sTelom = (o) => {
  const baity = Buffer.from(o.teloBase64, 'base64');
  const telo = baity.toString('utf8');
  if (sha(Buffer.from(telo, 'utf8')) !== o.sha256 || sha(baity) !== o.sha256) throw new Error(`${o.url}: тело не переживает UTF-8 байт в байт`);
  return telo;
};
const para = (fajl) => {
  const p = JSON.parse(readFileSync(fajl, 'utf8'));
  const odin = (o) => ({ url: o.url, vremya: o.vremya, status: o.status, zagolovki: o.zagolovki, dlina: o.dlina, sha256: o.sha256, telo: sTelom(o) });
  return { para: p.para, metka: p.metka, s: odin(p.s), bez: odin(p.bez) };
};
const obrazec = {
  _: [
    'Живой образец robots.txt www.7thserpent.com — сессия 25 (П113), 2026-09-30: блок хостера отключён в панели, на сервере — файл владельца.',
    'robotsPary — две пары robots.txt с параметром ?live-check=<метка> и без, с промежутком (docs/reports/2026-09-30-7thserpent-razmorozka/instrumenty/robots-para.mjs): время, статус, заголовки как их отдаёт fetch (имена строчными), длина и sha256 тела.',
    'Тела — строкой UTF-8, байт в байт (sha256 строки = sha256 записи). Наш файл в телах — public/robots.txt с сессии 25 (= файл сервера байт в байт).',
  ],
  robotsPary: [para(para1), para(para2)],
};
writeFileSync(vykhod, JSON.stringify(obrazec, null, 2) + '\n');
console.log(`пар ${obrazec.robotsPary.length}; тела: ${obrazec.robotsPary.flatMap((p) => [p.s, p.bez]).map((o) => `${o.dlina} байт ${o.sha256.slice(0, 8)}…${o.sha256.slice(-4)}`).join(', ')}`);
