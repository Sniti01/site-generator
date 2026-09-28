// Крюк загрузчика: подменяет исходник tools/znak.mjs в памяти (перечень замен из data), файл на диске не трогается.
let m = null;
export async function initialize(data) {
  m = data ? JSON.parse(data) : null;
}
export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  if (m && /\/tools\/znak\.mjs$/.test(url)) {
    let s = typeof r.source === 'string' ? r.source : Buffer.from(r.source).toString('utf8');
    for (const [iz, na] of m.zameny) {
      const n = s.split(iz).length - 1;
      if (n !== 1) throw new Error(`мутация «${m.imya}»: замена встречается ${n} раз`);
      s = s.replace(iz, () => na);
    }
    return { ...r, source: s };
  }
  return r;
}
