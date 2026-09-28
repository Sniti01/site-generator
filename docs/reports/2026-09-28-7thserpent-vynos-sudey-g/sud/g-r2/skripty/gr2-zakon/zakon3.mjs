// Путь сборки против пути судьи: плагин @tailwindcss/vite (его обработчик transform режима build, вызванный
// напрямую) не трогает лист, в котором нет AtApply|JsPluginCompat|ThemeFunction|Utilities|Variants, — @theme
// уходит на страницу сырым; судья (cssStranicy) собирает такой лист всегда.
//   node zakon3.mjs > zakon3.txt
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { sverka, wejscie } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const req = createRequire(`${SAYT}/package.json`);
const { default: tailwindcss } = await import(pathToFileURL(req.resolve('@tailwindcss/vite')).href);
const plaginy = tailwindcss();
const konfig = { root: SAYT, build: { ssr: false, cssMinify: true }, css: { devSourcemap: false }, resolve: {}, createResolver: () => async () => undefined };
await plaginy[0].configResolved(konfig);
const build = plaginy.find((p) => p.name === '@tailwindcss/vite:generate:build');
const ID = `${SAYT}/src/styles/global.css`;

const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
const ISH = "@import 'tailwindcss' source('../../src');";
const SLUCHAI = [
  ['контроль', ISH],
  ["только тема Tailwind: @import 'tailwindcss/theme.css'; (ноль утилит, сброс — reset.css ядра)", "@import 'tailwindcss/theme.css';"],
  ['без импорта Tailwind вовсе', ''],
];
for (const [imya, na] of SLUCHAI) {
  const w = czyste();
  if (w.css.split(ISH).length !== 2) throw new Error('порча не применилась');
  w.css = w.css.replace(ISH, () => na);
  const { bledy } = await sverka(w);
  const r = await build.transform.handler.call({ environment: undefined, addWatchFile() {} }, w.css, ID);
  const kod = r?.code ?? null;
  const fdVne = kod === null ? 'лист не тронут — на страницу идёт как есть' : `в выводе плагина --font-display: ${[...kod.matchAll(/--font-display:\s*([^;}]*)/g)].map((m) => m[1]).join(' | ') || 'нет'}`;
  console.log(`== ${imya}\n   судья: ${bledy.length ? `ОТКАЗ — ${bledy.join(' | ')}` : 'сверено'}\n   плагин Vite (build): ${fdVne}`);
  if (kod === null) console.log(`   в листе, который уходит дальше, @theme сырой: ${/\n@theme \{/.test(w.css)}`);
}
