#!/usr/bin/env node
// Исправленная копия mapowanie.mjs по итогам состязательной проверки 2026-09-12.
// Отличия от оригинала помечены «// [F<n>]» — номера находок из отчёта проверки.
//
//   node mapowanie-fix.mjs <эталон> <снятое> <miejsca.json> [--json <out>]
//
// miejsca.json: { "1440": { scrollY: {<файл>: число}, miejsca: [{nazwa, x, y, w, h, fixed?, naWysokosc?}] }, "390": {...} }
//   fixed      — в системе окна (шапка, рейка); при полном кадре — как есть, кроме:
//   naWysokosc — fixed-элемент с height: 100vh: в полном кадре тянется на всю высоту кадра
//                (captureBeyondViewport расширяет вьюпорт) — [F5] флаг вместо имени «skala».
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { decodePng } from 'file:///D:/SEO/cloud/site-generator/core/accept/pixels.mjs'; // [F1] file:// — голый D:/ для ESM на Windows не путь, а схема «d:»

const [, , etalonDir, snyatoeDir, miejscaPath, ...rest] = process.argv;
if (!etalonDir || !snyatoeDir || !miejscaPath) {
  console.error('node mapowanie-fix.mjs <эталон> <снятое> <miejsca.json> [--json <out>]');
  process.exit(2);
}
const jsonOut = rest.includes('--json') ? rest[rest.indexOf('--json') + 1] : null;
const miejsca = JSON.parse(readFileSync(miejscaPath, 'utf8'));

// [F6] вьюпорт — из хвоста имени (…-1440x900.png / …-full-1440.png), не по подстроке «390»
const vieport = (file) => {
  const m = /-(\d+)x\d+\.png$/.exec(file) ?? /-full-(\d+)\.png$/.exec(file);
  if (!m) throw new Error(`имя кадра без ширины в хвосте: ${file}`);
  return m[1];
};
const isFull = (file) => file.includes('-full-');
const isHero = (file) => file.includes('-hero-');
const num = (v) => typeof v === 'number' && Number.isFinite(v);

// [F2] scrollY: полный и hero — 0 по определению кадра; оконный слой/блок — обязан быть записан, иначе отказ, не 0.
const scrollYFor = (file, v) => {
  const z = v.scrollY?.[file];
  if (isFull(file) || isHero(file)) {
    if (z !== undefined && z !== 0) throw new Error(`scrollY ${z} у кадра, который снимается при 0: ${file}`);
    return 0;
  }
  if (!num(z)) throw new Error(`нет scrollY для оконного кадра ${file} — место потока сдвигать не на что`);
  return z;
};

const rectsFor = (file, height) => {
  const v = miejsca[vieport(file)];
  if (!v) throw new Error(`в miejsca.json нет ключа «${vieport(file)}» для ${file}`); // [F7] отказ по файлу, не падение всего прогона
  const s = scrollYFor(file, v);
  const rects = (v.miejsca ?? []).map((m) => {
    if (![m.x, m.y, m.w, m.h].every(num)) throw new Error(`место «${m.nazwa}»: x/y/w/h обязаны быть числами (строка «"50"» даёт x1 = "5010")`); // [F8]
    if (m.fixed) {
      const h = isFull(file) && m.naWysokosc ? height : m.h; // [F5]
      return { ...m, y0: m.y, y1: m.y + h, x0: m.x, x1: m.x + m.w };
    }
    return { ...m, y0: m.y - s, y1: m.y + m.h - s, x0: m.x, x1: m.x + m.w };
  });
  // [F3] fixed рисуются поверх потока (z-index 40/50/60) — они сверяются первыми независимо от порядка в json
  return [...rects.filter((r) => r.fixed), ...rects.filter((r) => !r.fixed)];
};

// [F9] остаток — полосами строк (разрыв > 20 строк — новая полоса), с максимумом каждой, а не одной рамкой на всё
const GAP = 20;
const addToBands = (bands, x, y, dd) => {
  const g = bands[bands.length - 1];
  if (g && y - g.y1 <= GAP) { g.y1 = y; g.n += 1; g.max = Math.max(g.max, dd); g.x0 = Math.min(g.x0, x); g.x1 = Math.max(g.x1, x); }
  else bands.push({ y0: y, y1: y, x0: x, x1: x, n: 1, max: dd });
};

const files = readdirSync(etalonDir).filter((f) => f.endsWith('.png')).sort();
const lishnie = readdirSync(snyatoeDir).filter((f) => f.endsWith('.png') && !files.includes(f)).sort(); // [F4]
const out = [];
for (const file of files) {
  let a, b, rects;
  try {
    a = decodePng(readFileSync(join(etalonDir, file)));
    b = decodePng(readFileSync(join(snyatoeDir, file)));
    rects = rectsFor(file, Math.min(a.height, b.height));
  } catch (e) {
    out.push({ file, error: e.message });
    continue;
  }
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  // [F10] не сравнённая площадь — числом и рамкой, а не молча
  const neSravneno = a.width * a.height + b.width * b.height - 2 * w * h;
  const sizes = a.width === b.width && a.height === b.height ? 'равны' : `РАЗОШЛИСЬ ${a.width}×${a.height} → ${b.width}×${b.height}: сравнена общая часть ${w}×${h}, ВНЕ СРАВНЕНИЯ ${neSravneno} px (${neSravneno * 3} субпикселей) — строка таблицы обязательна`;
  const counts = new Map(); // nazwa -> { n, max }
  const spor = new Map(); // «a|b» -> n — пиксель попал в два места потока сразу [F3]
  let rest = 0;
  let restMax = 0;
  const bands = [];
  let total = 0;
  let max = 0;
  const ca = a.channels;
  const cb = b.channels;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ia = (y * a.width + x) * ca;
      const ib = (y * b.width + x) * cb;
      let d = 0;
      let dmax = 0;
      for (let c = 0; c < 3; c++) {
        const dd = Math.abs(a.data[ia + c] - b.data[ib + c]);
        if (dd) { d += 1; if (dd > dmax) dmax = dd; }
      }
      if (!d) continue;
      total += d;
      if (dmax > max) max = dmax;
      const hits = rects.filter((r) => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1);
      const r = hits[0];
      if (r) {
        const c = counts.get(r.nazwa) ?? { n: 0, max: 0 };
        c.n += d; if (dmax > c.max) c.max = dmax; counts.set(r.nazwa, c);
        if (!r.fixed && hits.length > 1) { const k = hits.map((q) => q.nazwa).join('|'); spor.set(k, (spor.get(k) ?? 0) + d); }
        // [F11] шапка и рейка полупрозрачны (backdrop-filter): дифф под ними может идти от потока — считаем, что лежит под fixed-местом
        if (r.fixed) for (const q of hits.slice(1)) { if (!q.fixed) { c.под ??= {}; c.под[q.nazwa] = (c.под[q.nazwa] ?? 0) + d; } }
      } else {
        rest += d; if (dmax > restMax) restMax = dmax;
        addToBands(bands, x, y, dmax);
      }
    }
  }
  out.push({
    file, sizes, total, max,
    места: Object.fromEntries([...counts].map(([k, v]) => [k, v])),
    спорно: Object.fromEntries(spor),
    остаток: rest, остаток_макс: restMax,
    остаток_полосы: bands.map((g) => ({ x: g.x0, y: g.y0, w: g.x1 - g.x0 + 1, h: g.y1 - g.y0 + 1, px: g.n, max: g.max })),
    вне_сравнения: neSravneno,
  });
}
for (const f of lishnie) out.push({ file: f, error: 'есть в снятом, нет в эталоне — кадр без судьи' }); // [F4]

for (const r of out) {
  if (r.error) { console.log(`${r.file}: ОШИБКА ${r.error}`); continue; }
  const места = Object.entries(r.места).map(([k, v]) => `${k}: ${v.n} (макс ${v.max}${v.под ? `; под ней: ${Object.entries(v.под).map(([q, n]) => `${q} ${n}`).join(', ')}` : ''})`).join(', ') || '—';
  const спорно = Object.entries(r.спорно).map(([k, v]) => `${k}: ${v}`).join(', ');
  const полосы = r.остаток_полосы.map((g) => `${g.w}×${g.h} от (${g.x}, ${g.y}): ${g.px} px, макс ${g.max}`).join('; ');
  console.log(`${r.file}: размеры ${r.sizes}; различных субпикселей ${r.total}, макс ${r.max}; по местам — ${места}${спорно ? `; СПОРНО (два места потока разом) — ${спорно}` : ''}; ОСТАТОК ${r.остаток}${r.остаток ? ` (макс ${r.остаток_макс}; полос ${r.остаток_полосы.length}: ${полосы})` : ''}`);
}
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(out, null, 2) + '\n');
