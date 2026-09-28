// A3-4: уборка «прежнего формата». Файлы, записанные до раунда 3 (имя `<отпечаток>-<ключ>.json.gz`, ключа внутри
// нет — A3-2 их уже никогда не примет), под отпечатком копии сайта (раунд 2 брал отпечаток по пути ссылки)
// переживают запись и уборку кодом раунда 3: мёртвый груз по 8,7 МБ, ровно те «плодящиеся» файлы, о которых A3-4.
import { mkdirSync, writeFileSync, readdirSync, rmSync, symlinkSync, readFileSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ukazatelKorpusa } from 'file:///D:/SEO/cloud/site-generator/core/text/corpus.mjs';

const ZDES = dirname(fileURLToPath(import.meta.url));
const koren = join(ZDES, 'a3-4');
rmSync(koren, { recursive: true, force: true });
const p = join(koren, 'korpus');
mkdirSync(join(p, 'raw'), { recursive: true });
writeFileSync(join(p, 'raw', 'd0.html.gz'), gzipSync('<p>one two three four five six seven eight</p>'));
writeFileSync(join(p, 'manifest.jsonl'), JSON.stringify({ url: 'u', outcome: 'ok', file: 'raw/d0.html.gz' }) + '\n');
const kesh = join(koren, 'kesh');
mkdirSync(kesh);

// 1) Первая запись кодом раунда 3 — чтобы знать ключ и содержимое.
ukazatelKorpusa(p, { kesh });
const svoy = readdirSync(kesh).find((f) => f.endsWith('.json.gz'));
const k = JSON.parse(gunzipSync(readFileSync(join(kesh, svoy))).toString('utf8'));
// 2) Файл, какой оставил бы код раунда 2 для копии сайта со ссылкой на этот корпус: отпечаток — по пути ссылки
//    (resolve(...).toLowerCase(), без realpath), ключа внутри нет.
const kopiya = join(koren, 'kopiya');
mkdirSync(kopiya);
symlinkSync(p, join(kopiya, 'corpus'), 'junction');
const prefiksR2 = createHash('sha256').update(resolve(join(kopiya, 'corpus')).toLowerCase()).digest('hex').slice(0, 16);
const { klyuch, ...bezKlyucha } = k;
const sirota = `${prefiksR2}-${'06f3c109dc3dad93fcf28f1c3bde5b8287b33b031b1a92a2843d6b185ae94637'}.json.gz`;
writeFileSync(join(kesh, sirota), gzipSync(JSON.stringify(bezKlyucha)));
rmSync(kopiya, { recursive: true, force: true }); // копия снята, как снимает её kopiya.mjs
// 3) Новая запись кодом раунда 3 (другие имена — другой ключ, запись и уборка идут).
const u = ukazatelKorpusa(p, { imena: ['x y'], kesh });
console.log('oshibkaKesha:', u.oshibkaKesha);
console.log('после записи и уборки раунда 3:', readdirSync(kesh));
console.log('сирота прежнего формата (без ключа внутри) осталась:', readdirSync(kesh).includes(sirota));
