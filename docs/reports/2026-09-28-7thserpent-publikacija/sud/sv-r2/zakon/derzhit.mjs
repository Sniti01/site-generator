// Что правка раунда 1 держит на законных формах (прогон командой, как в workflow, и функциями).
import { readdirSync, statSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const DIST = SAYT + '/dist';
const STOROZH = SAYT + '/tools/storozha-vykladki.mjs';
const ZDES = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/2a2fa1b5-b706-4952-b80c-ce6acb0f1174/scratchpad/sud/sv-r2/zakon';
const S = await import(pathToFileURL(STOROZH).href);
const out = [];
const z = (imya, ok, stroka) => out.push(`${ok ? 'держит' : 'НЕ ДЕРЖИТ'} — ${imya}: ${stroka}`);

// 1. pervaya: папки remote-top нет вовсе (mirror в пустом корне ничего не создал) — код 0, pervaya=on в GITHUB_OUTPUT.
const d = mkdtempSync(join(ZDES, 'wf-'));
try {
  writeFileSync(join(d, 'out.txt'), '');
  const r = spawnSync(process.execPath, [STOROZH, 'pervaya', 'remote-top/index.html'], { cwd: d, encoding: 'utf8', env: { ...process.env, SERPENT_FIRST: 'off', GITHUB_OUTPUT: join(d, 'out.txt') } });
  z('pervaya без папки remote-top', r.status === 0 && readFileSync(join(d, 'out.txt'), 'utf8') === 'pervaya=on\n', `код ${r.status}, ${r.stdout.trim()}, выход ${JSON.stringify(readFileSync(join(d, 'out.txt'), 'utf8'))}`);
  // пустой корень: papka и indeks без remote-top
  writeFileSync(join(d, 'remote-root.txt'), './\n../\n');
  const a = spawnSync(process.execPath, [STOROZH, 'papka', 'remote-root.txt', 'remote-top/index.html'], { cwd: d, encoding: 'utf8' });
  const b = spawnSync(process.execPath, [STOROZH, 'indeks', 'remote-top/index.html'], { cwd: d, encoding: 'utf8' });
  z('пустой корень без remote-top: papka и indeks', a.status === 0 && b.status === 0, `${a.status}/${b.status}`);
  // pervaya при входе on и нашем index.html — on; при входе '' (push) и нашем — off
  const p1 = S.pervayaVykladka('', readFileSync(join(DIST, 'index.html'), 'utf8'));
  z('push (вход пустой), на сервере наша сборка — не первая', p1.pervaya === false, p1.pochemu);
} finally {
  rmSync(d, { recursive: true, force: true });
}

// 2. Вторая выкладка: корень = настоящая сборка (+ .in.* от оборванной второй) — papka/indeks проход.
const verh = readdirSync(DIST).map((n) => (statSync(join(DIST, n)).isDirectory() ? n + '/' : n));
const nash = readFileSync(join(DIST, 'index.html'), 'utf8');
for (const [imya, dop] of [['вторая', []], ['вторая после оборванной (.in.*)', ['.in.robots.txt.', '.in.index.html.']], ['вторая + cgi-bin/ + .well-known/', ['cgi-bin/', '.well-known/']]]) {
  const r = S.papka(['./', '../', ...verh, ...dop].join('\n'), nash);
  z(`papka: ${imya}`, r.ok, r.stroki[0]);
}
z('indeks: настоящий dist/index.html', S.indeks(nash).ok, S.indeks(nash).stroki[0]);

// 3. Пересчёт: настоящая сборка, find lftp с ./ и каталогами — проход; CRLF — проход.
const fajly = Object.keys(S.spisokSborki(DIST).fajly);
const papki = [...new Set(fajly.flatMap((f) => { const p = f.split('/'); return p.slice(0, -1).map((_, i) => p.slice(0, i + 1).join('/') + '/'); }))];
const find = ['./', ...papki.map((p) => './' + p), ...fajly.map((f) => './' + f)].sort().join('\r\n') + '\r\n';
const pr = S.pereschet(find, DIST);
z('pereschet: настоящая сборка, CRLF', pr.ok, pr.stroki[0]);

// 4. Имена webp: хеш преобразования Astro — без пути файла (fsPath идёт отдельным аргументом, не в хеш).
const hashJs = readFileSync('D:/SEO/cloud/site-generator/node_modules/astro/dist/assets/utils/hash.js', 'utf8');
const plugin = readFileSync('D:/SEO/cloud/site-generator/node_modules/astro/dist/assets/vite-plugin-assets.js', 'utf8');
const nodeJs = readFileSync('D:/SEO/cloud/site-generator/node_modules/astro/dist/assets/utils/node.js', 'utf8');
z('имена webp не зависят от пути', /hashTransform\(options, settings\.config\.image\.service\.entrypoint, hashProperties\)/.test(plugin) && /Object\.defineProperty\(emittedImage, "fsPath", \{\s*enumerable: false/.test(nodeJs) && /acc\[prop\] = transform\[prop\]/.test(hashJs), 'хеш — по свойствам преобразования и src-метаданным; fsPath неперечислим, в JSON метаданных его нет');

// 5. Порядок карты: @astrojs/sitemap сортирует адреса (localeCompare en, numeric) — порядок обхода ФС не влияет.
const gen = readFileSync('D:/SEO/cloud/site-generator/node_modules/@astrojs/sitemap/dist/generate-sitemap.js', 'utf8');
z('порядок sitemap-0.xml не зависит от порядка ФС', /urls\.sort\(\(a, b\) => a\.localeCompare\(b, "en", \{ numeric: true \}\)\)/.test(gen), 'urls.sort(localeCompare)');

console.log(out.join('\n'));
