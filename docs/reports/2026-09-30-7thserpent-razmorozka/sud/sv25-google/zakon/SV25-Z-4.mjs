// SV25-Z-4: корень, где кроме файла подтверждения владельца ничего нет (первая выкладка после очистки www), —
// проход строкой «свежий каталог хостера — без нашей сборки; файл подтверждения Google …». Хостера там нет: это пустой
// корень с файлом владельца; лист сессии 23 учил ждать «папка робота: пустой корень».
import { G, STROKA, rabochaya, ubrat, shagPapki, zapis } from './obshchee-z.mjs';

const S = STROKA();
const out = [];
const sluchai = [
  ['пустой корень (как было)', './\n../\n', {}],
  ['в корне только файл подтверждения владельца', `./\n../\n${G}\n`, { skachano: { [G]: S } }],
];
for (const [imya, spisok, dop] of sluchai) {
  const d = rabochaya();
  try {
    const r = shagPapki(d, spisok, { index: null, sitemap: null, ...dop });
    out.push(`${imya}: код ${r.kod}`);
    out.push(`    ${r.vyvod}`);
  } finally {
    ubrat(d);
  }
}
out.push('');
out.push('во втором случае строка говорит «свежий каталог хостера — без нашей сборки», хотя ни заглушки, ни служебных папок хостера нет.');
zapis('SV25-Z-4-vyvod.txt', out);
