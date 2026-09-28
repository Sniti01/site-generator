// Крюк загрузчика: несколько замен в исходнике tools/znak.mjs в памяти (список из data); файл на диске не трогается.
let spisok = [];
export async function initialize(data) {
  spisok = data ? JSON.parse(data) : [];
}
export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  if (spisok.length && /\/tools\/znak\.mjs$/.test(url)) {
    let s = typeof r.source === 'string' ? r.source : Buffer.from(r.source).toString('utf8');
    for (const m of spisok) {
      if (s.split(m.iz).length !== 2) throw new Error(`замена «${m.imya}» не применилась`);
      s = s.replace(m.iz, () => m.na);
    }
    return { ...r, source: s };
  }
  return r;
}
