// Законные формы входа сторожей папки, index.html и пересчёта: вывод lftp, какой он бывает при правильной настройке.
// Сборка — настоящий dist/ сайта (только чтение). Каждая строка: имя формы — вердикт (ok/отказ) — ждём.
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const DIST = SAYT + '/dist';
const ZDES = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/2a2fa1b5-b706-4952-b80c-ce6acb0f1174/scratchpad/sud/sv-r1/zakon';
const S = await import(pathToFileURL(SAYT + '/tools/storozha-vykladki.mjs').href);
const STOROZH = SAYT + '/tools/storozha-vykladki.mjs';

const verh = readdirSync(DIST).sort().map((n) => (statSync(join(DIST, n)).isDirectory() ? n + '/' : n));
const nashIndex = readFileSync(join(DIST, 'index.html'), 'utf8');
const fajly = Object.keys(S.spisokSborki(DIST).fajly);
const papki = [...new Set(fajly.flatMap((f) => { const p = f.split('/'); return p.slice(0, -1).map((_, i) => p.slice(0, i + 1).join('/') + '/'); }))];

const itogi = [];
const zapis = (imya, r, zhdem) => {
  const ok = r.ok === zhdem;
  itogi.push(ok);
  console.log(`${ok ? 'как ждём' : 'РАСХОЖДЕНИЕ'} — ${imya}: ${r.ok ? 'проход' : 'отказ'} (ждём ${zhdem ? 'проход' : 'отказ'}) — ${r.stroki.join(' | ').slice(0, 220)}`);
};

// Папка робота
zapis('вторая выкладка: в корне наша сборка, ./ и ../', S.papka(['./', '../', ...verh].join('\n') + '\n', nashIndex), true);
zapis('вторая выкладка: MLSD без ./ и ../', S.papka(verh.join('\n') + '\n', nashIndex), true);
zapis('наша сборка + .well-known/ от сертификата', S.papka(['./', '../', '.well-known/', ...verh].join('\n') + '\n', nashIndex), true);
zapis('наша сборка + cgi-bin/ хостера', S.papka(['./', '../', 'cgi-bin/', ...verh].join('\n') + '\n', nashIndex), true);
zapis('пустой корень после удаления заглушки', S.papka('./\n../\n', null), true);
zapis('пустой корень — lftp не печатает ничего', S.papka('', null), true);
zapis('заглушка index.php (не index.html)', S.papka('./\n../\nindex.php\n', null), true);
// index.html до mirror
zapis('index.html — наша сборка (dist/index.html)', S.indeks(nashIndex), true);
zapis('index.html нет', S.indeks(null), true);
// Пересчёт
const findS = ['./', ...papki.map((p) => './' + p), ...fajly.map((f) => './' + f)].sort().join('\n') + '\n';
zapis('find . lftp: ./ перед путями, каталоги с /', S.pereschet(findS, DIST), true);
const findBez = ['./', ...papki, ...fajly].sort().join('\n') + '\n';
zapis('find . без ./ у путей', S.pereschet(findBez, DIST), true);

// Команда целиком, как в workflow: mirror не нашёл index.html — файла remote-top/index.html нет.
const d = join(ZDES, 'wf');
rmSync(d, { recursive: true, force: true });
mkdirSync(join(d, 'remote-top'), { recursive: true });
writeFileSync(join(d, 'remote-root.txt'), './\n../\n');
const kod = (argi) => spawnSync(process.execPath, [STOROZH, ...argi], { encoding: 'utf8', cwd: d });
const a = kod(['papka', 'remote-root.txt', 'remote-top/index.html']);
const b = kod(['indeks', 'remote-top/index.html']);
console.log(`workflow, пустой корень: papka код ${a.status} (${a.stdout.trim()}); indeks код ${b.status} (${b.stdout.trim()})`);
itogi.push(a.status === 0 && b.status === 0);
// mirror в пустом корне может и не создать remote-top — сторож не должен падать кодом 2
rmSync(join(d, 'remote-top'), { recursive: true, force: true });
const a2 = kod(['papka', 'remote-root.txt', 'remote-top/index.html']);
const b2 = kod(['indeks', 'remote-top/index.html']);
console.log(`workflow, пустой корень, папки remote-top нет: papka код ${a2.status}; indeks код ${b2.status}`);
itogi.push(a2.status === 0 && b2.status === 0);
console.log(`ИТОГ: форм ${itogi.length}, как ждём ${itogi.filter(Boolean).length}, расхождений ${itogi.filter((x) => !x).length}`);
