#!/usr/bin/env node
/**
 * Приёмка, подтверждение 1: манифест `dist/` — снимок и побайтовая сверка.
 *
 *   node core/accept/manifest.mjs snapshot <dist> [файл.json]
 *   node core/accept/manifest.mjs compare  <до.json> <после.json>
 *
 * Первый шаг правила приёмки после каждого выноса, всегда (`docs/REUSE.md` §6):
 * сборка до против сборки после, пофайлово и побайтово. Диффа пуста — вынос
 * принят, пиксельная сверка не нужна: те же байты дают те же пиксели.
 *
 * **Код возврата здесь не приговор.** У гейтов `exit≠0` означает регрессию;
 * у приёмки непустая диффа — законный шаг 3 протокола, а не поломка. Поэтому
 * ненулевой код означает только одно: инструмент не смог сделать свою работу
 * (нет папки, битый снимок). Вердикт читается из вывода.
 *
 * **Снимок кладётся вне репозитория и снимается до первой сборки сессии**
 * (`REUSE` §6): `dist/` в `.gitignore`, `git checkout` его не возвращает,
 * и любая пробная сборка затирает эталон сравнения.
 */

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const usage = () => {
  console.error('node core/accept/manifest.mjs snapshot <dist> [файл.json]');
  console.error('node core/accept/manifest.mjs compare  <до.json> <после.json>');
  process.exit(2);
};

function walk(dir, root, out) {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, root, out);
    else {
      const buf = readFileSync(path);
      out.push({
        file: relative(root, path).split(sep).join('/'),
        bytes: st.size,
        sha256: createHash('sha256').update(buf).digest('hex'),
      });
    }
  }
  return out;
}

export function snapshot(dist) {
  if (!existsSync(dist)) throw new Error(`нет папки сборки: ${dist}`);
  const files = walk(dist, dist, []).sort((a, b) => a.file.localeCompare(b.file));
  return { корень: dist.split(sep).join('/'), файлов: files.length, файлы: files };
}

export function compare(before, after) {
  const a = new Map(before.файлы.map((f) => [f.file, f]));
  const b = new Map(after.файлы.map((f) => [f.file, f]));
  const added = [...b.keys()].filter((k) => !a.has(k));
  const removed = [...a.keys()].filter((k) => !b.has(k));
  const changed = [...a.keys()].filter((k) => b.has(k) && a.get(k).sha256 !== b.get(k).sha256);
  return { было: a.size, стало: b.size, добавлено: added, удалено: removed, изменено: changed };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(sep).join('/'))) {
  const [, , cmd, one, two] = process.argv;
  if (cmd === 'snapshot') {
    if (!one) usage();
    const snap = snapshot(one);
    const out = two ?? null;
    if (out) writeFileSync(out, JSON.stringify(snap, null, 1) + '\n');
    console.log(`манифест: ${snap.файлов} файлов${out ? ` → ${out}` : ''}`);
    if (!out) process.stdout.write(JSON.stringify(snap, null, 1) + '\n');
  } else if (cmd === 'compare') {
    if (!one || !two) usage();
    const r = compare(JSON.parse(readFileSync(one, 'utf8')), JSON.parse(readFileSync(two, 'utf8')));
    const total = r.добавлено.length + r.удалено.length + r.изменено.length;
    console.log(`манифест: было ${r.было} файлов, стало ${r.стало}`);
    if (total === 0) {
      console.log('диффа пуста — те же байты. По правилу приёмки вынос принят, пиксельная сверка не нужна.');
    } else {
      console.log(`различий: ${total} из ${r.стало} — диффа обязана локализоваться в смену data-astro-cid-* выносимого компонента.`);
      for (const f of r.изменено) console.log(`  изменён  ${f}`);
      for (const f of r.добавлено) console.log(`  добавлен ${f}`);
      for (const f of r.удалено) console.log(`  удалён   ${f}`);
    }
  } else usage();
}
