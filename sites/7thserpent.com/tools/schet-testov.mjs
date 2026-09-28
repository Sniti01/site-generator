/**
 * Репортёр `node --test` для `tools/proverki.mjs`: счёт прошедших и упавших тестов — одной строкой
 * JSON `{ proshlo, upalo }` в назначение репортёра (раунд 2 «судью судят» блока Б, B2-1), и решение
 * о коде выхода прогона по счёту (`kodProverki`, раунд 3, B3-5).
 *
 * Разбор TAP регулярным выражением ошибался в обе стороны: Node 26 ставит «ok» каждому файлу, где
 * шаблон имён не оставил тестов (запись уровня файла), а строка вывода теста «pass 5» попадает в TAP
 * как «# pass 5» раньше итоговой сводки. Здесь считаются события `test:pass` и `test:fail`:
 *   - ПРОШЁЛ — тест (не набор `describe`: B3-4), не пропущенный и не `todo` (признак — наличие поля,
 *     и пустая строка тоже: `{ skip: '' }`, `t.skip('')`, B3-5), не запись уровня файла;
 *   - УПАЛ — тест, в том числе с `skip: ''` (тело выполнялось), и отменённый родителем
 *     (`cancelledByParent` — так его пишет Node); набор — своим падением (хук, тело набора, таймаут),
 *     не падением детей (`subtestsFailed`: упавшие дети посчитаны сами; раунд 4, R4-B-K-4, R4-B-Z-3 —
 *     набор, чьё тело бросило до детей или без них, прежде пропадал из счёта); запись уровня файла
 *     `test:fail` (файл не импортируется, падение вне тестов); запись уровня файла `test:pass` в прогоне
 *     без шаблона имён — файл, не пославший ни одного события своих тестов (вышел `process.exit(0)`
 *     посреди тестов или тестов в нём нет, R4-B-K-5); не `todo`.
 * С шаблоном (`--test-name-pattern`, `--test-skip-pattern`, `--test-only` в аргументах `node`) запись
 * уровня файла `test:pass` — пропуск: так Node 26 отмечает файл, где шаблон не оставил тестов (B2-1).
 * ПРЕДЕЛЫ: с шаблоном файл, вышедший `process.exit(0)` до событий своих тестов, от такого не отличить
 * (мягче; test.todo R4-B-K-5); шаблон в `NODE_OPTIONS` репортёр не видит (запись — упал, строже).
 */
import { resolve } from 'node:path';

const est = (v) => v !== undefined && v !== false;
/** Прогон с шаблоном имён: запись уровня файла `test:pass` — файл без совпавших тестов (B2-1, R4-B-K-5). */
const SHABLON = process.execArgv.some((a) => /^--test-(name|skip)-pattern(=|$)/.test(a) || a === '--test-only');

export default async function* schetTestov(source) {
  let proshlo = 0;
  let upalo = 0;
  for await (const e of source) {
    if (e.type !== 'test:pass' && e.type !== 'test:fail') continue;
    const d = e.data ?? {};
    if (est(d.todo)) continue;
    const fajl = d.file && resolve(String(d.name)) === resolve(d.file);
    const nabor = d.details?.type === 'suite';
    if (e.type === 'test:pass') {
      // Файл без событий своих тестов в прогоне без шаблона — вышел посреди тестов или пуст (R4-B-K-5).
      if (fajl && !SHABLON) upalo += 1;
      if (fajl || nabor || est(d.skip)) continue;
      proshlo += 1;
    } else {
      // Набор, упавший падением детей, — не своё падение: дети посчитаны сами (R4-B-Z-3, R4-B-Z-4).
      if (nabor && d.details?.error?.failureType === 'subtestsFailed') continue;
      upalo += 1;
    }
  }
  yield `${JSON.stringify({ proshlo, upalo })}\n`;
}

/**
 * Код прогона по коду `node --test` и счёту: ненулевой код — как есть; упавшие по счёту при коде 0
 * (`skip: ''` с упавшим телом, B3-5; файл, вышедший `process.exit(0)` посреди тестов, R4-B-K-5) — 1;
 * ноль прошедших — 2 («прошло» о пустом наборе не выдаётся).
 */
export function kodProverki(kod, { proshlo, upalo }) {
  if (kod !== 0) return kod;
  if (upalo > 0) return 1;
  if (proshlo === 0) return 2;
  return 0;
}
