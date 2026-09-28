// Крюк загрузки проверяющего: мутант судьи в памяти (файлы репозитория не трогаются).
let rezhim = '';
export async function initialize(d) {
  rezhim = d.rezhim;
}
const SUDYA = 'file:///d:/seo/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';
const MUTANTY = {
  khuk: ['sverkaSborki(fileURLToPath(dir), koren, { obyazatelnaPodpis: new Set(obyazatelnaPodpis) })', 'sverkaSborki(fileURLToPath(dir), koren, { obyazatelnaPodpis: new Set() })'],
  metki: ['if (!metki(p) || (h1[0] && metki(p) !== metki(h1[0])))', 'if (!metki(p))'],
  klassy: ["const SKRYTIE_KLASSY = ['visually-hidden', 'skip-link', 'sr-only', 'hidden', 'invisible'];", 'const SKRYTIE_KLASSY = [];'],
  popover: ["const SKRYTIE_ATR = ['hidden', 'aria-hidden', 'inert', 'popover'];", "const SKRYTIE_ATR = ['hidden', 'aria-hidden', 'inert'];"],
  // свой мутант: скрытие предком не судится вовсе (фильтр предков пуст)
  predki: ['.filter((u) => u === main || predki(u).includes(main))', '.filter(() => false)'],
};
export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  const m = MUTANTY[rezhim];
  if (m && url.toLowerCase() === SUDYA) {
    const s = String(r.source);
    if (!s.includes(m[0])) throw new Error(`крюк ${rezhim}: нет «${m[0]}»`);
    console.log(`КРЮК ПРИМЕНЁН: ${rezhim}`);
    return { ...r, source: s.replace(m[0], m[1]), shortCircuit: true };
  }
  return r;
}
