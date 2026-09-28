// Сторожа по dist/ — в сборке (П102: «npm run build падает на их отказе, как на гейтах ядра»):
// отказ судьи головы и сторожа 8 слов роняет сборку копии (раунд 1 «судью судят» блока Б, B1-G-5);
// копия с ядром-копией собирает то же, что копия с ядром-ссылкой, кроме значений data-astro-cid ядра — они
// зависят от места файлов ядра (B1-G-12: «копия = сайт», бэклог 69 п. 9; сканер Tailwind идёт через ссылку
// на ядро). Каждая проба — своя копия сайта и её сборка.
//   npm run proverki
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { sdelatKopiyu, udalitKopiyu, sobrat, prochest, zapisat } from '../kopiya.mjs';
import { dist } from './obshchee.mjs';
import { sravnitSborki } from './sravnenie.mjs';

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

// Копия с ядром-ссылкой (сборка proverki) побайтно равна сборке сайта (замер — в папке доклада). Сравнение
// с копией с ядром-копией — `sravnitSborki` (`sravnenie.mjs`: без значений cid, CSS группами, ссылка на CSS —
// отпечатком содержимого); его сторожат тесты без сборки `sravnenie.test.mjs` (раунд 4, R4-B-K-3, R4-B-Z-5:
// прежний тест B3-8 проверял только помощник групп, теперь — R4-B-K-3 (B3-8) там же).

test('B1-G-12: копия с ядром-копией = копия с ядром-ссылкой (сборка proverki), кроме значений data-astro-cid ядра', () => {
  const a = dist();
  sborkaS(() => {}, {
    sYadrom: true,
    posle: (k, r) => {
      assert.equal(r.kod, 0, r.vyvod.slice(-2000));
      assert.deepEqual(sravnitSborki(a, join(k.sayt, 'dist')), []);
    },
  });
});
