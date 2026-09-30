// CL25-P-5: разбор check-live снимает пробелы шире robots.cc (JS trim и \s — NBSP U+00A0, BOM U+FEFF, \v; robots.cc —
// только ASCII-пробелы, разделитель без двоеточия — пробел или таб). Строка « User-agent: Foo» (или «User-agent\vFoo»)
// для check-live — новая группа, для Google — неизвестный ключ; правило после неё Google относит к предыдущей группе.
// В файле владельца последняя группа — Googlebot (Allow: /): блок хостера после файла с такой строкой и «Disallow: /*»
// закрывает Googlebot и Googlebot-Image на всех путях по robots.cc — check-live 44 из 44. Предел разбора не от этой
// правки: с прежним файлом (последняя группа *) та же форма закрывала бы всех — сравнение ниже.
import { zakrytoCc } from './robots-cc.mjs';
import { progon, nashRobots, PUTI_SBORKI, OBRAZEC24, B, vyvod } from './stend.mjs';

const out = [];
const p = (...a) => out.push(a.join(' '));
const telo24 = OBRAZEC24.otvety[`${B}/robots.txt?live-check=${OBRAZEC24.metka}`].telo;
const konec = '# END adm.tools Managed content\n\n';
const PREZHNIY = telo24.slice(telo24.indexOf(konec) + konec.length);
const blok = (s) => `\n# BEGIN adm.tools Managed content\n${s}\nDisallow: /*\n# END adm.tools Managed content\n`;
const formy = [
  ['NBSP перед User-agent', ' User-agent: Foo'],
  ['вертикальная табуляция вместо двоеточия', 'User-agent\u000bFoo'],
  ['BOM перед User-agent', '﻿User-agent: Foo'],
  ['контроль: обычная строка User-agent: Foo', 'User-agent: Foo'],
];
for (const [nashFayl, nashImya] of [[nashRobots, 'файл владельца (cbe35eb)'], [PREZHNIY, 'прежний файл (add241a) — для сравнения']]) {
  p(`== наш файл: ${nashImya} ==`);
  for (const [imya, stroka] of formy) {
    const telo = nashFayl + blok(stroka);
    const r = await progon(telo, { nash: nashFayl });
    const cc = zakrytoCc(telo, PUTI_SBORKI);
    p(`${imya}: check-live ${r.itog}${r.plokho.length ? ` (ПЛОХО: ${r.plokho.join(', ')})` : ''}; robots.cc закрыто ${cc.length}: ${cc.slice(0, 3).join(', ') || '—'}${cc.length > 3 ? ' …' : ''}`);
  }
  p('');
}
p('Байты строки с NBSP: ' + Buffer.from(' User-agent: Foo', 'utf8').toString('hex'));
vyvod('CL25-P-5-vyvod.txt', out);
