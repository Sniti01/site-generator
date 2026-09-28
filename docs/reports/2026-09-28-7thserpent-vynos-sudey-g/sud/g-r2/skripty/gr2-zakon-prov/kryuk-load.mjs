// Крюк загрузчика: подменяет исходник tools/znak.mjs в памяти заменами [{ iz, na }] (каждая — ровно один раз).
let m = null;
export async function initialize(data) {
  m = data ? JSON.parse(data) : null;
}
export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  if (m && /\/sites\/7thserpent\.com\/tools\/znak\.mjs$/.test(url)) {
    let s = typeof r.source === 'string' ? r.source : Buffer.from(r.source).toString('utf8');
    for (const z of m.zameny) {
      const k = s.split(z.iz).length - 1;
      if (k !== 1) throw new Error(`мутация «${m.imya}»: «${z.iz.slice(0, 60)}» встречается ${k} раз`);
      s = s.replace(z.iz, () => z.na);
    }
    return { ...r, source: s };
  }
  return r;
}
