// Прогон через сетевую функцию самого инструмента (`poluchitSetyu`) без сети: `globalThis.fetch` подменён и отдаёт
// Response, собранный из ответа образца, плюс лишние поля заголовков списком пар (повторы имени — как два поля в ответе
// сервера). Так видно, что именно получает `proverit` из настоящего `fetch` (склейку полей, раскодировку тела).
import { CL } from './obshchee.mjs';

const IMENA = ['cache-control', 'x-ray', 'cf-cache-status', 'content-type', 'cf-ray', 'server', 'age', 'set-cookie', 'x-robots-tag', 'cdn-cache-control', 'cf-mitigated'];

/** Функция запроса для progon: ответы образца проходят через Response и poluchitSetyu; `dop(url)` — лишние пары и/или байты тела. */
export const cherezSet = (dop = () => ({})) => (karta) => async (url) => {
  if (!karta.has(url)) throw new Error(`запрос вне образца: ${url}`);
  const o = karta.get(url);
  const { pary = [], bayty } = dop(url, o);
  const zamenyaemye = new Set(pary.map(([k]) => k.toLowerCase()));
  const zag = [];
  for (const i of IMENA) if (o.zagolovok(i) && !zamenyaemye.has(i)) zag.push([i, o.zagolovok(i)]);
  if (o.location) zag.push(['location', o.location]);
  zag.push(...pary);
  const prezhniy = globalThis.fetch;
  globalThis.fetch = async () => new Response(bayty ?? o.telo, { status: o.status, headers: zag });
  try {
    return await CL.poluchitSetyu(url);
  } finally {
    globalThis.fetch = prezhniy;
  }
};
