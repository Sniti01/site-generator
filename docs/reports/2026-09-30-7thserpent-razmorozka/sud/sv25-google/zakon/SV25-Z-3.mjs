// SV25-Z-3: прежняя строка СТОП «оборванная первая выкладка или файлы хостера с теми же именами» велит «Удали
// содержимое 7thserpent.com/www … и запусти выкладку снова». С П113 в корне законно лежит файл подтверждения Google
// (сверенный, не причина стопа), но совет его не исключает: владелец, сделав по строке, сотрёт и файл подтверждения —
// Search Console потеряет подтверждение. Та же строка — и для файлов хостера (.htaccess, favicon.ico) рядом с файлом Google.
import { G, STROKA, rabochaya, ubrat, shagPapki, zapis } from './obshchee-z.mjs';

const S = STROKA();
const out = [];
const sluchai = [
  ['оборванная первая выкладка (часть нашей сборки без index.html) и сверенный файл Google', './\n../\n.htaccess\n404/\n_astro/\napple-touch-icon.png\nfavicon.ico\n' + G + '\n'],
  ['свежий каталог с файлами хостера .htaccess и favicon.ico и сверенный файл Google', './\n../\n.htaccess\nfavicon.ico\n' + G + '\n'],
];
for (const [imya, spisok] of sluchai) {
  const d = rabochaya();
  try {
    const r = shagPapki(d, spisok, { index: null, sitemap: null, skachano: { [G]: S } });
    out.push(`${imya}: код ${r.kod}`);
    out.push(`    ${r.vyvod}`);
    out.push(`    причина стопа — файл Google: ${r.vyvod.includes(G) ? 'да' : 'нет'}; совет «Удали содержимое 7thserpent.com/www»: ${r.vyvod.includes('Удали содержимое 7thserpent.com/www') ? 'да' : 'нет'}; исключение для google<код>.html в совете: ${/кроме|google/.test(r.vyvod) ? 'есть' : 'нет'}`);
  } finally {
    ubrat(d);
  }
}
zapis('SV25-Z-3-vyvod.txt', out);
