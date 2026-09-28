// Что из правок раунда 1 держит класс: варианты образцов раунда 1 (не сами образцы проб), у каждого — какая проверка
// обязана покраснеть. Итог «держит» — если краснеет названная проверка.
//   node derzhit.mjs
import { progon, zamenit, sZag, MIMO, BEZ, HOSTER, nashRobots, B, HOST, igra, YASHCHIK, STRANICY, vyvesti } from './obshchee.mjs';

const vyvod = [];
const log = (...a) => vyvod.push(a.join(' '));
const vBlok = (gruppa) => HOSTER.replace('# END adm.tools', gruppa + '# END adm.tools') + nashRobots;
const robots = (telo, oba = true) => (k) => {
  zamenit(k, MIMO, (o) => ({ ...o, telo }));
  if (oba) zamenit(k, BEZ, (o) => ({ ...o, telo }));
};
const vstavka = (url, html) => (k) => zamenit(k, url, (o) => ({ ...o, telo: o.telo.replace('</main>', `${html}</main>`) }));
const ZAKR = 'robots.txt: поисковики не закрыты';
const VST = 'HTML без вставок Cloudflare и чужих ресурсов';
const NASH = 'robots.txt: наш файл целиком';
const stroki = nashRobots.split('\n');
const VARIANTY = [
  // ключи и группы (CL1-P-9, CL1-P-10)
  ['«DISALLOW: /» заглавными в группе Googlebot', robots(vBlok('User-agent: Googlebot\nDISALLOW: /\n')), ZAKR],
  ['«disalow: /» (опечатка) в группе Googlebot', robots(vBlok('User-agent: Googlebot\ndisalow: /\n')), ZAKR],
  ['«Disallow\t/» (таб вместо двоеточия)', robots(vBlok('User-agent: Googlebot\nDisallow\t/\n')), ZAKR],
  ['«useragent: googlebot/2.1»', robots(vBlok('useragent: googlebot/2.1\nDisallow: /\n')), ZAKR],
  ['группа Googlebot через комментарии и Sitemap', robots(vBlok('User-agent: Googlebot\n# note\nSitemap: https://x.example/s.xml\n\nDisallow: /\n')), ZAKR],
  ['блок после нашего файла: «Disallow: /priv» продолжает нашу группу *', robots(nashRobots + '\n# BEGIN adm.tools Managed content\nDisallow: /priv\n# END adm.tools Managed content\n'), ZAKR],
  // «Allow: /$» + «Disallow: /» ничего не закрывает: наше «Allow: /» той же длины (Allow при равенстве) — и у Google так же;
  // закрывает всё, кроме главной, только «Disallow: /*» (длина 2):
  ['«Allow: /$» + «Disallow: /*» — закрыто всё, кроме главной', robots(vBlok('User-agent: *\nAllow: /$\nDisallow: /*\n')), ZAKR],
  ['«Disallow: /*/» (длиннее Allow: /)', robots(vBlok('User-agent: *\nDisallow: /*/\n')), ZAKR],
  // наш файл: удаление, перестановка, строки нашего файла вне него (CL1-Z-1)
  ['из нашего файла удалена строка «Allow: /»', robots(HOSTER + stroki.filter((s) => s !== 'Allow: /').join('\n'), false), NASH],
  ['в нашем файле переставлены «User-agent: *» и «Allow: /»', robots(HOSTER + nashRobots.replace('User-agent: *\nAllow: /', 'Allow: /\nUser-agent: *'), false), NASH],
  ['из нашего файла удалена строка Sitemap', robots(HOSTER + stroki.filter((s) => !s.startsWith('Sitemap:')).join('\n'), false), NASH],
  // кэш robots.txt (CL1-P-1, CL1-P-2)
  ['мимо кэша — «hit» строчными', (k) => zamenit(k, MIMO, (o) => sZag(o, { 'cf-cache-status': 'hit' })), 'robots.txt мимо кэша: обход кэша сработал'],
  ['мимо кэша — STALE, тело то же', (k) => zamenit(k, MIMO, (o) => sZag(o, { 'cf-cache-status': 'STALE' })), 'robots.txt мимо кэша: обход кэша сработал'],
  ['без параметра — EXPIRED и отличается', (k) => zamenit(k, BEZ, () => ({ status: 200, location: '', telo: HOSTER + 'User-agent: *\nAllow: /\n', zagolovok: (i) => (i === 'cf-cache-status' ? 'EXPIRED' : '') })), 'robots.txt без параметра (его берут роботы)'],
  ['без параметра — HIT, «Disallow: /privacy/» для всех', (k) => zamenit(k, BEZ, (o) => ({ ...o, telo: HOSTER + 'User-agent: *\nDisallow: /privacy/\n' })), 'robots.txt без параметра (его берут роботы)'],
  // Cache-Control (CL1-P-3)
  ['Cache-Control «MAX-AGE = 600, must-revalidate»', (k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'cache-control': 'MAX-AGE = 600, must-revalidate' })), 'главная: Cache-Control у HTML (max-age=0, must-revalidate)'],
  // X-Robots-Tag (CL1-P-13) — одна страница, форма «googlebot: NoIndex»
  ['X-Robots-Tag «googlebot: NoIndex» только на /privacy/', (k) => zamenit(k, `${B}/privacy/`, (o) => sZag(o, { 'x-robots-tag': 'googlebot: NoIndex' })), 'страницы без X-Robots-Tag noindex'],
  ['X-Robots-Tag «none» только на /404/ напрямую', (k) => zamenit(k, `${B}/404/`, (o) => sZag(o, { 'x-robots-tag': 'none' })), 'страницы без X-Robots-Tag noindex'],
  // Set-Cookie (CL1-P-12) — на редиректе и на robots.txt
  ['Set-Cookie на 301 http → https', (k) => zamenit(k, `http://${HOST}/`, (o) => sZag(o, { 'set-cookie': 'sid=1; path=/' })), 'ответы без Set-Cookie'],
  ['Set-Cookie на robots.txt без параметра', (k) => zamenit(k, BEZ, (o) => sZag(o, { 'set-cookie': '__cf_bm=1; path=/' })), 'ответы без Set-Cookie'],
  // карта (CL1-P-14)
  ['адрес карты /movie/ — 301 на главную', (k) => k.set(`${B}/movie/`, { status: 301, location: `${B}/`, telo: '', zagolovok: () => '' }), 'sitemap-0.xml: адреса отвечают 200 со своим canonical'],
  ['адрес карты /mods/ — 200, canonical на /cheats/', (k) => zamenit(k, `${B}/mods/`, (o) => ({ ...o, telo: o.telo.replace(`${B}/mods/`, `${B}/cheats/`) })), 'sitemap-0.xml: адреса отвечают 200 со своим canonical'],
  // вставки Cloudflare и чужие ресурсы (CL1-P-6)
  ['Rocket Loader', vstavka(`${B}/`, '<script src="/cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" data-cf-settings="x-|49" defer></script>'), VST],
  ['Zaraz', vstavka(`${B}/cheats/`, '<script src="/cdn-cgi/zaraz/s.js?z=1"></script>'), VST],
  ['протокол-относительный //', vstavka(`${B}/`, '<script src="//t.tracker.example/t.js"></script>'), VST],
  ['HTTPS:// заглавными', vstavka(`${B}/`, '<img src="HTTPS://img.tracker.example/x.png" alt="">'), VST],
  ['хост-двойник www.7thserpent.com.tracker.example', vstavka(`${B}/`, '<script src="https://www.7thserpent.com.tracker.example/t.js"></script>'), VST],
  ['userinfo: https://www.7thserpent.com@tracker.example/', vstavka(`${B}/`, '<script src="https://www.7thserpent.com@tracker.example/t.js"></script>'), VST],
  ['<link rel="dns-prefetch" href="//fonts.gstatic.com">', vstavka(`${B}/`, '<link rel="dns-prefetch" href="//fonts.gstatic.com">'), VST],
  ['<script/src=…> (косая вместо пробела)', vstavka(`${B}/`, '<script/src="https://t.tracker.example/t.js"></script>'), VST],
  ['вставка только на 404 несуществующего адреса', (k) => zamenit(k, `${B}/net-takoy-stranicy-m1/`, (o) => ({ ...o, telo: o.telo.replace('</main>', '<script defer src="https://static.cloudflareinsights.com/beacon.min.js"></script></main>') })), VST],
  // ящик (CL1-P-8)
  ['mailto есть, текст ссылки другой', (k) => zamenit(k, `${B}/privacy/`, (o) => ({ ...o, telo: o.telo.replace(`>${YASHCHIK}<`, '>write to us<') })), '/privacy/: адрес ящика открытым текстом'],
  // canonical у игры (CL1-P-7)
  ['страница игры — canonical на главную', (k) => zamenit(k, `${B}${igra}`, (o) => ({ ...o, telo: o.telo.replace(`${B}${igra}`, `${B}/`) })), `страница ${igra}: canonical`],
];
let derzhit = 0;
for (const [imya, f, zhdem] of VARIANTY) {
  const r = await progon(f);
  const c = r.najti(zhdem);
  const ok = c && !c.ok;
  if (ok) derzhit++;
  log(`${ok ? 'держит ' : 'ПРОПУСК'} ${imya}: ${r.itog}; «${zhdem}» — ${c ? (c.ok ? 'ok' : 'ПЛОХО') : 'нет проверки'}`);
}
log(`\nдержит ${derzhit} из ${VARIANTY.length}; страниц структуры без /404/: ${STRANICY.length}`);
vyvesti('derzhit', vyvod);
