// Крюк загрузки: мутант судьи в памяти (файлы репозитория не трогаются). Режим — из data.
let rezhim = '';
export async function initialize(d) {
  rezhim = d.rezhim;
}
const SUDYA = 'file:///d:/seo/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';
const MUTANTY = {
  // S2R3-Z-2: сверка меток героя с .hero__text выключена.
  metki: ['if (!metki(hero) || metki(hero) !== metki(tekstGeroya)) vne.push(', 'if (false) vne.push('],
  net: null,
};
export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  const m = MUTANTY[rezhim];
  if (m && url.toLowerCase() === SUDYA) {
    const s = String(r.source);
    if (!s.includes(m[0])) throw new Error(`крюк ${rezhim}: нет строки`);
    console.log(`КРЮК ПРИМЕНЁН: ${rezhim}`);
    return { ...r, source: s.replace(m[0], m[1]), shortCircuit: true };
  }
  return r;
}
