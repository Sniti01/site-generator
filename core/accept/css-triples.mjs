#!/usr/bin/env node
/**
 * Приёмка, шаг 3: разбор CSS в тройки «условие + селектор + объявления».
 *
 *   node core/accept/css-triples.mjs count   <файл.css>
 *   node core/accept/css-triples.mjs compare <до.css> <после.css> [--flat]
 *
 * Флаг `--flat` гасит скруты перед разбором и печатает их раскладку. Без него
 * при расщеплении разойдётся каждая тройка, где скрут вообще есть, и число
 * расхождений скажет только «скруты сменились» — то есть ничего.
 *
 * Дополнение к правилу приёмки (`docs/REUSE.md` §6, решение владельца
 * от 2026-09-07): диффа собранного CSS принимается как перегруппировка
 * медиазапросов, если выполнено **всё** из трёх — число правил не изменилось,
 * мультимножество троек совпало, изменение сводится к слиянию или разъединению
 * одноусловных `@media`-блоков. Инструмент проверяет первые два условия
 * механически и печатает данные для третьего; «похоже одинаково» —
 * не доказательство.
 *
 * **Что считается правилом.** Блок с объявлениями, чей заголовок не начинается
 * с `@`. At-правила — `@property`, `@font-face`, `@keyframes` — считаются
 * отдельно: у них своя природа, и в мультимножество селекторов они не идут.
 * Определение проверяется самопроверкой: на сборке после закрытия P2 оно даёт
 * 331 правило и 24 вхождения `@media` — те же числа, что записаны в отчётах
 * `2026-09-07-p2-header` и `2026-09-07-p2-linkcolumns`.
 *
 * Код возврата не приговор: ненулевой означает, что инструмент не смог
 * прочитать вход. Вердикт читается из вывода.
 */

import { readFileSync } from 'node:fs';
import { sep } from 'node:path';
// Гашение скрутов живёт в html-diff.mjs — там же, где порядковое приведение,
// и реализация у обоих инструментов одна. Разводить её надвое значило бы
// однажды получить два разных ответа на один вопрос.
import { flattenScopes, scopeLedger } from './html-diff.mjs';

const NESTING = /^@(media|supports|layer|container|scope)\b/;

/** @returns {{conditions: string[], head: string, body: string}[]} */
export function parseCss(text) {
  const out = [];
  const stack = [];
  let i = 0;
  let buf = '';
  while (i < text.length) {
    const ch = text[i];
    if (ch === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      i = end < 0 ? text.length : end + 2;
      continue;
    }
    if (ch === '{') {
      const head = buf.trim();
      buf = '';
      i += 1;
      if (head.startsWith('@') && NESTING.test(head)) {
        stack.push(head);
        continue;
      }
      let depth = 1;
      let body = '';
      while (i < text.length) {
        const c = text[i];
        if (c === '{') depth += 1;
        else if (c === '}') {
          depth -= 1;
          if (depth === 0) break;
        }
        body += c;
        i += 1;
      }
      i += 1;
      out.push({ conditions: [...stack], head, body: body.trim() });
      continue;
    }
    if (ch === '}') {
      stack.pop();
      buf = '';
      i += 1;
      continue;
    }
    buf += ch;
    i += 1;
  }
  return out;
}

const isAt = (r) => r.head.startsWith('@');

// Разделитель тройки — символ переноса единицы (U+241F): в CSS он не
// встречается, и тройка разбирается обратно без догадок о том, где кончился
// селектор и начались объявления.
const SEP = '␟';
const triple = (r) => [r.conditions.join(' && '), r.head, r.body].join(SEP);

export function measure(text) {
  const blocks = parseCss(text);
  const rules = blocks.filter((r) => !isAt(r));
  return {
    блоков: blocks.length,
    правил: rules.length,
    at_правил: blocks.length - rules.length,
    media_вхождений: (text.match(/@media/g) ?? []).length,
    media_условий: new Set(blocks.flatMap((r) => r.conditions).filter((c) => c.startsWith('@media'))).size,
    тройки: rules.map(triple),
  };
}

/** Мультимножество: сравниваем счётчики, а не множества — повтор правила значим. */
function multisetDiff(a, b) {
  const count = (xs) => {
    const m = new Map();
    for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
    return m;
  };
  const ma = count(a);
  const mb = count(b);
  const only = [];
  for (const [k, v] of ma) {
    const w = mb.get(k) ?? 0;
    if (v > w) only.push({ сторона: 'до', раз: v - w, тройка: k });
  }
  for (const [k, v] of mb) {
    const w = ma.get(k) ?? 0;
    if (v > w) only.push({ сторона: 'после', раз: v - w, тройка: k });
  }
  return only;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(sep).join('/'))) {
  const [, , cmd, one, two] = process.argv;
  if (cmd === 'count' && one) {
    const m = measure(readFileSync(one, 'utf8'));
    console.log(`правил: ${m.правил}, at-правил: ${m.at_правил}, блоков всего: ${m.блоков}`);
    console.log(`@media: ${m.media_вхождений} вхождений, ${m.media_условий} различных условий`);
  } else if (cmd === 'compare' && one && two) {
    const плоско = process.argv.includes('--flat');
    const сырьёA = readFileSync(one, 'utf8');
    const сырьёB = readFileSync(two, 'utf8');
    if (плоско) {
      const л = scopeLedger(сырьёA, сырьёB);
      console.log(`скрутов погашено: ${л.до} до, ${л.после} после`);
      for (const s of л.новые) console.log(`  НОВЫЙ ${s.скрут.replace('data-astro-cid-', '')}: ${s.вхождений} вхождений в листе`);
      for (const s of л.ушли) console.log(`  ИСЧЕЗ ${s.скрут.replace('data-astro-cid-', '')}: было ${s.было}`);
    }
    const a = measure(плоско ? flattenScopes(сырьёA).html : сырьёA);
    const b = measure(плоско ? flattenScopes(сырьёB).html : сырьёB);
    console.log(`правил: ${a.правил} → ${b.правил}${a.правил === b.правил ? ' (условие 1 выполнено)' : ' — РАЗОШЛОСЬ'}`);
    console.log(`@media-блоков: ${a.media_вхождений} → ${b.media_вхождений}, различных условий: ${a.media_условий} → ${b.media_условий}`);
    const diff = multisetDiff(a.тройки, b.тройки);
    if (diff.length === 0) {
      console.log('мультимножество троек совпало (условие 2 выполнено)');
      if (a.media_вхождений !== b.media_вхождений) {
        console.log(
          'число @media-блоков разошлось при совпавшем мультимножестве — это перегруппировка: ' +
            'минификатор сливает одноусловные медиаблоки внутри одного файла и не сливает между файлами. ' +
            'Условие 3 проверяется по списку условий выше.'
        );
      }
    } else {
      console.log(`мультимножество троек разошлось на ${diff.length} — это НЕ перегруппировка, каждое расхождение объясняется отдельно:`);
      for (const d of diff.slice(0, 20)) {
        const [cond, head, body] = d.тройка.split(SEP);
        console.log(
          `  только ${d.сторона}${d.раз > 1 ? ` ×${d.раз}` : ''}: ${cond || '(без условия)'} ${head} { ${body.slice(0, 90)}${body.length > 90 ? '…' : ''} }`
        );
      }
      if (diff.length > 20) console.log(`  … ещё ${diff.length - 20}`);
    }
  } else {
    console.error('node core/accept/css-triples.mjs count   <файл.css>');
    console.error('node core/accept/css-triples.mjs compare <до.css> <после.css> [--flat]');
    console.error('  --flat — плоское гашение скрутов: для РАСЩЕПЛЕНИЙ');
    process.exit(2);
  }
}
