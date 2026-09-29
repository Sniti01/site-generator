// SV23-O2 · держат ли пробы раунда заявленное правкой: порча копии сторожа (в папке скептика) и прогон ПОДЛИННОГО
// файла проб с подменой импорта (porcha-kryuchok.mjs, module.registerHooks). Контроли: копия без порчи — 0 упавших;
// K1, K2 — порча, которую пробы обязаны ловить. M1–M4 — порча того, что правка раунда 1 заявляет, а пробы не держат.
// Пробы команды (дочерний процесс по пути подлинного сторожа) порчу не видят — они не в счёт.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PAPKA, STOROZH, REPO, vyvod } from './obshchee-o2.mjs';

const ISKHODNIK = readFileSync(STOROZH, 'utf8');
const PROBY = `${REPO}/sites/7thserpent.com/tools/testy/storozha-vykladki.test.mjs`;
const KRYUCHOK = pathToFileURL(join(PAPKA, 'porcha-kryuchok.mjs')).href;
const zamena = (s, iz, na) => {
  const n = s.split(iz).length - 1;
  if (n !== 1) throw new Error(`образец встречается ${n} раз: ${iz.slice(0, 60)}`);
  return s.split(iz).join(na);
};

const PORCHI = [
  ['K0', 'контроль: копия без порчи', []],
  ['K1', 'контроль: svoy без canonical', [['svoy: svoyKhost && chuzhoyKanon === undefined,', 'svoy: svoyKhost,']]],
  ['K2', 'контроль: bezopasno без замены «::»', [[".replace(/::/g, ': :')", '']]],
  ['M1', 'шаблон сертификата — только ERR_TLS_ и DEPTH_ZERO_ (CERT_, SELF_SIGNED_, UNABLE_TO_, HOSTNAME_MISMATCH, ERR_SSL_ — «ошибка сети»)', [['/^(ERR_TLS_|ERR_SSL_|CERT_|DEPTH_ZERO_|SELF_SIGNED_|UNABLE_TO_|HOSTNAME_MISMATCH)/', '/^(ERR_TLS_|DEPTH_ZERO_)/']]],
  ['M2', '«редирект на имя, которого нет» — svoy: true', [["'домен отвечает редиректом на имя, которого нет', put, svoy: false }", "'домен отвечает редиректом на имя, которого нет', put, svoy: true }"]]],
  ['M3', 'bezopasno — только над <title>; canonical, негодный Location и путь — в журнал сырыми', [['stroki.push(bezopasno(`${h}:', 'stroki.push((`${h}:'], ['const zagolovok = zagolovokOtveta(r.telo);', 'const zagolovok = bezopasno(zagolovokOtveta(r.telo));']]],
  ['M4', 'bezopasno гасит только первое «##[» в строке', [[".replace(/##\\[/g, '# #[')", ".replace(/##\\[/, '# #[')"]]],
];

const stroki = [`Подлинный файл проб: ${PROBY}`, ''];
for (const [id, imya, zameny] of PORCHI) {
  const papka = join(PAPKA, 'porcha', id);
  mkdirSync(papka, { recursive: true });
  let t = ISKHODNIK;
  for (const [iz, na] of zameny) t = zamena(t, iz, na);
  const kopiya = join(papka, 'storozha-vykladki.mjs');
  writeFileSync(kopiya, t);
  const r = spawnSync(process.execPath, ['--import', KRYUCHOK, '--test-reporter=tap', PROBY], { encoding: 'utf8', env: { ...process.env, PORCHA_TSEL: kopiya }, timeout: 300000 });
  const vse = /^# tests (\d+)/m.exec(r.stdout)?.[1] ?? '?';
  const upalo = /^# fail (\d+)/m.exec(r.stdout)?.[1] ?? '?';
  const imena = [...r.stdout.matchAll(/^not ok \d+ - (.*)$/gm)].map((m) => m[1]);
  stroki.push(`${id} · ${imya}: проб ${vse}, упало ${upalo}${r.status === null ? ' (таймаут)' : ''}`);
  for (const n of imena) stroki.push(`    упала: ${n}`);
  if (upalo === '?') stroki.push(`    вывод не разобран: ${(r.stdout + r.stderr).slice(0, 300)}`);
}
stroki.push('');
stroki.push('Вывод: порча, которую ни одна проба не ловит (упало 0 при живом контроле K1/K2), — заявленное правкой раунда 1,');
stroki.push('которое пробы раунда не держат: регресс по нему пройдёт зелёным.');
vyvod('o2-porcha-vyvod.txt', stroki);
