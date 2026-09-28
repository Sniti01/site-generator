// Уборка копий прерванных прогонов (`ubratStaryeKopii`, `tools/kopiya.mjs`) — на поддельных копиях во временной
// папке, без sdelatKopiyu и без сборки (раунд 4 «судью судят» блока Б: после B3-7 метка копии — `{ pid, sayt }`,
// а тесты уборки в kopiya.test.mjs пишут метку прежнего вида; ветку «pid в метке, процесс умер» не сторожило
// ничто — R4-B-Z-2).
//   npm run proverki
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, utimesSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { ubratStaryeKopii, METKA, SAYT } from '../kopiya.mjs';

const CHAS = 3600 * 1000;
/** Поддельная копия в `tmp` с меткой `metka` (текст), время папки — 48 часов назад. */
function kopiya(tmp, imya, metka) {
  const p = join(tmp, imya);
  mkdirSync(join(p, 'sites'), { recursive: true });
  writeFileSync(join(p, METKA), metka);
  const davno = new Date(Date.now() - 48 * CHAS);
  utimesSync(p, davno, davno);
  return p;
}
/** pid процесса, который уже вышел. */
const mertvyiPid = () => spawnSync(process.execPath, ['-e', '']).pid;

/* — «судью судят», блок Б, раунд 4 (R4-B-*) — */

test('R4-B-Z-2: копия нового вида (метка JSON с pid умершего процесса) старше 12 часов — уборка убирает', () => {
  // Краснота проверена мутантом: processZhiv — любой pid жив (return true вместо e.code === 'EPERM') — копия осталась.
  const tmp = mkdtempSync(join(tmpdir(), 'kopii-'));
  const pid = mertvyiPid();
  assert.ok(Number.isInteger(pid) && pid > 0, `pid дочернего процесса: ${pid}`);
  kopiya(tmp, 'proverki-mertvyi', `${JSON.stringify({ pid, sayt: SAYT })}\n`);
  const ubrano = ubratStaryeKopii({ papka: tmp, starshe: 12 * CHAS });
  assert.equal(ubrano.length, 1);
  assert.deepEqual(readdirSync(tmp), []);
});

test('R4-B-Z-2 (контроль): копия нового вида с pid живого процесса (этого) — не убирается; pid строкой и битая метка — убираются', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'kopii-'));
  const zhivaya = kopiya(tmp, 'proverki-zhivaya', `${JSON.stringify({ pid: process.pid, sayt: SAYT })}\n`);
  kopiya(tmp, 'proverki-stroka', `${JSON.stringify({ pid: String(process.pid), sayt: SAYT })}\n`);
  kopiya(tmp, 'proverki-bitaya', '{"pid":');
  const ubrano = ubratStaryeKopii({ papka: tmp, starshe: 12 * CHAS });
  assert.deepEqual(ubrano.map((p) => p.slice(tmp.length + 1)).sort(), ['proverki-bitaya', 'proverki-stroka']);
  assert.ok(existsSync(join(zhivaya, METKA)));
});
