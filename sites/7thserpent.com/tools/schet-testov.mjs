/**
 * Репортёр `node --test` для `tools/proverki.mjs`: счёт прошедших и упавших НАСТОЯЩИХ тестов — одной
 * строкой JSON `{ proshlo, upalo }` в назначение репортёра (раунд 2 «судью судят» блока Б, B2-1).
 *
 * Разбор TAP регулярным выражением ошибался в обе стороны: Node 26 ставит «ok» каждому файлу, где
 * шаблон имён не оставил тестов (запись уровня файла), а строка вывода теста «pass 5» попадает в TAP
 * как «# pass 5» раньше итоговой сводки. Здесь считаются события `test:pass` и `test:fail`, кроме
 * пропущенных (`skip`), `todo` и записей уровня файла (имя записи — путь её файла).
 */
import { resolve } from 'node:path';

export default async function* schetTestov(source) {
  let proshlo = 0;
  let upalo = 0;
  for await (const e of source) {
    if (e.type !== 'test:pass' && e.type !== 'test:fail') continue;
    const d = e.data ?? {};
    if (d.skip || d.todo) continue;
    if (d.file && resolve(String(d.name)) === resolve(d.file)) continue;
    if (e.type === 'test:pass') proshlo += 1;
    else upalo += 1;
  }
  yield `${JSON.stringify({ proshlo, upalo })}\n`;
}
