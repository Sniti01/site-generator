// Регистратор ответов прогона live:check — копия instrumenty/zapis-otvetov.mjs сессии 24 (docs/reports/2026-09-29-7thserpent-zhivoy/);
// отличие — запись в ../zamery/otvety-progon-<номер>.json этой сессии (номер — переменная ZAPIS_NOMER, по умолчанию 1),
// а не рядом с файлом: материалы сессии 24 не меняются. Подключается к процессу:
//   node --import file:///<путь к этому файлу> tools/check-live.mjs
// Код инструмента не меняется: обёрнут только globalThis.fetch, запросы те же, ответы отдаются инструменту как есть.
// Каждый ответ — адрес, время, статус, заголовки (как их отдаёт fetch; Set-Cookie — списком), длина и sha256 тела,
// тело — base64 (для разбора красных строк без новых запросов); ошибка сети — её код. Запись — при выходе процесса.
import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ZAMERY = join(dirname(fileURLToPath(import.meta.url)), '../zamery');
const FAJL = join(ZAMERY, `otvety-progon-${process.env.ZAPIS_NOMER ?? '1'}.json`);
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
  mkdirSync(ZAMERY, { recursive: true });
  writeFileSync(FAJL, JSON.stringify({ zapisano: new Date().toISOString(), zapisey: zapisi.length, zapisi }, null, 2) + '\n');
});
