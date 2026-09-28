// Что держит: законные формы стека, на которых правка раунда 2 остаётся 44/44 (или даёт справку, не отказ).
import { server, vProcesse, poHttp, progon, sborkaInstrumenta, vykladIzDist, nashRobots, HOSTER, YASHCHIK } from './stend.mjs';

const sZag = (o, para) => ({ ...o, headers: [...o.headers.filter(([k]) => !para.some(([n]) => n.toLowerCase() === k.toLowerCase())), ...para] });
const bezZag = (o, imena) => ({ ...o, headers: o.headers.filter(([k]) => !imena.includes(k.toLowerCase())) });
const yashchik = (forma) => (rel, t) => (rel === 'privacy/index.html' ? t.replace(`<p>Requests about the logs go to ${YASHCHIK}.</p>`, `<p>${forma}</p>`) : t);

const FORMY = [
  ['301 с X-Robots-Tag: noindex (хостер на редиректах)', { pravka: (u, o) => (o.status === 301 ? sZag(o, [['x-robots-tag', 'noindex']]) : null) }],
  ['301 и 404 без cf-ray и server', { pravka: (u, o) => (o.status === 301 || o.status === 404 ? bezZag(o, ['cf-ray', 'server']) : null) }],
  ['HTML: Cf-Cache-Status MISS / EXPIRED / REVALIDATED (правило кэша со сверкой)', { pravka: (u, o) => (o.status === 200 && u.endsWith('/') ? sZag(o, [['cf-cache-status', ['MISS', 'EXPIRED', 'REVALIDATED'][u.length % 3]]]) : null) }],
  ['HTML: Cache-Control в другом регистре и порядке, CDN-Cache-Control: max-age=0', { pravka: (u, o) => (o.status === 200 && u.endsWith('/') ? sZag(o, [['cache-control', 'Must-Revalidate, Max-Age=0, Public'], ['cdn-cache-control', 'max-age=0']]) : null) }],
  ['HTML: X-Robots-Tag max-image-preview:large, noarchive', { pravka: (u, o) => (o.status === 200 && u.endsWith('/') ? sZag(o, [['x-robots-tag', 'max-image-preview:large, noarchive']]) : null) }],
  ['robots мимо кэша: BYPASS; без параметра: EXPIRED с тем же телом', { pravka: (u, o) => (u.includes('/robots.txt?') ? sZag(o, [['cf-cache-status', 'BYPASS']]) : u.endsWith('/robots.txt') ? sZag(o, [['cf-cache-status', 'EXPIRED']]) : null) }],
  ['хостер: группа * с Crawl-delay и пустым Disallow', { robots: HOSTER.replace('# END', 'User-agent: *\nCrawl-delay: 10\nDisallow:\n# END') + nashRobots }],
  ['хостер: Googlebot — Allow: /', { robots: HOSTER.replace('# END', 'User-agent: Googlebot\nAllow: /\n# END') + nashRobots }],
];
const YASHCHIKI = [
  ['ящик с + и сущностями, ссылкой mailto', `Requests about the logs go to <a href="mailto:box+logs&#64;7thserpent.com">box&#43;logs&#x40;7thserpent&#46;com</a>.`],
  ['ящик прописными, перед &nbsp; и точкой', 'Requests about the logs go to BOX@7THSERPENT.COM&nbsp;— or by post.'],
  ['ящик в скобках, в <strong>', 'Requests about the logs (<strong>box@7thserpent.com</strong>).'],
];

const itog = [];
for (const [imya, v] of FORMY) {
  const zakr = vProcesse(server(v));
  const r = await progon({ sborka: sborkaInstrumenta() });
  await zakr();
  itog.push(`${imya}: ${r.schet}${r.plokho.length ? ` (${r.plokho.map((c) => c.imya).join('; ')})` : ''}`);
  const spr = r.spravki.filter((s) => s.startsWith('Cloudflare кэширует HTML'));
  if (spr.length) console.log(`  ${imya} — справка: ${spr[0]}`);
}
for (const [imya, forma] of YASHCHIKI) {
  const pr = yashchik(forma);
  const zakr = vProcesse(server({ vyklad: vykladIzDist({ pravka: pr }) }));
  const r = await progon({ sborka: sborkaInstrumenta(undefined, (put, t) => pr(put === '/privacy/' ? 'privacy/index.html' : put, t)) });
  await zakr();
  const a = r.proverki.find((c) => c.imya.includes('адрес ящика'));
  itog.push(`${imya}: ${r.schet} (${a.otkuda})`);
}
// Настоящий HTTP: gzip, chunked, ETag, Vary; второй прогон подряд (заголовки кэша клиента не шлются — 304 не бывает).
const http = await poHttp(server());
const r1 = await progon({ sborka: sborkaInstrumenta() });
const r2 = await progon({ sborka: sborkaInstrumenta() });
await http.zakryt();
itog.push(`настоящий HTTP (gzip, chunked, ETag), два прогона подряд: ${r1.schet}, ${r2.schet}`);
for (const s of itog) console.log(s);
console.log(`ИТОГ: ${itog.filter((s) => /44\/44/.test(s)).length} из ${itog.length} форм — 44/44`);
