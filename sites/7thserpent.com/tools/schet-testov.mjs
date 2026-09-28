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
 *   - УПАЛ — тест, в том числе с `skip: ''` (тело выполнялось); набор — только упавшим хуком
 *     (упавшие дети посчитаны сами); запись уровня файла (файл не импортируется, падение вне тестов);
 *     не `todo`.
 */
import { resolve } from 'node:path';

const est = (v) => v !== undefined && v !== false;

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
      if (fajl || nabor || est(d.skip)) continue;
      proshlo += 1;
    } else {
      if (nabor && d.details?.error?.failureType !== 'hookFailed') continue;
      upalo += 1;
    }
  }
  yield `${JSON.stringify({ proshlo, upalo })}\n`;
}

/**
 * Код прогона по коду `node --test` и счёту: ненулевой код — как есть; упавшие по счёту при коде 0
 * (`skip: ''` с упавшим телом, B3-5) — 1; ноль прошедших — 2 («прошло» о пустом наборе не выдаётся).
 */
export function kodProverki(kod, { proshlo, upalo }) {
  if (kod !== 0) return kod;
  if (upalo > 0) return 1;
  if (proshlo === 0) return 2;
  return 0;
}
