// CL3-P-4: «HTML страниц = сборка» сравнивает текст, раскодированный fetch всегда как UTF-8 (Body.text() не читает
// charset), и не смотрит Content-Type. Байты — те же, что в dist/, но: (а) `text/html; charset=windows-1251` (Apache
// AddDefaultCharset хостера): кодировка поля HTTP сильнее <meta charset> — читатель видит «вЂ”» вместо «—» в каждом
// заголовке; (б) `text/plain`: браузер показывает исходник; (в) `application/octet-stream`: скачивание вместо страницы.
// Прогон — через poluchitSetyu самого инструмента; тело — байты UTF-8 страницы образца.
import { progon, vyvesti, stroka, B, STRANICY, struktura } from './obshchee.mjs';
import { cherezSet } from './set.mjs';

const stranicy = new Set([...STRANICY.map((p) => `${B}${p.url}`), `${B}/404/`]);
const out = [];
for (const tip of ['text/html; charset=windows-1251', 'text/plain; charset=utf-8', 'application/octet-stream']) {
  const r = await progon(() => {}, {
    poluchitIz: (karta) => cherezSet((url, o) => (stranicy.has(url) ? { pary: [['content-type', tip]], bayty: Buffer.from(o.telo, 'utf8') } : {}))(karta),
  });
  out.push(`— Content-Type: ${tip} на всех страницах —`);
  out.push(`итог инструмента: ${r.itog}`);
  out.push(stroka(r.najti('HTML страниц = сборка (dist)')));
}
const t = struktura.pages.find((p) => p.url === '/').title;
out.push(`заголовок главной, как его раскодирует браузер по charset=windows-1251: «${new TextDecoder('windows-1251').decode(Buffer.from(t, 'utf8'))}» (в сборке — «${t}»)`);
vyvesti('p4-content-type', out);
