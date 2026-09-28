// Крюк загрузки: подменяет исходник судьи или данных сверки в памяти (файлы репозитория не трогаются).
let rezhim = {};
export async function initialize(d) {
  rezhim = d;
}
const SUDYA = 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';
const DANNYE = 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/gates/sverka.mjs';
const zamena = (s, iz, na) => {
  if (!s.includes(iz)) throw new Error(`крюк: нет «${iz}»`);
  return s.replace(iz, na);
};
export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  const u = url.replace(/^file:\/\/\/d:/i, 'file:///D:');
  if (rezhim.sudya && u === SUDYA) {
    const s = zamena(String(r.source), 'if (obyazatelnaPodpis.has(page.url) && !dane.artCaption)', "if (new Set(['/remake/', '/movie/', '/media/', '/mods/', '/quotes/', '/voice-and-face/']).has(page.url) && !dane.artCaption)");
    return { ...r, source: s, shortCircuit: true };
  }
  if (rezhim.dannye && u === DANNYE) {
    const s = zamena(String(r.source), "['/remake/', '/movie/', '/media/', '/mods/', '/quotes/', '/voice-and-face/']", "['/remake/', '/movie/']");
    return { ...r, source: s, shortCircuit: true };
  }
  return r;
}
