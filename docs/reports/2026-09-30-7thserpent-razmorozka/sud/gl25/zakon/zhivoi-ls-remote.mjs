// Настоящий вывод git ls-remote (один запуск, как в шаге workflow: stdout и stderr — в отдельные файлы, код возврата),
// затем команда golova сторожа копии на этих файлах: GITHUB_SHA = голова (проход), чужой коммит (стоп), чужой со входом
// отката (ОТКАТ). Сеть — только этот ls-remote.
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-gl25/zakon';
const STOROZH = `${PAPKA}/kopiya/sites/7thserpent.com/tools/storozha-vykladki.mjs`;
const RAB = join(PAPKA, 'rabochie-ls');
mkdirSync(RAB, { recursive: true });

const stroki = [];
const pishi = (s) => stroki.push(s);

const t0 = Date.now();
const g = spawnSync('git', ['ls-remote', 'https://github.com/Sniti01/site-generator', 'refs/heads/main'], {
  encoding: 'buffer',
  env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
});
const ms = Date.now() - t0;
writeFileSync(join(RAB, 'golova-main.txt'), g.stdout);
const oshibki = Buffer.concat([g.stderr, g.status === 0 ? Buffer.alloc(0) : Buffer.from('git ls-remote закончился ненулевым кодом\n')]);
writeFileSync(join(RAB, 'golova-main-oshibki.txt'), oshibki);

pishi(`git --version: ${spawnSync('git', ['--version'], { encoding: 'utf8' }).stdout.trim()}`);
pishi(`ls-remote: код ${g.status}, ${ms} мс`);
pishi(`stdout (${g.stdout.length} байт): ${JSON.stringify(g.stdout.toString('utf8'))}`);
pishi(`stdout байты-разделители: ${[...g.stdout].map((b, i) => (b < 0x20 ? `[${i}]=0x${b.toString(16)}` : null)).filter(Boolean).join(' ')}`);
pishi(`stderr (${g.stderr.length} байт): ${JSON.stringify(g.stderr.toString('utf8'))}`);

const golova = /^([0-9a-f]{40})\t/.exec(g.stdout.toString('utf8'))?.[1] ?? '';
pishi(`голова main по выводу: ${golova || '(не разобрана)'}`);

const zapusk = (imya, env) => {
  const r = spawnSync(process.execPath, [STOROZH, 'golova', join(RAB, 'golova-main.txt'), join(RAB, 'golova-main-oshibki.txt')], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_SHA: undefined, SERPENT_ROLLBACK: undefined, ...env },
  });
  pishi(`\n[${imya}] env ${JSON.stringify(env)} → код ${r.status}`);
  if (r.stdout.trim()) pishi(`stdout: ${r.stdout.trim()}`);
  if (r.stderr.trim()) pishi(`stderr: ${r.stderr.trim()}`);
};
if (golova) {
  zapusk('push или Run workflow из main: коммит = голова', { GITHUB_SHA: golova, SERPENT_ROLLBACK: 'off' });
  zapusk('коммит не голова, вход off', { GITHUB_SHA: 'aabbe57'.padEnd(40, '0'), SERPENT_ROLLBACK: 'off' });
  zapusk('коммит не голова, вход on', { GITHUB_SHA: 'aabbe57'.padEnd(40, '0'), SERPENT_ROLLBACK: 'on' });
}

const log = spawnSync('git', ['-C', 'D:/SEO/cloud/site-generator', 'log', '-1', '--format=%H %s', 'origin/main'], { encoding: 'utf8' });
pishi(`\nлокальный origin/main (только чтение): ${log.stdout.trim().slice(0, 120)}`);

writeFileSync(join(PAPKA, 'zhivoi-ls-remote.txt'), `${stroki.join('\n')}\n`);
console.log(readFileSync(join(PAPKA, 'zhivoi-ls-remote.txt'), 'utf8'));
