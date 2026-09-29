// SV23-O-3: <title> конечного ответа печатается в публичный журнал GitHub как есть — сторож сжимает только пробелы
// (\s: переводы строки убраны), управляющие и форматные знаки проходят. Конечный ответ может прийти с любого хоста:
// сторож идёт по редиректам куда угодно. Образцы — первая выкладка со входом on, домен уводит на чужой хост, чей
// <title> несёт: ESC-последовательность цвета (хвост строки с адресом чужого хоста — чёрным по чёрному), «##[debug]»
// и «##[warning]» (формат команд v1 раннера), знак U+202E (переворот направления), U+0085, «<» внутри <title>
// (заголовок не печатается вовсе), «::add-mask::» в середине строки (контроль: v2 в середине строки не срабатывает).
// Отдельно — «##[debug]» в адресе Location (прежний путь печати, до сессии 23).
// Модель раннера — по исходнику actions/runner, как его знает скептик (OutputManager: строка с «::» или «##[» идёт
// в ActionCommandManager; TryParseV2 — «::» в начале после TrimStart; TryParse (v1) — «##[» в ЛЮБОМ месте строки,
// имя команды до «]» из зарегистрированных; строка, принятая за команду, в журнал как есть не пишется). На раннере
// НЕ измерено — это модель, не замер.
import { SV, W, G, otv, iz, vyvod } from './obshchee-o.mjs';

const CHUZHOI = 'https://chuzhoi.example/';
const stranitsa = (zag) => `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${zag}</title></head><body></body></html>`;
const cherez = (zag) => ({ [W]: otv(302, '', CHUZHOI), [G]: otv(302, '', CHUZHOI), [CHUZHOI]: otv(200, stranitsa(zag)) });

const locFragment = new URL('/x##[debug]', W).href;
const OBRAZCY = [
  ['ESC: цвет чёрным по чёрному после заглушки', cherez('Поздравляем, сайт создан!\u001b[30;40m')],
  ['«##[debug]» в заголовке', cherez('Поздравляем, сайт создан! ##[debug]')],
  ['«##[warning]» в заголовке', cherez('##[warning]Домен наш: заглушка хостера')],
  ['U+202E в заголовке', cherez('‮мок.тнепрехт7')],
  ['U+0085 в заголовке', cherez('Поздравляем,\u0085сайт создан!')],
  ['«<» внутри <title> — заголовок не печатается', cherez('Чужой <сайт>')],
  ['контроль: «::add-mask::» в середине строки', cherez('::add-mask::ОТВЕЧАЕТ')],
  ['прежний путь: «##[debug]» в адресе Location', { [W]: otv(301, '', '/x##[debug]'), [locFragment]: otv(200, stranitsa('Поздравляем, сайт создан!')), [G]: otv(301, '', W) }],
];

const ZAREG = ['add-mask', 'add-matcher', 'remove-matcher', 'debug', 'warning', 'error', 'notice', 'group', 'endgroup', 'echo', 'set-output', 'save-state', 'set-env', 'add-path', 'stop-commands'];
function komandaRannera(stroka) {
  if (stroka.trimStart().startsWith('::')) return 'v2 (строка начинается с «::»)';
  const i = stroka.indexOf('##[');
  if (i < 0) return null;
  const k = stroka.indexOf(']', i);
  if (k < 0) return null;
  const imya = stroka.slice(i + 3, k).split(' ')[0];
  return ZAREG.includes(imya) ? `v1 «${imya}» — строка в журнал как есть не пишется, данные команды: ${JSON.stringify(stroka.slice(k + 1))}` : null;
}

const stroki = [`адрес Location «/x##[debug]» после new URL: ${locFragment}`, ''];
for (const [imya, karta] of OBRAZCY) {
  const r = await SV.domen({ poluchit: iz(karta), pervyi: true, soglasen: true });
  stroki.push(`${imya}: сторож — ${r.ok ? 'ПРОХОД' : 'СТОП'}`);
  for (const s of r.stroki.slice(0, 2)) {
    const upr = [...s].filter((c) => /[\p{Cc}\p{Cf}]/u.test(c)).map((c) => `U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`);
    stroki.push(`  строка (JSON): ${JSON.stringify(s)}`);
    stroki.push(`    управляющие и форматные знаки в строке: ${upr.length ? upr.join(', ') : 'нет'}; модель раннера: ${komandaRannera(s) ?? 'обычная строка'}`);
  }
  stroki.push('');
}
stroki.push('Вывод: сторож не чистит <title> от управляющих (\\p{Cc}) и форматных (\\p{Cf}) знаков и не гасит «##[» — строку ответа домена,');
stroki.push('ради которой владелец дал согласие, пишет в журнал тот, кто отвечает (в том числе чужой хост в конце редиректа).');
vyvod('o3-vyvod.txt', stroki);
