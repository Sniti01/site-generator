// Пробы r4-V-klass: члены классов строгих форм раунда 3 на настоящих страницах сборки 3b78f28.
// МОЛЧИТ — судья не дал ни одного замечания; ОТКАЗ — дал (текст замечаний следом).
import { po, progon } from './obshchee.mjs';

const rm = po('/remake/');
const m3 = po('/max-payne-3/');
const K15 = m3.html.match(/\/_astro\/mp3-k15\.[^" ,]+/)[0];
const vHeroj = (h, x) => h.replace('<div class="hero__scrim"', () => x + '<div class="hero__scrim"');
const SEC = 'The 2001 original</a>';
const CTA_SVG = /(See Max Payne \(2001\)<svg\b[^>]*>)/;
const NOTA = 'Games: Max Payne.';

const gruppa = (imya, spisok) => {
  console.log(`\n=== ${imya}`);
  progon(spisok);
};

gruppa('V3-1 корень svg иконки (ждём ОТКАЗ: форма закрывает)', [
  { imya: 'class у корня', s: rm, html: (h) => h.replace('When it comes out<svg ', 'When it comes out<svg class="x" ') },
  { imya: 'xmlns:xlink у корня', s: rm, html: (h) => h.replace('When it comes out<svg ', 'When it comes out<svg xmlns:xlink="http://www.w3.org/1999/xlink" ') },
  { imya: 'STROKE прописными (parse5 сводит)', s: rm, html: (h) => h.replace('When it comes out<svg ', 'When it comes out<svg STROKE="none" ').replace(/(When it comes out<svg[^>]*?) stroke="currentColor"/, '$1') },
  { imya: 'g stroke=none вокруг пути', s: rm, html: (h) => h.replace('<path d="m6 9 6 6 6-6"/>', '<g stroke="none"><path d="m6 9 6 6 6-6"/></g>') },
  { imya: 'иконка в теневом корне span', s: rm, html: (h) => h.replace(/When it comes out(<svg[\s\S]*?<\/svg>)/, 'When it comes out<span><template shadowrootmode="open">$1</template></span>') },
]);

gruppa('V3-2 кадровка: соседние атрибуты и элементы обёртки (что держит правило --fokus)', [
  { imya: 'обёртка без data-astro-cid-n67f4zmd (правило .geroy[cid] .hero__art .foto img не достаёт)', s: rm, html: (h) => h.replace('<div class="geroy geroy--stal" style="--fokus: 55% 60%" data-astro-cid-n67f4zmd>', '<div class="geroy geroy--stal" style="--fokus: 55% 60%">') },
  { imya: 'рамка арта героя без класса foto (правило .hero__art .foto img не достаёт)', s: rm, html: (h) => h.replace(/(<div class="hero__art"[^>]*>)<div class="foto">/, '$1<div class="kadr">') },
]);

gruppa('V3-3 оформление мимо обёртки: другое место и другой синтаксис', [
  { imya: '<style> в <body> после </main> (подвал)', s: rm, html: (h) => h.replace('</main>', '</main><style>.geroy .hero__art .foto img{object-position:10% 50% !important}</style>') },
  { imya: '<style> в <header> страницы', s: rm, html: (h) => h.replace('</header>', '<style>.geroy{--fokus:10% 50% !important}</style></header>') },
  { imya: 'svg <style> в знаке подвала', s: rm, html: (h) => h.replace('<svg class="znak" width="138" height="38" viewBox="0 0 138 38" focusable="false" role="img"', '<svg class="znak" width="138" height="38" viewBox="0 0 138 38" focusable="false" role="img"><style>.geroy .hero__art .foto img{object-position:10% 50% !important}</style></svg><svg') },
  { imya: '<link rel=stylesheet> в подвале', s: rm, html: (h) => h.replace('<footer class="ft"', '<link rel="stylesheet" href="/_astro/proba.css"><footer class="ft"') },
  { imya: '<script> в <main>: style.setProperty(--fokus)', s: rm, html: (h) => h.replace('<section class="layer section layer--bez-kadru" id="what-it-is"', `<script>document.querySelector('.geroy').style.setProperty('--fokus','10% 50%')</script><section class="layer section layer--bez-kadru" id="what-it-is"`) },
  { imya: 'onload у картинки героя: style.objectPosition', s: rm, html: (h) => h.replace(/(<div class="hero__art"[^>]*><div class="foto"><img\b)/, `$1 onload="this.style.objectPosition='10% 50%'"`) },
  { imya: 'контроль: <style> в <main> (ждём ОТКАЗ)', s: rm, html: (h) => h.replace('</main>', '<style>.geroy{--fokus:10% 50%}</style></main>') },
]);

gruppa('V3-4 адреса _astro: синтаксис и место', [
  { imya: 'video poster: таб внутри _astro (&#9;; URL-разборщик браузера выбрасывает таб)', s: rm, html: (h) => vHeroj(h, `<video poster="${K15.replace('/_astro/', '/_ast&#9;ro/')}"></video>`) },
  { imya: 'svg image href: перевод строки внутри _astro (&#10;)', s: rm, html: (h) => vHeroj(h, `<svg width="100%" height="100%"><image href="${K15.replace('/_astro/', '/_as&#10;tro/')}" width="100%" height="100%"/></svg>`) },
  { imya: 'video poster: /%5Fastro/ и неполная запись % в запросе (?%)', s: rm, html: (h) => vHeroj(h, `<video poster="${K15.replace('/_astro/', '/%5Fastro/')}?%"></video>`) },
  { imya: 'video poster: /%5Fastro/ и неполная запись % во фрагменте (#%zz)', s: rm, html: (h) => vHeroj(h, `<video poster="${K15.replace('/_astro/', '/%5Fastro/')}#%zz"></video>`) },
  { imya: 'контроль: /%5Fastro/ без неполной записи (ждём ОТКАЗ)', s: rm, html: (h) => vHeroj(h, `<video poster="${K15.replace('/_astro/', '/%5Fastro/')}"></video>`) },
  { imya: '<body background> с кадром другой игры', s: rm, html: (h) => h.replace('<body>', `<body background="${K15}">`) },
  { imya: 'контроль: <body style> с кадром другой игры (ждём ОТКАЗ)', s: rm, html: (h) => h.replace('<body>', `<body style="background-image:url(${K15})">`) },
]);

gruppa('V3-8 надпись кнопок: нарисованный текст мимо «текст без svg»', [
  { imya: 'вторая кнопка: svg <text> после надписи', s: rm, html: (h) => h.replace(SEC, 'The 2001 original<svg width="120" height="18"><text x="0" y="14">and the remake</text></svg></a>') },
  { imya: 'вторая кнопка: svg foreignObject с текстом', s: rm, html: (h) => h.replace(SEC, 'The 2001 original<svg width="120" height="18"><foreignObject width="120" height="18"><span>and the remake</span></foreignObject></svg></a>') },
  { imya: 'вторая кнопка: надпись в span с теневым корнем (светлый текст не рисуется)', s: rm, html: (h) => h.replace(SEC, '<span><template shadowrootmode="open">Play the remake</template>The 2001 original</span></a>') },
  { imya: 'кнопка призыва: svg <text> вместо пути иконки', s: rm, html: (h) => h.replace(/(See Max Payne \(2001\)<svg\b[^>]*>)[\s\S]*?(<\/svg>)/, '$1<text x="0" y="14" font-size="6">remake</text>$2') },
  { imya: 'кнопка призыва: вторая svg с <text>', s: rm, html: (h) => h.replace(CTA_SVG, (x) => x.replace('See Max Payne (2001)', 'See Max Payne (2001)<svg width="120" height="18"><text x="0" y="14">and the remake</text></svg>')) },
  { imya: 'вторая кнопка: <input type=button value>', s: rm, html: (h) => h.replace(SEC, 'The 2001 original<input type="button" value="and the remake"></a>') },
  { imya: 'контроль: главная кнопка, svg <text> второй svg (ждём ОТКАЗ)', s: rm, html: (h) => h.replace('When it comes out<svg ', 'When it comes out<svg width="120" height="18"><text x="0" y="14">soon</text></svg><svg ') },
  { imya: 'контроль: вторая кнопка, span с текстом (ждём ОТКАЗ)', s: rm, html: (h) => h.replace(SEC, 'The 2001 original<span> and the remake</span></a>') },
]);

gruppa('V3-9 «Games:» и «License class:»: синтаксис второго объявления', [
  { imya: 'вторая «Games:» с мягким переносом (Ga&shy;mes:) — рисуется «Games:»', s: rm, html: (h) => h.replace(NOTA, 'Games: Max Payne. Ga&shy;mes: Max Payne 3.') },
  { imya: 'вторая «Games:» с U+200B перед двоеточием (&#8203;)', s: rm, html: (h) => h.replace(NOTA, 'Games: Max Payne. Games&#8203;: Max Payne 3.') },
  { imya: 'вторая «GAMES:» прописными', s: rm, html: (h) => h.replace(NOTA, 'Games: Max Payne. GAMES: Max Payne 3.') },
  { imya: 'вторая «Games :» с пробелом до двоеточия', s: rm, html: (h) => h.replace(NOTA, 'Games: Max Payne. Games : Max Payne 3.') },
  { imya: 'вторая «License&shy; class:» — рисуется «License class:»', s: rm, html: (h) => h.replace(NOTA, 'Games: Max Payne. Li&shy;cense class: CC BY-SA 4.0.') },
  { imya: 'вторая «Games:» в соседнем абзаце подвала (p.t-caption ft__legal)', s: rm, html: (h) => h.replace('<p class="t-caption ft__copy tabular"', '<p class="t-caption">Games: Max Payne 3.</p><p class="t-caption ft__copy tabular"') },
  { imya: 'контроль: вторая «Games:» без пробела (ждём ОТКАЗ)', s: rm, html: (h) => h.replace(NOTA, 'Games: Max Payne. Games:Max Payne 3.') },
]);
