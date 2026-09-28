// Свои мутанты сверки (раунд 4, проверяющий r4-V-zakon-prov): копия модуля и теста, по одной откатанной части правки.
// node mutanty-moi.mjs [имена...] — без имён все. Итог — itog-mutantov.txt.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ZDES = dirname(fileURLToPath(import.meta.url));
const REPO = 'D:/SEO/cloud/site-generator';
const SAYT = `${REPO}/sites/7thserpent.com`;
const SCR = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad';
const ZAPUSK = `${SCR}/testy.mjs`;
const DIST = `${SCR}/ref/dist-7th-3b78f28`;

export const perepisatModul = (s) => {
  const a = "import { parse as yamlParse } from 'yaml';";
  const b = "from '@factory/core/text/html.mjs'";
  if (!s.includes(a) || !s.includes(b)) throw new Error('импорты модуля не найдены');
  return s
    .replace(a, `import { createRequire } from 'node:module';\nconst yamlParse = createRequire('${SAYT}/package.json')('yaml').parse;`)
    .replace(b, `from 'file:///${REPO}/core/text/html.mjs'`);
};
const modul = perepisatModul(readFileSync(`${SAYT}/tools/sverka.mjs`, 'utf8'));
const test = readFileSync(`${SAYT}/tools/testy/sverka.test.mjs`, 'utf8').replace("from './obshchee.mjs'", `from 'file:///${SAYT}/tools/testy/obshchee.mjs'`);

const zamenit = (s, iz, na) => {
  const n = s.split(iz).length - 1;
  if (n !== 1) throw new Error(`мутант: образец встречается ${n} раз — «${iz.slice(0, 70)}»`);
  return s.replace(iz, () => na);
};
const SPISOK = '[chasti(doc).html, chasti(doc).body, main, ...vMain(() => true)]';
const ZAG = "imya(zag) !== 'h2' || !est(zag, 'link-list__title') || !est(zag, 't-headline')";

const M = {
  kontrol: (m) => m,
  // Положительный контроль стенда: откат, который тест обязан поймать (V3-5), — стенд судит копию, а не модуль репозитория.
  'bez-rebenka': (m) => zamenit(m, 'if (sek.parentNode !== main)', 'if (0)'),
  'bez-main': (m) => zamenit(m, SPISOK, '[chasti(doc).html, chasti(doc).body, ...vMain(() => true)]'),
  'bez-html': (m) => zamenit(m, SPISOK, '[chasti(doc).body, main, ...vMain(() => true)]'),
  'bez-body': (m) => zamenit(m, SPISOK, '[chasti(doc).html, main, ...vMain(() => true)]'),
  'bez-prochih': (m) => zamenit(m, SPISOK, '[chasti(doc).html, chasti(doc).body, main]'),
  'bez-link': (m) => zamenit(m, "imya(u) === 'style' || (imya(u) === 'link' && (atr(u, 'rel') ?? '').toLowerCase().split(/\\s+/).includes('stylesheet'))", "imya(u) === 'style'"),
  'bez-registra': (m) => zamenit(m, "#,]*)/gi;", "#,]*)/g;"),
  'bez-kosoy': (m) => zamenit(m, "s.replace(/\\\\/g, '/').matchAll(ASTRO)", 's.matchAll(ASTRO)'),
  'bez-aria': (m) => zamenit(m, "if (atr(sek, 'aria-labelledby') !== 'related-title')", 'if (0)'),
  'bez-h2': (m) => zamenit(m, ZAG, "!est(zag, 'link-list__title') || !est(zag, 't-headline')"),
  'bez-klassa': (m) => zamenit(m, ZAG, "imya(zag) !== 'h2' || !est(zag, 't-headline')"),
  'bez-headline': (m) => zamenit(m, ZAG, "imya(zag) !== 'h2' || !est(zag, 'link-list__title')"),
  'vse-svg': (m) => zamenit(m, " && !predki(u).some((p) => imya(p) === 'svg'));", ');'),
  'bez-teksta-ikony': (m) => zamenit(m, '.sort(), tekstDetey(u).trim()]', '.sort()]'),
  'bez-pamyati': (m) => zamenit(m, 'if (proydeno.has(nastoyashchiy)) return;', ';'),
};

const imena = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(M);
const itog = [];
for (const imya of imena) {
  const p = join(ZDES, 'mut', imya);
  mkdirSync(join(p, 'testy'), { recursive: true });
  writeFileSync(join(p, 'sverka.mjs'), M[imya](modul));
  writeFileSync(join(p, 'testy', 'sverka.test.mjs'), test);
  const r = spawnSync(process.execPath, [ZAPUSK, DIST, join(p, 'testy', 'sverka.test.mjs')], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  const v = (r.stdout ?? '') + (r.stderr ?? '');
  writeFileSync(join(p, 'vyvod.txt'), v);
  const chislo = (k) => (v.match(new RegExp(`ℹ ${k} (\\d+)`)) || [])[1];
  const krasnye = [...new Set([...v.matchAll(/^\s*✖ (.+?) \(\d/gm)].map((x) => x[1]))];
  itog.push(`${imya}: код ${r.status}, pass ${chislo('pass')}, fail ${chislo('fail')}, todo ${chislo('todo')}${krasnye.length ? ' — красные: ' + krasnye.join(' | ') : ''}`);
  console.log(itog.at(-1));
}
writeFileSync(join(ZDES, 'itog-mutantov.txt'), itog.join('\n') + '\n');
