// Крюк загрузки: мутант судьи или данных сверки в памяти (файлы репозитория не трогаются).
let rezhim = '';
export async function initialize(d) {
  rezhim = d.rezhim;
}
const SUDYA = 'file:///d:/seo/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';
const DANNYE = 'file:///d:/seo/cloud/site-generator/sites/7thserpent.com/gates/sverka.mjs';
const MUTANTY = {
  // Сторож сборки несёт список на объекте, но хук судит с пустым.
  khuk: [SUDYA, 'sverkaSborki(fileURLToPath(dir), koren, { obyazatelnaPodpis: new Set(obyazatelnaPodpis) })', 'sverkaSborki(fileURLToPath(dir), koren, { obyazatelnaPodpis: new Set() })'],
  // Метка области подписи — только «непустая», без сверки с h1.
  metki: [SUDYA, 'if (!metki(p) || (h1[0] && metki(p) !== metki(h1[0])))', 'if (!metki(p))'],
  // Классы скрытия у предков не судятся вовсе.
  klassy: [SUDYA, "const SKRYTIE_KLASSY = ['visually-hidden', 'skip-link', 'sr-only', 'hidden', 'invisible'];", 'const SKRYTIE_KLASSY = [];'],
  // popover у предка не судится.
  popover: [SUDYA, "const SKRYTIE_ATR = ['hidden', 'aria-hidden', 'inert', 'popover'];", "const SKRYTIE_ATR = ['hidden', 'aria-hidden', 'inert'];"],
  // Предлагаемая правка ложного отказа: замечание — только о знаках управления направлением.
  cfbidi: [SUDYA, '.filter((c) => /\\p{Cf}/u.test(c))', '.filter((c) => /[\\u202A-\\u202E\\u2066-\\u2069]/u.test(c))'],
  // Данные сверки — прежний список из двух.
  dannye: [DANNYE, "['/remake/', '/movie/', '/media/', '/mods/', '/quotes/', '/voice-and-face/']", "['/remake/', '/movie/']"],
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
