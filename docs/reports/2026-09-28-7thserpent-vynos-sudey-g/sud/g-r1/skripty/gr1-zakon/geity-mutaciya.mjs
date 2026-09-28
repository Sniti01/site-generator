// GR1-Z: tools/geity.mjs — «оба идут до конца, даже когда первый отказал». Копия исходника в своей папке, гейты —
// заглушки (ядро: печатает строку итога ядра и код; знак: отказ). Мутант — break после первого отказа. Сценарий пробы
// znak-sborka.test.mjs (ядро прошло, знак отказал) и сценарий «ядро отказало».
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
const D = import.meta.dirname;
const src = readFileSync('D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/geity.mjs', 'utf8');
writeFileSync(join(D, 'zagl-yadro-ok.mjs'), "console.log('Bramki: 4/4 przechodzi.');\n");
writeFileSync(join(D, 'zagl-yadro-otkaz.mjs'), "console.error('Bramki: struktura — nie przechodzi. Budowanie przerwane.'); process.exit(1);\n");
writeFileSync(join(D, 'zagl-znak-otkaz.mjs'), "console.error('znak: ОТКАЗ — 1\\n  - public/favicon.svg: байты не равны тому, что пишет инструмент'); process.exit(1);\n");
const GEITY_IZ = /const GEITY = \[[\s\S]*?\n\];/;
if (!GEITY_IZ.test(src)) throw new Error('список GEITY не найден');
const sdelat = (yadro, mutant) => {
  let s = src.replace(GEITY_IZ, `const GEITY = [\n  ['гейты ядра', [${JSON.stringify(join(D, yadro))}]],\n  ['знак', [${JSON.stringify(join(D, 'zagl-znak-otkaz.mjs'))}]],\n];`);
  if (mutant) {
    const iz = "if (r.status !== 0) otkazali.push(`${imya} (код ${r.status ?? r.signal})`);";
    if (!s.includes(iz)) throw new Error('мутация не применилась');
    s = s.replace(iz, "if (r.status !== 0) { otkazali.push(`${imya} (код ${r.status ?? r.signal})`); break; }");
  }
  const f = join(D, `geity-${yadro.replace('.mjs', '')}-${mutant ? 'mutant' : 'nastoyashchii'}.mjs`);
  writeFileSync(f, s);
  const r = spawnSync(process.execPath, [f], { encoding: 'utf8' });
  const v = `${r.stdout}${r.stderr}`;
  // Утверждения пробы «гейт сайта: отказ знака…» (znak-sborka.test.mjs), кроме сборки.
  const proba = r.status !== 0 && /Гейты сайта: не прошли — знак/.test(v) && /public\/favicon\.svg: байты не равны/.test(v) && /Bramki: 4\/4 przechodzi/.test(v);
  return `код ${r.status}; знак запускался: ${/znak: ОТКАЗ/.test(v)}; утверждения пробы: ${proba ? 'проходят' : 'не проходят'}; итог: ${v.split('\n').find((l) => l.startsWith('Гейты сайта')) ?? '—'}`;
};
const out = [
  `ядро прошло, знак отказал (сценарий пробы) — настоящий: ${sdelat('zagl-yadro-ok.mjs', false)}`,
  `ядро прошло, знак отказал (сценарий пробы) — мутант:    ${sdelat('zagl-yadro-ok.mjs', true)}`,
  `ядро отказало — настоящий: ${sdelat('zagl-yadro-otkaz.mjs', false)}`,
  `ядро отказало — мутант:    ${sdelat('zagl-yadro-otkaz.mjs', true)}`,
];
writeFileSync(join(D, 'geity-mutaciya.txt'), out.join('\n') + '\n');
console.log(out.join('\n'));
