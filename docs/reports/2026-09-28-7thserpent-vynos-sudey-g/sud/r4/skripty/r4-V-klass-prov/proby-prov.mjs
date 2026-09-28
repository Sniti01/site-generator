// Свои пробы проверяющего r4-V-klass-prov: находки R4-V-K-1…14 на своих вариантах порч (другие страницы и места),
// контроли и члены классов V3-1 и V3-10, которых скептик не пробовал.
import { stranica, prognat } from './osnova.mjs';

const rm = stranica('/remake/');
const mv = stranica('/movie/');
const m2 = stranica('/max-payne-2/');
const m3 = stranica('/max-payne-3/');
const K15 = m3.html.match(/\/_astro\/mp3-k15\.[^" ,]+/)[0];
const CID = ' data-astro-cid-n67f4zmd>';
const obertka = (s) => s.html.match(/<div class="geroy[^>]*>/)[0];
const pered = (h, metka, x) => h.replace(metka, () => x + metka);
const posle = (h, metka, x) => h.replace(metka, () => metka + x);

prognat('контроль: все четыре страницы как есть (ждём МОЛЧИТ)', [
  { imya: '/remake/ + пробел в конце', s: rm, porcha: (h) => h + ' ' },
  { imya: '/movie/ + пробел в конце', s: mv, porcha: (h) => h + ' ' },
  { imya: '/max-payne-2/ + пробел в конце', s: m2, porcha: (h) => h + ' ' },
  { imya: '/max-payne-3/ + пробел в конце', s: m3, porcha: (h) => h + ' ' },
]);

prognat('K-1 обёртка без метки области маршрута (свои страницы и вариант)', [
  { imya: '/max-payne-2/: обёртка без data-astro-cid-n67f4zmd', s: m2, porcha: (h) => h.replace(obertka(m2), obertka(m2).replace(' data-astro-cid-n67f4zmd', '')) },
  { imya: '/movie/: метка обёртки чужая (data-astro-cid-m3tnyskv)', s: mv, porcha: (h) => h.replace(obertka(mv), obertka(mv).replace('data-astro-cid-n67f4zmd', 'data-astro-cid-m3tnyskv')) },
]);

prognat('K-2 рамка арта героя без .foto', [
  { imya: '/movie/: .foto → .Foto (класс чувствителен к регистру)', s: mv, porcha: (h) => h.replace(/(<div class="hero__art"[^>]*>)<div class="foto">/, '$1<div class="Foto">') },
  { imya: '/max-payne-2/: рамки нет, img прямо в .hero__art', s: m2, porcha: (h) => h.replace(/(<div class="hero__art"[^>]*>)<div class="foto">(<img[^>]*>)<\/div>/, '$1$2') },
  { imya: 'контроль /remake/: кадр ряда без .foto (ждём ОТКАЗ)', s: m3, porcha: (h) => h.replace('class="foto kadr-ryadu"', 'class="kadr kadr-ryadu"') },
]);

prognat('K-3 <style> и <link rel=stylesheet> в <body> вне <main>', [
  { imya: '/movie/: <style> внутри .ft__inner подвала', s: mv, porcha: (h) => posle(h, '<div class="ft__inner container" data-astro-cid-eghvtlpg>', '<style>.geroy .hero__art .foto img{object-position:0 0!important}</style>') },
  { imya: '/max-payne-2/: <link rel="Stylesheet"> в шапке', s: m2, porcha: (h) => posle(h, '<header class="hdr" data-astro-cid-qu2zoq4f>', '<link rel="Stylesheet" href="/_astro/x.css">') },
  { imya: '/remake/: <style> сразу после <body> (до skip-link)', s: rm, porcha: (h) => posle(h, '<body>', '<style>.btn-primary svg{transform:rotate(180deg)}</style>') },
  { imya: '/remake/: style у header (атрибут, вне <main>)', s: rm, porcha: (h) => h.replace('<header class="hdr" data-astro-cid-qu2zoq4f>', `<header class="hdr" style="position:fixed;inset:0;background:url(${K15}) center/cover" data-astro-cid-qu2zoq4f>`) },
  { imya: 'контроль: <style> внутри ряда в <main> (ждём ОТКАЗ)', s: m2, porcha: (h) => h.replace('</main>', '<style>p{}</style></main>') },
]);

prognat('K-4 скрипт в <main>', [
  { imya: '/movie/: onerror у картинки героя', s: mv, porcha: (h) => h.replace(/(<div class="hero__art"[^>]*><div class="foto"><img\b)/, `$1 onerror="this.closest('.geroy').style.cssText='--fokus: 0% 0%'"`) },
  { imya: '/max-payne-2/: <script type=module> в конце <main>', s: m2, porcha: (h) => h.replace('</main>', `<script type="module">document.querySelector('.geroy').style.setProperty('--fokus','0% 0%')</script></main>`) },
  { imya: '/remake/: svg <script> в иконке кнопки призыва', s: rm, porcha: (h) => h.replace('<path d="M4 12h15"/>', '<script>1</script><path d="M4 12h15"/>') },
]);

prognat('K-5 таб, перевод строки, возврат каретки внутри _astro', [
  { imya: '/movie/: <object data> с &#13; внутри _astro', s: mv, porcha: (h) => pered(h, '<div class="hero__scrim"', `<object data="${K15.replace('/_astro/', '/_a&#13;stro/')}"></object>`) },
  { imya: '/max-payne-2/: poster с табом в имени папки после /', s: m2, porcha: (h) => pered(h, '<div class="hero__scrim"', `<video poster="${K15.replace('/_astro/', '/&#9;_astro/')}"></video>`) },
  { imya: 'контроль: poster без таба (ждём ОТКАЗ)', s: m2, porcha: (h) => pered(h, '<div class="hero__scrim"', `<video poster="${K15}"></video>`) },
]);

prognat('K-6 неполная процентная запись роняет раскрытие всего значения', [
  { imya: '/movie/: /%5fastro/ строчными и хвост «?q=100%»', s: mv, porcha: (h) => pered(h, '<div class="hero__scrim"', `<video poster="${K15.replace('/_astro/', '/%5fastro/')}?q=100%"></video>`) },
  { imya: '/max-payne-2/: неполная запись ДО пути (/%/../%5Fastro/)', s: m2, porcha: (h) => pered(h, '<div class="hero__scrim"', `<video poster="${K15.replace('/_astro/', '/%5Fastro/')}#%"></video>`) },
]);

prognat('K-7 <body background> и прочие презентационные атрибуты вне <main>', [
  { imya: '/movie/: <body background> с кадром mp3-k15', s: mv, porcha: (h) => h.replace('<body>', `<body background="${K15}">`) },
  { imya: '/max-payne-2/: <body bgcolor> (только цвет)', s: m2, porcha: (h) => h.replace('<body>', '<body bgcolor="#ff0000">') },
  { imya: 'контроль: <body style> (ждём ОТКАЗ)', s: m2, porcha: (h) => h.replace('<body>', '<body style="background:red">') },
]);

prognat('K-8 первый элемент документа с id related-title — не заголовок раздела', [
  { imya: '/movie/: скрытый span id="related-title" в колонке героя (в <main>)', s: mv, porcha: (h) => h.replace(/(<div class="hero__text"[^>]*>)/, '$1<span id="related-title" hidden>Sponsored links</span>') },
  { imya: "/max-payne-2/: span id='related-title' в подвале (ПОСЛЕ раздела — браузер берёт раздел)", s: m2, porcha: (h) => posle(h, '<div class="ft__inner container" data-astro-cid-eghvtlpg>', "<span id='related-title' hidden>Sponsored</span>") },
  { imya: "/remake/: span ID=related-title без кавычек в шапке", s: rm, porcha: (h) => posle(h, '<header class="hdr" data-astro-cid-qu2zoq4f>', '<span ID=related-title hidden>Sponsored links</span>') },
]);

prognat('K-10 svg-текст в второй кнопке и в кнопке призыва', [
  { imya: '/movie/: вторая кнопка, svg <text><tspan>', s: mv, porcha: (h) => h.replace('>The cast</a>', '>The cast<svg width="90" height="18"><text y="14"><tspan>and crew</tspan></text></svg></a>') },
  { imya: '/max-payne-2/: призыв, <textPath> во второй svg', s: m2, porcha: (h) => h.replace(/(<a class="btn btn-primary t-button cta__btn"[^>]*>[^<]*)/, '$1<svg width="90" height="18"><path id="d" d="M0 14h90"/><text><textPath href="#d">free now</textPath></text></svg>') },
  { imya: 'контроль: вторая кнопка, <b> с текстом (ждём ОТКАЗ)', s: mv, porcha: (h) => h.replace('>The cast</a>', '>The cast<b> and crew</b></a>') },
]);

prognat('K-11 теневой корень в кнопке', [
  { imya: '/max-payne-2/: вторая кнопка — надпись теневого корня на самом <a>', s: m2, porcha: (h) => h.replace(/(<a class="btn btn-secondary t-button" href="\/max-payne-1\/" data-astro-cid-m3tnyskv>)The first game<\/a>/, '$1<span><template shadowrootmode="closed">Buy Max Payne 3</template>The first game</span></a>') },
  { imya: '/movie/: кнопка призыва — надпись в теневом корне span', s: mv, porcha: (h) => h.replace(/(<a class="btn btn-primary t-button cta__btn"[^>]*>)([^<]*)/, '$1<span><template shadowrootmode="open">Buy now</template>$2</span>') },
]);

prognat('K-12 элементы форм в кнопке', [
  { imya: '/movie/: вторая кнопка, <button> с текстом', s: mv, porcha: (h) => h.replace('>The cast</a>', '>The cast<button>and crew</button></a>') },
  { imya: '/max-payne-2/: кнопка призыва, <input type=submit value>', s: m2, porcha: (h) => h.replace(/(<a class="btn btn-primary t-button cta__btn"[^>]*>[^<]*)/, '$1<input type="submit" value="free now">') },
]);

// ноты подвала /max-payne-2/
const NOTA2 = m2.html.match(/Games: [^<.]+\./)[0];
prognat(`K-13 вторая «Games:» / «License class:» другой записью (/max-payne-2/, нота «${NOTA2}»)`, [
  { imya: 'Games&#8288;: (WORD JOINER перед двоеточием)', s: m2, porcha: (h) => h.replace(NOTA2, NOTA2 + ' Games&#8288;: Max Payne 3.') },
  { imya: 'Games&#xFF1A; (полноширинное двоеточие)', s: m2, porcha: (h) => h.replace(NOTA2, NOTA2 + ' Games&#xFF1A; Max Payne 3.') },
  { imya: 'games: строчными', s: m2, porcha: (h) => h.replace(NOTA2, NOTA2 + ' games: Max Payne 3.') },
  { imya: 'License&nbsp;&nbsp;class: (norm сводит — ждём ОТКАЗ?)', s: m2, porcha: (h) => h.replace(NOTA2, NOTA2 + ' License&nbsp;&nbsp;class: CC BY 4.0.') },
  { imya: 'License­class без пробела — License&shy; class:', s: m2, porcha: (h) => h.replace(NOTA2, NOTA2 + ' License&shy; class: CC BY 4.0.') },
  { imya: 'Games<span></span>: (пустой элемент рвёт? — нет, текст склеивается)', s: m2, porcha: (h) => h.replace(NOTA2, NOTA2 + ' Games<span>:</span> Max Payne 3.') },
  { imya: 'контроль: вторая «Games: …» тем же написанием (ждём ОТКАЗ)', s: m2, porcha: (h) => h.replace(NOTA2, NOTA2 + ' Games: Max Payne 3.') },
]);

prognat('K-14 «Games:» в абзаце подвала вне p.ft__art-note', [
  { imya: '/max-payne-2/: div с «Games: Max Payne 3.» после нот', s: m2, porcha: (h) => h.replace('<p class="t-caption ft__copy tabular"', '<div class="t-caption">Games: Max Payne 3.</div><p class="t-caption ft__copy tabular"') },
  { imya: '/max-payne-2/: нота с доп. классом ft__art-note--x (класс ft__art-note есть — ждём ОТКАЗ)', s: m2, porcha: (h) => h.replace('<p class="t-caption ft__copy tabular"', '<p class="ft__art-note t-caption">Games: Max Payne 3.</p><p class="t-caption ft__copy tabular"') },
]);

// Члены классов «да» раунда 3, которых скептик не пробовал.
prognat('V3-1 (да): свои члены — корень svg иконки главной кнопки', [
  { imya: 'метка области .grain (data-astro-cid-ztqmn5of) на корне svg — правило svg[cid] требует предка .grain', s: rm, porcha: (h) => h.replace('When it comes out<svg ', 'When it comes out<svg data-astro-cid-ztqmn5of ') },
  { imya: 'метка области znak (data-astro-cid-yruwqcb3) на пути иконки', s: rm, porcha: (h) => h.replace('<path d="m6 9 6 6 6-6"/>', '<path d="m6 9 6 6 6-6" data-astro-cid-yruwqcb3/>') },
  { imya: 'VIEWBOX прописными (parse5 правит имя на viewBox, как браузер)', s: rm, porcha: (h) => h.replace('When it comes out<svg width="18" height="18" viewBox="0 0 24 24"', 'When it comes out<svg width="18" height="18" VIEWBOX="0 0 24 24"') },
  { imya: 'повтор атрибута width="0" после первого (парсер берёт первый)', s: rm, porcha: (h) => h.replace('When it comes out<svg width="18" ', 'When it comes out<svg width="18" width="0" ') },
  { imya: 'viewBox с другим разделителем «0,0,24,24» (рисуется так же)', s: rm, porcha: (h) => h.replace('When it comes out<svg width="18" height="18" viewBox="0 0 24 24"', 'When it comes out<svg width="18" height="18" viewBox="0,0,24,24"') },
  { imya: 'data-astro-cid-x style-подобное имя: data-astro-cidstyle (не метка, безвредно)', s: rm, porcha: (h) => h.replace('When it comes out<svg ', 'When it comes out<svg data-astro-cidstyle="x" ') },
]);
