// Внешние загрузки статически по сборке: каждый адрес, который страница загрузит сама,
// без щелчка посетителя, — свой хост (7thserpent.com, с www или без) или относительный.
// Ссылки <a href> — переходы по щелчку, не загрузки: считаются отдельной строкой.
// Только чтение.   node vneshnie.mjs <dist>
//
// ЧТО СЧИТАЕТСЯ ЗАГРУЗКОЙ (раунд 1 «судью судят», R1-INSTR-7 — первая редакция видела
// 7 из 28 подложенных видов):
//   HTML и SVG — теги разбираются с учётом кавычек; атрибуты в двойных, одинарных кавычках
//   и без них, с пробелами вокруг «=», сущности раскрываются. Атрибуты: src, srcset,
//   imagesrcset, data (object), poster, background, href у link (при любом rel, кроме
//   чисто ссылочных: canonical, alternate без icon/stylesheet, author, license, help, next,
//   prev, search, me), href и xlink:href у SVG image, use, feImage, script; href у base;
//   content у meta http-equiv=refresh (url=…);
//   CSS (файлы и <style>, атрибуты style) — url(…) с кавычками и без, экранирование
//   `\68` и `\"` раскрывается, строки внутри image-set(…), @import «…»;
//   исполняемый JS (файлы .js/.mjs и <script> без type=application/ld+json и json) — любая
//   строка вида http(s)://… или //… считается подозрением и печатается (эвристика, не разбор).
//   Адрес разбирается `new URL(адрес, страница сайта)` — парсером WHATWG, как у браузера
//   (раунд 2; первая правка нормализовала руками: снимала пробелы и меняла `\` на `/`).
// ПРЕДЕЛЫ (названы): ping у ссылок (уходит по щелчку); адреса, собранные скриптом из частей;
// @font-face src с format() разбираются как url(…) — да, остальные дескрипторы — нет;
// свой хост в абсолютной записи (https://www.7thserpent.com/…) считается своим, хотя при
// локальной съёмке он ушёл бы на боевой сайт (R1-INSTR-8) — такие адреса печатаются
// отдельной строкой, если они загрузки.
// Раунд 2 («судью судят»), не чинится — у репозитория нет парсера HTML по стандарту, разбор
// тегов — регулярными выражениями: повтор атрибута (браузер берёт первый, инструмент — последний),
// `<!-->`, `--!>`, `</script x>`, тип скрипта ищется по всей строке атрибутов (R2-INSTR-11, -12);
// meta refresh без `url=`, обработчики `on…=`, `iframe srcdoc`, адреса `data:` (R2-INSTR-14).
// Основной довод «внешних загрузок нет» — браузерная проверка (performance, zamery/vneshnie-zaprosy.json);
// этот разбор — вторая, статическая линия.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const dist = process.argv[2];
if (!dist || !statSync(dist, { throwIfNoEntry: false })?.isDirectory()) {
  console.error('нет папки сборки: ' + dist);
  process.exit(2);
}
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push(p); } };
walk(dist);

const SUSHCH = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", colon: ':', sol: '/', bsol: '\\', period: '.', nbsp: ' ', tab: '\t', newline: '\n' };
const raskryt = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);?/gi, (m, k) => {
  if (k[0] === '#') { const n = k[1].toLowerCase() === 'x' ? parseInt(k.slice(2), 16) : Number(k.slice(1)); try { return String.fromCodePoint(n); } catch { return m; } }
  return SUSHCH[k.toLowerCase()] ?? m;
});
const cssRaskryt = (s) => s.replace(/\\([0-9a-f]{1,6})\s?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\(.)/g, '$1');
// Адрес разбирается парсером WHATWG (`new URL`) против адреса страницы сайта — так же, как его
// разберёт браузер: управляющие знаки и пробелы по краям снимаются, табы и переводы строк внутри
// выбрасываются, `\` читается как `/`, `http:host` на https-странице — внешний, userinfo не
// маскирует хост («судью судят», раунд 2, R2-INSTR-8, -9, -10). Внешний — схема http(s) и хост
// не 7thserpent.com / www.7thserpent.com. Не разбирается — не загрузка (браузер не пойдёт).
const BAZA = 'https://www.7thserpent.com/pc/';
const SVOI_HOSTY = new Set(['www.7thserpent.com', '7thserpent.com']);
const razobrat = (u) => { try { return new URL(u, BAZA); } catch { return null; } };
const vneshniy = (u) => { const r = razobrat(u); return !!r && (r.protocol === 'http:' || r.protocol === 'https:') && !SVOI_HOSTY.has(r.hostname); };
const svoyAbs = (u) => { const r = razobrat(u); return !!r && SVOI_HOSTY.has(r.hostname) && /^[\x00-\x20]*(?:[a-z][a-z0-9+.-]*:|[/\\]{2})/i.test(u); };

const zagruzki = [], svoiAbs = [], ssylki = [], podozrenia = [];
const zapis = (f, chto, u) => {
  if (vneshniy(u)) zagruzki.push(`${f}: ${chto} ${u}`);
  else if (svoyAbs(u)) svoiAbs.push(`${f}: ${chto} ${u}`);
};
const srcsetAdresa = (v) => v.split(',').map((c) => c.trim().split(/\s+/)[0]).filter(Boolean);

function css(f, t, gde) {
  // Комментарии CSS снимаются до поиска: `@import/**/"…"` (раунд 2, R2-INSTR-13).
  const r = cssRaskryt(t.replace(/\/\*[\s\S]*?\*\//g, ' '));
  for (const m of r.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi)) zapis(f, `${gde} url()`, m[1] ?? m[2] ?? m[3] ?? '');
  for (const m of r.matchAll(/image-set\(([^;{}]*)\)/gi)) for (const s of m[1].matchAll(/"([^"]*)"|'([^']*)'/g)) zapis(f, `${gde} image-set`, s[1] ?? s[2]);
  for (const m of r.matchAll(/@import\s*(?:url\()?\s*["']?([^"')\s;]+)/gi)) zapis(f, `${gde} @import`, m[1]);
}
function js(f, t, gde) {
  for (const m of t.matchAll(/["'`]((?:https?:)?\/\/[^"'`\s]+)["'`]/gi)) if (vneshniy(m[1])) podozrenia.push(`${f}: ${gde} строка ${m[1]}`);
}
const SSYLOCHNYE_REL = new Set(['canonical', 'alternate', 'author', 'license', 'help', 'next', 'prev', 'search', 'me', 'nofollow', 'noopener', 'noreferrer']);

for (const f of files) {
  const ext = extname(f).toLowerCase();
  const rel = f.slice(dist.length).replace(/\\/g, '/');
  if (ext === '.css') { css(rel, readFileSync(f, 'utf8'), 'CSS'); continue; }
  if (ext === '.js' || ext === '.mjs') { js(rel, readFileSync(f, 'utf8'), 'JS'); continue; }
  if (!['.html', '.htm', '.svg'].includes(ext)) continue;
  const t = readFileSync(f, 'utf8');
  for (const m of t.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) css(rel, m[1], '<style>');
  for (const m of t.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (/type\s*=\s*["']?application\/(?:ld\+)?json/i.test(m[1])) continue;
    js(rel, m[2], '<script>');
  }
  const bezSkryptov = t.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, (s) => s.slice(0, s.indexOf('>') + 1)).replace(/<!--[\s\S]*?-->/g, '');
  for (const m of bezSkryptov.matchAll(/<([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g)) {
    const tag = m[1].toLowerCase();
    const at = {};
    for (const a of m[2].matchAll(/([^\s=/>"']+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>"']+))?/g)) {
      const v = a[2] === undefined ? '' : a[2].replace(/^["']|["']$/g, '');
      at[a[1].toLowerCase()] = raskryt(v);
    }
    const chto = (imya) => `<${tag} ${imya}>`;
    for (const imya of ['src', 'data', 'poster', 'background']) if (at[imya] !== undefined) zapis(rel, chto(imya), at[imya]);
    for (const imya of ['srcset', 'imagesrcset']) if (at[imya] !== undefined) for (const u of srcsetAdresa(at[imya])) zapis(rel, chto(imya), u);
    // url() — в значении любого атрибута: style и презентационные атрибуты SVG (fill, filter,
    // mask, clip-path…) — раунд 2, R2-INSTR-7 (первая редакция искала url( по всему HTML).
    for (const [imya, v] of Object.entries(at)) if (/url\s*\(|@import/i.test(v)) css(rel, v, chto(imya));
    const href = at.href ?? at['xlink:href'];
    if (href !== undefined) {
      if (tag === 'a' || tag === 'area') {
        if (vneshniy(href)) ssylki.push(`${rel}: ${href}`);
      } else if (tag === 'link') {
        const rels = (at.rel ?? '').toLowerCase().split(/\s+/).filter(Boolean);
        const tolkoSsylka = rels.length > 0 && rels.every((r) => SSYLOCHNYE_REL.has(r));
        if (!tolkoSsylka) zapis(rel, `<link rel="${at.rel ?? ''}" href>`, href);
      } else zapis(rel, chto('href'), href);
    }
    if (tag === 'meta' && /refresh/i.test(at['http-equiv'] ?? '')) {
      const u = ((at.content ?? '').match(/url\s*=\s*['"]?([^'"]+)/i) || [])[1];
      if (u) zapis(rel, '<meta refresh>', u);
    }
  }
}
const razobrano = files.filter((f) => ['.html', '.htm', '.svg', '.css', '.js', '.mjs'].includes(extname(f).toLowerCase())).length;
console.log(`файлов разобрано (HTML, SVG, CSS, JS): ${razobrano}`);
console.log(`внешних загрузок: ${zagruzki.length}`);
for (const z of zagruzki) console.log('  ' + z);
console.log(`подозрений в исполняемом JS: ${podozrenia.length}`);
for (const z of podozrenia) console.log('  ' + z);
console.log(`загрузок по абсолютному адресу своего хоста (ушли бы на боевой сайт): ${svoiAbs.length}`);
for (const z of svoiAbs) console.log('  ' + z);
console.log(`внешних ссылок <a> (переходы, не загрузки): ${ssylki.length}`);
for (const s of ssylki) console.log('  ' + s);
process.exit(zagruzki.length || podozrenia.length ? 1 : 0);
