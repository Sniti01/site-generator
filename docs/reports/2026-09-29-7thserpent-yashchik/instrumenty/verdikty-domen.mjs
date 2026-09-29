// Вердикты сторожа домена на названных образцах (сессия 23, П108) — для доклада: первая выкладка со входом
// SERPENT_DOMAIN_BOUND и без, не первая. Ответы домена — подставные, сети нет.
//   node verdikty-domen.mjs <папка сайта>
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { domen } = await import(pathToFileURL(join(process.argv[2], 'tools/storozha-vykladki.mjs')).href);
const W = 'https://www.7thserpent.com/';
const G = 'https://7thserpent.com/';
const otv = (status, telo = '', location = '') => ({ status, telo, location });
const oshibka = (kod) => ({ oshibka: kod });
const ZAGLUSHKA = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Поздравляем, сайт создан!</title></head><body></body></html>';
const S403 = '<html><head><title>403 Forbidden</title></head></html>';
const NASH = '<!doctype html><html><head><title>Max Payne</title><link rel="canonical" href="https://www.7thserpent.com/"></head></html>';
const PERVOGO = '<!doctype html><html><head><link rel="canonical" href="https://www.ac4bf-thewatch.com/"></head></html>';
const NOT_CONF = (h) => `<html><body><h1>Website ${h} not configured</h1></body></html>`;
const OBRAZCY = [
  ['заглушка хостера на обоих именах (домен сейчас)', { [W]: otv(200, ZAGLUSHKA), [G]: otv(200, ZAGLUSHKA) }],
  ['403 на обоих (заглушку удалили)', { [W]: otv(403, S403), [G]: otv(403, S403) }],
  ['наша сборка (повтор оборванной первой)', { [W]: otv(200, NASH), [G]: otv(301, '', W) }],
  ['имя не разрешается на обоих', { [W]: oshibka('ENOTFOUND'), [G]: oshibka('ENOTFOUND') }],
  ['«not configured» на обоих', { [W]: otv(404, NOT_CONF('www.7thserpent.com')), [G]: otv(404, NOT_CONF('7thserpent.com')) }],
  ['ошибка сертификата на обоих', { [W]: oshibka('ERR_TLS_CERT_ALTNAME_INVALID'), [G]: oshibka('CERT_HAS_EXPIRED') }],
  ['таймаут на обоих', { [W]: oshibka('TimeoutError'), [G]: oshibka('TimeoutError') }],
  ['www не разрешается, голое — заглушка', { [W]: oshibka('ENOTFOUND'), [G]: otv(200, ZAGLUSHKA) }],
  ['www ведёт на чужой хост', { [W]: otv(302, '', 'https://parked.example/'), 'https://parked.example/': otv(200, '<title>Parked</title>'), [G]: otv(200, ZAGLUSHKA) }],
  ['отвечает первый сайт (canonical ac4bf)', { [W]: otv(200, PERVOGO), [G]: otv(200, PERVOGO) }],
  ['петля редиректов www ↔ голое', { [W]: otv(301, '', G), [G]: otv(301, '', W) }],
  ['редирект на негодный Location', { [W]: otv(301, '', 'http://'), [G]: otv(200, ZAGLUSHKA) }],
];
const iz = (karta) => async (url) => {
  if (!(url in karta)) throw new Error(`запрос вне образца: ${url}`);
  return karta[url];
};
for (const [imya, karta] of OBRAZCY) {
  console.log(`\n== ${imya}`);
  for (const [pervyi, soglasen, podpis] of [[true, true, 'первая, вход on '], [true, false, 'первая, вход off'], [false, false, 'не первая       ']]) {
    const r = await domen({ poluchit: iz(karta), pervyi, soglasen });
    console.log(`  ${podpis}: ${r.ok ? 'ПРОХОД' : 'СТОП  '} — ${r.stroki.at(-1).slice(0, 230)}`);
  }
}
