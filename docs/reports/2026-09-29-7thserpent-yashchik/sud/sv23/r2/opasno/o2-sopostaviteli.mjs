// SV23-O2 · сопоставители проблем (problem matchers): шаг actions/setup-node@v5 регистрирует на всю работу три
// сопоставителя (tsc, eslint-stylish, eslint-compact — «##[add-matcher]» в его main.ts). Раннер прогоняет через них
// каждую строку вывода следующих шагов, в том числе шага «Домен уже привязан?»: совпавшая строка становится аннотацией
// (error/warning) на странице запуска, а сама строка в журнал как есть не пишется — вместо неё сообщение аннотации.
// bezopasno гасит только «##[» и «::» — текст ответа домена (<title>, canonical чужого сайта, негодный Location) в форме
// «x(1,1): error TS1: …» или «x: line 1, col 1, Warning - … (…)» проходит. Шаблоны сопоставителей и поведение раннера
// (ConvertToIssue: severity error|warning|notice, иначе пропуск; файл, которого нет, — отбрасывается, аннотация остаётся;
// совпавшая строка заменяется записью аннотации) — ПО ПАМЯТИ скептика, не сверены с actions/setup-node и actions/runner
// (сети нет). Строки хоста — настоящие, из domen сторожа над подставным poluchit.
import { SV, W, G, otv, iz, vyvod, ZAGLUSHKA } from './obshchee-o2.mjs';

const SOPOSTAVITELI = [
  ['tsc', /^([^\s].*)[(:](\d+)[,:](\d+)(?:\):\s+|\s+-\s+)(error|warning|info)\s+TS(\d+)\s*:\s*(.*)$/, (m) => ({ file: m[1], severity: m[4], message: m[6] })],
  ['eslint-compact', /^(.+):\sline\s(\d+),\scol\s(\d+),\s(Error|Warning|Info)\s-\s(.+)\s\((.+)\)$/, (m) => ({ file: m[1], severity: m[4], message: m[5] })],
];
function annotaciya(stroka) {
  for (const [imya, re, polya] of SOPOSTAVITELI) {
    const m = re.exec(stroka);
    if (!m) continue;
    const p = polya(m);
    if (!/^(error|warning|notice)$/i.test(p.severity)) return `${imya}: совпало, но severity «${p.severity}» раннер пропускает`;
    return `${imya}: АННОТАЦИЯ ${p.severity.toLowerCase()} «${p.message}»; строка хоста в журнал не пишется (файл «${p.file.slice(0, 40)}…» отброшен — его нет)`;
  }
  return 'нет';
}
const stranica = (golova) => `<!DOCTYPE html><html><head><meta charset="utf-8">${golova}</head><body></body></html>`;

const OBRAZCY = [
  ['контроль: заглушка хостера', { [W]: otv(200, ZAGLUSHKA), [G]: otv(200, ZAGLUSHKA) }, true, true],
  ['<title> в форме tsc, оба имени, первая, вход on', { [W]: otv(200, stranica('<title>Сайт(1,1): error TS1: домен не привязан, выкладка не пойдёт</title>')), [G]: otv(200, stranica('<title>Сайт(1,1): error TS1: домен не привязан, выкладка не пойдёт</title>')) }, true, true],
  ['<title> в форме eslint-compact, оба имени, первая, вход on', { [W]: otv(200, stranica('<title>Сайт: line 1, col 1, Warning - вход SERPENT_DOMAIN_BOUND не нужен</title>')), [G]: otv(200, stranica('<title>Сайт: line 1, col 1, Warning - вход SERPENT_DOMAIN_BOUND не нужен</title>')) }, true, true],
  ['негодный Location в форме tsc (строкой с правки SV23-Z-4), не первая', { [W]: otv(301, '', 'http://x(1,1): error TS1: сертификат отозван'), [G]: otv(301, '', W) }, false, false],
  ['canonical чужого сайта в форме eslint-compact, первая, вход on', { [W]: otv(200, stranica('<link rel="canonical" href="https://chuzhoi.example/: line 1, col 1, Error - первая выкладка прошла">')), [G]: otv(200, ZAGLUSHKA) }, true, true],
];

const stroki = ['Строки сторожа домена против сопоставителей setup-node (модель по памяти, см. шапку).', ''];
let naydeno = 0;
for (const [imya, karta, pervyi, soglasen] of OBRAZCY) {
  const r = await SV.domen({ poluchit: iz(karta), pervyi, soglasen });
  stroki.push(`${imya}: сторож — ${r.ok ? 'ПРОХОД' : 'СТОП'}`);
  for (const s of r.stroki) {
    const a = annotaciya(s);
    if (a !== 'нет') naydeno += 1;
    stroki.push(`  ${s.length > 220 ? `${s.slice(0, 220)}…` : s}`);
    stroki.push(`    сопоставитель: ${a}`);
  }
  stroki.push('');
}
stroki.push(`ИТОГ: строк, которые сопоставитель превращает в аннотацию, — ${naydeno}; «##[» и «::» в них нет — bezopasno их не трогает.`);
stroki.push('Действие — как у «##[warning]» из SV23-O-3 раунда 1: аннотация с текстом ответа домена на странице запуска и подмена');
stroki.push('строки хоста в журнале. Вход текста — <title> (с a836697), canonical чужого сайта и негодный Location (с 9ca1aa2).');
vyvod('o2-sopostaviteli-vyvod.txt', stroki);
