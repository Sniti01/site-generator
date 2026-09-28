// CL2-P-7: «robots.txt без параметра (его берут роботы)» — копия из кэша Cloudflare (HIT), отличная от ответа мимо
// кэша, судится только «Googlebot и Bingbot на 4 путях». Блок Cloudflare (П106: управляемый robots.txt снят),
// закрытые ИИ-роботы (robots.txt: «AI crawlers — they are not blocked either»), чужие группы, отсутствие нашего файла
// в файле, который берут роботы, — ok со справкой «кэш». Те же тела в ответе мимо кэша — ПЛОХО.
//   node p7-bez-kesh.mjs
import { progon, zamenit, MIMO, BEZ, HOSTER, CLOUDFLARE, nashRobots, stroka, vyvesti } from './obshchee.mjs';

const vyvod = [];
const log = (...a) => vyvod.push(a.join(' '));
const IMYA = 'robots.txt без параметра (его берут роботы)';
const OBRAZCY = [
  ['a) без параметра — HIT: блок Cloudflare (ClaudeBot, GPTBot — Disallow: /) + блок хостера + наш файл', CLOUDFLARE + HOSTER + nashRobots],
  ['b) без параметра — HIT: чужие группы ИИ-роботов вне блоков + наш файл', 'User-agent: GPTBot\nDisallow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n\n' + HOSTER + nashRobots],
  ['c) без параметра — HIT: нашего файла нет вовсе (чужой robots.txt)', 'User-agent: *\nDisallow: /cgi-bin/\n'],
];
for (const [imya, telo] of OBRAZCY) {
  const r = await progon((k) => zamenit(k, BEZ, (o) => ({ ...o, telo })));
  log(`${imya}:\n  ${r.itog}; ${stroka(r.najti(IMYA))}`);
  log(`  справка: ${r.spravki.find((s) => s.includes('это кэш Cloudflare')) ?? '—'}`);
  const m = await progon((k) => zamenit(k, MIMO, (o) => ({ ...o, telo })));
  log(`  то же тело мимо кэша: ${m.itog}; ПЛОХО: ${m.plokho.map((c) => c.imya).join(', ')}`);
}
vyvesti('p7-bez-kesh', vyvod);
