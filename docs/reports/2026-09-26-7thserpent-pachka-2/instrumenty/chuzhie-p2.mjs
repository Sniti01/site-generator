// Чужие 8-словные последовательности в текстах страниц пачек 1 и 2 (семь страниц) — функциями
// сторожа брифов (`tools/brief-strony.mjs`: slova, bezImen, ukazatel, chuzhie, tekstDokumenta,
// без правки) по всем скачанным документам корпуса. Только чтение. Копия
// `docs/reports/2026-09-25-7thserpent-pachka-1/instrumenty/chuzhie-teksty.mjs` (сессия 14,
// 734afa7); отличие — список страниц (сессия 15, пачка 2) и эта шапка.
//
//   node chuzhie-p2.mjs <dist> [--proba]
//
// ТЕКСТ СТРАНИЦЫ — всё, что написано в сессии и попадает в HTML страницы маршрута:
//   - видимый текст единственного <main>: по строке на блочный элемент (p, h1–h4, li, dd,
//     dt, figcaption, blockquote, div, section, header, footer, nav, ul, ol, main, br);
//     строчные теги (a, span, em, strong, b, i, small, abbr, time, cite, q) снимаются ДВАЖДЫ —
//     вплотную (ссылка внутри фразы не рвёт её, раунд 1, R1-INSTR-1) и через пробел (соседние
//     строчные элементы, стоящие на экране раздельно, не склеиваются в одно слово, раунд 2,
//     R2-INSTR-1: «RTX Remix</span><span>Guide» давало «remixguide»); проверяются оба варианта,
//     находки объединяются. Прочие теги (wbr, sup, mark…) — пробелом (предел, R2-INSTR-3);
//   - значения alt у картинок в <main>, <title>, meta description, og:title, og:description —
//     каждое отдельной строкой (R1-INSTR-2).
// Отказ (код 2): на странице нет ровно одного <main>, или в тексте <main> меньше 100 слов —
// «0 чужих» о пустом извлечении не выдаётся (R1-INSTR-3).
// --proba: в HTML /pc/ ДО извлечения, внутрь первого абзаца, вставляется фраза из 12 слов
// документа корпуса (прозы, не служебного текста), седьмое слово — внутри <a>; проба
// обязана поймать строку (код 1). Так она проверяет и извлечение, и указатель.
// ПРЕДЕЛЫ (названы): единица — строка, и `chuzhie` возвращает не больше одной находки
// на строку: число в итоге — число строк с чужой последовательностью (R1-INSTR-5);
// строка режется по «|» и «·», как у сторожа брифов (R1-INSTR-4): фраза, разорванная этими
// знаками, не ловится; JSON-LD и aria-label не проверяются (их пишет не сессия, а Base.astro
// и ядро из структуры); границы <main>, комментариев и скриптов ищутся регулярными выражениями,
// не по правилам HTML: `<!-->` или строка «</main>» внутри скрипта обрежут текст (R2-INSTR-2;
// в сборке сайта их нет); alt — только в двойных кавычках (так печатает Astro, R2-INSTR-3).
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const B = await import(pathToFileURL(join(root, 'tools/brief-strony.mjs')).href);
const dist = process.argv[2];
const proba = process.argv.includes('--proba');
if (!dist || !existsSync(dist)) {
  console.error('нет папки сборки: ' + dist);
  process.exit(2);
}
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
console.log(`корпус: документов ${docs.length}`);

const BLOCHNYE = 'p|h1|h2|h3|h4|li|dd|dt|figcaption|blockquote|div|section|header|footer|nav|ul|ol|main';
const STROCHNYE = 'a|span|em|strong|b|i|small|abbr|time|cite|q';
const atr = (tag, imya) => (tag.match(new RegExp(`\\s${imya}="([^"]*)"`, 'i')) || [])[1];
const raskryt = (s) => B.tekstDokumenta(`<p>${s}</p>`).trim();

function tekstStranicy(h, url, strochnyeNa = '') {
  const nachala = [...h.matchAll(/<main\b/gi)].length;
  if (nachala !== 1) throw new Error(`${url}: <main> — ${nachala}, нужен ровно один`);
  const main = h.slice(h.search(/<main\b/i), h.search(/<\/main>/i));
  const bezKoda = main.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  const alty = [...bezKoda.matchAll(/<img\b[^>]*>/gi)].map((m) => atr(m[0], 'alt')).filter(Boolean).map(raskryt);
  const vidimy = bezKoda
    .replace(new RegExp(`</?(?:${STROCHNYE})\\b[^>]*>`, 'gi'), strochnyeNa)
    .replace(new RegExp(`</?(?:${BLOCHNYE})\\b[^>]*>`, 'gi'), '\n')
    .replace(/<br\s*\/?>/gi, '\n');
  const stroki = B.tekstDokumenta(vidimy).split('\n').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const golova = h.slice(0, h.search(/<\/head>/i));
  const titul = raskryt((golova.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const meta = [...golova.matchAll(/<meta\b[^>]*>/gi)]
    .filter((m) => /\s(?:name|property)="(?:description|og:title|og:description)"/i.test(m[0]))
    .map((m) => raskryt(atr(m[0], 'content') || ''));
  return { stroki, dop: [titul, ...meta, ...alty].filter(Boolean) };
}

let vsego = 0;
let otkaz = false;
for (const url of ['/pc/', '/games-like-max-payne/', '/media/', '/max-payne-1/', '/max-payne-2/', '/max-payne-3/', '/remake/']) {
  const f = join(dist, url.slice(1), 'index.html');
  if (!existsSync(f)) {
    console.error(`${url}: нет ${f}`);
    otkaz = true;
    continue;
  }
  let h = readFileSync(f, 'utf8');
  if (proba && url === '/pc/') {
    const d = docs.find((x) => /wikipedia/.test(x.url) && B.slova(x.tekst).length > 2000);
    // 12 подряд идущих слов документа (без пропусков между ними), начиная с 400-го токена.
    const ws = d.tekst.replace(/\s+/g, ' ').trim().split(' ');
    let i0 = 400;
    while (!ws.slice(i0, i0 + 12).every((w) => /^[A-Za-z]{2,}[,.]?$/.test(w))) i0 += 1;
    const kusok = ws.slice(i0, i0 + 12);
    kusok[6] = `<a href="/x/">${kusok[6]}</a>`;
    const m0 = h.search(/<main\b/i);
    const p = /<p\b[^>]*>/gi;
    p.lastIndex = m0;
    const mp = p.exec(h);
    if (m0 < 0 || !mp) throw new Error('проба: в <main> /pc/ нет абзаца');
    const i = mp.index + mp[0].length;
    h = h.slice(0, i) + kusok.join(' ') + ' ' + h.slice(i);
    console.log(`проба: в первый абзац /pc/ вставлено 12 слов документа ${d.url}, седьмое — в <a>`);
  }
  let t, tProbel;
  try {
    t = tekstStranicy(h, url);
    tProbel = tekstStranicy(h, url, ' ');
  } catch (e) {
    console.error(e.message);
    otkaz = true;
    continue;
  }
  const slov = B.slova(t.stroki.join('\n')).length;
  if (slov < 100) {
    console.error(`${url}: в тексте <main> слов ${slov} — меньше 100, извлечение пустое или сломано`);
    otkaz = true;
    continue;
  }
  // Оба варианта снятия строчных тегов; строки второго, совпавшие с первым, не повторяются.
  const vplotnuyu = new Set(t.stroki);
  const vse = [...t.stroki, ...tProbel.stroki.filter((s) => !vplotnuyu.has(s)), ...t.dop];
  const tekst = vse.join('\n');
  const naydeno = B.chuzhie(tekst, uk);
  vsego += naydeno.length;
  console.log(`${url}: строк ${t.stroki.length} (+${t.dop.length}: title, описания, alt), слов ${slov}, строк с чужой последовательностью: ${naydeno.length}`);
  for (const n of naydeno) console.log(`  строка ${n.stroka}: «${vse[n.stroka - 1].slice(0, 120)}» — ${n.dokument}`);
}
if (otkaz) {
  console.error('отказ: извлечение текста не удалось — итог не выдаётся');
  process.exit(2);
}
console.log(`итого строк с чужой последовательностью: ${vsego}`);
process.exit(vsego ? 1 : 0);
