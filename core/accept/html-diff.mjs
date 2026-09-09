#!/usr/bin/env node
/**
 * Приёмка, шаг 3: локализация диффы разметки.
 *
 *   node core/accept/html-diff.mjs localize <до.html> <после.html> [--flat]
 *   node core/accept/html-diff.mjs scopes   <файл.html>
 *
 * Флаг `--flat` — для **расщеплений**: порядковое приведение им не годится
 * по построению (см. `flattenScopes` ниже), и вердикта без него не бывает.
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

/**
 * Плоское гашение скрутов: хеш заменяется одним постоянным токеном.
 *
 * **Зачем оно рядом с порядковым приведением.** Порядковое годится выносу,
 * где скрут меняет значение, но остаётся одним. Расщеплению оно не годится
 * по построению: один скрут превращается в два-три, нумерация всего, что идёт
 * после первого вхождения, сдвигается, и вердикта «файлы равны» инструмент
 * не даёт ни при каком исходе. Правило приёмки для расщеплений записано
 * в `docs/REUSE.md` §6 решением владельца от 2026-09-09.
 *
 * **Гашение стирает только хеш и ничего больше** — имя атрибута остаётся,
 * ни один другой байт файла не трогается. Приведение имён собранных файлов
 * с хешем — отдельная замена (`normalizeHashedNames`), и называется она
 * отдельно: иначе «после гашения совпало» перестало бы что-либо значить.
 *
 * **Цена, которую компенсирует счёт.** Плоское гашение перестаёт различать,
 * чей скрут стоит на элементе, поэтому наружу отдаётся не только текст,
 * но и раскладка: сколько скрутов различных и сколько раз встретился каждый.
 * Без этого счёта гашение из судьи превращается в повязку на глаза.
 */
export function flattenScopes(html) {
  const счёт = new Map();
  const out = html.replace(SCOPE, (m) => {
    счёт.set(m, (счёт.get(m) ?? 0) + 1);
    return 'data-astro-cid-@';
  });
  return { html: out, счёт, скрутов: счёт.size, вхождений: [...счёт.values()].reduce((s, n) => s + n, 0) };
}

/**
 * Раскладка скрутов «до» против «после»: что уцелело, что появилось, что ушло.
 *
 * На расщеплении ожидается, что скрут расщепляемого файла **уцелеет** —
 * он выводится из пути файла, а обёртка пути не меняет, — и рядом появятся
 * ровно два новых. Иное — остановка и разбор, а не «ну и ладно».
 */
export function scopeLedger(до, после) {
  const a = flattenScopes(до).счёт;
  const b = flattenScopes(после).счёт;
  const уцелели = [...a.keys()].filter((k) => b.has(k));
  const новые = [...b.keys()].filter((k) => !a.has(k));
  const ушли = [...a.keys()].filter((k) => !b.has(k));
  return {
    до: a.size,
    после: b.size,
    уцелели: уцелели.map((k) => ({ скрут: k, было: a.get(k), стало: b.get(k) })),
    новые: новые.map((k) => ({ скрут: k, вхождений: b.get(k) })),
    ушли: ушли.map((k) => ({ скрут: k, было: a.get(k) })),
  };
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
    const плоско = process.argv.includes('--flat');
    const rawA = readFileSync(one, 'utf8');
    const rawB = readFileSync(two, 'utf8');
    if (rawA === rawB) {
      console.log('файлы побайтово равны');
      process.exit(0);
    }
    if (плоско) {
      const л = scopeLedger(rawA, rawB);
      console.log(`скрутов погашено: ${л.до} до, ${л.после} после`);
      for (const s of л.уцелели.filter((s) => s.было !== s.стало))
        console.log(`  уцелел  ${s.скрут.replace('data-astro-cid-', '')}: ${s.было} → ${s.стало} вхождений`);
      for (const s of л.новые) console.log(`  НОВЫЙ   ${s.скрут.replace('data-astro-cid-', '')}: ${s.вхождений} вхождений`);
      for (const s of л.ушли) console.log(`  ИСЧЕЗ   ${s.скрут.replace('data-astro-cid-', '')}: было ${s.было}`);
      const fa = normalizeHashedNames(flattenScopes(rawA).html).html;
      const fb = normalizeHashedNames(flattenScopes(rawB).html).html;
      if (fa === fb) {
        console.log('после плоского гашения и приведения имён с хешем файлы РАВНЫ побайтово —');
        console.log('значит кроме скрутов не изменилось ничего. Дальше пиксельная сверка по MIGRATION.md §6.');
        process.exit(0);
      }
      const loc = localize(fa, fb);
      console.log('плоским гашением диффа НЕ объясняется — расхождение локализовано:');
      console.log(`  общий префикс: ${loc.start} знаков, общий суффикс: ${loc.end} знаков`);
      console.log(`  различается: ${loc.aMiddle.length} знаков до против ${loc.bMiddle.length} после`);
      const cut = (s) => (s.length > 400 ? `${s.slice(0, 200)} … ${s.slice(-200)}` : s);
      console.log('');
      console.log('до:');
      console.log(cut(loc.aMiddle));
      console.log('');
      console.log('после:');
      console.log(cut(loc.bMiddle));
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
    console.error('node core/accept/html-diff.mjs localize <до.html> <после.html> [--flat]');
    console.error('node core/accept/html-diff.mjs scopes   <файл.html>');
    console.error('  --flat — плоское гашение: для РАСЩЕПЛЕНИЙ, где скрут становится тремя');
    process.exit(2);
  }
}
