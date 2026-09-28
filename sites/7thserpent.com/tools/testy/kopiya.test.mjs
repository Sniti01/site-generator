// Копия сайта вне репозитория (`tools/kopiya.mjs`, П102 блок Б–В): где живёт, на что ссылается,
// как удаляется. Раунд 1 «судью судят» блока Б — B1-G-9, B1-G-10. Без сборки.
//   npm run proverki
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, symlinkSync, realpathSync, utimesSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { sdelatKopiyu, udalitKopiyu, ubratStaryeKopii, REPO, METKA } from '../kopiya.mjs';

test('B1-G-9: папка «..x» внутри репозитория — репозиторий: удалять отказ', () => {
  assert.throws(() => udalitKopiyu({ koren: join(REPO, '..kopiya-proba'), ssylki: [] }), /внутри репозитория/);
});

test('B1-G-10: в копии нет ссылок на сайты репозитория (кроме корпуса); метка копии есть; удаление цели не трогает', () => {
  const k = sdelatKopiyu(mkdtempSync(join(tmpdir(), 'kopiya-')));
  try {
    const naSayty = k.ssylki
      .filter((s) => !s.endsWith(join('input', 'corpus')))
      .filter((s) => !relative(join(REPO, 'sites'), realpathSync(s)).startsWith('..'));
    assert.deepEqual(naSayty.map((s) => relative(k.koren, s)), []);
    assert.ok(existsSync(join(k.koren, METKA)));
  } finally {
    udalitKopiyu(k);
  }
  assert.equal(existsSync(k.koren), false);
  assert.ok(existsSync(join(REPO, 'core', 'package.json')));
});

test('B1-G-10: уборка старых копий — только папки с меткой копии, по ссылкам не ходит', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'kopii-'));
  const cel = mkdtempSync(join(tmpdir(), 'cel-'));
  writeFileSync(join(cel, 'nuzhnyi.txt'), 'цел');
  const staraya = join(tmp, 'proba-staraya');
  mkdirSync(join(staraya, 'node_modules'), { recursive: true });
  writeFileSync(join(staraya, METKA), '');
  symlinkSync(cel, join(staraya, 'node_modules', 'paket'), 'junction');
  const chuzhaya = join(tmp, 'proba-chuzhaya');
  mkdirSync(chuzhaya);
  const svezhaya = join(tmp, 'proba-svezhaya');
  mkdirSync(svezhaya);
  writeFileSync(join(svezhaya, METKA), '');
  const davno = new Date(Date.now() - 48 * 3600 * 1000);
  for (const p of [staraya, chuzhaya]) utimesSync(p, davno, davno);
  const ubrano = ubratStaryeKopii({ papka: tmp, starshe: 12 * 3600 * 1000 });
  assert.deepEqual(ubrano.map((p) => relative(tmp, p)), ['proba-staraya']);
  assert.deepEqual(readdirSync(tmp).sort(), ['proba-chuzhaya', 'proba-svezhaya']);
  assert.ok(existsSync(join(cel, 'nuzhnyi.txt')));
});
