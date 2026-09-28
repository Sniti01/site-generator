// Набросок правки SV3-Z-1 (не в репозитории): верх прежней выкладки — из её собственной карты на сервере.
// Workflow скачивает рядом с index.html и sitemap-0.xml (mirror --no-recursion --include-glob=index.html
// --include-glob=sitemap-0.xml . remote-top); сторож берёт первые сегменты <loc> ТОЛЬКО на хосте KANON и только
// когда index.html — наш. papka принимает их как часть верха. Проверка: Z1a/Z1b/Z1e — проход, образцы SV2-O-1 — отказ.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const { papka, KANON } = await import(pathToFileURL(SAYT + '/tools/storozha-vykladki.mjs').href);
const PRIN = JSON.parse(readFileSync(SAYT + '/gates/sborka-prinyataya.json', 'utf8'));
const v816 = [...new Set(Object.keys(PRIN.fajly).map((f) => f.split('/')[0]))];

/** Первые сегменты адресов карты прежней выкладки (только наш канонический хост). */
export function verkhIzKarty(xml) {
  if (xml === null || xml === undefined) return [];
  return [...new Set([...String(xml).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
    .map((m) => m[1])
    .filter((u) => u.startsWith(KANON))
    .map((u) => decodeURIComponent(u.slice(KANON.length)).split('/')[0])
    .filter(Boolean))];
}
const karta = (puti, host = KANON) => `<?xml version="1.0"?><urlset>${puti.map((p) => `<url><loc>${host}${p}</loc></url>`).join('')}</urlset>`;
const kornevye = (a) => a.map((n) => (/\.[a-z0-9]+$/i.test(n) || n.startsWith('.') ? n : n + '/'));
const nash = '<!doctype html><html><head><link rel="canonical" href="https://www.7thserpent.com/"></head><body></body></html>';
const cls = (a) => ['./', '../', ...a].join('\n');
const stranicy816 = v816.filter((n) => !/\.[a-z0-9]+$/i.test(n) && !n.startsWith('.') && n !== '_astro' && n !== '404').map((n) => n + '/');
const sluchai = [
  ['Z1a потеряна max-payne-4/', cls(kornevye([...v816, 'max-payne-4'])), v816, karta([...stranicy816, 'max-payne-4/']), true],
  ['Z1b переименована max-payne-4/ → max-payne-4-remaster/', cls(kornevye([...v816, 'max-payne-4'])), [...v816, 'max-payne-4-remaster'], karta([...stranicy816, 'max-payne-4/']), true],
  ['Z1e «ящик»: remake/ → max-payne-remake/, новый список', cls(kornevye(v816)), [...v816.filter((n) => n !== 'remake'), 'max-payne-remake'], karta(stranicy816), true],
  ['SV2-O-1 P1a WordPress рядом (карта наша)', cls(['_astro/', 'index.html', 'wp-admin/', 'wp-content/', 'wp-config.php']), v816, karta(stranicy816), false],
  ['SV2-O-1 P1b guides/ первого сайта (карта первого сайта)', cls(['_astro/', 'guides/', 'index.html']), v816, karta(['guides/x/'], 'https://www.ac4bf-thewatch.com/'), false],
  ['SV2-O-1 P1d blog/ поддомена (карта наша, blog в ней нет)', cls(['_astro/', 'blog/', 'index.html']), v816, karta(stranicy816), false],
];
for (const [id, spisok, verkh, xml, zhdem] of sluchai) {
  const r = papka(spisok, nash, [...verkh, ...verkhIzKarty(xml)]);
  console.log(`${r.ok === zhdem ? 'как надо' : 'НЕ ТАК'} | ${id} | ${r.ok ? 'ПРОХОД' : 'ОТКАЗ'} — ${r.stroki.join(' / ').slice(0, 200)}`);
}
