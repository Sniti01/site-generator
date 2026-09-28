// Малые файлы без внешних ресурсов (никаких запросов в сеть) — голова как в вариантах a3-1-varianty.mjs,
// тело — предложение документа blu-ray.com с байтом 0xE7 (ç в windows-1252). Для сверки с браузером:
// открыть file:/// и прочитать document.characterSet и текст <p>. Рядом — вердикт указателя по тем же байтам.
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ukazatelKorpusa, tekstDokumentaKorpusa } from 'file:///D:/SEO/cloud/site-generator/core/text/corpus.mjs';

const ZDES = dirname(fileURLToPath(import.meta.url));
const telo = Buffer.concat([
  Buffer.from('<body><p>the results often blow viewers away, as much as the weapons Max packs in every scene. Detail is never washed out, as faces, building fa', 'latin1'),
  Buffer.from([0xe7]),
  Buffer.from('ades, clothing, and all sorts of objects appear realistic.</p></body></html>', 'latin1'),
]);
const META = '<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1" />';
const GOLOVY = {
  b0: `<html><head>${META}<title>t</title></head>`,
  b1: `<html><head><!-- <meta charset="utf-8"> -->${META}<title>t</title></head>`,
  b2: '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-16" /><title>t</title></head>',
  b3: `<html><head><meta name="x" content="text/html; charset=utf-8">${META}<title>t</title></head>`,
};
const koren = join(ZDES, 'brauzer');
rmSync(koren, { recursive: true, force: true });
mkdirSync(koren, { recursive: true });
for (const [k, g] of Object.entries(GOLOVY)) {
  const b = Buffer.concat([Buffer.from(g, 'latin1'), telo]);
  writeFileSync(join(koren, `${k}.html`), b);
  const p = join(koren, `korpus-${k}`);
  mkdirSync(join(p, 'raw'), { recursive: true });
  writeFileSync(join(p, 'raw', 'd0.html.gz'), gzipSync(b));
  writeFileSync(join(p, 'manifest.jsonl'), JSON.stringify({ url: 'u', outcome: 'ok', file: 'raw/d0.html.gz', content_type: 'text/html' }) + '\n');
  const uk = ukazatelKorpusa(p, { kesh: null });
  const tekst = tekstDokumentaKorpusa({ fajl: join(p, 'raw', 'd0.html.gz'), charset: null });
  console.log(k, JSON.stringify({
    'не-ASCII': uk.nayti('as faces building façades clothing and all sorts', 'tochno') ? 'найдена' : 'НЕТ',
    ASCII: uk.nayti('the results often blow viewers away as much', 'tochno') ? 'найдена' : 'НЕТ',
    kusok: tekst.slice(tekst.indexOf('building') - 0, tekst.indexOf('building') + 20) || tekst.slice(60, 100),
  }));
}
