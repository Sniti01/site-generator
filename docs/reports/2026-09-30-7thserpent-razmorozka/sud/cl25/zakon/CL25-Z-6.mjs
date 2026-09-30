// CL25-Z-6 (вне диффа шага 2 — проверка «строка Sitemap» не менялась): сверка — точной строкой «Sitemap: <адрес>».
// Google читает ключ без учёта регистра (robots.cc: KeyIsSitemap — StartsWithIgnoreCase), срезает комментарий и пробелы.
// Безвредная правка файла владельца в репозитории (он пишет файл руками, ключи уже в разном регистре: «User-Agent» и
// «User-agent») — сервер = репозиторий, наш файл целиком, поисковики открыты — и всё же ПЛОХО «строка Sitemap».
import { progon, zapisat, nashRobots, PUTI_SBORKI, CL } from './obshchee.mjs';

const ADRES = 'https://www.7thserpent.com/sitemap-index.xml';
const pravka = (na) => {
  const t = nashRobots.replace(`Sitemap: ${ADRES}`, na);
  if (t === nashRobots) throw new Error('правка не сработала');
  return t;
};
const poGoogle = (stroka) => {
  const s = stroka.replace(/#.*$/, '').trim();
  const d = s.indexOf(':');
  return { klyuchSitemap: /^sitemap$/i.test(s.slice(0, d).trim()), adres: s.slice(d + 1).trim() };
};
const VARIANTY = [
  ['M1 «sitemap:» строчными — в репозитории и на сервере', `sitemap: ${ADRES}`],
  ['M2 «SITEMAP:» заглавными', `SITEMAP: ${ADRES}`],
  ['M3 без пробела после двоеточия', `Sitemap:${ADRES}`],
  ['M4 комментарий в конце строки', `Sitemap: ${ADRES} # sitemap index`],
  ['M5 табуляция после двоеточия', `Sitemap:\t${ADRES}`],
];
const out = [];
for (const [imya, stroka] of VARIANTY) {
  const t = pravka(stroka);
  const r = await progon({ mimo: t, nash: t });
  const c = r.proverki.find((x) => x.imya === 'robots.txt: строка Sitemap');
  out.push(`== ${imya}: «${stroka}» ==`, `итог ${r.okCount}/${r.vsego}; ПЛОХО: ${r.plokho.join(' | ') || '—'}`, `  строка Sitemap: ${c.ok ? 'ok' : 'ПЛОХО'} — ${c.otkuda}`);
  out.push(`  по правилам Google: ${JSON.stringify(poGoogle(stroka))}; закрыто: ${JSON.stringify(CL.zakrytoPoiskovikam(t, PUTI_SBORKI))}`, '');
}
zapisat('CL25-Z-6-vyvod.txt', out);
