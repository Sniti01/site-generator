// Раунд 4, блок Б: B3-8 — сторожит ли тест «B3-8» сравнение копий B1-G-12, и что сравнение группой не видит.
// Помощники — дословно из sites/7thserpent.com/tools/testy/sborka.test.mjs (нынешний, строки 46–73 и 91–93);
// «прежнее» сравнение — дословно из ec74257^ (Map по имени без хеша). Сборок нет: две поддельные папки dist.
// node b3-8.mjs
import { readFileSync, readdirSync, mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ZDES = dirname(fileURLToPath(import.meta.url));
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
// Тест «B3-8» — дословно.
const testB38 = () => {
  const f = ['_astro/index.AAAA1111.css', '_astro/index.BBBB2222.css'];
  return gruppy(f).get('_astro/index.css').length === f.length;
};
// Нынешнее сравнение B1-G-12 (строки 87–94): список различающихся групп.
function nyneshnee(a, b) {
  const ga = gruppy(faily(a));
  const gb = gruppy(faily(b));
  if (JSON.stringify([...gb.keys()].sort()) !== JSON.stringify([...ga.keys()].sort())) return ['<ключи>'];
  const soderzhimoe = (koren, fajly) => fajly.map((f) => (/\.(css|html)$/.test(f) ? bezCid(readFileSync(join(koren, f), 'utf8')) : readFileSync(join(koren, f)).toString('base64'))).sort();
  return [...ga].filter(([klyuch, fajly]) => JSON.stringify(soderzhimoe(a, fajly)) !== JSON.stringify(soderzhimoe(b, gb.get(klyuch)))).map(([k]) => k);
}
// Прежнее сравнение (ec74257^, sborka.test.mjs B1-G-12).
function prezhnee(a, b) {
  const fa = new Map(faily(a).map((f) => [imyaBezHesha(f), f]));
  const fb = new Map(faily(b).map((f) => [imyaBezHesha(f), f]));
  if (JSON.stringify([...fb.keys()]) !== JSON.stringify([...fa.keys()])) return ['<ключи>'];
  return [...fa]
    .filter(([klyuch, f]) => {
      const x = readFileSync(join(a, f));
      const y = readFileSync(join(b, fb.get(klyuch)));
      return /\.(css|html)$/.test(f) ? bezCid(x.toString('utf8')) !== bezCid(y.toString('utf8')) : !x.equals(y);
    })
    .map(([k]) => k);
}
function dist(fajly) {
  const d = mkdtempSync(join(ZDES, 'dist-'));
  for (const [f, t] of Object.entries(fajly)) {
    mkdirSync(dirname(join(d, f)), { recursive: true });
    writeFileSync(join(d, f), t);
  }
  return d;
}
const str = (css) => `<link rel="stylesheet" href="/_astro/${css}"><p>x</p>`;
const sluchai = {
  // Первый из двух index.*.css в копии другой (правило пропало) — второй тот же.
  'первый CSS группы испорчен': [
    { '_astro/index.AAAA1111.css': 'a{color:red}', '_astro/index.BBBB2222.css': 'b{color:blue}', 'p/index.html': str('index.AAAA1111.css'), 'q/index.html': str('index.BBBB2222.css') },
    { '_astro/index.CCCC3333.css': 'a{}', '_astro/index.DDDD4444.css': 'b{color:blue}', 'p/index.html': str('index.CCCC3333.css'), 'q/index.html': str('index.DDDD4444.css') },
  ],
  // Страницы обменялись таблицами стилей: p получила стиль q и наоборот.
  'страницы обменялись CSS группы': [
    { '_astro/index.AAAA1111.css': 'a{color:red}', '_astro/index.BBBB2222.css': 'b{color:blue}', 'p/index.html': str('index.AAAA1111.css'), 'q/index.html': str('index.BBBB2222.css') },
    { '_astro/index.CCCC3333.css': 'a{color:red}', '_astro/index.DDDD4444.css': 'b{color:blue}', 'p/index.html': str('index.DDDD4444.css'), 'q/index.html': str('index.CCCC3333.css') },
  ],
};
console.log(`тест «B3-8» (помощник gruppy): ${testB38() ? 'зелёный' : 'красный'} — при любом из двух сравнений, оно в тест не входит`);
for (const [imya, [x, y]] of Object.entries(sluchai)) {
  const a = dist(x);
  const b = dist(y);
  console.log(`${imya}\n  нынешнее сравнение: различий ${JSON.stringify(nyneshnee(a, b))}\n  прежнее сравнение:  различий ${JSON.stringify(prezhnee(a, b))}`);
}
