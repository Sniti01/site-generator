// Пробы проверки живого сайта `tools/check-live.mjs` (П106, шаг 4) — на подставных ответах, без сети:
// образец здорового живого сайта (ответы — по обещаниям public/.htaccess, public/robots.txt и сборки, блок
// хостера в robots.txt — по докладу первой выкладки первого сайта: имена блоков записаны, байты — нет) и порчи.
// У каждой порчи — ровно какие проверки краснеют. Запрос вне образца — ошибка теста, а не тихий ответ.
// «Судью судят», раунд 1 (CL1-P — «ложный ok», CL1-Z — «законные формы»): находки — порчами ниже с их id.
//   npm run proverki (сборка копии не нужна)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import * as CL from '../check-live.mjs';

const { proverit, razobratRobots, canonicalOf, SAYT } = CL;

const struktura = JSON.parse(readFileSync(join(SAYT, 'structure/structure.json'), 'utf8'));
const nashRobots = readFileSync(join(SAYT, 'public/robots.txt'), 'utf8');
const HOST = 'www.7thserpent.com';
const B = `https://${HOST}`;
const METKA = 'm1';
const VSEGO = 43;
const YASHCHIK = 'box@7thserpent.com';

const otvet = (status, telo = '', zag = {}, location = '') => ({
  status,
  location,
  telo,
  zagolovok: (i) => zag[i.toLowerCase()] ?? '',
});
const title404 = struktura.pages.find((p) => p.url === '/404/').title;
const igra = struktura.pages.find((p) => p.type === 'game').url;
const stranica = (url, title = 'x', telo = '<p>text</p>') =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><link rel="canonical" href="${B}${url}"><script type="module">document.querySelector('.hdr__burger')</script></head><body><main>${telo}</main></body></html>`;
const HTML = { 'cache-control': 'public, max-age=0, must-revalidate', 'x-ray': 'p542:wal', 'cf-cache-status': 'DYNAMIC', 'content-type': 'text/html' };
const HOSTER = '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n# END adm.tools Managed content\n\n';
const CLOUDFLARE =
  '# BEGIN Cloudflare Managed content\n# As a condition of accessing this website, you agree to abide by the following content signals:\nUser-agent: *\nContent-Signal: search=yes,ai-train=no\nAllow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n# END Cloudflare Managed Content\n\n';
const urlset = (urls) => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${u}</loc></url>`).join('')}</urlset>`;
const STRANICY = struktura.pages.filter((p) => p.url !== '/404/');
const KARTA = STRANICY.map((p) => `${B}${p.url}`);
const PRIVACY = stranica('/privacy/', 'Privacy policy — 7thserpent.com', `<p>Requests about the logs go to <a href="mailto:${YASHCHIK}">${YASHCHIK}</a>.</p>`);

/** Образец здорового сайта: адрес → ответ. */
function zdorovyy() {
  const k = new Map();
  for (const put of ['/', igra]) {
    k.set(`http://${HOST}${put}`, otvet(301, '', {}, `${B}${put}`));
    k.set(`https://7thserpent.com${put}`, otvet(301, '', {}, `${B}${put}`));
    k.set(`http://7thserpent.com${put}`, otvet(301, '', {}, `${B}${put}`));
  }
  for (const p of STRANICY) k.set(`${B}${p.url}`, otvet(200, stranica(p.url, p.title), HTML));
  k.set(`${B}/privacy/`, otvet(200, PRIVACY, HTML));
  k.set(`${B}/robots.txt?live-check=${METKA}`, otvet(200, HOSTER + nashRobots, { 'cf-cache-status': 'DYNAMIC' }));
  k.set(`${B}/robots.txt`, otvet(200, HOSTER + nashRobots, { 'cf-cache-status': 'HIT', age: '120' }));
  k.set(`${B}/sitemap-index.xml`, otvet(200, `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${B}/sitemap-0.xml</loc></sitemap></sitemapindex>`));
  k.set(`${B}/sitemap-0.xml`, otvet(200, urlset(KARTA)));
  k.set(`${B}/net-takoy-stranicy-${METKA}/`, otvet(404, stranica('/404/', title404), HTML));
  k.set(`${B}/404/`, otvet(200, stranica('/404/', title404), HTML));
  return k;
}

async function progon(izmenit = () => {}, { vse } = {}) {
  const karta = zdorovyy();
  izmenit(karta);
  const poluchit = async (url) => {
    if (vse) return vse(url);
    if (!karta.has(url)) throw new Error(`запрос вне образца: ${url}`);
    return karta.get(url);
  };
  const r = await proverit({ poluchit, host: HOST, struktura, nashRobots, metka: METKA });
  return { ...r, plokho: r.proverki.filter((c) => !c.ok).map((c) => c.imya).sort(), otkuda: r.proverki.filter((c) => !c.ok).map((c) => `${c.imya}: ${c.fakt} — ${c.otkuda}`).join(' | ') };
}
const zamenit = (karta, url, f) => karta.set(url, f(karta.get(url)));
const sZag = (o, zag) => ({ ...o, zagolovok: (i) => (i.toLowerCase() in zag ? zag[i.toLowerCase()] : o.zagolovok(i)) });
const MIMO = `${B}/robots.txt?live-check=${METKA}`;
const BEZ = `${B}/robots.txt`;

test('здоровый живой сайт — все 43 проверки ok', async () => {
  const r = await progon();
  assert.equal(r.proverki.length, VSEGO);
  assert.deepEqual(r.plokho, [], r.otkuda);
  assert.ok(r.spravki.some((s) => s.includes('блок хостера «adm.tools Managed content» перед нашим файлом')), r.spravki.join(' | '));
  assert.ok(r.spravki.some((s) => s.includes('мимо кэша: Cf-Cache-Status DYNAMIC')), r.spravki.join(' | '));
  assert.ok(r.spravki.some((s) => s.includes('без параметра: Cf-Cache-Status HIT, Age 120')), r.spravki.join(' | '));
});

test('домен не подключён (имя не разрешается) — 0 из 43', async () => {
  const r = await progon(() => {}, { vse: () => otvet('сеть: ENOTFOUND') });
  assert.equal(r.proverki.length, VSEGO);
  assert.equal(r.plokho.length, VSEGO);
});

test('домен ведёт на хостер, сайт не заведён («not configured») — 0 из 43', async () => {
  const zaglushka = otvet(404, '<html><body><h1>Website 7thserpent.com not configured</h1><p>Domain address record points to our server, but this site is not served</p></body></html>');
  const r = await progon(() => {}, { vse: (url) => (url.startsWith('https://') ? otvet(302, '', {}, url.replace('https://', 'http://')) : zaglushka) });
  assert.equal(r.plokho.length, VSEGO);
});

const MIMO_PROVERKI = ['robots.txt мимо кэша: статус', 'robots.txt мимо кэша: обход кэша сработал', 'robots.txt: наш файл целиком', 'robots.txt: блока Cloudflare нет', 'robots.txt: вне нашего файла — только блок хостера', 'robots.txt: поисковики не закрыты', 'robots.txt: строка Sitemap'];
const PORCHI = [
  // — robots.txt мимо кэша —
  ['блок Cloudflare (управляемый robots.txt не снят)', (k) => zamenit(k, MIMO, (o) => ({ ...o, telo: CLOUDFLARE + HOSTER + nashRobots })), ['robots.txt: блока Cloudflare нет']],
  ['чужая группа вне блоков', (k) => zamenit(k, MIMO, (o) => ({ ...o, telo: 'User-agent: GPTBot\nDisallow: /\n\n' + HOSTER + nashRobots })), ['robots.txt: вне нашего файла — только блок хостера']],
  ['наш файл изменён (Allow → Disallow)', (k) => zamenit(k, MIMO, (o) => ({ ...o, telo: HOSTER + nashRobots.replace('Allow: /', 'Disallow: /') })), ['robots.txt: вне нашего файла — только блок хостера', 'robots.txt: наш файл целиком', 'robots.txt: поисковики не закрыты']],
  ['блок хостера закрывает Googlebot', (k) => zamenit(k, MIMO, (o) => ({ ...o, telo: HOSTER.replace('User-agent: MJ12bot', 'User-agent: Googlebot') + nashRobots })), ['robots.txt: поисковики не закрыты']],
  ['блок хостера без END', (k) => zamenit(k, MIMO, (o) => ({ ...o, telo: HOSTER.replace('# END adm.tools Managed content', '') + nashRobots })), ['robots.txt: вне нашего файла — только блок хостера']],
  ['robots.txt мимо кэша — 404', (k) => zamenit(k, MIMO, () => otvet(404, stranica('/404/', title404))), MIMO_PROVERKI],
  ['robots.txt с CRLF — чисто', (k) => zamenit(k, MIMO, (o) => ({ ...o, telo: (HOSTER + nashRobots).replace(/\n/g, '\r\n') })), []],
  ['CL1-P-9a блок хостера: Googlebot, «Disallow /» без двоеточия', (k) => zamenit(k, MIMO, (o) => ({ ...o, telo: HOSTER.replace('User-agent: MJ12bot\nDisallow: /', 'User-agent: Googlebot\nDisallow /') + nashRobots })), ['robots.txt: поисковики не закрыты']],
  ['CL1-P-9b блок хостера: Googlebot, «Dissallow: /»', (k) => zamenit(k, MIMO, (o) => ({ ...o, telo: HOSTER.replace('User-agent: MJ12bot\nDisallow: /', 'User-agent: Googlebot\nDissallow: /') + nashRobots })), ['robots.txt: поисковики не закрыты']],
  ['CL1-P-9c блок хостера: «User agent: Googlebot»', (k) => zamenit(k, MIMO, (o) => ({ ...o, telo: HOSTER.replace('User-agent: MJ12bot', 'User agent: Googlebot') + nashRobots })), ['robots.txt: поисковики не закрыты']],
  ['CL1-P-10 правило в блоке после нашего файла продолжает нашу группу', (k) => zamenit(k, MIMO, (o) => ({ ...o, telo: nashRobots + '\n# BEGIN adm.tools Managed content\nDisallow: /*\n# END adm.tools Managed content\n' })), ['robots.txt: поисковики не закрыты']],
  ['CL1-Z-2 «Disallow: # комментарий» в группе * хостера — чисто', (k) => zamenit(k, MIMO, (o) => ({ ...o, telo: HOSTER.replace('User-agent: MJ12bot\nDisallow: /', 'User-agent: *\nDisallow: # nothing is blocked for other robots') + nashRobots })), []],
  ['CL1-Z-5 комментарий хостера вне меток — справка, не отказ', (k) => zamenit(k, MIMO, (o) => ({ ...o, telo: '# robots.txt served by adm.tools hosting\n' + HOSTER + '#\n' + nashRobots })), []],
  // CL1-P-2, CL1-Z-1: «мимо кэша» пришло из кэша — обход не удался; свои строки не «чужие».
  ['CL1-P-2 мимо кэша — HIT старой версии нашего файла', (k) => zamenit(k, MIMO, () => otvet(200, HOSTER + nashRobots.replace('# A static site (Astro).', '# A static site.'), { 'cf-cache-status': 'HIT', age: '9120' })), ['robots.txt мимо кэша: обход кэша сработал', 'robots.txt: наш файл целиком']],
  // — robots.txt без параметра (CL1-P-1): его берут роботы —
  ['из кэша — старая безвредная версия без Sitemap: справка, не отказ', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER + 'User-agent: *\nAllow: /\n' })), []],
  ['CL1-P-1a без параметра — HIT, «Disallow: /» для всех', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: 'User-agent: *\nDisallow: /\n' })), ['robots.txt без параметра (его берут роботы)']],
  ['CL1-P-1b без параметра — DYNAMIC, отличается от ответа мимо кэша', (k) => zamenit(k, BEZ, () => otvet(200, HOSTER + 'User-agent: *\nAllow: /\n', { 'cf-cache-status': 'DYNAMIC' })), ['robots.txt без параметра (его берут роботы)']],
  ['CL1-P-1c без параметра — 503', (k) => zamenit(k, BEZ, () => otvet(503, 'Service Unavailable')), ['robots.txt без параметра (его берут роботы)']],
  // — главная и HTML —
  ['CL1-P-3a Cache-Control: max-age=14400 и must-revalidate', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'cache-control': 'public, max-age=14400, must-revalidate' })), ['главная: Cache-Control у HTML (max-age=0, must-revalidate)']],
  ['CL1-P-3b два Cache-Control, склеенные fetch', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'cache-control': 'max-age=14400, public, max-age=0, must-revalidate' })), ['главная: Cache-Control у HTML (max-age=0, must-revalidate)']],
  ['Cache-Control без must-revalidate', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'cache-control': 'max-age=0' })), ['главная: Cache-Control у HTML (max-age=0, must-revalidate)']],
  ['CL1-P-4 главная из кэша Cloudflare', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'cf-cache-status': 'HIT', age: '5400' })), ['главная: HTML не из кэша Cloudflare']],
  ['canonical главной на голый хост', (k) => zamenit(k, `${B}/`, (o) => ({ ...o, telo: o.telo.replace(`${B}/`, 'https://7thserpent.com/') })), ['главная: canonical', 'sitemap-0.xml: адреса отвечают 200 со своим canonical']],
  ['два canonical на главной', (k) => zamenit(k, `${B}/`, (o) => ({ ...o, telo: o.telo.replace('</head>', `<link rel="canonical" href="${B}/x/"></head>`) })), ['главная: canonical', 'sitemap-0.xml: адреса отвечают 200 со своим canonical']],
  ['CL1-P-6 вставки Cloudflare: Web Analytics и JS detections', (k) => {
    for (const u of [`${B}/`, `${B}/privacy/`]) zamenit(k, u, (o) => ({ ...o, telo: o.telo.replace('</main>', "</main><script defer src=\"https://static.cloudflareinsights.com/beacon.min.js/v8b\" data-cf-beacon='{\"token\":\"x\"}'></script><script>a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js'</script>") }));
  }, ['HTML без вставок Cloudflare и чужих ресурсов']],
  ['чужая таблица стилей на главной', (k) => zamenit(k, `${B}/`, (o) => ({ ...o, telo: o.telo.replace('</head>', '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=X"></head>') })), ['HTML без вставок Cloudflare и чужих ресурсов']],
  ['CL1-P-13 X-Robots-Tag: noindex на страницах', (k) => { for (const p of STRANICY) zamenit(k, `${B}${p.url}`, (o) => sZag(o, { 'x-robots-tag': 'noindex, nofollow' })); }, ['страницы без X-Robots-Tag noindex']],
  ['CL1-P-12 Set-Cookie на странице игры и на 404', (k) => { zamenit(k, `${B}${igra}`, (o) => sZag(o, { 'set-cookie': '_cfuvid=abc; path=/' })); zamenit(k, `${B}/net-takoy-stranicy-${METKA}/`, (o) => sZag(o, { 'set-cookie': '_cfuvid=abc; path=/' })); }, ['ответы без Set-Cookie']],
  ['Set-Cookie на главной', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'set-cookie': '__cf_bm=abc; path=/' })), ['ответы без Set-Cookie']],
  // — редиректы (CL1-P-5: путь не теряется) —
  ['CL1-P-5 редирект страницы теряет путь', (k) => { for (const u of [`http://${HOST}${igra}`, `https://7thserpent.com${igra}`, `http://7thserpent.com${igra}`]) k.set(u, otvet(301, '', {}, `${B}/`)); }, [`http → https ${igra}: Location`, `голый → www ${igra}: Location`, `http голый → https www ${igra}: Location`]],
  ['Always Use HTTPS: http://голый → https://голый', (k) => k.set('http://7thserpent.com/', otvet(301, '', {}, 'https://7thserpent.com/')), ['http голый → https www /: Location']],
  ['302 вместо 301', (k) => zamenit(k, `http://${HOST}/`, (o) => ({ ...o, status: 302 })), ['http → https /: статус']],
  // — карта (CL1-P-14: адреса карты запрашиваются) —
  ['карта без /privacy/', (k) => k.set(`${B}/sitemap-0.xml`, otvet(200, urlset(KARTA.filter((u) => !u.endsWith('/privacy/'))))), ['sitemap-0.xml: адресов', 'sitemap-0.xml: адреса = структура']],
  ['карта с /404/', (k) => k.set(`${B}/sitemap-0.xml`, otvet(200, urlset([...KARTA, `${B}/404/`]))), ['sitemap-0.xml: адресов', 'sitemap-0.xml: адреса = структура']],
  ['карта: дубль вместо /privacy/ (тот же счёт)', (k) => k.set(`${B}/sitemap-0.xml`, otvet(200, urlset([...KARTA.filter((u) => !u.endsWith('/privacy/')), `${B}/`]))), ['sitemap-0.xml: адреса = структура']],
  ['индекс ведёт на sitemap-1.xml', (k) => zamenit(k, `${B}/sitemap-index.xml`, (o) => ({ ...o, telo: o.telo.replace('sitemap-0.xml', 'sitemap-1.xml') })), ['sitemap-index.xml: ведёт на sitemap-0.xml']],
  ['CL1-P-14 14 из 17 адресов карты — 404', (k) => { for (const p of STRANICY.filter((x) => !['/', igra, '/privacy/'].includes(x.url))) k.set(`${B}${p.url}`, otvet(404, stranica('/404/', title404), HTML)); }, ['sitemap-0.xml: адреса отвечают 200 со своим canonical']],
  // — 404, страница игры, /privacy/ (CL1-P-7: не только статус) —
  ['несуществующий адрес — 404 хостера', (k) => k.set(`${B}/net-takoy-stranicy-${METKA}/`, otvet(404, '<html><head><title>404 Not Found</title></head></html>')), ['несуществующий адрес: наша страница']],
  ['несуществующий адрес — наша страница со статусом 200', (k) => zamenit(k, `${B}/net-takoy-stranicy-${METKA}/`, (o) => ({ ...o, status: 200 })), ['несуществующий адрес: статус']],
  ['/404/ напрямую — 404', (k) => zamenit(k, `${B}/404/`, (o) => ({ ...o, status: 404 })), ['/404/ напрямую: статус']],
  ['страница игры — 500', (k) => k.set(`${B}${igra}`, otvet(500)), [`страница ${igra}: статус`, `страница ${igra}: canonical`, 'sitemap-0.xml: адреса отвечают 200 со своим canonical']],
  ['CL1-P-7 страница игры — список каталога Apache', (k) => k.set(`${B}${igra}`, otvet(200, `<html><head><title>Index of ${igra}</title></head><body><h1>Index of ${igra}</h1></body></html>`, HTML)), [`страница ${igra}: canonical`, 'sitemap-0.xml: адреса отвечают 200 со своим canonical']],
  ['/privacy/ с __cf_email__ вместо адреса', (k) => zamenit(k, `${B}/privacy/`, (o) => ({ ...o, telo: o.telo.replace(`<a href="mailto:${YASHCHIK}">${YASHCHIK}</a>`, '<a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="1a2b">[email&#160;protected]</a><script src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script>') })), ['/privacy/: адрес ящика открытым текстом', '/privacy/: без обфускации почты Cloudflare', 'HTML без вставок Cloudflare и чужих ресурсов']],
  ['CL1-P-8, CL1-Z-3 /privacy/ без адреса ящика', (k) => k.set(`${B}/privacy/`, otvet(200, stranica('/privacy/', 'Privacy policy — 7thserpent.com'), HTML)), ['/privacy/: адрес ящика открытым текстом']],
  ['/privacy/ — 404', (k) => zamenit(k, `${B}/privacy/`, () => otvet(404, stranica('/404/', title404), HTML)), ['/privacy/: статус', '/privacy/: canonical', '/privacy/: без обфускации почты Cloudflare', '/privacy/: адрес ящика открытым текстом', 'sitemap-0.xml: адреса отвечают 200 со своим canonical']],
];

for (const [imya, izmenit, zhdem] of PORCHI) {
  test(`порча: ${imya}`, async () => {
    const r = await progon(izmenit);
    assert.equal(r.proverki.length, VSEGO);
    assert.deepEqual(r.plokho, [...zhdem].sort(), r.otkuda);
  });
}

test('справки: кэш, положение блока хостера, комментарии вне меток', async () => {
  const kesh = await progon((k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER + 'User-agent: *\nAllow: /\n' })));
  assert.ok(kesh.spravki.some((s) => s.includes('это кэш Cloudflare, не отказ')), kesh.spravki.join(' | '));
  const posle = await progon((k) => zamenit(k, MIMO, (o) => ({ ...o, telo: nashRobots + '\n' + HOSTER })));
  assert.deepEqual(posle.plokho, []);
  assert.ok(posle.spravki.some((s) => s.includes('после нашего файла')), posle.spravki.join(' | '));
  const komm = await progon((k) => zamenit(k, MIMO, (o) => ({ ...o, telo: '# robots.txt served by adm.tools hosting\n' + HOSTER + nashRobots })));
  assert.ok(komm.spravki.some((s) => s.includes('# robots.txt served by adm.tools hosting')), komm.spravki.join(' | '));
});

test('CL1-Z-1 обход кэша не удался — причина названа в строке', async () => {
  const r = await progon((k) => zamenit(k, MIMO, () => otvet(200, HOSTER + nashRobots.replace('# A static site (Astro).', '# A static site.'), { 'cf-cache-status': 'HIT', age: '9120' })));
  assert.match(r.otkuda, /robots\.txt: наш файл целиком: false — .*ответ из кэша Cloudflare \(HIT, Age 9120\)/);
  assert.match(r.otkuda, /первая расходящаяся строка/);
});

test('CL1-Z-4 подсказки причин: вызов Cloudflare, 526, cookies Cloudflare, Always Use HTTPS', async () => {
  const vyzov = await progon(() => {}, { vse: () => otvet(403, '<title>Just a moment...</title>', { 'cf-mitigated': 'challenge' }) });
  assert.equal(vyzov.plokho.length, VSEGO);
  assert.match(vyzov.otkuda, /вызов Cloudflare/);
  const s526 = await progon(() => {}, { vse: () => otvet(526, 'Invalid SSL certificate') });
  assert.match(s526.otkuda, /526: Cloudflare не принял сертификат сервера/);
  const kuki = await progon((k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'set-cookie': 'a=1; path=/, __cf_bm=2; path=/; HttpOnly' })));
  assert.match(kuki.otkuda, /a \(главная\)/);
  assert.match(kuki.otkuda, /__cf_bm \(главная, Cloudflare/);
  const always = await progon((k) => k.set('http://7thserpent.com/', otvet(301, '', {}, 'https://7thserpent.com/')));
  assert.match(always.otkuda, /Always Use HTTPS/);
});

test('разбор robots.txt: наш файл только отдельными строками', () => {
  assert.equal(razobratRobots('# ' + nashRobots, nashRobots).nashCelikom, false);
  assert.equal(razobratRobots(nashRobots, nashRobots).nashCelikom, true);
  assert.deepEqual(razobratRobots(nashRobots + '\n', nashRobots).chuzhoyTekst, []);
});

test('поисковики по правилам Google: длиннейшее правило, Allow при равенстве, * и $', () => {
  const { zakrytoPoiskovikam } = CL;
  assert.equal(typeof zakrytoPoiskovikam, 'function', 'нет функции zakrytoPoiskovikam');
  assert.deepEqual(zakrytoPoiskovikam(nashRobots, ['/']), []);
  assert.deepEqual(zakrytoPoiskovikam('User-agent: *\nDisallow: /\nAllow: /\n', ['/']), []);
  assert.deepEqual(zakrytoPoiskovikam('User-agent: *\nDisallow: /\n', ['/']), ['googlebot /', 'bingbot /']);
  assert.deepEqual(zakrytoPoiskovikam('User-agent: *\nAllow: /\nDisallow: /*$\n', ['/x/']), ['googlebot /x/', 'bingbot /x/']);
  assert.deepEqual(zakrytoPoiskovikam('User-agent: *\nDisallow: /\n\nUser-agent: Googlebot\nAllow: /\n', ['/']), ['bingbot /']);
  assert.deepEqual(zakrytoPoiskovikam('Disallow: /\nUser-agent: *\nAllow: /\n', ['/']), []);
});

test('canonical: порядок атрибутов и кавычки', () => {
  assert.deepEqual(canonicalOf(`<link href='${B}/' rel=canonical>`), [`${B}/`]);
  assert.deepEqual(canonicalOf(`<link rel="alternate canonical" href="${B}/a/">`), [`${B}/a/`]);
  assert.deepEqual(canonicalOf('<link rel="icon" href="/x.svg">'), []);
});

test('команда: неверные аргументы — код 2, без сети', () => {
  for (const argi of [['--bad'], ['--host']]) {
    const r = spawnSync(process.execPath, [join(SAYT, 'tools/check-live.mjs'), ...argi], { encoding: 'utf8' });
    assert.equal(r.status, 2, `${argi.join(' ')}: ${r.stderr}`);
  }
});
