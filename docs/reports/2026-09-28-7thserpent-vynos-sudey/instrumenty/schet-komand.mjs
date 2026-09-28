// Копия docs/reports/2026-09-27-7thserpent-pachka-5/instrumenty/schet-komand.mjs (сессия 18) для сессии 19 (П100); отличие —
// (а) третий вид находки «цикл с переменной» (`for <имя> in` в Bash, `foreach (` и `ForEach-Object` в PowerShell: урок памяти
// исполнителя — никаких переменных оболочки, циклы — в node); (б) аргумент-папка: берутся все agent-*.jsonl в ней
// рекурсивно; (в) эти три строки шапки.
// Счёт команд оболочки сессии 18 для раскрытия в докладе (урок памяти исполнителя: «раскрытие считать скриптом
// по расшифровке сессии, а не по памяти»): по файлам расшифровки (JSONL) — вызовы tool_use Bash и PowerShell,
// их команда и описание; в них ищется (1) запретное сочетание — собрано из кодов символов, буквами в этом файле
// не пишется; (2) присвоение в начале команды или звена конвейера (`ИМЯ=` после начала строки, `;`, `&&`, `||`, `|`).
// Ложные срабатывания (сочетание внутри английского слова текста) печатаются с командой — разбираются глазами.
//   node schet-komand.mjs <расшифровка ведущего.jsonl> [<расшифровки агентов или папка с ними>…]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

const SOCHETANIE = String.fromCharCode(115, 101, 100);
const PRISVOENIE = /(^|[;&|]\s*|\n\s*)[A-Za-z_][A-Za-z0-9_]*=/;
const CIKL = /\bfor\s+[A-Za-z_][A-Za-z0-9_]*\s+in\b|\bforeach\s*\(|ForEach-Object/;
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : /^agent-.*\.jsonl$/.test(e.name) ? [join(d, e.name)] : []));
const fajly = process.argv.slice(2).flatMap((a) => (statSync(a).isDirectory() ? walk(a) : [a]));
let vsegoAgentov = 0, komandAgentov = 0;
for (const fajl of fajly) {
  let vsego = 0;
  const naydeno = [];
  for (const stroka of readFileSync(fajl, 'utf8').split('\n')) {
    if (!stroka.includes('tool_use')) continue;
    let z;
    try { z = JSON.parse(stroka); } catch { continue; }
    const content = z?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      if (c.type !== 'tool_use' || !['Bash', 'PowerShell'].includes(c.name)) continue;
      vsego += 1;
      const kom = String(c.input?.command ?? '');
      const opis = String(c.input?.description ?? '');
      const bezKavychek = kom.replace(/'[^']*'|"[^"]*"/g, "''");
      const vidy = [];
      if (kom.includes(SOCHETANIE) || opis.includes(SOCHETANIE)) vidy.push('сочетание');
      if (PRISVOENIE.test(bezKavychek)) vidy.push('присвоение');
      if (CIKL.test(bezKavychek)) vidy.push('цикл с переменной');
      if (vidy.length) naydeno.push({ n: vsego, vidy, kom: kom.replace(/\s+/g, ' ').slice(0, 300), opis });
    }
  }
  if (basename(fajl).startsWith('agent-')) { vsegoAgentov += 1; komandAgentov += vsego; if (!vsego && !naydeno.length) continue; }
  console.log(`== ${basename(fajl)}: команд оболочки ${vsego}, с находками ${naydeno.length}`);
  for (const x of naydeno) console.log(`  #${x.n} [${x.vidy.join(', ')}] «${x.opis}» — ${x.kom}`);
}
if (vsegoAgentov) console.log(`агентов: расшифровок ${vsegoAgentov}, команд оболочки у них всего ${komandAgentov} (расшифровки без команд не печатаются)`);
