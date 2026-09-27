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
// ТЕКСТ СТРАНИЦЫ — как его видит читатель (раунды 1 и 2):
//   - строки <main>: по строке на блочный элемент (p, h1–h6, li, dl/dt/dd, figure, figcaption, blockquote, div, section,
//     article, aside, header, footer, nav, ul, ol, main, pre, hr, address, details, summary, form, fieldset, legend);
//     любой другой тег — в том числе табличные, <script>, <style> и комментарий — снимается дважды: вплотную и через
//     пробел, судятся оба прочтения; тег, который маска TEG не узнала, — так же; <br>, перенос строки в тексте
//     и пробельные управляющие (\t \n \v \f \r, сырые и числовыми ссылками) — пробел; прочие управляющие C0 и C1 и
//     невидимые знаки \p{Default_Ignorable_Code_Point} (мягкий перенос, U+200B, U+2060, U+034F, селекторы вариантов,
//     знаки направления…) снимаются — браузер их не рисует, и слово на экране целое; текст
//     приводится к NFC; границы <main> ищутся по маске, где скрипты, стили, комментарии и значения атрибутов забиты
//     пробелами;
//   - отдельные строки без исключений: <title>, meta description, og:title, og:description (из <head>; каждого ровно
//     по одному и непустые — иначе код 2); alt, title=, aria-label=, value= и placeholder= тегов <main> вне
//     комментариев и скриптов. Значения атрибутов раскрываются без снятия тегов: сырые «<» и «>» в них — текст.
// Для каждой совпавшей 8-граммы строки <main> смотрит, где лежат её слова:
//   - все восемь — внутри одной пары типографских кавычек «“ ”», и текст в этих кавычках — название главы из списка
//     GLAVY (равенство после нормализации пробелов, апострофов и пробела перед знаком препинания) — разрешено;
//   - иначе — отказ: «вне кавычек», «через границу кавычек» или «в кавычках, но не название главы списка».
// Совпадение в строках <title>, описаний и атрибутов — отказ всегда («в alt, title или описании»).
// Кроме того, по каждому названию списка, в каждом из двух прочтений:
//   - на странице оно стоит в кавычках ровно один раз;
//   - в ряду «Chapters»: секция `section.layer` с id="chapters" вне комментариев и видимой меткой (`.t-label`) «Chapters»
//     (регистр не важен: метку на экране пишет капслок CSS);
//   - за номером своей главы: отрезок от предыдущей закрывающей кавычки (или начала строки) до открывающей кавычки
//     названия — ровно «<свой номер>. <место> (<части> / <улики>): »: другого римского заголовка «<номер>.» и другого
//     счёта «(<части> / <улики>):» в нём нет (раунды 1 и 2: nazvaniya-1, nazv2-1, proby-r2-6).
//
//   node chuzhie-glavy.mjs <dist> [--proba]
//   Коды: 0 — чисто; 1 — отказы; 2 — извлечение или разбор недостоверны (итог не выдаётся).
//
// --proba: порчи копии HTML в памяти, каждая обязана дать свой итог (отказ своей причиной, код 2 или «чисто» —
// для законной разметки); контроль — неиспорченная страница без отказов. Список — в массиве PORCHI.
// ПРЕДЕЛЫ (названы; «строже» — ложный отказ, а не пропуск):
//   - кавычки — только символы «“ ”» парами в одной строке; кусок без пары судится как текст вне кавычек (строже);
//     кавычки, которые рисует браузер (<q>, CSS content), не видны — название в <q> получит отказ (строже, izv-N4);
//     немецкая закрывающая “ в „…“ открывает пару (строже, V6);
//   - название равно записи списка по словам и знакам, с точкой внутри кавычек; иной регистр («Down The World» у Steam
//     и portforward) или точка за кавычкой — отказ (строже, V8, nazvaniya-3); совпадение 8-грамм от регистра не зависит;
//   - кавычки внутри места главы, счёт частей и улик словами, римское число с точкой или инициал из I, V, X, L, C
//     с точкой в месте СВОЕЙ главы — отказ «не за номером» (строже, nazvaniya-2, pravilo-6, nazv2-2);
//   - название, разорванное строчным тегом внутри слова («Wo<em>r</em>ld»), в прочтении «через пробел» не равно записи
//     списка — отказ «в кавычках 0 раз» (строже);
//   - адрес вплотную к кавычке и слову («https://…”слово»): сторож съедает адрес вместе с кавычкой и словом, разбор —
//     нет; слова строки расходятся со сторожем — код 2, итог не выдаётся;
//   - ряд — от открывающего тега секции до первого </section>: вложенная секция обрежет ряд — отказ (строже, nazvaniya-4);
//   - скрытый текст (hidden, .visually-hidden, aria-hidden, <noscript>, <template>) считается видимым: скрытые «“ ”»
//     вокруг названия дали бы ему исключение (izv-N3) — путь только через шаблон маршрута, содержание маршрут экранирует;
//   - порядок слов — логический: текст, развёрнутый на экране знаком U+202E или <bdo dir="rtl">, судится как записан
//     (perepis-rlo, perepis-bdo); числовые ссылки &#128;–&#159;, которые браузер читает по windows-1252 (&#146; — «’»),
//     раскрываются в управляющие знаки и рвут слово (perepis-cp1252) — путь только через шаблон;
//   - видимый текст CSS content: не судится;
//   - указатель корпуса — сторожа брифов как есть: документ, где апостроф записан «´» (V2), текст декодирован не в той
//     кодировке (U+FFFD, V7) или тег стоит перед «’s» (V1), разбит иначе, чем та же фраза на странице, — такие 8-граммы
//     не ловят ни сторож, ни копия сторожа, ни этот разбор (предел семейства судей, строкой в доклад и бэклог);
//   - текст вне <main> и <head> (шапка, крошки, подвал) не судится; JSON-LD не судится;
//   - только точные 8-граммы: фразу корпуса с другими окончаниями видит срез окончаний
//     (`srez-okonchaniy-15.mjs`), его вывод по гайду читается глазами — «в кавычках на гайде только названия IX и XIII»
//     (pravilo-r2-7);
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
/** Пробел перед знаком препинания и после открывающей скобки — след тега в прочтении «через пробел» (раунд 2). */
const normP = (s) => s.replace(/\s+([.,:;!?)\]”])/g, '$1').replace(/([(\[“])\s+/g, '$1');
const normN = (s) => normR(normP(s));
const GLAVY_N = new Map(GLAVY.map((g) => [normN(g.t), g]));

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

const BLOCHNYE = new Set('p h1 h2 h3 h4 h5 h6 li dd dt dl figcaption figure blockquote div section article aside header footer nav ul ol main pre hr address details summary form fieldset legend'.split(' '));
/** Тег с атрибутами в кавычках (знак «>» внутри значения атрибута тег не обрывает). */
const TEG = String.raw`<\/?([a-zA-Z][a-zA-Z0-9-]*)(?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*\s*\/?>`;
const RAZDEL = '\u0001';
const KOD = /<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi;
/** Управляющие C0 — сырые и числовыми ссылками — до вставки разделителя строк (раунд 2, perepis-razdel, perepis-c0):
 *  пробельные (\t \n \v \f \r) — пробел, остальные браузер не рисует — снимаются. */
const bezC0 = (s) =>
  s
    .replace(/&#(?:0*(?:9|1[0-3])|x0*[9a-d]);/gi, ' ')
    .replace(/&#(?:0*(?:[0-9]|[12][0-9]|3[01])|x0*(?:[0-9a-f]|1[0-9a-f]));/gi, '')
    .replace(/[\t\n\v\f\r]/g, ' ')
    .replace(/[\u0000-\u001F]/g, '');
/** Строка, как её видит читатель: невидимые знаки и прочие управляющие (C1) сняты, NFC, пробелы сведены. */
const chistit = (s) => s.replace(/\p{Default_Ignorable_Code_Point}/gu, '').replace(/\p{Cc}/gu, '').normalize('NFC').replace(/\s+/g, ' ').trim();

function stroki(fragment, strochnyeNa) {
  const t = bezC0(fragment)
    .replace(KOD, strochnyeNa)
    .replace(new RegExp(TEG, 'g'), (m, imya) => {
      const im = imya.toLowerCase();
      if (BLOCHNYE.has(im)) return RAZDEL;
      if (im === 'br') return ' ';
      return strochnyeNa;
    })
    .replace(/<\/?[a-zA-Z][^>]*>/g, strochnyeNa);
  return B.tekstDokumenta(t).split(RAZDEL).map(chistit).filter(Boolean);
}

const atr = (tag, imya) => {
  const m = tag.match(new RegExp(`\\s${imya}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i'));
  return m ? m[1] ?? m[2] ?? m[3] : undefined;
};
/** Значение атрибута или текст <title>: сущности раскрыты, теги НЕ снимаются — «<» и «>» в значении — текст (раунд 2). */
const raskrytZnachenie = (s) => chistit(B.tekstDokumenta(bezC0(s).replace(/</g, '&lt;').replace(/>/g, '&gt;')));

/** Строки вне текста <main>: <title> и описания из <head> (ровно по одному, непустые), атрибуты тегов <main>. */
function dopStroki(h, i0, mainChist) {
  const maskaDoMain = h.slice(0, i0).replace(KOD, (m) => ' '.repeat(m.length));
  let konec = maskaDoMain.search(/<\/head>/i);
  if (konec < 0) konec = maskaDoMain.search(/<body\b/i);
  if (konec < 0) konec = i0;
  const golova = maskaDoMain.slice(0, konec);
  const titly = [...golova.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => m[1]);
  const meta = [...golova.matchAll(new RegExp(TEG, 'g'))].filter((m) => m[1].toLowerCase() === 'meta');
  const metaPo = (klyuch) => meta.filter((m) => (atr(m[0], 'name') ?? atr(m[0], 'property') ?? '').toLowerCase() === klyuch).map((m) => atr(m[0], 'content') ?? '');
  const golovnye = [['<title>', titly], ['meta description', metaPo('description')], ['og:title', metaPo('og:title')], ['og:description', metaPo('og:description')]];
  for (const [imya, arr] of golovnye) {
    if (arr.length !== 1 || !raskrytZnachenie(arr[0])) throw new Error(`в <head> гайда ${imya}: ${arr.length}, ждали ровно один непустой`);
  }
  const vMain = [...mainChist.matchAll(new RegExp(TEG, 'g'))].flatMap((m) => ['alt', 'title', 'aria-label', 'value', 'placeholder'].map((a) => atr(m[0], a)));
  return [...golovnye.map(([, arr]) => arr[0]), ...vMain].filter(Boolean).map(raskrytZnachenie).filter(Boolean);
}

function sud(h) {
  const otkazy = new Set();
  // Маска: скрипты, стили, комментарии и значения атрибутов забиты пробелами той же длины — «<main» и «</main>»
  // в них границу не сдвигают (раунд 1 izv-N7, раунд 2 perepis-maska-atr).
  const maska = h.replace(KOD, (m) => ' '.repeat(m.length)).replace(new RegExp(TEG, 'g'), (m) => m.replace(/"[^"]*"|'[^']*'/g, (q) => ' '.repeat(q.length)));
  const nachala = [...maska.matchAll(/<main\b/gi)].length;
  if (nachala !== 1) throw new Error(`<main> — ${nachala}, нужен ровно один`);
  const i0 = maska.search(/<main\b/i);
  const i1 = maska.search(/<\/main>/i);
  if (i1 < i0) throw new Error('нет закрывающего </main> после <main>');
  const main = h.slice(i0, i1);
  const mainChist = main.replace(KOD, ' ');
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
      if (seg !== null && seg !== -1 && seg !== 'mix' && GLAVY_N.has(normN(pary[seg]))) {
        const imya = normN(pary[seg]);
        if (!pojmano.has(imya)) pojmano.set(imya, []);
        pojmano.get(imya).push(`строка ${n + 1}: «${g}» — ${doc.url}`);
        continue;
      }
      const vid = seg === -1 ? 'вне кавычек' : seg === null || seg === 'mix' ? 'через границу кавычек' : 'в кавычках, но не название главы списка';
      otkazy.add(`${vid}, строка ${n + 1}: «${g}» — ${doc.url}`);
    }
  });
  const dop = dopStroki(h, i0, mainChist);
  for (const s of dop) {
    const ws = B.bezImen(B.slova(bezAdresov(s)));
    for (let i = 0; i + 8 <= ws.length; i++) {
      const g = ws.slice(i, i + 8).join(' ');
      const doc = nayti(g);
      if (doc) otkazy.add(`в alt, title или описании: «${g}» — ${doc.url} (строка «${s.slice(0, 60)}»)`);
    }
  }
  // Названия: в каждом прочтении — ровно один раз в кавычках, в ряду «Chapters», за номером своей главы.
  const sekciya = (mainChist.match(/<section class="layer\b[^>]*\bid="chapters"[\s\S]*?<\/section>/) || [])[0];
  if (!sekciya) otkazy.add('ряда «Chapters» (секция id="chapters") на странице нет');
  else {
    const metka = chistit(B.tekstDokumenta((sekciya.match(/<p class="t-label[^"]*"[^>]*>([\s\S]*?)<\/p>/) || [])[1] ?? ''));
    if (metka.toLowerCase() !== 'chapters') otkazy.add(`у ряда id="chapters" видимая метка «${metka}», ждали «Chapters»`);
  }
  for (const [prochtenie, na] of [[vplotnuyu, ''], [cherezProbel, ' ']]) {
    const stroki_ryada = sekciya ? stroki(sekciya, na) : [];
    for (const gl of GLAVY) {
      const n = normN(gl.t);
      const vhozhdeniya = [];
      for (const s of prochtenie) for (const [a, b] of paryKavychek(s)) if (normN(s.slice(a + 1, b)) === n) vhozhdeniya.push({ s, a });
      if (vhozhdeniya.length !== 1) otkazy.add(`название «${gl.t}» в кавычках ${vhozhdeniya.length} раз, ждали 1`);
      for (const { s, a } of vhozhdeniya) {
        if (sekciya && !stroki_ryada.includes(s)) otkazy.add(`название «${gl.t}» не в ряду «Chapters»`);
        const otrezok = normP(s.slice(s.lastIndexOf('”', a - 1) + 1, a)).replace(/\s+/g, ' ');
        const zagolovki = [...otrezok.matchAll(/(^|[\s”—–\-(\/])([IVXLC]+)\.(?=\s|$)/g)];
        const schety = [...otrezok.matchAll(/\(\d+ \/ \d+\):/g)];
        const forma = new RegExp(`^\\s*${gl.nomer}\\.\\s[^“”]*\\(\\d+ / \\d+\\):\\s*$`);
        if (zagolovki.length !== 1 || zagolovki[0][2] !== gl.nomer || schety.length !== 1 || !forma.test(otrezok)) {
          otkazy.add(`название «${gl.t}» не за номером своей главы ${gl.nomer} («${gl.nomer}. <место> (<части> / <улики>): »): «${otrezok.trim().slice(0, 70)}»`);
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
  // Вставка между 6-м и 7-м словом, с пробелами по краям: порча проверяет, что знак или тег не режет строку.
  const pol = (vstavka) => k.slice(0, 6).join(' ') + ' ' + vstavka + ' ' + k.slice(6, 12).join(' ');
  const razrez = (vstavka) => k.slice(0, 5).join(' ') + ' ' + k[5].slice(0, 2) + vstavka + k[5].slice(2) + ' ' + k.slice(6, 12).join(' ');
  // Фраза корпуса по правилу: 4 слова, признак, 3–4 слова — ровно из документа, 8-грамма сторожа (P10, NFD).
  const izKorpusa = (re) => {
    for (const x of docs) {
      const m = x.tekst.replace(/\s+/g, ' ').match(re);
      if (m && nayti(B.bezImen(B.slova(m[1])).slice(0, 8).join(' '))) return m[1];
    }
    return null;
  };
  const sImenem = izKorpusa(/(?:^| )((?:[A-Za-z]{2,} ){4}Max Payne 3 (?:[A-Za-z]{2,} ){2}[A-Za-z]{2,})(?= |$)/);
  const sSao = izKorpusa(/(?:^| )((?:[A-Za-z]{2,} ){4}São Paulo(?: [A-Za-z]{2,}){3})(?= |$)/);
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
  const vDlinu = (h, t) => vAbzac(h, t, h.indexOf('id="length"'));
  const vAtr = (h, imya, t) => { const s = `${imya}="`; const j = h.indexOf(s); return j < 0 ? h : h.slice(0, j + s.length) + t + ' ' + h.slice(j + s.length); };
  const IX = '“Here I Was Again, Halfway Down the World.”';
  const XIII = '“A Fat Bald Dude with a Bad Temper.”';
  const X = '“It’s Drive or Shoot, Sister.”';
  const PORCHI = [
    { imya: 'контроль', h: html, zhdem: 'чисто' },
    // Текст вне кавычек и кавычки.
    { imya: '12 слов документа вне кавычек', h: vAbzac(html, k12), zhdem: 'вне кавычек' },
    { imya: '12 слов документа в кавычках', h: vAbzac(html, '“' + k12 + '”'), zhdem: 'в кавычках, но не название главы списка' },
    { imya: '7 слов в кавычках + 7 вне', h: vAbzac(html, '“' + k.slice(0, 7).join(' ') + '” ' + k.slice(7, 14).join(' ')), zhdem: 'через границу кавычек' },
    { imya: '12 слов, в середине 2 в кавычках', h: vAbzac(html, k.slice(0, 5).join(' ') + ' “' + k.slice(5, 7).join(' ') + '” ' + k.slice(7, 12).join(' ')), zhdem: 'через границу кавычек' },
    { imya: 'фраза документа после IX в той же строке', h: html.replace(IX, IX + ' ' + k12), zhdem: 'вне кавычек' },
    { imya: '8-грамма IX ещё раз вне кавычек за ним', h: html.replace(IX, IX + ' here I was again, halfway down the world'), zhdem: 'вне кавычек' },
    { imya: 'фраза документа в кавычках главы X (строка IX)', h: html.replace(X, '“' + k12 + '”'), zhdem: 'в кавычках, но не название главы списка' },
    { imya: 'число вплотную к названию VI', h: html.replace('VI. An office building that goes up in flames (3 / 5): “A Dame', 'VI. An office building that goes up in flames, chapter 6: “A Dame'), zhdem: 'через границу кавычек' },
    // Два прочтения, теги, невидимые знаки.
    { imya: 'фраза, склеенная только через пробел', h: vAbzac(html, k.slice(0, 5).join(' ') + ' <span>' + k[5] + '</span><span>' + k[6] + '</span> ' + k.slice(7, 12).join(' ')), zhdem: 'вне кавычек' },
    { imya: 'слово, разрезанное пустым тегом (вплотную)', h: vAbzac(html, razrez('<em></em>')), zhdem: 'вне кавычек' },
    { imya: '<u> внутри слова', h: vAbzac(html, razrez('<u>') + '</u>'), zhdem: 'вне кавычек' },
    { imya: '<wbr> внутри слова', h: vAbzac(html, razrez('<wbr>')), zhdem: 'вне кавычек' },
    { imya: 'комментарий внутри слова', h: vAbzac(html, razrez('<!-- -->')), zhdem: 'вне кавычек' },
    { imya: 'скрипт внутри слова', h: vAbzac(html, razrez('<script></script>')), zhdem: 'вне кавычек' },
    { imya: 'тег, который маска TEG не узнаёт', h: vAbzac(html, razrez('<span title=it\'s>') + '</span>'), zhdem: 'вне кавычек' },
    { imya: '<td> посреди фразы', h: vAbzac(html, pol('<td>')), zhdem: 'вне кавычек' },
    { imya: '<br> посреди фразы', h: vAbzac(html, pol('<br>')), zhdem: 'вне кавычек' },
    { imya: 'перенос строки посреди фразы', h: vAbzac(html, pol('\n')), zhdem: 'вне кавычек' },
    { imya: '&#10; посреди фразы', h: vAbzac(html, pol('&#10;')), zhdem: 'вне кавычек' },
    { imya: '&#1; посреди фразы', h: vAbzac(html, pol('&#1;')), zhdem: 'вне кавычек' },
    { imya: 'U+0002 внутри слова', h: vAbzac(html, razrez(String.fromCharCode(2))), zhdem: 'вне кавычек' },
    { imya: '&#2; внутри слова', h: vAbzac(html, razrez('&#2;')), zhdem: 'вне кавычек' },
    { imya: 'U+0001 посреди фразы', h: vAbzac(html, pol('\u0001')), zhdem: 'вне кавычек' },
    { imya: '&#173; внутри слова', h: vAbzac(html, razrez('&#173;')), zhdem: 'вне кавычек' },
    { imya: 'U+00AD внутри слова', h: vAbzac(html, razrez('\u00AD')), zhdem: 'вне кавычек' },
    { imya: 'U+034F внутри слова', h: vAbzac(html, razrez('\u034F')), zhdem: 'вне кавычек' },
    { imya: 'адрес посреди фразы', h: vAbzac(html, pol(' https://example.com/x ')), zhdem: 'вне кавычек' },
    { imya: 'название игры в каждом окне фразы', h: sImenem ? vAbzac(html, sImenem) : html, zhdem: 'вне кавычек' },
    { imya: 'фраза со словом на «İ»', h: sI ? vAbzac(html, sI) : html, zhdem: 'вне кавычек' },
    { imya: 'фраза с разложенной «ã» (NFD)', h: sSao ? vAbzac(html, sSao.normalize('NFD')) : html, zhdem: 'вне кавычек' },
    // Границы <main>.
    { imya: '«</main>» в комментарии перед фразой', h: vAbzac(html, '<!-- </main> --> ' + k12), zhdem: 'вне кавычек' },
    { imya: '«</main>» в скрипте перед фразой', h: vAbzac(html, '<script>/* </main> */</script> ' + k12), zhdem: 'вне кавычек' },
    { imya: '«</main>» в атрибуте перед фразой', h: vAbzac(html, '<span title="</main>">x</span> ' + k12), zhdem: 'вне кавычек' },
    // Названия: счёт, допуск, ряд, номер.
    { imya: 'название IX без кавычек', h: html.replace(IX, 'Here I Was Again, Halfway Down the World.'), zhdem: 'вне кавычек' },
    { imya: 'название XIII дважды', h: vAbzac(html, XIII), zhdem: 'в кавычках 2 раз' },
    { imya: 'копия IX, видимая только через пробел', h: vDlinu(html, '“Here I Was Again, Halfway Down the<span></span>World.”'), zhdem: 'в кавычках 2 раз' },
    { imya: 'копия IX, видимая только вплотную', h: vDlinu(html, '“Here I Was Again, Halfway Down the Wo<em></em>rld.”'), zhdem: 'в кавычках 2 раз' },
    { imya: 'название IX сокращено (как до сессии 19)', h: html.replace(IX, '“Here I Was Again…”'), zhdem: 'в кавычках 0 раз' },
    { imya: 'лишнее слово внутри кавычек IX', h: html.replace(IX, '“Here I Was Again, Halfway Down the World, Again.”'), zhdem: 'в кавычках, но не название главы списка' },
    { imya: 'хвост во второй паре, первая цела', h: vDlinu(html, '“Here I Was Again, Halfway Down the World. Again.”'), zhdem: 'в кавычках, но не название главы списка' },
    { imya: 'кавычка IX закрыта раньше', h: html.replace(IX, '“Here I Was Again, Halfway Down the” World.'), zhdem: 'через границу кавычек' },
    { imya: 'номер чужой главы у IX', h: html.replace('IX. The favela again', 'X. The favela again'), zhdem: 'не за номером своей главы IX' },
    { imya: 'номер «XIX.» у IX', h: html.replace('IX. The favela again', 'XIX. The favela again'), zhdem: 'не за номером своей главы IX' },
    { imya: 'номер снят у XIII', h: html.replace('XIII. A prison', 'A prison'), zhdem: 'не за номером своей главы XIII' },
    { imya: 'заголовок главы X между IX и названием', h: html.replace('police raid (6 / 3): ' + IX, 'police raid (6 / 3): X. A bus station (6 / 2): ' + IX), zhdem: 'не за номером своей главы IX' },
    { imya: 'второй счёт между IX и названием', h: html.replace('police raid (6 / 3): ' + IX, 'police raid (6 / 3): a bus station (6 / 2): ' + IX), zhdem: 'не за номером своей главы IX' },
    { imya: 'IX под заголовком X со ссылкой «IX.»', h: html.replace('police raid (6 / 3): ' + IX + ' X. A bus station and a bus ride (6 / 2): ' + X, 'police raid (6 / 3): ' + X + ' X. A bus station, back from IX. to the city (6 / 2): ' + IX), zhdem: 'не за номером своей главы IX' },
    { imya: 'XIII под «—XIV.» вплотную', h: html.replace('XIII. A prison and a police station (9 / 7): ' + XIII, 'XIII. A prison and a police station —XIV. The airport (9 / 7): ' + XIII), zhdem: 'не за номером своей главы XIII' },
    { imya: 'текст между счётом и кавычкой IX', h: html.replace('(6 / 3): ' + IX, '(6 / 3): see ' + IX), zhdem: 'не за номером своей главы IX' },
    { imya: 'счёт частей и улик снят у IX', h: html.replace('police raid (6 / 3): ' + IX, 'police raid: ' + IX), zhdem: 'не за номером своей главы IX' },
    {
      imya: 'название XIII в чужом ряду',
      h: (() => { const bez = html.replace(' XIII. A prison and a police station (9 / 7): ' + XIII, ''); return vDlinu(bez, 'XIII. A prison and a police station (9 / 7): ' + XIII); })(),
      zhdem: 'не в ряду «Chapters»',
    },
    { imya: 'ряда с id="chapters" нет', h: html.replace('id="chapters"', 'id="glavy"'), zhdem: 'ряда «Chapters» (секция id="chapters") на странице нет' },
    { imya: 'видимая метка ряда не «Chapters»', h: html.replace(/(id="chapters"[\s\S]*?<p class="t-label[^"]*"[^>]*>)Chapters</, '$1Length<'), zhdem: 'видимая метка «Length»' },
    { imya: 'метка «Chapters» только в комментарии', h: html.replace(/(id="chapters"[\s\S]*?)(<p class="t-label[^"]*"[^>]*>)Chapters</, '$1<!-- $2Chapters</p> -->$2Length<'), zhdem: 'видимая метка «Length»' },
    // Законная разметка — чисто (раунд 2: ложные отказы).
    { imya: '<a> вокруг IX до точки — чисто', h: html.replace(IX, '“<a href="/x/">Here I Was Again, Halfway Down the World</a>.”'), zhdem: 'чисто' },
    { imya: 'счёт IX в <span> — чисто', h: html.replace('police raid (6 / 3): ', 'police raid <span class="tabular">(6 / 3)</span>: '), zhdem: 'чисто' },
    { imya: 'номер IX в <strong> — чисто', h: html.replace('IX. The favela again', '<strong>IX</strong>. The favela again'), zhdem: 'чисто' },
    { imya: 'метка CHAPTERS заглавными — чисто', h: html.replace(/(id="chapters"[\s\S]*?<p class="t-label[^"]*"[^>]*>)Chapters</, '$1CHAPTERS<'), zhdem: 'чисто' },
    { imya: 'фраза в alt картинки в комментарии — чисто', h: vAbzac(html, '<!-- <img src="x.png" alt="' + k12 + '"> -->'), zhdem: 'чисто' },
    // <title>, описания, атрибуты.
    { imya: 'фраза документа в <title>', h: html.replace('<title>', '<title>' + k12 + ' '), zhdem: 'в alt, title или описании' },
    { imya: 'фраза документа в meta description', h: vAtr(html, 'name="description" content', k12), zhdem: 'в alt, title или описании' },
    { imya: '«>» в description перед фразой', h: vAtr(html, 'name="description" content', 'Settings > Graphics: ' + k12), zhdem: 'в alt, title или описании' },
    { imya: 'название игры в description', h: sImenem ? vAtr(html, 'name="description" content', sImenem) : html, zhdem: 'в alt, title или описании' },
    { imya: 'фраза документа в og:title', h: vAtr(html, 'property="og:title" content', k12), zhdem: 'в alt, title или описании' },
    { imya: 'фраза документа в og:description', h: vAtr(html, 'property="og:description" content', k12), zhdem: 'в alt, title или описании' },
    { imya: 'фраза документа в alt картинки <main>', h: (() => { const i = html.search(/<main\b/i); const j = html.indexOf(' alt="', i); return j < 0 ? html : html.slice(0, j) + ' alt="' + k12 + ' ' + html.slice(j + 6); })(), zhdem: 'в alt, title или описании' },
    { imya: '«<» в alt перед фразой', h: (() => { const i = html.search(/<main\b/i); const j = html.indexOf(' alt="', i); return j < 0 ? html : html.slice(0, j) + ' alt="at < 30 fps: ' + k12 + ' ' + html.slice(j + 6); })(), zhdem: 'в alt, title или описании' },
    { imya: 'фраза документа в атрибуте title=', h: vAbzac(html, '<span title="' + k12 + '">x</span>'), zhdem: 'в alt, title или описании' },
    { imya: 'фраза документа в aria-label', h: vAbzac(html, '<span aria-label="' + k12 + '">x</span>'), zhdem: 'в alt, title или описании' },
    { imya: 'фраза документа в value кнопки', h: vAbzac(html, '<input type="button" value="' + k12 + '">'), zhdem: 'в alt, title или описании' },
    // Охраны: итог не выдаётся, код 2.
    { imya: 'второй <main>', h: html.replace('</main>', '</main><main>x</main>'), zhdem: 'ИСКЛЮЧЕНИЕ <main> — 2' },
    { imya: 'пустой <main>', h: html.replace(/(<main\b[^>]*>)[\s\S]*(<\/main>)/, '$1<p>Only a few words here.</p>$2'), zhdem: 'ИСКЛЮЧЕНИЕ в тексте <main> гайда меньше 300 слов' },
    { imya: 'нет meta description', h: html.replace(/<meta name="description"[^>]*>/, ''), zhdem: 'ИСКЛЮЧЕНИЕ в <head> гайда meta description: 0' },
    { imya: 'слова разошлись со сторожем (адрес у кавычки)', h: vAbzac(html, '“Alpha https://example.com/”beta gamma.'), zhdem: 'ИСКЛЮЧЕНИЕ слова строки разошлись со сторожем' },
  ];
  let plokhoP = 0;
  for (const x of PORCHI) {
    const r = sudBezPadeniya(x.h);
    const primenilas = x.imya === 'контроль' || x.h !== html;
    const zhdemIsklyuchenie = x.zhdem.startsWith('ИСКЛЮЧЕНИЕ');
    const ok = primenilas && !!r.isklyuchenie === zhdemIsklyuchenie && (x.zhdem === 'чисто' ? r.otkazy.length === 0 : r.otkazy.some((o) => o.includes(x.zhdem)));
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
console.log(`корпус: документов ${docs.length}; /max-payne-3/guide/: строк <main> ${r.strok}, строк <title>, описаний и атрибутов ${r.dop}; названий списка ${GLAVY.length}`);
console.log(`совпавшие 8-граммы лежат внутри кавычек у ${r.pojmano.size} названий списка:`);
for (const [imya, gg] of r.pojmano) {
  console.log(`  «${imya}» — 8-грамм ${gg.length}`);
  for (const g of gg) console.log(`      ${g}`);
}
for (const o of r.otkazy) console.log('ОТКАЗ ' + o);
console.log(r.otkazy.length ? `итог: отказов ${r.otkazy.length}` : 'итог: в <main> гайда чужие 8-граммы — только внутри кавычек полных названий глав IX и XIII; каждое — один раз в обоих прочтениях, в ряду «Chapters», за номером своей главы; в <title>, описаниях и атрибутах — ни одной');
process.exit(r.otkazy.length ? 1 : 0);
