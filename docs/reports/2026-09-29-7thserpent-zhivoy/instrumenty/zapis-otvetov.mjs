// Регистратор ответов прогона live:check (сессия 24, П111 «Как прочитано» п. 4). Подключается к процессу:
//   node --import file:///<путь к этому файлу> tools/check-live.mjs
// Код инструмента не меняется: обёрнут только globalThis.fetch, запросы те же, ответы отдаются инструменту как есть.
// Каждый ответ — адрес, время, статус, заголовки (как их отдаёт fetch; Set-Cookie — списком), длина и sha256 тела,
// тело — base64 (для разбора красных строк без новых запросов); ошибка сети — её код. Запись — при выходе процесса,
// в файл рядом с этим, имя — с меткой времени.
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const FAJL = join(dirname(fileURLToPath(import.meta.url)), `otvety-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
const zapisi = [];
const iskhodnyy = globalThis.fetch;

globalThis.fetch = async (vkhod, opcii) => {
  const url = typeof vkhod === 'string' ? vkhod : (vkhod?.url ?? String(vkhod));
  const vremya = new Date().toISOString();
  let r;
  try {
    r = await iskhodnyy(vkhod, opcii);
  } catch (e) {
    zapisi.push({ url, vremya, oshibka: String(e.cause?.code ?? e.name) });
    throw e;
  }
  const baity = Buffer.from(await r.clone().arrayBuffer());
  zapisi.push({
    url,
    vremya,
    status: r.status,
    zagolovki: [...r.headers],
    setCookie: r.headers.getSetCookie?.() ?? [],
    dlina: baity.length,
    sha256: createHash('sha256').update(baity).digest('hex'),
    teloBase64: baity.toString('base64'),
  });
  return r;
};

process.on('exit', () => {
  writeFileSync(FAJL, JSON.stringify({ zapisano: new Date().toISOString(), zapisey: zapisi.length, zapisi }, null, 2) + '\n');
});
