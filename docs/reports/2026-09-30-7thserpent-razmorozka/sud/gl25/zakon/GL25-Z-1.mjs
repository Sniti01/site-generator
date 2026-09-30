// GL25-Z-1 — очередь concurrency (и окно до сторожа): законный запуск push (или Run workflow из main) ждёт, пока идёт
// прежний; за это время main уходит вперёд коммитом ВНЕ путей push-фильтра (docs/, DECISIONS.md, первый сайт) — такой
// коммит своего прогона не запускает, а сборка головы та же. Сторож головы — СТОП, и его строка называет причину, которой
// нет («повтор старого запуска (Re-run) или запуск не из main»), и последствие, которого нет («откатила бы живой сайт»).
//
// Настоящие коммиты main (только чтение git): B = 10af092 (sites/7thserpent.com/CLAUDE.md — push-фильтр срабатывает),
// C = f22bb92 (DECISIONS.md, docs/BACKLOG.md — не срабатывает). Сторож — команда golova копии, как в шаге workflow.
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-gl25/zakon';
const KOPIYA = `${PAPKA}/kopiya`;
const STOROZH = `${KOPIYA}/sites/7thserpent.com/tools/storozha-vykladki.mjs`;
const REPO = 'D:/SEO/cloud/site-generator';
const RAB = join(PAPKA, 'rabochie-z1');
mkdirSync(RAB, { recursive: true });

const out = [];
const p = (s = '') => out.push(s);
const git = (...a) => {
  const r = spawnSync('git', ['-C', REPO, ...a], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${a.join(' ')}: ${r.stderr}`);
  return r.stdout;
};

// 1. Пути push-фильтра — из workflow копии (разбор YAML тем же пакетом, что у проб).
const yaml = createRequire(`${KOPIYA}/sites/7thserpent.com/tools/testy/storozha-vykladki.test.mjs`)('yaml');
const WF = yaml.parse(readFileSync(`${KOPIYA}/.github/workflows/deploy-7thserpent.yml`, 'utf8'));
const PUTI = WF.on.push.paths;
const podkhodit = (f) => PUTI.some((o) => (o.endsWith('/**') ? f.startsWith(o.slice(0, -2)) : f === o));
p(`push-фильтр workflow: ${JSON.stringify(PUTI)}`);
p(`concurrency: ${JSON.stringify(WF.concurrency)}`);

// 2. Настоящие коммиты.
const B = git('log', '-1', '--format=%H', '10af092').trim();
const C = git('log', '-1', '--format=%H', 'f22bb92').trim();
const fB = git('diff', '--name-only', `${B}^`, B).trim().split('\n').filter(Boolean);
const fC = git('diff', '--name-only', B, C).trim().split('\n').filter(Boolean);
p();
p(`B = ${B} — файлы push-а B: ${fB.join(', ')} → фильтр ${fB.some(podkhodit) ? 'СРАБАТЫВАЕТ (прогон B создан)' : 'не срабатывает'}`);
p(`C = ${C} — файлы между B и C: ${fC.join(', ')} → фильтр ${fC.some(podkhodit) ? 'срабатывает' : 'НЕ срабатывает (прогона C нет, pending B не отменён)'}`);
const vkhodyVykladki = ['sites/7thserpent.com', 'core', 'package.json', 'package-lock.json', '.github/workflows/deploy-7thserpent.yml'];
const raznica = git('diff', '--name-only', B, C, '--', ...vkhodyVykladki).trim();
p(`git diff B C -- ${vkhodyVykladki.join(' ')}: ${raznica ? raznica : '(пусто — сборка и workflow B и C одни и те же)'}`);

// 3. Шаг workflow в прогоне B, когда main = C: вывод ls-remote — голова C; окружение раннера для push из main, первая
// попытка (GITHUB_EVENT_NAME, GITHUB_REF, GITHUB_RUN_ATTEMPT — переменные раннера по умолчанию; сторож их не читает).
writeFileSync(join(RAB, 'golova-main.txt'), `${C}\trefs/heads/main\n`);
writeFileSync(join(RAB, 'golova-main-oshibki.txt'), '');
const zapusk = (imya, env) => {
  const r = spawnSync(process.execPath, [STOROZH, 'golova', join(RAB, 'golova-main.txt'), join(RAB, 'golova-main-oshibki.txt')], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  p();
  p(`[${imya}] ${JSON.stringify(env)}`);
  p(`код ${r.status}`);
  p(`stdout: ${r.stdout.trim()}`);
  if (r.stderr.trim()) p(`stderr: ${r.stderr.trim()}`);
  return r;
};
const push = zapusk('прогон push B ждал в очереди, main = C', { GITHUB_SHA: B, SERPENT_ROLLBACK: 'off', GITHUB_EVENT_NAME: 'push', GITHUB_REF: 'refs/heads/main', GITHUB_RUN_ATTEMPT: '1' });
const ruchnoi = zapusk('Run workflow из main (коммит B) ждал в очереди, main = C', { GITHUB_SHA: B, SERPENT_ROLLBACK: 'off', GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REF: 'refs/heads/main', GITHUB_RUN_ATTEMPT: '1' });

// 4. Сверка: стоп есть, и строка утверждает то, чего нет.
const t = push.stdout;
const fakty = [
  ['код 1 (красный крест) у законного push-прогона', push.status === 1],
  ['и у Run workflow из main', ruchnoi.status === 1],
  ['строка называет причиной «повтор старого запуска (Re-run) или запуск не из main» — а это push из main, первая попытка', /повтор старого запуска \(Re-run\) или запуск не из main/.test(t)],
  ['строка говорит «откатила бы живой сайт к этому коммиту» — а сборка B = сборка C (дифф входов пуст)', /откатила бы живой сайт к этому коммиту/.test(t) && raznica === ''],
  ['о причине «main ушёл вперёд, пока запуск ждал очереди» строка молчит', !/очеред|ушёл вперёд|новый коммит/i.test(t)],
];
p();
p('ИТОГ:');
for (const [chto, da] of fakty) p(`  ${da ? 'ДА ' : 'НЕТ'} — ${chto}`);
p();
p('Как выходит на GitHub (по документации, не измерено здесь): concurrency group deploy-7thserpent, cancel-in-progress: false —');
p('новый запуск ждёт (pending), пока идёт прежний; следующий запуск той же группы отменяет ждущий. Коммит вне путей');
p('push-фильтра прогона не создаёт — ждущий B не отменяется и стартует с GITHUB_SHA = B, когда голова уже C. Без очереди —');
p('то же, если C пришёл в первые ~0,5–1 мин прогона B (checkout и setup-node до сторожа).');

const vyvod = `${out.join('\n')}\n`;
writeFileSync(join(PAPKA, 'GL25-Z-1-vyvod.txt'), vyvod);
console.log(vyvod);
