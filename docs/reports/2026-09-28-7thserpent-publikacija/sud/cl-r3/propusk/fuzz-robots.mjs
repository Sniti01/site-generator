// Разностная проба zakrytoPoiskovikam (инструмент) против модели robots.cc (google.mjs) на случайных файлах из
// словаря строк (ключи с опечатками, без двоеточия, * с хвостом, \r, комментарии, Sitemap, пустые строки) по путям
// настоящей сборки dist/. Считаются расхождения обоих направлений; для линзы «ложный ok» важно «Google закрыл —
// инструмент открыл». Генератор — с зерном, прогон повторим.
import { join } from 'node:path';
import { CL, SAYT, vyvesti } from './obshchee.mjs';
import { google, googleImage } from './google.mjs';

const sborka = CL.sborkaIzDist(join(SAYT, 'dist'));
const PUTI = sborka.puti;
let zerno = 20260928;
const sl = () => ((zerno = (zerno * 1103515245 + 12345) % 2147483648) / 2147483648);
const iz = (a) => a[Math.floor(sl() * a.length)];

const UA_K = ['User-agent:', 'user-agent:', 'User agent:', 'Useragent:', 'User-agents:', 'User-Agent :', 'User-agent'];
const UA_V = ['*', '*', 'Googlebot', 'googlebot', 'Googlebot/2.1', 'Googlebot-Image', 'Bingbot', 'bingbot', 'msnbot', 'AhrefsBot', '', 'Google', '* (all)', '*foo', 'Googlebot*', 'Googlebot-Image/1.0'];
const PR_K = ['Disallow:', 'Allow:', 'Dissallow:', 'Disallowed:', 'disallow', 'Allow', 'allow:', 'Disalow:', 'Noindex:', 'Crawl-delay:'];
const PR_V = ['/', '', '/*', '/movie/', '/*.css$', '/$', '*', '/_astro/', '/*?', '/m', '/movie', '/404/', '/*/', '/max-payne-3/guide/', '/favicon.svg$', '/_astro/*.webp', '/*.webp$', '/max-payne-3/', '/max-payne-3/$', '/*/guide/', '/**', '/*$'];
const PROCHEE = ['# comment', '', 'Sitemap: https://www.7thserpent.com/sitemap-index.xml', 'Crawl-delay: 5', 'Content-Signal: search=yes'];

function fajl() {
  const n = 2 + Math.floor(sl() * 9);
  const stroki = [];
  for (let i = 0; i < n; i++) {
    const v = sl();
    if (v < 0.3) {
      const k = iz(UA_K);
      const z = iz(UA_V);
      stroki.push(k.endsWith(':') || k.endsWith(' :') ? `${k} ${z}` : `${k} ${z}`);
    } else if (v < 0.85) stroki.push(`${iz(PR_K)} ${iz(PR_V)}`);
    else stroki.push(iz(PROCHEE));
  }
  const kon = sl() < 0.1 ? '\r\n' : sl() < 0.05 ? '\r' : '\n';
  return stroki.join(kon) + kon;
}

const N = 30000;
const lozhnyyOk = [];
const lozhnoePlokho = [];
let sZakrytiem = 0;
for (let i = 0; i < N; i++) {
  const t = fajl();
  const tool = new Set(CL.zakrytoPoiskovikam(t, PUTI));
  if (tool.size) sZakrytiem++;
  for (const p of PUTI) {
    for (const [bot, gOtkr] of [['googlebot', google(t, 'googlebot', p)], ['googlebot-image', googleImage(t, p)], ['bingbot', google(t, 'bingbot', p)]]) {
      const tOtkr = !tool.has(`${bot} ${p}`);
      if (!gOtkr && tOtkr && lozhnyyOk.length < 5) lozhnyyOk.push({ bot, p, t });
      if (gOtkr && !tOtkr && lozhnoePlokho.length < 5) lozhnoePlokho.push({ bot, p, t });
    }
  }
}
vyvesti('fuzz-robots', [
  `файлов ${N}, путей сборки ${PUTI.length}, ботов 3; файлов, где инструмент что-то закрыл: ${sZakrytiem}`,
  `«Google закрыл — инструмент открыл» (ложный ok): ${lozhnyyOk.length ? '' : 'нет'}`,
  ...lozhnyyOk.map((x) => `  ${x.bot} ${x.p}: ${JSON.stringify(x.t)}`),
  `«Google открыл — инструмент закрыл» (вне линзы): ${lozhnoePlokho.length ? '' : 'нет'}`,
  ...lozhnoePlokho.map((x) => `  ${x.bot} ${x.p}: ${JSON.stringify(x.t)}`),
]);
