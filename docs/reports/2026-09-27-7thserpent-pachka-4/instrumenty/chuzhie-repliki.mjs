// «На /quotes/ — только сами реплики в кавычках, каждая с игрой и главой» (П95, приёмка) — разбор
// совпадений сторожа 8 слов на странице цитат (сессия 17). Копия `chuzhie-p4.mjs` ловит строку целиком
// и не больше одной находки на строку: в строке стоят и реплика, и свой текст вокруг, и по строке
// не видно, где совпадение. Этот инструмент берёт ВСЕ 8-граммы каждой строки текста <main> /quotes/
// по положению — теми же правилами, что сторож брифов (`tools/brief-strony.mjs`: slova — слова строчными,
// апострофы сведены; IMENA — официальные названия игр одним словом; хеш 8-граммы — sha1, первые 4 байта;
// указатель `ukazatel` и видимый текст `tekstDokumenta` — импортом, без правки), по всем скачанным
// документам корпуса, и для каждой совпавшей 8-граммы смотрит, где лежат её слова:
//   - все восемь — внутри одной пары типографских кавычек «“ ”», и текст в этих кавычках — реплика
//     из списка REPLIKI (равенство после нормализации пробелов и апострофов) — разрешено;
//   - иначе — отказ: «вне кавычек», «через границу кавычек» (часть слов в кавычках, часть вне) или
//     «в кавычках, но не реплика списка».
// Кроме того, по каждой реплике списка:
//   - на странице она стоит в кавычках ровно один раз;
//   - сразу за закрывающей кавычкой — глава: «— Chapter N», «— Part I, Chapter N» или «— also Chapter N»
//     (окно — до следующей открывающей кавычки; одно «Part I» главой не считается);
//   - она стоит в ряду своей игры: надзаголовок ряда (`.t-label`) начинается с названия игры из списка.
// Извлечение текста <main> — как у `chuzhie-p4.mjs`: строка на блочный элемент, строчные теги
// снимаются дважды — вплотную и через пробел (R2-INSTR-1), судятся оба варианта; alt, title и описания
// не участвуют: реплик в них нет.
//
//   node chuzhie-repliki.mjs <dist> [--proba]
//
// --proba: порчи копии HTML в памяти — фраза документа корпуса вне кавычек, в кавычках, через границу
// кавычек (7 слов в кавычках + 7 вне; 2 слова в кавычках посреди 12), реплика без кавычек, глава снята
// (в том числе там, где дальше в абзаце есть «also Chapter 2» или «Part I»), ряд не той игры; каждая
// обязана дать отказ своей причиной; контроль — неиспорченная страница без отказов.
// ПРЕДЕЛЫ: кавычки — только парные «“ ”» в одной строке (так пишет текст сайта); кусок без пары
// судится как текст вне кавычек (строже); что реплика — из игры, а глава верна, судит сверка по
// документам (лист реплик, «судью судят»), не этот инструмент; у трёх реплик Max Payne 3 (TheGamer)
// документ корпуса даёт их только заголовочным регистром — совпадение слов от регистра не зависит
// (slova — строчными), приведение регистра названо в докладе.
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const B = await import(pathToFileURL(join(root, 'tools/brief-strony.mjs')).href);
const dist = process.argv[2];
const proba = process.argv.includes('--proba');
if (!dist || !existsSync(join(dist, 'quotes/index.html'))) {
  console.error('нет собранной /quotes/ в папке сборки: ' + dist);
  process.exit(2);
}

/** Реплики страницы и игра их ряда — ровно те, что сверены по документам корпуса (доклад, раздел 5). */
const REPLIKI = [
  { t: 'My cover had been blown. The door slammed shut behind me. And then I was dodging bullets like raindrops.', igra: 'Max Payne · 2001' },
  { t: 'Karaoke was never my strong point', igra: 'Max Payne · 2001' },
  { t: 'Thank you.', igra: 'Max Payne · 2001' },
  { t: 'In a situation like mine, you can only think in metaphors.', igra: 'Max Payne 2 · 2003' },
  { t: 'Her fashion sense didn’t leave a whole lot of room for imagination, let alone food', igra: 'Max Payne 3 · 2012' },
  { t: 'This place was like Baghdad and G-strings', igra: 'Max Payne 3 · 2012' },
  { t: 'I stood out in this place like a streetwalker in a monastery', igra: 'Max Payne 3 · 2012' },
  { t: 'But the airport is the only place a fat gringo might blend in. Well, there or a sex club.', igra: 'Max Payne 3 · 2012' },
];
const normR = (s) => s.replace(/\s+/g, ' ').replace(/[’‘]/g, "'").trim();
const REPLIKI_N = new Map(REPLIKI.map((r) => [normR(r.t), r]));

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
/** Хеш 8-граммы — та же формула, что у сторожа брифов (`hash` там не экспортирован); равенство
 *  проверяет самопроверка ниже: известная реплика обязана найтись. */
const hash = (s) => createHash('sha1').update(s).digest().readUInt32LE(0);
const imenaSlovami = B.IMENA.map((n) => B.slova(n)).sort((a, b) => b.length - a.length);

/** Слова строки с положением и меткой куска: -1 — вне кавычек, k — внутри k-й пары «“ ”». */
function slovaSMetkoy(s) {
  const pary = [];
  for (let i = 0; ; ) {
    const a = s.indexOf('“', i);
    const b = a < 0 ? -1 : s.indexOf('”', a + 1);
    if (a < 0 || b < 0) break;
    pary.push([a, b]);
    i = b + 1;
  }
  const metka = (pos) => pary.findIndex(([a, b]) => pos > a && pos < b);
  const s2 = s.replace(/[’‘]/g, "'");
  const out = [];
  for (const m of s2.matchAll(/[\p{L}\p{N}']+/gu)) {
    const w = m[0].toLowerCase().replace(/^'+|'+$/g, '');
    if (!w) continue;
    out.push({ w, seg: metka(m.index + (m[0].length - m[0].replace(/^'+/, '').length)) });
  }
  // Названия игр — одним словом, как bezImen сторожа; метка слитого слова — общая или «mix».
  const sl = [];
  for (let i = 0; i < out.length; ) {
    const imya = imenaSlovami.find((n) => n.every((w, j) => out[i + j]?.w === w));
    if (imya) {
      const segs = new Set(out.slice(i, i + imya.length).map((x) => x.seg));
      sl.push({ w: '§imya§', seg: segs.size === 1 ? [...segs][0] : 'mix' });
      i += imya.length;
    } else sl.push(out[i++]);
  }
  return { slova: sl, pary: pary.map(([a, b]) => s.slice(a + 1, b)) };
}

const BLOCHNYE = 'p|h1|h2|h3|h4|li|dd|dt|figcaption|blockquote|div|section|header|footer|nav|ul|ol|main';
const STROCHNYE = 'a|span|em|strong|b|i|small|abbr|time|cite|q';
function stroki(fragment, strochnyeNa) {
  const bezKoda = fragment.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  const vidimy = bezKoda
    .replace(new RegExp(`</?(?:${STROCHNYE})\\b[^>]*>`, 'gi'), strochnyeNa)
    .replace(new RegExp(`</?(?:${BLOCHNYE})\\b[^>]*>`, 'gi'), '\n')
    .replace(/<br\s*\/?>/gi, '\n');
  return B.tekstDokumenta(vidimy).split('\n').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function sud(h) {
  const otkazy = [];
  const nachala = [...h.matchAll(/<main\b/gi)].length;
  if (nachala !== 1) throw new Error(`<main> — ${nachala}, нужен ровно один`);
  const main = h.slice(h.search(/<main\b/i), h.search(/<\/main>/i));
  const vplotnuyu = stroki(main, '');
  const cherezProbel = stroki(main, ' ');
  const vse = [...vplotnuyu, ...cherezProbel.filter((s) => !new Set(vplotnuyu).has(s))];
  if (B.slova(vplotnuyu.join('\n')).length < 300) throw new Error('в тексте <main> /quotes/ меньше 300 слов — извлечение пустое или сломано');
  const pojmano = new Set();
  const vidennye = new Set();
  vse.forEach((s, n) => {
    const { slova, pary } = slovaSMetkoy(s);
    for (let i = 0; i + 8 <= slova.length; i++) {
      const okno = slova.slice(i, i + 8);
      const g = okno.map((x) => x.w).join(' ');
      if (!uk.h.has(hash(g))) continue;
      const doc = uk.teksty.find((t) => t.norm.includes(` ${g} `));
      if (!doc) continue;
      const segs = new Set(okno.map((x) => x.seg));
      const seg = segs.size === 1 ? [...segs][0] : null;
      const klyuch = `${n}:${seg}:${g}`;
      if (vidennye.has(klyuch)) continue;
      vidennye.add(klyuch);
      if (seg !== null && seg !== -1 && seg !== 'mix' && REPLIKI_N.has(normR(pary[seg]))) { pojmano.add(normR(pary[seg])); continue; }
      const vid = seg === -1 ? 'вне кавычек' : seg === null || seg === 'mix' ? 'через границу кавычек' : 'в кавычках, но не реплика списка';
      otkazy.push(`${vid}, строка ${n + 1}: «${g}» — ${doc.url}`);
    }
  });
  // Реплики: ровно один раз в кавычках; глава сразу за закрывающей кавычкой; ряд своей игры.
  const ryady = [...main.matchAll(/<section class="layer\b[\s\S]*?<\/section>/g)].map((m) => {
    const metka = (m[0].match(/<p class="t-label[^"]*"[^>]*>([\s\S]*?)<\/p>/) || [])[1] ?? '';
    return { metka: B.tekstDokumenta(`<p>${metka}</p>`).replace(/\s+/g, ' ').trim(), stroki: stroki(m[0], '') };
  });
  for (const r of REPLIKI) {
    const n = normR(r.t);
    const vhozhdeniya = [];
    for (const s of vplotnuyu) {
      for (let i = 0; ; ) {
        const a = s.indexOf('“', i);
        const b = a < 0 ? -1 : s.indexOf('”', a + 1);
        if (a < 0 || b < 0) break;
        if (normR(s.slice(a + 1, b)) === n) vhozhdeniya.push({ s, b });
        i = b + 1;
      }
    }
    if (vhozhdeniya.length !== 1) { otkazy.push(`реплика «${r.t.slice(0, 50)}» в кавычках ${vhozhdeniya.length} раз, ждали 1`); continue; }
    const { s, b } = vhozhdeniya[0];
    const sled = s.indexOf('“', b + 1);
    const okno = s.slice(b + 1, sled < 0 ? undefined : sled);
    if (!/^\s*[—–]\s*(also\s+)?(Part I,\s*)?Chapter \d+\b/.test(okno)) otkazy.push(`реплика «${r.t.slice(0, 50)}»: сразу после неё нет главы (— Chapter N, — Part I, Chapter N, — also Chapter N): «${okno.slice(0, 40)}»`);
    const ryad = ryady.find((x) => x.stroki.some((y) => y.includes('“') && normR(y).includes(n)));
    if (!ryad) otkazy.push(`реплика «${r.t.slice(0, 50)}» не в ряду story-row`);
    else if (!ryad.metka.startsWith(r.igra)) otkazy.push(`реплика «${r.t.slice(0, 50)}» в ряду «${ryad.metka}», ждали игру «${r.igra}»`);
  }
  return { otkazy, strok: vplotnuyu.length, pojmano: [...pojmano] };
}

const html = readFileSync(join(dist, 'quotes/index.html'), 'utf8');
// Самопроверка формулы хеша: 8-грамма реплики из списка обязана быть в указателе сторожа.
if (!uk.h.has(hash('my cover had been blown the door slammed'))) { console.error('хеш 8-граммы разошёлся со сторожем брифов — разбор недостоверен'); process.exit(2); }

if (proba) {
  const d = docs.find((x) => /wikipedia/.test(x.url) && B.slova(x.tekst).length > 2000);
  const ws = d.tekst.replace(/\s+/g, ' ').trim().split(' ');
  let i0 = 400;
  while (!ws.slice(i0, i0 + 14).every((w) => /^[A-Za-z]{2,}$/.test(w))) i0 += 1;
  const k = ws.slice(i0, i0 + 14);
  // Первый абзац тела первого ряда: `<p>` маршрута несёт атрибут области стилей Astro — по регулярному
  // выражению после `layer__body`; не нашёлся — порча не применится, и это видно в выводе.
  const vPervyAbzac = (h, t) => {
    const m = /<div class="layer__body[^"]*"[^>]*>\s*<p\b[^>]*>/g.exec(h);
    if (!m) return h;
    const p = m.index + m[0].length;
    return h.slice(0, p) + t + ' ' + h.slice(p);
  };
  const PORCHI = [
    { imya: 'контроль', h: html, prichina: null },
    { imya: '12 слов документа вне кавычек', h: vPervyAbzac(html, k.slice(0, 12).join(' ')), prichina: 'вне кавычек' },
    { imya: '12 слов документа в кавычках', h: vPervyAbzac(html, '“' + k.slice(0, 12).join(' ') + '”'), prichina: 'в кавычках, но не реплика списка' },
    { imya: '7 слов в кавычках + 7 вне', h: vPervyAbzac(html, '“' + k.slice(0, 7).join(' ') + '” ' + k.slice(7, 14).join(' ')), prichina: 'через границу кавычек' },
    { imya: '12 слов, в середине 2 в кавычках', h: vPervyAbzac(html, k.slice(0, 5).join(' ') + ' “' + k.slice(5, 7).join(' ') + '” ' + k.slice(7, 12).join(' ')), prichina: 'через границу кавычек' },
    { imya: 'реплика без кавычек', h: html.replace('“My cover had been blown.', 'My cover had been blown.').replace('raindrops.”', 'raindrops.'), prichina: 'вне кавычек' },
    { imya: 'глава снята (Chapter 7)', h: html.replace('— Chapter 7, titled', '— titled'), prichina: 'сразу после неё нет главы' },
    { imya: 'глава снята, дальше «also Chapter 2»', h: html.replace('let alone food” — Chapter 2,', 'let alone food” — in'), prichina: 'сразу после неё нет главы' },
    { imya: 'глава снята, дальше «Part I»', h: html.replace('“Thank you.” — Chapter 2,', '“Thank you.” In'), prichina: 'сразу после неё нет главы' },
    { imya: 'ряд не той игры', h: html.replace(/(<p class="t-label[^"]*"[^>]*>)Max Payne · 2001/, '$1Max Payne 3 · 2012'), prichina: 'ждали игру «Max Payne · 2001»' },
  ];
  let plokhoP = 0;
  for (const x of PORCHI) {
    const r = sud(x.h);
    const primenilas = x.prichina === null || x.h !== html;
    const ok = primenilas && (x.prichina === null ? r.otkazy.length === 0 : r.otkazy.some((o) => o.includes(x.prichina)));
    if (!ok) plokhoP += 1;
    console.log(`${ok ? 'ok   ' : 'ПЛОХО'} ${x.imya.padEnd(38)} ${!primenilas ? 'порча не применилась' : r.otkazy.join(' | ').slice(0, 170) || 'отказов нет'}`);
  }
  console.log(`проба: ${PORCHI.length - plokhoP}/${PORCHI.length}`);
  process.exit(plokhoP ? 1 : 0);
}
const r = sud(html);
console.log(`корпус: документов ${docs.length}; /quotes/: строк ${r.strok}; реплик списка ${REPLIKI.length}`);
console.log(`совпавшие 8-граммы лежат внутри кавычек у ${r.pojmano.length} реплик списка:`);
for (const x of r.pojmano) console.log(`  «${x.slice(0, 100)}»`);
for (const o of r.otkazy) console.log('ОТКАЗ ' + o);
console.log(r.otkazy.length ? `итог: отказов ${r.otkazy.length}` : 'итог: чужие 8-граммы — только внутри кавычек реплик списка; у каждой реплики сразу за ней глава, ряд — своей игры');
process.exit(r.otkazy.length ? 1 : 0);
