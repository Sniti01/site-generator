// GR1-Z-9: копия исходника tools/geity.mjs с гейтами-заглушками (настоящая и мутант с break после первого отказа)
// в двух сценариях: ядро прошло и знак отказал (сценарий пробы znak-sborka.test.mjs) и ядро отказало.
// Заглушка знака пишет метку в файл — так видно, запускался ли знак. Репозиторий не трогается.
//   node geity-prov.mjs
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const TUT = import.meta.dirname;
const ISH = readFileSync('D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/geity.mjs', 'utf8');
const METKA = join(TUT, 'znak-zapuskalsya.txt').replace(/\\/g, '/');
writeFileSync(join(TUT, 'z-yadro-ok.mjs'), "console.log('Bramki: 4/4 przechodzi');\n");
writeFileSync(join(TUT, 'z-yadro-otkaz.mjs'), "console.log('Bramki: 3/4');\nprocess.exit(1);\n");
writeFileSync(join(TUT, 'z-znak-otkaz.mjs'), `import { writeFileSync } from 'node:fs';\nwriteFileSync('${METKA}', 'da');\nconsole.error('  - public/favicon.svg: байты не равны');\nprocess.exit(1);\n`);
const GEITY_ISH = /const GEITY = \[[\s\S]*?\n\];/;
if (!GEITY_ISH.test(ISH)) throw new Error('в geity.mjs нет перечня GEITY');
const LOOP = "if (r.status !== 0) otkazali.push(`${imya} (код ${r.status ?? r.signal})`);";
if (!ISH.includes(LOOP)) throw new Error('в geity.mjs нет строки цикла');
const variant = (yadro, mutant) => {
  let s = ISH.replace(GEITY_ISH, `const GEITY = [\n  ['гейты ядра', ['${join(TUT, yadro).replace(/\\/g, '/')}']],\n  ['знак', ['${join(TUT, 'z-znak-otkaz.mjs').replace(/\\/g, '/')}']],\n];`);
  if (mutant) s = s.replace(LOOP, `${LOOP}\n  if (otkazali.length) break;`);
  return s;
};
const out = [];
for (const [scen, yadro] of [['ядро прошло, знак отказал', 'z-yadro-ok.mjs'], ['ядро отказало, знак отказал', 'z-yadro-otkaz.mjs']]) {
  for (const mutant of [false, true]) {
    const f = join(TUT, `geity-${yadro.replace('.mjs', '')}-${mutant ? 'mutant' : 'nast'}.mjs`);
    writeFileSync(f, variant(yadro, mutant));
    if (existsSync(METKA)) rmSync(METKA);
    const r = spawnSync(process.execPath, [f], { encoding: 'utf8' });
    const v = `${r.stdout}${r.stderr}`;
    const proba = r.status !== 0 && /Гейты сайта: не прошли — знак/.test(v) && /public\/favicon\.svg: байты не равны/.test(v);
    out.push(`${scen} — ${mutant ? 'мутант (break)' : 'настоящий'}: код ${r.status}; знак запускался: ${existsSync(METKA)}; утверждения пробы (без Bramki 4/4): ${proba ? 'проходят' : 'НЕ проходят'}; итог: ${(/Гейты сайта:[^\n]*/.exec(v) ?? ['—'])[0]}`);
  }
}
writeFileSync(join(TUT, 'geity-prov.txt'), out.join('\n') + '\n');
console.log(out.join('\n'));
