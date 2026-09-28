// Набросок правок SV3-Z-2 и SV3-Z-3 (не в репозитории): (1) имена файлов с расширением файла не прячутся как
// «имена доменов»; (2) «оборванная первая выкладка» — когда в корне без index.html ТОЛЬКО имена верха сборки
// (и .in.*), а не только при наличии _astro. Отказ остаётся отказом; меняется причина. Прогон на образцах Z2, Z3
// и на образцах раундов 1–2, где строка обязана остаться (A1, A2, A8, SV2-Z-1, «не печатает имён доменов»).
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const SV = await import(pathToFileURL(SAYT + '/tools/storozha-vykladki.mjs').href);
const PRIN = JSON.parse(readFileSync(SAYT + '/gates/sborka-prinyataya.json', 'utf8'));
const V = [...new Set(Object.keys(PRIN.fajly).map((f) => f.split('/')[0]))];
const SLUZHEBNYE = SV.SLUZHEBNYE;

const pokhozheNaDomen = (s) => /^[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+$/u.test(s) && !s.startsWith('.');
const RASSHIRENIE = /\.(html?|php\d?|png|jpe?g|gif|webp|avif|svg|ico|txt|xml|css|js|mjs|json|webmanifest|woff2?|map|gz|log|ini|bak)$/i;
const skryt = (s) => pokhozheNaDomen(s) && !RASSHIRENIE.test(s);
const pokazatImena = (a) => {
  const vidno = a.filter((x) => !skryt(x));
  const skryto = a.length - vidno.length;
  return [vidno.slice(0, 3).join(', '), skryto ? `${skryto} с именами доменов` : ''].filter(Boolean).join(' и ');
};
/** Хвост papka после ветки «наш index.html» — как в f534de5, с двумя правками. */
function khvost(imena) {
  const vse = imena.map((s) => s.replace(/[/@]$/, ''));
  const vneSborki = vse.filter((s) => !new Set([...V, ...SLUZHEBNYE]).has(s) && !s.startsWith('.in.'));
  if (!imena.includes('index.html') && vneSborki.length === 0 && vse.some((s) => !SLUZHEBNYE.includes(s))) {
    return `СТОП: в корне робота — только имена нашей сборки, index.html нет (${pokazatImena(vse)}): оборванная первая выкладка или файлы хостера с теми же именами (.htaccess, favicon.ico). Удали содержимое 7thserpent.com/www в файловом менеджере панели и запусти выкладку снова (вход SERPENT_FIRST=on).`;
  }
  return `СТОП: в корне робота непустой каталог без нашей сборки (${vse.length} записей, например ${pokazatImena(vneSborki.length ? vneSborki : vse)}) — …`;
}
const obrazcy = [
  ['Z2a', ['.htaccess', '.in.favicon-32x32.png.', 'apple-touch-icon.png', 'favicon-16x16.png'], /оборванная/],
  ['Z2b', ['.htaccess', '.in.index.html.', 'apple-touch-icon.png', 'favicon-16x16.png', 'favicon-32x32.png', 'favicon.ico', 'favicon.svg', 'icon-192.png'], /оборванная/],
  ['SV2-Z-1 оборванная (.htaccess, 404/, _astro/)', ['.htaccess', '404/', '_astro/'], /оборванная/],
  ['SV2-Z-1 файлы хостера .htaccess и favicon.ico', ['.htaccess', 'favicon.ico'], /файлы хостера/],
  ['Z3b заглушка и logo.png', ['index.html', 'logo.png'], /logo\.png/],
  ['SV1-O-1 A1 корень первого сайта без index.html', ['.htaccess', '404/', '_astro/', 'guides/', 'robots.txt', 'sitemap-index.xml', 'sitemap-0.xml'], /без нашей сборки.*guides/],
  ['SV1-O-1 A2 робот в _astro первого сайта', ['BaseLayout.Ab12cd.css', 'hero.Xy_1.webp', 'public-sans.woff2'], /без нашей сборки.*BaseLayout/],
  ['SV1-O-4 A8 папки доменов без отметки типа (имена не печатаются)', ['7dtd.com.pl', 'ac4bf-thewatch.com', '7thserpent.com'], /^(?!.*(7dtd|ac4bf|7thserpent\.com\b)).*3 с именами доменов/],
];
for (const [id, imena, zhdem] of obrazcy) {
  const s = khvost(imena);
  console.log(`${zhdem.test(s) ? 'как надо' : 'НЕ ТАК'} | ${id} | ${s.slice(0, 260)}`);
}
