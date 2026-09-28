// Сторожа по dist/ — в сборке (П102: «npm run build падает на их отказе, как на гейтах ядра»):
// отказ судьи головы и сторожа 8 слов роняет сборку копии (раунд 1 «судью судят» блока Б, B1-G-5);
// копия с ядром-ссылкой и копия с ядром-копией собирают побайтно одно и то же (B1-G-12: «копия = сайт»,
// сканер Tailwind идёт через ссылку на ядро). Каждая проба — своя копия сайта и её сборка.
//   npm run proverki
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { sdelatKopiyu, udalitKopiyu, sobrat, prochest, zapisat } from '../kopiya.mjs';
import { dist } from './obshchee.mjs';

function sborkaS(mut, { sYadrom = false, posle = () => {} } = {}) {
  const k = sdelatKopiyu(mkdtempSync(join(tmpdir(), 'sborka-')), { sYadrom });
  try {
    mut(k);
    const r = sobrat(k);
    posle(k, r);
    return r;
  } finally {
    udalitKopiyu(k);
  }
}
const pravka = (k, put, iz, na) => {
  const t = prochest(k, put);
  if (!t.includes(iz)) throw new Error(`мутация не применилась: в ${put} нет «${iz}»`);
  zapisat(k, put, t.replace(iz, () => na));
};

test('B1-G-5: отказ судьи головы роняет сборку', () => {
  const r = sborkaS((k) => pravka(k, 'gates/head.mjs', "imya: '7th Serpent',", "imya: '7th Serpent X',"));
  assert.notEqual(r.kod, 0);
  assert.match(r.vyvod, /Голова или крошки не по договору/);
});

test('B1-G-5: отказ сторожа 8 слов роняет сборку (реплика /quotes/ без своего исключения)', () => {
  const iz = "  ['My cover had been blown. The door slammed shut behind me. And then I was dodging bullets like raindrops.', /^Max Payne · 2001/],\n";
  const r = sborkaS((k) => pravka(k, 'gates/phrases.mjs', iz, ''));
  assert.notEqual(r.kod, 0);
  assert.match(r.vyvod, /Чужие 8-словные последовательности/);
  assert.match(r.vyvod, /\/quotes\/: в кавычках, но не исключение сайта/);
});

/** Файлы сборки — пути от её корня. */
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

// Значение `data-astro-cid-*` компонента ядра зависит от того, где лежит файл ядра: у копии с ядром-копией
// оно своё на каждую копию (замер сессии 20: CSS той же длины, правила те же, разнятся только эти значения
// и хеши в именах CSS). Копия с ядром-ссылкой (сборка proverki) побайтно равна сборке сайта (замер — в папке
// доклада). Здесь — всё остальное: те же файлы, те же байты картинок и шрифтов, тот же текст CSS и HTML.
const bezCid = (s) => s.replace(/data-astro-cid-[a-z0-9]+/g, 'data-astro-cid-X').replace(/(\/_astro\/[A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+\.css/g, '$1.css');
const imyaBezHesha = (f) => (f.endsWith('.css') ? f.replace(/^(_astro\/[A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+\.css$/, '$1.css') : f);
/** Файлы по имени без хеша CSS: группы, а не ключи (два `index.*.css` — два файла одной группы, B3-8). */
function gruppy(spisok) {
  const g = new Map();
  for (const f of spisok) {
    const k = imyaBezHesha(f);
    if (!g.has(k)) g.set(k, []);
    g.get(k).push(f);
  }
  return g;
}

test('B3-8: два CSS с одним именем до хеша (index.*.css двух страниц) — оба в сравнении копий', () => {
  const f = ['_astro/index.AAAA1111.css', '_astro/index.BBBB2222.css'];
  assert.equal(gruppy(f).get('_astro/index.css').length, f.length);
});

test('B1-G-12: копия с ядром-копией = копия с ядром-ссылкой (сборка proverki), кроме значений data-astro-cid ядра', () => {
  const a = dist();
  sborkaS(() => {}, {
    sYadrom: true,
    posle: (k, r) => {
      assert.equal(r.kod, 0, r.vyvod.slice(-2000));
      const b = join(k.sayt, 'dist');
      const ga = gruppy(faily(a));
      const gb = gruppy(faily(b));
      assert.deepEqual([...gb.keys()].sort(), [...ga.keys()].sort());
      // Содержимое группы — мультимножество: тексты CSS и HTML без значений cid, прочее — байты (base64).
      const soderzhimoe = (koren, fajly) =>
        fajly.map((f) => (/\.(css|html)$/.test(f) ? bezCid(readFileSync(join(koren, f), 'utf8')) : readFileSync(join(koren, f)).toString('base64'))).sort();
      const raznye = [...ga].filter(([klyuch, fajly]) => JSON.stringify(soderzhimoe(a, fajly)) !== JSON.stringify(soderzhimoe(b, gb.get(klyuch))));
      assert.deepEqual(raznye.map(([klyuch]) => klyuch), []);
    },
  });
});
