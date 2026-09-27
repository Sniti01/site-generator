// «На /quotes/ — только сами реплики в кавычках, каждая с игрой и главой» (П95, приёмка) — разбор
// совпадений сторожа 8 слов на странице цитат (сессия 17). Копия `chuzhie-p4.mjs` ловит строку целиком:
// в строке стоит и реплика, и свой текст вокруг, и по строке не видно, где совпадение. Этот инструмент
// делит каждую строку текста <main> /quotes/ на куски в типографских кавычках «“…”» и куски вне их и
// судит отдельно, теми же функциями сторожа брифов (`tools/brief-strony.mjs`: slova, bezImen, ukazatel,
// chuzhie, tekstDokumenta — импортом, без правки), по всем скачанным документам корпуса:
//   - текст ВНЕ кавычек (куски строки, сшитые через разрыв строки — каждый отдельной строкой) —
//     чужих последовательностей 0, иначе код 1;
//   - каждый кусок В кавычках, где сторож нашёл чужую последовательность, обязан быть репликой
//     из списка REPLIKI (равенство после нормализации: пробелы, типографские апострофы) — иначе код 1;
//   - каждая реплика списка обязана стоять на странице в кавычках ровно один раз, а в той же строке
//     после неё — игра или глава (ряд — игра, строка — глава: «Chapter N», «Part I» или «the ending»).
// Извлечение текста <main> — то же, что у `chuzhie-p4.mjs` (строка на блочный элемент, строчные
// теги снимаются вплотную), alt, title и описания не участвуют: реплик в них нет.
//
//   node chuzhie-repliki.mjs <dist> [--proba]
//
// --proba: в копию HTML (в памяти) вставляются (1) фраза из 12 слов документа корпуса вне кавычек,
// (2) та же фраза в кавычках, (3) реплика списка убирается из кавычек — каждая порча обязана дать
// отказ своей причиной; контроль — неиспорченная страница без отказов.
// ПРЕДЕЛЫ: кавычки — только парные «“ ”» в одной строке (так пишет текст сайта); кусок без пары
// судится как текст вне кавычек (строже, не мягче); что реплика — из игры, а глава верна, судит
// сверка по документам (лист реплик, «судью судят»), не этот инструмент.
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
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

/** Реплики страницы — ровно те, что сверены «буква в букву» по документам корпуса (доклад, раздел 5). */
const REPLIKI = [
  'My cover had been blown. The door slammed shut behind me. And then I was dodging bullets like raindrops.',
  'Karaoke was never my strong point',
  'Thank you.',
  'In a situation like mine, you can only think in metaphors.',
  'I had a dream of my wife. She was dead. But it was all right.',
  'Her fashion sense didn’t leave a whole lot of room for imagination, let alone food',
  'This place was like Baghdad and G-strings',
  'I stood out in this place like a streetwalker in a monastery',
  'But the airport is the only place a fat gringo might blend in. Well, there or a sex club.',
];
const normR = (s) => s.replace(/\s+/g, ' ').replace(/[’‘]/g, "'").trim();
const REPLIKI_N = new Set(REPLIKI.map(normR));

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

const BLOCHNYE = 'p|h1|h2|h3|h4|li|dd|dt|figcaption|blockquote|div|section|header|footer|nav|ul|ol|main';
const STROCHNYE = 'a|span|em|strong|b|i|small|abbr|time|cite|q';
function stroki(h) {
  const nachala = [...h.matchAll(/<main\b/gi)].length;
  if (nachala !== 1) throw new Error(`<main> — ${nachala}, нужен ровно один`);
  const main = h.slice(h.search(/<main\b/i), h.search(/<\/main>/i));
  const bezKoda = main.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  const vidimy = bezKoda
    .replace(new RegExp(`</?(?:${STROCHNYE})\\b[^>]*>`, 'gi'), '')
    .replace(new RegExp(`</?(?:${BLOCHNYE})\\b[^>]*>`, 'gi'), '\n')
    .replace(/<br\s*\/?>/gi, '\n');
  return B.tekstDokumenta(vidimy).split('\n').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

/** Строка → куски в кавычках (`v`) и вне их (`vne`); непарная кавычка — остаток строки идёт «вне». */
function kuski(s) {
  const v = [];
  const vne = [];
  let i = 0;
  for (;;) {
    const a = s.indexOf('“', i);
    const b = a < 0 ? -1 : s.indexOf('”', a + 1);
    if (a < 0 || b < 0) { vne.push(s.slice(i)); break; }
    vne.push(s.slice(i, a));
    v.push(s.slice(a + 1, b));
    i = b + 1;
  }
  return { v, vne: vne.map((x) => x.trim()).filter(Boolean) };
}

function sud(h) {
  const otkazy = [];
  const st = stroki(h);
  if (B.slova(st.join('\n')).length < 300) throw new Error('в тексте <main> /quotes/ меньше 300 слов — извлечение пустое или сломано');
  const vneVse = [];
  const vVse = [];
  st.forEach((s, n) => {
    const k = kuski(s);
    for (const x of k.vne) vneVse.push({ n, t: x });
    for (const x of k.v) vVse.push({ n, t: x, stroka: s });
  });
  const nVne = B.chuzhie(vneVse.map((x) => x.t).join('\n'), uk);
  for (const f of nVne) otkazy.push(`вне кавычек, строка ${vneVse[f.stroka - 1].n + 1}: «${vneVse[f.stroka - 1].t.slice(0, 90)}» — ${f.dokument}`);
  const nV = B.chuzhie(vVse.map((x) => x.t).join('\n'), uk);
  const lovlennye = [];
  for (const f of nV) {
    const x = vVse[f.stroka - 1];
    if (!REPLIKI_N.has(normR(x.t))) otkazy.push(`в кавычках, но не реплика списка, строка ${x.n + 1}: «${x.t.slice(0, 90)}» — ${f.dokument}`);
    else lovlennye.push(x);
  }
  for (const r of REPLIKI) {
    const gde = vVse.filter((x) => normR(x.t) === normR(r));
    if (gde.length !== 1) { otkazy.push(`реплика «${r.slice(0, 50)}» в кавычках ${gde.length} раз, ждали 1`); continue; }
    const posle = gde[0].stroka.slice(gde[0].stroka.indexOf(gde[0].t) + gde[0].t.length);
    if (!/(Chapter \d+|Part I\b|the ending)/.test(posle)) otkazy.push(`реплика «${r.slice(0, 50)}»: в строке после неё нет главы (Chapter N, Part I, the ending)`);
  }
  return { otkazy, strok: st.length, vne: vneVse.length, v: vVse.length, lovlennye };
}

const html = readFileSync(join(dist, 'quotes/index.html'), 'utf8');
if (proba) {
  const d = docs.find((x) => /wikipedia/.test(x.url) && B.slova(x.tekst).length > 2000);
  const ws = d.tekst.replace(/\s+/g, ' ').trim().split(' ');
  let i0 = 400;
  while (!ws.slice(i0, i0 + 12).every((w) => /^[A-Za-z]{2,}[,.]?$/.test(w))) i0 += 1;
  const kusok = ws.slice(i0, i0 + 12).join(' ');
  // Первый абзац тела первого ряда: `<p>` маршрута несёт атрибут области стилей Astro, поэтому — по
  // регулярному выражению после `layer__body`; не нашёлся — проба не применяется и это видно в выводе.
  const vPervyAbzac = (h, t) => {
    const re = /<div class="layer__body[^"]*"[^>]*>\s*<p\b[^>]*>/g;
    const m = re.exec(h);
    if (!m) return h;
    const p = m.index + m[0].length;
    return h.slice(0, p) + t + ' ' + h.slice(p);
  };
  const PORCHI = [
    { imya: 'контроль', h: html, prichina: null },
    { imya: '12 слов документа вне кавычек', h: vPervyAbzac(html, kusok), prichina: 'вне кавычек' },
    { imya: '12 слов документа в кавычках', h: vPervyAbzac(html, '“' + kusok + '”'), prichina: 'в кавычках, но не реплика списка' },
    { imya: 'реплика без кавычек', h: html.replace('“My cover had been blown.', 'My cover had been blown.').replace('raindrops.”', 'raindrops.'), prichina: 'вне кавычек' },
    { imya: 'реплика без главы в строке', h: html.replace('— Chapter 7, ', '— '), prichina: 'нет главы' },
  ];
  let plokhoP = 0;
  for (const x of PORCHI) {
    const r = sud(x.h);
    const primenilas = x.prichina === null || x.h !== html;
    const ok = primenilas && (x.prichina === null ? r.otkazy.length === 0 : r.otkazy.some((o) => o.includes(x.prichina)));
    if (!ok) plokhoP += 1;
    console.log(`${ok ? 'ok   ' : 'ПЛОХО'} ${x.imya.padEnd(34)} ${!primenilas ? 'порча не применилась' : r.otkazy.join(' | ').slice(0, 160) || 'отказов нет'}`);
  }
  console.log(`проба: ${PORCHI.length - plokhoP}/${PORCHI.length}`);
  process.exit(plokhoP ? 1 : 0);
}
const r = sud(html);
console.log(`корпус: документов ${docs.length}; /quotes/: строк ${r.strok}, кусков вне кавычек ${r.vne}, в кавычках ${r.v}`);
console.log(`реплик списка ${REPLIKI.length}; сторож поймал в кавычках ${r.lovlennye.length} — все из списка:`);
for (const x of r.lovlennye) console.log(`  строка ${x.n + 1}: «${x.t.slice(0, 100)}»`);
for (const o of r.otkazy) console.log('ОТКАЗ ' + o);
console.log(r.otkazy.length ? `итог: отказов ${r.otkazy.length}` : 'итог: чужие последовательности — только реплики списка в кавычках, у каждой в строке глава');
process.exit(r.otkazy.length ? 1 : 0);
