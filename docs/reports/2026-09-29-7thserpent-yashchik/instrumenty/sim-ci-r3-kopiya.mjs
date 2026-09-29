// Раунд 3, законные формы: здоровая сборка CI на НОВОЙ нормализации (f534de5). Модель раунда 1 (sim-ci.mjs +
// sim-ci-imena.mjs) одним файлом: копия dist, cid ядра — как их даёт компилятор Astro для пути раннера, CSS с иным
// содержимым — иное имя (хеш содержимого), ссылки HTML — на новое имя; затем sverka-dist как в workflow.
// Копия пишется в свою папку и удаляется в конце.
import { readFileSync, writeFileSync, readdirSync, statSync, cpSync, rmSync, renameSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const REPO = 'D:/SEO/cloud/site-generator';
const SAYT = REPO + '/sites/7thserpent.com';
const DIST = SAYT + '/dist';
const ZDES = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/e23fb3af-937c-42f5-91ca-cf6567cf6a1c/scratchpad/sim-ci';
const KOPIYA = ZDES + '/dist-ci';
const STOROZH = SAYT + '/tools/storozha-vykladki.mjs';
const PRIN = SAYT + '/gates/sborka-prinyataya.json';
const { transform } = await import(pathToFileURL(REPO + '/node_modules/@astrojs/compiler-rs/dist/index.mjs').href);
const obhod = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? obhod(join(d, n)) : [join(d, n)]));
const zapusk = (dist) => {
  const r = spawnSync(process.execPath, [STOROZH, 'sverka-dist', dist, PRIN], { encoding: 'utf8' });
  return `код ${r.status}: ${(r.stdout + r.stderr).trim().slice(0, 400)}`;
};

const zamena = new Map();
for (const f of obhod(REPO + '/core').filter((x) => x.endsWith('.astro'))) {
  const src = readFileSync(f, 'utf8');
  const r = relative(REPO, f).replace(/\\/g, '/');
  const win = transform(src, { filename: 'D:/SEO/cloud/site-generator/' + r, normalizedFilename: 'D:/SEO/cloud/site-generator/' + r }).scope;
  const ci = transform(src, { filename: '/home/runner/work/site-generator/site-generator/' + r, normalizedFilename: '/home/runner/work/site-generator/site-generator/' + r }).scope;
  zamena.set(win, ci);
}
try {
  console.log('dist как есть:', zapusk(DIST));
  rmSync(KOPIYA, { recursive: true, force: true });
  cpSync(DIST, KOPIYA, { recursive: true });
  let tronuto = 0;
  for (const f of obhod(KOPIYA).filter((x) => /\.(html|css)$/.test(x))) {
    const t = readFileSync(f, 'utf8');
    const n = t.replace(/data-astro-cid-([a-z0-9]{8})/g, (m, k) => (zamena.has(k) ? 'data-astro-cid-' + zamena.get(k) : m));
    if (n !== t) { writeFileSync(f, n); tronuto += 1; }
  }
  const pary = [];
  for (const f of obhod(join(KOPIYA, '_astro')).filter((x) => x.endsWith('.css'))) {
    const r = relative(KOPIYA, f).replace(/\\/g, '/');
    if (readFileSync(join(DIST, r)).equals(readFileSync(f))) continue;
    const h = createHash('sha256').update(readFileSync(f)).digest('base64url').slice(0, 8);
    const novoe = basename(r).replace(/\.[A-Za-z0-9_-]{8}\.css$/, `.${h}.css`);
    renameSync(f, join(KOPIYA, '_astro', novoe));
    pary.push([basename(r), novoe]);
  }
  for (const f of obhod(KOPIYA).filter((x) => x.endsWith('.html'))) {
    let t = readFileSync(f, 'utf8');
    for (const [a, b] of pary) t = t.split('/_astro/' + a).join('/_astro/' + b);
    writeFileSync(f, t);
  }
  console.log(`модель раннера: файлов с иными cid ${tronuto}; CSS переименовано: ${pary.map((p) => p.join(' → ')).join('; ')}`);
  console.log('модель сборки CI:', zapusk(KOPIYA));
} finally {
  rmSync(KOPIYA, { recursive: true, force: true });
  console.log('копия удалена:', !readdirSync(ZDES).includes('dist-ci'));
}
