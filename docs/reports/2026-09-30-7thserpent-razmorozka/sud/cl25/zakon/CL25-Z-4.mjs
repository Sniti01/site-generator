// CL25-Z-4: прогоны живого образца владельца (44 из 44) судятся нынешним public/robots.txt, а не своими байтами.
// Законная будущая правка файла в репозитории (П113: «robots.txt живёт в репозитории» — владелец закрыл ещё бота) до
// новой выкладки и нового замера краснит 3 пробы, из них 2 — «44 из 44» с отказом «наш файл целиком», как будто
// check-live сломан на живом образце. Образец сессии 24 эта же сессия перевела на свои байты (PREZHNIY) ровно поэтому.
import { cpSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { PAPKA, SAYT, progon, zapisat, nashRobots, VLADELEC } from './obshchee.mjs';

const KOPIYA2 = `${PAPKA}/kopiya-pravka`;
rmSync(KOPIYA2, { recursive: true, force: true });
cpSync(`${PAPKA}/kopiya`, KOPIYA2, { recursive: true });
const PRAVKA = nashRobots.replace('User-agent: Googlebot', 'User-agent: GPTBot\nDisallow: /\n\nUser-agent: Googlebot');
if (PRAVKA === nashRobots) throw new Error('правка не сработала');
writeFileSync(`${KOPIYA2}/sites/7thserpent.com/public/robots.txt`, PRAVKA);
const r = spawnSync(process.execPath, ['--test', `${KOPIYA2}/sites/7thserpent.com/tools/testy/check-live.test.mjs`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const vyvod = `${r.stdout}${r.stderr}`;
const upali = [...new Set(vyvod.split('\n').filter((s) => /^(not ok \d+ - |✖ )/.test(s) && !/^✖ failing tests/.test(s)).map((s) => s.replace(/^(not ok \d+ - |✖ )/, '').replace(/ \([\d.]+ms\)$/, '')))];
const itog = vyvod.split('\n').filter((s) => /^ℹ (tests|pass|fail|todo) /.test(s));
const out = [
  `правка копии: public/robots.txt + группа GPTBot перед Googlebot (${Buffer.byteLength(PRAVKA)} байт, LF, без перевода строки в конце)`,
  `node --test копии с правкой: код ${r.status}`,
  ...itog,
  'упавшие пробы:',
  ...upali.map((s) => `  ${s}`),
  '',
];
// Те же пары владельца, судимые своими байтами (как образец сессии 24 — `nash: PREZHNIY`): check-live на них — 44 из 44.
for (const para of VLADELEC.robotsPary) {
  const z = await progon({ mimo: para.s.telo, bez: para.bez.telo, nash: para.s.telo });
  out.push(`пара ${para.para} своими байтами (nash = тело пары): ${z.okCount}/${z.vsego}`);
  const n = await progon({ mimo: para.s.telo, bez: para.bez.telo, nash: PRAVKA });
  out.push(`пара ${para.para} против правленого файла: ${n.okCount}/${n.vsego}; ПЛОХО: ${n.plokho.join(' | ')}`);
}
rmSync(KOPIYA2, { recursive: true, force: true });
out.push('', `копия с правкой удалена; исходная копия не тронута: public/robots.txt = ${readFileSync(`${SAYT}/public/robots.txt`, 'utf8') === nashRobots}`);
zapisat('CL25-Z-4-vyvod.txt', out);
