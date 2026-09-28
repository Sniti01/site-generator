// «Тест не сторожит»: мутант (одна откатанная часть правки раунда 3, mut/<имя>/sverka.mjs, собран mutanty.mjs) проходит
// весь sverka.test.mjs (mutanty-itog.txt), а порча, которую правка ловит, мутантом пропускается. Для каждого случая:
// замечания текущей сверки репозитория и мутанта на одной и той же порче.
import { readFileSync, mkdirSync, cpSync, writeFileSync, rmSync, symlinkSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import * as tek from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';

const ZDES = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/r4-V-zakon';
const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const OB = new Set(['/remake/', '/movie/']);
const mut = async (imya) => import(`file:///${ZDES}/mut/${imya}/sverka.mjs`);
const html = (url) => readFileSync(`${DIST}${url}index.html`, 'utf8');
const zam = (s, iz, na) => {
  if (typeof iz === 'string' ? !s.includes(iz) : !iz.test(s)) throw new Error('порча не применилась: ' + iz);
  return s.replace(iz, na);
};

/** Зеркало входов сверки в своей папке (как zerkalo() теста); правка icons.ts — по желанию. */
function zerkalo(imya, ikony) {
  const k = join(ZDES, 'zerkalo', imya);
  rmSync(k, { recursive: true, force: true });
  for (const p of ['structure/structure.json', 'src/data/game-art.json', 'src/data/icons.ts', 'src/content/tresc']) {
    mkdirSync(dirname(join(k, p)), { recursive: true });
    cpSync(join(SAYT, p), join(k, p), { recursive: true });
  }
  if (ikony) {
    const f = join(k, 'src/data/icons.ts');
    const byl = readFileSync(f, 'utf8');
    const stal = ikony(byl);
    if (stal === byl) throw new Error('правка icons.ts не применилась');
    writeFileSync(f, stal);
  }
  return k;
}

function stranica(M, sayt, url, h) {
  const V = M.vhody(sayt);
  const page = V.struktura.pages.find((p) => p.url === url);
  const dane = V.soderzhanie.find((s) => s.dane?.url === url).dane;
  return M.sverkaStranicy({ page, dane, html: h, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: OB });
}

const rm = html('/remake/');
const K15 = html('/max-payne-3/').match(/\/_astro\/mp3-k15\.[^" ,]+/)[0];
const DOWN = '<path d="m6 9 6 6 6-6"/>';
const SLUCHAI = [
  ['V3-3-html', 'style у <html>', '/remake/', zam(rm, /<html\b/, '<html style="filter: invert(1)"')],
  ['V3-3-body', 'style у <body>', '/remake/', zam(rm, /<body\b/, '<body style="display: none"')],
  ['V3-3-prochie', 'style у ряда вне героя', '/remake/', zam(rm, 'id="what-it-is"', 'id="what-it-is" style="display: none"')],
  ['V3-3-link', '<link rel=stylesheet> в <main>', '/remake/', zam(rm, '<main id="content">', '<main id="content"><link rel="stylesheet" href="/proba.css">')],
  ['V3-4-registr', 'poster с /_ASTRO/ (прописными)', '/remake/', zam(rm, '<div class="hero__scrim"', `<video poster="${K15.replace('/_astro/', '/_ASTRO/')}"></video><div class="hero__scrim"`)],
  ['V3-4-kosaya', 'poster с /_astro\\ (браузер читает \\ как /)', '/remake/', zam(rm, '<div class="hero__scrim"', `<video poster="${K15.replace('/_astro/', '/_astro\\')}"></video><div class="hero__scrim"`)],
  ['V3-6-aria', 'aria-labelledby «связанных» на чужой id', '/remake/', zam(rm, 'aria-labelledby="related-title"', 'aria-labelledby="release-date-title"')],
  ['V3-6-h2', 'заголовок «связанных» — h3 с классами', '/remake/', zam(rm, /<h2 class="link-list__title t-headline" id="related-title"([^>]*)>([^<]*)<\/h2>/, '<h3 class="link-list__title t-headline" id="related-title"$1>$2</h3>')],
  ['V3-6-klass', 'заголовок «связанных» без link-list__title', '/remake/', zam(rm, 'class="link-list__title t-headline"', 'class="t-headline"')],
  ['V3-6-headline', 'заголовок «связанных» без t-headline', '/remake/', zam(rm, 'class="link-list__title t-headline"', 'class="link-list__title"')],
];

for (const [imya, chto, url, h] of SLUCHAI) {
  const M = await mut(imya);
  const a = stranica(tek, SAYT, url, h);
  const b = stranica(M, SAYT, url, h);
  console.log(`${imya} — ${chto}\n  текущая: ${a.length ? a.join(' | ') : 'замечаний нет'}\n  мутант:  ${b.length ? b.join(' | ') : 'замечаний нет'}`);
}

// V3-8-vlozhennye: законная иконка с вложенным svg в icons.ts и в печати — текущая молчит, мутант (все svg в счёт) отказывает.
{
  const VL = '<svg x="0" y="0">' + DOWN + '</svg>';
  const k = zerkalo('vlozhennye', (t) => t.replace(`'arrow-down': '${DOWN}'`, `'arrow-down': '${VL}'`));
  const h = rm.replace(DOWN, VL);
  const M = await mut('V3-8-vlozhennye');
  const a = stranica(tek, k, '/remake/', h);
  const b = stranica(M, k, '/remake/', h);
  console.log(`V3-8-vlozhennye — законная иконка с вложенным svg\n  текущая: ${a.length ? a.join(' | ') : 'замечаний нет'}\n  мутант:  ${b.length ? b.join(' | ') : 'замечаний нет'}`);
}

// V3-8-tekst-ikony: иконка с <title> в icons.ts, в печати <title> с другим текстом (подсказка при наведении) — текущая
// отказывает, мутант (подпись иконки без текста) молчит.
{
  const T = '<title>Down</title>' + DOWN;
  const k = zerkalo('tekst', (t) => t.replace(`'arrow-down': '${DOWN}'`, `'arrow-down': '${T}'`));
  const h = rm.replace(DOWN, '<title>Download the full game</title>' + DOWN);
  const M = await mut('V3-8-tekst-ikony');
  const a = stranica(tek, k, '/remake/', h);
  const b = stranica(M, k, '/remake/', h);
  console.log(`V3-8-tekst-ikony — текст <title> иконки не как в icons.ts\n  текущая: ${a.length ? a.join(' | ') : 'замечаний нет'}\n  мутант:  ${b.length ? b.join(' | ') : 'замечаний нет'}`);
}

// V3-10-petlya: петля ссылок — у текущей страниц сверено столько, сколько файлов; у мутанта (без памяти пройденного)
// обход идёт по петле до отказа длины пути, файлы читаются многократно — а тест петли смотрит только на пустые замечания.
{
  const k = zerkalo('petlya');
  const svyaz = join(k, 'src/content/tresc/petlya');
  if (!existsSync(svyaz)) symlinkSync(join(k, 'src/content/tresc'), svyaz, 'junction');
  const M = await mut('V3-10-petlya');
  const a = tek.sverkaSborki(DIST, k, { obyazatelnaPodpis: OB });
  const b = M.sverkaSborki(DIST, k, { obyazatelnaPodpis: OB });
  console.log(`V3-10-petlya — ссылка-переход на свою папку\n  текущая: страниц ${a.stranic}, замечаний ${a.zamechaniya.length}\n  мутант:  страниц ${b.stranic}, замечаний ${b.zamechaniya.length}`);
}
