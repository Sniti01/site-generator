// Сторож утечки мастеров ядра на синтетике (П102 блок Б): node --test core/gates/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
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

test('без утечек — пусто; громко — нет папки мастеров или она пуста', () => {
  const k = stend({ 'src/assets/a.jpg': 'AAA', 'dist/x.webp': 'aaa' });
  assert.deepEqual(utechki(join(k, 'dist'), join(k, 'src/assets')).utechki, []);
  assert.throws(() => utechki(join(k, 'dist'), join(k, 'net')), /нет папки/);
  mkdirSync(join(k, 'pusto'));
  assert.throws(() => utechki(join(k, 'dist'), join(k, 'pusto')), /ноль файлов/);
});
