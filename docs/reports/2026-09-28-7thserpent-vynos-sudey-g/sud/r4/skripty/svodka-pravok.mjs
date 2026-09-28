// Сводка правок раунда 4 из журнала процесса исполнителей.
import { readFileSync, writeFileSync } from 'node:fs';

const SCR = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad';
const ZHURNAL = 'C:/Users/MSI/.claude/projects/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/subagents/workflows/wf_7573c990-423/journal.jsonl';
const zapisi = readFileSync(ZHURNAL, 'utf8').split('\n').filter(Boolean).map((s) => JSON.parse(s));
const metka = new Map(zapisi.filter((z) => z.type === 'started').map((z) => [z.key, z.label]));
const rez = Object.fromEntries(zapisi.filter((z) => z.type === 'result').map((z) => [metka.get(z.key), z.result]));
writeFileSync(`${SCR}/r4/pravki.json`, JSON.stringify(rez, null, 1));
const out = [];
for (const b of ['A', 'B', 'V']) {
  const r = rez[`r4-pravki-${b}`];
  out.push(`\n=== ${b}: файлов ${r.faily.length}`);
  for (const f of r.faily) out.push(`  файл: ${f}`);
  const schet = {};
  for (const n of r.nahodki) {
    schet[n.status] = (schet[n.status] ?? 0) + 1;
    out.push(`  ${n.id.padEnd(10)} ${n.status}`);
  }
  out.push(`  по статусам: ${JSON.stringify(schet)}`);
  out.push(`  итог тестов: ${r.itog_testov}`);
  out.push(`  не проверил: ${r.ne_proveril}`);
}
writeFileSync(`${SCR}/r4/svodka-pravok.txt`, out.join('\n') + '\n');
console.log(out.join('\n'));
