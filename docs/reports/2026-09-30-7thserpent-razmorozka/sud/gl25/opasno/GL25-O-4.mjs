// GL25-O-4: push-запуск X, обогнанный следующим push Y до шага сверки (подбор раннера, setup-node; при занятой группе
// concurrency — всё время прежнего прогона), останавливается: сторож называет причиной «повтор старого запуска (Re-run) или
// запуск не из main» и «выкладка откатила бы живой сайт» — обе неверны (X — свежий push из main, живой сайт старше X).
// Если Y не трогает путей этого workflow (docs/, DECISIONS.md, первый сайт), прогона для Y нет — изменение сайта X
// не выкладывается совсем, пока кто-то не нажмёт Run workflow из main. Сторож имеет в окружении GITHUB_EVENT_NAME,
// GITHUB_RUN_ATTEMPT и GITHUB_REF, но их не читает — текст одинаков для push и для настоящего Re-run.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const TUT = dirname(fileURLToPath(import.meta.url));
const KOPIYA = join(TUT, 'kopiya');
const STOROZH = join(KOPIYA, 'sites/7thserpent.com/tools/storozha-vykladki.mjs');
const require = createRequire(join(KOPIYA, 'sites/7thserpent.com/tools/testy/storozha-vykladki.test.mjs'));
const { parse } = require('yaml');
const REPO = 'D:/SEO/cloud/site-generator';
const git = (...a) => spawnSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const out = [];
const log = (s = '') => out.push(s);

const X = git('log', '-1', '--format=%H', '22878b2').stdout.trim(); // как будто влит: push-запуск X
const Y = git('log', '-1', '--format=%H', '347f08e').stdout.trim(); // любой другой коммит — «новая голова» для опыта
const d = mkdtempSync(join(tmpdir(), 'gl25-o4-'));
writeFileSync(join(d, 'ls.txt'), `${Y}\trefs/heads/main\n`);
writeFileSync(join(d, 'osh.txt'), '');
const { GITHUB_SHA: _a, SERPENT_ROLLBACK: _b, GITHUB_EVENT_NAME: _c, GITHUB_RUN_ATTEMPT: _d, GITHUB_REF: _e, ...env0 } = process.env;
const zapusk = (e) => spawnSync(process.execPath, [STOROZH, 'golova', join(d, 'ls.txt'), join(d, 'osh.txt')], { encoding: 'utf8', env: { ...env0, GITHUB_SHA: X, SERPENT_ROLLBACK: 'off', ...e } });

log('== 1. одна и та же строка СТОП для обогнанного push и для настоящего Re-run');
log(`   (X — ${X.slice(0, 7)} в роли влитого push; Y — ${Y.slice(0, 7)}, подставной коммит в роли новой головы: сторож сверяет только равенство)`);
const push = zapusk({ GITHUB_EVENT_NAME: 'push', GITHUB_RUN_ATTEMPT: '1', GITHUB_REF: 'refs/heads/main' });
const rerun = zapusk({ GITHUB_EVENT_NAME: 'push', GITHUB_RUN_ATTEMPT: '2', GITHUB_REF: 'refs/heads/main' });
log(`-- push, попытка 1, refs/heads/main (обогнан новым push): код ${push.status}`);
log(`   ${push.stdout.trim()}`);
log(`-- push, попытка 2 (настоящий Re-run): код ${rerun.status}`);
log(`   тексты равны: ${push.stdout === rerun.stdout}`);
log('   Для попытки 1 из main неверны обе причины текста: не Re-run и не «не из main»; «откатила бы живой сайт» — тоже:');
log('   живой сайт — прежняя выкладка, X новее её. Верная причина — «main ушёл вперёд после этого push».');

// 2. Какие коммиты двигают main, не запуская этот workflow.
const WF = parse(readFileSync(join(KOPIYA, '.github/workflows/deploy-7thserpent.yml'), 'utf8'));
const puti = WF.on.push.paths;
const podkhodit = (f) => puti.some((p) => (p.endsWith('/**') ? f.startsWith(p.slice(0, -2)) : f === p));
log('');
log(`== 2. пути push этого workflow: ${puti.join(', ')}`);
const kommity = git('log', '--format=@@%h %s', '--name-only', 'f22bb92..22878b2').stdout.split('@@').filter(Boolean);
let bez = 0;
for (const k of kommity) {
  const [zag, ...fajly] = k.trim().split('\n').filter(Boolean);
  const zapustit = fajly.some(podkhodit);
  if (!zapustit) bez += 1;
  log(`  ${zapustit ? 'запустит ' : 'НЕ запустит'} ${zag.slice(0, 90)}${zag.length > 90 ? '…' : ''} (${fajly.length} файл.)`);
}
log(`Коммитов ветки сессии, которые, пришедши в main отдельным push, не запустят этот workflow: ${bez} из ${kommity.length}.`);
const ac4bf = git('show', 'f22bb92:.github/workflows/deploy-ac4bf.yml');
if (ac4bf.status === 0) {
  const p1 = parse(ac4bf.stdout).on.push.paths;
  log(`Пути push первого сайта (deploy-ac4bf.yml): ${p1.join(', ')} — push только по sites/ac4bf-thewatch.com/** двигает main без прогона второго сайта.`);
}
log('');
log('Сценарий: push X (сайт) → прогон X в очереди (идёт прежний прогон) или ждёт раннер; push Y (docs или первый сайт) →');
log('прогона нет; прогон X доходит до сверки: X ≠ Y → СТОП с причиной «Re-run или не из main». Выкладки X нет, пока');
log('владелец не нажмёт Run workflow из main (голова Y, содержимое сайта — как в X).');

writeFileSync(join(TUT, 'GL25-O-4-vyvod.txt'), out.join('\n') + '\n');
