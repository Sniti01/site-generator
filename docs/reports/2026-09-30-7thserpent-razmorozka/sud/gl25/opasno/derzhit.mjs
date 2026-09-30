// Что держит сторож головы (копия 22878b2): разбор вывода git ls-remote, строки ошибок git в публичный журнал,
// модель выражения входа отката (по документации GitHub, не замер), коды команды golova на порченых входах.
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TUT = dirname(fileURLToPath(import.meta.url));
const STOROZH = join(TUT, 'kopiya/sites/7thserpent.com/tools/storozha-vykladki.mjs');
const SV = await import(pathToFileURL(STOROZH).href);
const out = [];
const log = (s = '') => out.push(s);
const H = 'f22bb920398794800ae78474dbe5d5a839ce6c76';
const D = '22878b2cc6ad69d11eee356e262e174849295090';
const znak = (...k) => String.fromCharCode(...k);

// 1. Разбор вывода: только ровно одна строка «<40 строчных hex><TAB>refs/heads/main».
log('== 1. golovaIzLsRemote: порченый вывод → null (СТОП), и со входом отката');
const VARIANTY = [
  ['верный', `${H}\trefs/heads/main\n`],
  ['верный с CRLF', `${H}\trefs/heads/main\r\n`],
  ['верный без перевода строки', `${H}\trefs/heads/main`],
  ['пустые строки вокруг', `\n\n${H}\trefs/heads/main\n\n`],
  ['BOM в начале', `${znak(0xfeff)}${H}\trefs/heads/main\n`],
  ['пробел в начале', ` ${H}\trefs/heads/main\n`],
  ['пробел в конце', `${H}\trefs/heads/main \n`],
  ['одиночный CR внутри', `${H}\r\trefs/heads/main\n`],
  ['NUL в конце', `${H}\trefs/heads/main${znak(0)}\n`],
  ['разделитель строк U+2028 внутри', `${H}${znak(0x2028)}\trefs/heads/main\n`],
  ['64 знака (SHA-256)', `${H}${H.slice(0, 24)}\trefs/heads/main\n`],
  ['41 знак', `${H}0\trefs/heads/main\n`],
  ['кириллическая «а» в хеше', `${H.slice(0, 39)}${znak(0x430)}\trefs/heads/main\n`],
  ['refs/heads/main^{}', `${H}\trefs/heads/main^{}\n`],
  ['HEAD и main (--symref не задан — такого вывода нет, но)', `ref: refs/heads/main\tHEAD\n${H}\trefs/heads/main\n`],
  ['две строки хвостового совпадения', `${H}\trefs/heads/main\n${D}\trefs/tags/refs/heads/main\n`],
];
for (const [imya, t] of VARIANTY) {
  const g = SV.golovaIzLsRemote(t);
  const r = SV.golova({ kommit: D, lsRemote: t, otkat: true });
  log(`  ${imya}: голова ${g ? g.slice(0, 7) : 'null'}; golova(вход on) ok=${r.ok}${g ? ' (ОТКАТ)' : ''}`);
}

// 2. Первая строка stderr в журнал: одна строка, без команд раннера, без невидимых, не длиннее 200 знаков + «…».
log('');
log('== 2. строка СТОП со stderr git: одна строка, без «::» и «##[», без управляющих и невидимых, обрез 200');
const STDERR = [
  ['::error::fatal', '::error title=x::fatal: unable to access\n'],
  ['::add-mask:: и ::stop-commands::', '::add-mask::secret ::stop-commands::tok\n'],
  ['##[error]', '##[error]fatal\n'],
  ['ANSI', `${znak(27)}[31mfatal${znak(27)}[0m\n`],
  ['bidi U+202E', `fatal ${znak(0x202e)}txt.exe\n`],
  ['U+2028 внутри первой строки', `fatal${znak(0x2028)}::error::x\n`],
  ['одиночный CR', `fatal\r::error::x\n`],
  ['пустая первая, вторая — ошибка', '\n   \nfatal: repository not found\n'],
  ['первая — только U+200B', `${znak(0x200b)}\nfatal: second\n`],
  ['10 000 знаков', `fatal: ${'x'.repeat(10000)}\n`],
  ['суррогатная пара на краю обреза', `${'x'.repeat(199)}${znak(0xd83d, 0xde00)}tail\n`],
  ['::: подряд', 'fatal:::x\n'],
];
const NEVIDIMYE = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u;
for (const [imya, e] of STDERR) {
  const r = SV.golova({ kommit: D, lsRemote: '', oshibki: e });
  const w = SV.golova({ kommit: H, lsRemote: `${H}\trefs/heads/main\n`, oshibki: e });
  // Каждая строка итога — отдельной строкой журнала; судим каждую.
  const plokho1 = (x) => [/[\n\r]/.test(x) && 'перевод строки', /::/.test(x) && '::', /##\[/.test(x) && '##[', NEVIDIMYE.test(x) && 'невидимый знак', /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/.test(x) && 'разбитая пара'].filter(Boolean);
  const plokho = (stroki) => [...new Set(stroki.flatMap(plokho1))];
  const dlina = Math.max(...r.stroki.map((x) => [...x].length));
  log(`  ${imya}: СТОП ok=${r.ok}, строк ${r.stroki.length}, длина ${dlina}, изъяны: ${plokho(r.stroki).join(', ') || 'нет'}; предупреждение ok=${w.ok}, строк ${w.stroki.length}, изъяны: ${plokho(w.stroki).join(', ') || 'нет'}`);
}
log(`  образец: ${SV.golova({ kommit: D, lsRemote: '', oshibki: '::error title=x::fatal: unable to access\n' }).stroki[0].slice(0, 120)}…`);

// 3. Модель выражения ${{ github.run_attempt == 1 && inputs.SERPENT_ROLLBACK || 'off' }} по правилам документации
//    GitHub (== приводит к числу при разных типах; && и || возвращают операнд; ложны false, 0, -0, '', null).
log('');
log('== 3. модель выражения входа (документация GitHub Actions, не замер)');
const lozh = (v) => v === false || v === 0 || v === '' || v === null || v === undefined || Number.isNaN(v);
const ravno = (a, b) => (typeof a === typeof b ? a === b : Number(a ?? 0) === Number(b ?? 0));
const vyrazh = (popytka, vkhod) => {
  const a = ravno(popytka, 1);
  const i = lozh(a) ? a : vkhod;
  return lozh(i) ? 'off' : i;
};
for (const [imya, popytka, vkhod] of [
  ['push (inputs пуст)', '1', null],
  ['Run workflow, вход on', '1', 'on'],
  ['Run workflow, вход off', '1', 'off'],
  ['Re-run (попытка 2) запуска со входом on', '2', 'on'],
  ['Re-run failed jobs (попытка 3)', '3', 'on'],
  ['run_attempt нет (null)', null, 'on'],
  ['вход через API «yes» (если choice не проверен)', '1', 'yes'],
]) {
  const v = vyrazh(popytka, vkhod);
  log(`  ${imya}: SERPENT_ROLLBACK = ${JSON.stringify(v)} → otkatIzVkhoda = ${SV.otkatIzVkhoda(v)}`);
}

// 4. Коды команды golova на порченых входах окружения и файлов.
log('');
log('== 4. коды команды golova');
const d = mkdtempSync(join(tmpdir(), 'gl25-derzhit-'));
const LS = join(d, 'ls.txt');
writeFileSync(LS, `${H}\trefs/heads/main\n`);
mkdirSync(join(d, 'papka.txt'));
const { GITHUB_SHA: _a, SERPENT_ROLLBACK: _b, ...env0 } = process.env;
const zapusk = (e, argi = [LS]) => spawnSync(process.execPath, [STOROZH, 'golova', ...argi], { encoding: 'utf8', env: { ...env0, ...e } });
for (const [imya, e, argi] of [
  ['голова, вход off', { GITHUB_SHA: H, SERPENT_ROLLBACK: 'off' }],
  ['не голова, вход off', { GITHUB_SHA: D, SERPENT_ROLLBACK: 'off' }],
  ['не голова, вход on', { GITHUB_SHA: D, SERPENT_ROLLBACK: 'on' }],
  ['не голова, вход «on » (пробел)', { GITHUB_SHA: D, SERPENT_ROLLBACK: 'on ' }],
  ['не голова, вход «оn» (кириллица о)', { GITHUB_SHA: D, SERPENT_ROLLBACK: `${znak(0x43e)}n` }],
  ['не голова, вход «true»', { GITHUB_SHA: D, SERPENT_ROLLBACK: 'true' }],
  ['GITHUB_SHA заглавными', { GITHUB_SHA: H.toUpperCase(), SERPENT_ROLLBACK: 'off' }],
  ['GITHUB_SHA 64 знака', { GITHUB_SHA: H + H.slice(0, 24), SERPENT_ROLLBACK: 'off' }],
  ['вывод git — папка', { GITHUB_SHA: H, SERPENT_ROLLBACK: 'off' }, [join(d, 'papka.txt')]],
  ['вывода git нет', { GITHUB_SHA: H, SERPENT_ROLLBACK: 'off' }, [join(d, 'net.txt')]],
  ['три аргумента', { GITHUB_SHA: H, SERPENT_ROLLBACK: 'off' }, [LS, LS, LS]],
]) {
  const r = zapusk(e, argi);
  log(`  ${imya}: код ${r.status}; ${(r.stdout.trim() || r.stderr.trim()).slice(0, 90)}`);
}

writeFileSync(join(TUT, 'derzhit-vyvod.txt'), out.join('\n') + '\n');
