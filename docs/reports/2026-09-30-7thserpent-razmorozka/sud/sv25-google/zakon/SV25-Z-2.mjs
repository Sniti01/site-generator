// SV25-Z-2: причина «не скачан — сверить нечем» получает тот же совет, что и «внутри иное»: открыть файл в панели
// и, если иное, удалить его и подтвердить сайт заново. Но при «не скачан» содержимое на сервере может быть верным —
// сбой в скачивании (шаг workflow, --include-glob, обрыв соединения); совет ведёт владельца к файлу, а не к повтору
// запуска. Кроме того, проверка файла Google стоит раньше суда index.html: если скачивание корня не дало ничего
// (remote-top нет), стоп называет файл Google, а не общую причину «содержимого index.html сторож не получил».
import { G, STROKA, cls, nash, karta, rabochaya, ubrat, shagPapki, zapis } from './obshchee-z.mjs';

const S = STROKA();
const out = [];
const sluchai = [
  // [имя, список, опции]
  ['на сервере файл Google верный (как у Search Console), скачались index.html и карта, файл Google — нет', cls([G]), { skachano: {} }],
  ['скачивание корня не дало ничего (remote-top нет), на сервере наша выкладка и файл Google', cls([G]), { bezRemoteTop: true }],
  ['то же без файла Google (как до П113) — для сравнения', cls([]), { bezRemoteTop: true }],
];
for (const [imya, spisok, opcii] of sluchai) {
  const d = rabochaya();
  try {
    const r = shagPapki(d, spisok, opcii);
    out.push(`${imya}: код ${r.kod}`);
    out.push(`    ${r.vyvod}`);
  } finally {
    ubrat(d);
  }
}
out.push('');
out.push(`на сервере в случаях 1–2 файл верный: «${S}» (${Buffer.byteLength(S)} байт) — владелец откроет его и увидит ровно ожидаемую строку;`);
out.push('совет строки СТОП («иное — удали его и подтверди сайт в Search Console заново») к верному файлу не относится; о повторе запуска и сбое скачивания строка не говорит;');
out.push('в случае 2 без файла Google стоп назвал бы общую причину (index.html не получен), с файлом Google — только файл Google.');
zapis('SV25-Z-2-vyvod.txt', out);
