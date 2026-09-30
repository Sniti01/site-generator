// SV25-Z-1: файл подтверждения с отличием от строки (BOM, пробел или табуляция в конце, лишний перевод строки,
// одинокий CR, неразрывный пробел) — стоп по записи П113 п. 9 («ровно …, допустим один перевод строки»), но строка
// СТОП одна и та же для всех форм и не называет отличия; при невидимом отличии владелец видит в редакторе файлового
// менеджера ровно «google-site-verification: <имя>», и совет «иное — удали его» к увиденному не относится.
import { G, STROKA, cls, rabochaya, ubrat, shagPapki, zapis } from './obshchee-z.mjs';

const S = STROKA();
const formy = [
  ['как отдаёт Search Console (для сравнения — проход)', S],
  ['BOM UTF-8 в начале (Блокнот Windows до 2019, «UTF-8»; редакторы с «UTF-8 with BOM»)', '﻿' + S],
  ['BOM и CRLF в конце', '﻿' + S + '\r\n'],
  ['пробел в конце', S + ' '],
  ['табуляция в конце', S + '\t'],
  ['пробел и перевод строки в конце', S + ' \n'],
  ['неразрывный пробел в конце (U+00A0)', S + ' '],
  ['одинокий CR в конце', S + '\r'],
  ['два перевода строки в конце (редактор дописал свой к уже бывшему)', S + '\n\n'],
  ['CRLF дважды в конце', S + '\r\n\r\n'],
  ['перевод строки в начале', '\n' + S],
];
// Что различимо глазом в редакторе: BOM, пробелы, табуляции, неразрывные пробелы и CR у конца строки — нет;
// лишняя пустая строка (в начале или в конце) — видна. Без невидимого файл равен разрешённой форме — отличие невидимо.
const bezNevidimogo = (t) => t.replace(/^﻿/, '').replace(/[ \t \r]+(?=\n|$)/g, '');
const nevidimo = (t) => t !== S && [S, S + '\n'].includes(bezNevidimogo(t));
const out = [];
const stroki = new Map();
let nevidimykh = 0;
for (const [imya, telo] of formy) {
  const d = rabochaya();
  try {
    const r = shagPapki(d, cls([G]), { skachano: { [G]: telo } });
    const bajty = Buffer.from(telo, 'utf8');
    const vid = telo === S ? '—' : nevidimo(telo) ? 'НЕВИДИМО (в редакторе ровно ожидаемая строка)' : 'видно (лишняя пустая строка)';
    if (r.kod === 1 && nevidimo(telo)) nevidimykh += 1;
    out.push(`${imya}: код ${r.kod}; байт ${bajty.length} (ждём ${Buffer.byteLength(S)}, +1 LF или +2 CRLF); отличие в редакторе: ${vid}`);
    out.push(`    ${r.vyvod}`);
    if (r.kod === 1) stroki.set(imya, r.vyvod);
  } finally {
    ubrat(d);
  }
}
const raznye = new Set(stroki.values());
out.push('');
out.push(`форм со стопом: ${stroki.size}, из них с невидимым отличием: ${nevidimykh}; различных строк СТОП среди всех: ${raznye.size} — ${raznye.size === 1 ? 'строка одна и та же: отличие не названо' : 'строки различаются'}`);
const s = [...raznye][0] ?? '';
out.push(`в строке есть «BOM»: ${/BOM/.test(s) ? 'да' : 'нет'}; «пробел»: ${/пробел/.test(s) ? 'да' : 'нет'}; «перевод строки»: ${/перевод строки/.test(s) ? 'да' : 'нет'}; число байт: ${/\d+ байт/.test(s) ? 'да' : 'нет'}`);
out.push('совет строки — «Открой файл …: внутри ровно «google-site-verification: <имя файла>»; иное — удали его и подтверди сайт в Search Console заново»: при невидимом отличии владелец видит ровно эту строку — «иное» к нему не относится, действия нет.');
zapis('SV25-Z-1-vyvod.txt', out);
