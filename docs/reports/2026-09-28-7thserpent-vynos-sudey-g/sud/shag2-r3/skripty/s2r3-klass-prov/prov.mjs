// Проверяющий s2r3-klass-prov: воспроизведение находок S2R3-K-1…K-4 своим кодом и свои члены класса.
// Репозиторий — только чтение; HTML портится в памяти.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { sverkaStranicy, sverkaSborki, vhody } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';
import { OBYAZATELNAYA_PODPIS } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/gates/sverka.mjs';
import { razobrat, elementy, imya, klassy, predki } from 'file:///D:/SEO/cloud/site-generator/core/text/html.mjs';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const OUT = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/s2r3/s2r3-klass-prov/stranicy';
mkdirSync(OUT, { recursive: true });
const V = vhody(SAYT);
const OB = new Set(OBYAZATELNAYA_PODPIS);

function vzyat(url) {
  return {
    page: V.struktura.pages.find((p) => p.url === url),
    dane: V.soderzhanie.find((s) => s.dane?.url === url)?.dane,
    html: readFileSync(join(DIST, url.slice(1), 'index.html'), 'utf8'),
  };
}
function zamenit(s, iz, na) {
  const est = typeof iz === 'string' ? s.includes(iz) : iz.test(s);
  if (!est) throw new Error('порча не легла: ' + String(iz).slice(0, 80));
  return s.replace(iz, na);
}
const GEROY = /(<section class="hero" aria-labelledby="page-title" data-astro-cid-[a-z0-9]+>)/;
const PODPIS = /(<p class="podpis-geroya t-caption" data-astro-cid-[a-z0-9]+>)/;
const SKRIM = /(<div class="hero__scrim" data-astro-cid-[a-z0-9]+>)/;
const KONEC_GEROYA = /(<\/section><\/div>)/;

const TEN = '<template shadowrootmode="open"></template>';
const TEN_ZAKR = '<template shadowrootmode="closed"><p>x</p></template>';
const SLOT = '<template shadowrootmode="open"><slot name="drugoy"></slot></template>';
const KOD = "parent.document.querySelector('.podpis-geroya').textContent='PODMENA'";
const IFR = '<iframe hidden srcdoc="&lt;script&gt;' + KOD.replace(/'/g, '&#39;') + '&lt;/script&gt;"></iframe>';
const IFR_JS = '<iframe hidden src="javascript:' + KOD.replace(/'/g, '&#39;') + '"></iframe>';
const REFRESH = '<meta http-equiv="refresh" content="0; url=/drugaya.html">';
const KREDIT = '<div class="foto__credit t-caption">Pictured: PODMENA-KREDIT</div>';
const DLINNO = 'Pictured: PODMENA-DLINNO. ' + 'Lorem ipsum dolor sit amet consectetur. '.repeat(60);
const KREDIT_DLINNYI = '<div class="foto__credit t-caption">' + DLINNO + '</div>';

const SLUCHAI = [
  ['контроль', 'без порчи', null],
  ['контроль', 'шаблон теневого корня в div.geroy', (h) => zamenit(h, /(<div class="geroy[^>]*>)/, '$1' + TEN)],
  ['контроль', '<script> в <main> после героя', (h) => zamenit(h, KONEC_GEROYA, '$1<script>1</script>')],
  ['контроль', '.foto__credit в .hero__art', (h) => zamenit(h, /(<div class="hero__art"[^>]*>)/, '$1' + KREDIT)],
  ['K-1', 'теневой корень первым ребёнком section.hero', (h) => zamenit(h, GEROY, '$1' + TEN)],
  ['K-1', 'теневой корень первым ребёнком <main>', (h) => zamenit(h, '<main id="content">', '<main id="content">' + TEN)],
  ['K-1', 'теневой корень первым ребёнком <body>', (h) => zamenit(h, '<body>', '<body>' + TEN)],
  ['K-1', 'шаблон с именованным slot в section.hero', (h) => zamenit(h, GEROY, '$1' + SLOT)],
  ['K-1+', 'закрытый теневой корень с текстом в <main> (мой вариант)', (h) => zamenit(h, '<main id="content">', '<main id="content">' + TEN_ZAKR)],
  ['K-2', '.foto__credit ребёнком section.hero перед подписью', (h) => zamenit(h, PODPIS, KREDIT + '$1')],
  ['K-3', 'iframe srcdoc в <main> после героя', (h) => zamenit(h, KONEC_GEROYA, '$1' + IFR)],
  ['K-3', 'iframe srcdoc в section.hero перед подписью', (h) => zamenit(h, PODPIS, IFR + '$1')],
  ['K-3', 'iframe src=javascript: в <main> после героя', (h) => zamenit(h, KONEC_GEROYA, '$1' + IFR_JS)],
  ['K-3', 'iframe srcdoc перед подвалом', (h) => zamenit(h, '<footer class="ft"', IFR + '<footer class="ft"')],
  ['K-4', 'meta refresh в <main> после героя', (h) => zamenit(h, KONEC_GEROYA, '$1' + REFRESH)],
  ['K-4', 'meta refresh перед подвалом', (h) => zamenit(h, '<footer class="ft"', REFRESH + '<footer class="ft"')],
  ['свой', 'длинный .foto__credit в шапке header.hdr (вне <main>)', (h) => zamenit(h, /(<header class="hdr"[^>]*>)/, '$1' + KREDIT_DLINNYI)],
  ['свой', 'длинный .foto__credit ребёнком <body> после </main>', (h) => zamenit(h, '</main>', '</main>' + KREDIT_DLINNYI)],
  ['свой', '.foto__credit в .hero__scrim', (h) => zamenit(h, SKRIM, '$1' + KREDIT)],
];

function derevo(html) {
  const doc = razobrat(html);
  const p = elementy(doc, (u) => klassy(u).has('podpis-geroya'))[0];
  const kr = elementy(doc, (u) => klassy(u).has('foto__credit')).map((u) => predki(u).slice(0, 2).map((x) => imya(x) + '.' + [...klassy(x)].join('.')).join('<'));
  const t = elementy(doc, (u) => imya(u) === 'template').map((u) => imya(u.parentNode ?? {}));
  return `цепочка ${predki(p).map(imya).join('<')}; кредит: ${kr.join(',') || '—'}; template: ${t.join(',') || '—'}`;
}

const zhurnal = [];
const dlyaBrauzera = {};
for (const [gr, nazv, porcha] of SLUCHAI) {
  const itog = [];
  let primer = '';
  let dr = '';
  for (const url of OBYAZATELNAYA_PODPIS) {
    const s = vzyat(url);
    const html = porcha ? porcha(s.html) : s.html;
    if (!dr) dr = derevo(html);
    const z = sverkaStranicy({ page: s.page, dane: s.dane, html, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: OB });
    itog.push(z.length ? 'ЛОВИТ' : 'молчит');
    if (z.length && !primer) primer = z.join(' | ').slice(0, 160);
    if (url === '/mods/') dlyaBrauzera[gr + ' ' + nazv] = html;
  }
  const m = itog.filter((x) => x === 'молчит').length;
  zhurnal.push(`[${gr}] ${nazv}: молчит ${m}/6 (${itog.join(' ')})${primer ? ' — ' + primer : ''}\n     ${dr}`);
}
const sb = sverkaSborki(DIST, SAYT, { obyazatelnaPodpis: OB });
zhurnal.push(`sverkaSborki эталона: страниц ${sb.stranic}, замечаний ${sb.zamechaniya.length}${sb.zamechaniya.length ? ' — ' + JSON.stringify(sb.zamechaniya).slice(0, 300) : ''}`);

// Страницы для браузера: /mods/ с порчей, таблица стилей сборки встроена.
const css = readFileSync(join(DIST, '_astro/CtaBand.BMbqpUCi.css'), 'utf8');
const vstroit = (h) => h.replace('<link rel="stylesheet" href="/_astro/CtaBand.BMbqpUCi.css">', '<style>' + css + '</style>');
const imena = {};
Object.entries(dlyaBrauzera).forEach(([k, h], i) => {
  imena['s' + i + '.html'] = k;
  writeFileSync(join(OUT, 's' + i + '.html'), vstroit(h));
});
writeFileSync(join(OUT, 'drugaya.html'), '<!doctype html><title>другая</title><p>другая страница</p>');
writeFileSync(join(OUT, '..', 'imena.json'), JSON.stringify(imena, null, 1));
console.log(zhurnal.join('\n'));
