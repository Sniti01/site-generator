// CL23-Z («законные формы»): образцы здорового сайта без Cloudflare у хостера adm.tools против check-live копии 30b3730.
// Образец здорового сайта и прогон — перенесены из tools/testy/check-live.test.mjs копии (zdorovyy, progon, sCloudflare).
// Вывод — obrazcy.txt рядом (абсолютный путь). Запуск: node <этот файл>.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/e23fb3af-937c-42f5-91ca-cf6567cf6a1c/scratchpad/sud-cl23-z';
// Аргумент «pravka» — тот же набор против копии с правилом скептика (pravka.mjs); без аргумента — копия 30b3730.
const PRAVKA = process.argv[2] === 'pravka';
const KOREN = PRAVKA ? `${PAPKA}/pravka` : PAPKA;
const VYVOD = PRAVKA ? `${PAPKA}/obrazcy-pravka.txt` : `${PAPKA}/obrazcy.txt`;
const CL = await import(pathToFileURL(`${KOREN}/sites/7thserpent.com/tools/check-live.mjs`).href);
const { proverit, SAYT } = CL;

/* ---------- образец из проб копии (без изменений) ---------- */
const struktura = JSON.parse(readFileSync(join(SAYT, 'structure/structure.json'), 'utf8'));
const nashRobots = readFileSync(join(SAYT, 'public/robots.txt'), 'utf8');
const HOST = 'www.7thserpent.com';
const B = `https://${HOST}`;
const METKA = 'm1';
const VSEGO = 44;
const YASHCHIK = 'box@7thserpent.com';
const otvet = (status, telo = '', zag = {}, location = '') => ({ status, location, telo, zagolovok: (i) => zag[i.toLowerCase()] ?? '' });
const title404 = struktura.pages.find((p) => p.url === '/404/').title;
const igra = struktura.pages.find((p) => p.type === 'game').url;
const stranica = (url, title = 'x', telo = '<p>text</p>', golova = '') =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><link rel="canonical" href="${B}${url}">${golova}<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/_astro/index.Cz6femgl.css"><script type="module">document.querySelector('.hdr__burger')</script></head><body><header class="hdr" data-astro-cid-m3tnyskv></header><main>${telo}<img src="/_astro/hero.webp" alt="x" srcset="/_astro/hero.webp 1200w"></main></body></html>`;
const CF = { 'cf-ray': '8c1a2b3c4d5e6f70-WAW', server: 'cloudflare' };
const SRV = { server: 'nginx' };
const HTML = { 'cache-control': 'public, max-age=0, must-revalidate', 'x-ray': 'p542:wal', 'content-type': 'text/html', ...SRV };
const HOSTER = '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n# END adm.tools Managed content\n\n';
const urlset = (urls) => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${u}</loc></url>`).join('')}</urlset>`;
const STRANICY = struktura.pages.filter((p) => p.url !== '/404/');
const KARTA = STRANICY.map((p) => `${B}${p.url}`);
const PRIVACY = stranica('/privacy/', 'Privacy policy — 7thserpent.com', `<p>Requests about the hosting logs go to ${YASHCHIK}.</p>`);
const PUTI_SBORKI = [...struktura.pages.map((p) => p.url), '/_astro/index.Cz6femgl.css', '/_astro/hero.webp', '/favicon.svg', '/robots.txt', '/sitemap-index.xml', '/sitemap-0.xml'];

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
function sCloudflare(k) {
  for (const [u, o] of k) {
    const zag = { ...CF };
    if (/^text\/html/.test(o.zagolovok('content-type')) || u === `${B}/robots.txt?live-check=${METKA}`) zag['cf-cache-status'] = 'DYNAMIC';
    if (u === `${B}/robots.txt`) Object.assign(zag, { 'cf-cache-status': 'HIT', age: '120' });
    k.set(u, sZag(o, zag));
  }
}
function sborkaIz(k) {
  return { stranica: (put) => k.get(`${B}${put}`)?.telo ?? null, puti: PUTI_SBORKI };
}
async function progon(izmenit = () => {}, { vSborke, cf } = {}) {
  const chistyy = zdorovyy();
  if (vSborke) vSborke(chistyy);
  const sborka = sborkaIz(chistyy);
  const karta = zdorovyy();
  if (vSborke) vSborke(karta);
  if (cf) sCloudflare(karta);
  izmenit(karta);
  const poluchit = async (url) => {
    if (!karta.has(url)) throw new Error(`запрос вне образца: ${url}`);
    const o = karta.get(url);
    return Array.isArray(o) ? (o.length > 1 ? o.shift() : o[0]) : o;
  };
  const r = await proverit({ poluchit, host: HOST, struktura, nashRobots, metka: METKA, sborka });
  return { ...r, plokho: r.proverki.filter((c) => !c.ok).map((c) => c.imya).sort() };
}
const zamenit = (karta, url, f) => karta.set(url, f(karta.get(url)));
const sZag = (o, zag) => ({ ...o, zagolovok: (i) => (i.toLowerCase() in zag ? zag[i.toLowerCase()] : o.zagolovok(i)) });
const MIMO = `${B}/robots.txt?live-check=${METKA}`;
const BEZ = `${B}/robots.txt`;
const BEZ_CF = 'запросы не идут через Cloudflare';
const BEZ_P = 'robots.txt без параметра (его берут роботы)';

/* ---------- законные заголовки хостера: nginx впереди, HTML — Apache (замер 2026-09-29, x-ray с «wa») ---------- */
const OBSHCHIE = {
  server: 'nginx/1.24.0',
  date: 'Tue, 29 Sep 2026 10:00:00 GMT',
  connection: 'keep-alive',
  'keep-alive': 'timeout=60',
  vary: 'Accept-Encoding',
  'accept-ranges': 'bytes',
  'last-modified': 'Tue, 29 Sep 2026 09:58:00 GMT',
  'strict-transport-security': 'max-age=31536000',
};
function zagolovkiKhostera(k, { apache = false } = {}) {
  for (const [u, o] of k) {
    const html = /^text\/html/.test(o.zagolovok('content-type'));
    let zag;
    if (o.status === 301) zag = { ...OBSHCHIE, 'x-ray': 'wnp190:0.000/wn190:0.000/wa190:D=412', 'content-type': 'text/html; charset=iso-8859-1', 'content-length': '245' };
    else if (html)
      zag = { ...OBSHCHIE, ...(apache ? { server: 'Apache' } : {}), 'x-ray': 'wnp190:0.000/wn190:0.000/wa190:D=723', 'content-type': 'text/html; charset=UTF-8', 'cache-control': 'public, max-age=0, must-revalidate', etag: '"5e1f-6230a1b2c3d4e"', 'content-encoding': 'gzip' };
    else if (u.includes('robots.txt')) zag = { ...OBSHCHIE, 'x-ray': 'wnp190:0.000/wn190:0.000', 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'max-age=2592000', expires: 'Thu, 29 Oct 2026 10:00:00 GMT', etag: '"66f94a1c-4d1"' };
    else zag = { ...OBSHCHIE, 'x-ray': 'wnp190:0.000/wn190:0.000', 'content-type': 'application/xml', 'cache-control': 'max-age=2592000', expires: 'Thu, 29 Oct 2026 10:00:00 GMT', etag: '"66f94a1c-9a2"' };
    k.set(u, { ...o, zagolovok: (i) => zag[i.toLowerCase()] ?? '' });
  }
}

/* ---------- блок хостера: законные разновидности ---------- */
const HOSTER_OBRATNO = '# BEGIN adm.tools Managed content\nUser-agent: MJ12bot\nDisallow: /\n\nUser-agent: AhrefsBot\nDisallow: /\n# END adm.tools Managed content\n\n';
const HOSTER_BOLSHE = '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n\nUser-agent: Bytespider\nDisallow: /\n# END adm.tools Managed content\n\n';
const hosterMetka = (s) => `# BEGIN adm.tools Managed content\n# 2026-09-29 10:00:0${s}\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n# END adm.tools Managed content\n\n`;
const PREZHNIY = nashRobots.replace('# A static site (Astro).', '# A static site.');

/** Образцы: [id, описание, izmenit, опции, должно (список ПЛОХО у верного судьи)]. */
const OBRAZCY = [
  // — контроль —
  ['K0', 'здоровый образец проб (заголовки server: nginx)', () => {}, {}, []],
  // — законные заголовки хостера —
  ['Z1', 'все ответы с законными заголовками nginx/Apache (Server с версией, Vary, ETag, Last-Modified, Accept-Ranges, Connection, Keep-Alive, HSTS, Expires, x-ray полной формы; HTML text/html; charset=UTF-8, gzip)', (k) => zagolovkiKhostera(k), {}, []],
  ['Z2', 'то же, у HTML — server: Apache (nginx пропускает заголовок Apache)', (k) => zagolovkiKhostera(k, { apache: true }), {}, []],
  // — robots.txt без параметра против ответа с параметром, кэша на пути нет —
  ['R1', 'без параметра: блок хостера — те же группы в другом порядке (генератор без порядка)', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER_OBRATNO + nashRobots })), {}, []],
  ['R1cf', 'R1 под Cloudflare (без параметра — HIT) — как было до П108', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER_OBRATNO + nashRobots })), { cf: true }, [BEZ_CF]],
  ['R2', 'без параметра: в блоке хостера на одного бота больше (список хостера обновился между запросами)', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER_BOLSHE + nashRobots })), {}, []],
  ['R3', 'блок хостера только в ответе без параметра', (k) => zamenit(k, MIMO, (o) => ({ ...o, telo: nashRobots })), {}, []],
  ['R4', 'блок хостера только в ответе с параметром', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: nashRobots })), {}, []],
  ['R5', 'в блоке хостера строка-метка времени, у двух ответов — разные секунды', (k) => { zamenit(k, MIMO, (o) => ({ ...o, telo: hosterMetka(0) + nashRobots })); zamenit(k, BEZ, (o) => ({ ...o, telo: hosterMetka(1) + nashRobots })); }, {}, []],
  ['R6', 'без параметра: лишний перевод строки в конце', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: o.telo + '\n' })), {}, []],
  ['R7', 'без параметра: пробел в конце строки блока хостера', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: o.telo.replace('Disallow: /\n', 'Disallow: / \n') })), {}, []],
  ['R8', 'без параметра: BOM в начале (контроль: norm снимает)', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: '\uFEFF' + o.telo })), {}, []],
  ['R9', 'без параметра: CRLF (контроль: norm сводит)', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: o.telo.replace(/\n/g, '\r\n') })), {}, []],
  ['R10', 'без параметра: прежняя редакция нашего файла (кэш хостера или nginx сразу после выкладки) — вреда нет', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER + PREZHNIY })), {}, [BEZ_P]],
  ['R11', 'без параметра: блок хостера после нашего файла, с параметром — перед', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: nashRobots + '\n' + HOSTER })), {}, []],
  // — страж правила: вредная разница без параметра остаётся ПЛОХО (к «ложному ok» правки) —
  ['R12', 'без параметра: блок хостера закрывает Googlebot', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER.replace('User-agent: MJ12bot', 'User-agent: Googlebot') + nashRobots })), {}, [BEZ_P]],
  ['R13', 'без параметра: блок хостера, * закрывает /movie/', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER.replace('User-agent: MJ12bot\nDisallow: /', 'User-agent: *\nDisallow: /movie/') + nashRobots })), {}, [BEZ_P]],
  ['R14', 'без параметра: другой файл без нашего (проба П108)', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER + 'User-agent: *\nAllow: /\n' })), {}, [BEZ_P]],
  ['R15', 'без параметра: чужой управляемый блок', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: '# BEGIN Other Managed content\nUser-agent: GPTBot\nDisallow: /\n# END Other Managed content\n' + HOSTER + nashRobots })), {}, [BEZ_P]],
  ['R16', 'без параметра: после нашего файла строка «Disallow: /» вне блоков', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: o.telo + 'Disallow: /\n' })), {}, [BEZ_P]],
  ['R17', 'без параметра: блок хостера с «Disallow: /» без User-agent после нашего файла (продолжает группу *)', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER + nashRobots + '\n# BEGIN adm.tools Managed content\nDisallow: /\n# END adm.tools Managed content\n' })), {}, [BEZ_P]],
  // — прочие законные формы заголовков HTML (контроль, логика до сессии) —
  ['Z3', 'HTML: Content-Type text/html;charset=utf-8 (без пробела)', (k) => { for (const [u, o] of k) if (/^text\/html/.test(o.zagolovok('content-type'))) k.set(u, sZag(o, { 'content-type': 'text/html;charset=utf-8' })); }, {}, []],
  ['Z4', 'HTML: Cache-Control в другом порядке — max-age=0, must-revalidate, public', (k) => { for (const [u, o] of k) if (/^text\/html/.test(o.zagolovok('content-type'))) k.set(u, sZag(o, { 'cache-control': 'max-age=0, must-revalidate, public' })); }, {}, []],
  // — проверка 11: регистр имён заголовков (к «ложному ok», строкой) —
  ['C1', 'главная: CF-RAY в верхнем регистре через настоящий Headers (fetch)', (k) => zamenit(k, `${B}/`, (o) => { const h = new Headers({ 'CF-RAY': '8c1a2b3c4d5e6f70-WAW', Server: 'nginx', 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=0, must-revalidate' }); return { ...o, zagolovok: (i) => h.get(i) ?? '' }; }), {}, [BEZ_CF]],
  ['C2', 'главная: Server: CloudFlare (смешанный регистр значения)', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { server: 'CloudFlare' })), {}, [BEZ_CF]],
];

const stroki = [];
let raskhozhdeniy = 0;
for (const [id, opisanie, izmenit, opcii, dolzhno] of OBRAZCY) {
  const r = await progon(izmenit, opcii);
  const sovpalo = JSON.stringify(r.plokho) === JSON.stringify([...dolzhno].sort());
  if (!sovpalo) raskhozhdeniy += 1;
  stroki.push(`${sovpalo ? 'как должно' : 'РАСХОЖДЕНИЕ'} ${id} — ${opisanie}`);
  stroki.push(`   ok ${VSEGO - r.plokho.length}/${r.proverki.length}; ПЛОХО: ${r.plokho.join(' | ') || '—'}; должно ПЛОХО: ${dolzhno.join(' | ') || '—'}`);
  for (const c of r.proverki.filter((x) => !x.ok)) stroki.push(`   ПЛОХО ${c.imya}: ${c.fakt} — ${c.otkuda}`);
  for (const s of r.spravki.filter((x) => /robots\.txt без параметра|кэш Cloudflare, не отказ/.test(x))) stroki.push(`   справка: ${s}`);
}
stroki.push('', `образцов ${OBRAZCY.length}, расхождений с верным вердиктом ${raskhozhdeniy}`);

// Проза здорового образца: строки и справки, где на сайте без Cloudflare названы Cloudflare или его кэш.
const zd = await progon();
stroki.push('', 'Проза здорового образца (все проверки ok): строки и справки с Cf-Cache-Status, «кэш» или Cloudflare');
for (const c of zd.proverki.filter((x) => /Cf-Cache-Status|кэш|Cloudflare/i.test(`${x.imya} ${x.otkuda}`))) stroki.push(`   ok ${c.imya}: ${c.fakt} — ${c.otkuda}`);
for (const s of zd.spravki.filter((x) => /Cf-Cache-Status|кэш|Cloudflare/i.test(x))) stroki.push(`   справка: ${s}`);

writeFileSync(VYVOD, stroki.join('\n') + '\n');
console.log(`образцов ${OBRAZCY.length}, расхождений ${raskhozhdeniy}; вывод — ${VYVOD}`);
