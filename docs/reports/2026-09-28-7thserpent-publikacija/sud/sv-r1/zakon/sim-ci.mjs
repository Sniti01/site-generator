// SV1-Z-1: сборка на раннере GitHub (checkout в /home/runner/work/site-generator/site-generator) против принятой
// (собрана в D:\SEO\cloud\site-generator). Хеши областей стилей компонентов ядра считаются компилятором Astro
// от абсолютного пути (компонент вне корня сайта), поэтому на раннере они иные. Моделируем: копия dist,
// где cid ядра заменены на те, что компилятор даёт для пути раннера; затем сторож sverka-dist как в workflow.
// (Имена _astro/*.css на раннере тоже сменятся — хеш содержимого; модель их не переименовывает, т. е. ЗАНИЖАЕТ расхождение.)
import { readFileSync, writeFileSync, readdirSync, statSync, cpSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const REPO = 'D:/SEO/cloud/site-generator';
const SAYT = REPO + '/sites/7thserpent.com';
const DIST = SAYT + '/dist';
const ZDES = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/2a2fa1b5-b706-4952-b80c-ce6acb0f1174/scratchpad/sud/sv-r1/zakon';
const KOPIYA = ZDES + '/dist-ci';
const STOROZH = SAYT + '/tools/storozha-vykladki.mjs';
const PRIN = SAYT + '/gates/sborka-prinyataya.json';
const { transform } = await import(pathToFileURL(REPO + '/node_modules/@astrojs/compiler-rs/dist/index.mjs').href);
const obhod = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? obhod(join(d, n)) : [join(d, n)]));

const zamena = new Map();
for (const f of obhod(REPO + '/core').filter((x) => x.endsWith('.astro'))) {
  const src = readFileSync(f, 'utf8');
  const r = relative(REPO, f).replace(/\\/g, '/');
  const win = transform(src, { filename: 'D:/SEO/cloud/site-generator/' + r, normalizedFilename: 'D:/SEO/cloud/site-generator/' + r }).scope;
  const ci = transform(src, { filename: '/home/runner/work/site-generator/site-generator/' + r, normalizedFilename: '/home/runner/work/site-generator/site-generator/' + r }).scope;
  zamena.set(win, ci);
}

const zapusk = (dist) => {
  const r = spawnSync(process.execPath, [STOROZH, 'sverka-dist', dist, PRIN], { encoding: 'utf8' });
  return `код ${r.status}: ${(r.stdout + r.stderr).trim()}`;
};

console.log('как есть (dist Windows):', zapusk(DIST));
rmSync(KOPIYA, { recursive: true, force: true });
cpSync(DIST, KOPIYA, { recursive: true });
let tronuto = 0;
for (const f of obhod(KOPIYA).filter((x) => /\.(html|css)$/.test(x))) {
  const t = readFileSync(f, 'utf8');
  const n = t.replace(/data-astro-cid-([a-z0-9]{8})/g, (m, k) => (zamena.has(k) ? 'data-astro-cid-' + zamena.get(k) : m));
  if (n !== t) { writeFileSync(f, n); tronuto += 1; }
}
console.log(`модель раннера: файлов с иными cid ${tronuto}`);
console.log('модель сборки CI:', zapusk(KOPIYA));
