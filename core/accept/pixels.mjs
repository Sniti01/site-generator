#!/usr/bin/env node
/**
 * Приёмка, шаг 3: попиксельное сравнение кадров.
 *
 *   node core/accept/pixels.mjs <эталон.png> <новый.png>
 *
 * Считает то, что записывают отчёты: долю различных субпикселей, максимум
 * отклонения из 255, рамку различий и распределение отклонений. Меряется
 * по трём каналам на пиксель — альфа в счёт не идёт: кадры непрозрачны,
 * а знаменатель обязан совпадать с записанным (1440 × 900 × 3 = 3 888 000).
 *
 * **Скриншоты — вторичная проверка** (`MIGRATION.md` §6). Основная — манифест:
 * он покрывает все 50 файлов, включая то, куда скриншот не дотянется. Гейтить
 * на байтах PNG нельзя: растеризация шрифтов между прогонами недетерминирована.
 * Поэтому здесь меряется расхождение, а приговор выносит человек по протоколу
 * «полный кадр — сторож, оконный — судья» (П12).
 *
 * **PNG читается своим кодом, без зависимостей** — тем же доводом, что xlsx
 * в `core/structure/clustering.mjs`: PNG это zlib и фильтры строк, а тянуть
 * ради двух чисел бинарный пакет в ядро дороже, чем прочитать формат.
 * Поддержаны восьмибитные RGB и RGBA без чересстрочности — то, что снимает
 * Chromium; всё прочее роняет инструмент с внятным сообщением, а не молча.
 */

import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { sep } from 'node:path';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** @returns {{width: number, height: number, channels: number, data: Buffer}} */
export function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(SIGNATURE)) throw new Error('это не PNG: подпись не совпала');
  let p = 8;
  let ihdr = null;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('ascii', p + 4, p + 8);
    const body = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') {
      ihdr = {
        width: body.readUInt32BE(0),
        height: body.readUInt32BE(4),
        bitDepth: body[8],
        colorType: body[9],
        interlace: body[12],
      };
    } else if (type === 'IDAT') idat.push(body);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  if (!ihdr) throw new Error('в PNG нет IHDR');
  if (ihdr.bitDepth !== 8) throw new Error(`глубина ${ihdr.bitDepth} бит не поддержана — Chromium снимает 8`);
  if (ihdr.interlace !== 0) throw new Error('чересстрочный PNG не поддержан');
  const channels = ihdr.colorType === 2 ? 3 : ihdr.colorType === 6 ? 4 : 0;
  if (!channels) throw new Error(`тип цвета ${ihdr.colorType} не поддержан — ожидались 2 (RGB) или 6 (RGBA)`);

  const raw = inflateSync(Buffer.concat(idat));
  const { width, height } = ihdr;
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);

  // Расфильтровка строк: пять фильтров PNG, каждый опирается на левый пиксель,
  // строку выше и её левый пиксель. Порядок обхода строгий — сверху вниз.
  let src = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[src++];
    const line = raw.subarray(src, src + stride);
    src += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      const v = line[x];
      let value;
      if (filter === 0) value = v;
      else if (filter === 1) value = v + a;
      else if (filter === 2) value = v + b;
      else if (filter === 3) value = v + ((a + b) >> 1);
      else if (filter === 4) {
        const pp = a + b - c;
        const pa = Math.abs(pp - a);
        const pb = Math.abs(pp - b);
        const pc = Math.abs(pp - c);
        value = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      } else throw new Error(`неизвестный фильтр строки: ${filter}`);
      cur[x] = value & 0xff;
    }
  }
  return { width, height, channels, data: out };
}

/**
 * Сравнение двух разобранных кадров по трём каналам на пиксель.
 * Размеры обязаны совпасть: разная высота — сама по себе находка, и списывать
 * её в проценты нельзя (`MIGRATION.md` §6, про длину полного кадра).
 */
export function comparePixels(a, b) {
  if (a.width !== b.width || a.height !== b.height) {
    return { размеры: 'разошлись', было: [a.width, a.height], стало: [b.width, b.height] };
  }
  const { width, height } = a;
  const total = width * height * 3;
  let diff = 0;
  let max = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  const hist = { '1': 0, '2–4': 0, '5–16': 0, '17–64': 0, '65–255': 0 };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ia = (y * width + x) * a.channels;
      const ib = (y * width + x) * b.channels;
      let touched = false;
      for (let k = 0; k < 3; k++) {
        const d = Math.abs(a.data[ia + k] - b.data[ib + k]);
        if (d === 0) continue;
        diff += 1;
        touched = true;
        if (d > max) max = d;
        if (d === 1) hist['1'] += 1;
        else if (d <= 4) hist['2–4'] += 1;
        else if (d <= 16) hist['5–16'] += 1;
        else if (d <= 64) hist['17–64'] += 1;
        else hist['65–255'] += 1;
      }
      if (touched) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return {
    размеры: [width, height],
    субпикселей: total,
    различных: diff,
    доля: diff / total,
    максимум: max,
    рамка: maxX < 0 ? null : { x: minX, y: minY, ширина: maxX - minX + 1, высота: maxY - minY + 1 },
    распределение: hist,
  };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(sep).join('/'))) {
  const [, , one, two] = process.argv;
  if (!one || !two) {
    console.error('node core/accept/pixels.mjs <эталон.png> <новый.png>');
    process.exit(2);
  }
  const r = comparePixels(decodePng(readFileSync(one)), decodePng(readFileSync(two)));
  if (r.размеры === 'разошлись') {
    console.log(`размеры разошлись: ${r.было.join('×')} против ${r.стало.join('×')} — сравнивать субпиксели нечего.`);
    console.log('Разная высота полного кадра — находка сама по себе: чаще всего не прокручен низ перед съёмкой.');
  } else if (r.различных === 0) {
    console.log(`кадры совпали побайтово по цвету: ${r.субпикселей} субпикселей, 0 различий`);
  } else {
    const pct = (r.доля * 100).toFixed(3).replace('.', ',');
    console.log(`различных субпикселей: ${r.различных} из ${r.субпикселей} — ${pct} %, максимум ${r.максимум} из 255`);
    console.log(`рамка различий: ${r.рамка.ширина}×${r.рамка.высота} от (${r.рамка.x}, ${r.рамка.y})`);
    console.log('распределение отклонений: ' + Object.entries(r.распределение).map(([k, v]) => `${k}: ${v}`).join(', '));
  }
}
