// Сводка раунда 4: из журнала процесса — скептики и проверяющие по меткам, таблица находок с вердиктами.
import { readFileSync, writeFileSync } from 'node:fs';

const SCR = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad';
const ZHURNAL = 'C:/Users/MSI/.claude/projects/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/subagents/workflows/wf_c2790237-c93/journal.jsonl';
const zapisi = readFileSync(ZHURNAL, 'utf8').split('\n').filter(Boolean).map((s) => JSON.parse(s));
const metka = new Map(zapisi.filter((z) => z.type === 'started').map((z) => [z.key, z.label]));
const rez = new Map(zapisi.filter((z) => z.type === 'result').map((z) => [metka.get(z.key), z.result]));
const dannye = [];
for (const b of ['A', 'B', 'V']) for (const l of ['klass', 'zakon']) dannye.push({ blok: b, linza: l, skeptik: rez.get(`r4-${b}-${l}`), proverka: rez.get(`r4-${b}-${l}-prov`) });
writeFileSync(`${SCR}/r4/itog.json`, JSON.stringify(dannye, null, 1));
const stroki = [];
const schet = {};
for (const r of dannye) {
  stroki.push(`\n=== ${r.blok} / ${r.linza}`);
  for (const f of r.skeptik?.formy ?? []) {
    const p = (r.proverka?.formy ?? []).find((x) => x.id_r3 === f.id_r3);
    stroki.push(`  форма ${f.id_r3}: скептик ${f.zakryt}; проверяющий ${p?.zakryt ?? '—'}`);
  }
  for (const n of r.skeptik?.nahodki ?? []) {
    const v = (r.proverka?.verdikty ?? []).find((x) => x.id === n.id);
    const verd = v?.verdikt ?? 'НЕТ ВЕРДИКТА';
    schet[verd] = (schet[verd] ?? 0) + 1;
    stroki.push(`  ${n.id} [${n.id_r3}] ${n.vid} (${n.uverennost}) → ${verd}`);
    stroki.push(`      ${n.opisanie.slice(0, 260).replace(/\s+/g, ' ')}`);
  }
}
stroki.push(`\nитого по вердиктам: ${JSON.stringify(schet)}`);
writeFileSync(`${SCR}/r4/svodka.txt`, stroki.join('\n') + '\n');
console.log(stroki.join('\n'));
