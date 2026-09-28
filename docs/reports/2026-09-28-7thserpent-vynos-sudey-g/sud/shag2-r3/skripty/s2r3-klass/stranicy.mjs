// Страницы /mods/ с порчами для браузера: таблица стилей сборки встроена (адреса /_astro/ с file:// не открываются).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const OUT = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/s2r3/s2r3-klass/stranicy';
mkdirSync(OUT, { recursive: true });
const css = readFileSync(join(DIST, '_astro/CtaBand.BMbqpUCi.css'), 'utf8');
const vstroit = (h) => h.replace('<link rel="stylesheet" href="/_astro/CtaBand.BMbqpUCi.css">', `<style>${css}</style>`);
const zamena = (s, iz, na) => {
  if (typeof iz === 'string' ? !s.includes(iz) : !iz.test(s)) throw new Error(`порча не применилась: ${String(iz).slice(0, 60)}`);
  return s.replace(iz, na);
};
const HERO = /(<section class="hero" aria-labelledby="page-title" data-astro-cid-m3tnyskv>)/;
const PODP = /(<p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>)/;
const TEN = '<template shadowrootmode="open"></template>';
const SKRIPT = `parent.document.querySelector('.podpis-geroya').textContent='Pictured: Max Payne 3 (2012), not the remake'`;
const IFRAME = `<iframe hidden srcdoc="&lt;script&gt;${SKRIPT.replace(/'/g, '&#39;')}&lt;/script&gt;"></iframe>`;
const IFRAME_JS = `<iframe hidden src="javascript:${SKRIPT.replace(/'/g, '&#39;')}"></iframe>`;
const KREDIT = '<div class="foto__credit t-caption">Pictured: Max Payne 3 (2012), a scene from the game</div>';
const posleGeroya = (x) => (h) => zamena(h, /(<\/section>\s*<\/div>)/, `$1${x}`);

const mods = vstroit(readFileSync(join(DIST, 'mods/index.html'), 'utf8'));
const movie = vstroit(readFileSync(join(DIST, 'movie/index.html'), 'utf8'));
const VARIANTY = {
  kontrol: (h) => h,
  'ten-hero': (h) => zamena(h, HERO, `$1${TEN}`),
  'ten-main': (h) => zamena(h, '<main id="content">', `<main id="content">${TEN}`),
  'ten-body': (h) => zamena(h, '<body>', `<body>${TEN}`),
  kredit: (h) => zamena(h, PODP, `${KREDIT}$1`),
  'iframe-srcdoc': posleGeroya(IFRAME),
  'iframe-js': posleGeroya(IFRAME_JS),
  refresh: posleGeroya('<meta http-equiv="refresh" content="0; url=movie.html">'),
};
for (const [imya, f] of Object.entries(VARIANTY)) writeFileSync(join(OUT, `${imya}.html`), f(mods));
writeFileSync(join(OUT, 'movie.html'), movie);
console.log(Object.keys(VARIANTY).join(' '));
