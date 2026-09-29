// SV23-O2 · признак svoy (правка раунда 1, SV23-O-2) смотрит только на имя КОНЕЧНОГО хоста цепочки и на canonical.
// Домен, который ведёт на чужой сайт не HTTP-редиректом (meta refresh, заголовок Refresh, фрейм, скрипт) или через
// чужой хост с возвратом на наше имя, получает svoy = true — при первой выкладке со входом on выкладка идёт, хотя
// строка отказа того же сторожа называет такой домен «ведёт не на этот сайт». Контроль — та же цель HTTP-редиректом 302.
// Сети нет: ответы — подставной poluchit; заголовок Refresh — подменой globalThis.fetch под poluchitSetyu сторожа.
import { SV, W, G, otv, iz, vyvod, poslednyaya, itogStroka } from './obshchee-o2.mjs';

const CHUZHOI = 'https://prodazha-domenov.example/lot/7thserpent';
const stranica = (golova, telo = '') => `<!DOCTYPE html><html><head><meta charset="utf-8">${golova}</head><body>${telo}</body></html>`;
const oba = (telo) => ({ [W]: otv(200, telo), [G]: otv(200, telo) });

const OBRAZCY = [
  ['контроль: 302 на чужой сайт (правка раунда 1 его держит)', { [W]: otv(302, '', CHUZHOI), [G]: otv(302, '', CHUZHOI), [CHUZHOI]: otv(200, stranica('<title>Домен 7thserpent.com продаётся</title>')) }],
  ['meta refresh на чужой сайт (переадресация регистратора)', oba(stranica(`<title>7thserpent.com</title><meta http-equiv="refresh" content="0;url=${CHUZHOI}">`))],
  ['фрейм с чужим сайтом (маскированная переадресация)', oba(`<!DOCTYPE html><html><head><title>7thserpent.com</title></head><frameset rows="100%"><frame src="${CHUZHOI}"></frameset></html>`)],
  ['скрипт уводит на чужой сайт', oba(stranica('<title>7thserpent.com</title>', `<script>location.replace('${CHUZHOI}')</script>`))],
  ['цепочка через чужой хост с возвратом на наше имя (проверка парковки)', {
    [W]: otv(302, '', 'https://parking.example/check?d=7thserpent.com'),
    'https://parking.example/check?d=7thserpent.com': otv(302, '', 'https://www.7thserpent.com/?pk=1'),
    'https://www.7thserpent.com/?pk=1': otv(200, stranica('<title>7thserpent.com — домен продаётся</title>')),
    [G]: otv(301, '', W),
  }],
];

const stroki = ['Первая выкладка, вход SERPENT_DOMAIN_BOUND = on (soglasen: true). Ответы — образцы, сети нет.', ''];
for (const [imya, karta] of OBRAZCY) {
  const r = await SV.domen({ poluchit: iz(karta), pervyi: true, soglasen: true });
  const svoy = [];
  for (const h of SV.HOSTY) svoy.push(`${h}: svoy=${(await SV.sostoyanieHosta(iz(karta), h)).svoy}`);
  stroki.push(`${imya}: сторож — ${itogStroka(r)}; ${svoy.join(', ')}`);
  for (const s of r.stroki.slice(0, 2)) stroki.push(`  ${s}`);
  stroki.push(`  итог: ${poslednyaya(r)}`, '');
}

// Заголовок Refresh: poluchitSetyu сторожа его не читает (возвращает только status, location, telo).
const prezhniy = globalThis.fetch;
const zhurnal = [];
globalThis.fetch = async (adres) => {
  zhurnal.push(String(adres));
  return new Response(stranica('<title>7thserpent.com</title>'), { status: 200, headers: { refresh: `0;url=${CHUZHOI}` } });
};
try {
  const otvet = await SV.poluchitSetyu(W);
  stroki.push(`заголовок Refresh: 0;url=${CHUZHOI} — poluchitSetyu вернул ключи: ${Object.keys(otvet).join(', ')}`);
  const r = await SV.domen({ poluchit: SV.poluchitSetyu, pervyi: true, soglasen: true });
  stroki.push(`  сторож (poluchitSetyu над подменённым fetch) — ${itogStroka(r)}; запросы подмены: ${zhurnal.join(' ')}`);
  for (const s of r.stroki.slice(0, 2)) stroki.push(`  ${s}`);
  stroki.push(`  итог: ${poslednyaya(r)}`, '');
} finally {
  globalThis.fetch = prezhniy;
}

stroki.push('Вывод: svoy = «конечный хост — имя сайта и нет чужого canonical». Переадресация не HTTP-статусом (meta refresh, Refresh,');
stroki.push('фрейм, скрипт) и цепочка через чужой хост с возвратом на наше имя дают svoy = true: со входом on первая выкладка идёт,');
stroki.push('хотя домен ведёт не на этот сайт — тот же класс, что SV23-O-2 (302 на чужой хост — стоп, контроль выше).');
vyvod('o2-svoy-vyvod.txt', stroki);
