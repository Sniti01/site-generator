// A3-1: класс «документ без HTTP-метки читается не в той кодировке, что у браузера».
// Настоящий документ корпуса (blu-ray.com, windows-1252 без метки в HTTP, <meta http-equiv> ISO-8859-1)
// с порчей головы; для каждого варианта — отдельный мини-корпус в своей папке, указатель без кеша.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ukazatelKorpusa } from 'file:///D:/SEO/cloud/site-generator/core/text/corpus.mjs';

const ZDES = dirname(fileURLToPath(import.meta.url));
const ISH = 'D:/SEO/cloud/site-generator/sites/7thserpent.com/input/corpus/raw/www.blu-ray.com/a91a22b629fbcb11.html.gz';
const bajty = gunzipSync(readFileSync(ISH));
const latin = bajty.toString('latin1');
const META = '<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1" />';
if (!latin.includes(META)) throw new Error('meta документа не найдена');
const zamena = (iz, v) => Buffer.from(latin.replace(iz, v), 'latin1');
const posleHead = (vstavka) => Buffer.from(latin.replace(/<head[^>]*>/i, (m) => m + vstavka), 'latin1');

const VARIANTY = {
  '0 контроль (документ как есть)': bajty,
  '1 закомментированная <meta charset=utf-8> перед настоящей': posleHead('<!-- <meta charset="utf-8"> -->'),
  '2 meta charset=utf-16 (браузер: UTF-16 из meta — UTF-8)': zamena(META, '<meta http-equiv="Content-Type" content="text/html; charset=utf-16" />'),
  '3 content с charset=utf-8 без http-equiv перед настоящей (браузер её не слушает)': posleHead('<meta name="x" content="text/html; charset=utf-8">'),
  '4 неизвестная метка перед настоящей (браузер идёт к следующей meta)': posleHead('<meta charset="latin-1">'),
};
const FRAZY = { 'не-ASCII': 'as faces building façades clothing and all sorts', ASCII: 'the results often blow viewers away as much' };

const koren = join(ZDES, 'korpusa-a3-1');
rmSync(koren, { recursive: true, force: true });
Object.entries(VARIANTY).forEach(([imya, b], i) => {
  const p = join(koren, `v${i}`);
  mkdirSync(join(p, 'raw'), { recursive: true });
  writeFileSync(join(p, 'raw', 'd0.html.gz'), gzipSync(b));
  writeFileSync(join(p, 'manifest.jsonl'), JSON.stringify({ url: 'https://www.blu-ray.com/movies/Max-Payne-Blu-ray/3159/', outcome: 'ok', file: 'raw/d0.html.gz', content_type: 'text/html' }) + '\n');
  // Копия для браузера — сырые байты, открыть file:///
  writeFileSync(join(koren, `v${i}.html`), b);
  let itog;
  try {
    const uk = ukazatelKorpusa(p, { kesh: null });
    itog = Object.fromEntries(Object.entries(FRAZY).map(([k, g]) => [k, uk.nayti(g, 'tochno') ? 'найдена' : 'НЕТ']));
    itog.pustyh = uk.pustyh;
  } catch (e) {
    itog = { oshibka: e.constructor.name + ': ' + e.message.slice(0, 120) };
  }
  console.log(imya, '→', JSON.stringify(itog));
});
