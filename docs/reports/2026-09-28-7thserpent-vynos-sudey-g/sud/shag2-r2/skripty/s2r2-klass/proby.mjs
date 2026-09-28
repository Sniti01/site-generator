// Скептик s2r2-klass: члены класса «на шести страницах подпись кадра героя не исчезнет и не перестанет говорить
// о кадре молча» после правки 2434229. Репозиторий — только чтение; HTML и содержание портятся в памяти.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sverkaStranicy, vhody } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';
import { OBYAZATELNAYA_PODPIS } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/gates/sverka.mjs';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const V = vhody(SAYT);
const OB = new Set(OBYAZATELNAYA_PODPIS);
const klon = (o) => JSON.parse(JSON.stringify(o));
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
const P = /(<p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>)([\s\S]*?)(<\/p>)/;
// Обёртка вокруг div.geroy (между <main> и обёрткой героя).
const vokrugGeroya = (otkr, zakr) => (h) => zamena(zamena(h, '<main id="content"><div class="geroy', `<main id="content">${otkr}<div class="geroy`), /<\/section>(\s*)<\/div>/, (m, pr) => `</section>${pr}</div>${zakr}`);
// Обёртка вокруг <main> целиком.
const vokrugMain = (otkr, zakr) => (h) => zamena(zamena(h, '<main id="content">', `${otkr}<main id="content">`), '</main>', `</main>${zakr}`);
const uGeroya = (a) => (h) => zamena(h, '<section class="hero" ', `<section class="hero" ${a} `);
const klassGeroya = (k, a) => (h) => zamena(h, '<section class="hero" aria-labelledby="page-title" data-astro-cid-m3tnyskv>', `<section class="hero ${k}" aria-labelledby="page-title" data-astro-cid-m3tnyskv ${a}>`);
const uMain = (a) => (h) => zamena(h, '<main id="content"', `<main id="content" ${a}`);
const tekstPodpisi = (t) => ({ html: (h) => zamena(h, P, (m, o, _x, z) => o + t + z), dane: (d) => ((d.artCaption = t), d) });

const SLUCHAI = [
  ['контроль', 'без порчи', {}],
  ['контроль', 'hidden у героя (ловится)', { html: uGeroya('hidden') }],
  ['контроль', 'класс .hidden у героя (ловится)', { html: klassGeroya('hidden', '') }],
  // Скрытие предком-элементом, которого браузер не рисует (имя, а не атрибут)
  ['предок-элемент', '<details> между <main> и div.geroy', { html: vokrugGeroya('<details>', '</details>') }],
  ['предок-элемент', '<dialog> между <main> и div.geroy', { html: vokrugGeroya('<dialog>', '</dialog>') }],
  ['предок-элемент', '<noscript> между <main> и div.geroy', { html: vokrugGeroya('<noscript>', '</noscript>') }],
  ['предок-элемент', '<datalist> между <main> и div.geroy', { html: vokrugGeroya('<datalist>', '</datalist>') }],
  ['предок-элемент', '<canvas> между <main> и div.geroy', { html: vokrugGeroya('<canvas>', '</canvas>') }],
  ['предок-элемент', '<video> между <main> и div.geroy', { html: vokrugGeroya('<video>', '</video>') }],
  ['предок-элемент', '<audio> между <main> и div.geroy', { html: vokrugGeroya('<audio>', '</audio>') }],
  // Скрытие предком вне <main>
  ['предок вне main', '<div hidden> вокруг <main>', { html: vokrugMain('<div hidden>', '</div>') }],
  ['предок вне main', '<div aria-hidden="true"> вокруг <main>', { html: vokrugMain('<div aria-hidden="true">', '</div>') }],
  ['предок вне main', '<div inert> вокруг <main>', { html: vokrugMain('<div inert>', '</div>') }],
  ['предок вне main', '<details> вокруг <main>', { html: vokrugMain('<details>', '</details>') }],
  ['предок вне main', '<noscript> вокруг <main>', { html: vokrugMain('<noscript>', '</noscript>') }],
  ['предок вне main', '<div class="visually-hidden"> вокруг <main>', { html: vokrugMain('<div class="visually-hidden">', '</div>') }],
  // Класс скрытия сайта (не ядра) с меткой области у предка
  ['класс сайта', 'section.hero .hdr__burger-close + метка шапки (display:none всегда)', { html: klassGeroya('hdr__burger-close', 'data-astro-cid-qu2zoq4f') }],
  ['класс сайта', 'section.hero .hdr__drawer + метка шапки (display:none при ширине ≥ 961px)', { html: klassGeroya('hdr__drawer', 'data-astro-cid-qu2zoq4f') }],
  ['класс сайта', 'section.hero .hdr__nav + метка шапки (display:none при ширине ≤ 960px)', { html: klassGeroya('hdr__nav', 'data-astro-cid-qu2zoq4f') }],
  ['класс сайта', '<main> .hdr__burger-close + метка шапки', { html: uMain('class="hdr__burger-close" data-astro-cid-qu2zoq4f') }],
  // Роль предка с «детьми-представлением»: скринридер не получает текста подписи
  ['роль предка', 'role="img" aria-label у section.hero', { html: uGeroya('role="img" aria-label="Max Payne"') }],
  ['роль предка', 'role="button" у section.hero', { html: uGeroya('role="button"') }],
  ['роль предка', 'role="img" aria-label у div.geroy', { html: (h) => zamena(h, '<div class="geroy', '<div role="img" aria-label="Max Payne" class="geroy') }],
  ['роль предка', 'role="img" aria-label у <main>', { html: uMain('role="img" aria-label="Max Payne"') }],
  // Видимый текст: невидимые знаки не из Cf и не из списка пустышек vidimyi
  ['видимый текст', 'artCaption = U+FE0F (селектор варианта, Mn)', tekstPodpisi('\uFE0F')],
  ['видимый текст', 'artCaption = U+FE00…U+FE0F', tekstPodpisi('\uFE00\uFE01\uFE0E\uFE0F')],
  ['видимый текст', 'artCaption = U+17B4 (кхмерская немая гласная, Mn)', tekstPodpisi('\u17B4')],
  ['видимый текст', 'artCaption = U+180B (монгольский селектор, Mn)', tekstPodpisi('\u180B')],
  ['видимый текст', 'artCaption = U+E0100 (селектор варианта 17, Mn)', tekstPodpisi('\u{E0100}')],
];

let molchit = 0;
for (const [gruppa, imya, x] of SLUCHAI) {
  const itog = [];
  for (const url of OBYAZATELNAYA_PODPIS) {
    const s = po(url);
    const html = x.html ? x.html(s.html) : s.html;
    const dane = x.dane ? x.dane(klon(s.dane)) : s.dane;
    const z = sver(s.page, dane, html);
    itog.push(z.length ? 'ЛОВИТ' : 'МОЛЧИТ');
    if (url === '/mods/' && z.length) itog.push(`(${z.join(' | ').slice(0, 160)})`);
  }
  const m = itog.filter((y) => y === 'МОЛЧИТ').length;
  if (gruppa !== 'контроль' && m) molchit += 1;
  console.log(`[${gruppa}] ${imya}: молчит ${m} из 6 ${m < 6 ? itog.join(' ') : ''}`);
}
console.log(`случаев, где сверка молчит хотя бы на одной странице: ${molchit}`);
