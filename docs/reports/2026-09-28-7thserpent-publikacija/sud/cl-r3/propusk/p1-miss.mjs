// CL3-P-1: кэш HTML — MISS/EXPIRED засчитаны справкой «сверяет с сервером». Образец — правило кэша Cloudflare
// «Eligible for cache» с Edge TTL 1 день поверх заголовков сервера (Cache-Control от .htaccess — как обещано): первый
// запрос каждой страницы после привязки домена (или очистки кэша) — MISS, следующие — HIT с Age до суток, без сверки.
// Инструмент просит каждый адрес один раз — видит только MISS.
import { progon, vyvesti, stroka, sZag, B } from './obshchee.mjs';

const sHtml = (u) => u.startsWith(`${B}/`) && !/\.(txt|xml)(\?|$)/.test(new URL(u).pathname + new URL(u).search);
function edgeTtl(pervyy = 'MISS') {
  const skolko = new Map();
  return (karta) => async (url) => {
    if (!karta.has(url)) throw new Error(`запрос вне образца: ${url}`);
    const o = karta.get(url);
    if (!sHtml(url) || o.status !== 200) return o;
    const n = (skolko.get(url) ?? 0) + 1;
    skolko.set(url, n);
    return n === 1 ? sZag(o, { 'cf-cache-status': pervyy }) : sZag(o, { 'cf-cache-status': 'HIT', age: String(3600 * n) });
  };
}

const out = [];
for (const pervyy of ['MISS', 'EXPIRED']) {
  const zapros = edgeTtl(pervyy);
  let poluchitVtoroy;
  const r = await progon(() => {}, {
    poluchitIz: (karta) => {
      const f = zapros(karta);
      poluchitVtoroy = f;
      return f;
    },
  });
  out.push(`— первый ответ каждой страницы ${pervyy}, дальше HIT (Edge TTL) —`);
  out.push(`итог инструмента: ${r.itog}`);
  out.push(stroka(r.najti('HTML не из кэша Cloudflare')));
  out.push(stroka(r.najti('HTML: Cache-Control (max-age=0, must-revalidate)')));
  for (const s of r.spravki.filter((x) => x.includes('кэширует HTML'))) out.push(`  справка: ${s}`);
  const vtoroy = await poluchitVtoroy(`${B}/`);
  out.push(`следующий читатель главной (второй запрос того же адреса): Cf-Cache-Status ${vtoroy.zagolovok('cf-cache-status')}, Age ${vtoroy.zagolovok('age')} — правка до него не дойдёт`);
}
vyvesti('p1-miss', out);
