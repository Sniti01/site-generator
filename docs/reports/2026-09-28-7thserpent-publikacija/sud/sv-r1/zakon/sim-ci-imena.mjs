// SV1-Z-1, продолжение модели: CSS с иными cid получает иное имя (хеш содержимого в имени _astro/*.css),
// ссылки HTML на него — тоже. Берём копию dist-ci из sim-ci.mjs, переименовываем изменившиеся CSS условным
// хешем содержимого (sha256 → 8 знаков base64url, как у сборщика по форме) и прогоняем сторож как в workflow.
import { readFileSync, writeFileSync, readdirSync, statSync, renameSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const ZDES = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/2a2fa1b5-b706-4952-b80c-ce6acb0f1174/scratchpad/sud/sv-r1/zakon';
const KOPIYA = ZDES + '/dist-ci';
const obhod = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? obhod(join(d, n)) : [join(d, n)]));

const iskhod = SAYT + '/dist';
const pary = [];
for (const f of obhod(join(KOPIYA, '_astro')).filter((x) => x.endsWith('.css'))) {
  const r = relative(KOPIYA, f).replace(/\\/g, '/');
  const bylo = readFileSync(join(iskhod, r));
  const stalo = readFileSync(f);
  if (bylo.equals(stalo)) continue;
  const h = createHash('sha256').update(stalo).digest('base64url').slice(0, 8);
  const novoe = basename(r).replace(/\.[A-Za-z0-9_-]{8}\.css$/, `.${h}.css`);
  renameSync(f, join(KOPIYA, '_astro', novoe));
  pary.push([basename(r), novoe]);
}
for (const f of obhod(KOPIYA).filter((x) => x.endsWith('.html'))) {
  let t = readFileSync(f, 'utf8');
  for (const [a, b] of pary) t = t.split('/_astro/' + a).join('/_astro/' + b);
  writeFileSync(f, t);
}
const r = spawnSync(process.execPath, [SAYT + '/tools/storozha-vykladki.mjs', 'sverka-dist', KOPIYA, SAYT + '/gates/sborka-prinyataya.json'], { encoding: 'utf8' });
console.log(`переименовано CSS: ${pary.map((p) => p.join(' → ')).join('; ')}`);
console.log(`sverka-dist: код ${r.status}: ${(r.stdout + r.stderr).trim()}`);
