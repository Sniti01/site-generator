// Проверяющий s2r2-klass-prov: своё воспроизведение находок S2R2-K-1…K-5 и свои члены класса.
// Репозиторий — только чтение; HTML и содержание портятся в памяти.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sverkaStranicy, vhody } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';
import { OBYAZATELNAYA_PODPIS } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/gates/sverka.mjs';
import { razobrat, elementy, imya, klassy, predki } from 'file:///D:/SEO/cloud/site-generator/core/text/html.mjs';

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
const zam = (s, iz, na) => {
  if (typeof iz === 'string' ? !s.includes(iz) : !iz.test(s)) throw new Error(`порча не применилась: ${String(iz).slice(0, 60)}`);
  return s.replace(iz, na);
};
// Своя разметка страниц: ищу теги героя по дереву, а не по готовым строкам скептика.
const P = /(<p class="podpis-geroya t-caption"[^>]*>)([\s\S]*?)(<\/p>)/;
const OTKR_GEROYA = /<div class="geroy[^"]*"[^>]*>/;
// Вставка X между <main> и div.geroy: открыть перед div.geroy, закрыть после его </div> (конец героя — </section>\s*</div>).
const mezhduMainIGeroem = (otkr, zakr) => (h) => zam(zam(h, OTKR_GEROYA, (m) => otkr + m), /(<\/section>\s*<\/div>)/, (m) => m + zakr);
const vokrugMain = (otkr, zakr) => (h) => zam(zam(h, /<main\b/, (m) => otkr + m), '</main>', `</main>${zakr}`);
const atrGeroya = (a) => (h) => zam(h, /<section class="hero"/, `<section ${a} class="hero"`);
const klassGeroya = (k, a) => (h) => zam(h, /<section class="hero"([^>]*)>/, (m, r) => `<section class="hero ${k}"${r} ${a}>`);
const atrObertki = (a) => (h) => zam(h, /<div class="geroy/, `<div ${a} class="geroy`);
const atrMain = (a) => (h) => zam(h, /<main\b/, `<main ${a}`);
const tekst = (t) => ({ html: (h) => zam(h, P, (m, o, _x, z) => o + t + z), dane: (d) => ((d.artCaption = t), d) });

const SLUCHAI = [
  ['контроль', 'без порчи', {}],
  ['контроль', 'hidden у section.hero', { html: atrGeroya('hidden') }],
  ['контроль', 'U+200B вся подпись', tekst('\u200B')],
  // K-1
  ['K-1', 'details между main и geroy', { html: mezhduMainIGeroem('<details>', '</details>') }],
  ['K-1', 'dialog между main и geroy', { html: mezhduMainIGeroem('<dialog>', '</dialog>') }],
  ['K-1', 'noscript между main и geroy', { html: mezhduMainIGeroem('<noscript>', '</noscript>') }],
  ['K-1', 'datalist между main и geroy', { html: mezhduMainIGeroem('<datalist>', '</datalist>') }],
  ['K-1', 'canvas между main и geroy', { html: mezhduMainIGeroem('<canvas>', '</canvas>') }],
  ['K-1', 'video между main и geroy', { html: mezhduMainIGeroem('<video>', '</video>') }],
  ['K-1', 'audio между main и geroy', { html: mezhduMainIGeroem('<audio>', '</audio>') }],
  // K-2
  ['K-2', 'div hidden вокруг main', { html: vokrugMain('<div hidden>', '</div>') }],
  ['K-2', 'div aria-hidden вокруг main', { html: vokrugMain('<div aria-hidden="true">', '</div>') }],
  ['K-2', 'div inert вокруг main', { html: vokrugMain('<div inert>', '</div>') }],
  ['K-2', 'div.visually-hidden вокруг main', { html: vokrugMain('<div class="visually-hidden">', '</div>') }],
  ['K-2', 'details вокруг main', { html: vokrugMain('<details>', '</details>') }],
  ['K-2', 'noscript вокруг main', { html: vokrugMain('<noscript>', '</noscript>') }],
  // K-3
  ['K-3', 'section.hero .hdr__burger-close + cid шапки', { html: klassGeroya('hdr__burger-close', 'data-astro-cid-qu2zoq4f') }],
  ['K-3', 'section.hero .hdr__drawer + cid шапки', { html: klassGeroya('hdr__drawer', 'data-astro-cid-qu2zoq4f') }],
  ['K-3', 'section.hero .hdr__nav + cid шапки', { html: klassGeroya('hdr__nav', 'data-astro-cid-qu2zoq4f') }],
  ['K-3', 'main .hdr__burger-close + cid шапки', { html: atrMain('class="hdr__burger-close" data-astro-cid-qu2zoq4f') }],
  // K-4
  ['K-4', 'role=img у section.hero', { html: atrGeroya('role="img" aria-label="Max Payne"') }],
  ['K-4', 'role=img у div.geroy', { html: atrObertki('role="img" aria-label="Max Payne"') }],
  ['K-4', 'role=img у main', { html: atrMain('role="img" aria-label="Max Payne"') }],
  // K-5
  ['K-5', 'U+FE0F', tekst('\uFE0F')],
  ['K-5', 'U+FE00 FE01 FE0E FE0F', tekst('\uFE00\uFE01\uFE0E\uFE0F')],
  ['K-5', 'U+17B4', tekst('\u17B4')],
  ['K-5', 'U+17B5', tekst('\u17B5')],
  ['K-5', 'U+180B', tekst('\u180B')],
  ['K-5', 'U+E0100', tekst('\u{E0100}')],
  // Свои члены класса (скептик не пробовал)
  ['свой', 'rp между main и geroy (rp{display:none} в таблице браузера)', { html: mezhduMainIGeroem('<rp>', '</rp>') }],
  ['свой', 'svg>defs>foreignObject между main и geroy', { html: mezhduMainIGeroem('<svg><defs><foreignObject>', '</foreignObject></defs></svg>') }],
  ['свой', 'template-less: select между main и geroy', { html: mezhduMainIGeroem('<select>', '</select>') }],
  ['свой', 'U+034F CGJ вся подпись (в vidimyi есть)', tekst('\u034F')],
  ['свой', 'U+FE0F + U+200B (оба невидимы; Cf ловит nevidimye)', tekst('\uFE0F\u200B')],
  ['свой', 'U+E01EF', tekst('\u{E01EF}')],
  ['свой', 'U+180F (монгольский FVS4, DI Mn)', tekst('\u180F')],
];

const itogi = [];
for (const [gr, im, x] of SLUCHAI) {
  const po6 = [];
  for (const url of OBYAZATELNAYA_PODPIS) {
    const s = po(url);
    const html = x.html ? x.html(s.html) : s.html;
    const dane = x.dane ? x.dane(klon(s.dane)) : s.dane;
    const z = sver(s.page, dane, html);
    // Где оказалась подпись в дереве — цепочка предков (для проверки, что порча дала то, что задумано).
    const d = razobrat(html);
    const p = elementy(d, (u) => klassy(u).has('podpis-geroya'))[0];
    const cep = p ? predki(p).map(imya).join('<') : 'подписи нет в дереве';
    po6.push({ url, z, cep });
  }
  const molchit = po6.filter((r) => !r.z.length).length;
  itogi.push(`[${gr}] ${im}: молчит ${molchit}/6; цепочка (${po6[3].url}): ${po6[3].cep}${po6[3].z.length ? '; замечание: ' + po6[3].z.join(' | ').slice(0, 200) : ''}`);
}
console.log(itogi.join('\n'));
