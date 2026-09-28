// R4-A-K-4 заново: файл формата раунда 2 (<отпечаток>-<ключ>.json.gz, без ключа внутри) под отпечатком пути
// ссылки, которой уже нет, — убирает ли его запись кодом раунда 3. Контроль: такой же файл под своим отпечатком.
import { mkdirSync, writeFileSync, rmSync, readdirSync, existsSync, symlinkSync, unlinkSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ukazatelKorpusa } from 'file:///D:/SEO/cloud/site-generator/core/text/corpus.mjs';

const ZDES = dirname(fileURLToPath(import.meta.url));
const koren = join(ZDES, 'uborka-r2');
rmSync(koren, { recursive: true, force: true });
const p = join(koren, 'korpus');
mkdirSync(join(p, 'raw'), { recursive: true });
writeFileSync(join(p, 'raw', 'd0.html.gz'), gzipSync('<p>one two three four five six seven eight</p>'));
writeFileSync(join(p, 'manifest.jsonl'), JSON.stringify({ url: 'u', outcome: 'ok', file: 'raw/d0.html.gz' }) + '\n');
const kesh = join(koren, 'kesh');
mkdirSync(kesh);
// Раунд 2: отпечаток — sha256(resolve(путь).toLowerCase()), путь ссылки копии не разворачивался.
const ssylka = join(koren, 'kopiya', 'corpus');
mkdirSync(dirname(ssylka), { recursive: true });
symlinkSync(p, ssylka, 'junction');
const pr2 = (x) => createHash('sha256').update(resolve(x).toLowerCase()).digest('hex').slice(0, 16);
const soderzhimoeR2 = gzipSync(JSON.stringify({ pustyh: 0, tochno: { h: 'AAAAAAAA8D8=', d: 'AAAAAA==' }, srez: { h: 'AAAAAAAA8D8=', d: 'AAAAAA==' } }));
const chuzhoy = `${pr2(ssylka)}-${'b'.repeat(64)}.json.gz`;
const svoy = `${pr2(p)}-${'c'.repeat(64)}.json.gz`;
writeFileSync(join(kesh, chuzhoy), soderzhimoeR2);
writeFileSync(join(kesh, svoy), soderzhimoeR2);
unlinkSync(ssylka); // копия снята, как после proby
const u = ukazatelKorpusa(p, { kesh });
console.log(JSON.stringify({ izKesha: u.izKesha, oshibkaKesha: u.oshibkaKesha }));
console.log('файл раунда 2 под отпечатком снятой ссылки остался:', existsSync(join(kesh, chuzhoy)));
console.log('файл раунда 2 под своим отпечатком (контроль) остался:', existsSync(join(kesh, svoy)));
console.log('в кеше:', readdirSync(kesh).map((f) => f.slice(0, 24)));
