// «На гайде — только полные названия глав в кавычках» (П100, приёмка; П99 п. 2: полное название главы игры в кавычках —
// исключение сторожа 8 слов) — разбор совпадений сторожа 8 слов на /max-payne-3/guide/ (сессия 19). Новый инструмент
// по образцу `docs/reports/2026-09-27-7thserpent-pachka-4/instrumenty/chuzhie-repliki.mjs` (сессия 17, заморожен на
// 9b36b2a, не правится): копия сторожа (`chuzhie-p5.mjs`) ловит строку целиком и не больше одной находки на строку,
// а в абзаце списка глав рядом стоят и названия, и свой текст — по строке не видно, где совпадение. Этот инструмент
// берёт ВСЕ 8-граммы каждой строки текста гайда по положению против указателя сторожа брифов
// (`tools/brief-strony.mjs`: `slova`, `bezImen`, `ukazatel`, `tekstDokumenta`, `IMENA` — импортом, без правки; хеш
// 8-граммы — та же формула sha1, первые 4 байта), по всем скачанным документам корпуса.
// СЛОВА СТРОКИ — функциями сторожа (раунд 1 «судью судят», V3/V5): строка режется на куски вне и внутри пар кавычек,
// слова куска — `slova` сторожа, адреса `https?://…` вырезаются пробелом, как у функции `chuzhie` сторожа (pravilo-2),
// названия игр сливаются в одно слово, как `bezImen`; по каждой строке слова сверяются с `bezImen(slova(строка без
// адресов))` — расхождение — код 2 («разбор недостоверен»). Строже сторожа: строка не режется по «·» и «|».
// ТЕКСТ СТРАНИЦЫ (раунд 1, izv-*):
//   - строки <main>: по строке на блочный элемент; перенос строки внутри текста (в том числе &#10;) и <br> — пробел,
//     как на экране; знаки формата \p{Cf} (мягкий перенос U+00AD и &#173;, U+200B, U+2060…) снимаются; любой тег,
//     кроме блочных, снимается дважды — вплотную и через пробел, судятся оба прочтения (комментарий — так же);
//     скрипты, стили и комментарии не обрезают <main> (границы <main> ищутся по маске, где они забиты пробелами);
//   - отдельные строки без исключений: <title>, meta description, og:title, og:description; alt, title= и aria-label=
//     любого тега в <main>.
// Для каждой совпавшей 8-граммы строки <main> смотрит, где лежат её слова:
//   - все восемь — внутри одной пары типографских кавычек «“ ”», и текст в этих кавычках — название главы из списка
//     GLAVY (равенство после нормализации пробелов и апострофов) — разрешено;
//   - иначе — отказ: «вне кавычек», «через границу кавычек» или «в кавычках, но не название главы списка».
// Совпадение в строках <title>, описаний и атрибутов — отказ всегда («в alt, title или описании»).
// Кроме того, по каждому названию списка, в каждом из двух прочтений:
//   - на странице оно стоит в кавычках ровно один раз;
//   - в ряду «Chapters»: секция `section.layer` с id="chapters" и видимой меткой (`.t-label`) «Chapters»;
//   - за номером своей главы: ближайший перед названием заголовок «<римский номер>. » — свой, и от него до открывающей
//     кавычки — «<номер>. <место без кавычек> (<части> / <улики>): » (раунд 1, nazvaniya-1: заголовок чужой главы между
//     своим номером и названием — отказ).
//
//   node chuzhie-glavy.mjs <dist> [--proba]
//   Коды: 0 — чисто; 1 — отказы; 2 — извлечение или разбор недостоверны (итог не выдаётся).
//
// --proba: порчи копии HTML в памяти, каждая обязана дать отказ своей причиной; контроль — неиспорченная страница без
// отказов. Список и что каждая проверяет — в массиве PORCHI.
// ПРЕДЕЛЫ (названы; «строже» — ложный отказ, а не пропуск):
//   - кавычки — только символы «“ ”» парами в одной строке; кусок без пары судится как текст вне кавычек (строже);
//     кавычки, которые рисует браузер (<q>, CSS content), не видны — название в <q> получит отказ (строже, izv-N4);
//     немецкая закрывающая “ в „…“ открывает пару (строже, V6);
//   - название равно записи списка буква в букву, с точкой внутри кавычек; иной регистр («Down The World» у Steam
//     и portforward) или точка за кавычкой — отказ (строже, V8, nazvaniya-3); совпадение 8-грамм от регистра не зависит;
//   - кавычки внутри места главы или счёт частей и улик словами — отказ «не за номером» (строже, nazvaniya-2, pravilo-6);
//   - название, разорванное строчным тегом внутри слова («Wo<em>r</em>ld»), в прочтении «через пробел» не равно записи
//     списка — отказ «в кавычках 0 раз» (строже);
//   - адрес вплотную к кавычке и слову («https://…”слово»): сторож съедает адрес вместе с кавычкой и словом, разбор —
//     нет; слова строки расходятся со сторожем — код 2, итог не выдаётся;
//   - ряд — от открывающего тега секции до первого </section>: вложенная секция обрежет ряд — отказ (строже, nazvaniya-4);
//   - скрытый текст (hidden, .visually-hidden, aria-hidden) считается видимым: скрытые «“ ”» вокруг названия дали бы ему
//     исключение (izv-N3) — путь только через шаблон маршрута, содержание страницы маршрут экранирует;
//   - указатель корпуса — сторожа брифов как есть: документ, где апостроф записан «´» (V2), текст декодирован не в той
//     кодировке (U+FFFD, V7) или тег стоит перед «’s» (V1), разбит иначе, чем та же фраза на странице, — такие 8-граммы
//     не ловят ни сторож, ни копия сторожа, ни этот разбор (предел семейства судей, строкой в доклад и бэклог);
//   - текст вне <main> (шапка, крошки, подвал) не судится, кроме <title> и описаний; JSON-LD не судится; alt, title=
//     и aria-label= — только в двойных или одинарных кавычках;
//   - что название верно, судит сверка с документами (thehdroom, руководство Steam 2076733393, portforward), не этот
//     инструмент.
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const B = await import(pathToFileURL(join(root, 'tools/brief-strony.mjs')).href);
const dist = process.argv[2];
const proba = process.argv.includes('--proba');
const STRANICA = 'max-payne-3/guide/index.html';
if (!dist || !existsSync(join(dist, STRANICA))) {
  console.error('нет собранного /max-payne-3/guide/ в папке сборки: ' + dist);
  process.exit(2);
}

/** Названия глав из 8 слов, которые гайд печатает полностью (П99 п. 2), и номер главы — как на странице. */
const GLAVY = [
  { t: 'Here I Was Again, Halfway Down the World.', nomer: 'IX' },
  { t: 'A Fat Bald Dude with a Bad Temper.', nomer: 'XIII' },
];
const normR = (s) => s.replace(/\s+/g, ' ').replace(/[’‘]/g, "'").trim();
const GLAVY_N = new Map(GLAVY.map((g) => [normR(g.t), g]));

const manifest = readFileSync(join(root, 'input/corpus/manifest.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const last = new Map();
for (const r of manifest) last.set(r.url, r);
const docs = [];
for (const r of last.values()) {
  if (r.outcome !== 'ok' || !r.file) continue;
  const p = join(root, 'input/corpus', r.file);
  if (!existsSync(p)) continue;
  docs.push({ url: r.url, tekst: B.tekstDokumenta(gunzipSync(readFileSync(p)).toString('utf8')) });
}
const uk = B.ukazatel(docs);
/** Хеш 8-граммы — та же формула, что у сторожа брифов (`hash` там не экспортирован); равенство проверяет
 *  самопроверка ниже: 8-грамма названия главы IX обязана найтись. */
const hash = (s) => createHash('sha1').update(s).digest().readUInt32LE(0);
/** Документ корпуса с этой 8-граммой или null: хеш в указателе и подтверждение по нормализованному тексту. */
const nayti = (g) => (uk.h.has(hash(g)) ? uk.teksty.find((t) => t.norm.includes(` ${g} `)) : null);
const imenaSlovami = B.IMENA.map((n) => B.slova(n)).sort((a, b) => b.length - a.length);
const bezAdresov = (t) => t.replace(/https?:\/\/\S+/g, ' ');

/** Пары «“ ”» строки: первая “ и первая ” после неё. */
function paryKavychek(s) {
  const pary = [];
  for (let i = 0; ; ) {
    const a = s.indexOf('“', i);
    const b = a < 0 ? -1 : s.indexOf('”', a + 1);
    if (a < 0 || b < 0) break;
    pary.push([a, b]);
    i = b + 1;
  }
  return pary;
}

/** Слова строки функциями сторожа с меткой куска: -1 — вне кавычек, k — внутри k-й пары «“ ”», 'mix' — название
 *  игры через границу кавычек. Сверка со сторожем: те же слова, что `bezImen(slova(строка без адресов))`. */
function slovaSMetkoy(s) {
  const pary = paryKavychek(s);
  const kuski = [];
  let pos = 0;
  pary.forEach(([a, b], k) => {
    kuski.push([s.slice(pos, a), -1]);
    kuski.push([s.slice(a + 1, b), k]);
    pos = b + 1;
  });
  kuski.push([s.slice(pos), -1]);
  const out = kuski.flatMap(([t, seg]) => B.slova(bezAdresov(t)).map((w) => ({ w, seg })));
  const sl = [];
  for (let i = 0; i < out.length; ) {
    const imya = imenaSlovami.find((n) => n.every((w, j) => out[i + j]?.w === w));
    if (imya) {
      const segs = new Set(out.slice(i, i + imya.length).map((x) => x.seg));
      sl.push({ w: '§imya§', seg: segs.size === 1 ? [...segs][0] : 'mix' });
      i += imya.length;
    } else sl.push(out[i++]);
  }
  const storozh = B.bezImen(B.slova(bezAdresov(s))).join(' ');
  if (storozh !== sl.map((x) => x.w).join(' ')) throw new Error(`слова строки разошлись со сторожем брифов: «${s.slice(0, 80)}»`);
  return { slova: sl, pary: pary.map(([a, b]) => s.slice(a + 1, b)) };
}

const BLOCHNYE = new Set('p h1 h2 h3 h4 h5 h6 li dd dt dl figcaption figure blockquote div section article aside header footer nav ul ol main table thead tbody tfoot tr td th caption pre hr address details summary form fieldset legend'.split(' '));
/** Тег с атрибутами в кавычках (знак «>» внутри значения атрибута тег не обрывает). */
const TEG = String.raw`<\/?([a-zA-Z][a-zA-Z0-9-]*)(?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*\s*\/?>`;
const RAZDEL = '\u0001';
function stroki(fragment, strochnyeNa) {
  const bezKoda = fragment
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, strochnyeNa)
    .replace(/[\r\n\t\f]+/g, ' ');
  const vidimy = bezKoda.replace(new RegExp(TEG, 'g'), (t, imya) => {
    const im = imya.toLowerCase();
    if (BLOCHNYE.has(im)) return RAZDEL;
    if (im === 'br') return ' ';
    return strochnyeNa;
  });
  return B.tekstDokumenta(vidimy)
    .replace(/[\r\n]/g, ' ')
    .replace(/\p{Cf}/gu, '')
    .split(RAZDEL)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

const atr = (tag, imya) => {
  const m = tag.match(new RegExp(`\\s${imya}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return m ? m[1] ?? m[2] : undefined;
};
const raskryt = (s) => B.tekstDokumenta(`<p>${s}</p>`).replace(/[\r\n]/g, ' ').replace(/\p{Cf}/gu, '').replace(/\s+/g, ' ').trim();

/** Строки вне текста <main>: <title>, описания, alt/title=/aria-label= тегов <main>. */
function dopStroki(h, main) {
  const konecGolovy = h.search(/<\/head>/i);
  const golova = konecGolovy < 0 ? '' : h.slice(0, konecGolovy);
  const titul = (golova.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '';
  const meta = [...golova.matchAll(/<meta\b[^>]*>/gi)]
    .filter((m) => /\s(?:name|property)\s*=\s*["'](?:description|og:title|og:description)["']/i.test(m[0]))
    .map((m) => atr(m[0], 'content') || '');
  const vMain = [...main.matchAll(new RegExp(TEG, 'g'))].flatMap((m) => [atr(m[0], 'alt'), atr(m[0], 'title'), atr(m[0], 'aria-label')]);
  return [titul, ...meta, ...vMain].filter(Boolean).map(raskryt).filter(Boolean);
}

function sud(h) {
  const otkazy = new Set();
  // Маска: скрипты, стили и комментарии забиты пробелами той же длины — «</main>» в них границу не сдвигает (izv-N7).
  const maska = h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, (m) => ' '.repeat(m.length));
  const nachala = [...maska.matchAll(/<main\b/gi)].length;
  if (nachala !== 1) throw new Error(`<main> — ${nachala}, нужен ровно один`);
  const i0 = maska.search(/<main\b/i);
  const i1 = maska.search(/<\/main>/i);
  if (i1 < i0) throw new Error('нет закрывающего </main> после <main>');
  const main = h.slice(i0, i1);
  const vplotnuyu = stroki(main, '');
  const cherezProbel = stroki(main, ' ');
  const vse = [...vplotnuyu, ...cherezProbel.filter((s) => !new Set(vplotnuyu).has(s))];
  if (B.slova(vplotnuyu.join('\n')).length < 300) throw new Error('в тексте <main> гайда меньше 300 слов — извлечение пустое или сломано');
  const pojmano = new Map();
  const vidennye = new Set();
  vse.forEach((s, n) => {
    const { slova, pary } = slovaSMetkoy(s);
    for (let i = 0; i + 8 <= slova.length; i++) {
      const okno = slova.slice(i, i + 8);
      const g = okno.map((x) => x.w).join(' ');
      const doc = nayti(g);
      if (!doc) continue;
      const segs = new Set(okno.map((x) => x.seg));
      const seg = segs.size === 1 ? [...segs][0] : null;
      const klyuch = `${n}:${seg}:${g}`;
      if (vidennye.has(klyuch)) continue;
      vidennye.add(klyuch);
      if (seg !== null && seg !== -1 && seg !== 'mix' && GLAVY_N.has(normR(pary[seg]))) {
        const imya = normR(pary[seg]);
        if (!pojmano.has(imya)) pojmano.set(imya, []);
        pojmano.get(imya).push(`строка ${n + 1}: «${g}» — ${doc.url}`);
        continue;
      }
      const vid = seg === -1 ? 'вне кавычек' : seg === null || seg === 'mix' ? 'через границу кавычек' : 'в кавычках, но не название главы списка';
      otkazy.add(`${vid}, строка ${n + 1}: «${g}» — ${doc.url}`);
    }
  });
  const dop = dopStroki(h, main);
  for (const s of dop) {
    const ws = B.bezImen(B.slova(bezAdresov(s)));
    for (let i = 0; i + 8 <= ws.length; i++) {
      const g = ws.slice(i, i + 8).join(' ');
      const doc = nayti(g);
      if (doc) otkazy.add(`в alt, title или описании: «${g}» — ${doc.url} (строка «${s.slice(0, 60)}»)`);
    }
  }
  // Названия: в каждом прочтении — ровно один раз в кавычках, в ряду «Chapters», за номером своей главы.
  const sekciya = (main.match(/<section class="layer\b[^>]*\bid="chapters"[\s\S]*?<\/section>/) || [])[0];
  if (!sekciya) otkazy.add('ряда «Chapters» (секция id="chapters") на странице нет');
  else {
    const metka = raskryt((sekciya.match(/<p class="t-label[^"]*"[^>]*>([\s\S]*?)<\/p>/) || [])[1] ?? '');
    if (metka !== 'Chapters') otkazy.add(`у ряда id="chapters" видимая метка «${metka}», ждали «Chapters»`);
  }
  for (const [prochtenie, na] of [[vplotnuyu, ''], [cherezProbel, ' ']]) {
    const stroki_ryada = sekciya ? stroki(sekciya, na) : [];
    for (const gl of GLAVY) {
      const n = normR(gl.t);
      const vhozhdeniya = [];
      for (const s of prochtenie) for (const [a, b] of paryKavychek(s)) if (normR(s.slice(a + 1, b)) === n) vhozhdeniya.push({ s, a });
      if (vhozhdeniya.length !== 1) otkazy.add(`название «${gl.t}» в кавычках ${vhozhdeniya.length} раз, ждали 1`);
      for (const { s, a } of vhozhdeniya) {
        if (sekciya && !stroki_ryada.includes(s)) otkazy.add(`название «${gl.t}» не в ряду «Chapters»`);
        const pered = s.slice(0, a);
        const zagolovki = [...pered.matchAll(/(^|[\s”])([IVXLC]+)\.(?=\s)/g)];
        const z = zagolovki[zagolovki.length - 1];
        const hvost = z ? pered.slice(z.index + z[1].length) : pered;
        if (!z || z[2] !== gl.nomer || !/^[IVXLC]+\.\s[^“”]*\(\d+ \/ \d+\):\s*$/.test(hvost)) {
          otkazy.add(`название «${gl.t}» не за номером своей главы ${gl.nomer} («${gl.nomer}. <место> (<части> / <улики>): »): «${hvost.trim().slice(0, 60)}»`);
        }
      }
    }
  }
  return { otkazy: [...otkazy], strok: vplotnuyu.length, dop: dop.length, pojmano };
}

const html = readFileSync(join(dist, STRANICA), 'utf8');
// Самопроверка формулы хеша: 8-грамма названия главы IX обязана быть в указателе сторожа.
if (!uk.h.has(hash('here i was again halfway down the world'))) { console.error('хеш 8-граммы разошёлся со сторожем брифов — разбор недостоверен'); process.exit(2); }
const sudBezPadeniya = (h) => {
  try {
    return sud(h);
  } catch (e) {
    return { otkazy: ['ИСКЛЮЧЕНИЕ ' + e.message], isklyuchenie: true };
  }
};

if (proba) {
  const d = docs.find((x) => /wikipedia/.test(x.url) && B.slova(x.tekst).length > 2000);
  const ws = d.tekst.replace(/\s+/g, ' ').trim().split(' ');
  let i0 = 400;
  while (!ws.slice(i0, i0 + 14).every((w) => /^[A-Za-z]{2,}$/.test(w))) i0 += 1;
  const k = ws.slice(i0, i0 + 14);
  const k12 = k.slice(0, 12).join(' ');
  const razrez = (vstavka) => k.slice(0, 5).join(' ') + ' ' + k[5].slice(0, 2) + vstavka + k[5].slice(2) + ' ' + k.slice(6, 12).join(' ');
  // Фраза с названием игры в каждом 8-окне: 4 слова, «Max Payne 3», 3 слова — ровно одна 8-грамма сторожа (P10).
  const sImenem = (() => {
    for (const x of docs) {
      const m = x.tekst.replace(/\s+/g, ' ').match(/(?:^| )((?:[A-Za-z]{2,} ){4}Max Payne 3 (?:[A-Za-z]{2,} ){2}[A-Za-z]{2,})(?= |$)/);
      if (m && nayti(B.bezImen(B.slova(m[1])).join(' '))) return m[1];
    }
    return null;
  })();
  // Фраза с «İ» (слова строчными — у сторожа до разбиения, V3): 12 слов вокруг первого такого слова документа.
  const sI = (() => {
    for (const x of docs) {
      const w = x.tekst.replace(/\s+/g, ' ').trim().split(' ');
      const j = w.findIndex((t) => /^\p{L}*İ\p{L}+$/u.test(t));
      if (j < 6 || j + 6 > w.length) continue;
      const kus = w.slice(j - 5, j + 7);
      if (kus.every((t) => /^\p{L}+[,.]?$/u.test(t))) return kus.join(' ');
    }
    return null;
  })();
  const vAbzac = (h, t, posle = 0) => {
    const m = /<div class="layer__body[^"]*"[^>]*>\s*<p\b[^>]*>/g;
    m.lastIndex = posle;
    const x = m.exec(h);
    if (!x) return h;
    const p = x.index + x[0].length;
    return h.slice(0, p) + t + ' ' + h.slice(p);
  };
  const IX = '“Here I Was Again, Halfway Down the World.”';
  const XIII = '“A Fat Bald Dude with a Bad Temper.”';
  const PORCHI = [
    { imya: 'контроль', h: html, prichina: null },
    { imya: '12 слов документа вне кавычек', h: vAbzac(html, k12), prichina: 'вне кавычек' },
    { imya: '12 слов документа в кавычках', h: vAbzac(html, '“' + k12 + '”'), prichina: 'в кавычках, но не название главы списка' },
    { imya: '7 слов в кавычках + 7 вне', h: vAbzac(html, '“' + k.slice(0, 7).join(' ') + '” ' + k.slice(7, 14).join(' ')), prichina: 'через границу кавычек' },
    { imya: '12 слов, в середине 2 в кавычках', h: vAbzac(html, k.slice(0, 5).join(' ') + ' “' + k.slice(5, 7).join(' ') + '” ' + k.slice(7, 12).join(' ')), prichina: 'через границу кавычек' },
    { imya: 'фраза, склеенная только через пробел', h: vAbzac(html, k.slice(0, 5).join(' ') + ' <span>' + k[5] + '</span><span>' + k[6] + '</span> ' + k.slice(7, 12).join(' ')), prichina: 'вне кавычек' },
    { imya: 'слово, разрезанное пустым тегом (вплотную)', h: vAbzac(html, razrez('<em></em>')), prichina: 'вне кавычек' },
    { imya: 'название IX без кавычек', h: html.replace(IX, 'Here I Was Again, Halfway Down the World.'), prichina: 'вне кавычек' },
    { imya: 'название XIII дважды', h: vAbzac(html, XIII), prichina: 'в кавычках 2 раз' },
    { imya: 'копия IX, видимая только через пробел', h: vAbzac(html, '“Here I Was Again, Halfway Down the<span></span>World.”', html.indexOf('id="length"')), prichina: 'в кавычках 2 раз' },
    { imya: 'название IX сокращено (как до сессии 19)', h: html.replace(IX, '“Here I Was Again…”'), prichina: 'в кавычках 0 раз' },
    { imya: 'лишнее слово внутри кавычек IX', h: html.replace(IX, '“Here I Was Again, Halfway Down the World, Again.”'), prichina: 'в кавычках, но не название главы списка' },
    { imya: 'хвост после названия внутри кавычек IX', h: html.replace(IX, '“Here I Was Again, Halfway Down the World. Again.”'), prichina: 'в кавычках 0 раз' },
    { imya: 'кавычка IX закрыта раньше', h: html.replace(IX, '“Here I Was Again, Halfway Down the” World.'), prichina: 'через границу кавычек' },
    { imya: 'фраза документа после IX в той же строке', h: html.replace(IX, IX + ' ' + k12), prichina: 'вне кавычек' },
    { imya: '8-грамма IX ещё раз вне кавычек за ним', h: html.replace(IX, IX + ' here I was again, halfway down the world'), prichina: 'вне кавычек' },
    { imya: 'фраза документа в кавычках главы X (строка IX)', h: html.replace('“It’s Drive or Shoot, Sister.”', '“' + k12 + '”'), prichina: 'в кавычках, но не название главы списка' },
    { imya: 'номер чужой главы у IX', h: html.replace('IX. The favela again', 'X. The favela again'), prichina: 'не за номером своей главы IX' },
    { imya: 'номер «XIX.» у IX', h: html.replace('IX. The favela again', 'XIX. The favela again'), prichina: 'не за номером своей главы IX' },
    { imya: 'номер снят у XIII', h: html.replace('XIII. A prison', 'A prison'), prichina: 'не за номером своей главы XIII' },
    { imya: 'заголовок главы X между IX и названием', h: html.replace('police raid (6 / 3): ' + IX, 'police raid (6 / 3): X. A bus station (6 / 2): ' + IX), prichina: 'не за номером своей главы IX' },
    { imya: 'текст между счётом и кавычкой IX', h: html.replace('(6 / 3): ' + IX, '(6 / 3): see ' + IX), prichina: 'не за номером своей главы IX' },
    { imya: 'счёт частей и улик снят у IX', h: html.replace('police raid (6 / 3): ' + IX, 'police raid: ' + IX), prichina: 'не за номером своей главы IX' },
    {
      imya: 'название XIII в чужом ряду',
      h: (() => { const bez = html.replace(' XIII. A prison and a police station (9 / 7): ' + XIII, ''); const i = bez.indexOf('id="length"'); return i < 0 ? bez : vAbzac(bez, 'XIII. A prison and a police station (9 / 7): ' + XIII, i); })(),
      prichina: 'не в ряду «Chapters»',
    },
    { imya: 'ряда с id="chapters" нет', h: html.replace('id="chapters"', 'id="glavy"'), prichina: 'ряда «Chapters» (секция id="chapters") на странице нет' },
    { imya: 'видимая метка ряда не «Chapters»', h: html.replace(/(id="chapters"[\s\S]*?<p class="t-label[^"]*"[^>]*>)Chapters</, '$1Length<'), prichina: 'видимая метка «Length»' },
    { imya: 'число вплотную к названию VI', h: html.replace('VI. An office building that goes up in flames (3 / 5): “A Dame', 'VI. An office building that goes up in flames, chapter 6: “A Dame'), prichina: 'через границу кавычек' },
    { imya: 'перенос строки внутри фразы', h: vAbzac(html, k.slice(0, 6).join(' ') + '\n' + k.slice(6, 12).join(' ')), prichina: 'вне кавычек' },
    { imya: '&#10; внутри фразы', h: vAbzac(html, k.slice(0, 6).join(' ') + '&#10;' + k.slice(6, 12).join(' ')), prichina: 'вне кавычек' },
    { imya: '&#173; внутри слова', h: vAbzac(html, razrez('&#173;')), prichina: 'вне кавычек' },
    { imya: 'U+00AD внутри слова', h: vAbzac(html, razrez('\u00AD')), prichina: 'вне кавычек' },
    { imya: '<wbr> внутри слова', h: vAbzac(html, razrez('<wbr>')), prichina: 'вне кавычек' },
    { imya: '<u> внутри слова', h: vAbzac(html, razrez('<u>') + '</u>'), prichina: 'вне кавычек' },
    { imya: 'адрес посреди фразы', h: vAbzac(html, k.slice(0, 6).join(' ') + ' https://example.com/x ' + k.slice(6, 12).join(' ')), prichina: 'вне кавычек' },
    { imya: '«</main>» в комментарии перед фразой', h: vAbzac(html, '<!-- </main> --> ' + k12), prichina: 'вне кавычек' },
    { imya: 'название игры в каждом окне фразы', h: sImenem ? vAbzac(html, sImenem) : html, prichina: 'вне кавычек' },
    { imya: 'фраза со словом на «İ»', h: sI ? vAbzac(html, sI) : html, prichina: 'вне кавычек' },
    { imya: 'фраза документа в <title>', h: html.replace('<title>', '<title>' + k12 + ' '), prichina: 'в alt, title или описании' },
    { imya: 'фраза документа в meta description', h: html.replace('name="description" content="', 'name="description" content="' + k12 + ' '), prichina: 'в alt, title или описании' },
    { imya: 'фраза документа в og:description', h: html.replace('property="og:description" content="', 'property="og:description" content="' + k12 + ' '), prichina: 'в alt, title или описании' },
    { imya: 'фраза документа в alt картинки <main>', h: (() => { const i = html.search(/<main\b/i); const j = html.indexOf(' alt="', i); return j < 0 ? html : html.slice(0, j) + ' alt="' + k12 + ' ' + html.slice(j + 6); })(), prichina: 'в alt, title или описании' },
    { imya: 'фраза документа в атрибуте title=', h: vAbzac(html, '<span title="' + k12 + '">x</span>'), prichina: 'в alt, title или описании' },
    // Охраны (раунд 1, izv-N9): итог не выдаётся, код 2.
    { imya: 'второй <main>', h: html.replace('</main>', '</main><main>x</main>'), prichina: 'ИСКЛЮЧЕНИЕ <main> — 2' },
    { imya: 'пустой <main>', h: html.replace(/(<main\b[^>]*>)[\s\S]*(<\/main>)/, '$1<p>Only a few words here.</p>$2'), prichina: 'ИСКЛЮЧЕНИЕ в тексте <main> гайда меньше 300 слов' },
    { imya: 'слова разошлись со сторожем (адрес у кавычки)', h: vAbzac(html, '“Alpha https://example.com/”beta gamma.'), prichina: 'ИСКЛЮЧЕНИЕ слова строки разошлись со сторожем' },
  ];
  let plokhoP = 0;
  for (const x of PORCHI) {
    const r = sudBezPadeniya(x.h);
    const primenilas = x.prichina === null || x.h !== html;
    const zhdemIsklyuchenie = x.prichina?.startsWith('ИСКЛЮЧЕНИЕ');
    const ok = primenilas && !!r.isklyuchenie === !!zhdemIsklyuchenie && (x.prichina === null ? r.otkazy.length === 0 : r.otkazy.some((o) => o.includes(x.prichina)));
    if (!ok) plokhoP += 1;
    console.log(`${ok ? 'ok   ' : 'ПЛОХО'} ${x.imya.padEnd(46)} ${!primenilas ? 'порча не применилась' : r.otkazy.join(' | ').slice(0, 170) || 'отказов нет'}`);
  }
  console.log(`проба: ${PORCHI.length - plokhoP}/${PORCHI.length}`);
  process.exit(plokhoP ? 1 : 0);
}
const r = sudBezPadeniya(html);
if (r.isklyuchenie) {
  console.error(r.otkazy[0]);
  console.error('отказ: извлечение или разбор недостоверны — итог не выдаётся');
  process.exit(2);
}
console.log(`корпус: документов ${docs.length}; /max-payne-3/guide/: строк <main> ${r.strok}, строк title, описаний и атрибутов ${r.dop}; названий списка ${GLAVY.length}`);
console.log(`совпавшие 8-граммы лежат внутри кавычек у ${r.pojmano.size} названий списка:`);
for (const [imya, gg] of r.pojmano) {
  console.log(`  «${imya}» — 8-грамм ${gg.length}`);
  for (const g of gg) console.log(`      ${g}`);
}
for (const o of r.otkazy) console.log('ОТКАЗ ' + o);
console.log(r.otkazy.length ? `итог: отказов ${r.otkazy.length}` : 'итог: чужие 8-граммы на гайде — только внутри кавычек полных названий глав IX и XIII; каждое — один раз в обоих прочтениях, в ряду «Chapters», за номером своей главы; в <title>, описаниях и атрибутах — ни одной');
process.exit(r.otkazy.length ? 1 : 0);
