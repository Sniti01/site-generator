// Крюк загрузчика: исходник tools/znak.mjs подменяется в памяти текстом из файла (прежняя редакция), диск не трогается.
import { readFileSync } from 'node:fs';

let put = null;
export async function initialize(data) {
  put = data || null;
}
export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  if (put && /\/tools\/znak\.mjs$/.test(url)) return { ...r, source: readFileSync(put, 'utf8') };
  return r;
}
