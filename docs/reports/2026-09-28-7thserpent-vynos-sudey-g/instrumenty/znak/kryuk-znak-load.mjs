// Крюк загрузчика: подменяет исходник tools/znak.mjs в памяти (мутация из data), файл на диске не трогается.
let m = null;
export async function initialize(data) {
  m = data ? JSON.parse(data) : null;
}
export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  if (m && /\/tools\/znak\.mjs$/.test(url)) {
    const s = typeof r.source === 'string' ? r.source : Buffer.from(r.source).toString('utf8');
    if (!s.includes(m.iz)) throw new Error(`мутация «${m.imya}» не применилась`);
    return { ...r, source: s.replace(m.iz, m.na) };
  }
  return r;
}
