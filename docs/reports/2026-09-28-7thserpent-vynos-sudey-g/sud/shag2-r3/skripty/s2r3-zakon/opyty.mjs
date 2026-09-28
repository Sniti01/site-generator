// Опыты s2r3-zakon над судьёй e7c0795 (tools/sverka.mjs). Репозиторий — только чтение; порчи — в памяти.
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
const kratko = (z) => (z.length ? z.join(' | ').slice(0, 300) : '[] МОЛЧИТ');
const primenit = (x, f) => {
  const h = f(x.html);
  if (h === x.html) throw new Error('порча не применилась');
  return h;
};

// 0. Настоящая сборка.
const r0 = S.sverkaSborki(REF, REPO, { obyazatelnaPodpis: OB });
console.log(`0 настоящая сборка: замечаний ${r0.zamechaniya.length}, страниц ${r0.stranic}`);

// 1. Перекрытие подписи элементом вне цепочки: .foto__credit ядра (z-index 3, фон --bg, top:0 right:0) — прямым
//    ребёнком section.hero ПЕРЕД подписью; подпись остаётся последним узлом героя.
const KREDIT = '<p class="foto__credit t-caption">Pictured: official Max Payne cover art</p>';
for (const url of OBYAZATELNAYA_PODPIS) {
  const x = po(url);
  const h = primenit(x, (s) => s.replace(PODPIS, (m) => KREDIT + m));
  console.log(`1 ${url} .foto__credit в section.hero перед подписью: ${kratko(sud(x.page, x.dane, h))}`);
}
// 1к. Контроль: тот же элемент внутри .hero__art — судится.
for (const url of ['/remake/', '/media/']) {
  const x = po(url);
  const h = primenit(x, (s) => s.replace(/(<div class="hero__art"[^>]*>)/, `$1${KREDIT}`));
  console.log(`1к ${url} .foto__credit в .hero__art: ${kratko(sud(x.page, x.dane, h))}`);
}
// 1б. Тот же элемент в колонке текста и после .hero__inner — какие судятся.
for (const [imya, f] of [
  ['в .hero__text', (s) => s.replace(/(<div class="hero__text"[^>]*>)/, `$1${KREDIT}`)],
  ['между .hero__scrim и .hero__inner', (s) => s.replace(/(<div class="hero__inner)/, `${KREDIT}$1`)],
]) {
  const x = po('/remake/');
  console.log(`1б /remake/ .foto__credit ${imya}: ${kratko(sud(x.page, x.dane, primenit(x, f)))}`);
}

// 2. U+FEFF вместо пробелов в напечатанной подписи: norm() считает его пробелом (\s), шапка — «без невидимых знаков».
for (const url of OBYAZATELNAYA_PODPIS) {
  const x = po(url);
  const h = primenit(x, (s) => s.replace(PODPIS, (m, a, t, b) => a + '\uFEFF' + t.replace(/ /g, '\uFEFF') + '\uFEFF' + b));
  console.log(`2 ${url} U+FEFF вместо пробелов в печати: ${kratko(sud(x.page, x.dane, h))}`);
}
// 2к. Контроль: U+200B вместо пробелов — судится (текст разошёлся).
{
  const x = po('/remake/');
  const h = primenit(x, (s) => s.replace(PODPIS, (m, a, t, b) => a + t.replace(/ /g, '\u200B') + b));
  console.log(`2к /remake/ U+200B вместо пробелов в печати: ${kratko(sud(x.page, x.dane, h))}`);
}

// 3. Метка области героя заменена меткой маршрута (правила .hero ядра не достают: position:relative, overflow:hidden
//    пропадают — подпись absolute уходит к началу страницы под шапку). Ловит только сверка меток hero ↔ .hero__text.
for (const url of OBYAZATELNAYA_PODPIS) {
  const x = po(url);
  const h = primenit(x, (s) => s.replace(/(<section class="hero" aria-labelledby="page-title") data-astro-cid-[a-z0-9]+>/, '$1 data-astro-cid-n67f4zmd>'));
  console.log(`3 ${url} метка героя = метка маршрута: ${kratko(sud(x.page, x.dane, h))}`);
}

// 4. Законные формы: подпись на странице вне списка; подпись с разметочными знаками (& < >) — маршрут их экранирует.
{
  const x = po('/story/');
  const cid = x.html.match(/<h1 [^>]*(data-astro-cid-[a-z0-9]+)/)[1];
  const t = 'Pictured: Max Payne & Mona <2003> — a screenshot';
  const esc = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const h = primenit(x, (s) => s.replace(/<\/section><\/div>/, `<p class="podpis-geroya t-caption" ${cid}>${esc}</p></section></div>`));
  console.log(`4 /story/ (вне списка) + законная подпись с & < >: ${kratko(sud(x.page, { ...klon(x.dane), artCaption: t }, h))}`);
}
for (const url of ['/remake/', '/quotes/']) {
  const x = po(url);
  const t = 'Pictured: Max Payne & Mona <2003> — a screenshot';
  const esc = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const h = primenit(x, (s) => s.replace(PODPIS, (m, a, _t, b) => a + esc + b));
  console.log(`4 ${url} законная подпись с & < >: ${kratko(sud(x.page, { ...klon(x.dane), artCaption: t }, h))}`);
}
// 4б. Классы обёртки по страницам списка (ключевой арт — без geroy--stal, без artFocus — без style).
for (const url of OBYAZATELNAYA_PODPIS) {
  const x = po(url);
  console.log(`4б ${url} обёртка: ${x.html.match(/<div class="geroy[^>]*>/)[0]}`);
}
