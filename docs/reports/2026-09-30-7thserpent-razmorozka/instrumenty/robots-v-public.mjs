// public/robots.txt = файл сервера байт в байт (сессия 25, П113 «Как прочитано» п. 5): node robots-v-public.mjs
// Байты — из ../zamery/robots-para-1.json (ответ без параметра, base64). Все четыре ответа двух пар обязаны иметь один
// sha256 — замер владельца d1a2779c…8bb3; запись — прямой записью байтов в sites/7thserpent.com/public/robots.txt, затем
// чтение файла и сверка sha256 и длины. Код 1 — байты не те, запись не делается.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const zdes = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(zdes, '../../../..');
const CEL = join(REPO, 'sites/7thserpent.com/public/robots.txt');
const SHA = 'd1a2779c345a3e8466362d2adc8f783df61d70c735ba21108a15d6b7618d8bb3';
const sha = (b) => createHash('sha256').update(b).digest('hex');
const pary = [1, 2].map((n) => JSON.parse(readFileSync(join(zdes, '../zamery', `robots-para-${n}.json`), 'utf8')));
const otvety = pary.flatMap((p) => [p.s, p.bez]);
const baity = Buffer.from(pary[0].bez.teloBase64, 'base64');
const vse = otvety.every((o) => o.status === 200 && o.sha256 === SHA && sha(Buffer.from(o.teloBase64, 'base64')) === SHA);
if (!vse || sha(baity) !== SHA) {
  console.error('СТОП: ответы пар — не одно тело с sha256 замера владельца; public/robots.txt не тронут');
  process.exit(1);
}
writeFileSync(CEL, baity);
const zapisano = readFileSync(CEL);
console.log(`public/robots.txt: ${zapisano.length} байт, sha256 ${sha(zapisano)} — ${zapisano.equals(baity) && sha(zapisano) === SHA ? 'равен телу сервера побайтно' : 'НЕ РАВЕН'}; последний байт 0x${zapisano[zapisano.length - 1].toString(16)}; CR ${zapisano.includes(13) ? 'есть' : 'нет'}`);
