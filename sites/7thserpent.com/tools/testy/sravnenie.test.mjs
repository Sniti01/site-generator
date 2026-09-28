// Сравнение двух сборок (`sravnenie.mjs`, его зовёт B1-G-12 в sborka.test.mjs) — на поддельных сборках, без сборки сайта
// (раунд 4 «судью судят» блока Б: B3-8 сторожил только помощник групп, а не само сравнение — R4-B-K-3, R4-B-Z-5;
// связь «страница → её CSS» при двух файлах в группе не сравнивалась — R4-B-K-2, R4-B-Z-8).
//   npm run proverki
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync, renameSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { sravnitSborki, faily } from './sravnenie.mjs';
import { dist } from './obshchee.mjs';

/** Поддельная сборка во временной папке: `{ путь: текст }`. */
function sborka(fajly) {
  const d = mkdtempSync(join(tmpdir(), 'sravnenie-'));
  for (const [put, tekst] of Object.entries(fajly)) {
    mkdirSync(dirname(join(d, put)), { recursive: true });
    writeFileSync(join(d, put), tekst);
  }
  return d;
}
const stranica = (css, cid = 'abc123') => `<html><head>${css ? `<link rel="stylesheet" href="/_astro/${css}">` : ''}</head><body><p data-astro-cid-${cid}>x</p></body></html>`;
const C1 = '.a[data-astro-cid-abc123]{color:red}';
const C2 = '.b{color:blue}';

/* — «судью судят», блок Б, раунд 4 (R4-B-*) — */

test('R4-B-K-2: две страницы обменялись CSS одной группы — копии разные', () => {
  const a = sborka({ '_astro/X.AAAA1111.css': C1, '_astro/X.BBBB2222.css': C2, 'p1/index.html': stranica('X.AAAA1111.css'), 'p2/index.html': stranica('X.BBBB2222.css') });
  const b = sborka({ '_astro/X.CCCC3333.css': C1, '_astro/X.DDDD4444.css': C2, 'p1/index.html': stranica('X.DDDD4444.css'), 'p2/index.html': stranica('X.CCCC3333.css') });
  assert.deepEqual(sravnitSborki(a, b), ['p1/index.html', 'p2/index.html']);
});

test('R4-B-Z-8: страницы обменялись index.*.css — сравнение видит (хеш в HTML — отпечаток содержимого)', () => {
  const a = sborka({ '_astro/index.Cz6femgl.css': C1, '_astro/index.B_-x9QkZ.css': C2, 'p1/index.html': stranica('index.Cz6femgl.css'), 'p2/index.html': stranica('index.B_-x9QkZ.css') });
  const b = sborka({ '_astro/index.D0aa11bb.css': C1, '_astro/index.E1cc22dd.css': C2, 'p1/index.html': stranica('index.E1cc22dd.css'), 'p2/index.html': stranica('index.D0aa11bb.css') });
  assert.deepEqual(sravnitSborki(a, b), ['p1/index.html', 'p2/index.html']);
});

test('R4-B-P-4: обе страницы на первый CSS группы, второй лежит без ссылок — копии разные', () => {
  const a = sborka({ '_astro/X.AAAA1111.css': C1, '_astro/X.BBBB2222.css': C2, 'p1/index.html': stranica('X.AAAA1111.css'), 'p2/index.html': stranica('X.BBBB2222.css') });
  const b = sborka({ '_astro/X.CCCC3333.css': C1, '_astro/X.DDDD4444.css': C2, 'p1/index.html': stranica('X.CCCC3333.css'), 'p2/index.html': stranica('X.CCCC3333.css') });
  assert.deepEqual(sravnitSborki(a, b), ['p2/index.html']);
});

test('R4-B-K-3 (B3-8): во второй сборке другое содержимое второго CSS группы — группа разная', () => {
  // Краснота проверена мутантом: содержимое группы — только первый файл (fajly.slice(0, 1)) — различий нет.
  const a = sborka({ '_astro/X.AAAA1111.css': C1, '_astro/X.BBBB2222.css': C2, 'p/index.html': stranica(null) });
  const b = sborka({ '_astro/X.CCCC3333.css': C1, '_astro/X.DDDD4444.css': '.b{color:green}', 'p/index.html': stranica(null) });
  assert.deepEqual(sravnitSborki(a, b), ['_astro/X.css']);
});

test('R4-B-Z-5: две поддельные сборки, первый из двух CSS группы испорчен (index, Layout) — группа в различиях', () => {
  // Краснота проверена мутантом: прежний Map по имени без хеша (последний файл группы затирает первый) — различий нет.
  for (const imya of ['index', 'Layout']) {
    const a = sborka({ [`_astro/${imya}.AAAA1111.css`]: C1, [`_astro/${imya}.BBBB2222.css`]: C2, 'p/index.html': stranica(null) });
    const b = sborka({ [`_astro/${imya}.CCCC3333.css`]: '.a{color:black}', [`_astro/${imya}.DDDD4444.css`]: C2, 'p/index.html': stranica(null) });
    assert.deepEqual(sravnitSborki(a, b), [`_astro/${imya}.css`], imya);
  }
});

test('R4-B-K-2 (контроль правки): те же страницы и CSS с другими хешами и значениями cid — равны; лишний файл — различие', () => {
  const a = sborka({ '_astro/X.AAAA1111.css': C1, '_astro/X.BBBB2222.css': C2, 'p1/index.html': stranica('X.AAAA1111.css'), 'p2/index.html': stranica('X.BBBB2222.css'), 'f.woff2': 'F' });
  const b = sborka({
    '_astro/X.CCCC3333.css': C1.replace('abc123', 'zzz999'),
    '_astro/X.DDDD4444.css': C2,
    'p1/index.html': stranica('X.CCCC3333.css', 'zzz999'),
    'p2/index.html': stranica('X.DDDD4444.css', 'zzz999'),
    'f.woff2': 'F',
  });
  assert.deepEqual(sravnitSborki(a, b), []);
  assert.ok(sravnitSborki(a, sborka({ 'lishniy.txt': '' })).includes('lishniy.txt'));
});

test('R4-B-K-2 (контроль правки): настоящая сборка и её подобие копии с ядром-копией (другие значения cid и хеши имён CSS) — равны; главная на другом CSS — различие', (t) => {
  const a = dist();
  const b = mkdtempSync(join(tmpdir(), 'sravnenie-'));
  t.after(() => rmSync(b, { recursive: true, force: true }));
  cpSync(a, b, { recursive: true });
  const css = faily(b).filter((f) => f.endsWith('.css'));
  const novoe = new Map(css.map((f, i) => [f, f.replace(/\.[A-Za-z0-9_-]+\.css$/, `.Kopiya${i}.css`)]));
  for (const f of faily(b).filter((x) => /\.(css|html)$/.test(x))) {
    let t = readFileSync(join(b, f), 'utf8').replace(/data-astro-cid-([a-z0-9]+)/g, 'data-astro-cid-$1q');
    for (const [s, n] of novoe) t = t.split(`/${s}`).join(`/${n}`);
    writeFileSync(join(b, f), t);
  }
  for (const [s, n] of novoe) renameSync(join(b, s), join(b, n));
  assert.ok(css.length >= 2, 'в сборке меньше двух CSS');
  assert.deepEqual(sravnitSborki(a, b), []);
  // Порча (контроль, что сравнение не пустое): главная подключает другой CSS сборки.
  const glavnaya = readFileSync(join(b, 'index.html'), 'utf8');
  const svoy = [...novoe.values()].find((n) => glavnaya.includes(`/${n}`));
  assert.ok(svoy, 'главная не подключает ни одного CSS сборки');
  writeFileSync(join(b, 'index.html'), glavnaya.split(`/${svoy}`).join(`/${[...novoe.values()].find((n) => n !== svoy)}`));
  assert.deepEqual(sravnitSborki(a, b), ['index.html']);
});
