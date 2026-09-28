// Мутанты находок «тест не сторожит» (R4-V-Z-2…7): копия модуля и теста сверки в mutacii/<номер>/<вариант>/, в копии
// модуля откатана сторожимая строка; прогон копии теста через testy.mjs по шаблону номера. Вывод всех вариантов номера —
// в krasnye/<номер>.txt, первой строкой — какие мутации.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const S = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad';
const REPO = 'D:/SEO/cloud/site-generator';
const SAYT = `${REPO}/sites/7thserpent.com`;
const zam = (s, iz, na) => {
  if (!s.includes(iz)) throw new Error(`мутант не применился: нет «${iz.slice(0, 80)}»`);
  return s.replace(iz, na);
};
const modul0 = zam(
  zam(readFileSync(`${SAYT}/tools/sverka.mjs`, 'utf8'), "import { parse as yamlParse } from 'yaml';", `import { createRequire } from 'node:module';\nconst yamlParse = createRequire('${SAYT}/package.json')('yaml').parse;`),
  "from '@factory/core/text/html.mjs'",
  `from 'file:///${REPO}/core/text/html.mjs'`
);
const test0 = zam(readFileSync(`${SAYT}/tools/testy/sverka.test.mjs`, 'utf8'), "from './obshchee.mjs'", `from 'file:///${SAYT}/tools/testy/obshchee.mjs'`);

const MUTANTY = {
  'R4-V-Z-2': {
    'без-html': ['style у <html> не судится', (m) => zam(m, 'const chuzhieStili = [chasti(doc).html, chasti(doc).body, main,', 'const chuzhieStili = [chasti(doc).body, main,')],
    'без-body': ['style у <body> не судится', (m) => zam(m, 'const chuzhieStili = [chasti(doc).html, chasti(doc).body, main,', 'const chuzhieStili = [chasti(doc).html, main,')],
    'bez-prochih': ['style у прочих элементов <main> не судится', (m) => zam(m, 'const chuzhieStili = [chasti(doc).html, chasti(doc).body, main, ...vMain(() => true)]', 'const chuzhieStili = [chasti(doc).html, chasti(doc).body, main]')],
    'bez-link': ['<link rel=stylesheet> в <main> не судится', (m) => zam(m, 'const listyStiley = vMain(listStiley);', "const listyStiley = vMain((u) => imya(u) === 'style');")],
  },
  'R4-V-Z-3': {
    'bez-i': ['ASTRO без флага i', (m) => zam(m, 'const ASTRO = /_astro((?:\\/\\.?)+)([^"\'\\s)?#,]*)/gi;', 'const ASTRO = /_astro((?:\\/\\.?)+)([^"\'\\s)?#,]*)/g;')],
    'bez-kosoy': ['без замены обратной косой на прямую', (m) => zam(m, "for (const m of s.replace(/\\\\/g, '/').matchAll(ASTRO))", 'for (const m of s.matchAll(ASTRO))')],
  },
  'R4-V-Z-4': {
    'bez-aria': ['проверка aria-labelledby «связанных» снята', (m) => zam(m, "if (atr(sek, 'aria-labelledby') !== 'related-title') zam.push(`aria-labelledby «связанных»", "if (false) zam.push(`aria-labelledby «связанных»")],
    'bez-h2': ['имя h2 заголовка «связанных» не судится', (m) => zam(m, "if (!zag || imya(zag) !== 'h2' || !est(zag, 'link-list__title')", "if (!zag || !est(zag, 'link-list__title')")],
    'bez-title': ['класс link-list__title не судится', (m) => zam(m, "imya(zag) !== 'h2' || !est(zag, 'link-list__title') || !est(zag, 't-headline')", "imya(zag) !== 'h2' || !est(zag, 't-headline')")],
    'bez-headline': ['класс t-headline не судится', (m) => zam(m, "imya(zag) !== 'h2' || !est(zag, 'link-list__title') || !est(zag, 't-headline')", "imya(zag) !== 'h2' || !est(zag, 'link-list__title')")],
  },
  'R4-V-Z-5': {
    'vse-svg': ['в счёт все svg, и вложенные', (m) => zam(m, "const svgi = elementy(kn, (u) => imya(u) === 'svg' && !predki(u).some((p) => imya(p) === 'svg'));", "const svgi = elementy(kn, (u) => imya(u) === 'svg');")],
  },
  'R4-V-Z-6': {
    'bez-teksta': ['подпись иконки без текста элементов', (m) => zam(m, '.sort(), tekstDetey(u).trim()]', '.sort()]')],
  },
  'R4-V-Z-7': {
    'bez-pamyati': ['память пройденных папок снята', (m) => zam(m, 'if (proydeno.has(nastoyashchiy)) return;', '')],
  },
};

const nomera = process.argv.slice(2);
mkdirSync(`${S}/r4/krasnye`, { recursive: true });
for (const n of nomera.length ? nomera : Object.keys(MUTANTY)) {
  const chasti = [];
  for (const [v, [opis, f]] of Object.entries(MUTANTY[n])) {
    const d = `${S}/r4/mutacii/${n}/${v}`;
    mkdirSync(`${d}/testy`, { recursive: true });
    writeFileSync(`${d}/sverka.mjs`, f(modul0));
    writeFileSync(`${d}/testy/sverka.test.mjs`, test0);
    const r = spawnSync(process.execPath, [`${S}/testy.mjs`, `${S}/ref/dist-7th-3b78f28`, `${d}/testy/sverka.test.mjs`, `--test-name-pattern=^${n} `], { encoding: 'utf8' });
    const vyvod = (r.stdout ?? '') + (r.stderr ?? '');
    const itog = (k) => (vyvod.match(new RegExp(`ℹ ${k} (\\d+)`)) || [])[1];
    const stroka = `${v} (${opis}): код ${r.status}, tests ${itog('tests')}, pass ${itog('pass')}, fail ${itog('fail')}`;
    console.log(`${n} ${stroka}`);
    chasti.push({ opis: `${v} — ${opis}`, stroka, vyvod });
  }
  writeFileSync(
    `${S}/r4/krasnye/${n}.txt`,
    `мутация: ${chasti.map((c) => c.opis).join('; ')} (копия модуля — mutacii/${n}/<вариант>/sverka.mjs)\n` + chasti.map((c) => `\n===== ${c.stroka}\n${c.vyvod}`).join('')
  );
}
