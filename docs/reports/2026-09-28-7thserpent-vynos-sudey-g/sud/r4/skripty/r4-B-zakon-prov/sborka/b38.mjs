// B3-8: помощники и оба сравнения B1-G-12 — дословно из sborka.test.mjs (нынешнее) и ec74257^ (прежнее); поддельные dist здесь.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const TUT = dirname(fileURLToPath(import.meta.url));
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
function nyne(a, b) {
  const ga = gruppy(faily(a));
  const gb = gruppy(faily(b));
  if (JSON.stringify([...gb.keys()].sort()) !== JSON.stringify([...ga.keys()].sort())) return 'ключи разные';
  const soderzhimoe = (koren, fajly) => fajly.map((f) => (/\.(css|html)$/.test(f) ? bezCid(readFileSync(join(koren, f), 'utf8')) : readFileSync(join(koren, f)).toString('base64'))).sort();
  return [...ga].filter(([klyuch, fajly]) => JSON.stringify(soderzhimoe(a, fajly)) !== JSON.stringify(soderzhimoe(b, gb.get(klyuch)))).map(([k]) => k);
}
function prezhnee(a, b) {
  const fa = new Map(faily(a).map((f) => [imyaBezHesha(f), f]));
  const fb = new Map(faily(b).map((f) => [imyaBezHesha(f), f]));
  if (JSON.stringify([...fb.keys()]) !== JSON.stringify([...fa.keys()])) return 'ключи разные';
  return [...fa]
    .filter(([klyuch, f]) => {
      const x = readFileSync(join(a, f));
      const y = readFileSync(join(b, fb.get(klyuch)));
      return /\.(css|html)$/.test(f) ? bezCid(x.toString('utf8')) !== bezCid(y.toString('utf8')) : !x.equals(y);
    })
    .map(([k]) => k);
}
const dist = (imya, fajly) => {
  const d = mkdtempSync(join(TUT, `${imya}-`));
  for (const [f, t] of Object.entries(fajly)) {
    mkdirSync(dirname(join(d, f)), { recursive: true });
    writeFileSync(join(d, f), t);
  }
  return d;
};
const html = (css) => `<html><head><link rel="stylesheet" href="/_astro/${css}"></head><body data-astro-cid-abc>x</body></html>`;
const A = {
  '_astro/index.AAAA1111.css': '.p1{color:red}',
  '_astro/index.BBBB2222.css': '.p2{color:blue}',
  'p1/index.html': html('index.AAAA1111.css'),
  'p2/index.html': html('index.BBBB2222.css'),
};
const sluchai = {
  'равные (другие хеши)': { '_astro/index.CCCC.css': '.p1{color:red}', '_astro/index.DDDD.css': '.p2{color:blue}', 'p1/index.html': html('index.CCCC.css'), 'p2/index.html': html('index.DDDD.css') },
  'первый CSS группы испорчен': { ...A, '_astro/index.AAAA1111.css': '.p1{color:green}' },
  'второй CSS группы испорчен': { ...A, '_astro/index.BBBB2222.css': '.p2{color:green}' },
  'страницы обменялись CSS группы': { ...A, 'p1/index.html': html('index.BBBB2222.css'), 'p2/index.html': html('index.AAAA1111.css') },
  'в группе три файла вместо двух (лишний такой же)': { ...A, '_astro/index.EEEE.css': '.p1{color:red}' },
  // член класса B3-8, скептик не пробовал: группа CSS с одинаковым содержимым двух файлов, в копии один из них другой
  'два одинаковых CSS в группе, в копии второй другой': null,
  // B3-8 член: не только index — группа Layout.*.css
  'группа Layout.*.css: первый испорчен': null,
};
const a = dist('a', A);
for (const [ime, f] of Object.entries(sluchai)) {
  let aa = a;
  let ff = f;
  if (ime.startsWith('два одинаковых')) {
    aa = dist('a2', { '_astro/x.AAA.css': '.q{}', '_astro/x.BBB.css': '.q{}' });
    ff = { '_astro/x.CCC.css': '.q{}', '_astro/x.DDD.css': '.r{}' };
  }
  if (ime.startsWith('группа Layout')) {
    aa = dist('a3', { '_astro/Layout.AAA.css': '.l1{}', '_astro/Layout.BBB.css': '.l2{}' });
    ff = { '_astro/Layout.CCC.css': '.l1{x}', '_astro/Layout.DDD.css': '.l2{}' };
  }
  const b = dist('b', ff);
  console.log(`${ime}: нынешнее ${JSON.stringify(nyne(aa, b))}; прежнее ${JSON.stringify(prezhnee(aa, b))}`);
}
// тест «B3-8» как есть: зависит только от gruppy
const f = ['_astro/index.AAAA1111.css', '_astro/index.BBBB2222.css'];
console.log(`тест «B3-8» (gruppy): ${gruppy(f).get('_astro/index.css').length === f.length ? 'зелёный' : 'красный'} — от сравнения не зависит`);
