// GL25-O-5: договор workflow не держит двух условий, на которых стоит слово сторожа головы:
//  (А) выкладывается то, что сверено: первый checkout берёт коммит запуска (GITHUB_SHA) — ref у него не закреплён пробой;
//      сторож сверяет GITHUB_SHA, а не HEAD рабочей копии;
//  (Б) красный сторож останавливает выкладку: у шагов после него нет своих if со статус-функциями (always, failure,
//      !cancelled) — у шага «Выкладка по FTPS» if пробой не закреплён.
// Мутанты пишутся в workflow копии (.github — настоящая копия), прогоняется storozha-vykladki.test.mjs копии,
// файл возвращается байт в байт — сверка sha256. Если мутант зелёный на всех пробах — договор его не видит.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TUT = dirname(fileURLToPath(import.meta.url));
const KOPIYA = join(TUT, 'kopiya');
const WF = join(KOPIYA, '.github/workflows/deploy-7thserpent.yml');
const TEST = join(KOPIYA, 'sites/7thserpent.com/tools/testy/storozha-vykladki.test.mjs');
const SV = await import(pathToFileURL(join(KOPIYA, 'sites/7thserpent.com/tools/storozha-vykladki.mjs')).href);
const out = [];
const log = (s = '') => out.push(s);
const sha = (b) => createHash('sha256').update(b).digest('hex');

const ISKHODNYI = readFileSync(WF);
const SHA0 = sha(ISKHODNYI);
const T = ISKHODNYI.toString('utf8');
const EOL = T.includes('\r\n') ? '\r\n' : '\n';
const L = (...s) => s.join(EOL);
const zamena = (tekst, iz, na) => {
  if (!tekst.includes(iz)) throw new Error(`мутант не применился: нет «${iz.slice(0, 60)}»`);
  return tekst.replace(iz, na);
};
const CHECKOUT = L('      - uses: actions/checkout@v5', '        with:', '          persist-credentials: false', '');
const VYKLADKA = L('      - name: Выкладка по FTPS', '        env:');
const MUTANTY = [
  ['исходный workflow копии', T],
  ['(А) первый checkout: ref: 7thserpent-yashchik (старый коммит add241a)', zamena(T, CHECKOUT, CHECKOUT + L('          ref: 7thserpent-yashchik', ''))],
  ['(Б) «Выкладка по FTPS»: if: ${{ !cancelled() }} — идёт и после красного сторожа головы', zamena(T, VYKLADKA, L('      - name: Выкладка по FTPS', '        if: ${{ !cancelled() }}', '        env:'))],
];

const itogTesta = (s) => Object.fromEntries(['tests', 'pass', 'fail'].map((k) => [k, Number((s.match(new RegExp(`^# ${k} (\\d+)`, 'm')) ?? [])[1])]));
try {
  for (const [imya, tekst] of MUTANTY) {
    writeFileSync(WF, tekst);
    const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', TEST], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const t = itogTesta(r.stdout);
    log(`-- ${imya}: код ${r.status}; проб ${t.tests}, прошло ${t.pass}, упало ${t.fail}`);
    if (t.fail) for (const s of r.stdout.split('\n').filter((x) => /^not ok/.test(x))) log(`   ${s}`);
  }
} finally {
  writeFileSync(WF, ISKHODNYI);
}
const SHA1 = sha(readFileSync(WF));
log(`workflow копии возвращён: sha256 до ${SHA0.slice(0, 16)}…, после ${SHA1.slice(0, 16)}… — ${SHA0 === SHA1 ? 'равны' : 'РАЗЛИЧАЮТСЯ'}`);

log('');
log('Что делает мутант (А) в push-запуске головы H: GITHUB_SHA = H = голова → сторож печатает «коммит запуска H = голова main —');
const H = '3333333333333333333333333333333333333333';
log(`выкладывается он» (${SV.golova({ kommit: H, lsRemote: `${H}\trefs/heads/main\n` }).stroki[0].slice(0, 60)}…), а сборка идёт из рабочей копии add241a —`);
log('выкладка старого коммита без входа отката под строкой «выкладывается он». Сверка HEAD рабочей копии с GITHUB_SHA в шаге');
log('головы (git rev-parse HEAD) или проба «первый checkout — with ровно {persist-credentials: false}» закрыли бы это.');
log('Мутант (Б): красный сторож головы (код 1) не останавливает mirror — шаг со статус-функцией в if идёт и после отказа.');

writeFileSync(join(TUT, 'GL25-O-5-vyvod.txt'), out.join('\n') + '\n');
