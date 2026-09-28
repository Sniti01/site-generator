/**
 * Сравнение двух сборок сайта — для B1-G-12 (`sborka.test.mjs`: копия с ядром-копией = копия с ядром-ссылкой,
 * «копия = сайт») и тестов без сборки (`sravnenie.test.mjs`; раунд 4 «судью судят» блока Б, R4-B-K-3,
 * R4-B-Z-5: сравнение вынесено сюда, чтобы его сторожили тесты на поддельных сборках).
 *
 * Значение `data-astro-cid-*` компонента ядра зависит от того, где лежит файл ядра: у копии с ядром-копией
 * оно своё на каждую копию (замер сессии 20: CSS той же длины, правила те же, разнятся только эти значения
 * и хеши в именах CSS). Здесь — всё остальное: те же файлы, те же байты картинок и шрифтов, тот же текст
 * CSS и HTML без значений cid. CSS с одним именем до хеша — группа, её содержимое сравнивается
 * мультимножеством (два `index.*.css` — оба в сравнении, B3-8). Ссылка на CSS сборки в HTML — не имя
 * без хеша, а имя и отпечаток содержимого того файла, на который она ведёт (sha256 текста без значений
 * cid): какая страница какой CSS группы подключает, тоже сравнивается — обмен CSS группы между страницами
 * или переход страницы на чужой CSS группы даёт различие (R4-B-K-2, R4-B-Z-8).
 * ПРЕДЕЛЫ: ссылка на CSS, которого в сборке нет, — имя и «нет-файла» (обе сборки без файла — равны);
 * ссылки CSS на CSS внутри CSS — имя без хеша (связь CSS → CSS не сравнивается); имя CSS с точкой
 * до хеша в группу не сводится (ключи сборок разные — различие, строже).
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

/** Файлы сборки — пути от её корня. */
export function faily(koren) {
  const out = [];
  const obhod = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) obhod(join(d, e.name));
      else out.push(relative(koren, join(d, e.name)).replace(/\\/g, '/'));
    }
  };
  obhod(koren);
  return out.sort();
}

const SSYLKA_CSS = /\/(_astro\/[A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+\.css/g;
/** Текст CSS для сравнения: значения cid сведены, ссылки на CSS — имя без хеша. */
export const bezCid = (s) => s.replace(/data-astro-cid-[a-z0-9]+/g, 'data-astro-cid-X').replace(SSYLKA_CSS, '/$1.css');
/** Отпечатки CSS сборки: путь от корня → sha256 текста без значений cid (первые 16 знаков). */
const otpechatki = (koren, spisok) =>
  new Map(spisok.filter((f) => f.endsWith('.css')).map((f) => [f, createHash('sha256').update(bezCid(readFileSync(join(koren, f), 'utf8'))).digest('hex').slice(0, 16)]));
/** Текст HTML для сравнения: значения cid сведены, ссылка на CSS сборки — имя и отпечаток содержимого её файла (R4-B-K-2). */
const tekstHtml = (s, otp) =>
  s.replace(/data-astro-cid-[a-z0-9]+/g, 'data-astro-cid-X').replace(SSYLKA_CSS, (m, imya) => `/${imya}.${otp.get(m.slice(1)) ?? 'нет-файла'}.css`);
export const imyaBezHesha = (f) => (f.endsWith('.css') ? f.replace(/^(_astro\/[A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+\.css$/, '$1.css') : f);

/** Файлы по имени без хеша CSS: группы, а не ключи (два `index.*.css` — два файла одной группы, B3-8). */
export function gruppy(spisok) {
  const g = new Map();
  for (const f of spisok) {
    const k = imyaBezHesha(f);
    if (!g.has(k)) g.set(k, []);
    g.get(k).push(f);
  }
  return g;
}

/**
 * Разные группы двух сборок `a` и `b` (папки): ключи групп, которых нет в одной из сборок, и группы
 * с разным содержимым; пустой список — сборки равны.
 */
export function sravnitSborki(a, b) {
  const fa = faily(a);
  const fb = faily(b);
  const ga = gruppy(fa);
  const gb = gruppy(fb);
  const otp = new Map([[a, otpechatki(a, fa)], [b, otpechatki(b, fb)]]);
  // Содержимое группы — мультимножество: тексты CSS и HTML без значений cid (в HTML ссылка на CSS —
  // с отпечатком содержимого), прочее — байты (base64).
  const odin = (koren, f) => {
    if (f.endsWith('.css')) return bezCid(readFileSync(join(koren, f), 'utf8'));
    if (f.endsWith('.html')) return tekstHtml(readFileSync(join(koren, f), 'utf8'), otp.get(koren));
    return readFileSync(join(koren, f)).toString('base64');
  };
  const soderzhimoe = (koren, fajly) => fajly.map((f) => odin(koren, f)).sort();
  const klyuchi = [...new Set([...ga.keys(), ...gb.keys()])].sort();
  return klyuchi.filter((k) => !ga.has(k) || !gb.has(k) || JSON.stringify(soderzhimoe(a, ga.get(k))) !== JSON.stringify(soderzhimoe(b, gb.get(k))));
}
