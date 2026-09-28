// Законные формы, которые новые проверки раунда 1 ДОЛЖНЫ держать (ждём 43/43, кроме помеченных «ждём ПЛОХО»).
import { progon, B, METKA, HOSTER, nashRobots, YASHCHIK, sZag } from './stend.mjs';

const MIMO = `${B}/robots.txt?live-check=${METKA}`;
const BEZ = `${B}/robots.txt`;
const na = (u0, f) => (url, o) => (url === u0 ? f(o) : undefined);
const cc = (znach) => ({ pravka: na(`${B}/`, (o) => sZag(o, [['cache-control', znach]])) });
const cf = (u0, st, age) => ({ pravka: na(u0, (o) => sZag(o, [['cf-cache-status', st], ...(age ? [['age', age]] : [])])) });
const bezCf = (u0) => ({ pravka: na(u0, (o) => ({ ...o, headers: o.headers.filter(([k]) => k !== 'cf-cache-status' && k !== 'age') })) });
const robots = (telo) => ({ pravka: (url, o) => (url === MIMO || url === BEZ ? { ...o, body: telo } : undefined) });
const blok = (vnutri) => `# BEGIN adm.tools Managed content\n${vnutri}\n# END adm.tools Managed content\n\n`;
const priv = (html) => ({ pravka: na(`${B}/privacy/`, (o) => ({ ...o, body: o.body.replace(/<p>Requests about the logs go to[\s\S]*?<\/p>/, html) })) });

const varianty = [
  // Cache-Control главной
  ['CC1 s-maxage=0 вместе с max-age=0', cc('public, max-age=0, must-revalidate, s-maxage=0')],
  ['CC2 private', cc('private, max-age=0, must-revalidate')],
  ['CC3 no-cache вместе с max-age=0', cc('no-cache, max-age=0, must-revalidate')],
  ['CC4 два заголовка, склеенные fetch (оба max-age=0)', cc('public, max-age=0, must-revalidate, public, max-age=0, must-revalidate')],
  ['CC5 регистр и пробелы: Public, Max-Age = 0, Must-Revalidate', cc('Public, Max-Age = 0, Must-Revalidate')],
  ['CC6 s-maxage=600 (кэш края, браузер — 0)', cc('public, max-age=0, s-maxage=600, must-revalidate')],
  // Cf-Cache-Status главной и robots.txt мимо кэша
  ...['MISS', 'BYPASS', 'DYNAMIC', 'EXPIRED'].map((s) => [`CF-гл ${s} на главной`, cf(`${B}/`, s)]),
  ['CF-гл без Cf-Cache-Status на главной', bezCf(`${B}/`)],
  ...['BYPASS', 'DYNAMIC', 'EXPIRED'].map((s) => [`CF-мимо ${s} на robots.txt мимо кэша`, cf(MIMO, s)]),
  ['CF-мимо без Cf-Cache-Status', bezCf(MIMO)],
  // robots.txt без параметра
  ['BEZ HIT с Age, тело равно', cf(BEZ, 'HIT', '3600')],
  ['BEZ MISS, тело равно', cf(BEZ, 'MISS', '0')],
  ['BEZ DYNAMIC, тело равно', cf(BEZ, 'DYNAMIC')],
  ['BEZ REVALIDATED с Age, тело равно', cf(BEZ, 'REVALIDATED', '5')],
  // блок хостера: формы строк
  ['RB1 Allow: без значения, Crawl-delay, Host, Sitemap внутри блока', robots(blok('User-agent: *\nAllow:\nCrawl-delay: 10\nHost: www.7thserpent.com\nSitemap: https://www.7thserpent.com/sitemap-index.xml\n\nUser-agent: AhrefsBot\nDisallow: /') + nashRobots)],
  ['RB2 двойные пробелы и TAB', robots(blok('User-agent:  AhrefsBot\nDisallow:\t/\n\nUser-agent:\tMJ12bot\nDisallow:  /') + nashRobots)],
  ['RB3 группа * хостера с Disallow: /cgi-bin/ и /*.php$', robots(blok('User-agent: *\nDisallow: /cgi-bin/\nDisallow: /*.php$') + nashRobots)],
  ['RB4 Googlebot-Image и Google-Extended закрыты (не Googlebot)', robots(blok('User-agent: Googlebot-Image\nDisallow: /\n\nUser-agent: Google-Extended\nDisallow: /') + nashRobots)],
  ['RB5 блок хостера с CRLF и TAB-отступом строк', robots(blok('\tUser-agent: AhrefsBot\r\n\tDisallow: /').replace(/\n/g, '\r\n') + nashRobots)],
  ['RB6 блок хостера после файла, группа * с Disallow: пустым', robots(nashRobots + '\n' + blok('User-agent: *\nDisallow:\n\nUser-agent: MJ12bot\nDisallow: /'))],
  // /privacy/ — формы ссылки mailto
  ['PR1 mailto:?subject=', priv(`<p>Requests about the logs go to <a href="mailto:${YASHCHIK}?subject=Logs%20request&amp;body=Hi">${YASHCHIK}</a>.</p>`)],
  ['PR2 адрес в двух местах (текст и ссылка)', priv(`<p>Requests about the logs go to ${YASHCHIK}: <a href="mailto:${YASHCHIK}">${YASHCHIK}</a>.</p>`)],
  ['PR3 MAILTO: заглавными и атрибут Astro', priv(`<p>Requests about the logs go to <a href="MAILTO:${YASHCHIK}" data-astro-cid-abc123>${YASHCHIK}</a>.</p>`)],
  // X-Robots-Tag, законные директивы
  ['XR1 noarchive, nosnippet на главной', { pravka: na(`${B}/`, (o) => sZag(o, [['x-robots-tag', 'noarchive, nosnippet']])) }],
  // Set-Cookie от Cloudflare на 301 — ждём ПЛОХО (обещание /privacy/ о cookies), с подсказкой Cloudflare
  ['SC1 ждём ПЛОХО: __cf_bm на 301 голого хоста', { pravka: na('https://7thserpent.com/', (o) => sZag(o, [['set-cookie', '__cf_bm=x; path=/; expires=Wed, 30 Sep 2026 10:00:00 GMT; HttpOnly']])) }],
  // canonical и карта — байты одной сборки; другой регистр хоста этот стек не отдаёт (не законная форма стека)
  ['KN1 ждём ПЛОХО (не форма стека): canonical /cheats/ с хостом заглавными', { pravka: na(`${B}/cheats/`, (o) => ({ ...o, body: o.body.replace('href="https://www.7thserpent.com/cheats/"', 'href="https://WWW.7thserpent.com/cheats/"') })) }],
];
const itog = [];
for (const [imya, v] of varianty) {
  const r = await progon(v);
  const plokho = r.plokho.map((c) => `${c.imya}: ${c.otkuda}`);
  console.log(`${imya}: ${r.schet}${plokho.length ? `\n    ПЛОХО ${plokho.join('\n    ПЛОХО ')}` : ''}`);
  itog.push(`${imya.split(' ')[0]}=${r.schet}`);
}
console.log(`\nИТОГ держит: ${itog.join(' ')}`);
