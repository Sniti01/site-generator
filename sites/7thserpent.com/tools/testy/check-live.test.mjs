// Пробы проверки живого сайта `tools/check-live.mjs` (П106, шаг 4) — на подставных ответах, без сети:
// образец здорового живого сайта (ответы — по обещаниям public/.htaccess, public/robots.txt, сборки и /privacy/,
// блок хостера в robots.txt — по докладу первой выкладки первого сайта: имена блоков записаны, байты — нет) и порчи.
// Сборка (`dist/`) в пробах — те же страницы, что у здорового сайта (живой HTML обязан быть равен ей побайтно).
// У каждой порчи — ровно какие проверки краснеют. Запрос вне образца — ошибка теста, а не тихий ответ.
// «Судью судят»: раунд 1 (CL1-P — «ложный ok», CL1-Z — «законные формы»), раунд 2 (CL2-P, CL2-Z) — порчами с их id.
// Сессия 23 (П108): Cloudflare на сайте нет — здоровый образец без него (заголовки хостера: `server: nginx`, замер
// 2026-09-29); образец с Cloudflare (`{ cf: true }` — прежний здоровый: Cloudflare проксирует все ответы) краснеет
// проверкой «запросы не идут через Cloudflare»; порчи возможностей Cloudflare (кэш, вызов, вставки, обфускация, cookies
// `__cf_*`, управляемый блок, Always Use HTTPS) идут на нём. Без кэша на пути robots.txt с параметром и без него — один
// ответ сервера: порча файла на сервере меняет оба (`oba`).
// Сессия 24 (П111): живой образец хостера — ответы прогона 1 live:check после первой выкладки и две пары robots.txt
// с параметром и без, байт в байт (`obrazec-khostera.json`): здоровый, 44 из 44; порчи идут на прежнем образце.
//   npm run proverki (сборка копии не нужна)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as CL from '../check-live.mjs';

const { proverit, razobratRobots, canonicalOf, SAYT } = CL;
const struktura = JSON.parse(readFileSync(join(SAYT, 'structure/structure.json'), 'utf8'));
const nashRobots = readFileSync(join(SAYT, 'public/robots.txt'), 'utf8');
const HOST = 'www.7thserpent.com';
const B = `https://${HOST}`;
const METKA = 'm1';
const VSEGO = 44;
const YASHCHIK = 'box@7thserpent.com';

const otvet = (status, telo = '', zag = {}, location = '') => ({
  status,
  location,
  telo,
  zagolovok: (i) => zag[i.toLowerCase()] ?? '',
});
const title404 = struktura.pages.find((p) => p.url === '/404/').title;
const igra = struktura.pages.find((p) => p.type === 'game').url;
const stranica = (url, title = 'x', telo = '<p>text</p>', golova = '') =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><link rel="canonical" href="${B}${url}">${golova}<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/_astro/index.Cz6femgl.css"><script type="module">document.querySelector('.hdr__burger')</script></head><body><header class="hdr" data-astro-cid-m3tnyskv></header><main>${telo}<img src="/_astro/hero.webp" alt="x" srcset="/_astro/hero.webp 1200w"></main></body></html>`;
const CF = { 'cf-ray': '8c1a2b3c4d5e6f70-WAW', server: 'cloudflare' };
// Сервер хостера без Cloudflare (П108; замер 2026-09-29 — `server: nginx`, `cf-ray` нет).
const SRV = { server: 'nginx' };
const HTML = { 'cache-control': 'public, max-age=0, must-revalidate', 'x-ray': 'p542:wal', 'content-type': 'text/html', ...SRV };
const HOSTER = '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n# END adm.tools Managed content\n\n';
const CLOUDFLARE =
  '# BEGIN Cloudflare Managed content\n# As a condition of accessing this website, you agree to abide by the following content signals:\nUser-agent: *\nContent-Signal: search=yes,ai-train=no\nAllow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n# END Cloudflare Managed Content\n\n';
const urlset = (urls) => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${u}</loc></url>`).join('')}</urlset>`;
const STRANICY = struktura.pages.filter((p) => p.url !== '/404/');
const KARTA = STRANICY.map((p) => `${B}${p.url}`);
// Строка ящика — в форме маршрута: абзац ряда текстом (маршрут экранирует разметку; ссылки mailto из содержания нет).
const PRIVACY = stranica('/privacy/', 'Privacy policy — 7thserpent.com', `<p>Requests about the hosting logs go to ${YASHCHIK}.</p>`);
const PUTI_SBORKI = [...struktura.pages.map((p) => p.url), '/_astro/index.Cz6femgl.css', '/_astro/hero.webp', '/favicon.svg', '/robots.txt', '/sitemap-index.xml', '/sitemap-0.xml'];

/** Образец здорового сайта без Cloudflare (П108): адрес → ответ. */
function zdorovyy() {
  const k = new Map();
  for (const put of ['/', igra]) {
    k.set(`http://${HOST}${put}`, otvet(301, '', SRV, `${B}${put}`));
    k.set(`https://7thserpent.com${put}`, otvet(301, '', SRV, `${B}${put}`));
    k.set(`http://7thserpent.com${put}`, otvet(301, '', SRV, `${B}${put}`));
  }
  for (const p of STRANICY) k.set(`${B}${p.url}`, otvet(200, stranica(p.url, p.title), HTML));
  k.set(`${B}/privacy/`, otvet(200, PRIVACY, HTML));
  k.set(`${B}/robots.txt?live-check=${METKA}`, otvet(200, HOSTER + nashRobots, SRV));
  k.set(`${B}/robots.txt`, otvet(200, HOSTER + nashRobots, SRV));
  k.set(`${B}/sitemap-index.xml`, otvet(200, `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${B}/sitemap-0.xml</loc></sitemap></sitemapindex>`, SRV));
  k.set(`${B}/sitemap-0.xml`, otvet(200, urlset(KARTA), SRV));
  k.set(`${B}/net-takoy-stranicy-${METKA}/`, otvet(404, stranica('/404/', title404), HTML));
  k.set(`${B}/404/`, otvet(200, stranica('/404/', title404), HTML));
  return k;
}

/** Образец с Cloudflare — прежний здоровый образец (до П108): Cloudflare проксирует все ответы (`cf-ray`, `server:
 *  cloudflare`), у страниц и robots.txt мимо кэша — `Cf-Cache-Status: DYNAMIC`, robots.txt без параметра — из кэша
 *  (HIT, Age 120). Всё остальное здорово: краснеет ровно «запросы не идут через Cloudflare». */
function sCloudflare(k) {
  for (const [u, o] of k) {
    const zag = { ...CF };
    if (/^text\/html/.test(o.zagolovok('content-type')) || u === `${B}/robots.txt?live-check=${METKA}`) zag['cf-cache-status'] = 'DYNAMIC';
    if (u === `${B}/robots.txt`) Object.assign(zag, { 'cf-cache-status': 'HIT', age: '120' });
    k.set(u, sZag(o, zag));
  }
}

/** Сборка из образца: HTML страниц по адресу (404 — `/404/`) и пути файлов. */
function sborkaIz(k) {
  return {
    stranica: (put) => k.get(`${B}${put}`)?.telo ?? null,
    puti: PUTI_SBORKI,
  };
}

async function progon(izmenit = () => {}, { vse, vSborke, cf } = {}) {
  const chistyy = zdorovyy();
  if (vSborke) vSborke(chistyy);
  const sborka = sborkaIz(chistyy);
  const karta = zdorovyy();
  if (vSborke) vSborke(karta);
  if (cf) sCloudflare(karta);
  izmenit(karta);
  // Значение образца — ответ или список ответов на повторные запросы того же адреса (CL3-P-1).
  const poluchit = async (url) => {
    if (vse) return vse(url);
    if (!karta.has(url)) throw new Error(`запрос вне образца: ${url}`);
    const o = karta.get(url);
    return Array.isArray(o) ? (o.length > 1 ? o.shift() : o[0]) : o;
  };
  const r = await proverit({ poluchit, host: HOST, struktura, nashRobots, metka: METKA, sborka });
  return {
    ...r,
    plokho: r.proverki.filter((c) => !c.ok).map((c) => c.imya).sort(),
    otkuda: r.proverki.filter((c) => !c.ok).map((c) => `${c.imya}: ${c.fakt} — ${c.otkuda}`).join(' | '),
    vse: r.proverki.map((c) => `${c.ok ? 'ok' : 'ПЛОХО'} ${c.imya}: ${c.fakt} — ${c.otkuda}`).join(' | '),
  };
}
const zamenit = (karta, url, f) => karta.set(url, f(karta.get(url)));
const sZag = (o, zag) => ({ ...o, zagolovok: (i) => (i.toLowerCase() in zag ? zag[i.toLowerCase()] : o.zagolovok(i)) });
const vTelo = (iz, na) => (o) => ({ ...o, telo: o.telo.replace(iz, na) });
const MIMO = `${B}/robots.txt?live-check=${METKA}`;
const BEZ = `${B}/robots.txt`;
/** Порча файла robots.txt на сервере без кэша на пути (П108): оба запроса — один ответ сервера. */
const oba = (f) => (k) => {
  zamenit(k, MIMO, f);
  zamenit(k, BEZ, f);
};
const BEZ_CF = 'запросы не идут через Cloudflare';
const S_VSE = 'sitemap-0.xml: адреса отвечают 200 со своим canonical';
const HTML_SB = 'HTML страниц = сборка (dist)';
const ZAPRET = 'страницы без запрета индексации';
const POISK = 'robots.txt: поисковики не закрыты';
const VNE = 'robots.txt: вне нашего файла — только блок хостера';
const CC = 'HTML: Cache-Control (max-age=0, must-revalidate)';
const KESH_HTML = 'HTML не из кэша Cloudflare';
const ADRES = '/privacy/: адрес ящика открытым текстом';
const BEZ_P = 'robots.txt без параметра (его берут роботы)';

test('здоровый живой сайт без Cloudflare (П108) — все 44 проверки ok', async () => {
  const r = await progon();
  assert.equal(r.proverki.length, VSEGO);
  assert.deepEqual(r.plokho, [], r.otkuda);
  assert.ok(r.spravki.some((s) => s.includes('блок хостера «adm.tools Managed content» перед нашим файлом')), r.spravki.join(' | '));
  // CL23-Z-4, CL23-P-1: без Cloudflare полей его кэша нет ни в строках проверок, ни в справках.
  assert.doesNotMatch(`${r.vse} | ${r.spravki.join(' | ')}`, /Cf-Cache-Status|Age —/, r.spravki.join(' | '));
  // CL2-Z-3: ни одна зелёная строка не говорит «Always Use HTTPS включён».
  assert.doesNotMatch(r.vse, /Always Use HTTPS/);
  // П108, подсказки «по делу»: зелёные строки не называют Cloudflare частью здорового сайта или настройкой его зоны.
  assert.doesNotMatch(r.vse, /Cloudflare снят|мимо кэша Cloudflare/, r.vse);
  assert.match(r.vse, new RegExp(`ok ${BEZ_CF}: true — ответов \\d+, следов Cloudflare нет`), r.vse);
});

test('CL2-P-9 (П108 — наоборот) образец с Cloudflare (прежний здоровый: Cloudflare проксирует всё) — 43 из 44, ПЛОХО ровно «запросы не идут через Cloudflare»', async () => {
  const r = await progon(() => {}, { cf: true });
  assert.equal(r.proverki.length, VSEGO);
  assert.deepEqual(r.plokho, [BEZ_CF], r.otkuda);
  assert.match(r.otkuda, /через Cloudflare: http:\/\/www\.7thserpent\.com\/ \(301; cf-ray, server: cloudflare\)/, r.otkuda);
  assert.match(r.otkuda, /и ещё \d+ — \/privacy\/ обещает/, r.otkuda);
  // CL23-P-1: при Cloudflare на пути ни одна строка не утверждает «Cloudflare на сайте нет»; поля его кэша — в справках.
  assert.doesNotMatch(r.vse, /Cloudflare на сайте нет/, r.vse);
  assert.match(r.otkuda, /Cloudflare на сайте быть не должно \(П108\)/, r.otkuda);
  assert.ok(r.spravki.some((s) => s.includes('мимо кэша: Cf-Cache-Status DYNAMIC')), r.spravki.join(' | '));
  assert.ok(r.spravki.some((s) => s.includes('без параметра: Cf-Cache-Status HIT, Age 120')), r.spravki.join(' | '));
});

test('домен не подключён (имя не разрешается) — 0 из 44', async () => {
  const r = await progon(() => {}, { vse: () => otvet('сеть: ENOTFOUND') });
  assert.equal(r.proverki.length, VSEGO);
  assert.equal(r.plokho.length, VSEGO, r.vse);
});

test('домен ведёт на хостер, сайт не заведён («not configured») — 0 из 44', async () => {
  const zaglushka = otvet(404, '<html><body><h1>Website 7thserpent.com not configured</h1><p>Domain address record points to our server, but this site is not served</p></body></html>');
  const r = await progon(() => {}, { vse: (url) => (url.startsWith('https://') ? otvet(302, '', {}, url.replace('https://', 'http://')) : zaglushka) });
  assert.equal(r.plokho.length, VSEGO, r.vse);
});

/* — Живой образец хостера (сессия 24, П111): ответы прогона 1 live:check 2026-09-29 после первой выкладки и две пары
 *   robots.txt с параметром и без — замер байт в байт (`obrazec-khostera.json`; бэклог 71 п. 6, 72 п. 1–2). Статусы,
 *   Location и заголовки — замера, тела robots.txt — замера; тела HTML и карт — здорового образца (страница = сборка,
 *   карта = структура). — */
const OBRAZEC = JSON.parse(readFileSync(join(SAYT, 'tools/testy/obrazec-khostera.json'), 'utf8'));
/** Ответ замера: статус, Location и заголовки (fetch отдаёт имена строчными); тело — записанное или `telo`. */
const izZamera = (o, telo = '') => {
  const zag = Object.fromEntries(o.zagolovki);
  return otvet(o.status, o.telo ?? telo, zag, zag.location ?? '');
};
/** Здоровый образец → ответы замера по тем же адресам (метка прогона 1 → METKA); пара robots.txt — поверх. */
const sZamerom = (para) => (k) => {
  for (const [u, o] of Object.entries(OBRAZEC.otvety)) {
    const url = u.replace(OBRAZEC.metka, METKA);
    assert.ok(k.has(url), `адрес замера вне образца: ${url}`);
    k.set(url, izZamera(o, k.get(url).telo));
  }
  if (para) {
    k.set(MIMO, izZamera(para.s));
    k.set(BEZ, izZamera(para.bez));
  }
};
const PARY_ZAMERA = [
  { para: 'прогона 1', s: OBRAZEC.otvety[`${B}/robots.txt?live-check=${OBRAZEC.metka}`], bez: OBRAZEC.otvety[`${B}/robots.txt`] },
  ...OBRAZEC.robotsPary,
];

test('живой образец хостера: замер цел — тела robots.txt байт в байт, наш файл — нынешний public/robots.txt; внутри пар тела равны, у HTML нет Age и X-Cache-Status', () => {
  const sha = (t) => createHash('sha256').update(Buffer.from(t, 'utf8')).digest('hex');
  for (const p of PARY_ZAMERA) {
    for (const o of [p.s, p.bez]) {
      assert.equal(sha(o.telo), o.sha256, `пара ${p.para}: тело не то, что записано`);
      // Образец снят с public/robots.txt сборки add241a: наш файл изменился — снять образец заново после выкладки.
      assert.ok(o.telo.endsWith(nashRobots), `пара ${p.para}: в образце не нынешний public/robots.txt`);
    }
    // CL23-Z-1, CL23-Z-2 — пределы: по замеру тела с параметром и без равны, смягчать проверку 4 нечего (П111).
    assert.equal(p.s.telo, p.bez.telo, `пара ${p.para}: тела с параметром и без различаются`);
  }
  // CL23-P-3 — предел: по замеру признаков кэша у HTML нет (П111).
  const html = Object.entries(OBRAZEC.otvety).filter(([, o]) => o.status !== 301 && /^text\/html/.test(Object.fromEntries(o.zagolovki)['content-type'] ?? ''));
  assert.equal(html.length, 19);
  for (const [u, o] of html) assert.ok(!o.zagolovki.some(([k]) => k === 'age' || k === 'x-cache-status'), `${u}: признак кэша в замере`);
});

for (const para of [null, ...OBRAZEC.robotsPary]) {
  test(`живой образец хостера: ответы прогона 1${para ? `, robots.txt — пара ${para.para}` : ''} — 44 из 44`, async () => {
    const r = await progon(sZamerom(para));
    assert.equal(r.proverki.length, VSEGO);
    assert.deepEqual(r.plokho, [], r.otkuda);
    assert.ok(r.spravki.some((s) => s.includes('блок хостера «adm.tools Managed content» перед нашим файлом, строк 13')), r.spravki.join(' | '));
    assert.ok(r.spravki.some((s) => s.startsWith('x-ray wnp190:')), r.spravki.join(' | '));
  });
}

const MIMO_PROVERKI = ['robots.txt мимо кэша: статус', 'robots.txt мимо кэша: обход кэша сработал', 'robots.txt: наш файл целиком', 'robots.txt: блока Cloudflare нет', VNE, POISK, 'robots.txt: строка Sitemap'];
const vBlokKhostera = (iz, na) => oba((o) => ({ ...o, telo: HOSTER.replace(iz, na) + nashRobots }));
const PORCHI = [
  // — robots.txt мимо кэша —
  ['блок Cloudflare (Cloudflare включили с управляемым robots.txt)', (k) => zamenit(k, MIMO, vTelo(HOSTER, CLOUDFLARE + HOSTER)), ['robots.txt: блока Cloudflare нет', BEZ_CF], { cf: true }],
  ['чужая группа вне блоков', oba(vTelo(HOSTER, 'User-agent: GPTBot\nDisallow: /\n\n' + HOSTER)), [VNE]],
  ['наш файл изменён (Allow → Disallow)', oba((o) => ({ ...o, telo: HOSTER + nashRobots.replace('Allow: /', 'Disallow: /') })), [VNE, 'robots.txt: наш файл целиком', POISK]],
  ['блок хостера закрывает Googlebot', vBlokKhostera('User-agent: MJ12bot', 'User-agent: Googlebot'), [POISK, VNE]],
  ['блок хостера без END', oba(vTelo('# END adm.tools Managed content', '')), [VNE]],
  ['robots.txt мимо кэша — 404', (k) => zamenit(k, MIMO, () => otvet(404, stranica('/404/', title404), SRV)), MIMO_PROVERKI],
  ['robots.txt с CRLF — чисто', oba((o) => ({ ...o, telo: o.telo.replace(/\n/g, '\r\n') })), []],
  ['CL1-P-9a блок хостера: Googlebot, «Disallow /» без двоеточия', vBlokKhostera('User-agent: MJ12bot\nDisallow: /', 'User-agent: Googlebot\nDisallow /'), [POISK, VNE]],
  ['CL1-P-9b блок хостера: Googlebot, «Dissallow: /»', vBlokKhostera('User-agent: MJ12bot\nDisallow: /', 'User-agent: Googlebot\nDissallow: /'), [POISK, VNE]],
  ['CL1-P-9c блок хостера: «User agent: Googlebot»', vBlokKhostera('User-agent: MJ12bot', 'User agent: Googlebot'), [POISK, VNE]],
  ['CL1-P-10 правило в блоке после нашего файла продолжает нашу группу', oba((o) => ({ ...o, telo: nashRobots + '\n# BEGIN adm.tools Managed content\nDisallow: /*\n# END adm.tools Managed content\n' })), [POISK, VNE]],
  ['CL3-P-5 блок без User-agent после нашего файла закрывает /movie/', oba((o) => ({ ...o, telo: nashRobots + '\n# BEGIN adm.tools Managed content\nDisallow: /movie/\n# END adm.tools Managed content\n' })), [POISK, VNE]],
  ['CL3-P-5, CL3-Z-3 блок без User-agent: запреты вне сборки (/*?, /wp-admin/) — справка', oba((o) => ({ ...o, telo: nashRobots + '\n# BEGIN adm.tools Managed content\nDisallow: /*?\nDisallow: /wp-admin/\n# END adm.tools Managed content\n' })), []],
  ['CL3-Z-3 блок хостера: * закрывает /cgi-bin/ и /.well-known/ — вне сборки, справка', vBlokKhostera('User-agent: MJ12bot\nDisallow: /', 'User-agent: *\nDisallow: /cgi-bin/\nDisallow: /.well-known/'), []],
  ['CL3-Z-4 блок хостера: * закрывает файлы с точкой (/.) — их нет среди путей сборки', vBlokKhostera('User-agent: MJ12bot\nDisallow: /', 'User-agent: *\nDisallow: /.'), []],
  ['CL1-Z-2 «Disallow: # комментарий» в группе * хостера — чисто', vBlokKhostera('User-agent: MJ12bot\nDisallow: /', 'User-agent: *\nDisallow: # nothing is blocked for other robots'), []],
  ['CL1-Z-5 комментарий хостера вне меток — справка, не отказ', oba((o) => ({ ...o, telo: '# robots.txt served by adm.tools hosting\n' + HOSTER + '#\n' + nashRobots })), []],
  ['CL2-P-1a блок хостера: * закрывает /movie/ и /cheats/', vBlokKhostera('User-agent: MJ12bot\nDisallow: /', 'User-agent: *\nDisallow: /movie/\nDisallow: /cheats/'), [POISK, VNE]],
  ['CL2-P-1b блок хостера: * закрывает CSS', vBlokKhostera('User-agent: MJ12bot\nDisallow: /', 'User-agent: *\nDisallow: /*.css$'), [POISK, VNE]],
  ['CL2-P-1c блок хостера: Googlebot-Image закрыт', vBlokKhostera('User-agent: MJ12bot', 'User-agent: Googlebot-Image'), [POISK, VNE]],
  ['CL2-P-1 блок хостера: msnbot закрыт — Bingbot следует его группе (CL3-Z-3)', vBlokKhostera('User-agent: MJ12bot', 'User-agent: msnbot'), [POISK, VNE]],
  ['CL2-P-5a «User-agents: Googlebot»', vBlokKhostera('User-agent: MJ12bot', 'User-agents: Googlebot'), [POISK, VNE]],
  ['CL2-P-5b «Disallowed: /»', vBlokKhostera('User-agent: MJ12bot\nDisallow: /', 'User-agent: Googlebot\nDisallowed: /'), [POISK, VNE]],
  ['CL2-P-5c «User-agent: * (all robots)»', vBlokKhostera('User-agent: MJ12bot\nDisallow: /', 'User-agent: * (all robots)\nDisallow: /*'), [POISK, VNE]],
  // CL1-P-2, CL1-Z-1: «мимо кэша» пришло из кэша — обход не удался; свои строки не «чужие».
  ['CL1-P-2 мимо кэша — HIT старой версии нашего файла', (k) => zamenit(k, MIMO, () => otvet(200, HOSTER + nashRobots.replace('# A static site (Astro).', '# A static site.'), { 'cf-cache-status': 'HIT', age: '9120', ...CF })), ['robots.txt мимо кэша: обход кэша сработал', 'robots.txt: наш файл целиком', BEZ_CF], { cf: true }],
  ['CL2-Z-5 мимо кэша — REVALIDATED (сверено с сервером) — краснеет только след Cloudflare', (k) => zamenit(k, MIMO, (o) => sZag(o, { 'cf-cache-status': 'REVALIDATED' })), [BEZ_CF], { cf: true }],
  // — robots.txt без параметра (CL1-P-1, CL2-P-4, CL2-Z-9): его берут роботы; кэш на пути — только у Cloudflare —
  ['из кэша — старая безвредная версия без Sitemap: справка, не отказ', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER + 'User-agent: *\nAllow: /\n' })), [BEZ_CF], { cf: true }],
  ['П108 без Cloudflare: без параметра — другой файл, кэша на пути нет — отдаёт не наш сервер', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER + 'User-agent: *\nAllow: /\n' })), [BEZ_P]],
  ['CL1-P-1a без параметра — HIT, «Disallow: /» для всех', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: 'User-agent: *\nDisallow: /\n' })), [BEZ_P, BEZ_CF], { cf: true }],
  ['CL1-P-1b без параметра — DYNAMIC, отличается от ответа мимо кэша', (k) => zamenit(k, BEZ, () => otvet(200, HOSTER + 'User-agent: *\nAllow: /\n', { 'cf-cache-status': 'DYNAMIC', ...CF })), [BEZ_P, BEZ_CF], { cf: true }],
  ['CL1-P-1c без параметра — 503', (k) => zamenit(k, BEZ, () => otvet(503, 'Service Unavailable', SRV)), [BEZ_P]],
  ['CL2-P-4a без параметра из кэша — с блоком Cloudflare', (k) => zamenit(k, BEZ, vTelo(HOSTER, CLOUDFLARE + HOSTER)), [BEZ_P, BEZ_CF], { cf: true }],
  ['CL2-P-4b без параметра из кэша — группы GPTBot вне блоков', (k) => zamenit(k, BEZ, vTelo(HOSTER, 'User-agent: GPTBot\nDisallow: /\n\n' + HOSTER)), [BEZ_P, BEZ_CF], { cf: true }],
  // Решение раунда 2: копия из кэша без нашего файла, но и без вреда (ничего не закрыто, чужого нет) теряет только
  // строку Sitemap — та же безвредная разница, что «старая версия без Sitemap»: справка, не отказ.
  ['CL2-P-4c без параметра из кэша — нашего файла нет, вреда нет: справка', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER })), [BEZ_CF], { cf: true }],
  ['адрес ящика на поддомене-двойнике — не наш', () => {}, [ADRES], { vSborke: (k) => k.set(`${B}/privacy/`, otvet(200, stranica('/privacy/', 'Privacy policy — 7thserpent.com', '<p>Write to box@7thserpent.com.evil.example.</p>'), HTML)) }],
  ['CL3-Z-5 без параметра из кэша — прежняя редакция нашего файла (Sitemap с голого хоста) — справка', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER + nashRobots.replace(`Sitemap: ${B}/`, 'Sitemap: https://7thserpent.com/') })), [BEZ_CF], { cf: true }],
  ['CL3-Z-5 без параметра из кэша — Sitemap на чужой хост — вред', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER + nashRobots.replace(`Sitemap: ${B}/`, 'Sitemap: https://evil.example/') })), [BEZ_P, BEZ_CF], { cf: true }],
  ['CL2-Z-9 мимо кэша — вызов Cloudflare, без параметра здоров (MISS) — без параметра судится сам', (k) => { zamenit(k, MIMO, () => otvet(403, '<title>Just a moment...</title>', { 'cf-mitigated': 'challenge', ...CF })); zamenit(k, BEZ, (o) => sZag(o, { 'cf-cache-status': 'MISS' })); }, [...MIMO_PROVERKI, BEZ_CF], { cf: true }],
  // — HTML (CL1-P-3, CL1-P-4, CL2-P-2): все страницы —
  ['CL1-P-3a Cache-Control: max-age=14400 и must-revalidate', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'cache-control': 'public, max-age=14400, must-revalidate' })), [CC]],
  ['CL1-P-3b два Cache-Control, склеенные fetch', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'cache-control': 'max-age=14400, public, max-age=0, must-revalidate' })), [CC]],
  ['Cache-Control без must-revalidate', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'cache-control': 'max-age=0' })), [CC]],
  ['CL2-P-2 s-maxage=86400 на главной', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'cache-control': 'public, max-age=0, s-maxage=86400, must-revalidate' })), [CC]],
  ['CL2-P-2 CDN-Cache-Control: max-age=86400', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'cdn-cache-control': 'max-age=86400' })), [CC]],
  ['CL2-P-2 max-age=86400 на странице фильма', (k) => zamenit(k, `${B}/movie/`, (o) => sZag(o, { 'cache-control': 'max-age=86400' })), [CC]],
  ['CL1-P-4 главная из кэша Cloudflare', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'cf-cache-status': 'HIT', age: '5400' })), [KESH_HTML, BEZ_CF], { cf: true }],
  ['CL3-P-1 главная MISS, повтор — HIT (Edge TTL)', (k) => { const o = k.get(`${B}/`); k.set(`${B}/`, [sZag(o, { 'cf-cache-status': 'MISS' }), sZag(o, { 'cf-cache-status': 'HIT', age: '7200' })]); }, [KESH_HTML, BEZ_CF], { cf: true }],
  ['CL3-P-1 главная MISS, повтор — REVALIDATED — краснеет только след Cloudflare', (k) => { const o = k.get(`${B}/`); k.set(`${B}/`, [sZag(o, { 'cf-cache-status': 'MISS' }), sZag(o, { 'cf-cache-status': 'REVALIDATED' })]); }, [BEZ_CF], { cf: true }],
  ['CL3-P-7 s-maxage в кавычках', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'cache-control': 'public, max-age=0, s-maxage="86400", must-revalidate' })), [CC]],
  ['CL3-P-7 два s-maxage: 0 и 86400', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'cache-control': 'public, max-age=0, s-maxage=0, s-maxage=86400, must-revalidate' })), [CC]],
  ['CL3-P-4 Content-Type: windows-1251 на странице фильма', (k) => zamenit(k, `${B}/movie/`, (o) => sZag(o, { 'content-type': 'text/html; charset=windows-1251' })), [HTML_SB]],
  ['CL3-P-4 Content-Type: text/plain на главной', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'content-type': 'text/plain' })), [HTML_SB]],
  ['CL3-P-2 (П108 — наоборот) через Cloudflare только голый хост: его редиректы с cf-ray', (k) => { for (const put of ['/', igra]) for (const u of [`https://7thserpent.com${put}`, `http://7thserpent.com${put}`]) zamenit(k, u, (o) => sZag(o, CF)); }, [BEZ_CF]],
  ['CL3-Z-1 сайт выложен сборкой другой машины: иные cid ядра и хеш имени CSS — чисто', (k) => { for (const p of [...STRANICY.map((x) => x.url), '/404/', `/net-takoy-stranicy-${METKA}/`]) zamenit(k, `${B}${p}`, (o) => ({ ...o, telo: o.telo.split('data-astro-cid-m3tnyskv').join('data-astro-cid-545q7pxz').split('index.Cz6femgl.css').join('index.Q1w2E3r4.css') })); }, []],
  ['CL2-P-2 страница фильма из кэша Cloudflare', (k) => zamenit(k, `${B}/movie/`, (o) => sZag(o, { 'cf-cache-status': 'HIT', age: '86400' })), [KESH_HTML, BEZ_CF], { cf: true }],
  ['CL2-Z-5 главная REVALIDATED — сверено с сервером, краснеет только след Cloudflare', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'cf-cache-status': 'REVALIDATED' })), [BEZ_CF], { cf: true }],
  ['canonical главной на голый хост', (k) => zamenit(k, `${B}/`, vTelo(`${B}/"`, 'https://7thserpent.com/"')), ['главная: canonical', S_VSE, HTML_SB]],
  ['два canonical на главной', (k) => zamenit(k, `${B}/`, vTelo('</head>', `<link rel="canonical" href="${B}/x/"></head>`)), ['главная: canonical', S_VSE, HTML_SB]],
  ['CL2-P-8 canonical игры только в комментарии (и в сборке)', () => {}, [`страница ${igra}: canonical`, S_VSE], { vSborke: (k) => zamenit(k, `${B}${igra}`, vTelo(/<link rel="canonical"[^>]*>/, (m) => `<!-- ${m} -->`)) }],
  // — вставки и чужие ресурсы (CL1-P-6, CL2-P-3): HTML = сборка —
  ['CL1-P-6 вставки Cloudflare: Web Analytics и JS detections', (k) => {
    for (const u of [`${B}/`, `${B}/privacy/`]) zamenit(k, u, vTelo('</main>', "</main><script defer src=\"https://static.cloudflareinsights.com/beacon.min.js/v8b\" data-cf-beacon='{\"token\":\"x\"}'></script><script>a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js'</script>"));
  }, [HTML_SB, BEZ_CF], { cf: true }],
  ['чужая таблица стилей на главной', (k) => zamenit(k, `${B}/`, vTelo('</head>', '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=X"></head>')), [HTML_SB]],
  ['CL2-P-3 srcset на чужой хост', (k) => zamenit(k, `${B}/privacy/`, vTelo('/_astro/hero.webp 1200w', 'https://cdn.tracker.example/x.webp 1200w')), [HTML_SB]],
  ['CL2-P-3 base href на чужой хост', (k) => zamenit(k, `${B}/privacy/`, vTelo('<meta charset="utf-8">', '<meta charset="utf-8"><base href="https://cdn.tracker.example/">')), [HTML_SB]],
  ['CL2-P-3 встроенный скрипт: sendBeacon и cookie', (k) => zamenit(k, `${B}/privacy/`, vTelo('</main>', "</main><script>navigator.sendBeacon('https://t.example/b');document.cookie='x=1'</script>")), [HTML_SB]],
  ['CL2-P-3 вставка Cloudflare (Zaraz) только на 404', (k) => zamenit(k, `${B}/net-takoy-stranicy-${METKA}/`, vTelo('</main>', '</main><script src="/cdn-cgi/zaraz/i.js"></script>')), [HTML_SB, BEZ_CF], { cf: true }],
  ['CL2-Z-4 вызов Cloudflare на двух адресах карты — причина в строке карты, не «вставка»', (k) => { for (const u of ['/pc/', '/quotes/']) k.set(`${B}${u}`, otvet(403, '<html><head><title>Just a moment...</title></head><body><script src="/cdn-cgi/challenge-platform/h/b/orchestrate/chl_page/v1"></script></body></html>', { 'cf-mitigated': 'challenge', ...CF })); }, [S_VSE, BEZ_CF], { cf: true }],
  // — запрет индексации (CL1-P-13, CL2-P-6, CL2-Z-6) —
  ['CL1-P-13 X-Robots-Tag: noindex на страницах', (k) => { for (const p of STRANICY) zamenit(k, `${B}${p.url}`, (o) => sZag(o, { 'x-robots-tag': 'noindex, nofollow' })); }, [ZAPRET]],
  ['CL2-P-6 X-Robots-Tag: unavailable_after', (k) => zamenit(k, `${B}/movie/`, (o) => sZag(o, { 'x-robots-tag': 'unavailable_after: 2020-01-01' })), [ZAPRET]],
  ['CL2-P-6 X-Robots-Tag: googlebot: none', (k) => zamenit(k, `${B}/privacy/`, (o) => sZag(o, { 'x-robots-tag': 'googlebot: none' })), [ZAPRET]],
  ['CL2-P-6 meta robots noindex в самой сборке', () => {}, [ZAPRET], { vSborke: (k) => zamenit(k, `${B}/movie/`, vTelo('<meta charset="utf-8">', '<meta charset="utf-8"><meta name="robots" content="noindex">')) }],
  ['CL3-P-3 X-Robots-Tag двумя полями, склеенными fetch: «otherbot: noarchive, noindex»', (k) => zamenit(k, `${B}/privacy/`, (o) => sZag(o, { 'x-robots-tag': 'otherbot: noarchive, noindex' })), [ZAPRET]],
  ['X-Robots-Tag: GPTBot: noindex — чужой бот своим префиксом — чисто', (k) => zamenit(k, `${B}/privacy/`, (o) => sZag(o, { 'x-robots-tag': 'GPTBot: noindex' })), []],
  ['CL2-Z-6 X-Robots-Tag: max-image-preview:none — чисто', (k) => { for (const p of STRANICY) zamenit(k, `${B}${p.url}`, (o) => sZag(o, { 'x-robots-tag': 'max-image-preview:none, noarchive' })); }, []],
  ['CL2-Z-6 X-Robots-Tag: noindex только на ответе 404 — чисто', (k) => zamenit(k, `${B}/net-takoy-stranicy-${METKA}/`, (o) => sZag(o, { 'x-robots-tag': 'noindex' })), []],
  // — cookies (CL1-P-12) —
  ['CL1-P-12 Set-Cookie Cloudflare на странице игры и на 404', (k) => { zamenit(k, `${B}${igra}`, (o) => sZag(o, { 'set-cookie': '_cfuvid=abc; path=/' })); zamenit(k, `${B}/net-takoy-stranicy-${METKA}/`, (o) => sZag(o, { 'set-cookie': '_cfuvid=abc; path=/' })); }, ['ответы без Set-Cookie', BEZ_CF], { cf: true }],
  ['Set-Cookie Cloudflare на главной', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'set-cookie': '__cf_bm=abc; path=/' })), ['ответы без Set-Cookie', BEZ_CF], { cf: true }],
  ['П108 Set-Cookie сервера хостера на главной', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'set-cookie': 'PHPSESSID=abc; path=/' })), ['ответы без Set-Cookie']],
  // — Cloudflare на пути (П108: следа Cloudflare быть не должно ни у одного ответа; весь образец с Cloudflare — отдельный тест CL2-P-9) —
  ['П108 след Cloudflare только server: cloudflare — у главной', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { server: 'cloudflare' })), [BEZ_CF]],
  ['П108 след Cloudflare только cf-ray — у robots.txt без параметра', (k) => zamenit(k, BEZ, (o) => sZag(o, { 'cf-ray': '8c1a2b3c4d5e6f70-WAW' })), [BEZ_CF]],
  ['П108 след Cloudflare только Cf-Cache-Status — у карты сайта', (k) => zamenit(k, `${B}/sitemap-0.xml`, (o) => sZag(o, { 'cf-cache-status': 'DYNAMIC' })), [BEZ_CF]],
  ['П108 след Cloudflare только cf-mitigated — у страницы фильма', (k) => zamenit(k, `${B}/movie/`, (o) => sZag(o, { 'cf-mitigated': 'challenge' })), [BEZ_CF]],
  // — редиректы (CL1-P-5) —
  ['CL1-P-5 редирект страницы теряет путь', (k) => { for (const u of [`http://${HOST}${igra}`, `https://7thserpent.com${igra}`, `http://7thserpent.com${igra}`]) k.set(u, otvet(301, '', SRV, `${B}/`)); }, [`http → https ${igra}: Location`, `голый → www ${igra}: Location`, `http голый → https www ${igra}: Location`]],
  ['П108 переадресация на https у хостера: http://голый → https://голый (второй скачок)', (k) => k.set('http://7thserpent.com/', otvet(301, '', SRV, 'https://7thserpent.com/')), ['http голый → https www /: Location']],
  ['Always Use HTTPS (Cloudflare включили): http://голый → https://голый', (k) => k.set('http://7thserpent.com/', otvet(301, '', CF, 'https://7thserpent.com/')), ['http голый → https www /: Location', BEZ_CF], { cf: true }],
  ['302 вместо 301', (k) => zamenit(k, `http://${HOST}/`, (o) => ({ ...o, status: 302 })), ['http → https /: статус']],
  // — карта (CL1-P-14) —
  ['карта без /privacy/', (k) => k.set(`${B}/sitemap-0.xml`, otvet(200, urlset(KARTA.filter((u) => !u.endsWith('/privacy/'))), SRV)), ['sitemap-0.xml: адресов', 'sitemap-0.xml: адреса = структура']],
  ['карта с /404/', (k) => k.set(`${B}/sitemap-0.xml`, otvet(200, urlset([...KARTA, `${B}/404/`]), SRV)), ['sitemap-0.xml: адресов', 'sitemap-0.xml: адреса = структура']],
  ['карта: дубль вместо /privacy/ (тот же счёт)', (k) => k.set(`${B}/sitemap-0.xml`, otvet(200, urlset([...KARTA.filter((u) => !u.endsWith('/privacy/')), `${B}/`]), SRV)), ['sitemap-0.xml: адреса = структура']],
  ['индекс ведёт на sitemap-1.xml', (k) => zamenit(k, `${B}/sitemap-index.xml`, vTelo('sitemap-0.xml', 'sitemap-1.xml')), ['sitemap-index.xml: ведёт на sitemap-0.xml']],
  ['CL1-P-14 14 из 17 адресов карты — 404', (k) => { for (const p of STRANICY.filter((x) => !['/', igra, '/privacy/'].includes(x.url))) k.set(`${B}${p.url}`, otvet(404, stranica('/404/', title404), HTML)); }, [S_VSE]],
  // — 404, страница игры, /privacy/ (CL1-P-7) —
  ['несуществующий адрес — 404 хостера', (k) => k.set(`${B}/net-takoy-stranicy-${METKA}/`, otvet(404, '<html><head><title>404 Not Found</title></head></html>', SRV)), ['несуществующий адрес: наша страница']],
  ['несуществующий адрес — наша страница со статусом 200', (k) => zamenit(k, `${B}/net-takoy-stranicy-${METKA}/`, (o) => ({ ...o, status: 200 })), ['несуществующий адрес: статус']],
  ['/404/ напрямую — 404', (k) => zamenit(k, `${B}/404/`, (o) => ({ ...o, status: 404 })), ['/404/ напрямую: статус']],
  ['страница игры — 500', (k) => k.set(`${B}${igra}`, otvet(500, '', SRV)), [`страница ${igra}: статус`, `страница ${igra}: canonical`, S_VSE]],
  ['CL1-P-7 страница игры — список каталога Apache', (k) => k.set(`${B}${igra}`, otvet(200, `<html><head><title>Index of ${igra}</title></head><body><h1>Index of ${igra}</h1></body></html>`, HTML)), [`страница ${igra}: canonical`, S_VSE, HTML_SB]],
  // — ящик (CL1-P-8, CL2-Z-1, CL2-Z-2, CL2-P-7) —
  ['CL2-Z-1 адрес ящика ссылкой mailto — тоже чисто', () => {}, [], { vSborke: (k) => k.set(`${B}/privacy/`, otvet(200, stranica('/privacy/', 'Privacy policy — 7thserpent.com', `<p>Write to <a href="mailto:${YASHCHIK}">${YASHCHIK}</a>.</p>`), HTML)) }],
  ['CL2-Z-1 адрес ящика с &#64; — чисто', () => {}, [], { vSborke: (k) => k.set(`${B}/privacy/`, otvet(200, stranica('/privacy/', 'Privacy policy — 7thserpent.com', '<p>Write to box&#64;7thserpent.com.</p>'), HTML)) }],
  ['/privacy/ с __cf_email__ вместо адреса (обфускация Cloudflare)', (k) => zamenit(k, `${B}/privacy/`, vTelo(YASHCHIK, '<a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="1a2b">[email&#160;protected]</a><script src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script>')), [ADRES, '/privacy/: без обфускации почты Cloudflare', HTML_SB, BEZ_CF], { cf: true }],
  ['CL1-P-8 /privacy/ без адреса ящика (и в сборке)', () => {}, [ADRES], { vSborke: (k) => k.set(`${B}/privacy/`, otvet(200, stranica('/privacy/', 'Privacy policy — 7thserpent.com'), HTML)) }],
  ['CL2-P-7 адрес ящика первого сайта', () => {}, [ADRES], { vSborke: (k) => k.set(`${B}/privacy/`, otvet(200, stranica('/privacy/', 'Privacy policy — 7thserpent.com', '<p>Write to jakub@ac4bf-thewatch.com.</p>'), HTML)) }],
  ['CL2-P-7 адрес ящика только в комментарии', () => {}, [ADRES], { vSborke: (k) => k.set(`${B}/privacy/`, otvet(200, stranica('/privacy/', 'Privacy policy — 7thserpent.com', `<p>Write to us.</p><!-- ${YASHCHIK} -->`), HTML)) }],
  ['/privacy/ — 404', (k) => zamenit(k, `${B}/privacy/`, () => otvet(404, stranica('/404/', title404), HTML)), ['/privacy/: статус', '/privacy/: canonical', '/privacy/: без обфускации почты Cloudflare', ADRES, S_VSE]],
  ['CL3-P-6 адрес ящика только в <title>', () => {}, [ADRES], { vSborke: (k) => k.set(`${B}/privacy/`, otvet(200, stranica('/privacy/', `Privacy policy — ${YASHCHIK}`), HTML)) }],
  ['CL3-P-6 адрес ящика только в <p hidden>', () => {}, [ADRES], { vSborke: (k) => k.set(`${B}/privacy/`, otvet(200, stranica('/privacy/', 'Privacy policy — 7thserpent.com', `<p>Write to us.</p><p hidden>${YASHCHIK}</p>`), HTML)) }],
  ['CL3-P-6 адрес ящика только в <noscript>', () => {}, [ADRES], { vSborke: (k) => k.set(`${B}/privacy/`, otvet(200, stranica('/privacy/', 'Privacy policy — 7thserpent.com', `<p>Write to us.</p><noscript>${YASHCHIK}</noscript>`), HTML)) }],
];

for (const [imya, izmenit, zhdem, opcii] of PORCHI) {
  test(`порча: ${imya}`, async () => {
    const r = await progon(izmenit, opcii);
    assert.equal(r.proverki.length, VSEGO);
    assert.deepEqual(r.plokho, [...zhdem].sort(), r.otkuda);
  });
}

test('справки: кэш, положение блока хостера, комментарии вне меток', async () => {
  const kesh = await progon((k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER + 'User-agent: *\nAllow: /\n' })), { cf: true });
  assert.ok(kesh.spravki.some((s) => s.includes('это кэш Cloudflare, не отказ')), kesh.spravki.join(' | '));
  const posle = await progon(oba((o) => ({ ...o, telo: nashRobots + '\n' + HOSTER })));
  assert.deepEqual(posle.plokho, []);
  assert.ok(posle.spravki.some((s) => s.includes('после нашего файла')), posle.spravki.join(' | '));
  const komm = await progon(oba((o) => ({ ...o, telo: '# robots.txt served by adm.tools hosting\n' + HOSTER + nashRobots })));
  assert.ok(komm.spravki.some((s) => s.includes('# robots.txt served by adm.tools hosting')), komm.spravki.join(' | '));
  const miss = await progon((k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'cf-cache-status': 'MISS' })), { cf: true });
  assert.deepEqual(miss.plokho, [BEZ_CF]);
  assert.ok(miss.spravki.some((s) => s.includes('Cloudflare кладёт HTML в кэш')), miss.spravki.join(' | '));
});

test('CL1-Z-1 обход кэша не удался — причина названа в строке', async () => {
  const r = await progon((k) => zamenit(k, MIMO, () => otvet(200, HOSTER + nashRobots.replace('# A static site (Astro).', '# A static site.'), { 'cf-cache-status': 'HIT', age: '9120', ...CF })), { cf: true });
  assert.match(r.otkuda, /robots\.txt: наш файл целиком: false — .*ответ из кэша Cloudflare \(HIT, Age 9120\)/);
  assert.match(r.otkuda, /первая расходящаяся строка/);
});

test('подсказки причин: вызов Cloudflare, 526, cookies и их место, Always Use HTTPS, ответ главной, обфускация, вставка Cloudflare', async () => {
  const vyzov = await progon(() => {}, { vse: () => otvet(403, '<title>Just a moment...</title>', { 'cf-mitigated': 'challenge', ...CF }) });
  assert.equal(vyzov.plokho.length, VSEGO, vyzov.vse);
  assert.match(vyzov.otkuda, /вызов Cloudflare/);
  const s526 = await progon(() => {}, { vse: () => otvet(526, 'Invalid SSL certificate', CF) });
  assert.match(s526.otkuda, /526: Cloudflare не принял сертификат сервера/);
  // CL23-P-2: cookies, обфускация и вставка Cloudflare — на образце с Cloudflare, как обещает шапка проб.
  const kuki = await progon((k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'set-cookie': 'a=1; path=/, __cf_bm=2; path=/; HttpOnly' })), { cf: true });
  assert.match(kuki.otkuda, /a \(главная\)/);
  assert.match(kuki.otkuda, /__cf_bm \(главная, Cloudflare/);
  // CL2-Z-7: cookie ответа 301 — с адресом и статусом.
  const kuki301 = await progon((k) => zamenit(k, `http://${HOST}${igra}`, (o) => sZag(o, { 'set-cookie': '__cf_bm=2; path=/' })), { cf: true });
  assert.match(kuki301.otkuda, new RegExp(`__cf_bm \\(http://${HOST.replace(/\./g, '\\.')}${igra} — 301`));
  const always = await progon((k) => k.set('http://7thserpent.com/', otvet(301, '', CF, 'https://7thserpent.com/')), { cf: true });
  assert.match(always.otkuda, /Always Use HTTPS/);
  // П108: без Cloudflare тот же второй скачок делает сервер перед .htaccess — подсказка называет панель хостера.
  const khoster = await progon((k) => k.set('http://7thserpent.com/', otvet(301, '', SRV, 'https://7thserpent.com/')));
  assert.match(khoster.otkuda, /http голый → https www \/: Location: https:\/\/7thserpent\.com\/ — второй скачок[^|]*панели хостера/, khoster.otkuda);
  // CL2-Z-8: главная не 200 — ответ назван в строках кэша HTML.
  const s503 = await progon((k) => zamenit(k, `${B}/`, (o) => ({ ...o, status: 503 })));
  assert.match(s503.otkuda, new RegExp(`${CC.replace(/[()]/g, '\\$&')}: false — главная — ответ 503`));
  // CL2-Z-2: обфускация — строка адреса называет её.
  const obf = await progon((k) => zamenit(k, `${B}/privacy/`, vTelo(YASHCHIK, '<a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="1a2b">[email&#160;protected]</a>')), { cf: true });
  assert.match(obf.otkuda, /адрес ящика открытым текстом: false — .*обфускаци/);
  // CL2-Z-4: вставка названа переключателем Cloudflare.
  const wa = await progon((k) => zamenit(k, `${B}/`, vTelo('</main>', '</main><script defer src="https://static.cloudflareinsights.com/beacon.min.js"></script>')), { cf: true });
  assert.match(wa.otkuda, /Web Analytics/);
});

test('CL23-P-1 причина вставки — по следам Cloudflare: есть — «Cloudflare», нет — без догадки о посреднике', async () => {
  const bez = await progon((k) => zamenit(k, `${B}/`, vTelo('</head>', '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=X"></head>')));
  assert.deepEqual(bez.plokho, [HTML_SB]);
  assert.match(bez.otkuda, /1 из \d+ страниц: [^|]* — вставка на пути или dist\/ собран не из выложенного коммита/, bez.otkuda);
  const cf = await progon((k) => zamenit(k, `${B}/`, vTelo('</main>', '</main><script defer src="https://static.cloudflareinsights.com/beacon.min.js"></script>')), { cf: true });
  assert.match(cf.otkuda, /вставка на пути \(Cloudflare/, cf.otkuda);
});

test('CL23-Z-3 robots.txt без параметра не равен ответу с параметром, кэша Cloudflare нет — первая расходящаяся строка, причина без догадки', async () => {
  const r = await progon((k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER + 'User-agent: *\nAllow: /\n' })));
  assert.deepEqual(r.plokho, [BEZ_P]);
  assert.match(r.otkuda, /первая расходящаяся строка/, r.otkuda);
  assert.doesNotMatch(r.otkuda, /Cf-Cache-Status|не наш сервер/, r.otkuda);
});

test('CL3-Z-2 HTML не равен сборке: первое расхождение, «N из M», нейтральная причина; CL3-Z-6 без сборки — «из выложенного коммита»', async () => {
  const r = await progon((k) => zamenit(k, `${B}/movie/`, vTelo('<p>text</p>', '<p>first published wording</p>')));
  assert.deepEqual(r.plokho, [HTML_SB]);
  assert.match(r.otkuda, /1 из \d+ страниц/);
  assert.match(r.otkuda, /с знака \d+: сборка «[^»]*text[^»]*», сайт «[^»]*first published[^»]*»/);
  assert.match(r.otkuda, /вставка на пути .*или dist\/ собран не из выложенного коммита/);
  const bezSborki = await proverit({ poluchit: async (u) => zdorovyy().get(u), host: HOST, struktura, nashRobots, metka: METKA, sborka: null });
  const s = bezSborki.proverki.find((c) => c.imya === HTML_SB);
  assert.equal(s.ok, false);
  assert.match(s.otkuda, /из выложенного коммита \(main\)/);
});

test('CL3-Z-4 пути сборки для robots.txt — без файлов с точкой (.htaccess сервер не отдаёт)', () => {
  const { sborkaIzDist } = CL;
  const d = mkdtempSync(join(tmpdir(), 'check-live-'));
  try {
    for (const [f, t] of [['index.html', 'x'], ['.htaccess', 'x'], ['_astro/a.css', 'x'], ['pc/index.html', 'x'], ['.well-known/x', 'x']]) {
      mkdirSync(join(d, f, '..'), { recursive: true });
      writeFileSync(join(d, f), t);
    }
    assert.deepEqual(sborkaIzDist(d).puti.sort(), ['/', '/_astro/a.css', '/pc/']);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('разбор robots.txt: наш файл только отдельными строками', () => {
  assert.equal(razobratRobots('# ' + nashRobots, nashRobots).nashCelikom, false);
  assert.equal(razobratRobots(nashRobots, nashRobots).nashCelikom, true);
  assert.deepEqual(razobratRobots(nashRobots + '\n', nashRobots).chuzhoyTekst, []);
});

test('поисковики по правилам Google: длиннейшее правило, Allow при равенстве, * и $, Googlebot-Image', () => {
  const { zakrytoPoiskovikam } = CL;
  assert.equal(typeof zakrytoPoiskovikam, 'function', 'нет функции zakrytoPoiskovikam');
  assert.deepEqual(zakrytoPoiskovikam(nashRobots, ['/']), []);
  assert.deepEqual(zakrytoPoiskovikam('User-agent: *\nDisallow: /\nAllow: /\n', ['/']), []);
  assert.deepEqual(zakrytoPoiskovikam('User-agent: *\nDisallow: /\n', ['/']), ['googlebot /', 'googlebot-image /', 'bingbot /']);
  assert.deepEqual(zakrytoPoiskovikam('User-agent: *\nAllow: /\nDisallow: /*$\n', ['/x/']), ['googlebot /x/', 'googlebot-image /x/', 'bingbot /x/']);
  assert.deepEqual(zakrytoPoiskovikam('User-agent: *\nDisallow: /\n\nUser-agent: Googlebot\nAllow: /\n', ['/']), ['bingbot /']);
  assert.deepEqual(zakrytoPoiskovikam('User-agent: Googlebot-Image\nDisallow: /\n', ['/x.webp']), ['googlebot-image /x.webp']);
  assert.deepEqual(zakrytoPoiskovikam('Disallow: /\nUser-agent: *\nAllow: /\n', ['/']), []);
});

test('canonical: порядок атрибутов и кавычки; в комментарии и в <body> — не считается', () => {
  assert.deepEqual(canonicalOf(`<link href='${B}/' rel=canonical>`), [`${B}/`]);
  assert.deepEqual(canonicalOf(`<link rel="alternate canonical" href="${B}/a/">`), [`${B}/a/`]);
  assert.deepEqual(canonicalOf('<link rel="icon" href="/x.svg">'), []);
  assert.deepEqual(canonicalOf(`<head><!-- <link rel="canonical" href="${B}/a/"> --></head>`), []);
  assert.deepEqual(canonicalOf(`<head></head><body><link rel="canonical" href="${B}/a/"></body>`), []);
});

/* — Пределы после раунда 3 (последнего, П106: не больше трёх раундов) — тестами todo. — */

test('ПРЕДЕЛ CL3-P-6: адрес ящика во вложенном скрытом элементе засчитывается (разбор регулярным выражением, не деревом)', { todo: 'видимый текст без дерева parse5: вложенные одноимённые элементы с hidden' }, async () => {
  const r = await progon(() => {}, { vSborke: (k) => k.set(`${B}/privacy/`, otvet(200, stranica('/privacy/', 'Privacy policy — 7thserpent.com', `<p>Write to us.</p><div hidden><div>x</div>${YASHCHIK}</div>`), HTML)) });
  assert.deepEqual(r.plokho, [ADRES]);
});

test('ПРЕДЕЛ: CSS, картинки и шрифты живого сайта со сборкой не сверяются — только HTML страниц', { todo: 'подмена /_astro/*.css по пути — вне проверки; сверка файлов выкладки — пересчёт workflow и sverka-dist' }, async () => {
  const r = await progon((k) => k.set(`${B}/_astro/index.Cz6femgl.css`, otvet(200, 'body{display:none}', CF)));
  assert.ok(r.plokho.length > 0);
});

/* — Пределы сессии 23 (П108: один раунд; правка логики проверок — «прочее не трогать», П107 п. 6 — по живому образцу).
 *   Живой образец сессии 24 (П111) пределы не снял: смягчать и судить по замеру нечего. — */

test('ПРЕДЕЛ CL23-Z-1: без кэша на пути безвредная разница блока хостера между robots.txt с параметром и без — ПЛОХО «без параметра»', { todo: 'живой образец сессии 24 (П111): тела robots.txt с параметром и без побайтно равны в трёх парах — смягчать по замеру нечего; безвредная разница блока хостера — предел' }, async () => {
  const r = await progon((k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER.replace('# END adm.tools', 'User-agent: SemrushBot\nDisallow: /\n# END adm.tools') + nashRobots })));
  assert.deepEqual(r.plokho, []);
});

test('ПРЕДЕЛ CL23-Z-2: без кэша на пути разница только в пробелах (лишние переводы строки в конце) — ПЛОХО «без параметра»', { todo: 'сравнение ответов проверки 4 — только CR и BOM; живой образец сессии 24 (П111): тела побайтно равны — смягчать нечего, разница в пробелах — предел' }, async () => {
  const r = await progon((k) => zamenit(k, BEZ, (o) => ({ ...o, telo: `${o.telo}\n\n` })));
  assert.deepEqual(r.plokho, []);
});

test('ПРЕДЕЛ CL23-P-3: кэш не Cloudflare (Age, X-Cache-Status: HIT) у HTML не виден — проверки кэша знают только Cf-Cache-Status', { todo: 'живой образец сессии 24 (П111): у HTML нет Age и X-Cache-Status, x-ray wnp/wn/wa без признака кэша — кэш хостера не виден; проверка кэша не Cloudflare — предел' }, async () => {
  const r = await progon((k) => zamenit(k, `${B}/`, (o) => sZag(o, { age: '86400', 'x-cache-status': 'HIT' })));
  assert.ok(r.plokho.length > 0);
});

test('команда: неверные аргументы — код 2, без сети', () => {
  for (const argi of [['--bad'], ['--host']]) {
    const r = spawnSync(process.execPath, [join(SAYT, 'tools/check-live.mjs'), ...argi], { encoding: 'utf8' });
    assert.equal(r.status, 2, `${argi.join(' ')}: ${r.stderr}`);
  }
});
