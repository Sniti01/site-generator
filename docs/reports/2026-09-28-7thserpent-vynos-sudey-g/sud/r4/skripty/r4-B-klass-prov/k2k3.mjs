// R4-B-K-2, R4-B-K-3: сравнение B1-G-12 (sborka.test.mjs, ec74257) — дословно, в функции; синтетические сборки.
import { mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, cpSync } from 'node:fs';
import { join, relative } from 'node:path';
import assert from 'node:assert/strict';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/r4-B-klass-prov/sborki';
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';

function faily(koren) {
  const out = [];
  const obhod = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) obhod(join(d, e.name));
      else out.push(relative(koren, join(d, e.name)).replace(/\\/g, '/'));
    }
  };
  obhod(koren);
  return out.sort();
}
const bezCid = (s) => s.replace(/data-astro-cid-[a-z0-9]+/g, 'data-astro-cid-X').replace(/(\/_astro\/[A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+\.css/g, '$1.css');
const imyaBezHesha = (f) => (f.endsWith('.css') ? f.replace(/^(_astro\/[A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+\.css$/, '$1.css') : f);
function gruppy(spisok) {
  const g = new Map();
  for (const f of spisok) {
    const k = imyaBezHesha(f);
    if (!g.has(k)) g.set(k, []);
    g.get(k).push(f);
  }
  return g;
}
// Тело posle из B1-G-12; mut — мутация «первый файл группы».
function sravnit(a, b, mut = false) {
  const ga = gruppy(faily(a));
  const gb = gruppy(faily(b));
  const klyuchi = JSON.stringify([...gb.keys()].sort()) === JSON.stringify([...ga.keys()].sort());
  const soderzhimoe = (koren, fajly0) => {
    const fajly = mut ? fajly0.slice(0, 1) : fajly0;
    return fajly.map((f) => (/\.(css|html)$/.test(f) ? bezCid(readFileSync(join(koren, f), 'utf8')) : readFileSync(join(koren, f)).toString('base64'))).sort();
  };
  const raznye = [...ga].filter(([klyuch, fajly]) => JSON.stringify(soderzhimoe(a, fajly)) !== JSON.stringify(soderzhimoe(b, gb.get(klyuch))));
  return { klyuchi, raznye: raznye.map(([k]) => k) };
}

rmSync(PAPKA, { recursive: true, force: true });
const sborka = (imya, css, stranicy) => {
  const d = join(PAPKA, imya);
  mkdirSync(join(d, '_astro'), { recursive: true });
  for (const [f, t] of Object.entries(css)) writeFileSync(join(d, '_astro', f), t);
  for (const [p, href] of Object.entries(stranicy)) {
    mkdirSync(join(d, p), { recursive: true });
    writeFileSync(join(d, p, 'index.html'), `<html><head><link rel="stylesheet" href="${href}"></head><body><main>${p}</main></body></html>`);
  }
  return d;
};
const CSS = { 'Layout.AAAA1111.css': '.a{color:red}', 'Layout.BBBB2222.css': '.b{color:blue}' };
const CSS2 = { 'Layout.CCCC3333.css': '.a{color:red}', 'Layout.DDDD4444.css': '.b{color:blue}' }; // другие хеши (как у ядра-копии), то же содержимое
const a = sborka('a', CSS, { p1: '/_astro/Layout.AAAA1111.css', p2: '/_astro/Layout.BBBB2222.css' });
const bRovno = sborka('b-rovno', CSS2, { p1: '/_astro/Layout.CCCC3333.css', p2: '/_astro/Layout.DDDD4444.css' });
const bObmen = sborka('b-obmen', CSS2, { p1: '/_astro/Layout.DDDD4444.css', p2: '/_astro/Layout.CCCC3333.css' });
const bOdin = sborka('b-odin', CSS2, { p1: '/_astro/Layout.CCCC3333.css', p2: '/_astro/Layout.CCCC3333.css' });
const bVtoroyDrugoy = sborka('b-vtoroy', { 'Layout.CCCC3333.css': '.a{color:red}', 'Layout.DDDD4444.css': '.b{color:green}' }, { p1: '/_astro/Layout.CCCC3333.css', p2: '/_astro/Layout.DDDD4444.css' });

console.log('K-2 контроль (другие хеши, та же связь):', JSON.stringify(sravnit(a, bRovno)));
console.log('K-2 обмен CSS страниц p1 и p2:', JSON.stringify(sravnit(a, bObmen)));
console.log('K-2 обе страницы на первый CSS группы (второй лежит без ссылок):', JSON.stringify(sravnit(a, bOdin)));
console.log('K-3 второй CSS группы другой — исходное:', JSON.stringify(sravnit(a, bVtoroyDrugoy)));
console.log('K-3 второй CSS группы другой — мутация slice(0,1):', JSON.stringify(sravnit(a, bVtoroyDrugoy, true)));
// Тело теста B3-8 (дословно) — от сравнения не зависит.
try {
  const f = ['_astro/index.AAAA1111.css', '_astro/index.BBBB2222.css'];
  assert.equal(gruppy(f).get('_astro/index.css').length, f.length);
  console.log('K-3 тело теста B3-8: зелёное (мутация в сравнении его не касается)');
} catch (e) {
  console.log('K-3 тело теста B3-8: красное', e.message);
}
// Настоящая сборка: размеры групп.
const razmery = [...gruppy(faily(DIST))].filter(([, v]) => v.length > 1).map(([k, v]) => `${k}:${v.length}`);
console.log('групп CSS с 2+ файлами в dist-7th-3b78f28:', JSON.stringify(razmery));
// Настоящая сборка: копия с порчей второго по счёту CtaBand невозможна — файл один; порча единственного ловится обоими вариантами.
const c = join(PAPKA, 'dist-kopiya');
cpSync(DIST, c, { recursive: true });
const cta = join(c, '_astro', 'CtaBand.BMbqpUCi.css');
writeFileSync(cta, readFileSync(cta, 'utf8') + '\n.x{}');
console.log('настоящая сборка, порча CtaBand — исходное:', JSON.stringify(sravnit(DIST, c)), '; мутация:', JSON.stringify(sravnit(DIST, c, true)));
