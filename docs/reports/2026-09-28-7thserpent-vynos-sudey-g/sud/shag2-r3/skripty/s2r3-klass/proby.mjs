// Скептик s2r3-klass: пути мимо белого списка цепочки подписи кадра героя (правка e7c0795).
// Репозиторий — только чтение; HTML и содержание портятся в памяти.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sverkaStranicy, vhody } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';
import { OBYAZATELNAYA_PODPIS } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/gates/sverka.mjs';
import { razobrat, elementy, imya, klassy, predki, deti } from 'file:///D:/SEO/cloud/site-generator/core/text/html.mjs';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const V = vhody(SAYT);
const OB = new Set(OBYAZATELNAYA_PODPIS);
const po = (url) => ({
  page: V.struktura.pages.find((p) => p.url === url),
  dane: V.soderzhanie.find((s) => s.dane?.url === url)?.dane,
  html: readFileSync(join(DIST, url.slice(1), 'index.html'), 'utf8'),
});
const sver = (page, dane, html) => sverkaStranicy({ page, dane, html, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: OB });
const zamena = (s, iz, na) => {
  if (typeof iz === 'string' ? !s.includes(iz) : !iz.test(s)) throw new Error(`порча не применилась: ${String(iz).slice(0, 60)}`);
  return s.replace(iz, na);
};
const HERO = /(<section class="hero" aria-labelledby="page-title" data-astro-cid-m3tnyskv>)/;
const PODP = /(<p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>)/;
const vNachaloGeroya = (x) => (h) => zamena(h, HERO, `$1${x}`);
const pered = (x) => (h) => zamena(h, PODP, `${x}$1`);
const vNachaloMain = (x) => (h) => zamena(h, '<main id="content">', `<main id="content">${x}`);
const vNachaloBody = (x) => (h) => zamena(h, '<body>', `<body>${x}`);
const posleGeroya = (x) => (h) => zamena(h, /(<\/section>\s*<\/div>)/, `$1${x}`);
const vPodval = (x) => (h) => zamena(h, '<footer class="ft"', `${x}<footer class="ft"`);
const vGeroy = (x) => (h) => zamena(h, /(<div class="geroy[^>]*>)/, `$1${x}`);
const vPodpis = (x) => (h) => zamena(h, PODP, `$1${x}`);
const TEN = '<template shadowrootmode="open"></template>';
const SKRIPT = `parent.document.querySelector('.podpis-geroya').textContent='Pictured: Max Payne 3 (2012), not the remake'`;
const IFRAME = `<iframe hidden srcdoc="&lt;script&gt;${SKRIPT.replace(/'/g, '&#39;')}&lt;/script&gt;"></iframe>`;
const IFRAME_JS = `<iframe hidden src="javascript:${SKRIPT.replace(/'/g, '&#39;')}"></iframe>`;
const REFRESH = '<meta http-equiv="refresh" content="0; url=/max-payne-3/">';
const KREDIT = '<div class="foto__credit t-caption">Pictured: Max Payne 3 (2012), a scene from the game</div>';

const SLUCHAI = [
  ['контроль', 'без порчи', null],
  ['контроль', 'теневой корень в div.geroy (ловит «обёртка вплотную»)', vGeroy(TEN)],
  ['контроль', 'теневой корень в самой подписи (ловит «элементы в подписи»)', vPodpis(TEN)],
  ['контроль', 'foto__credit в .hero__art (ловит правило рамки арта)', (h) => zamena(h, '<div class="hero__art" data-astro-cid-m3tnyskv>', `<div class="hero__art" data-astro-cid-m3tnyskv>${KREDIT}`)],
  ['контроль', '<script> в <main> (ловит R4-V-K-4)', posleGeroya(`<script>${SKRIPT}</script>`)],
  ['теневой корень', 'пустой <template shadowrootmode> первым ребёнком section.hero', vNachaloGeroya(TEN)],
  ['теневой корень', 'пустой <template shadowrootmode> первым ребёнком <main>', vNachaloMain(TEN)],
  ['теневой корень', 'пустой <template shadowrootmode> первым ребёнком <body>', vNachaloBody(TEN)],
  ['теневой корень', 'шаблон с именованным слотом (светлые дети без slot= не рисуются) в section.hero', vNachaloGeroya('<template shadowrootmode="open"><slot name="x"></slot></template>')],
  ['перекрытие', 'div.foto__credit (z-index:3, absolute, top:0 right:0) — ребёнок section.hero перед подписью', pered(KREDIT)],
  ['скрипт мимо <script>', '<iframe srcdoc> со скриптом в <main> после героя (подменяет текст подписи)', posleGeroya(IFRAME)],
  ['скрипт мимо <script>', '<iframe srcdoc> со скриптом в section.hero перед подписью', pered(IFRAME)],
  ['скрипт мимо <script>', '<iframe src="javascript:"> в <main> после героя', posleGeroya(IFRAME_JS)],
  ['скрипт мимо <script>', '<iframe srcdoc> со скриптом перед подвалом (вне <main>)', vPodval(IFRAME)],
  ['другая страница', '<meta http-equiv="refresh"> в <main> после героя (на /max-payne-3/)', posleGeroya(REFRESH)],
  ['другая страница', '<meta http-equiv="refresh"> перед подвалом (вне <main>)', vPodval(REFRESH)],
];

// Проверка, что порча легла деревом так, как задумано (первая страница).
const proverkaDereva = (html) => {
  const doc = razobrat(html);
  const p = elementy(doc, (u) => klassy(u).has('podpis-geroya'))[0];
  const t = elementy(doc, (u) => imya(u) === 'template');
  const ifr = elementy(doc, (u) => imya(u) === 'iframe');
  const met = elementy(doc, (u) => imya(u) === 'meta' && u.attrs.some((a) => a.name === 'http-equiv'));
  return `цепочка ${predki(p).map(imya).join('<')}; template: ${t.map((x) => `${imya(x.parentNode)}.${[...klassy(x.parentNode)].join('.')}`).join(',') || '—'}; iframe: ${ifr.map((x) => imya(x.parentNode)).join(',') || '—'}; meta refresh: ${met.map((x) => imya(x.parentNode)).join(',') || '—'}`;
};

let molchit = 0;
for (const [gruppa, nazv, porcha] of SLUCHAI) {
  const itog = [];
  let derevo = '';
  let primer = '';
  for (const url of OBYAZATELNAYA_PODPIS) {
    const s = po(url);
    const html = porcha ? porcha(s.html) : s.html;
    if (!derevo) derevo = proverkaDereva(html);
    const z = sver(s.page, s.dane, html);
    itog.push(z.length ? 'ЛОВИТ' : 'МОЛЧИТ');
    if (z.length && !primer) primer = z.join(' | ').slice(0, 200);
  }
  const m = itog.filter((y) => y === 'МОЛЧИТ').length;
  if (gruppa !== 'контроль' && m) molchit += 1;
  console.log(`[${gruppa}] ${nazv}: молчит ${m} из 6 (${itog.join(' ')})${primer ? ` — ${primer}` : ''}\n    ${derevo}`);
}
console.log(`случаев вне контроля, где сверка молчит: ${molchit}`);
