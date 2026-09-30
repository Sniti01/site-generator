// Мутанты сторожа (судья судьи): ослабляем новые места П113 и смотрим, ловят ли это 149 проб копии.
// Мутант пишется НОВЫМ файлом рядом со сторожем копии (tools/mutant-sv25o-<id>.mjs), пробы — копией файла проб с
// импортом мутанта (tools/testy/mutant-sv25o-<id>.test.mjs); после прогона удаляются только эти два обычных файла.
// Оригиналы копии не меняются. Мутанты образца FAJL_GOOGLE валит и договор workflow (-x = FAJL_GOOGLE.source) —
// поэтому для каждого печатаются упавшие пробы: видно, ловит ли мутанта поведение или только договор.
import { readFileSync, writeFileSync, existsSync, lstatSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { SAYT, vyvod } from './obshchee-o.mjs';

const STOROZH = readFileSync(join(SAYT, 'tools/storozha-vykladki.mjs'), 'utf8');
const PROBY = readFileSync(join(SAYT, 'tools/testy/storozha-vykladki.test.mjs'), 'utf8');
const PODTV = "[`google-site-verification: ${imya}`, `google-site-verification: ${imya}\\n`, `google-site-verification: ${imya}\\r\\n`].includes(tekst)";
const FAJL = 'export const FAJL_GOOGLE = /^google[0-9A-Za-z]+\\.html$/;';
const MUTANTY = [
  ['M1', 'строка подтверждения — подстрокой (includes)', PODTV, 'tekst.includes(`google-site-verification: ${imya}`)'],
  ['M2', 'строка подтверждения — после trim()', PODTV, 'tekst.trim() === `google-site-verification: ${imya}`'],
  ['M3', 'имя внутри не сверяется (любое имя образца)', PODTV, '/^google-site-verification: google[0-9A-Za-z]+\\.html(\\r?\\n)?$/.test(tekst)'],
  ['M4', 'BOM в начале прощается', PODTV, PODTV.replace('.includes(tekst)', ".includes(tekst.replace(/^\\ufeff/, ''))")],
  ['M5', 'концы строки: ещё CR и два LF', PODTV, PODTV.replace("].includes", ", `google-site-verification: ${imya}\\r`, `google-site-verification: ${imya}\\n\\n`].includes")],
  ['M6', 'образец без ^', FAJL, 'export const FAJL_GOOGLE = /google[0-9A-Za-z]+\\.html$/;'],
  ['M7', 'образец без $', FAJL, 'export const FAJL_GOOGLE = /^google[0-9A-Za-z]+\\.html/;'],
  ['M8', 'образец: * вместо +', FAJL, 'export const FAJL_GOOGLE = /^google[0-9A-Za-z]*\\.html$/;'],
  ['M9', 'образец без учёта регистра', FAJL, 'export const FAJL_GOOGLE = /^google[0-9A-Za-z]+\\.html$/i;'],
  ['M10', 'образец: ещё «-» и «_»', FAJL, 'export const FAJL_GOOGLE = /^google[0-9A-Za-z_-]+\\.html$/;'],
  ['M11', 'образец: ещё «.»', FAJL, 'export const FAJL_GOOGLE = /^google[0-9A-Za-z.]+\\.html$/;'],
  ['M12', 'файл Google в сборке не судится', 'const googleVSborke = verkh.filter((n) => FAJL_GOOGLE.test(n));', 'const googleVSborke = [];'],
  ['M13', 'копия не сверяется вовсе', 'const nesvereny = google.filter((n) => !podtverzhdenieGoogle(n, skachan(n)));', 'const nesvereny = [];'],
  ['M14', 'рядом с нашей выкладкой копия не сверяется', 'if (nesvereny.length) {', 'if (nesvereny.length && !nashIndex(indexHtml)) {'],
  ['M15', 'пересчёт не считает файл Google и глубже корня', '&& !FAJL_GOOGLE.test(f);\n  const google', '&& !/google[0-9A-Za-z]+\\.html$/.test(f);\n  const google'],
];

const stroki = [];
for (const [id, chto, iz, na] of MUTANTY) {
  if (!STOROZH.includes(iz)) throw new Error(`${id}: образец замены не найден в стороже`);
  const imyaS = `mutant-sv25o-${id}.mjs`;
  const putS = join(SAYT, 'tools', imyaS);
  const putP = join(SAYT, 'tools/testy', `mutant-sv25o-${id}.test.mjs`);
  for (const p of [putS, putP]) if (existsSync(p)) throw new Error(`уже есть ${p}`);
  const prob = PROBY.replace("import * as SV from '../storozha-vykladki.mjs';", `import * as SV from '../${imyaS}';`).replace("const STOROZH = join(SAYT, 'tools/storozha-vykladki.mjs');", `const STOROZH = join(SAYT, 'tools/${imyaS}');`);
  if (prob === PROBY || !prob.includes(imyaS)) throw new Error(`${id}: пробы не переведены на мутанта`);
  writeFileSync(putS, STOROZH.replace(iz, na));
  writeFileSync(putP, prob);
  let r;
  try {
    r = spawnSync(process.execPath, ['--test', putP], { encoding: 'utf8', cwd: SAYT, timeout: 300000 });
  } finally {
    for (const p of [putS, putP]) {
      const st = lstatSync(p);
      if (st.isFile() && !st.isSymbolicLink()) unlinkSync(p);
    }
  }
  const vse = `${r.stdout}\n${r.stderr}`;
  const chislo = (k) => Number((new RegExp(`^ℹ ${k} (\\d+)`, 'm').exec(vse) ?? [])[1]);
  const upali = [...new Set(vse.split('\n').filter((s) => /^\s*✖ /.test(s)).map((s) => s.replace(/^\s*✖ /, '').replace(/ \([\d.]+m?s\)$/, '').trim()))].filter((s) => !/^failing tests/.test(s));
  const tolkoDogovor = upali.length > 0 && upali.every((s) => /workflow/.test(s));
  stroki.push(`${id} ${chto}: проб ${chislo('tests')}, упало ${chislo('fail')} — ${chislo('fail') > 0 ? (tolkoDogovor ? 'УБИТ ТОЛЬКО ДОГОВОРОМ WORKFLOW' : 'убит') : 'ВЫЖИЛ'}`);
  for (const s of upali.slice(0, 4)) stroki.push(`    ✖ ${s}`);
}
const ostalos = MUTANTY.flatMap(([id]) => [join(SAYT, 'tools', `mutant-sv25o-${id}.mjs`), join(SAYT, 'tools/testy', `mutant-sv25o-${id}.test.mjs`)]).filter(existsSync);
stroki.push(`файлов мутантов в копии после прогона: ${ostalos.length}`);
vyvod('mutanty.txt', stroki);
