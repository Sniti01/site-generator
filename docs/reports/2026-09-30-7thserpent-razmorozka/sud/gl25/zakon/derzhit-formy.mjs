// ДЕРЖИТ: законные формы запуска — команда golova копии на НАСТОЯЩЕМ выводе git ls-remote (rabochie-ls/, снят
// zhivoi-ls-remote.mjs), env SERPENT_ROLLBACK — по выражению шага `github.run_attempt == 1 && inputs.SERPENT_ROLLBACK || 'off'`
// в семантике выражений GitHub по документации (== с приведением строки к числу; && и || возвращают операнд; нет входа —
// null). Модель выражения — моя, не GitHub: предел.
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-gl25/zakon';
const STOROZH = `${PAPKA}/kopiya/sites/7thserpent.com/tools/storozha-vykladki.mjs`;
const LS = join(PAPKA, 'rabochie-ls/golova-main.txt');
const OSH = join(PAPKA, 'rabochie-ls/golova-main-oshibki.txt');
const GOLOVA = /^([0-9a-f]{40})\t/.exec(readFileSync(LS, 'utf8'))[1];
const STARYI = '10af0921aec3f2a4262292cdf0a4715609420d16'; // коммит main позади головы (только docs после него)

// Выражение шага в семантике GitHub.
const kakChislo = (v) => (v === null || v === undefined ? 0 : typeof v === 'number' ? v : v === '' ? 0 : Number(v));
const istina = (v) => !(v === null || v === undefined || v === false || v === 0 || v === '' || Number.isNaN(v));
const vyrazhenie = (runAttempt, vkhod) => {
  const ravno = kakChislo(runAttempt) === 1; // github.run_attempt — строка '1', '2', …
  const i = ravno ? vkhod : ravno; // a && b
  return istina(i) ? i : 'off'; // … || 'off'
};

const FORMY = [
  // [имя, GITHUB_SHA, run_attempt, inputs.SERPENT_ROLLBACK (null — push), ждём код, ждём кусок]
  ['push в main (вливание перемоткой; несколько коммитов — GITHUB_SHA = верхний)', GOLOVA, '1', null, 0, '= голова main — выкладывается он'],
  ['Run workflow из main, вход off', GOLOVA, '1', 'off', 0, '= голова main — выкладывается он'],
  ['Run workflow из main, первая выкладка (SERPENT_FIRST = on — сторож головы его не читает)', GOLOVA, '1', 'off', 0, '= голова main — выкладывается он'],
  ['Run workflow из main, вход on по ошибке', GOLOVA, '1', 'on', 0, '= голова main — выкладывается он'],
  ['Re-run прогона головы после красного на другом шаге, main не двигался', GOLOVA, '2', 'off', 0, '= голова main — выкладывается он'],
  ['Re-run failed jobs, третья попытка, main не двигался', GOLOVA, '3', null, 0, '= голова main — выкладывается он'],
  ['Run workflow из ветки сессии или метки на голове main', GOLOVA, '1', 'off', 0, '= голова main — выкладывается он'],
  ['откат: Run workflow из метки старого коммита, вход on', STARYI, '1', 'on', 0, 'ОТКАТ: выкладывается коммит'],
  ['верный стоп: Re-run старого прогона (main ушёл вперёд)', STARYI, '2', 'off', 1, 'повтор старого запуска (Re-run)'],
  ['верный стоп: Re-run прогона отката — вход не переносится', STARYI, '2', 'on', 1, 'SERPENT_ROLLBACK = on'],
  ['верный стоп: Run workflow из ветки не на голове, вход off', STARYI, '1', 'off', 1, 'запуск не из main'],
];

const out = [`голова main по настоящему выводу: ${GOLOVA}`];
let vse = true;
for (const [imya, sha, popytka, vkhod, zhdem, kusok] of FORMY) {
  const otkat = vyrazhenie(popytka, vkhod);
  const r = spawnSync(process.execPath, [STOROZH, 'golova', LS, OSH], { encoding: 'utf8', env: { ...process.env, GITHUB_SHA: sha, SERPENT_ROLLBACK: otkat } });
  const ok = r.status === zhdem && r.stdout.includes(kusok);
  vse &&= ok;
  out.push('', `[${ok ? 'ДЕРЖИТ' : 'НЕ ДЕРЖИТ'}] ${imya}`, `  run_attempt ${popytka}, inputs ${JSON.stringify(vkhod)} → SERPENT_ROLLBACK=${JSON.stringify(otkat)}; код ${r.status} (ждём ${zhdem})`, `  ${r.stdout.trim()}${r.stderr.trim() ? ` | stderr: ${r.stderr.trim()}` : ''}`);
}
out.push('', `ИТОГ: ${vse ? 'все формы — как ждём' : 'ЕСТЬ РАСХОЖДЕНИЯ'}`);
const vyvod = `${out.join('\n')}\n`;
writeFileSync(join(PAPKA, 'derzhit-formy.txt'), vyvod);
console.log(vyvod);
