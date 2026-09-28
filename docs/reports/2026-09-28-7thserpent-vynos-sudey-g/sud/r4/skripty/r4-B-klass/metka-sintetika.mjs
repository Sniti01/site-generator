// Раунд 4, блок Б: будущий падающий тест R4-B-K-1 на синтетике phrases.test.mjs (те же KORPUS, stranica, REP, dannye).
import { sudStranicy } from 'file:///D:/SEO/cloud/site-generator/core/gates/phrases.mjs';
import { ukazatelIzTekstov } from 'file:///D:/SEO/cloud/site-generator/core/text/corpus.mjs';

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

const sluchai = {
  'контроль B3-2 (как в тесте)': `<section class="layer" id="r3"><p class="t-label"><noscript>Game · 2001</noscript></p><p>${REP}</p></section>`,
  'текст метки: <noscript> вынесен (<p> закрывает <p>)': `<section class="layer" id="r3"><div class="t-label"><p><noscript><p>Game · 2001</noscript></p></div><p>${REP}</p></section>`,
  'элемент метки: <noscript> вынесен, видимая метка «Other · 2012»': `<section class="layer" id="r3"><div><p><noscript><p class="t-label">Game · 2001</noscript></p></div><p class="t-label">Other · 2012</p><p>${REP}</p></section>`,
};
for (const [k, m] of Object.entries(sluchai)) {
  const o = sudStranicy('/q/', stranica(m), uk, dannye).otkazy;
  console.log(`${k}: «не в своём ряду» — ${o.some((x) => x.includes('не в своём ряду')) ? 'есть' : 'НЕТ'}`);
}
