// Раунд 4, блок Б, линза «класс или случай»: B3-8 — сравнение копий в B1-G-12 (sborka.test.mjs) группами CSS.
// Сравнение ниже — дословная копия строк 46–56 и 62–73, 87–94 sborka.test.mjs (сам тест собирает копию — не запускается).
// Две сборки из настоящих страниц и CSS: в B страницы /pc/ и /quotes/ обменялись таблицами стилей.
import { mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/r4-B-klass/gruppa';
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
function sravnit(a, b) {
  const ga = gruppy(faily(a));
  const gb = gruppy(faily(b));
  const klyuchi = JSON.stringify([...gb.keys()].sort()) === JSON.stringify([...ga.keys()].sort());
  const soderzhimoe = (koren, fajly) =>
    fajly.map((f) => (/\.(css|html)$/.test(f) ? bezCid(readFileSync(join(koren, f), 'utf8')) : readFileSync(join(koren, f)).toString('base64'))).sort();
  const raznye = [...ga].filter(([klyuch, fajly]) => JSON.stringify(soderzhimoe(a, fajly)) !== JSON.stringify(soderzhimoe(b, gb.get(klyuch))));
  return { klyuchi, raznye: raznye.map(([k]) => k) };
}

rmSync(PAPKA, { recursive: true, force: true });
const CSS = 'CtaBand.BMbqpUCi.css';
const css1 = readFileSync(join(DIST, '_astro', CSS), 'utf8');
const css2 = css1 + '\n.pc-only{color:red}';
const stranica = (url) => readFileSync(join(DIST, url, 'index.html'), 'utf8');
const sborka = (imya, hesh1, hesh2, naPc, naQuotes) => {
  const d = join(PAPKA, imya);
  mkdirSync(join(d, '_astro'), { recursive: true });
  writeFileSync(join(d, '_astro', `CtaBand.${hesh1}.css`), css1);
  writeFileSync(join(d, '_astro', `CtaBand.${hesh2}.css`), css2);
  for (const [url, hesh] of [['pc', naPc], ['quotes', naQuotes]]) {
    const h = stranica(url);
    if (!h.includes(`/_astro/${CSS}`)) throw new Error(`порча не применилась: ${url}`);
    mkdirSync(join(d, url), { recursive: true });
    writeFileSync(join(d, url, 'index.html'), h.split(`/_astro/${CSS}`).join(`/_astro/CtaBand.${hesh}.css`));
  }
  return d;
};
// A: /pc/ — стиль с .pc-only, /quotes/ — без; B: наоборот (и хеши другие, как у копии с ядром-копией).
const a = sborka('a', 'AAAA1111', 'BBBB2222', 'BBBB2222', 'AAAA1111');
const b = sborka('b', 'CCCC3333', 'DDDD4444', 'CCCC3333', 'DDDD4444');
console.log('обмен стилями страниц /pc/ и /quotes/:', JSON.stringify(sravnit(a, b)));
const c = sborka('c', 'CCCC3333', 'DDDD4444', 'DDDD4444', 'CCCC3333');
console.log('контроль, те же страницы с теми же стилями:', JSON.stringify(sravnit(a, c)));
const e = sborka('e', 'CCCC3333', 'DDDD4444', 'DDDD4444', 'DDDD4444');
console.log('порча 2: /quotes/ перешла на стиль /pc/ (второй файл группы никем не подключён):', JSON.stringify(sravnit(a, e)));
const f = sborka('f', 'CCCC3333', 'DDDD4444', 'DDDD4444', 'CCCC3333');
writeFileSync(join(f, '_astro', 'CtaBand.DDDD4444.css'), css1 + '\n.pc-only{color:blue}');
console.log('контроль чувствительности: содержимое CSS другое:', JSON.stringify(sravnit(a, f)));

// Сторожит ли тест B3-8 правку B3-8: мутация — сравнение снова по первому файлу группы (как прежний Map по ключу).
function sravnitMut(a, b) {
  const ga = gruppy(faily(a));
  const gb = gruppy(faily(b));
  const soderzhimoe = (koren, fajly) => fajly.slice(0, 1).map((x) => bezCid(readFileSync(join(koren, x), 'utf8')));
  return [...ga].filter(([k, fajly]) => JSON.stringify(soderzhimoe(a, fajly)) !== JSON.stringify(soderzhimoe(b, gb.get(k)))).map(([k]) => k);
}
console.log('мутация (первый файл группы), содержимое второго CSS другое:', JSON.stringify(sravnitMut(a, f)));
// Тело теста B3-8 (sborka.test.mjs:75–78) — зовёт только gruppy, мутация сравнения его не трогает.
const fB38 = ['_astro/index.AAAA1111.css', '_astro/index.BBBB2222.css'];
console.log('тест B3-8 при мутации:', gruppy(fB38).get('_astro/index.css').length === fB38.length ? 'зелёный' : 'красный');
