// Сторож утечки мастеров ядра на синтетике (П102 блок Б): node --test core/gates/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { utechki } from './masters.mjs';

function stend(faily) {
  const koren = mkdtempSync(join(tmpdir(), 'mastera-'));
  for (const [put, b] of Object.entries(faily)) {
    mkdirSync(join(koren, put, '..'), { recursive: true });
    writeFileSync(join(koren, put), b);
  }
  return koren;
}

test('мастер, побайтно равный файлу сборки, — утечка с именами обоих', () => {
  const k = stend({ 'src/assets/gry/a.jpg': 'AAA', 'src/assets/gry/b.jpg': 'BBB', 'dist/_astro/a.123.jpg': 'AAA', 'dist/_astro/a.456.webp': 'aaa', 'dist/public-copy/b.jpg': 'BBB' });
  const r = utechki(join(k, 'dist'), join(k, 'src/assets'));
  assert.equal(r.masterov, 2);
  assert.deepEqual(r.utechki.map((u) => `${u.fajl}=${u.master}`).sort(), ['_astro/a.123.jpg=gry/a.jpg', 'public-copy/b.jpg=gry/b.jpg']);
});

test('без утечек — пусто; громко — нет папки мастеров или в ней ноль картинок', () => {
  const k = stend({ 'src/assets/a.jpg': 'AAA', 'dist/x.webp': 'aaa' });
  assert.deepEqual(utechki(join(k, 'dist'), join(k, 'src/assets')).utechki, []);
  assert.throws(() => utechki(join(k, 'dist'), join(k, 'net')), /нет папки/);
  mkdirSync(join(k, 'pusto'));
  assert.throws(() => utechki(join(k, 'dist'), join(k, 'pusto')), /ноль картинок/);
});

/* — «судью судят», блок Б, раунд 1 (B1-G-13) — */

test('B1-G-13: круг — картинки всего src/ (поле image() коллекции, данные); SVG и не-картинки — не мастера', () => {
  const k = stend({
    'src/assets/a.jpg': 'AAA',
    'src/content/p/cover.jpg': 'CCC',
    'src/data/logo.svg': '<svg/>',
    'src/data/tekst.ts': 'export const x = 1;',
    'dist/_astro/cover.1.jpg': 'CCC',
    'dist/_astro/logo.svg': '<svg/>',
    'dist/x.js': 'export const x = 1;',
  });
  const r = utechki(join(k, 'dist'), join(k, 'src'));
  assert.equal(r.masterov, 2);
  assert.deepEqual(r.utechki.map((u) => `${u.fajl}=${u.master}`), ['_astro/cover.1.jpg=content/p/cover.jpg']);
  assert.equal(utechki(join(k, 'dist'), [join(k, 'src/assets'), join(k, 'src/content')]).utechki.length, 1);
});

test('B1-G-13: ссылка на папку в сборке — обходится, не EISDIR', () => {
  const k = stend({ 'src/assets/a.jpg': 'AAA', 'drugoe/a.jpg': 'AAA', 'dist/index.html': 'x' });
  symlinkSync(join(k, 'drugoe'), join(k, 'dist', 'svyaz'), 'junction');
  assert.deepEqual(utechki(join(k, 'dist'), join(k, 'src/assets')).utechki.map((u) => u.fajl), ['svyaz/a.jpg']);
});
