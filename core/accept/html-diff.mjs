#!/usr/bin/env node
/**
 * Приёмка, шаг 3: локализация диффы разметки.
 *
 *   node core/accept/html-diff.mjs localize <до.html> <после.html>
 *   node core/accept/html-diff.mjs scopes   <файл.html>
 *
 * Отвечает на вопрос, который задаёт правило приёмки (`docs/REUSE.md` §6):
 * **сводится ли расхождение к смене `data-astro-cid-*` выносимого компонента.**
 * Ответ даётся машиной: скруты приводятся к порядковому виду, имена файлов
 * с хешем — к общему, и файлы сравниваются снова. Совпали — вся диффа была
 * скрутами, и это ожидаемый исход выноса. Не совпали — печатается место
 * расхождения, найденное общим префиксом и суффиксом.
 *
 * **Два инструмента бэклога здесь слиты в один намеренно.** Нормализация
 * скрутов и локализация диффы порознь не нужны: первая существует ради второй,
 * а вопрос у них общий — «объясняется ли расхождение скрутами». Разведённые,
 * они требовали бы передавать промежуточный файл и договариваться о его формате.
 *
 * Код возврата не приговор: ненулевой означает, что инструмент не смог
 * прочитать вход.
 */

import { readFileSync } from 'node:fs';
import { sep } from 'node:path';

const SCOPE = /data-astro-cid-[a-z0-9]+/g;
const HASHED = /\/_astro\/([a-zA-Z0-9_.-]+?)\.[A-Za-z0-9_-]{8}\.(css|js)/g;

/** Скруты → порядковые имена в порядке первого появления. */
export function normalizeScopes(html) {
  const map = new Map();
  const out = html.replace(SCOPE, (m) => {
    if (!map.has(m)) map.set(m, `data-astro-cid-СКРУТ${map.size + 1}`);
    return map.get(m);
  });
  return { html: out, map };
}

/** Имена собранных файлов с хешем → имя без хеша. */
export function normalizeHashedNames(html) {
  const map = new Map();
  const out = html.replace(HASHED, (m, base, ext) => {
    if (!map.has(m)) map.set(m, `/_astro/${base}.ХЕШ.${ext}`);
    return map.get(m);
  });
  return { html: out, map };
}

function localize(a, b) {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start += 1;
  let end = 0;
  while (end < a.length - start && end < b.length - start && a[a.length - 1 - end] === b[b.length - 1 - end]) end += 1;
  return { start, end, aMiddle: a.slice(start, a.length - end), bMiddle: b.slice(start, b.length - end) };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(sep).join('/'))) {
  const [, , cmd, one, two] = process.argv;
  if (cmd === 'scopes' && one) {
    const { map } = normalizeScopes(readFileSync(one, 'utf8'));
    console.log(`скрутов в файле: ${map.size}`);
    for (const [real, canon] of map) console.log(`  ${canon.replace('data-astro-cid-', '')} ← ${real.replace('data-astro-cid-', '')}`);
  } else if (cmd === 'localize' && one && two) {
    const rawA = readFileSync(one, 'utf8');
    const rawB = readFileSync(two, 'utf8');
    if (rawA === rawB) {
      console.log('файлы побайтово равны');
      process.exit(0);
    }
    const sa = normalizeScopes(rawA);
    const sb = normalizeScopes(rawB);
    console.log(`скрутов: ${sa.map.size} до, ${sb.map.size} после`);
    if (sa.html === sb.html) {
      console.log('после приведения скрутов файлы равны — вся диффа сводится к смене data-astro-cid-*.');
      console.log('Это ожидаемый исход выноса: дальше пиксельная сверка по MIGRATION.md §6.');
      process.exit(0);
    }
    const ha = normalizeHashedNames(sa.html);
    const hb = normalizeHashedNames(sb.html);
    if (ha.html === hb.html) {
      console.log('после приведения скрутов и имён файлов с хешем файлы равны.');
      console.log('Диффа сводится к скрутам и к смене имени собранного файла — оба следствия выноса.');
      for (const [real, canon] of ha.map) console.log(`  до:    ${real} → ${canon}`);
      for (const [real, canon] of hb.map) console.log(`  после: ${real} → ${canon}`);
      process.exit(0);
    }
    const loc = localize(ha.html, hb.html);
    console.log('скрутами и именами файлов диффа НЕ объясняется — расхождение локализовано:');
    console.log(`  общий префикс: ${loc.start} знаков, общий суффикс: ${loc.end} знаков`);
    console.log(`  различается: ${loc.aMiddle.length} знаков до против ${loc.bMiddle.length} после`);
    const cut = (s) => (s.length > 400 ? `${s.slice(0, 200)} … ${s.slice(-200)}` : s);
    console.log('');
    console.log('до:');
    console.log(cut(loc.aMiddle));
    console.log('');
    console.log('после:');
    console.log(cut(loc.bMiddle));
  } else {
    console.error('node core/accept/html-diff.mjs localize <до.html> <после.html>');
    console.error('node core/accept/html-diff.mjs scopes   <файл.html>');
    process.exit(2);
  }
}
