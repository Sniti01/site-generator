// Живой кеш указателя (только чтение): у какого файла ключ внутри, какой отпечаток у настоящей папки корпуса.
import { readdirSync, readFileSync, statSync, realpathSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const kesh = join(tmpdir(), 'site-generator-ukazatel');
for (const f of readdirSync(kesh)) {
  const p = join(kesh, f);
  let k = null;
  try {
    k = JSON.parse(gunzipSync(readFileSync(p)).toString('utf8'));
  } catch (e) {
    k = { oshibka: e.message };
  }
  console.log(f.slice(0, 20), statSync(p).size, statSync(p).mtime.toISOString(), 'ключ внутри:', typeof k.klyuch === 'string', 'pustyh:', k.pustyh);
}
const pref = (papka) => {
  const put = realpathSync(resolve(papka));
  return createHash('sha256').update(put.toLowerCase()).digest('hex').slice(0, 16);
};
for (const s of ['sites/7thserpent.com', 'sites/ac4bf-thewatch.com']) {
  const papka = join('D:/SEO/cloud/site-generator', s, 'input/corpus');
  if (existsSync(papka)) console.log(s, 'отпечаток настоящего пути:', pref(papka));
}
