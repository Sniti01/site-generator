// Копия сайта вне репозитория (`tools/kopiya.mjs`, П102 блок Б–В): где живёт, на что ссылается,
// как удаляется. Раунд 1 «судью судят» блока Б — B1-G-9, B1-G-10. Без сборки.
//   npm run proverki
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, symlinkSync, realpathSync, utimesSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { sdelatKopiyu, udalitKopiyu, ubratStaryeKopii, zapisat, REPO, METKA, OSTAVLENA } from '../kopiya.mjs';

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

/* — «судью судят», блок Б, раунд 2 (B2-*) — */

test('B2-3: уборка, сорванная посреди (папка занята), — ссылки сняты, метка на месте: остаток виден следующей уборке', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'kopii-'));
  const cel = mkdtempSync(join(tmpdir(), 'cel-'));
  writeFileSync(join(cel, 'nuzhnyi.txt'), 'цел');
  const staraya = join(tmp, 'proba-staraya');
  mkdirSync(join(staraya, 'a-zanyata'), { recursive: true });
  writeFileSync(join(staraya, METKA), '');
  symlinkSync(cel, join(staraya, 'z-korpus'), 'junction');
  const davno = new Date(Date.now() - 48 * 3600 * 1000);
  utimesSync(staraya, davno, davno);
  // Текущая папка живого процесса: rmdir на Windows отказывает (EBUSY).
  const zanyal = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)'], { cwd: join(staraya, 'a-zanyata'), stdio: 'ignore' });
  try {
    await new Promise((r) => setTimeout(r, 300));
    ubratStaryeKopii({ papka: tmp, starshe: 12 * 3600 * 1000 });
    assert.equal(existsSync(join(staraya, 'z-korpus')), false, 'в остатке осталась живая ссылка-переход');
    assert.ok(existsSync(join(staraya, METKA)), 'остаток без метки: следующая уборка его не увидит');
  } finally {
    zanyal.kill();
  }
  assert.ok(existsSync(join(cel, 'nuzhnyi.txt')));
});

test('B2-4: копия, оставленная по --ostavit (отметка OSTAVLENA), уборкой старых копий не убирается', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'kopii-'));
  const ostavlena = join(tmp, 'proverki-ostavlena');
  mkdirSync(ostavlena);
  writeFileSync(join(ostavlena, METKA), '');
  writeFileSync(join(ostavlena, OSTAVLENA), '');
  const davno = new Date(Date.now() - 48 * 3600 * 1000);
  utimesSync(ostavlena, davno, davno);
  assert.deepEqual(ubratStaryeKopii({ papka: tmp, starshe: 12 * 3600 * 1000 }), []);
  assert.ok(existsSync(ostavlena));
});

test('B2-7: запись в копию — только внутри папки сайта копии и не сквозь ссылку-переход (ядро, корпус)', () => {
  const k = sdelatKopiyu(mkdtempSync(join(tmpdir(), 'kopiya-')));
  try {
    assert.throws(() => zapisat(k, '../../core', 'x'), /вне папки сайта копии|ссылк/);
    assert.throws(() => zapisat(k, 'input/corpus/x.txt', 'x'), /вне папки сайта копии|ссылк/);
  } finally {
    udalitKopiyu(k);
  }
});
