// SV23-O2 · вход только в первой попытке запуска (правка раунда 1, SV23-O-6):
//   SERPENT_DOMAIN_BOUND: ${{ github.run_attempt == 1 && inputs.SERPENT_DOMAIN_BOUND || 'off' }}
// (1) Модель выражений GitHub по документации (не замер): github.run_attempt — строка ("1", "2", …); «==» при разных типах
// приводит к числу (строка — как число JSON, иначе NaN; '' → 0; null → 0); «&&» и «||» возвращают операнд; ложь — false,
// 0, '', null, NaN. Приоритет: «==» выше «&&», «&&» выше «||».
// (2) Договор файла (разбор YAML): где встречаются вход и run_attempt, какие триггеры (workflow_call, workflow_run,
// repository_dispatch — путь «повтор диспетчера = новый запуск с согласием»), кто ещё в репозитории запускает workflow.
// (3) Файл workflow коммита a836697 (до правки; ушёл в origin/7thserpent-yashchik): повтор запуска, созданного с него,
// идёт по его файлу и его сторожу — без run_attempt.
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { vyvod, REPO } from './obshchee-o2.mjs';

const { parse } = createRequire(`${REPO}/package.json`)('yaml');
const stroki = [];

// (1) модель
const kChislu = (v) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number') return v;
  if (v === '') return 0;
  const n = Number(v);
  return /^\s*-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?\s*$/.test(v) ? n : NaN;
};
const ravno = (a, b) => (typeof a === typeof b ? a === b : kChislu(a) === kChislu(b));
const istina = (v) => !(v === false || v === 0 || v === '' || v === null || v === undefined || Number.isNaN(v));
const vyrazhenie = (popytka, vkhod) => {
  const a = ravno(popytka, 1); // github.run_attempt == 1
  const b = istina(a) ? vkhod : a; // … && inputs.SERPENT_DOMAIN_BOUND
  return istina(b) ? b : 'off'; // … || 'off'
};
stroki.push('(1) модель выражения: попытка × значение входа → значение SERPENT_DOMAIN_BOUND шагу домена');
for (const popytka of ['1', '2', '3', '10']) {
  const ryad = ['on', 'off', '', null].map((v) => `${v === null ? 'нет (push)' : JSON.stringify(v)} → ${JSON.stringify(vyrazhenie(popytka, v))}`);
  stroki.push(`  run_attempt=${JSON.stringify(popytka)}: ${ryad.join('; ')}`);
}
stroki.push('');

// (2) договор файла
const WF = parse(readFileSync(`${REPO}/.github/workflows/deploy-7thserpent.yml`, 'utf8'));
const gde = [];
const obhod = (o, put) => {
  if (typeof o === 'string') {
    if (/SERPENT_DOMAIN_BOUND|run_attempt/.test(o)) gde.push(`${put} = ${JSON.stringify(o).slice(0, 120)}`);
    return;
  }
  if (o && typeof o === 'object') for (const [k, x] of Object.entries(o)) obhod(x, `${put}.${k}`);
};
obhod(WF, '');
stroki.push(`(2) триггеры: ${Object.keys(WF.on).join(', ')}; workflow_call/workflow_run/repository_dispatch — ${['workflow_call', 'workflow_run', 'repository_dispatch'].filter((t) => t in WF.on).join(', ') || 'нет'}`);
stroki.push('  строки с именем входа или run_attempt:');
for (const g of gde) stroki.push(`    ${g}`);
const drugie = readdirSync(`${REPO}/.github/workflows`).filter((f) => f !== 'deploy-7thserpent.yml');
for (const f of drugie) {
  const t = readFileSync(`${REPO}/.github/workflows/${f}`, 'utf8');
  stroki.push(`  ${f}: упоминает deploy-7thserpent, «gh workflow run» или dispatches — ${/deploy-7thserpent|gh workflow|dispatches|createWorkflowDispatch/.test(t) ? 'ДА' : 'нет'}`);
}
stroki.push('');

// (3) файл коммита a836697
const staryi = spawnSync('git', ['-C', REPO, 'show', 'a836697:.github/workflows/deploy-7thserpent.yml'], { encoding: 'utf8' }).stdout;
const staryiWF = parse(staryi);
const shag = staryiWF.jobs.deploy.steps.find((s) => (s.name ?? '').includes('Домен уже привязан'));
const vetki = spawnSync('git', ['-C', REPO, 'branch', '-r', '--contains', 'a836697'], { encoding: 'utf8' }).stdout.trim();
stroki.push(`(3) a836697 (на сервере: ${vetki || 'нет'}): env шага домена — ${JSON.stringify(shag.env.SERPENT_DOMAIN_BOUND)}; run_attempt в файле — ${staryi.includes('run_attempt') ? 'есть' : 'нет'}`);
stroki.push('  Повтор запуска идёт по файлу и коду его коммита: запуск Run workflow с ветки 7thserpent-yashchik на a836697 со входами');
stroki.push('  on/on, если он был, при повторе несёт согласие, а его сторож домена (до раунда 1) пропускает и «не понять». Проверить');
stroki.push('  список запусков в Actions отсюда нельзя (сети нет).');
vyvod('o2-povtor-vyvod.txt', stroki);
