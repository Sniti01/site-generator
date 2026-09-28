// Мутанты сверки раунда 3: копия модуля и теста в своей папке, по одной откатанной правке на мутанта.
// Запуск: node mutanty.mjs [имя мутанта ...] — без имён все; для каждого — прогон теста через testy.mjs.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ZDES = dirname(fileURLToPath(import.meta.url));
const REPO = 'D:/SEO/cloud/site-generator';
const SAYT = `${REPO}/sites/7thserpent.com`;
const TESTY = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/testy.mjs';
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';

const modul0 = readFileSync(`${SAYT}/tools/sverka.mjs`, 'utf8')
  .replace("import { parse as yamlParse } from 'yaml';", `import { createRequire } from 'node:module';\nconst yamlParse = createRequire('${SAYT}/package.json')('yaml').parse;`)
  .replace("from '@factory/core/text/html.mjs'", `from 'file:///${REPO}/core/text/html.mjs'`);
const test0 = readFileSync(`${SAYT}/tools/testy/sverka.test.mjs`, 'utf8').replace("from './obshchee.mjs'", `from 'file:///${SAYT}/tools/testy/obshchee.mjs'`);

const zam = (s, iz, na) => {
  if (!s.includes(iz)) throw new Error(`мутант не применился: нет «${iz.slice(0, 80)}»`);
  return s.replace(iz, na);
};

const STARYY_OBHOD = `  const obhodDist = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory() && e.name !== '_astro') obhodDist(join(d, e.name));
      else if (e.name === 'index.html') {
        const rel = relative(dist, d).split(sep).join('/');
        const url = rel ? \`/\${rel}/\` : '/';`;
const NOVYY_OBHOD = `  const obhodDist = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) obhodDist(join(d, e.name));
      else if (e.name.toLowerCase().endsWith('.html')) {
        const rel = relative(dist, join(d, e.name)).split(sep).join('/');
        const url = e.name === 'index.html' ? \`/\${rel.slice(0, -'index.html'.length)}\` : \`/\${rel}\`;`;

const MUTANTY = {
  kontrol: (m) => m,
  'V3-1-koren': (m) => zam(m, 'const korenChuzhoy = svg && koren !== KOREN_IKONKI;', "const korenChuzhoy = svg && (atr(svg, 'transform') !== undefined || atr(svg, 'style') !== undefined);"),
  'V3-2-stil': (m) =>
    zam(
      m,
      "if (atr(obertka, 'style') !== zhdemStil)",
      "const obv = String(atr(obertka, 'style') ?? '').split(';').map((d) => d.split(':')).filter((p) => p.length >= 2).map(([a, ...z]) => [a.trim(), z.join(':').trim()]); const fokus = obv.filter(([a]) => a === '--fokus').at(-1)?.[1]; if (zhdemStil === zhdemStil && (fokus ?? null) !== (dane.artFocus ?? null))"
    ),
  'V3-3-vnutri': (m) => zam(m, "const vnutri = elementy(obertka).filter((u) => atr(u, 'style') !== undefined);", "const vnutri = elementy(obertka).filter((u) => /--fokus|object-position/.test(atr(u, 'style') ?? ''));"),
  'V3-3-html': (m) => zam(m, '[chasti(doc).html, chasti(doc).body, main, ...vMain(() => true)]', '[chasti(doc).body, main, ...vMain(() => true)]'),
  'V3-3-body': (m) => zam(m, '[chasti(doc).html, chasti(doc).body, main, ...vMain(() => true)]', '[chasti(doc).html, main, ...vMain(() => true)]'),
  'V3-3-main': (m) => zam(m, '[chasti(doc).html, chasti(doc).body, main, ...vMain(() => true)]', '[chasti(doc).html, chasti(doc).body, ...vMain(() => true)]'),
  'V3-3-prochie': (m) => zam(m, '[chasti(doc).html, chasti(doc).body, main, ...vMain(() => true)]', '[chasti(doc).html, chasti(doc).body, main]'),
  'V3-3-link': (m) => zam(m, "imya(u) === 'style' || (imya(u) === 'link' && (atr(u, 'rel') ?? '').toLowerCase().split(/\\s+/).includes('stylesheet'))", "imya(u) === 'style'"),
  'V3-3-style': (m) => zam(m, "imya(u) === 'style' || (imya(u) === 'link'", "(imya(u) === 'link'"),
  'V3-4-procenty': (m) => zam(m, 's = decodeURIComponent(s);', 's = s;'),
  'V3-4-registr': (m) => zam(m, "#,]*)/gi;", "#,]*)/g;"),
  'V3-4-tochka': (m) => zam(m, 'const ASTRO = /_astro((?:\\/\\.?)+)', 'const ASTRO = /_astro(\\/)'),
  'V3-4-sam-main': (m) => zam(m, 'for (const u of [main, ...vMain(() => true)])', 'for (const u of vMain(() => true))'),
  'V3-4-kosaya': (m) => zam(m, "s.replace(/\\\\/g, '/').matchAll(ASTRO)", 's.matchAll(ASTRO)'),
  'V3-5-rebenok': (m) => zam(m, 'if (sek.parentNode !== main)', 'if (false)'),
  'V3-6-aria': (m) => zam(m, "if (atr(sek, 'aria-labelledby') !== 'related-title')", 'if (false)'),
  'V3-6-h2': (m) => zam(m, "if (!zag || imya(zag) !== 'h2' || !est(zag, 'link-list__title')", "if (!zag || !est(zag, 'link-list__title')"),
  'V3-6-klass': (m) => zam(m, "imya(zag) !== 'h2' || !est(zag, 'link-list__title') || !est(zag, 't-headline')", "imya(zag) !== 'h2' || !est(zag, 't-headline')"),
  'V3-6-headline': (m) => zam(m, "imya(zag) !== 'h2' || !est(zag, 'link-list__title') || !est(zag, 't-headline')", "imya(zag) !== 'h2' || !est(zag, 'link-list__title')"),
  'V3-7-obhod': (m) => zam(m, NOVYY_OBHOD, STARYY_OBHOD),
  'V3-8-nadpis-geroy': (m) => zam(m, 'if (nadpis(kn[0]) !== norm(dane[pole]?.label))', 'if (txt(kn[0]) !== norm(dane[pole]?.label))'),
  'V3-8-nadpis-cta': (m) => zam(m, 'if (nadpis(kn[0]) !== norm(dane.cta?.label))', 'if (txt(kn[0]) !== norm(dane.cta?.label))'),
  'V3-8-vlozhennye': (m) => zam(m, "const svgi = elementy(kn[0], (u) => imya(u) === 'svg' && !predki(u).some((p) => imya(p) === 'svg'));", "const svgi = elementy(kn[0], (u) => imya(u) === 'svg');"),
  'V3-8-tekst-ikony': (m) => zam(m, ".sort(), tekstDetey(u).trim()]))", ".sort()]))"),
  'V3-9-games': (m) => zam(m, '.match(/Games:/g)', '.match(/Games: /g)'),
  'V3-9-license': (m) => zam(m, '.match(/License class:/g)', '.match(/License class: /g)'),
  'V3-10-bitaya': (m) => zam(m, `      let papka = x.isDirectory();
      if (x.isSymbolicLink()) {
        try {
          papka = statSync(p).isDirectory();
        } catch {
          continue;
        }
      }`, '      const papka = x.isDirectory() || (x.isSymbolicLink() && statSync(p).isDirectory());'),
  'V3-10-petlya': (m) => zam(m, 'if (proydeno.has(nastoyashchiy)) return;', ''),
};

const imena = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(MUTANTY);
const itog = [];
for (const imya of imena) {
  const papka = join(ZDES, 'mut', imya);
  mkdirSync(join(papka, 'testy'), { recursive: true });
  writeFileSync(join(papka, 'sverka.mjs'), MUTANTY[imya](modul0));
  writeFileSync(join(papka, 'testy', 'sverka.test.mjs'), test0);
  const r = spawnSync(process.execPath, [TESTY, DIST, join(papka, 'testy', 'sverka.test.mjs')], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const vyvod = (r.stdout ?? '') + (r.stderr ?? '');
  writeFileSync(join(papka, 'vyvod.txt'), vyvod);
  const chislo = (k) => (vyvod.match(new RegExp(`ℹ ${k} (\\d+)`)) || [])[1];
  const krasnye = [...vyvod.matchAll(/^\s*✖ (.+?) \(\d/gm)].map((x) => x[1]).filter((x, i, a) => a.indexOf(x) === i);
  itog.push(`${imya}: код ${r.status}, pass ${chislo('pass')}, fail ${chislo('fail')}, todo ${chislo('todo')}${krasnye.length ? ' — красные: ' + krasnye.join(' | ') : ''}`);
  console.log(itog.at(-1));
}
writeFileSync(join(ZDES, 'mutanty-itog.txt'), itog.join('\n') + '\n');
