// R4-B-K-1: своя проверка на синтетике теста phrases.test.mjs и на настоящей /quotes/.
import { readFileSync } from 'node:fs';
import { sudStranicy } from 'file:///D:/SEO/cloud/site-generator/core/gates/phrases.mjs';
import { ukazatelIzTekstov } from 'file:///D:/SEO/cloud/site-generator/core/text/corpus.mjs';
import { razobrat, elementy, imya, klassy, predki, atr } from 'file:///D:/SEO/cloud/site-generator/core/text/html.mjs';

const KORPUS = [
  { url: 'doc-b', vplotnuyu: ['My cover had been blown and the door slammed shut behind me at last'], cherezProbel: ['My cover had been blown and the door slammed shut behind me at last'] },
];
const uk = ukazatelIzTekstov(KORPUS, { imena: ['Max Payne 3'] });
const NAPOLNITEL = Array.from({ length: 120 }, (_, i) => `slovo${i}`).join(' ');
const stranica = (main) =>
  `<!doctype html><html><head><title>Title</title><meta name="description" content="Desc"><meta property="og:title" content="OG"><meta property="og:description" content="OGD"></head>` +
  `<body><main><p>${NAPOLNITEL}</p>${main}</main></body></html>`;
const REPLIKA = { klass: 'реплика', stranica: '/q/', tekst: 'My cover had been blown and the door slammed shut', ryad: { metka: /^Game · 2001/ }, posle: /^\s*[—–]\s*Chapter \d+\b/ };
const dannye = { imena: ['Max Payne 3'], isklyucheniya: [REPLIKA], minSlov: 100 };
const REP = '“My cover had been blown and the door slammed shut” — Chapter 8.';

// Метка у читателя со скриптами: первый .t-label секции r3, текст без содержимого <noscript>.
const metkaJS = (h) => {
  const d = razobrat(h, { skripty: true });
  const sek = elementy(d).find((u) => imya(u) === 'section' && atr(u, 'id') === 'r3');
  const m = elementy(sek).find((u) => klassy(u).has('t-label') && !predki(u).some((p) => imya(p) === 'noscript'));
  const t = (u) => (u.childNodes ?? []).map((x) => (x.nodeName === '#text' ? x.value : x.tagName && imya(x) !== 'noscript' ? t(x) : '')).join('');
  return m ? JSON.stringify(t(m).trim()) : 'нет элемента';
};
const metkaBezJS = (h) => {
  const d = razobrat(h);
  const sek = elementy(d).find((u) => imya(u) === 'section' && atr(u, 'id') === 'r3');
  const m = elementy(sek).find((u) => klassy(u).has('t-label') && !predki(u).some((p) => imya(p) === 'noscript'));
  const t = (u) => (u.childNodes ?? []).map((x) => (x.nodeName === '#text' ? x.value : x.tagName ? t(x) : '')).join('');
  return m ? JSON.stringify(t(m).trim()) : 'нет элемента';
};

const sek = (vnutri) => stranica(`<section class="layer" id="r3">${vnutri}<p>${REP}</p></section>`);
const sluchai = {
  'контроль: метка видима, своя': sek('<p class="t-label">Game · 2001</p>'),
  'контроль: чужая метка': sek('<p class="t-label">Other · 2012</p>'),
  'B3-2 форма теста': sek('<p class="t-label"><noscript>Game · 2001</noscript></p>'),
  'K-1 (а) скептика: div.t-label > p > noscript > p': sek('<div class="t-label"><p><noscript><p>Game · 2001</noscript></p></div>'),
  'K-1 (б) скептика: p.t-label в noscript вынесен, видна Other': sek('<div><p><noscript><p class="t-label">Game · 2001</noscript></p></div><p class="t-label">Other · 2012</p>'),
  'свой член: ul вместо p (ul закрывает p)': sek('<div class="t-label"><p><noscript><ul><li>Game · 2001</li></ul></noscript></p></div>'),
  'свой член: h3.t-label в noscript, вынесен, видна Other': sek('<div><p><noscript><h3 class="t-label">Game · 2001</h3></noscript></p></div><p class="t-label">Other · 2012</p>'),
  'свой член: noscript без внешнего p (не выносится)': sek('<div class="t-label"><noscript><p>Game · 2001</p></noscript></div>'),
};
for (const [k, h] of Object.entries(sluchai)) {
  const o = sudStranicy('/q/', h, uk, dannye).otkazy;
  console.log(`${k}\n  отказов ${o.length}; «не в своём ряду»: ${o.some((x) => x.includes('не в своём ряду'))}; метка без JS ${metkaBezJS(h)}; со скриптами ${metkaJS(h)}`);
}
