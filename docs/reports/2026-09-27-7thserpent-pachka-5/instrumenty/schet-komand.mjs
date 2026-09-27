// Счёт команд оболочки сессии 18 для раскрытия в докладе (урок памяти исполнителя: «раскрытие считать скриптом
// по расшифровке сессии, а не по памяти»): по файлам расшифровки (JSONL) — вызовы tool_use Bash и PowerShell,
// их команда и описание; в них ищется (1) запретное сочетание — собрано из кодов символов, буквами в этом файле
// не пишется; (2) присвоение в начале команды или звена конвейера (`ИМЯ=` после начала строки, `;`, `&&`, `||`, `|`).
// Ложные срабатывания (сочетание внутри английского слова текста) печатаются с командой — разбираются глазами.
//   node schet-komand.mjs <расшифровка ведущего.jsonl> [<расшифровки агентов>…]
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const SOCHETANIE = String.fromCharCode(115, 101, 100);
const PRISVOENIE = /(^|[;&|]\s*|\n\s*)[A-Za-z_][A-Za-z0-9_]*=/;
for (const fajl of process.argv.slice(2)) {
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
      const vidy = [];
      if (kom.includes(SOCHETANIE) || opis.includes(SOCHETANIE)) vidy.push('сочетание');
      if (PRISVOENIE.test(kom.replace(/'[^']*'|"[^"]*"/g, "''"))) vidy.push('присвоение');
      if (vidy.length) naydeno.push({ n: vsego, vidy, kom: kom.replace(/\s+/g, ' ').slice(0, 300), opis });
    }
  }
  console.log(`== ${basename(fajl)}: команд оболочки ${vsego}, с находками ${naydeno.length}`);
  for (const x of naydeno) console.log(`  #${x.n} [${x.vidy.join(', ')}] «${x.opis}» — ${x.kom}`);
}
