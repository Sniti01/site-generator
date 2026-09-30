// Держит ли «поисковики не закрыты» + «вне нашего файла» с файлом владельца: (1) порт robots.cc на известных случаях;
// (2) изменённые ожидания диффа (CL1-P-9a–c, CL2-P-5a, b, «блок хостера закрывает Googlebot») — решение robots.cc
// для Googlebot, Googlebot-Image, Bingbot; (3) перебор 20000 блоков хостера (ASCII) до и после файла владельца: где
// robots.cc закрывает поисковик на пути сборки, а check-live молчит (наш файл целиком, «вне» и «поисковики» — ok).
import { robotsCc, zakrytDlya, zakrytoCc } from './robots-cc.mjs';
import { razobratRobots, zakrytoPoiskovikam, nashRobots, PUTI_SBORKI, vyvod } from './stend.mjs';

const out = [];
const p = (...a) => out.push(a.join(' '));
let oshibok = 0;
const ozhid = (imya, fakt, zhdem) => {
  const ok = JSON.stringify(fakt) === JSON.stringify(zhdem);
  if (!ok) oshibok += 1;
  p(`${ok ? 'ok   ' : 'ОШИБКА'} ${imya}: ${JSON.stringify(fakt)}${ok ? '' : ` (ждали ${JSON.stringify(zhdem)})`}`);
};

p('== 1. Порт robots.cc на известных случаях ==');
ozhid('Google: allow /p, disallow / → /page разрешён', robotsCc('User-agent: *\nAllow: /p\nDisallow: /\n', ['googlebot'], '/page').zakryto, false);
ozhid('Google: allow /folder, disallow /folder → равная длина, Allow', robotsCc('User-agent: *\nAllow: /folder\nDisallow: /folder\n', ['googlebot'], '/folder/page').zakryto, false);
ozhid('Google: allow /page, disallow /*.htm → /page.htm закрыт (длиннее)', robotsCc('User-agent: *\nAllow: /page\nDisallow: /*.htm\n', ['googlebot'], '/page.htm').zakryto, true);
ozhid('Google: allow /$, disallow / → / открыт', robotsCc('User-agent: *\nAllow: /$\nDisallow: /\n', ['googlebot'], '/').zakryto, false);
ozhid('Google: allow /$, disallow / → /page.htm закрыт', robotsCc('User-agent: *\nAllow: /$\nDisallow: /\n', ['googlebot'], '/page.htm').zakryto, true);
ozhid('группы одного бота складываются', robotsCc('User-agent: googlebot\nDisallow: /a\n\nUser-agent: googlebot\nDisallow: /b\n', ['googlebot'], '/b/x').zakryto, true);
ozhid('своя группа — * не действует', robotsCc('User-agent: *\nDisallow: /\n\nUser-agent: Googlebot\nAllow: /x\n', ['googlebot'], '/y').zakryto, false);
ozhid('правило до первого User-agent не действует', robotsCc('Disallow: /\nUser-agent: *\nAllow: /\n', ['googlebot'], '/').zakryto, false);
ozhid('подряд идущие User-agent — одна группа', robotsCc('User-agent: a\nUser-agent: googlebot\nDisallow: /\n', ['googlebot'], '/').zakryto, true);
ozhid('без двоеточия — два слова', robotsCc('User-agent googlebot\nDisallow /\n', ['googlebot'], '/').zakryto, true);
ozhid('Googlebot-Image без своей группы — группа Googlebot', zakrytDlya('User-agent: Googlebot\nDisallow: /x/\n', 'googlebot-image', '/x/1'), true);
ozhid('Googlebot-Image со своей группой — только она', zakrytDlya('User-agent: Googlebot\nDisallow: /x/\n\nUser-agent: Googlebot-Image\nAllow: /\n', 'googlebot-image', '/x/1'), false);
ozhid('Bingbot без своей группы — группа msnbot', zakrytDlya('User-agent: msnbot\nDisallow: /\n', 'bingbot', '/'), true);
ozhid('файл владельца: Googlebot /', zakrytDlya(nashRobots, 'googlebot', '/'), false);
ozhid('файл владельца: Googlebot-Image /_astro/hero.webp', zakrytDlya(nashRobots, 'googlebot-image', '/_astro/hero.webp'), false);
ozhid('файл владельца: Bingbot /movie/', zakrytDlya(nashRobots, 'bingbot', '/movie/'), false);
for (const bot of ['AhrefsBot', 'MJ12bot', 'DataForSeoBot', 'barkrowler', 'Bytespider', 'meta-externalagent', 'Baiduspider', 'meta-webindexer', 'AhrefsSiteAudit', 'SemrushBot', 'serpstatbot']) ozhid(`файл владельца: ${bot} /`, robotsCc(nashRobots, [bot], '/', { shirokiy: true }).zakryto, true);
ozhid('файл владельца: GPTBot / (владелец не закрывал)', robotsCc(nashRobots, ['GPTBot'], '/', { shirokiy: true }).zakryto, false);
ozhid('строгий разбор Google: «MJ12bot» в строке — имя «MJ» (цифр в имени нет)', robotsCc(nashRobots, ['MJ'], '/').zakryto, true);

p('\n== 2. Изменённые ожидания диффа: блок хостера перед файлом владельца ==');
const HOSTER = '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n# END adm.tools Managed content\n\n';
const formy = [
  ['блок хостера закрывает Googlebot', HOSTER.replace('User-agent: MJ12bot', 'User-agent: Googlebot')],
  ['CL1-P-9a «Disallow /»', HOSTER.replace('User-agent: MJ12bot\nDisallow: /', 'User-agent: Googlebot\nDisallow /')],
  ['CL1-P-9b «Dissallow: /»', HOSTER.replace('User-agent: MJ12bot\nDisallow: /', 'User-agent: Googlebot\nDissallow: /')],
  ['CL1-P-9c «User agent: Googlebot»', HOSTER.replace('User-agent: MJ12bot', 'User agent: Googlebot')],
  ['CL2-P-5a «User-agents: Googlebot»', HOSTER.replace('User-agent: MJ12bot', 'User-agents: Googlebot')],
  ['CL2-P-5b «Disallowed: /»', HOSTER.replace('User-agent: MJ12bot\nDisallow: /', 'User-agent: Googlebot\nDisallowed: /')],
  ['П113 «Disallow: /movie/»', HOSTER.replace('User-agent: MJ12bot\nDisallow: /', 'User-agent: Googlebot\nDisallow: /movie/')],
  ['контроль: «Disallow: /*» (длиннее Allow: /)', HOSTER.replace('User-agent: MJ12bot\nDisallow: /', 'User-agent: Googlebot\nDisallow: /*')],
];
for (const [imya, blok] of formy) {
  const telo = blok + nashRobots;
  const cc = zakrytoCc(telo, PUTI_SBORKI);
  const cl = zakrytoPoiskovikam(telo, PUTI_SBORKI);
  const rb = razobratRobots(telo, nashRobots, PUTI_SBORKI);
  p(`${imya}: robots.cc закрыто ${cc.length} (${cc.slice(0, 3).join(', ') || '—'}); check-live «поисковики» ${cl.length ? 'ПЛОХО' : 'ok'} (${cl.length}); «вне нашего файла» ${rb.ogranicheniya.length || rb.chuzhoyTekst.length ? 'ПЛОХО' : 'ok'} (${rb.ogranicheniya.slice(0, 1).join('') || '—'})`);
  if (JSON.stringify(cc) !== JSON.stringify(cl)) {
    oshibok += 1;
    p('   РАСХОЖДЕНИЕ robots.cc и check-live');
  }
}

p('\n== 3. Перебор: 20000 блоков хостера (ASCII) до, после или вокруг файла владельца ==');
let seed = 20260930;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const iz = (a) => a[Math.floor(rnd() * a.length)];
const UA = ['User-agent: *', 'User-agent: Googlebot', 'User-agent: Googlebot-Image', 'User-agent: bingbot', 'User-agent: msnbot', 'User-agent: GPTBot', 'User-agent: AhrefsBot', 'User agent: Googlebot', 'User-agents: Googlebot', 'useragent: bingbot', 'User-agent: * (all robots)', 'User-agent: Googlebot/2.1', 'User-agent: Googlebot-News', 'User-agent Googlebot', 'USER-AGENT: GOOGLEBOT-IMAGE'];
const PR = ['Disallow: /', 'Disallow: /*', 'Disallow: /movie/', 'Disallow: /*.css$', 'Disallow: /$', 'Disallow:', 'Allow: /', 'Allow: /movie/', 'Disallow /', 'Dissallow: /movie/', 'Disallowed: /', 'Disallow: *', 'Disallow: /_astro/', 'Allow: /$', 'Disallow: /*?', 'Disallow: /wp-admin/', 'Allow: /*', 'Disallow: /m', 'disallow: /PC/', 'Disallow: /pc', 'Disallow: /*/', 'Allow: /movie'];
const PROCHEE = ['Sitemap: https://evil.example/s.xml', 'Crawl-delay: 5', '# comment', ''];
const blok = () => {
  const n = 1 + Math.floor(rnd() * 6);
  const s = [];
  for (let i = 0; i < n; i += 1) {
    const r = rnd();
    s.push(r < 0.4 ? iz(UA) : r < 0.9 ? iz(PR) : iz(PROCHEE));
  }
  return `# BEGIN adm.tools Managed content\n${s.join('\n')}\n# END adm.tools Managed content\n`;
};
let raskhozhdeniy = 0;
let lozhnyhOk = 0;
let zakrytyhVsego = 0;
const primery = [];
for (let i = 0; i < 20000; i += 1) {
  const gde = iz(['до', 'после', 'вокруг']);
  const telo = gde === 'до' ? `${blok()}\n${nashRobots}` : gde === 'после' ? `${nashRobots}\n${blok()}` : `${blok()}\n${nashRobots}\n${blok()}`;
  const cc = zakrytoCc(telo, PUTI_SBORKI);
  const cl = zakrytoPoiskovikam(telo, PUTI_SBORKI);
  const rb = razobratRobots(telo, nashRobots, PUTI_SBORKI);
  const vneOk = rb.chuzhoyTekst.length === 0 && rb.ogranicheniya.length === 0 && !rb.bloki.some((b) => b.vid !== 'хостер');
  if (cc.length) zakrytyhVsego += 1;
  if (JSON.stringify(cc) !== JSON.stringify(cl)) {
    raskhozhdeniy += 1;
    if (primery.length < 5) primery.push(`РАСХОЖДЕНИЕ (${gde}): robots.cc ${cc.slice(0, 2).join(', ')} | check-live ${cl.slice(0, 2).join(', ')}\n${telo}`);
  }
  if (cc.length && rb.nashCelikom && vneOk && cl.length === 0) {
    lozhnyhOk += 1;
    if (primery.length < 10) primery.push(`ЛОЖНЫЙ OK (${gde}): robots.cc ${cc.slice(0, 2).join(', ')}\n${telo}`);
  }
}
p(`тел: 20000; robots.cc закрывает поисковик на пути сборки — в ${zakrytyhVsego}; расхождений «поисковики» check-live с robots.cc — ${raskhozhdeniy}; ложных ok (robots.cc закрывает, check-live: наш файл целиком, «вне» и «поисковики» ok) — ${lozhnyhOk}`);
for (const x of primery) p(x);
p(`\nошибок сверки: ${oshibok}`);
vyvod('derzhit-poisk-vyvod.txt', out);
