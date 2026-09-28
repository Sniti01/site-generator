// Мелкие образцы к находкам CL2-P-1, CL2-P-2, CL2-P-4 и одно замечание:
//   a) msnbot — Bing заявлял (2010), что bingbot соблюдает группы msnbot, если своей группы нет; инструмент msnbot не знает;
//   b) процентная запись пути: RFC 9309 §2.2.2 (таблица 1: /foo/bar/%62%61%7A ↔ /foo/bar/baz) — совпадает,
//      открытый разборщик Google и инструмент — нет;
//   c) canonical только в HTML-комментарии — canonicalOf его считает (регулярка без токенизатора, как у CL2-P-4);
//   d) ни одного заголовка Cloudflare (серое облако, DNS only) — /privacy/, ряд 05, обещает «every request passes
//      through Cloudflare»; проверки о кэше и обфускации проходят пусто.
//   node p8-raznoe.mjs
import { progon, zamenit, MIMO, BEZ, HOSTER, nashRobots, B, igra, stroka, CL, googleVerdikt, vyvesti } from './obshchee.mjs';

const vyvod = [];
const log = (...a) => vyvod.push(a.join(' '));
const robotsObrazec = async (imya, gruppa, puti) => {
  const telo = HOSTER.replace('# END adm.tools', gruppa + '# END adm.tools') + nashRobots;
  const r = await progon((k) => {
    zamenit(k, MIMO, (o) => ({ ...o, telo }));
    zamenit(k, BEZ, (o) => ({ ...o, telo }));
  });
  log(`${imya}: ${r.itog}; ${stroka(r.najti('robots.txt: поисковики не закрыты'))}; zakrytoPoiskovikam: ${JSON.stringify(CL.zakrytoPoiskovikam(telo, puti))}; модель robots.cc: ${googleVerdikt(telo, 'googlebot', puti)}`);
};
await robotsObrazec('a) блок хостера: User-agent: msnbot / Disallow: /', 'User-agent: msnbot\nDisallow: /\n', ['/']);
await robotsObrazec('b) блок хостера: User-agent: * / Disallow: /%70rivacy/', 'User-agent: *\nDisallow: /%70rivacy/\n', ['/privacy/']);

const kan = await progon((k) => zamenit(k, `${B}${igra}`, (o) => ({ ...o, telo: o.telo.replace(/<link rel="canonical"[^>]*>/, (m) => `<!-- ${m} -->`) })));
log(`c) страница игры: canonical только в комментарии: ${kan.itog}; ${stroka(kan.najti(`страница ${igra}: canonical`))}`);

const bezCf = await progon((k) => {
  for (const [u, o] of k) {
    k.set(u, { ...o, zagolovok: (i) => (/^(cf-|age$)/i.test(i) ? '' : o.zagolovok(i)) });
  }
});
log(`d) ни одного заголовка cf-* (Cloudflare не проксирует): ${bezCf.itog}; ${stroka(bezCf.najti('главная: HTML не из кэша Cloudflare'))}`);
vyvesti('p8-raznoe', vyvod);
