// Крюк загрузки: мутант судьи в памяти (файлы репозитория не трогаются).
let rezhim = '';
export async function initialize(d) {
  rezhim = d.rezhim;
}
const SUDYA = 'file:///d:/seo/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';
const MUTANTY = {
  // Метки области героя не сверяются с .hero__text (правила .hero ядра — position:relative, overflow:hidden — не достают).
  metkiGeroya: [SUDYA, 'if (!metki(hero) || metki(hero) !== metki(tekstGeroya)) vne.push(', 'if (false) vne.push('],
  // <main> — любой id, а не id="content".
  mainId: [SUDYA, "lishnie(main, (a) => a.name === 'id' && a.value === 'content')", "lishnie(main, (a) => a.name === 'id')"],
};
export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  const m = MUTANTY[rezhim];
  if (m && url.toLowerCase() === m[0]) {
    const s = String(r.source);
    if (!s.includes(m[1])) throw new Error(`крюк ${rezhim}: нет «${m[1]}»`);
    console.log(`КРЮК ПРИМЕНЁН: ${rezhim}`);
    return { ...r, source: s.replace(m[1], m[2]), shortCircuit: true };
  }
  return r;
}
