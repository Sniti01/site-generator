// Что из правки раунда 2 держит класс: попытки ложного ok, которые инструмент ловит (ждём ПЛОХО у названной проверки).
import { progon, vyvesti, zamenit, sZag, otvet, stranica, B, HTML, MIMO, BEZ, HOSTER, nashRobots, CL, title404, STRANICY } from './obshchee.mjs';

const HTML_SB = 'HTML страниц = сборка (dist)';
const VNE = 'robots.txt: вне нашего файла — только блок хостера';
const BEZ_P = 'robots.txt без параметра (его берут роботы)';
const ZAPRET = 'страницы без запрета индексации';
const CC = 'HTML: Cache-Control (max-age=0, must-revalidate)';
const ADRES = '/privacy/: адрес ящика открытым текстом';
const CFP = 'запросы идут через Cloudflare';
const KESH = 'HTML не из кэша Cloudflare';
const vTelo = (iz, na) => (o) => ({ ...o, telo: o.telo.replace(iz, na) });
const vBlok = (iz, na) => (k) => zamenit(k, MIMO, (o) => ({ ...o, telo: HOSTER.replace(iz, na) + nashRobots }));
const naPrivacy = (telo) => ({ vSborke: (k) => k.set(`${B}/privacy/`, otvet(200, stranica('/privacy/', 'Privacy policy — 7thserpent.com', telo), HTML)) });

const POPYTKI = [
  // HTML = сборка
  ['лишний перевод строки в конце главной', (k) => zamenit(k, `${B}/`, (o) => ({ ...o, telo: o.telo + '\n' })), HTML_SB],
  ['/movie/ отдаёт HTML /story/ (свой canonical заменён на /movie/)', (k) => zamenit(k, `${B}/movie/`, () => otvet(200, stranica('/story/', 'x').replace(`${B}/story/`, `${B}/movie/`), HTML)), HTML_SB],
  ['404 с нашим title и баннером хостера', (k) => zamenit(k, `${B}/net-takoy-stranicy-m1/`, vTelo('<main>', '<main><div class="hoster-banner">Hosted by adm.tools</div>')), HTML_SB],
  ['комментарий Cloudflare в конце страницы', (k) => zamenit(k, `${B}/quotes/`, (o) => ({ ...o, telo: o.telo + '<!-- cf -->' })), HTML_SB],
  ['стиль переписан на media=print и onload (приём Cloudflare/оптимизаторов)',(k) => zamenit(k, `${B}/pc/`, vTelo('<link rel="stylesheet" href="/_astro/index.Cz6femgl.css">', '<link rel="stylesheet" href="/_astro/index.Cz6femgl.css" media="print" onload="this.media=\'all\'">')), HTML_SB],
  // блок хостера: строгость
  ['блок: User-agent: Googlebot-News, Disallow: /x/', vBlok('User-agent: MJ12bot\nDisallow: /', 'User-agent: Googlebot-News\nDisallow: /x/'), VNE],
  ['блок: User-agent: msnbot-media', vBlok('User-agent: MJ12bot', 'User-agent: msnbot-media'), VNE],
  ['блок: «User-agent: * » и «Disallow: /nowhere/» (путь вне сборки)', vBlok('User-agent: MJ12bot\nDisallow: /', 'User-agent: * \nDisallow: /nowhere/'), VNE],
  ['блок: MJ12bot и Googlebot одной группой', vBlok('User-agent: MJ12bot', 'User-agent: MJ12bot\nUser-agent: Googlebot'), VNE],
  // копия из кэша
  ['без параметра из кэша — HTML-страница со статусом 200', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: stranica('/404/', title404) })), BEZ_P],
  ['без параметра из кэша — Sitemap на чужой хост', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER + nashRobots.replace('https://www.7thserpent.com/sitemap-index.xml', 'https://spam.example/s.xml') })), BEZ_P],
  ['без параметра из кэша — наш файл, но «Allow: /» заменён «Disallow: /nowhere/»', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER + nashRobots.replace('Allow: /', 'Disallow: /nowhere/') })), BEZ_P],
  // запрет индексации
  ['X-Robots-Tag: GoogleBot : noindex', (k) => zamenit(k, `${B}/movie/`, (o) => sZag(o, { 'x-robots-tag': 'GoogleBot : noindex' })), ZAPRET],
  ['X-Robots-Tag: googlebot: unavailable_after: Wednesday, 03-Nov-2021 15:00:00 GMT', (k) => zamenit(k, `${B}/movie/`, (o) => sZag(o, { 'x-robots-tag': 'googlebot: unavailable_after: Wednesday, 03-Nov-2021 15:00:00 GMT' })), ZAPRET],
  ['X-Robots-Tag: max-snippet: 0, noindex', (k) => zamenit(k, `${B}/movie/`, (o) => sZag(o, { 'x-robots-tag': 'max-snippet: 0, noindex' })), ZAPRET],
  ['X-Robots-Tag: otherbot: nofollow, googlebot: noindex', (k) => zamenit(k, `${B}/movie/`, (o) => sZag(o, { 'x-robots-tag': 'otherbot: nofollow, googlebot: noindex' })), ZAPRET],
  ['<meta name="GOOGLEBOT" content="NoIndex"> в сборке', () => {}, ZAPRET, { vSborke: (k) => zamenit(k, `${B}/movie/`, vTelo('<meta charset="utf-8">', '<meta charset="utf-8"><meta name="GOOGLEBOT" content="NoIndex">')) }],
  // кэш
  ['CDN-Cache-Control: s-maxage=86400', (k) => zamenit(k, `${B}/pc/`, (o) => sZag(o, { 'cdn-cache-control': 's-maxage=86400' })), CC],
  ['Cloudflare-CDN-Cache-Control: max-age=600', (k) => zamenit(k, `${B}/pc/`, (o) => sZag(o, { 'cloudflare-cdn-cache-control': 'max-age=600' })), CC],
  ['Cache-Control: public,max-age=0,must-revalidate,max-age=600 (без пробелов)', (k) => zamenit(k, `${B}/pc/`, (o) => sZag(o, { 'cache-control': 'public,max-age=0,must-revalidate,max-age=600' })), CC],
  ['одна страница /404/ напрямую — STALE', (k) => zamenit(k, `${B}/404/`, (o) => sZag(o, { 'cf-cache-status': 'STALE' })), KESH],
  // адрес ящика
  ['адрес box@7thserpent.com-evil.example', () => {}, ADRES, naPrivacy('<p>Write to box@7thserpent.com-evil.example.</p>')],
  ['адрес box@not7thserpent.com', () => {}, ADRES, naPrivacy('<p>Write to box@not7thserpent.com.</p>')],
  ['адрес только в строке скрипта', () => {}, ADRES, naPrivacy("<p>Write to us.</p><script>var m='box@7thserpent.com'</script>")],
  ['адрес только в style', () => {}, ADRES, naPrivacy('<p>Write to us.</p><style>/* box@7thserpent.com */</style>')],
  ['адрес только в href mailto', () => {}, ADRES, naPrivacy('<p><a href="mailto:box@7thserpent.com">Write to us</a>.</p>')],
  // Cloudflare
  ['одна страница без cf-ray (server: nginx)', (k) => zamenit(k, `${B}/remake/`, (o) => sZag(o, { 'cf-ray': '', server: 'nginx' })), CFP],
];

const out = [];
for (const [imya, izmenit, zhdem, opcii] of POPYTKI) {
  const r = await progon(izmenit, opcii);
  const c = r.najti(zhdem);
  out.push(`${c && !c.ok ? 'держит' : 'ПРОПУСК'}: ${imya} → «${zhdem}» ${c ? (c.ok ? 'ok' : 'ПЛОХО') : '—'}; итог ${r.itog}`);
}
// canonical
out.push(`держит? canonical в <body> — ${JSON.stringify(CL.canonicalOf(`<head><title>x</title></head><body><link rel="canonical" href="${B}/"></body>`))}`);
out.push(`держит? canonical в комментарии головы — ${JSON.stringify(CL.canonicalOf(`<head><!--<link rel="canonical" href="${B}/">--></head>`))}`);
vyvesti('derzhit', out);
