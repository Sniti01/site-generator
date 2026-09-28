// Крюк загрузки: мутант хука сторожа в памяти (файл репозитория не трогается) — хук зовёт sverkaSborki без списка.
const SUDYA = 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';
const IZ = 'sverkaSborki(fileURLToPath(dir), koren, { obyazatelnaPodpis: new Set(obyazatelnaPodpis) })';
const NA = 'sverkaSborki(fileURLToPath(dir), koren)';
export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  if (url.replace(/^file:\/\/\/d:/i, 'file:///D:') === SUDYA) {
    const s = String(r.source);
    if (!s.includes(IZ)) throw new Error('крюк: строки хука нет');
    return { ...r, source: s.replace(IZ, NA), shortCircuit: true };
  }
  return r;
}
