// Настоящий вывод git ls-remote (один запрос из трёх разрешённых) и сторож копии на нём.
// Сеть: ровно `git ls-remote https://github.com/Sniti01/site-generator refs/heads/main` (URL шага workflow).
// Остальное — без сети: git log и git ls-remote по локальному пути репозитория (только чтение).
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TUT = dirname(fileURLToPath(import.meta.url));
const KOPIYA = join(TUT, 'kopiya');
const STOROZH = join(KOPIYA, 'sites/7thserpent.com/tools/storozha-vykladki.mjs');
const SV = await import(pathToFileURL(STOROZH).href);
const REPO = 'D:/SEO/cloud/site-generator';
const out = [];
const log = (s = '') => out.push(s);

// 1. Один сетевой запрос — ровно команда шага (GIT_TERMINAL_PROMPT = 0, как env шага).
const r = spawnSync('git', ['ls-remote', 'https://github.com/Sniti01/site-generator', 'refs/heads/main'], {
  env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  encoding: 'buffer',
});
const LS = join(TUT, 'ls-remote-nastoyashchiy.txt');
const OSH = join(TUT, 'ls-remote-nastoyashchiy-oshibki.txt');
writeFileSync(LS, r.stdout);
writeFileSync(OSH, r.stderr);
log('== 1. настоящий git ls-remote https://github.com/Sniti01/site-generator refs/heads/main');
log(`код git: ${r.status}`);
log(`stdout, байт: ${r.stdout.length}; hex: ${r.stdout.toString('hex')}`);
log(`stdout текстом: ${JSON.stringify(r.stdout.toString('utf8'))}`);
log(`stderr текстом: ${JSON.stringify(r.stderr.toString('utf8'))}`);
const golovaGitHub = SV.golovaIzLsRemote(r.stdout.toString('utf8'));
log(`golovaIzLsRemote(настоящий вывод) = ${golovaGitHub}`);

// 2. Коммиты локально (git log, без сети).
const sha = (ref) => spawnSync('git', ['-C', REPO, 'log', '-1', '--format=%H', ref], { encoding: 'utf8' }).stdout.trim();
const MAIN = sha('origin/main');
const VETKA = sha('22878b2');
log();
log('== 2. коммиты (git log локально)');
log(`origin/main (последний fetch) = ${MAIN}`);
log(`голова ветки сессии 22878b2 = ${VETKA}`);
log(`голова main на GitHub сейчас = голова origin/main: ${golovaGitHub === MAIN}`);

// 3. Команда golova копии на настоящем выводе.
const { GITHUB_SHA: _a, SERPENT_ROLLBACK: _b, ...env0 } = process.env;
const zapusk = (e) => spawnSync(process.execPath, [STOROZH, 'golova', LS, OSH], { encoding: 'utf8', env: { ...env0, ...e } });
log();
log('== 3. node storozha-vykladki.mjs golova <настоящий вывод> <настоящие ошибки>');
for (const [imya, e] of [
  ['push-запуск головы (GITHUB_SHA = голова, вход off)', { GITHUB_SHA: golovaGitHub ?? '', SERPENT_ROLLBACK: 'off' }],
  ['запуск из ветки сессии без входа', { GITHUB_SHA: VETKA, SERPENT_ROLLBACK: 'off' }],
  ['запуск из ветки сессии со входом on', { GITHUB_SHA: VETKA, SERPENT_ROLLBACK: 'on' }],
]) {
  const z = zapusk(e);
  log(`-- ${imya}: код ${z.status}`);
  log(`   stdout: ${z.stdout.trim()}`);
  if (z.stderr.trim()) log(`   stderr: ${z.stderr.trim()}`);
}

// 4. Как git сопоставляет образец ls-remote — по хвосту имени (без сети: локальный путь репозитория).
log();
log('== 4. образец git ls-remote сопоставляется по хвосту имени (локальный репозиторий, без сети)');
for (const obrazec of ['main', 'refs/heads/main']) {
  const l = spawnSync('git', ['ls-remote', REPO, obrazec], { encoding: 'utf8' });
  log(`-- git ls-remote <репозиторий> ${obrazec}: код ${l.status}`);
  for (const s of l.stdout.trim().split('\n')) log(`   ${s}`);
}
log('Следствие (по коду builtin/ls-remote.c: образец «*/<образец>» против «/<имя ссылки>»): ветка или метка с именем,');
log('оканчивающимся на «/refs/heads/main» (например refs/heads/x/refs/heads/main), дала бы вторую строку — сторож: СТОП');
log('«голову main не узнать» (ложный стоп, не проход). Проверка на синтетике:');
const dve = `${MAIN}\trefs/heads/main\n${VETKA}\trefs/heads/x/refs/heads/main\n`;
const g2 = SV.golova({ kommit: MAIN, lsRemote: dve });
log(`   golova(две строки) → ok=${g2.ok}: ${g2.stroki.join(' | ')}`);

writeFileSync(join(TUT, 'nastoyashchiy-ls-remote-vyvod.txt'), out.join('\n') + '\n');
