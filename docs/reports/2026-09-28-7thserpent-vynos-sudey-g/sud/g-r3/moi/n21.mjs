// Мутант N21 (команда снова ждёт сверку на верхнем уровне) — командой `znak.mjs --check` с крюком загрузчика: сверка
// импортирует astro.config.mjs, а он — сам модуль команды. Настоящий код — тот же запуск без мутации.
//   node gr3/moi/n21.mjs
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const KRYUK = pathToFileURL(join(import.meta.dirname, '../../g/kryuk-znak.mjs')).href;
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
const N21 = { imya: 'N21', iz: "if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) zapusk();", na: "if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await zapusk();" };
for (const [imya, m] of [['настоящий код', null], ['мутант N21', N21]]) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--import', KRYUK, 'tools/znak.mjs', '--check'], { cwd: SAYT, encoding: 'utf8', timeout: 90000, env: { ...ENV, ...(m ? { ZNAK_MUTACIYA: JSON.stringify(m) } : {}) } });
  console.log(`${imya}: код ${r.status}, сигнал ${r.signal}, ${Math.round((Date.now() - t0) / 1000)} с; ${(r.stdout + r.stderr).trim().split('\n').slice(0, 3).join(' | ').slice(0, 300)}`);
}
