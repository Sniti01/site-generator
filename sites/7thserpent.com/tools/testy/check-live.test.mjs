// Пробы проверки живого сайта `tools/check-live.mjs` (П106, шаг 4) — на подставных ответах, без сети:
// образец здорового живого сайта (ответы — по обещаниям public/.htaccess, public/robots.txt и сборки, блок
// хостера в robots.txt — по докладу первой выкладки первого сайта) и порчи. У каждой порчи — ровно какие
// проверки краснеют. Запрос вне образца — ошибка теста, а не тихий ответ.
//   npm run proverki (сборка копии не нужна)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { proverit, razobratRobots, canonicalOf, SAYT } from '../check-live.mjs';

const struktura = JSON.parse(readFileSync(join(SAYT, 'structure/structure.json'), 'utf8'));
const nashRobots = readFileSync(join(SAYT, 'public/robots.txt'), 'utf8');
const HOST = 'www.7thserpent.com';
const B = `https://${HOST}`;
const METKA = 'm1';
const VSEGO = 26;

const otvet = (status, telo = '', zag = {}, location = '') => ({
  status,
  location,
  telo,
  zagolovok: (i) => zag[i.toLowerCase()] ?? '',
});
const title404 = struktura.pages.find((p) => p.url === '/404/').title;
const igra = struktura.pages.find((p) => p.type === 'game').url;
const stranica = (url, title = 'x') =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><link rel="canonical" href="${B}${url}"></head><body><main><p>text</p></main></body></html>`;
const HTML = { 'cache-control': 'public, max-age=0, must-revalidate', 'x-ray': 'p542:wal' };
const HOSTER = '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n# END adm.tools Managed content\n\n';
const CLOUDFLARE =
  '# BEGIN Cloudflare Managed content\n# As a condition of accessing this website, you agree to abide by the following content signals:\nUser-agent: *\nContent-Signal: search=yes,ai-train=no\nAllow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n# END Cloudflare Managed Content\n\n';
const urlset = (urls) => `<?xml version="1.0" encoding="UTF-8"?><urlset>${urls.map((u) => `<url><loc>${u}</loc></url>`).join('')}</urlset>`;
const KARTA = struktura.pages.filter((p) => p.url !== '/404/').map((p) => `${B}${p.url}`);

/** Образец здорового сайта: адрес → ответ. */
function zdorovyy() {
  return new Map([
    [`http://${HOST}/`, otvet(301, '', {}, `${B}/`)],
    ['https://7thserpent.com/', otvet(301, '', {}, `${B}/`)],
    ['http://7thserpent.com/', otvet(301, '', {}, `${B}/`)],
    [`${B}/`, otvet(200, stranica('/', 'Max Payne — 7thserpent.com'), HTML)],
    [`${B}/robots.txt?live-check=${METKA}`, otvet(200, HOSTER + nashRobots, { 'cf-cache-status': 'DYNAMIC' })],
    [`${B}/robots.txt`, otvet(200, HOSTER + nashRobots, { 'cf-cache-status': 'HIT', age: '120' })],
    [`${B}/sitemap-index.xml`, otvet(200, `<?xml version="1.0" encoding="UTF-8"?><sitemapindex><sitemap><loc>${B}/sitemap-0.xml</loc></sitemap></sitemapindex>`)],
    [`${B}/sitemap-0.xml`, otvet(200, urlset(KARTA))],
    [`${B}/net-takoy-stranicy-${METKA}/`, otvet(404, stranica('/404/', title404), HTML)],
    [`${B}/404/`, otvet(200, stranica('/404/', title404), HTML)],
    [`${B}${igra}`, otvet(200, stranica(igra), HTML)],
    [`${B}/privacy/`, otvet(200, stranica('/privacy/', 'Privacy policy — 7thserpent.com'), HTML)],
  ]);
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
  return { ...r, plokho: r.proverki.filter((c) => !c.ok).map((c) => c.imya).sort() };
}
const zamenit = (karta, url, f) => karta.set(url, f(karta.get(url)));

test('здоровый живой сайт — все проверки ok', async () => {
  const r = await progon();
  assert.equal(r.proverki.length, VSEGO);
  assert.deepEqual(r.plokho, []);
  assert.ok(r.spravki.some((s) => s.includes('блок хостера «adm.tools Managed content»')), r.spravki.join(' | '));
  assert.ok(r.spravki.some((s) => s.includes('Cf-Cache-Status DYNAMIC') && s.includes('HIT')), r.spravki.join(' | '));
});

test('домен не подключён (имя не разрешается) — 0 из 26', async () => {
  const r = await progon(() => {}, { vse: () => otvet('сеть: ENOTFOUND') });
  assert.equal(r.proverki.length, VSEGO);
  assert.equal(r.plokho.length, VSEGO);
});

test('домен ведёт на хостер, сайт не заведён («not configured») — 0 из 26', async () => {
  const zaglushka = otvet(404, '<html><body><h1>Website 7thserpent.com not configured</h1><p>Domain address record points to our server, but this site is not served</p></body></html>');
  const r = await progon(() => {}, { vse: (url) => (url.startsWith('https://') ? otvet(302, '', {}, url.replace('https://', 'http://')) : zaglushka) });
  assert.equal(r.plokho.length, VSEGO);
});

const PORCHI = [
  ['блок Cloudflare в robots.txt (управляемый robots.txt не снят)', (k) => zamenit(k, `${B}/robots.txt?live-check=${METKA}`, (o) => ({ ...o, telo: CLOUDFLARE + HOSTER + nashRobots })), ['robots.txt: блока Cloudflare нет']],
  ['чужая строка вне блоков', (k) => zamenit(k, `${B}/robots.txt?live-check=${METKA}`, (o) => ({ ...o, telo: 'User-agent: GPTBot\nDisallow: /\n\n' + HOSTER + nashRobots })), ['robots.txt: вне нашего файла — только блок хостера']],
  ['наш файл изменён (Allow → Disallow)', (k) => zamenit(k, `${B}/robots.txt?live-check=${METKA}`, (o) => ({ ...o, telo: HOSTER + nashRobots.replace('Allow: /', 'Disallow: /') })), ['robots.txt: вне нашего файла — только блок хостера', 'robots.txt: наш файл целиком']],
  ['блок хостера закрывает Googlebot', (k) => zamenit(k, `${B}/robots.txt?live-check=${METKA}`, (o) => ({ ...o, telo: HOSTER.replace('User-agent: MJ12bot', 'User-agent: Googlebot') + nashRobots })), ['robots.txt: вне нашего файла — только блок хостера']],
  ['блок хостера без END', (k) => zamenit(k, `${B}/robots.txt?live-check=${METKA}`, (o) => ({ ...o, telo: HOSTER.replace('# END adm.tools Managed content', '') + nashRobots })), ['robots.txt: вне нашего файла — только блок хостера']],
  ['robots.txt мимо кэша — 404', (k) => zamenit(k, `${B}/robots.txt?live-check=${METKA}`, () => otvet(404, stranica('/404/', title404))), ['robots.txt: Sitemap', 'robots.txt: блока Cloudflare нет', 'robots.txt: вне нашего файла — только блок хостера', 'robots.txt: наш файл целиком', 'robots.txt: статус (мимо кэша)']],
  ['robots.txt с CRLF — чисто', (k) => zamenit(k, `${B}/robots.txt?live-check=${METKA}`, (o) => ({ ...o, telo: (HOSTER + nashRobots).replace(/\n/g, '\r\n') })), []],
  ['из кэша — старая версия без Sitemap: справка, не отказ', (k) => zamenit(k, `${B}/robots.txt`, (o) => ({ ...o, telo: HOSTER + 'User-agent: *\nAllow: /\n' })), []],
  ['/privacy/ с __cf_email__', (k) => zamenit(k, `${B}/privacy/`, (o) => ({ ...o, telo: o.telo.replace('<p>text</p>', '<a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="1a2b">[email&#160;protected]</a>') })), ['/privacy/: без обфускации почты Cloudflare']],
  ['/privacy/ — 404', (k) => zamenit(k, `${B}/privacy/`, () => otvet(404, stranica('/404/', title404), HTML)), ['/privacy/: без обфускации почты Cloudflare', '/privacy/: статус', 'главная и /privacy/: без Set-Cookie']],
  ['Always Use HTTPS: http://голый → https://голый', (k) => k.set('http://7thserpent.com/', otvet(301, '', {}, 'https://7thserpent.com/')), [`http://7thserpent.com → https ${HOST}: Location`]],
  ['302 вместо 301', (k) => zamenit(k, `http://${HOST}/`, (o) => ({ ...o, status: 302 })), ['http → https: статус']],
  ['карта без /privacy/', (k) => k.set(`${B}/sitemap-0.xml`, otvet(200, urlset(KARTA.filter((u) => !u.endsWith('/privacy/'))))), ['sitemap-0.xml: адресов', 'sitemap-0.xml: адреса = структура']],
  ['карта с /404/', (k) => k.set(`${B}/sitemap-0.xml`, otvet(200, urlset([...KARTA, `${B}/404/`]))), ['sitemap-0.xml: адресов', 'sitemap-0.xml: адреса = структура']],
  ['карта: дубль вместо /privacy/ (тот же счёт)', (k) => k.set(`${B}/sitemap-0.xml`, otvet(200, urlset([...KARTA.filter((u) => !u.endsWith('/privacy/')), `${B}/`]))), ['sitemap-0.xml: адреса = структура']],
  ['индекс ведёт на sitemap-1.xml', (k) => zamenit(k, `${B}/sitemap-index.xml`, (o) => ({ ...o, telo: o.telo.replace('sitemap-0.xml', 'sitemap-1.xml') })), ['sitemap-index.xml: ведёт на sitemap-0.xml']],
  ['Set-Cookie на главной', (k) => zamenit(k, `${B}/`, (o) => ({ ...o, zagolovok: (i) => (i === 'set-cookie' ? '__cf_bm=abc; path=/' : o.zagolovok(i)) })), ['главная и /privacy/: без Set-Cookie']],
  ['несуществующий адрес — 404 хостера', (k) => k.set(`${B}/net-takoy-stranicy-${METKA}/`, otvet(404, '<html><head><title>404 Not Found</title></head></html>')), ['несуществующий адрес: наша страница']],
  ['несуществующий адрес — наша страница со статусом 200', (k) => zamenit(k, `${B}/net-takoy-stranicy-${METKA}/`, (o) => ({ ...o, status: 200 })), ['несуществующий адрес: статус']],
  ['Cache-Control без must-revalidate', (k) => zamenit(k, `${B}/`, (o) => ({ ...o, zagolovok: (i) => (i === 'cache-control' ? 'max-age=14400' : o.zagolovok(i)) })), ['главная: Cache-Control у HTML']],
  ['canonical на голый хост', (k) => zamenit(k, `${B}/`, (o) => ({ ...o, telo: o.telo.replace(`${B}/`, 'https://7thserpent.com/') })), ['главная: canonical']],
  ['два canonical', (k) => zamenit(k, `${B}/`, (o) => ({ ...o, telo: o.telo.replace('</head>', `<link rel="canonical" href="${B}/x/"></head>`) })), ['главная: canonical']],
  ['страница игры — 500', (k) => k.set(`${B}${igra}`, otvet(500)), [`страница ${igra}: статус`]],
  ['/404/ напрямую — 404', (k) => zamenit(k, `${B}/404/`, (o) => ({ ...o, status: 404 })), ['/404/ напрямую: статус']],
];

for (const [imya, izmenit, zhdem] of PORCHI) {
  test(`порча: ${imya}`, async () => {
    const r = await progon(izmenit);
    assert.equal(r.proverki.length, VSEGO);
    assert.deepEqual(r.plokho, [...zhdem].sort());
  });
}

test('из кэша — старая версия: справка называет кэш', async () => {
  const r = await progon((k) => zamenit(k, `${B}/robots.txt`, (o) => ({ ...o, telo: HOSTER + 'User-agent: *\nAllow: /\n' })));
  assert.ok(r.spravki.some((s) => s.includes('это кэш Cloudflare, не отказ')), r.spravki.join(' | '));
});

test('разбор robots.txt: наш файл только отдельными строками', () => {
  // Наш файл внутри комментария — не «наш файл целиком».
  const v = razobratRobots('# ' + nashRobots, nashRobots);
  assert.equal(v.nashCelikom, false);
  assert.equal(razobratRobots(nashRobots, nashRobots).nashCelikom, true);
  assert.deepEqual(razobratRobots(nashRobots + '\n', nashRobots).chuzhoyTekst, []);
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
