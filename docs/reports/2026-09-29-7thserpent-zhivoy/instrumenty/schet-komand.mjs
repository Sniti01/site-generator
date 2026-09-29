// Копия docs/reports/2026-09-29-7thserpent-yashchik/instrumenty/schet-komand.mjs (сессия 23) для сессии 24 (П111) — без
// изменений логики. Виды: (а) «хвост-пустышка»: `2>/dev/null`, `; true`, `|| true`; (б) «фильтр оболочки»: вывод,
// отобранный `head`, `tail`, `grep`, `wc`, `cat` в оболочке, а не инструментами Read и Grep; (в) циклы — `for … in`,
// `foreach`, `ForEach-Object`, `while`, `until`; (г) «пауза»: вызов оболочки, который только ждёт (`setTimeout` в
// `node -e`, `sleep`, `Start-Sleep`).
// Счёт команд оболочки для раскрытия в докладе (урок памяти исполнителя: «раскрытие считать скриптом
// по расшифровке сессии, а не по памяти»): по файлам расшифровки (JSONL) — вызовы tool_use Bash и PowerShell,
// их команда и описание; в них ищется (1) запретное сочетание — собрано из кодов символов, буквами в этом файле
// не пишется; (2) присвоение в начале команды или звена конвейера (`ИМЯ=` после начала строки, `;`, `&&`, `||`, `|`).
// Ложные срабатывания (сочетание внутри английского слова текста) печатаются с командой — разбираются глазами.
//   node schet-komand.mjs <расшифровка ведущего.jsonl> [<расшифровки агентов или папка с ними>…]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

const SOCHETANIE = String.fromCharCode(115, 101, 100);
const PRISVOENIE = /(^|[;&|]\s*|\n\s*)[A-Za-z_][A-Za-z0-9_]*=/;
const CIKL = /\bfor\s+[A-Za-z_][A-Za-z0-9_]*\s+in\b|\bforeach\s*\(|ForEach-Object|\bwhile\s|\buntil\s/;
const HVOST = /2>\s*\/dev\/null|;\s*true\b|\|\|\s*true\b/;
const FILTR = /(^|[;&|]\s*)(head|tail|grep|wc|cat)\b|\|\s*(head|tail|grep|wc|cat)\b/;
const PAUZA = /setTimeout\(\s*\(\)\s*=>\s*\{\s*\}|(^|[;&|]\s*)sleep\s+\d|Start-Sleep/;
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
      if (HVOST.test(bezKavychek)) vidy.push('хвост-пустышка');
      if (FILTR.test(bezKavychek)) vidy.push('фильтр оболочки');
      if (PAUZA.test(kom)) vidy.push('пауза');
      if (vidy.length) naydeno.push({ n: vsego, vidy, kom: kom.replace(/\s+/g, ' ').slice(0, 300), opis });
    }
  }
  if (basename(fajl).startsWith('agent-')) { vsegoAgentov += 1; komandAgentov += vsego; if (!vsego && !naydeno.length) continue; }
  const poVidam = naydeno.flatMap((x) => x.vidy).reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map());
  console.log(`== ${basename(fajl)}: команд оболочки ${vsego}, с находками ${naydeno.length}${poVidam.size ? ` (${[...poVidam].map(([v, n]) => `${v} ${n}`).join(', ')})` : ''}`);
  for (const x of naydeno) console.log(`  #${x.n} [${x.vidy.join(', ')}] «${x.opis}» — ${x.kom}`);
}
if (vsegoAgentov) console.log(`агентов: расшифровок ${vsegoAgentov}, команд оболочки у них всего ${komandAgentov} (расшифровки без команд не печатаются)`);
