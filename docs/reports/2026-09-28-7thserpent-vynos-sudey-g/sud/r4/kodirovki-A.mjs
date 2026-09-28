// Случаи проверяющего R4-A-K-1…3 (kodirovki.mjs) и свои — после правки: текст указателя равен тексту браузера
// (ожидание — по WHATWG prescan). Корпуса — в своей папке скретчпада.
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tekstDokumentaKorpusa, dokumentyKorpusa } from 'file:///D:/SEO/cloud/site-generator/core/text/corpus.mjs';

const koren = join(dirname(fileURLToPath(import.meta.url)), 'kodirovki-A');
rmSync(koren, { recursive: true, force: true });
const TELO = '<body><p>the results often blow viewers away, as much as faces, building fa\xe7ades, clothing.</p></body></html>';
const sluchai = [
  ['контроль http-equiv ISO-8859-1', '<html><head><meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1"></head>', 'windows-1252'],
  ['K-1 комментарий', '<html><head><!-- <meta charset="utf-8"> --><meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1"></head>', 'windows-1252'],
  ['K-1б условный IE', '<html><head><!--[if IE]><meta charset="utf-8"><![endif]--><meta charset="windows-1252"></head>', 'windows-1252'],
  ['K-2 http-equiv utf-16', '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-16"></head>', 'UTF-8'],
  ['K-2б utf-16be', '<html><head><meta charset="utf-16be"></head>', 'UTF-8'],
  ['K-2в x-user-defined', '<html><head><meta charset="x-user-defined"></head>', 'windows-1252'],
  ['K-3 content без http-equiv', '<html><head><meta name="x" content="text/html; charset=utf-8"><meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1"></head>', 'windows-1252'],
  ['P-4 неизвестная, затем 1251', '<html><head><meta charset="x-no-such"><meta charset="windows-1251"></head>', 'windows-1251'],
  ['P-4 <body> в комментарии', '<html><head><!-- <body> --><meta charset="windows-1251"></head>', 'windows-1251'],
  ['http-equiv после content', '<html><head><meta content="text/html; charset=windows-1251" http-equiv="content-type"></head>', 'windows-1251'],
  ['charset без кавычек, верхний регистр', '<HTML><HEAD><META CHARSET=WINDOWS-1251></HEAD>', 'windows-1251'],
  ['content в одинарных, charset в кавычках', `<html><head><meta http-equiv='Content-Type' content='text/html; charset="iso-8859-2"'></head>`, 'iso-8859-2'],
  ['повтор атрибута: первый charset решает', '<html><head><meta charset="windows-1251" charset="utf-8"></head>', 'windows-1251'],
  ['meta в теле (браузер её слышит; указатель — нет, окно до <body> — предел)', '<html><head></head><body><meta charset="windows-1251">', 'windows-1251'],
  ['meta после <title> и <link>', '<html><head><title>x > y</title><link rel="a" href="b"><meta charset="windows-1251"></head>', 'windows-1251'],
  ['charset=  = с пробелами', '<html><head><meta http-equiv="content-type" content="text/html; charset = windows-1251"></head>', 'windows-1251'],
  ['meta/ со слешем', '<html><head><meta/charset="windows-1251"></head>', 'windows-1251'],
  ['<metax> — не meta', '<html><head><metax charset="windows-1251"></head>', 'windows-1252'],
];
let plohih = 0;
for (const [i, [imya, golova, brauzer]] of sluchai.entries()) {
  const p = join(koren, String(i));
  mkdirSync(join(p, 'raw'), { recursive: true });
  const b = Buffer.from(golova + TELO, 'latin1');
  writeFileSync(join(p, 'raw', 'd0.html.gz'), gzipSync(b));
  writeFileSync(join(p, 'manifest.jsonl'), JSON.stringify({ url: 'u', outcome: 'ok', file: 'raw/d0.html.gz', content_type: 'text/html' }) + '\n');
  const ravno = tekstDokumentaKorpusa(dokumentyKorpusa(p)[0]) === new TextDecoder(brauzer).decode(b);
  if (!ravno) plohih++;
  console.log(ravno ? 'равно' : 'ИНАЧЕ', imya, '—', brauzer);
}
console.log('не равно браузеру:', plohih, 'из', sluchai.length);
