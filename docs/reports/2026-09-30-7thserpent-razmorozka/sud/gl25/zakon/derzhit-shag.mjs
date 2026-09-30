// ДЕРЖИТ (шаг как написан): блок run шага «Коммит запуска — голова main» из YAML копии пишется в файл и идёт через
// `bash -e <файл>` — так GitHub исполняет run без shell (bash -e {0}). Env шага — по выражению workflow; рабочая папка —
// не репозиторий (нет .git: ls-remote с явным адресом его не требует).
//   1) настоящая сеть (второй ls-remote из трёх разрешённых): push из main, GITHUB_SHA = голова → код 0, строка прохода;
//   2) без сети: адрес file:// несуществующего репозитория — git падает (код 128), `|| echo` держит bash -e, сторож
//      печатает СТОП с первой строкой ошибки git → код шага 1 (строка СТОП, не обрыв оболочки);
//   3) то же со входом отката — СТОП и со входом.
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-gl25/zakon';
const KOPIYA = `${PAPKA}/kopiya`;
const yaml = createRequire(`${KOPIYA}/sites/7thserpent.com/tools/testy/storozha-vykladki.test.mjs`)('yaml');
const WF = yaml.parse(readFileSync(`${KOPIYA}/.github/workflows/deploy-7thserpent.yml`, 'utf8'));
const shag = WF.jobs.deploy.steps.find((s) => s.name === 'Коммит запуска — голова main');
const out = [];
const p = (s = '') => out.push(s);
p(`run шага (из YAML копии):\n${shag.run}`);
p(`env шага: ${JSON.stringify(shag.env)}`);
p(`shell шага: ${shag.shell ?? '(нет — по умолчанию bash -e {0})'}; defaults.run: ${JSON.stringify(WF.defaults ?? null)}`);

const GOLOVA = 'f22bb920398794800ae78474dbe5d5a839ce6c76';
const prognat = (imya, dop) => {
  const rab = join(PAPKA, `rabochie-shag-${imya}`);
  rmSync(rab, { recursive: true, force: true });
  mkdirSync(rab, { recursive: true });
  writeFileSync(join(rab, 'shag.sh'), shag.run);
  const env = {
    ...process.env,
    GIT_TERMINAL_PROMPT: '0',
    SITE: `${KOPIYA}/sites/7thserpent.com`,
    GITHUB_SERVER_URL: 'https://github.com',
    GITHUB_REPOSITORY: 'Sniti01/site-generator',
    ...dop,
  };
  const r = spawnSync('bash', ['-e', 'shag.sh'], { cwd: rab, env, encoding: 'utf8' });
  p();
  p(`[${imya}] ${JSON.stringify(dop)}; .git в рабочей папке: ${existsSync(join(rab, '.git')) ? 'есть' : 'нет'}`);
  p(`код шага: ${r.status}`);
  p(`stdout: ${r.stdout.trim()}`);
  if (r.stderr.trim()) p(`stderr: ${r.stderr.trim()}`);
  p(`golova-main.txt: ${JSON.stringify(readFileSync(join(rab, 'golova-main.txt'), 'utf8'))}`);
  p(`golova-main-oshibki.txt: ${JSON.stringify(readFileSync(join(rab, 'golova-main-oshibki.txt'), 'utf8'))}`);
  return r;
};

const a = prognat('set-push', { GITHUB_SHA: GOLOVA, SERPENT_ROLLBACK: 'off' });
const b = prognat('bez-seti', { GITHUB_SERVER_URL: 'file:///C:/net-takogo-repozitoriya-gl25', GITHUB_REPOSITORY: 'x/y', GITHUB_SHA: GOLOVA, SERPENT_ROLLBACK: 'off' });
const c = prognat('bez-seti-otkat', { GITHUB_SERVER_URL: 'file:///C:/net-takogo-repozitoriya-gl25', GITHUB_REPOSITORY: 'x/y', GITHUB_SHA: GOLOVA, SERPENT_ROLLBACK: 'on' });

p();
p('ИТОГ:');
p(`  ${a.status === 0 && /= голова main — выкладывается он/.test(a.stdout) ? 'ДЕРЖИТ' : 'НЕ ДЕРЖИТ'} — настоящая сеть, push из main: проход с коммитом`);
p(`  ${b.status === 1 && /СТОП: голову main не узнать — git ls-remote с ошибкой/.test(b.stdout) ? 'ДЕРЖИТ' : 'НЕ ДЕРЖИТ'} — отказ git: bash -e не обрывается на git, код шага — от сторожа (1), строка СТОП с ошибкой git`);
p(`  ${c.status === 1 && /СТОП: голову main не узнать/.test(c.stdout) ? 'ДЕРЖИТ' : 'НЕ ДЕРЖИТ'} — отказ git со входом отката: СТОП и со входом`);

const vyvod = `${out.join('\n')}\n`;
writeFileSync(join(PAPKA, 'derzhit-shag.txt'), vyvod);
console.log(vyvod);
