// CL2-P-3: «главная: HTML не из кэша Cloudflare» и «Cache-Control у HTML» — что они не видят.
//   • MISS / EXPIRED — ответ, который Cloudflare счёл кэшируемым (правило «кэшировать всё»): первый запрос после
//     очистки даёт MISS, следующий читатель — HIT. HTML, не годный для кэша, Cloudflare помечает DYNAMIC (или BYPASS).
//   • Судится только главная: остальные страницы прогона могут приходить HIT — проверки нет.
//   • `s-maxage` (срок для общих кэшей, его берёт Cloudflare при «уважать заголовки») и `CDN-Cache-Control`
//     не читаются: «все max-age = 0» считает только `max-age`.
//   node p3-kesh-html.mjs
import { progon, zamenit, sZag, B, STRANICY, stroka, vyvesti } from './obshchee.mjs';

const vyvod = [];
const log = (...a) => vyvod.push(a.join(' '));
const GL_KESH = 'главная: HTML не из кэша Cloudflare';
const GL_CC = 'главная: Cache-Control у HTML (max-age=0, must-revalidate)';

for (const status of ['MISS', 'EXPIRED']) {
  const r = await progon((k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'cf-cache-status': status })));
  log(`a) главная Cf-Cache-Status ${status}: ${r.itog}; ${stroka(r.najti(GL_KESH))}`);
}
const vse = await progon((k) => {
  for (const p of STRANICY.filter((x) => x.url !== '/')) zamenit(k, `${B}${p.url}`, (o) => sZag(o, { 'cf-cache-status': 'HIT', age: '86400' }));
});
log(`b) все страницы, кроме главной, — HIT, Age 86400 (${STRANICY.length - 1} стр.): ${vse.itog}; ${stroka(vse.najti(GL_KESH))}`);
for (const [imya, zag] of [
  ['s-maxage=86400', { 'cache-control': 'public, max-age=0, s-maxage=86400, must-revalidate' }],
  ['CDN-Cache-Control: max-age=86400', { 'cdn-cache-control': 'max-age=86400' }],
]) {
  const r = await progon((k) => zamenit(k, `${B}/`, (o) => sZag(o, zag)));
  log(`c) главная ${imya}: ${r.itog}; ${stroka(r.najti(GL_CC))}`);
}
const cc = await progon((k) => {
  for (const p of STRANICY.filter((x) => x.url !== '/')) zamenit(k, `${B}${p.url}`, (o) => sZag(o, { 'cache-control': 'public, max-age=86400' }));
});
log(`d) все страницы, кроме главной, — Cache-Control public, max-age=86400: ${cc.itog}; ${stroka(cc.najti(GL_CC))}`);
vyvesti('p3-kesh-html', vyvod);
