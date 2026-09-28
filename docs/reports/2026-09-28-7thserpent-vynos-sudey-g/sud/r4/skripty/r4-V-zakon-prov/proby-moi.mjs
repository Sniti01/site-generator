// Свои порчи раунда 4 (r4-V-zakon-prov): текущая сверка, сверка до 3b78f28 и мутанты (из mutanty-moi.mjs, папка mut/).
// node proby-moi.mjs — итог в vyvod-prob.txt.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, symlinkSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ZDES = dirname(fileURLToPath(import.meta.url));
const REPO = 'D:/SEO/cloud/site-generator';
const SAYT = `${REPO}/sites/7thserpent.com`;
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const OBYAZ = new Set(['/remake/', '/movie/']);

// Модуль до коммита — из git show 3b78f28^ (do-syroe.mjs), импорты на адреса репозитория.
const syroe = readFileSync(join(ZDES, 'do-syroe.mjs'), 'utf8');
writeFileSync(
  join(ZDES, 'do.mjs'),
  syroe
    .replace("import { parse as yamlParse } from 'yaml';", `import { createRequire } from 'node:module';\nconst yamlParse = createRequire('${SAYT}/package.json')('yaml').parse;`)
    .replace("from '@factory/core/text/html.mjs'", `from 'file:///${REPO}/core/text/html.mjs'`)
);
const SEJCHAS = await import(`file:///${SAYT}/tools/sverka.mjs`);
const DO = await import(pathToFileURL(join(ZDES, 'do.mjs')).href);
const mut = {};
for (const n of ['bez-html', 'bez-body', 'bez-prochih', 'bez-link', 'bez-registra', 'bez-kosoy', 'bez-aria', 'bez-h2', 'bez-klassa', 'bez-headline', 'vse-svg', 'bez-teksta-ikony', 'bez-pamyati']) {
  mut[n] = await import(pathToFileURL(join(ZDES, 'mut', n, 'sverka.mjs')).href);
}

const out = [];
const log = (s) => {
  out.push(s);
  console.log(s);
};
const V = SEJCHAS.vhody(SAYT);
const html = (url) => readFileSync(join(DIST, url.slice(1), 'index.html'), 'utf8');
const stranica = (url) => ({ page: V.struktura.pages.find((p) => p.url === url), dane: V.soderzhanie.find((s) => s.dane?.url === url).dane });
const zam = (s, iz, na) => {
  const n = s.split(iz).length - 1;
  if (n < 1) throw new Error(`порча не применилась: «${String(iz).slice(0, 70)}»`);
  return s.replace(iz, () => na);
};
// Входы — своим модулем: у сверки до 3b78f28 подпись иконки без текста элементов.
const sverit = (M, url, h, Vx = M === SEJCHAS ? V : M.vhody(SAYT)) => {
  const { page, dane } = stranica(url);
  const z = M.sverkaStranicy({ page, dane, html: h, kredity: Vx.kredity, ikony: Vx.ikony, obyazatelnaPodpis: OBYAZ });
  return z.length ? z.join(' | ').slice(0, 260) : 'замечаний нет';
};
const para = (imya, url, h, imyaMut) => {
  log(`${imya}\n    текущая: ${sverit(SEJCHAS, url, h)}\n    ${imyaMut ? `мутант ${imyaMut}: ${sverit(mut[imyaMut], url, h)}` : `до 3b78f28: ${sverit(DO, url, h)}`}`);
};

const RM = html('/remake/');
const PC = html('/pc/');
const K15 = html('/max-payne-3/').match(/\/_astro\/mp3-k15\.[^" ,]+/)[0];
const vHeroj = (h, x) => zam(h, '<div class="hero__scrim"', x + '<div class="hero__scrim"');

log('== контроль');
para('/remake/ без порчи', '/remake/', RM);
para('/pc/ без порчи', '/pc/', PC);

log('\n== R4-V-Z-1: видимый текст в svg кнопок (регресс против 3b78f28^)');
para('svg кнопки призыва /remake/ с <text>', '/remake/', zam(RM, '<path d="m13 6 6 6-6 6"/></svg></a>', '<path d="m13 6 6 6-6 6"/><text x="2" y="20" font-size="20">GET IT FREE</text></svg></a>'));
para('svg кнопки призыва /pc/ с <text>', '/pc/', PC.replace(/(<a class="btn btn-primary t-button cta__btn"[^>]*>[\s\S]*?)<\/svg>/, '$1<text y="20">NOW</text></svg>'));
para('контурная кнопка /remake/ с svg и <text>', '/remake/', zam(RM, '>The 2001 original</a>', '>The 2001 original<svg width="140" height="18" aria-hidden="true"><text y="14">, now free</text></svg></a>'));
para('главная кнопка /remake/: <text> в svg иконки', '/remake/', zam(RM, '<path d="m6 9 6 6 6-6"/></svg>', '<path d="m6 9 6 6 6-6"/><text y="14">FREE</text></svg>'));

log('\n== R4-V-Z-2: части V3-3 без теста');
para('style у <html>', '/remake/', zam(RM, '<html lang="en">', '<html lang="en" style="opacity: .2">'), 'bez-html');
para('style у <body>', '/remake/', zam(RM, '<body>', '<body style="visibility: hidden">'), 'bez-body');
para('style у ряда voice', '/remake/', RM.replace(/(<section class="layer[^"]*" id="voice")/, '$1 style="opacity: 0"'), 'bez-prochih');
para('<link rel="Stylesheet preload"> в <main>', '/remake/', zam(RM, '<main id="content">', '<main id="content"><link rel="Stylesheet preload" href="/z.css">'), 'bez-link');

log('\n== R4-V-Z-3: обходы iskatAstro без теста');
para('image href с /_ASTRO/', '/remake/', vHeroj(RM, `<svg><image href="${K15.replace('/_astro/', '/_ASTRO/')}"/></svg>`), 'bez-registra');
para('image href с /_astro\\', '/remake/', vHeroj(RM, `<svg><image href="${K15.replace('/_astro/', '/_astro\\')}"/></svg>`), 'bez-kosoy');

log('\n== R4-V-Z-4: «связанные» — части V3-6 без теста');
const LL = '<section class="link-list section--light container" aria-labelledby="related-title"';
const H2 = '<h2 class="link-list__title t-headline" id="related-title" data-astro-cid-m2yyudgx>More from the series</h2>';
para('aria-labelledby «связанных» = page-title', '/remake/', zam(RM, LL, LL.replace('related-title', 'page-title')), 'bez-aria');
para('заголовок h4 с классами', '/remake/', zam(RM, H2, H2.replace('<h2', '<h4').replace('</h2>', '</h4>')), 'bez-h2');
para('без link-list__title', '/remake/', zam(RM, H2, H2.replace('link-list__title ', '')), 'bez-klassa');
para('без t-headline', '/remake/', zam(RM, H2, H2.replace(' t-headline', '')), 'bez-headline');

// Зеркало входов в своей папке.
const zerkalo = (imya) => {
  const k = join(ZDES, 'zerk', imya);
  rmSync(k, { recursive: true, force: true });
  for (const p of ['structure/structure.json', 'src/data/game-art.json', 'src/data/icons.ts', 'src/content/tresc']) {
    mkdirSync(dirname(join(k, p)), { recursive: true });
    cpSync(join(SAYT, p), join(k, p), { recursive: true });
  }
  return k;
};
const ikonaV = (k, kl, iz, na) => {
  const f = join(k, 'src/data/icons.ts');
  writeFileSync(f, zam(readFileSync(f, 'utf8'), `'${kl}': '${iz}'`, `'${kl}': '${na}'`));
};
const DOWN = '<path d="m6 9 6 6 6-6"/>';
const RIGHT = '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>';

log('\n== R4-V-Z-5: вложенный svg в законной иконке');
{
  const k = zerkalo('vlozh');
  const NA = '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>';
  ikonaV(k, 'arrow-down', DOWN, NA);
  const h = zam(RM, DOWN, NA);
  log(`законная: icons.ts и печать с вложенным svg\n    текущая: ${sverit(SEJCHAS, '/remake/', h, SEJCHAS.vhody(k))}\n    мутант vse-svg: ${sverit(mut['vse-svg'], '/remake/', h, mut['vse-svg'].vhody(k))}`);
}

log('\n== R4-V-Z-6: текст элементов иконки (раунд 3)');
{
  const k = zerkalo('tekst');
  ikonaV(k, 'arrow-down', DOWN, '<desc>Down</desc>' + DOWN);
  const h = zam(RM, DOWN, '<desc>Scroll to the free download</desc>' + DOWN);
  log(`desc иконки не как в icons.ts\n    текущая: ${sverit(SEJCHAS, '/remake/', h, SEJCHAS.vhody(k))}\n    мутант bez-teksta-ikony: ${sverit(mut['bez-teksta-ikony'], '/remake/', h, mut['bez-teksta-ikony'].vhody(k))}`);
  const h0 = zam(RM, DOWN, '<desc>Down</desc>' + DOWN);
  log(`контроль: desc как в icons.ts\n    текущая: ${sverit(SEJCHAS, '/remake/', h0, SEJCHAS.vhody(k))}`);
}

log('\n== R4-V-Z-7: петля ссылок');
{
  const k = zerkalo('petlya');
  symlinkSync(join(k, 'src/content/tresc'), join(k, 'src/content/tresc/krug'), 'junction');
  const a = SEJCHAS.sverkaSborki(DIST, k, { obyazatelnaPodpis: OBYAZ });
  const t0 = Date.now();
  const b = mut['bez-pamyati'].sverkaSborki(DIST, k, { obyazatelnaPodpis: OBYAZ });
  log(`петля krug → tresc\n    текущая: страниц ${a.stranic}, замечаний ${a.zamechaniya.length}\n    мутант bez-pamyati: страниц ${b.stranic}, замечаний ${b.zamechaniya.length}, ${Date.now() - t0} мс`);
}

log('\n== R4-V-Z-8: style у элемента иконки словаря');
{
  const k = zerkalo('stil');
  const NA = '<path d="m6 9 6 6 6-6" style="stroke-dasharray: 3 1"/>';
  ikonaV(k, 'arrow-down', DOWN, NA);
  const h = zam(RM, DOWN, NA);
  log(`arrow-down со style в icons.ts и печати\n    текущая: ${sverit(SEJCHAS, '/remake/', h, SEJCHAS.vhody(k))}\n    до 3b78f28: ${sverit(DO, '/remake/', h, DO.vhody(k))}`);
}

log('\n== формы «да»: свои члены класса');
const SVG_GL = 'When it comes out<svg width="18" height="18"';
para('V3-1 opacity="0" у корня', '/remake/', zam(RM, SVG_GL, SVG_GL + ' opacity="0"'));
para('V3-1 display="none" у корня', '/remake/', zam(RM, SVG_GL, SVG_GL + ' display="none"'));
para('V3-1 class="sr-only" у корня', '/remake/', zam(RM, SVG_GL, SVG_GL + ' class="sr-only"'));
para('V3-1 stroke-width="0" вместо 1.5', '/remake/', RM.replace(/(When it comes out<svg\b[^>]*?)stroke-width="1\.5"/, '$1stroke-width="0"'));
para('V3-1 законная: data-astro-cid у корня', '/remake/', zam(RM, SVG_GL, SVG_GL + ' data-astro-cid-m3tnyskv'));
para('V3-1 законная: второй width=0 после первого (parse5 и браузер берут первый)', '/remake/', zam(RM, SVG_GL, SVG_GL + ' width="0"'));
const OB = 'style="--fokus: 55% 60%"';
para('V3-2 второй атрибут style (parse5 и браузер берут первый)', '/remake/', zam(RM, OB, OB + ' style="--fokus: 10% 50%"'));
para('V3-2 значение через сущность &#49;0%', '/remake/', zam(RM, OB, 'style="--fokus: &#49;0% 50%"'));
para('V3-2 законная: то же значение через сущность &#53;5%', '/remake/', zam(RM, OB, 'style="--fokus: &#53;5% 60%"'));
para('V3-2 STYLE прописными с другим значением', '/remake/', zam(RM, OB, 'STYLE="--fokus: 10% 50%"'));
para('V3-2 без пробела после двоеточия', '/remake/', zam(RM, OB, 'style="--fokus:55% 60%"'));
{
  const l = RM.match(/<section class="link-list[\s\S]*?<\/section>/)[0];
  para('V3-5 «связанные» в <div> прямо в <main>', '/remake/', zam(RM, l, '<div class="obolochka">' + l + '</div>'));
  const bez = RM.replace(l, () => '');
  para('V3-5 «связанные» внутри ряда voice', '/remake/', bez.replace(/(<section class="layer[^"]*" id="voice"[\s\S]*?)(<\/section>)/, (_x, a, b) => a + l + b));
}
const NOTA = /(<p class="ft__art-note[^"]*"[^>]*>License class)/;
para('V3-9 вторая нота «Games : Max Payne 3.» (пробел до двоеточия)', '/remake/', RM.replace(NOTA, '<p class="ft__art-note t-caption">Games : Max Payne 3.</p>$1'));
para('V3-9 вторая нота «GAMES: Max Payne 3.»', '/remake/', RM.replace(NOTA, '<p class="ft__art-note t-caption">GAMES: Max Payne 3.</p>$1'));
para('V3-9 вторая нота «Games&#58; Max Payne 3.» (сущность)', '/remake/', RM.replace(NOTA, '<p class="ft__art-note t-caption">Games&#58; Max Payne 3.</p>$1'));
para('V3-9 вторая нота «Games<span>:</span> Max Payne 3.»', '/remake/', RM.replace(NOTA, '<p class="ft__art-note t-caption">Games<span>:</span> Max Payne 3.</p>$1'));
para('V3-9 вторая «License class :CC BY-SA 4.0.»', '/remake/', RM.replace(NOTA, '<p class="ft__art-note t-caption">License class :CC BY-SA 4.0.</p>$1'));

log('\n== V3-7: встречная проверка — свои имена файлов');
{
  const d = join(ZDES, 'dist-kopiya');
  rmSync(d, { recursive: true, force: true });
  cpSync(DIST, d, { recursive: true, filter: (p) => !/[\\/]_astro([\\/]|$)/.test(p.slice(DIST.length)) });
  const base = SEJCHAS.sverkaSborki(d, SAYT, { obyazatelnaPodpis: OBYAZ });
  log(`копия без порчи: страниц ${base.stranic}, замечаний ${base.zamechaniya.length}`);
  mkdirSync(join(d, 'proba-a'));
  writeFileSync(join(d, 'proba-a', 'INDEX.HTML'), RM);
  writeFileSync(join(d, 'Proba.Html'), RM);
  mkdirSync(join(d, 'proba-b'));
  writeFileSync(join(d, 'proba-b', 'index.htm'), RM);
  mkdirSync(join(d, '_astro', 'vnutri'), { recursive: true });
  writeFileSync(join(d, '_astro', 'vnutri', 'index.html'), RM);
  const r = SEJCHAS.sverkaSborki(d, SAYT, { obyazatelnaPodpis: OBYAZ });
  log(`с порчами: ${r.zamechaniya.map((z) => `${z.url}: ${z.chto}`).join(' | ') || 'замечаний нет'}`);
  log(`    proba-b/index.htm в замечаниях: ${r.zamechaniya.some((z) => z.url.includes('proba-b')) ? 'да' : 'нет'}; существует: ${existsSync(join(d, 'proba-b', 'index.htm'))}`);
}

writeFileSync(join(ZDES, 'vyvod-prob.txt'), out.join('\n') + '\n');
