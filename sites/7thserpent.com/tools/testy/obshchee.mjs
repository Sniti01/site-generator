/**
 * Общее для тестов судей сайта (П102): сборка, которую судят тесты, указатель корпуса, фраза корпуса.
 *
 * СБОРКА — копия сайта, собранная командой `npm run proverki` (`tools/proverki.mjs`); путь к её
 * `dist/` — в переменной окружения `PROVERKI_DIST`. Без неё тест, которому нужна сборка, громко
 * отказывает: судить `dist/` сайта, собранный неизвестно когда, тест не станет. ПРЕДЕЛ (раунд 1
 * блока Б, B1-G-11): прямой `node --test` с `PROVERKI_DIST`, выставленной руками, судит ту сборку,
 * на которую она указывает, — свежесть сборки ручного прогона на совести запустившего.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ukazatelKorpusa, dokumentyKorpusa, tekstDokumentaKorpusa } from '@factory/core/text/corpus.mjs';
import { izvlechDokument } from '@factory/core/text/extract.mjs';
import { IMENA } from '../../gates/phrases.mjs';

export const SAYT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** Папка сборки копии (`npm run proverki`); без неё — ошибка. */
export function dist() {
  const d = process.env.PROVERKI_DIST;
  if (!d || !existsSync(join(d, 'index.html'))) {
    throw new Error('нет сборки копии: запускайте тесты командой npm run proverki (PROVERKI_DIST — dist/ собранной копии сайта)');
  }
  return d;
}

/** HTML страницы сборки по адресу (`/`, `/pc/`, `/max-payne-3/guide/`). */
export const stranica = (url) => readFileSync(join(dist(), url === '/' ? '' : url.slice(1), 'index.html'), 'utf8');

let uk = null;
/** Указатель корпуса сайта (ядро; кеш вне git). */
export function ukazatel() {
  uk ??= ukazatelKorpusa(join(SAYT, 'input/corpus'), { imena: IMENA });
  return uk;
}

/**
 * Слова документа корпуса Википедии длиннее 2000 слов — поток извлечения ядра (как в указателе);
 * порчи прежних проб брали 12–14 буквенных слов подряд с 400-го (`chuzhie-p5.mjs`, `chuzhie-repliki.mjs`,
 * `chuzhie-glavy.mjs`). Возвращает `{ url, slova }` — слова как в тексте (с регистром и знаками).
 */
export function dokumentVikipedii() {
  for (const d of dokumentyKorpusa(join(SAYT, 'input/corpus'))) {
    if (!/wikipedia/.test(d.url)) continue;
    const tekst = izvlechDokument(tekstDokumentaKorpusa(d)).vplotnuyu.join(' ');
    const ws = tekst.replace(/\s+/g, ' ').trim().split(' ');
    if (ws.length > 2000) return { url: d.url, slova: ws };
  }
  throw new Error('в корпусе нет документа Википедии длиннее 2000 слов');
}

/** `n` подряд идущих слов из одних латинских букв (не меньше двух), с 400-го слова документа. */
export function frazaKorpusa(n, { znaki = false } = {}) {
  const { url, slova } = dokumentVikipedii();
  const re = znaki ? /^[A-Za-z]{2,}[,.]?$/ : /^[A-Za-z]{2,}$/;
  let i0 = 400;
  while (!slova.slice(i0, i0 + n).every((w) => re.test(w))) i0 += 1;
  return { url, k: slova.slice(i0, i0 + n) };
}

/** Точная замена с проверкой: образец обязан быть в тексте (порча, которая не применилась, — не порча). */
export function zamena(s, iz, na) {
  if (typeof iz === 'string' ? !s.includes(iz) : !iz.test(s)) throw new Error(`порча не применилась: нет «${String(iz).slice(0, 60)}»`);
  return s.replace(iz, typeof na === 'function' ? na : () => na);
}
