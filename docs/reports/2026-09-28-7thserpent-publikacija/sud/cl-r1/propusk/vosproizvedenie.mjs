// Раунд 1 «судью судят», линза «ложный ok»: воспроизведение пропусков sites/7thserpent.com/tools/check-live.mjs
// (коммит 45052d0). Сети нет: poluchit(url) — модель живого сервера. Тела страниц — из dist сайта (только чтение).
//   node vosproizvedenie.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
// `node vosproizvedenie.mjs pravka` — те же образцы против наброска правок (pravka/check-live-pravka.mjs);
// в этом режиме здоровая /privacy/ несёт адрес ящика (состояние запуска: ящик → привязка → проверка, П52 п. 3).
const PRAVKA = process.argv[2] === 'pravka';
const { canonicalOf } = await import(pathToFileURL(join(SAYT, 'tools/check-live.mjs')).href);
const { proverit } = await import(PRAVKA ? new URL('./pravka/check-live-pravka.mjs', import.meta.url).href : pathToFileURL(join(SAYT, 'tools/check-live.mjs')).href);
const struktura = JSON.parse(readFileSync(join(SAYT, 'structure/structure.json'), 'utf8'));
const nashRobots = readFileSync(join(SAYT, 'public/robots.txt'), 'utf8');
const dist = (p) => readFileSync(join(SAYT, 'dist', p), 'utf8');

const HOST = 'www.7thserpent.com';
const B = `https://${HOST}`;
const METKA = 'm1';
const igra = struktura.pages.find((p) => p.type === 'game').url;

const otvet = (status, telo = '', zag = {}, location = '') => ({ status, location, telo, zag, zagolovok: (i) => zag[i.toLowerCase()] ?? '' });
const HTML = { 'cache-control': 'public, max-age=0, must-revalidate', 'x-ray': 'p542:wal', 'cf-cache-status': 'DYNAMIC' };
const HOSTER = '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n# END adm.tools Managed content\n\n';
const ROBOTS = HOSTER + nashRobots;
const NGINX404 = '<html>\r\n<head><title>404 Not Found</title></head>\r\n<body>\r\n<center><h1>404 Not Found</h1></center>\r\n<hr><center>nginx</center>\r\n</body>\r\n</html>\r\n';
const STRANICY = new Map(struktura.pages.filter((p) => p.url !== '/404/').map((p) => [p.url, p.url === '/' ? 'index.html' : `${p.url.slice(1)}index.html`]));

/** Здоровый сервер по обещаниям .htaccess / robots.txt / сборки — функция от любого адреса. */
function zdorovyy(url) {
  const u = new URL(url);
  const put = u.pathname + u.search;
  if (u.protocol === 'http:' || u.host !== HOST) return otvet(301, '', {}, `${B}${put}`);
  if (u.pathname === '/robots.txt') return otvet(200, ROBOTS, u.search ? { 'cf-cache-status': 'MISS', 'cache-control': 'max-age=14400' } : { 'cf-cache-status': 'HIT', age: '120', 'cache-control': 'max-age=14400' });
  if (u.pathname === '/sitemap-index.xml' || u.pathname === '/sitemap-0.xml') return otvet(200, dist(u.pathname.slice(1)));
  if (u.pathname === '/404/') return otvet(200, dist('404/index.html'), HTML);
  if (STRANICY.has(u.pathname)) {
    const t = dist(STRANICY.get(u.pathname));
    return otvet(200, PRAVKA && u.pathname === '/privacy/' ? t.replace('</main>', '<p><a href="mailto:mail@7thserpent.com">mail@7thserpent.com</a></p></main>') : t, HTML);
  }
  return otvet(404, dist('404/index.html'), HTML);
}

/** Модель разбора robots.txt по открытому парсеру Google (github.com/google/robotstxt, robots.cc):
 *  ключ без двоеточия (ровно два слова), опечатки ключей, группа тянется через Sitemap и комментарии,
 *  самая конкретная группа агента, самое длинное правило, при равенстве — Allow. true — путь разрешён. */
function google(txt, agent, path) {
  let seenAgent = false, sep = false, spec = false, glob = false, everSpec = false;
  const pr = { ag: 0, dg: 0, as: 0, ds: 0 };
  const sovpadaet = (pat, p) => new RegExp('^' + pat.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*').replace(/\\\$$/, '$')).test(p);
  for (const raw of txt.replace(/\r\n?/g, '\n').split('\n')) {
    const s = raw.replace(/#.*$/, '').trim();
    if (!s) continue;
    let key, val;
    const c = s.indexOf(':');
    if (c >= 0) { key = s.slice(0, c).trim(); val = s.slice(c + 1).trim(); }
    else { const chasti = s.split(/[ \t]+/); if (chasti.length !== 2) continue; [key, val] = chasti; }
    const k = key.toLowerCase();
    const ua = ['user-agent', 'useragent', 'user agent'].some((t) => k.startsWith(t));
    const razr = k.startsWith('allow');
    const zapr = ['disallow', 'dissallow', 'dissalow', 'disalow', 'diasllow', 'disallaw'].some((t) => k.startsWith(t));
    if (ua) {
      if (sep) spec = glob = sep = false;
      seenAgent = true;
      if (val[0] === '*' && (val.length === 1 || /\s/.test(val[1]))) glob = true;
      else if (((/^[A-Za-z_-]+/.exec(val) || [''])[0]).toLowerCase() === agent.toLowerCase()) spec = everSpec = true;
    } else if (razr || zapr) {
      if (!seenAgent) continue;
      sep = true;
      if (!val || !sovpadaet(val, path)) continue;
      if (spec) { if (razr) pr.as = Math.max(pr.as, val.length); else pr.ds = Math.max(pr.ds, val.length); }
      if (glob) { if (razr) pr.ag = Math.max(pr.ag, val.length); else pr.dg = Math.max(pr.dg, val.length); }
    }
  }
  if (pr.as > 0 || pr.ds > 0) return !(pr.ds > pr.as);
  if (everSpec) return true;
  return !(pr.dg > pr.ag);
}
const gb = (txt) => `Googlebot ${igra}: ${google(txt, 'Googlebot', igra) ? 'разрешено' : 'ЗАПРЕЩЕНО'}, /: ${google(txt, 'Googlebot', '/') ? 'разрешено' : 'ЗАПРЕЩЕНО'}`;

async function progon(server) {
  const zaprosy = [];
  const r = await proverit({ poluchit: async (url) => (zaprosy.push(url), server(url)), host: HOST, struktura, nashRobots, metka: METKA });
  return { ...r, zaprosy, plokho: r.proverki.filter((c) => !c.ok).map((c) => c.imya) };
}
const s = (imena, r) => imena.map((i) => { const c = r.proverki.find((x) => x.imya === i); return `«${i}» ${c ? (c.ok ? 'ok' : 'ПЛОХО') : 'нет такой'}`; }).join('; ');

const BEACON = `<script defer src="https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015" data-cf-beacon='{"rayId":"8f1a2b3c4d5e6f70","version":"2024.11.0","token":"0123456789abcdef0123456789abcdef","r":1}' crossorigin="anonymous"></script>`;
const JSD = `<script>(function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'8f1a2b3c4d5e6f70',t:'MTcyNzUyMDAwMC4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else document.addEventListener('DOMContentLoaded',c)}})();</script>`;
const kraem = (f) => (url) => { const o = zdorovyy(url); return typeof o.telo === 'string' && o.telo.includes('</body>') ? { ...o, telo: f(o.telo) } : o; };

/** Cloudflare Email Address Obfuscation (модель): адреса и mailto — в разметку Cloudflare и скрипт перед </body>. */
function cfPochta(html) {
  let bylo = false;
  const t = html
    .replace(/href="mailto:[^"]+"/g, () => ((bylo = true), 'href="/cdn-cgi/l/email-protection#5a3a2f"'))
    .replace(/(>[^<]*?)\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/g, (_, pered) => ((bylo = true), `${pered}<span class="__cf_email__" data-cfemail="5a3a2f">[email&#160;protected]</span>`));
  return bylo ? t.replace('</body>', '<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script></body>') : t;
}

const LISTING = (p) => `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">\n<html>\n <head>\n  <title>Index of ${p}</title>\n </head>\n <body>\n<h1>Index of ${p}</h1>\n<ul><li><a href="/"> Parent Directory</a></li>\n</ul>\n</body></html>\n`;

const SCENARII = [
  {
    id: 'здоровый', opis: 'образец здорового сайта', server: zdorovyy, klyuch: [],
  },
  {
    id: 'CL1-P-1a', opis: '/robots.txt (как его берут роботы) из кэша Cloudflare — «User-agent: * / Disallow: /»', klyuch: ['robots.txt: наш файл целиком', 'robots.txt: вне нашего файла — только блок хостера'],
    server: (url) => (url === `${B}/robots.txt` ? otvet(200, 'User-agent: *\nDisallow: /\n', { 'cf-cache-status': 'HIT', age: '600', 'cache-control': 'max-age=14400' }) : zdorovyy(url)),
    dokaz: (srv) => `роботы видят ${B}/robots.txt → ${gb(srv(`${B}/robots.txt`).telo)}`,
  },
  {
    id: 'CL1-P-1b', opis: 'то же, но Cf-Cache-Status DYNAMIC — это не кэш, а живой ответ пути /robots.txt', klyuch: ['robots.txt: наш файл целиком'],
    server: (url) => (url === `${B}/robots.txt` ? otvet(200, 'User-agent: *\nDisallow: /\n', { 'cf-cache-status': 'DYNAMIC' }) : zdorovyy(url)),
    dokaz: (srv) => `роботы видят ${B}/robots.txt (DYNAMIC) → ${gb(srv(`${B}/robots.txt`).telo)}`,
  },
  {
    id: 'CL1-P-1c', opis: '/robots.txt без параметра — 503 (параметр идёт мимо, путь роботов — нет)', klyuch: ['robots.txt: статус (мимо кэша)'],
    server: (url) => (url === `${B}/robots.txt` ? otvet(503, '<html><title>503 Service Unavailable</title></html>', { 'cf-cache-status': 'DYNAMIC' }) : zdorovyy(url)),
    dokaz: (srv) => `роботы видят ${B}/robots.txt → статус ${srv(`${B}/robots.txt`).status}`,
  },
  {
    id: 'CL1-P-2', opis: 'Caching Level «Ignore query string»: ?live-check= отдаётся из того же кэша (HIT), на сервере уже иной файл', klyuch: ['robots.txt: наш файл целиком', 'robots.txt: вне нашего файла — только блок хостера'],
    server: (url) => (new URL(url).pathname === '/robots.txt' && new URL(url).host === HOST ? otvet(200, ROBOTS, { 'cf-cache-status': 'HIT', age: '9000', 'cache-control': 'max-age=14400' }) : zdorovyy(url)),
    dokaz: () => { const origin = HOSTER + 'User-agent: *\nDisallow: /\n'; return `«мимо кэша» пришёл HIT, Age 9000; на сервере за кэшем: ${gb(origin)}`; },
  },
  {
    id: 'CL1-P-3a', opis: 'HTML: Cache-Control «public, max-age=14400, must-revalidate»', klyuch: ['главная: Cache-Control у HTML'],
    server: (url) => { const o = zdorovyy(url); return o.zag === HTML ? otvet(o.status, o.telo, { ...HTML, 'cache-control': 'public, max-age=14400, must-revalidate' }) : o; },
    dokaz: () => 'браузер 4 часа отдаёт HTML из своего кэша без запроса; .htaccess обещает max-age=0',
  },
  {
    id: 'CL1-P-3b', opis: 'HTML: два заголовка (nginx «max-age=14400» + Apache) — fetch склеивает «max-age=14400, public, max-age=0, must-revalidate»', klyuch: ['главная: Cache-Control у HTML'],
    server: (url) => { const o = zdorovyy(url); return o.zag === HTML ? otvet(o.status, o.telo, { ...HTML, 'cache-control': 'max-age=14400, public, max-age=0, must-revalidate' }) : o; },
    dokaz: () => 'RFC 9111 §4.2.1: при двух max-age кэш вправе взять первый (14400) — свежесть 4 часа не исключена',
  },
  {
    id: 'CL1-P-4', opis: 'HTML с края Cloudflare: Cf-Cache-Status HIT, Age 5400 (Cache Everything + Edge TTL)', klyuch: ['главная: Cache-Control у HTML', 'главная: статус'],
    server: (url) => { const o = zdorovyy(url); return o.zag === HTML ? otvet(o.status, o.telo, { ...HTML, 'cf-cache-status': 'HIT', age: '5400' }) : o; },
    dokaz: (srv) => `главная: cf-cache-status ${srv(`${B}/`).zagolovok('cf-cache-status')}, age ${srv(`${B}/`).zagolovok('age')} — правка дойдёт до читателя через Edge TTL, не «на следующем визите»`,
  },
  {
    id: 'CL1-P-5', opis: 'редирект теряет путь: любой http:// и голый хост → 301 на корень', klyuch: ['http → https: Location', '7thserpent.com → www.7thserpent.com: Location', 'http://7thserpent.com → https www.7thserpent.com: Location'],
    server: (url) => { const u = new URL(url); return u.protocol === 'http:' || u.host !== HOST ? otvet(301, '', {}, `${B}/`) : zdorovyy(url); },
    dokaz: (srv) => `http://7thserpent.com${igra} → ${srv(`http://7thserpent.com${igra}`).status} ${srv(`http://7thserpent.com${igra}`).location} (ждём ${B}${igra}; .htaccess: https://www.7thserpent.com/$1)`,
  },
  {
    id: 'CL1-P-6', opis: 'Cloudflare правит HTML: Web Analytics (beacon static.cloudflareinsights.com) и JS detections (/cdn-cgi/challenge-platform/…/jsd/main.js), без Set-Cookie в заголовке', klyuch: ['главная и /privacy/: без Set-Cookie', '/privacy/: без обфускации почты Cloudflare'],
    server: kraem((t) => t.replace('</body>', `${JSD}${BEACON}</body>`)),
    dokaz: (srv) => { const zhivoy = srv(`${B}/privacy/`).telo; return `/privacy/: <script> в сборке ${(dist('privacy/index.html').match(/<script/g) || []).length}, на живом ${(zhivoy.match(/<script/g) || []).length}; сторонний хост static.cloudflareinsights.com: ${zhivoy.includes('static.cloudflareinsights.com') ? 'есть' : 'нет'}; /cdn-cgi/: ${zhivoy.includes('/cdn-cgi/') ? 'есть' : 'нет'} — против «no analytics», «set no cookies», «sends no requests to anyone else»`; },
  },
  {
    id: 'CL1-P-7', opis: 'страница игры, /privacy/ и /404/ — 200 со списком каталога Apache (index.html не лёг)', klyuch: [`страница ${igra}: статус`, '/privacy/: статус', '/privacy/: без обфускации почты Cloudflare', '/404/ напрямую: статус'],
    server: (url) => { const p = new URL(url).pathname; return new URL(url).host === HOST && new URL(url).protocol === 'https:' && [igra, '/privacy/', '/404/'].includes(p) ? otvet(200, LISTING(p), { 'x-ray': 'p542:wal' }) : zdorovyy(url); },
    dokaz: (srv) => [igra, '/privacy/', '/404/'].map((p) => `${p}: title «${/<title>([^<]*)</.exec(srv(`${B}${p}`).telo)[1]}», canonical ${canonicalOf(srv(`${B}${p}`).telo).length} шт.`).join('; '),
  },
  {
    id: 'CL1-P-8', opis: 'Email Address Obfuscation ВКЛЮЧЕНА, на /privacy/ адреса ещё нет (до «ящик заведён» или сборка без строки адреса)', klyuch: ['/privacy/: без обфускации почты Cloudflare'],
    server: (url) => { const o = kraem(cfPochta)(url); return new URL(url).pathname === '/privacy/' && o.status === 200 ? { ...o, telo: cfPochta(dist('privacy/index.html')) } : o; },
    dokaz: (srv) => { const proba = cfPochta('<html><body><p>Write to <a href="mailto:mail@7thserpent.com">mail@7thserpent.com</a></p></body></html>'); return `та же настройка на странице с адресом: ${['__cf_email__', 'email-decode'].filter((m) => proba.includes(m)).join(', ')}; адресов на живой /privacy/: ${(srv(`${B}/privacy/`).telo.match(/mailto:|@[\w-]+\.[a-z]{2,}/g) || []).length}`; },
  },
  {
    id: 'CL1-P-9a', opis: 'блок хостера: «User-agent: Googlebot» + «Disallow /» (без двоеточия — Google принимает)', klyuch: ['robots.txt: вне нашего файла — только блок хостера'],
    server: (url) => (new URL(url).pathname === '/robots.txt' ? otvet(200, HOSTER.replace('User-agent: MJ12bot\nDisallow: /', 'User-agent: MJ12bot\nDisallow: /\n\nUser-agent: Googlebot\nDisallow /') + nashRobots, { 'cf-cache-status': 'MISS' }) : zdorovyy(url)),
    dokaz: (srv) => gb(srv(`${B}/robots.txt`).telo),
  },
  {
    id: 'CL1-P-9b', opis: 'блок хостера: «Dissallow: /» для Googlebot (опечатка, которую Google принимает)', klyuch: ['robots.txt: вне нашего файла — только блок хостера'],
    server: (url) => (new URL(url).pathname === '/robots.txt' ? otvet(200, HOSTER.replace('User-agent: MJ12bot\nDisallow: /', 'User-agent: MJ12bot\nDisallow: /\n\nUser-agent: Googlebot\nDissallow: /') + nashRobots, { 'cf-cache-status': 'MISS' }) : zdorovyy(url)),
    dokaz: (srv) => gb(srv(`${B}/robots.txt`).telo),
  },
  {
    id: 'CL1-P-9c', opis: 'блок хостера: «User agent: Googlebot» (пробел вместо дефиса — Google принимает) + «Disallow: /»', klyuch: ['robots.txt: вне нашего файла — только блок хостера'],
    server: (url) => (new URL(url).pathname === '/robots.txt' ? otvet(200, HOSTER.replace('User-agent: MJ12bot\nDisallow: /', 'User-agent: MJ12bot\nDisallow: /\n\nUser agent: Googlebot\nDisallow: /') + nashRobots, { 'cf-cache-status': 'MISS' }) : zdorovyy(url)),
    dokaz: (srv) => gb(srv(`${B}/robots.txt`).telo),
  },
  {
    id: 'CL1-P-10', opis: 'блок хостера ПОСЛЕ нашего файла, правило без User-agent: «Disallow: /*» продолжает нашу группу «User-agent: *»', klyuch: ['robots.txt: вне нашего файла — только блок хостера', 'robots.txt: наш файл целиком'],
    server: (url) => (new URL(url).pathname === '/robots.txt' ? otvet(200, nashRobots + '\n# BEGIN adm.tools Managed content\nDisallow: /*\n# END adm.tools Managed content\n', { 'cf-cache-status': 'MISS' }) : zdorovyy(url)),
    dokaz: (srv) => gb(srv(`${B}/robots.txt`).telo),
  },
  {
    id: 'CL1-P-11', opis: 'несуществующий адрес с расширением статики (его отдаёт nginx) — 404 заглушкой nginx, не нашей страницей', klyuch: ['несуществующий адрес: статус', 'несуществующий адрес: наша страница'],
    server: (url) => { const u = new URL(url); return u.protocol === 'https:' && u.host === HOST && /\.(png|webp|ico|svg|css|js|xml|txt|woff2)$/.test(u.pathname) && !['/robots.txt', '/sitemap-index.xml', '/sitemap-0.xml'].includes(u.pathname) ? otvet(404, NGINX404, { server: 'nginx' }) : zdorovyy(url); },
    dokaz: (srv) => ['/favicon-64x64.png', '/sitemap-1.xml', '/_astro/old.css'].map((p) => `${p} → ${srv(`${B}${p}`).status} «${/<title>([^<]*)</.exec(srv(`${B}${p}`).telo)[1]}»`).join('; '),
  },
  {
    id: 'CL1-P-12', opis: 'Set-Cookie на странице игры и на ответе 404 (главная и /privacy/ чистые)', klyuch: ['главная и /privacy/: без Set-Cookie'],
    server: (url) => { const o = zdorovyy(url); const p = new URL(url).pathname; return (p === igra || o.status === 404) && o.zag === HTML ? otvet(o.status, o.telo, { ...HTML, 'set-cookie': '_cfuvid=Qx1.2-3; path=/; domain=.7thserpent.com; HttpOnly; Secure; SameSite=None' }) : o; },
    dokaz: (srv) => `${igra}: set-cookie «${srv(`${B}${igra}`).zagolovok('set-cookie').split(';')[0]}»; /net-takoy/: «${srv(`${B}/net-takoy/`).zagolovok('set-cookie').split(';')[0]}» — против «The site’s pages set no cookies»`,
  },
  {
    id: 'CL1-P-13', opis: 'X-Robots-Tag: noindex, nofollow на всех HTML (правило хостера или Transform Rule Cloudflare)', klyuch: ['главная: статус', 'главная: canonical'],
    server: (url) => { const o = zdorovyy(url); return o.zag === HTML ? otvet(o.status, o.telo, { ...HTML, 'x-robots-tag': 'noindex, nofollow' }) : o; },
    dokaz: (srv) => `главная: x-robots-tag «${srv(`${B}/`).zagolovok('x-robots-tag')}» — против «Every page is open to indexing» (public/robots.txt)`,
  },
  {
    id: 'CL1-P-14', opis: 'выкладка легла не вся: адреса карты, кроме главной, игры и /privacy/, отвечают 404', klyuch: ['sitemap-0.xml: адреса = структура'],
    server: (url) => { const u = new URL(url); return u.protocol === 'https:' && u.host === HOST && STRANICY.has(u.pathname) && !['/', igra, '/privacy/'].includes(u.pathname) ? otvet(404, dist('404/index.html'), HTML) : zdorovyy(url); },
    dokaz: (srv) => { const net = [...STRANICY.keys()].filter((p) => srv(`${B}${p}`).status !== 200); return `адресов карты не 200: ${net.length} из ${STRANICY.size} (например ${net.slice(0, 3).join(', ')})`; },
  },
];

const vyvod = [];
for (const sc of SCENARII) {
  const r = await progon(sc.server);
  const ok = r.proverki.length - r.plokho.length;
  const stroka = `${sc.id}: ${ok}/${r.proverki.length} ok; ПЛОХО: ${r.plokho.length ? r.plokho.join(' | ') : '—'}${sc.klyuch.length ? `; ${s(sc.klyuch, r)}` : ''}${sc.dokaz ? `; нарушение: ${sc.dokaz(sc.server)}` : ''}`;
  vyvod.push(`— ${sc.opis}\n${stroka}\n  справки: ${r.spravki.join(' | ')}`);
}
// Контроль модели Google: наш файл и файл с блоком хостера — разрешено; «Disallow: /» для * — запрещено; ничья Allow/Disallow — разрешено.
vyvod.push(`контроль модели Google: наш ${gb(nashRobots)}; хостер+наш ${gb(ROBOTS)}; «*: Disallow: /» ${gb('User-agent: *\nDisallow: /\n')}; ничья ${gb('User-agent: *\nAllow: /\nDisallow: /\n')}`);
const tekst = vyvod.join('\n\n') + '\n';
console.log(tekst);
writeFileSync(new URL(PRAVKA ? './vyvod-pravka.txt' : './vyvod.txt', import.meta.url), tekst);
