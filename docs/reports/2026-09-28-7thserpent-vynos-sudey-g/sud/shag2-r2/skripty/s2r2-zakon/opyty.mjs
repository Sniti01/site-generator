// Опыты s2r2-zakon над судьёй 2434229 (tools/sverka.mjs). Репозиторий — только чтение; порчи — в памяти.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const REF = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const S = await import(pathToFileURL(join(REPO, 'tools/sverka.mjs')).href);
const { OBYAZATELNAYA_PODPIS } = await import(pathToFileURL(join(REPO, 'gates/sverka.mjs')).href);
const V = S.vhody(REPO);
const OB = new Set(OBYAZATELNAYA_PODPIS);
const klon = (o) => JSON.parse(JSON.stringify(o));
const po = (url) => ({
  page: V.struktura.pages.find((p) => p.url === url),
  dane: V.soderzhanie.find((s) => s.dane?.url === url)?.dane,
  html: readFileSync(join(REF, url.slice(1), 'index.html'), 'utf8'),
});
const sud = (page, dane, html) => S.sverkaStranicy({ page, dane, html, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: OB });
const PODPIS = /(<p class="podpis-geroya t-caption" data-astro-cid-[a-z0-9]+>)([\s\S]*?)(<\/p>)/;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const kratko = (z) => (z.length ? z.join(' | ').slice(0, 260) : '[] МОЛЧИТ');

// 0. Настоящая сборка.
const r0 = S.sverkaSborki(REF, REPO, { obyazatelnaPodpis: OB });
console.log(`0 настоящая сборка: замечаний ${r0.zamechaniya.length}, страниц ${r0.stranic}`);

// 1. Подпись с другим текстом — в содержании и в печати одинаково (законная правка слов).
const podmena = (url, tekst) => {
  const x = po(url);
  if (!PODPIS.test(x.html)) throw new Error(`${url}: нет подписи`);
  const html = x.html.replace(PODPIS, (m, a, t, b) => a + esc(tekst) + b);
  const dane = { ...klon(x.dane), artCaption: tekst };
  return sud(x.page, dane, html);
};
const kod = (s) => [...s].map((c) => (/[\x20-\x7e]/.test(c) ? c : `<U+${c.codePointAt(0).toString(16).toUpperCase()}>`)).join('');
const FORMY = [
  ['другие слова', 'Pictured: a still from Max Payne 3, not a cover or a poster'],
  ['кавычки и тире', 'Pictured: “Max Payne 3” (2012) — a screenshot'],
  ['эмодзи без ZWJ', 'Pictured \u{1F3AE}: Max Payne 3 (2012), a screenshot'],
  ['мягкий перенос в длинном слове (U+00AD)', 'Pictured: Max Payne 3 (2012), a screen\u00ADshot, not the cover'],
  ['эмодзи с ZWJ (U+200D): \u{1F468}\u200D\u{1F4BB}', 'Pictured \u{1F468}\u200D\u{1F4BB}: Max Payne 3 (2012), a screenshot'],
  ['неразрывность знаком U+2060 у «3»', 'Pictured: Max Payne\u00A0\u20603 (2012), a screenshot'],
  ['метка направления LRM (U+200E) при ивритском названии', 'Pictured: Max Payne 3 (\u05DE\u05E7\u05E1 \u05E4\u05D9\u05D9\u05DF\u200E 3), a screenshot'],
  ['обращение U+202E (как P-3)', '\u202EPictured: Max Payne 3'],
];
for (const url of ['/media/', '/remake/']) for (const [imya, t] of FORMY) console.log(`1 ${url} ${imya} «${kod(t)}»: ${kratko(podmena(url, t))}`);

// 1б. Страница вне списка с законной подписью с мягким переносом: /story/ (герой без подписи).
{
  const x = po('/story/');
  const cid = x.html.match(/<h1 [^>]*(data-astro-cid-[a-z0-9]+)/)[1];
  const t = 'Pictured: the original Max Payne (2001), a screen\u00ADshot';
  const i = x.html.indexOf('</section>');
  const html = x.html.slice(0, i) + `<p class="podpis-geroya t-caption" ${cid}>${t}</p>` + x.html.slice(i);
  console.log(`1б /story/ (вне списка) + подпись без мягкого переноса: ${kratko(sud(x.page, { ...klon(x.dane), artCaption: t.replace('\u00AD', '') }, html.replace('\u00AD', '')))}`);
  console.log(`1б /story/ (вне списка) + подпись с мягким переносом: ${kratko(sud(x.page, { ...klon(x.dane), artCaption: t }, html))}`);
}

// 2. Подпись из знаков, которые браузер не рисует (Default_Ignorable), вне Cf и вне списка vidimyi.
for (const [imya, t] of [
  ['U+FE0F селектор варианта', '\uFE0F'],
  ['U+FE00 селектор варианта', '\uFE00'],
  ['U+180B монгольский селектор', '\u180B'],
  ['U+17B4 кхмерская гласная', '\u17B4'],
  ['U+E0100 селектор варианта 17', '\u{E0100}'],
  ['контроль U+200B (Cf)', '\u200B'],
]) {
  for (const url of OBYAZATELNAYA_PODPIS) {
    const z = podmena(url, t);
    console.log(`2 ${url} ${imya}: схема tekst() ${t.trim().length >= 1 ? 'пропускает' : 'режет'}; судья ${kratko(z)}`);
  }
}

// 3. Скрытие предком-элементом: обёртка героя внутри элемента, который браузер не рисует.
const OBERTKA = /<div class="geroy[^"]*"[^>]*>[\s\S]*?<\/section><\/div>/;
for (const [imya, a, b] of [
  ['<details>', '<details>', '</details>'],
  ['<dialog>', '<dialog>', '</dialog>'],
  ['<noscript>', '<noscript>', '</noscript>'],
  ['<datalist>', '<datalist>', '</datalist>'],
  ['<div class="geroy md:hidden">', null, null],
  ['<section class="hero collapse">', null, null],
  ['<section class="hero opacity-0">', null, null],
  ['<div class="geroy visually-hidden"> (класс ядра, в списке)', null, null],
]) {
  for (const url of ['/media/', '/mods/']) {
    const x = po(url);
    let html;
    if (a) {
      if (!OBERTKA.test(x.html)) throw new Error('нет обёртки');
      html = x.html.replace(OBERTKA, (m) => a + m + b);
    } else if (imya.includes('md:hidden')) html = x.html.replace(/<div class="geroy/, '<div class="geroy md:hidden');
    else if (imya.includes('visually-hidden')) html = x.html.replace(/<div class="geroy/, '<div class="geroy visually-hidden');
    else html = x.html.replace('<section class="hero"', `<section class="hero ${imya.match(/hero (\S+)"/)[1]}"`);
    if (html === x.html) throw new Error(`${imya}: порча не применилась`);
    console.log(`3 ${url} ${imya}: ${kratko(sud(x.page, x.dane, html))}`);
  }
}

// 4. Метка области подписи — непустая, но чужая (метка компонента героя, не маршрута).
for (const url of OBYAZATELNAYA_PODPIS) {
  const x = po(url);
  const cidHero = x.html.match(/<section class="hero"[^>]*(data-astro-cid-[a-z0-9]+)/)[1];
  const html = x.html.replace(/(<p class="podpis-geroya t-caption" )data-astro-cid-[a-z0-9]+>/, `$1${cidHero}>`);
  if (html === x.html) throw new Error('метка не заменена');
  console.log(`4 ${url} метка подписи ${cidHero}: ${kratko(sud(x.page, x.dane, html))}`);
}
