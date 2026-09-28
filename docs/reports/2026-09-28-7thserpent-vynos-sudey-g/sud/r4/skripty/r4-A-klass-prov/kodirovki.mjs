// R4-A-K-1…3 заново, своим корпусом: документ без метки в HTTP, не UTF-8, голова разной формы.
// Ожидание браузера — по WHATWG HTML «prescan a byte stream to determine its encoding» (комментарий пропускается;
// charset из content — только при http-equiv=content-type; UTF-16* из meta — UTF-8; x-user-defined — windows-1252;
// неизвестная метка — следующая meta).
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ukazatelKorpusa, tekstDokumentaKorpusa, dokumentyKorpusa } from 'file:///D:/SEO/cloud/site-generator/core/text/corpus.mjs';

const ZDES = dirname(fileURLToPath(import.meta.url));
const koren = join(ZDES, 'kodirovki');
rmSync(koren, { recursive: true, force: true });

// Тело — латиница с одним байтом выше 0x7F (0xE7 = ç в windows-1252 и ISO-8859-2; в windows-1251 — «з»).
const telo = (s) => Buffer.from(s, 'latin1');
const TELO = '<body><p>the results often blow viewers away, as much as faces, building fa\xe7ades, clothing, and all sorts of objects appear realistic.</p></body></html>';
const ASCII = 'the results often blow viewers away as much';
const NE_ASCII = 'as faces building façades clothing and all sorts';
const sluchai = [
  ['0 контроль: настоящая http-equiv ISO-8859-1', '<html><head><meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1"></head>', 'windows-1252'],
  ['K-1 закомментированная <meta charset=utf-8> перед настоящей', '<html><head><!-- <meta charset="utf-8"> --><meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1"></head>', 'windows-1252'],
  ['K-1б условный комментарий IE с meta utf-8', '<html><head><!--[if IE]><meta charset="utf-8"><![endif]--><meta charset="windows-1252"></head>', 'windows-1252'],
  ['K-2 http-equiv charset=utf-16', '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-16"></head>', 'UTF-8'],
  ['K-2б <meta charset=utf-16be>', '<html><head><meta charset="utf-16be"></head>', 'UTF-8'],
  ['K-2в <meta charset=x-user-defined>', '<html><head><meta charset="x-user-defined"></head>', 'windows-1252'],
  ['K-3 charset= в content без http-equiv', '<html><head><meta name="x" content="text/html; charset=utf-8"><meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1"></head>', 'windows-1252'],
  ['мой-1 неизвестная метка, затем windows-1251', '<html><head><meta charset="x-no-such"><meta charset="windows-1251"></head>', 'windows-1251'],
  ['мой-2 «<body» в комментарии до настоящей windows-1251', '<html><head><!-- <body> --><meta charset="windows-1251"></head>', 'windows-1251'],
];
const td = (enc) => new TextDecoder(enc);
for (const [imya, golova, brauzer] of sluchai) {
  const p = join(koren, String(sluchai.findIndex((x) => x[0] === imya)));
  mkdirSync(join(p, 'raw'), { recursive: true });
  const b = telo(golova + TELO);
  writeFileSync(join(p, 'raw', 'd0.html.gz'), gzipSync(b));
  writeFileSync(join(p, 'manifest.jsonl'), JSON.stringify({ url: 'u', outcome: 'ok', file: 'raw/d0.html.gz', content_type: 'text/html' }) + '\n');
  let uk;
  try {
    uk = ukazatelKorpusa(p, { kesh: null });
  } catch (e) {
    uk = { nayti: () => `ОТКАЗ: ${e.message.slice(0, 60)}` };
  }
  const t = tekstDokumentaKorpusa(dokumentyKorpusa(p)[0]);
  const tb = td(brauzer).decode(b);
  const kusok = (s) => (/fa.ades/.exec(s) ?? /results.{0,10}/.exec(s) ?? [s.slice(120, 150)])[0];
  console.log(
    JSON.stringify({
      sluchai: imya,
      tekstRavenBrauzeru: t === tb,
      ukazatel: { ASCII: uk.nayti(ASCII, 'tochno'), neASCII: uk.nayti(NE_ASCII, 'tochno'), kusok: kusok(t) },
      brauzer: { kodirovka: brauzer, kusok: kusok(tb), ASCII: tb.includes('the results often blow viewers away'), neASCII: tb.includes('façades') },
    })
  );
}
