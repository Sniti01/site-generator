// Прогон копий head.test.mjs на каждом варианте через testy.mjs: код и имена упавших тестов.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const TUT = dirname(fileURLToPath(import.meta.url));
const SP = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad';
const faily = readdirSync(join(TUT, 'var')).filter((f) => f.endsWith('.test.mjs'));
for (const f of faily) {
  const r = spawnSync(process.execPath, [join(SP, 'testy.mjs'), join(SP, 'ref/dist-7th-3b78f28'), join(TUT, 'var', f)], { encoding: 'utf8' });
  const upali = r.stdout.split('\n').filter((s) => /^\s*✖/.test(s) && !/failing tests/.test(s)).map((s) => s.trim().replace(/\s*\(\d[\d.]*ms\)$/, ''));
  const itog = r.stdout.split('\n').filter((s) => /^ℹ (tests|pass|fail|todo)/.test(s)).join('; ');
  console.log(`${f}: код ${r.status}; ${itog}\n  упавшие: ${[...new Set(upali)].join(' | ') || 'НИ ОДНОГО'}`);
}
