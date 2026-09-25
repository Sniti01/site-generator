// Сверка листов стилей двух сборок сайта — сессия 13 трека «второй сайт» (П87 п. 3):
// «Слой утилит 20 → 19: уходит .lowercase, других изменений в правилах CSS нет.
// Сверка — с листами стилей сборки main.»
//
// node sverka-css.mjs <dist-до> <dist-после> [--ushlo <правило>] [--sloy <обёртка>] [--schet <до>:<после>] [--json <файл>]
// node sverka-css.mjs --selftest
//
// Что сверяет:
//   1. Листы `*.css` сборки сопоставляются по папке и основе имени (до первой точки:
//      `_astro/LinkList`, `_astro/index`); набор основ обязан совпасть, по одному файлу на основу.
//   2. Каждый лист (валидный UTF-8, иначе отказ; так же и HTML в п. 6) разбирается в последовательность листьев: путь
//      обёрток (@layer, @media, @supports…) › прелюдия блока › подряд идущие собственные
//      объявления блока; инструкции без блока (`@layer a,b;`) и отдельные комментарии — тоже
//      листья. Последовательности до и после сравниваются наибольшей общей подпоследовательностью:
//      ушедшие и пришедшие листья.
//   3. Слой — число прямых детей-правил блоков `<обёртка>` верхнего уровня (правило, @-правило
//      с блоком или инструкция — по одному; комментарии не считаются); по умолчанию
//      `@layer utilities`. `--schet 20:19` сверяет и абсолютные числа.
//   4. Побайтно (Buffer): байты «до» без единственного вхождения ушедшего правила равны байтам
//      «после»; лист без этого правила равен побайтно.
//   5. Селектора ушедшего правила нет ни в одном листе «после»: ни у какого блока дерева на
//      любой глубине, ни в списке селекторов через запятую (минификатор сливает правила
//      с одинаковым телом), с объявлениями или без.
//   6. Прочие файлы: те же пути, кроме листов (хеш в имени). HTML — в каждом файле «после» нет
//      старых имён сменившихся листов, новых — столько же, сколько старых в «до»; каждый
//      `<link rel="stylesheet" href>` «после» ведёт на лист сборки «после»; после замены имён на
//      уровне байтов HTML равен побайтно. Остальные файлы — побайтно.
// Вердикт «сверено» — только если во всей сборке ушёл ровно один лист `<обёртка> › <правило>`
// с ровно тем телом, ничего не пришло, слой уменьшился ровно на 1 (и совпал с --schet, если он
// дан), побайтная проверка сошлась, правила нет в «после» и прочие файлы равны. Иначе — «отказ»
// и код 1. Код 2 — неверные аргументы: неизвестный флаг, флаг без значения или с пустым
// значением, --ushlo не одно правило с объявлениями, --schet не «число:число», папка сборки
// не существует.
// ПРЕДЕЛЫ (названы): разбор — для минифицированного вывода сборки: строки с экранированием,
// обратная косая вне строк (`\'`, `\{`, `\;` в селекторах произвольных значений Tailwind —
// экранированный знак идёт в текст, а не в разбор), скобки, комментарии, вложенные блоки;
// ключ листа строится из текста без нормализации (пробел или порядок объявлений — различие).
// Два листа с одной основой имени — отказ, даже если сборки равны. Ссылки HTML на листы
// ищутся по `href="…"` в кавычках в теге `<link` с `rel="stylesheet"` и считаются от корня
// сборки: href без кавычек, rel со списком значений, пробелы вокруг «=», сущности в имени,
// относительные пути и ссылки из скриптов этой проверкой не видны (у сайта ссылки только вида
// `<link rel="stylesheet" href="/_astro/…css">`); устаревшее имя листа в любом синтаксисе
// ловит счёт имён байтами. Замена имён — по имени файла без папки.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// ---------- разбор CSS ----------

function konecStroki(t, i) {
  const q = t[i];
  for (let j = i + 1; j < t.length; j++) {
    if (t[j] === '\\') { j++; continue; }
    if (t[j] === q) return j;
  }
  throw new Error('незакрытая строка с позиции ' + i);
}

export function razobrat(t) {
  let i = 0;
  const zayavlenie = (s) => ({ tip: s.startsWith('@') ? 'instr' : 'decl', tekst: s });
  function uroven(vnutri) {
    const deti = [];
    let buf = '';
    let skobki = 0;
    while (i < t.length) {
      const c = t[i];
      if (c === '\\') {
        if (i + 1 >= t.length) throw new Error('обратная косая в конце текста');
        buf += c + t[i + 1]; i += 2;
        continue;
      }
      if (c === '/' && t[i + 1] === '*') {
        const j = t.indexOf('*/', i + 2);
        if (j < 0) throw new Error('незакрытый комментарий с позиции ' + i);
        const k = t.slice(i, j + 2);
        if (buf.trim() === '' && skobki === 0) deti.push({ tip: 'komm', tekst: k });
        else buf += k;
        i = j + 2;
        continue;
      }
      if (c === '"' || c === "'") { const j = konecStroki(t, i); buf += t.slice(i, j + 1); i = j + 1; continue; }
      if (c === '(') { skobki++; buf += c; i++; continue; }
      if (c === ')') { skobki--; if (skobki < 0) throw new Error('лишняя ) на позиции ' + i); buf += c; i++; continue; }
      if (skobki > 0) { buf += c; i++; continue; }
      if (c === '{') {
        const prelude = buf.trim(); buf = ''; i++;
        deti.push({ tip: 'blok', prelude, deti: uroven(true) });
        continue;
      }
      if (c === '}') {
        if (!vnutri) throw new Error('лишняя } на позиции ' + i);
        if (buf.trim()) deti.push(zayavlenie(buf.trim()));
        i++;
        return deti;
      }
      if (c === ';') { if (buf.trim()) deti.push(zayavlenie(buf.trim())); buf = ''; i++; continue; }
      buf += c; i++;
    }
    if (vnutri) throw new Error('незакрытый блок в конце текста');
    if (skobki !== 0) throw new Error('незакрытая ( в конце текста');
    if (buf.trim()) deti.push(zayavlenie(buf.trim()));
    return deti;
  }
  return uroven(false);
}

// Листья в порядке текста. Подряд идущие объявления блока — один лист с путём блока.
export function listya(deti, put = [], out = []) {
  let gruppa = null;
  for (const d of deti) {
    if (d.tip === 'decl') {
      if (!gruppa) { gruppa = { put: put.join(' › '), prelude: put[put.length - 1] ?? '', tekst: [] }; out.push(gruppa); }
      gruppa.tekst.push(d.tekst);
      continue;
    }
    gruppa = null;
    if (d.tip === 'blok') {
      const p2 = [...put, d.prelude];
      if (d.deti.length === 0) out.push({ put: p2.join(' › '), prelude: d.prelude, tekst: ['(пустой блок)'] });
      listya(d.deti, p2, out);
    } else {
      out.push({ put: put.join(' › '), prelude: '', tekst: [d.tip + ' ' + d.tekst] });
    }
  }
  return out;
}

export const klyuch = (l) => l.put + ' {' + l.tekst.join(';') + '}';

export function sloyUtilit(derevo, sloy = '@layer utilities') {
  let n = 0, blokov = 0;
  for (const d of derevo) if (d.tip === 'blok' && d.prelude === sloy) { blokov++; n += d.deti.filter(x => x.tip !== 'komm').length; }
  return { pravil: n, blokov };
}

// Селекторы прелюдии через запятую верхнего уровня (вне скобок и строк).
export function selektory(prelude) {
  const out = [];
  let buf = '', skobki = 0;
  for (let i = 0; i < prelude.length; i++) {
    const c = prelude[i];
    if (c === '\\') { buf += c + (prelude[i + 1] ?? ''); i++; continue; }
    if (c === '"' || c === "'") { const j = konecStroki(prelude, i); buf += prelude.slice(i, j + 1); i = j; continue; }
    if (c === '(' || c === '[') skobki++;
    if (c === ')' || c === ']') skobki--;
    if (c === ',' && skobki === 0) { out.push(buf.trim()); buf = ''; continue; }
    buf += c;
  }
  out.push(buf.trim());
  return out;
}

// Сколько блоков дерева на любой глубине несут селектор `sel` (сам по себе или в списке).
export function blokovSSelektorom(deti, sel) {
  let n = 0;
  for (const d of deti) {
    if (d.tip !== 'blok') continue;
    if (!d.prelude.startsWith('@') && selektory(d.prelude).includes(sel)) n++;
    n += blokovSSelektorom(d.deti, sel);
  }
  return n;
}

// Наибольшая общая подпоследовательность: что ушло из a и что пришло в b.
export function raznica(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ushlo = [], prishlo = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) ushlo.push({ nomer: i, klyuch: a[i++] });
    else prishlo.push({ nomer: j, klyuch: b[j++] });
  }
  while (i < n) ushlo.push({ nomer: i, klyuch: a[i++] });
  while (j < m) prishlo.push({ nomer: j, klyuch: b[j++] });
  return { ushlo, prishlo, obshchih: dp[0][0] };
}

// ---------- байты ----------

const UTF8 = new TextDecoder('utf-8', { fatal: true });
const tekstUtf8 = (buf) => UTF8.decode(buf); // бросает на невалидном UTF-8

export function vhozhdeniya(buf, igla) {
  const b = Buffer.from(igla);
  let n = 0;
  for (let i = buf.indexOf(b); i >= 0; i = buf.indexOf(b, i + b.length)) n++;
  return n;
}

export function zamenitVse(buf, s, na) {
  const a = Buffer.from(s), b = Buffer.from(na);
  const chasti = [];
  let from = 0;
  for (let i = buf.indexOf(a); i >= 0; i = buf.indexOf(a, from)) { chasti.push(buf.subarray(from, i), b); from = i + a.length; }
  chasti.push(buf.subarray(from));
  return Buffer.concat(chasti);
}

function ubratOdno(buf, s) {
  const a = Buffer.from(s);
  const i = buf.indexOf(a);
  return Buffer.concat([buf.subarray(0, i), buf.subarray(i + a.length)]);
}

// ---------- сверка двух сборок ----------

const osnova = (p) => {
  const i = p.lastIndexOf('/');
  return p.slice(0, i + 1) + p.slice(i + 1).split('.')[0];
};
const imyaFajla = (p) => p.slice(p.lastIndexOf('/') + 1);

// Правило «ушедшего»: '.lowercase{text-transform:lowercase}' → прелюдия и тело листа.
function pravilo(s) {
  const d = razobrat(s);
  if (d.length !== 1 || d[0].tip !== 'blok' || d[0].deti.length === 0 || d[0].deti.some(x => x.tip !== 'decl'))
    throw new Error('--ushlo: ждали одно правило с объявлениями, получено: ' + s);
  return { tekst: s, prelude: d[0].prelude, telo: d[0].deti.map(x => x.tekst) };
}

// Ссылки на листы стилей в HTML: href тегов <link rel="stylesheet">.
function ssylkiNaListy(html) {
  const out = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/\brel=["']?stylesheet\b/i.test(tag)) continue;
    const h = tag.match(/\bhref=["']([^"']+)["']/i);
    if (h) out.push(h[1]);
  }
  return out;
}

export function sverit(fDo, fPosle, { ushlo = '.lowercase{text-transform:lowercase}', sloy = '@layer utilities', schet = null } = {}) {
  const ozh = pravilo(ushlo);
  const ozhKlyuch = klyuch({ put: sloy + ' › ' + ozh.prelude, tekst: ozh.telo });
  const otkazy = [];
  const poOsnove = (fajly, kto) => {
    const m = new Map();
    for (const p of [...fajly.keys()].filter(x => x.endsWith('.css')).sort()) {
      const o = osnova(p);
      if (m.has(o)) otkazy.push(`${kto}: два листа с основой ${o} (${m.get(o)}, ${p})`);
      m.set(o, p);
    }
    return m;
  };
  const oDo = poOsnove(fDo, 'до'), oPosle = poOsnove(fPosle, 'после');
  if (oDo.size === 0) otkazy.push('в сборке «до» нет ни одного листа *.css');
  if (oPosle.size === 0) otkazy.push('в сборке «после» нет ни одного листа *.css');
  const osnovy = [...new Set([...oDo.keys(), ...oPosle.keys()])].sort();
  const listy = [], zamena = [], vsegoUshlo = [], vsegoPrishlo = [];
  let utilDo = 0, utilPosle = 0, pravilaVPosle = 0;
  for (const o of osnovy) {
    const a = oDo.get(o), b = oPosle.get(o);
    if (!a || !b) { otkazy.push(`лист с основой ${o} есть только ${a ? 'до' : 'после'}`); continue; }
    zamena.push([imyaFajla(a), imyaFajla(b)]);
    const bDo = fDo.get(a), bPosle = fPosle.get(b);
    let tDo, tPosle, dDo, dPosle;
    try { tDo = tekstUtf8(bDo); tPosle = tekstUtf8(bPosle); }
    catch (e) { otkazy.push(`${o}: лист не валидный UTF-8 — ${e.message}`); continue; }
    try { dDo = razobrat(tDo); dPosle = razobrat(tPosle); }
    catch (e) { otkazy.push(`${o}: разбор — ${e.message}`); continue; }
    const lvDo = listya(dDo), lvPosle = listya(dPosle);
    const lDo = lvDo.map(klyuch), lPosle = lvPosle.map(klyuch);
    const r = raznica(lDo, lPosle);
    const uDo = sloyUtilit(dDo, sloy), uPosle = sloyUtilit(dPosle, sloy);
    utilDo += uDo.pravil; utilPosle += uPosle.pravil;
    const vPosle = blokovSSelektorom(dPosle, ozh.prelude);
    pravilaVPosle += vPosle;
    const vhozhdeniy = vhozhdeniya(bDo, ozh.tekst);
    let pobaitno, pobaitnoOk;
    if (r.ushlo.length === 0 && r.prishlo.length === 0) { pobaitnoOk = bDo.equals(bPosle); pobaitno = pobaitnoOk ? 'равен' : 'не равен'; }
    else if (vhozhdeniy === 1) { pobaitnoOk = ubratOdno(bDo, ozh.tekst).equals(bPosle); pobaitno = pobaitnoOk ? 'равен без ушедшего правила' : 'не равен и без ушедшего правила'; }
    else { pobaitnoOk = false; pobaitno = `ушедшее правило входит в байты «до» ${vhozhdeniy} раз — побайтная проверка невозможна`; }
    if (!pobaitnoOk) otkazy.push(`${o}: побайтно — ${pobaitno}`);
    listy.push({
      osnova: o, do: a, posle: b, baitDo: bDo.length, baitPosle: bPosle.length,
      listyevDo: lDo.length, listyevPosle: lPosle.length, obshchih: r.obshchih,
      sloyDo: uDo, sloyPosle: uPosle, ushlo: r.ushlo, prishlo: r.prishlo, pobaitno,
      ushedshegoVPosle: vPosle,
    });
    vsegoUshlo.push(...r.ushlo.map(x => ({ list: o, ...x })));
    vsegoPrishlo.push(...r.prishlo.map(x => ({ list: o, ...x })));
  }
  const pokaz = (x) => `[${x.list} #${x.nomer}] ${x.klyuch}`;
  if (vsegoUshlo.length !== 1 || vsegoUshlo[0].klyuch !== ozhKlyuch)
    otkazy.push(`ушло листьев ${vsegoUshlo.length}, ждали ровно один: ${ozhKlyuch}` +
      (vsegoUshlo.length ? ' — ушли: ' + vsegoUshlo.map(pokaz).join(' | ') : ''));
  if (vsegoPrishlo.length) otkazy.push(`пришло листьев ${vsegoPrishlo.length}: ` + vsegoPrishlo.map(pokaz).join(' | '));
  if (utilDo - utilPosle !== 1) otkazy.push(`слой ${sloy}: ${utilDo} → ${utilPosle}, ждали уменьшения ровно на 1`);
  if (schet && (schet[0] !== utilDo || schet[1] !== utilPosle)) otkazy.push(`слой ${sloy}: ${utilDo} → ${utilPosle}, по --schet ждали ${schet[0]} → ${schet[1]}`);
  if (pravilaVPosle) otkazy.push(`селектор ${ozh.prelude} есть в «после» (блоков: ${pravilaVPosle})`);

  // Прочие файлы.
  const smena = zamena.filter(([x, y]) => x !== y);
  const listyPosle = new Set([...fPosle.keys()].filter(p => p.endsWith('.css')));
  const prochieDo = [...fDo.keys()].filter(p => !p.endsWith('.css')).sort();
  const prochiePosle = new Set([...fPosle.keys()].filter(p => !p.endsWith('.css')));
  let ravnyh = 0, htmlSZamenoy = 0, htmlProvereno = 0;
  const razlichny = [];
  for (const p of prochieDo) {
    if (!prochiePosle.has(p)) { otkazy.push(`файл есть только до: ${p}`); continue; }
    prochiePosle.delete(p);
    const a = fDo.get(p), b = fPosle.get(p);
    if (p.endsWith('.html')) {
      htmlProvereno++;
      for (const [x, y] of smena) {
        const staryhVPosle = vhozhdeniya(b, x), staryhVDo = vhozhdeniya(a, x), novyhVPosle = vhozhdeniya(b, y);
        if (staryhVPosle) otkazy.push(`${p}: в «после» осталось старое имя листа ${x} (${staryhVPosle} раз)`);
        if (novyhVPosle !== staryhVDo) otkazy.push(`${p}: новое имя ${y} в «после» ${novyhVPosle} раз, старое ${x} в «до» — ${staryhVDo}`);
      }
      let html;
      try { html = tekstUtf8(b); } catch (e) { otkazy.push(`${p}: не валидный UTF-8 — ${e.message}`); html = ''; }
      for (const h of ssylkiNaListy(html)) {
        const put = h.replace(/^\//, '').split('?')[0];
        if (!listyPosle.has(put)) otkazy.push(`${p}: <link rel="stylesheet" href="${h}"> ведёт мимо листов сборки «после»`);
      }
      if (a.equals(b)) { ravnyh++; continue; }
      let t = a;
      for (const [x, y] of smena) t = zamenitVse(t, x, y);
      if (t.equals(b)) { htmlSZamenoy++; continue; }
      razlichny.push(p);
      continue;
    }
    if (a.equals(b)) { ravnyh++; continue; }
    razlichny.push(p);
  }
  for (const p of prochiePosle) otkazy.push(`файл есть только после: ${p}`);
  if (razlichny.length) otkazy.push('различаются: ' + razlichny.join(', '));

  return {
    verdikt: otkazy.length ? 'отказ' : 'сверено',
    otkazy,
    ozhidalos: ozhKlyuch,
    sloy: { imya: sloy, do: utilDo, posle: utilPosle },
    listy,
    prochie: { vsegoDo: prochieDo.length, ravnyhPobaitno: ravnyh, htmlProvereno, htmlRavnyhPosleZameny: htmlSZamenoy, razlichny },
  };
}

// ---------- файлы ----------

export function chitatPapku(koren) {
  const m = new Map();
  const obhod = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) obhod(p);
      else m.set(relative(koren, p).split(sep).join('/'), readFileSync(p));
    }
  };
  obhod(koren);
  return m;
}

// ---------- самопроверка ----------

const OBRAZEC = '/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */\n' +
  '@layer properties{@supports (((-webkit-hyphens:none)) and (not (margin-trim:inline))){*,:before,:after{--tw-x:initial}}}' +
  '@layer theme{:root,:host{--color-bg:#090c11}}@layer base{*{box-sizing:border-box}}@layer components;' +
  '@layer utilities{.relative{position:relative}.container{width:100%}@media (width>=40rem){.container{max-width:40rem}}' +
  '.flex{display:flex}.lowercase{text-transform:lowercase}.outline{outline-style:var(--tw-outline-style);outline-width:1px}}' +
  '.x[data-astro-cid-a]{background:url(data:image/svg+xml;base64,AAA=);content:"a;b{c}"}' +
  '@property --tw-x{syntax:"*";inherits:false}@keyframes k{0%{opacity:0}to{opacity:1}}';
const LOW = '.lowercase{text-transform:lowercase}';
const BEZ = OBRAZEC.replace(LOW, '');
const HTML = (css) => `<!DOCTYPE html><html><head><link rel="stylesheet" href="/_astro/${css}"></head><body class="relative">x</body></html>`;

function sborka(css, imya, { html = HTML(imya), vtoroj = '.hero[data-astro-cid-m]{display:flex}', webp = [1, 2, 3], lishnij = null, cssBuf = null, vtorojBuf = null } = {}) {
  const m = new Map([
    ['_astro/' + imya, cssBuf ?? Buffer.from(css)],
    ['_astro/index.AAA.css', vtorojBuf ?? Buffer.from(vtoroj)],
    ['index.html', Buffer.isBuffer(html) ? html : Buffer.from(html)],
    ['404.html', Buffer.from('<p>404</p>')],
    ['_astro/k.webp', Buffer.from(webp)],
  ]);
  if (lishnij) m.set(lishnij, Buffer.from('x'));
  return m;
}

function samoproverka() {
  const DO = sborka(OBRAZEC, 'LinkList.OLD.css');
  const NEW = 'LinkList.NEW.css';
  const sMedia = (css, vstavka) => css.replace('@media (width>=40rem){.container{max-width:40rem}}', `@media (width>=40rem){.container{max-width:40rem}${vstavka}}`);
  const dvazhdy = OBRAZEC.replace('"a;b{c}"', `"${LOW}"`);
  // Произвольные значения Tailwind: экранированные кавычки и скобки вне строк.
  const TW = '.content-\\[\\\'\\\'\\]{--tw-content:\'\';content:var(--tw-content)}.content-\\[\\\'\\{\\\'\\]{--tw-content:"{"}';
  const sTW = (css) => css.replace('.flex{display:flex}', '.flex{display:flex}' + TW);
  // Ловушка разбора: ушедшее правило спрятано в строке селектора атрибута за \'.
  const LOVUSHKA = `.a\\'b{color:red}[data-q=';${LOW}\\''] .c{color:blue}`;
  const bajtyBez = Buffer.from(BEZ);
  const sluchai = [
    ['П1 ушло ровно .lowercase, лист переименован, HTML с новым именем', DO, sborka(BEZ, NEW), 'сверено'],
    ['П2 то же без смены имени листа', DO, sborka(BEZ, 'LinkList.OLD.css'), 'сверено'],
    ['П3 в листах произвольные значения с \\\' и \\{ — одинаковые до и после', sborka(sTW(OBRAZEC), 'LinkList.OLD.css'), sborka(sTW(BEZ), NEW), 'сверено'],
    ['П4 --schet совпал (6 → 5)', DO, sborka(BEZ, NEW), 'сверено', { schet: [6, 5] }],
    ['Н1 ничего не ушло', DO, sborka(OBRAZEC, NEW), 'отказ'],
    ['Н2 ушло .lowercase и изменено объявление .flex', DO, sborka(BEZ.replace('.flex{display:flex}', '.flex{display:grid}'), NEW), 'отказ'],
    ['Н3 ушло .lowercase и переставлены два правила', DO, sborka(BEZ.replace('.relative{position:relative}.container{width:100%}', '.container{width:100%}.relative{position:relative}'), NEW), 'отказ'],
    ['Н4 ушло .lowercase и пришло .uppercase', DO, sborka(BEZ.replace('.flex{display:flex}', '.flex{display:flex}.uppercase{text-transform:uppercase}'), NEW), 'отказ'],
    ['Н5 ушло .flex вместо .lowercase', DO, sborka(OBRAZEC.replace('.flex{display:flex}', ''), NEW), 'отказ'],
    ['Н6 HTML изменён сверх имени листа', DO, sborka(BEZ, NEW, { html: HTML(NEW).replace('x</body>', 'y</body>') }), 'отказ'],
    ['Н7 .lowercase ушло из @media, а не из слоя утилит', sborka(sMedia(OBRAZEC, LOW), 'LinkList.OLD.css'), sborka(OBRAZEC, NEW), 'отказ'],
    ['Н8 другой файл различается побайтно', DO, sborka(BEZ, NEW, { webp: [1, 2, 4] }), 'отказ'],
    ['Н9 лишний файл после', DO, sborka(BEZ, NEW, { lishnij: 'extra.txt' }), 'отказ'],
    ['Н10 основа листа сменилась', DO, sborka(BEZ, 'Layout.NEW.css'), 'отказ'],
    ['Н11 пробел внутри правила сверх ушедшего', DO, sborka(BEZ.replace('.flex{display:flex}', '.flex{display: flex}'), NEW), 'отказ'],
    ['Н12 изменение внутри data-URI со «;»', DO, sborka(BEZ.replace('base64,AAA=', 'base64,AAB='), NEW), 'отказ'],
    ['Н13 изменение внутри строки со «{»', DO, sborka(BEZ.replace('"a;b{c}"', '"a;b{d}"'), NEW), 'отказ'],
    ['Н14 изменён комментарий-лицензия', DO, sborka(BEZ.replace('v4.3.3', 'v4.3.4'), NEW), 'отказ'],
    ['Н15 изменён второй лист', DO, sborka(BEZ, NEW, { vtoroj: '.hero[data-astro-cid-m]{display:grid}' }), 'отказ'],
    ['Н16 ушло .lowercase с другим телом', sborka(OBRAZEC.replace(LOW, '.lowercase{text-transform:none}'), 'LinkList.OLD.css'), sborka(BEZ, NEW), 'отказ'],
    ['Н17 ушедшее правило входит в «до» дважды', sborka(dvazhdy, 'LinkList.OLD.css'), sborka(dvazhdy.replace(LOW, ''), NEW), 'отказ'],
    ['Н18 ушло .lowercase, пришло @media в слой', DO, sborka(BEZ.replace('.flex{display:flex}', '.flex{display:flex}@media (width>=48rem){.flex{display:flex}}'), NEW), 'отказ'],
    ['Н19 ушло .lowercase и файл пропал', DO, (() => { const s = sborka(BEZ, NEW); s.delete('404.html'); return s; })(), 'отказ'],
    // Раунд 1 «судью судят» сессии 13:
    ['Н20 (css-1) HTML «после» ссылается на старое имя листа', DO, sborka(BEZ, NEW, { html: HTML('LinkList.OLD.css') }), 'отказ'],
    ['Н21 (css-1) HTML «после» ссылается на несуществующий лист', DO, sborka(BEZ, 'LinkList.OLD.css', { html: HTML('LinkList.ZZZ.css') }), 'отказ'],
    ['Н22 (css-4) второй лист: EF BF BD до, FF после', sborka(OBRAZEC, 'LinkList.OLD.css', { vtorojBuf: Buffer.concat([Buffer.from('.h{a:b}/*'), Buffer.from([0xef, 0xbf, 0xbd]), Buffer.from('*/')]) }), sborka(BEZ, NEW, { vtorojBuf: Buffer.concat([Buffer.from('.h{a:b}/*'), Buffer.from([0xff]), Buffer.from('*/')]) }), 'отказ'],
    ['Н23 (css-4) HTML: EF BF BD до, FE после', sborka(OBRAZEC, 'LinkList.OLD.css', { html: Buffer.concat([Buffer.from(HTML('LinkList.OLD.css')), Buffer.from([0xef, 0xbf, 0xbd])]) }), sborka(BEZ, NEW, { html: Buffer.concat([Buffer.from(HTML(NEW)), Buffer.from([0xfe])]) }), 'отказ'],
    ['Н24 (css-2) ушедшее спрятано в строку атрибута за \\\'', sborka(OBRAZEC.replace(LOW, LOVUSHKA), 'LinkList.OLD.css'), sborka(OBRAZEC.replace(LOW, LOVUSHKA.replace(LOW, '')), NEW), 'отказ'],
    ['Н25 (css-2) \\} и \\{ вне строк не закрывают и не открывают блок', sborka(OBRAZEC.replace(LOW, '@media print{.a\\}' + LOW + '}.b\\{{color:red}'), 'LinkList.OLD.css'), sborka(OBRAZEC.replace(LOW, '@media print{.a\\}}.b\\{{color:red}'), NEW), 'отказ'],
    ['Н26 (css-6) .lowercase остаётся в другом листе «после»', sborka(OBRAZEC, 'LinkList.OLD.css', { vtoroj: '@layer utilities{' + LOW + '}' }), sborka(BEZ, NEW, { vtoroj: '@layer utilities{' + LOW + '}' }), 'отказ'],
    ['Н27 (css-6) --schet не совпал', DO, sborka(BEZ, NEW), 'отказ', { schet: [20, 19] }],
    ['Н28 (css-8) --sloy: ушло из @layer components, счёт — по нему', sborka(OBRAZEC.replace('@layer components;', '@layer components{.q{color:red}.w{color:blue}}'), 'LinkList.OLD.css'), sborka(OBRAZEC.replace('@layer components;', '@layer components{.w{color:blue}}'), NEW), 'сверено', { ushlo: '.q{color:red}', sloy: '@layer components' }],
    ['Н29 нет листов вовсе', new Map([['index.html', Buffer.from('<p>')]]), new Map([['index.html', Buffer.from('<p>')]]), 'отказ'],
    ['Н30 лист «до» не валидный UTF-8', sborka('', 'LinkList.OLD.css', { cssBuf: Buffer.concat([Buffer.from(OBRAZEC), Buffer.from([0xff])]) }), sborka(BEZ, NEW), 'отказ'],
    // Раунд 2 «судью судят» сессии 13 (r2-css-1, r2-css-4): одинаковая вставка во второй лист
    // обеих сборок — отказать обязана только проверка «селектора ушедшего нет в «после»».
    ['Н31 (r2-css-1) .lowercase без своих объявлений, внутри @media', sborka(OBRAZEC, 'LinkList.OLD.css', { vtoroj: '.lowercase{@media print{text-transform:lowercase}}' }), sborka(BEZ, NEW, { vtoroj: '.lowercase{@media print{text-transform:lowercase}}' }), 'отказ'],
    ['Н32 (r2-css-1) .lowercase с вложенным &:hover', sborka(OBRAZEC, 'LinkList.OLD.css', { vtoroj: '.lowercase{&:hover{text-transform:lowercase}}' }), sborka(BEZ, NEW, { vtoroj: '.lowercase{&:hover{text-transform:lowercase}}' }), 'отказ'],
    ['Н33 (r2-css-1) .lowercase только с комментарием', sborka(OBRAZEC, 'LinkList.OLD.css', { vtoroj: '@media print{.lowercase{/*x*/}}' }), sborka(BEZ, NEW, { vtoroj: '@media print{.lowercase{/*x*/}}' }), 'отказ'],
    ['Н34 (r2-css-1) .lowercase в списке селекторов после слияния', sborka(OBRAZEC, 'LinkList.OLD.css', { vtoroj: '.x,.lowercase{text-transform:lowercase}' }), sborka(BEZ, NEW, { vtoroj: '.x,.lowercase{text-transform:lowercase}' }), 'отказ'],
    ['П5 .lowercase-x и [data-a=".lowercase"] — другие селекторы', sborka(OBRAZEC, 'LinkList.OLD.css', { vtoroj: '.lowercase-x{a:b}[data-a=".lowercase,.lowercase"]{a:b}:is(.a,.lowercase) .b{a:b}' }), sborka(BEZ, NEW, { vtoroj: '.lowercase-x{a:b}[data-a=".lowercase,.lowercase"]{a:b}:is(.a,.lowercase) .b{a:b}' }), 'сверено'],
    ['П6 (r2-css-4) комментарий в слое утилит обеих сборок не входит в счёт', sborka(OBRAZEC.replace('@layer utilities{', '@layer utilities{/*k*/'), 'LinkList.OLD.css'), sborka(BEZ.replace('@layer utilities{', '@layer utilities{/*k*/'), NEW), 'сверено', { schet: [6, 5] }],
  ];
  let proshlo = 0;
  const itog = [];
  for (const [imya, a, b, zhdem, o] of sluchai) {
    let r;
    try { r = sverit(a, b, o); } catch (e) { r = { verdikt: 'исключение: ' + e.message, otkazy: [] }; }
    const ok = r.verdikt === zhdem;
    if (ok) proshlo++;
    itog.push(`${ok ? 'да ' : 'НЕТ'} ${imya}: ждали «${zhdem}», получено «${r.verdikt}»${r.otkazy.length ? ' — ' + r.otkazy[0] : ''}`);
  }
  // Разбор: объявления внутри скобок и строк не режутся; экранирование вне строк — текст.
  const d = listya(razobrat('.a{background:url(data:x;y);content:"p;q}r"}'));
  const razborOk = d.length === 1 && d[0].tekst.length === 2 && d[0].tekst[0] === 'background:url(data:x;y)' && d[0].tekst[1] === 'content:"p;q}r"';
  itog.push(`${razborOk ? 'да ' : 'НЕТ'} разбор: «;» в скобках и «;}» в строке не режут объявление`);
  const e = listya(razobrat(".content-\\[\\'\\{\\'\\]{content:var(--tw-content)}"));
  const razborEsc = e.length === 1 && e[0].put === ".content-\\[\\'\\{\\'\\]";
  itog.push(`${razborEsc ? 'да ' : 'НЕТ'} разбор: \\' и \\{ вне строк — часть селектора`);
  proshlo += (razborOk ? 1 : 0) + (razborEsc ? 1 : 0);
  // Байты: замена и счёт вхождений на уровне Buffer.
  const z = zamenitVse(Buffer.from('aXbXc'), 'X', 'YY');
  const bajtOk = z.equals(Buffer.from('aYYbYYc')) && vhozhdeniya(Buffer.from('XXX'), 'X') === 3 && vhozhdeniya(bajtyBez, LOW) === 0;
  itog.push(`${bajtOk ? 'да ' : 'НЕТ'} байты: замена и счёт вхождений`);
  if (bajtOk) proshlo++;
  // Аргументы (r2-css-2, r2-css-5): код 2 на всё, что не верный вызов.
  const argi = [
    ['пустой --schet', ['a', 'b', '--schet', ''], false],
    ['пустой --ushlo', ['a', 'b', '--ushlo', ''], false],
    ['пустой --sloy', ['a', 'b', '--sloy', ''], false],
    ['пустой --json', ['a', 'b', '--json', ''], false],
    ['--schet abc', ['a', 'b', '--schet', 'abc'], false],
    ['--ushlo не правило', ['a', 'b', '--ushlo', 'abc'], false],
    ['--ushlo без объявлений', ['a', 'b', '--ushlo', '.a{}'], false],
    ['неизвестный флаг', ['a', 'b', '--bogus', '1'], false],
    ['флаг в конце без значения', ['a', 'b', '--schet'], false],
    ['флаг дважды', ['a', 'b', '--schet', '1:0', '--schet', '1:0'], false],
    ['одна папка', ['a', '--schet', '20:19'], false],
    ['верный вызов', ['a', 'b', '--schet', '20:19', '--ushlo', '.lowercase{text-transform:lowercase}'], true],
  ];
  for (const [imya, a, zhdem] of argi) {
    const r = razobratArgumenty(a);
    const ok = !r.oshibka === zhdem;
    if (ok) proshlo++;
    itog.push(`${ok ? 'да ' : 'НЕТ'} аргументы — ${imya}: ${r.oshibka ? 'код 2 (' + r.oshibka + ')' : 'приняты'}`);
  }
  const vsego = sluchai.length + 3 + argi.length;
  console.log(itog.join('\n'));
  console.log(`самопроверка: ${proshlo}/${vsego}`);
  process.exit(proshlo === vsego ? 0 : 1);
}

// ---------- запуск ----------

// Разбор аргументов: { oshibka } — код 2; иначе { poz, o, json }.
export function razobratArgumenty(args) {
  const FLAGI = new Set(['--ushlo', '--sloy', '--schet', '--json']);
  const poz = [], opt = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      if (!FLAGI.has(args[i])) return { oshibka: 'неизвестный флаг ' + args[i] };
      if (opt[args[i]] !== undefined) return { oshibka: 'флаг дважды: ' + args[i] };
      const v = args[i + 1];
      if (v === undefined || v === '' || v.startsWith('--')) return { oshibka: 'флаг без значения или с пустым значением: ' + args[i] };
      opt[args[i]] = v; i++;
    } else poz.push(args[i]);
  }
  if (poz.length !== 2) return { oshibka: 'ждали две папки сборок' };
  const o = {};
  if (opt['--ushlo'] !== undefined) {
    try { pravilo(opt['--ushlo']); } catch (e) { return { oshibka: e.message }; }
    o.ushlo = opt['--ushlo'];
  }
  if (opt['--sloy'] !== undefined) o.sloy = opt['--sloy'];
  if (opt['--schet'] !== undefined) {
    const m = opt['--schet'].match(/^(\d{1,6}):(\d{1,6})$/);
    if (!m) return { oshibka: '--schet: ждали <до>:<после>, например 20:19' };
    o.schet = [Number(m[1]), Number(m[2])];
  }
  return { poz, o, json: opt['--json'] };
}

const args = process.argv.slice(2);
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('/sverka-css.mjs')) {
  if (args[0] === '--selftest') samoproverka();
  const ISPOLZOVANIE = 'node sverka-css.mjs <dist-до> <dist-после> [--ushlo <правило>] [--sloy <обёртка>] [--schet <до>:<после>] [--json <файл>]';
  const a = razobratArgumenty(args);
  if (a.oshibka) { console.error(a.oshibka + '\n' + ISPOLZOVANIE); process.exit(2); }
  for (const p of a.poz) {
    let ok = false;
    try { ok = statSync(p).isDirectory(); } catch { ok = false; }
    if (!ok) { console.error('нет папки сборки: ' + p + '\n' + ISPOLZOVANIE); process.exit(2); }
  }
  const o = a.o;
  const opt = { '--json': a.json };
  const r = sverit(chitatPapku(a.poz[0]), chitatPapku(a.poz[1]), o);
  for (const l of r.listy) {
    console.log(`${l.osnova}: ${l.do} (${l.baitDo} Б, листьев ${l.listyevDo}) → ${l.posle} (${l.baitPosle} Б, листьев ${l.listyevPosle}); общих ${l.obshchih}; слой ${l.sloyDo.pravil} → ${l.sloyPosle.pravil}; побайтно — ${l.pobaitno}; ушедшего в «после» — ${l.ushedshegoVPosle}`);
    for (const x of l.ushlo) console.log(`  ушло   #${x.nomer}: ${x.klyuch}`);
    for (const x of l.prishlo) console.log(`  пришло #${x.nomer}: ${x.klyuch}`);
  }
  console.log(`слой ${r.sloy.imya} всего (прямых детей-правил: правило, @-правило, инструкция; без комментариев): ${r.sloy.do} → ${r.sloy.posle}`);
  console.log(`прочие файлы: ${r.prochie.vsegoDo}; побайтно равны ${r.prochie.ravnyhPobaitno}; HTML проверено ${r.prochie.htmlProvereno}, из них равны после замены имени листа ${r.prochie.htmlRavnyhPosleZameny}; различаются ${r.prochie.razlichny.length}`);
  for (const x of r.otkazy) console.log('ОТКАЗ: ' + x);
  console.log('ВЕРДИКТ: ' + r.verdikt);
  if (opt['--json']) writeFileSync(opt['--json'], JSON.stringify(r, null, 1) + '\n');
  process.exit(r.verdikt === 'сверено' ? 0 : 1);
}
