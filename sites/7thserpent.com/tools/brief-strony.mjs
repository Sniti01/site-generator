#!/usr/bin/env node
/**
 * Бриф страницы к тексту — собирается МАШИНОЙ, не рукой (пачка 0, П85 п. 5).
 * Форма — `sites/ac4bf-thewatch.com/tools/brief-strony.mjs` (пачка 0 первого
 * сайта, П42), написанная заново в LF для этого сайта.
 *
 *   node tools/brief-strony.mjs /max-payne-3/            — пишет input/briefs/max-payne-3.md
 *   node tools/brief-strony.mjs /max-payne-3/ --stdout   — только печатает
 *   node tools/brief-strony.mjs --all                    — все страницы дерева, кроме главной
 *   node tools/brief-strony.mjs --check                  — сторож чужих формулировок по записанным брифам
 *   тесты сторожа и сверки корпуса — tools/brief-strony.test.mjs (node:test, npm run proverki)
 *
 * ФУНДАМЕНТ СТОРОЖА — ЯДРА (сессия 20, П102 блок Б: «сторож брифов — на том же фундаменте»):
 * извлечение текста документа корпуса, модель слов и указатель — `core/text/` (parse5, одно
 * извлечение со сторожем страниц `core/gates/phrases.mjs`); имена игр — данные сайта
 * `gates/phrases.mjs`. Свои функции слов и указателя (`slova`, `bezImen`, `ukazatel`,
 * `tekstDokumenta`) у инструмента брифов ушли; 8-граммы — точно и со срезом окончаний, как
 * у сторожа страниц. Отбор корпуса страницы (ниже) — прежний, анатомии.
 *
 * ОТКУДА ЧТО, и чего здесь НЕТ:
 *
 *   1. `structure/structure.json` — адрес, тип, `h1`, `title`, `description`,
 *      ключи, родитель, `related` (с `h1`), `blocks[]` с источником и уверенностью,
 *      коридор. Это договор: текст его не меняет, а наполняет.
 *   2. `structure/s3-anatomy.json` — план содержания: медиана и коридор знаков,
 *      медианы h2/h3, темы и элементы с вердиктами. Имена тем и элементов —
 *      НАШ словарь (`rules-s3.json`), не заголовки конкурентов.
 *   3. Документы корпуса страницы — СПИСОК АДРЕСОВ для проверки фактов: ровно
 *      тот набор, что мерила анатомия (фразы страницы → `queries.json` →
 *      последняя запись манифеста; без маркетплейсов, переходов, дублей
 *      и оболочек — тем же кодом `anatomy-s3.mjs`, где он экспортирован,
 *      и копией `identityOf`, где нет). Счёт сверяется с `s3-anatomy.json`
 *      по каждому полю пропусков: разошёлся — отказ, бриф не пишется.
 *   4. Арт — ключи `src/data/game-art.json` игры страницы и класс лицензии
 *      из записи (П79 п. 3, П85 п. 7); чего нет — вопросом в пачке страницы.
 *
 * ЧЕГО ЗДЕСЬ НЕТ И НЕ БУДЕТ: ни одного предложения, заголовка или числа из
 * текста конкурента. Правило корпуса (бэклог, п. 1): «чужой текст не
 * извлекается — ни в план, ни в промпт, ни как пример формулировки. Никогда».
 * Бриф говорит, ГДЕ проверить факт, а не ЧТО написать. `--check` это
 * сторожит механически: ни одна последовательность из `N_GRAM` слов брифа
 * (без адресов) не совпадает с текстом скачанного документа корпуса сайта;
 * совпадение — отказ, и печатается строка брифа и адрес документа, а не
 * совпавшие слова. Официальные названия игр (`CLAUDE.md` сайта, §2) —
 * имена собственные, не формулировка: идут в n-грамму одним словом.
 * `--check` сверяет ещё и состав (по брифу на страницу дерева, кроме главной)
 * и побайтное равенство файла выводу генератора.
 *
 * ПРЕДЕЛЫ СТОРОЖА («судью судят», раунд 1): адреса документов печатаются
 * целиком (так велит П85 п. 5 — «адреса документов»), и слаг адреса несёт
 * заголовок чужой статьи — адрес из счёта вынимается, это не формулировка
 * брифа (R1-BRIFY-2); единица счёта — отрезок строки между `·` и `|`, фраза
 * через перенос строки или разделитель не ловится — генератор пишет каждое
 * поле одной строкой, ручная правка брифа ловится побайтной сверкой (R1-BRIFY-3);
 * указатель корпуса — видимый текст документа, без `meta`, JSON-LD, `alt`
 * и `title=` (R1-BRIFY-4); сверка отбора с анатомией — по счёту и пропускам,
 * набора документов `s3-anatomy.json` не хранит (R1-BRIFY-6); длинное
 * название игры в чужой фразе делает её короче n-граммы (R1-BRIFY-11).
 *
 * Корпус, анатомия и структура — только чтение.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { measureDoc, hostIn, docKey, wallOf, representatives, phrasesSha } from './anatomy-s3.mjs';
import { N_GRAM, REZHIMY, slova, imenaSlovami, bezImen, vRezhime, bezAdresov } from '@factory/core/text/words.mjs';
import { ukazatelKorpusa } from '@factory/core/text/corpus.mjs';
import { IMENA } from '../gates/phrases.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/* ------------------------------------------------------------------ *
 * Корпус страницы — отбор анатомии
 * ------------------------------------------------------------------ */

/** Копия `identityOf` из `anatomy-s3.mjs` (там не экспортирована): канонический
 *  адрес того же сайта, если он не корень, иначе адрес перехода — без хвостов.
 *  Равенство копии оригиналу держит только её текст: сверка счёта ниже ловит
 *  расхождение лишь там, где живой корпус его проявляет (раунд 1, R1-BRIFY-7).
 *  На 2026-09-25 текст копии равен оригиналу (`unesc` → `unescA`). */
const unescA = (s) =>
  s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
const hostOf = (u) => {
  try {
    return new URL(u).hostname.toLowerCase();
  } catch {
    return '';
  }
};
function identityOf(rec, html, dropParams) {
  const bare = (h) => h.replace(/^www\./, '');
  const raw = html.match(/<link\b(?=[^>]*\brel\s*=\s*["']?canonical\b)[^>]*\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
  const link = raw ? unescA(raw) : null;
  if (link) {
    try {
      const c = new URL(link, rec.final_url ?? rec.url);
      if (bare(c.hostname.toLowerCase()) === bare(hostOf(rec.final_url ?? rec.url)) && c.pathname !== '/') return docKey(c.toString(), dropParams);
    } catch {
      /* кривой канонический адрес — как если бы его не было */
    }
  }
  return docKey(rec.final_url ?? rec.url, dropParams);
}

const listFrom = (ref) => ref['ключ'].split('.').reduce((o, k) => o?.[k], readJson(ref['файл'])) ?? [];

/** Входы один раз на прогон. */
function vkhody() {
  const struktura = readJson('structure/structure.json');
  const anatomia = readJson('structure/s3-anatomy.json');
  const rules = readJson('structure/rules-s3.json');
  const manifest = readFileSync(join(root, 'input/corpus/manifest.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const queries = readJson('input/corpus/queries.json').phrases;
  const art = readJson('src/data/game-art.json');
  const last = new Map();
  for (const r of manifest) last.set(r.url, r);
  const shops = new Set(listFrom(rules['исключить_хосты']));
  const htmlOf = (rec) => {
    const p = join(root, 'input/corpus', rec.file);
    return existsSync(p) ? gunzipSync(readFileSync(p)).toString('utf8') : null;
  };
  return { struktura, anatomia, rules, manifest, queries, art, last, shops, htmlOf };
}

/**
 * Документы корпуса страницы тем же отбором, что `anatomy()`: возвращает
 * документы и счёт пропусков — для сверки с `s3-anatomy.json`.
 */
export function korpusStranicy(page, v) {
  const { rules, queries, last, shops, htmlOf } = v;
  const dropParams = rules['переходы']['параметры_без_смысла'];
  const minShell = rules['оболочки']['минимум_знаков'];
  const urls = new Set();
  for (const k of page.keywords) for (const u of queries[k]?.urls ?? []) urls.add(u);
  const skipped = { не_в_манифесте: 0, не_скачано: 0, маркетплейсов: 0, переходов: 0, нет_файла: 0, дублей: 0, оболочек: 0 };
  const read = [];
  for (const u of [...urls].sort(cmp)) {
    const rec = last.get(u);
    if (!rec) { skipped.не_в_манифесте += 1; continue; }
    if (rec.outcome !== 'ok') { skipped.не_скачано += 1; continue; }
    if (hostIn(rec.host, shops)) { skipped.маркетплейсов += 1; continue; }
    if (wallOf(rec, rules)) { skipped.переходов += 1; continue; }
    const html = htmlOf(rec);
    if (html === null || html === undefined) { skipped.нет_файла += 1; continue; }
    const m = measureDoc(html, rules);
    read.push({ url: rec.url, host: rec.host, file: rec.file, key: identityOf(rec, html, dropParams), self: docKey(rec.final_url ?? rec.url, dropParams), shell: m.znaki < minShell });
  }
  const kept = representatives(read);
  skipped.дублей = read.length - kept.length;
  const docs = [];
  for (const d of kept) {
    if (d.shell) { skipped.оболочек += 1; continue; }
    docs.push(d);
  }
  return { adresov: urls.size, skipped, docs };
}

/** Сверка отбора с записанной анатомией: пустой список — сошлось. */
export function sverkaSAnatomiej(page, an, k) {
  const r = [];
  if (!an) return [`страницы ${page.url} нет в s3-anatomy.json`];
  if (an.фразы_sha256 !== phrasesSha(page.keywords)) r.push('набор фраз страницы разошёлся с анатомией (фразы_sha256) — npm run anatomy:check');
  if (an.адресов !== k.adresov) r.push(`адресов выдачи ${k.adresov}, в анатомии ${an.адресов}`);
  if (an.документов !== k.docs.length) r.push(`документов ${k.docs.length}, в анатомии ${an.документов}`);
  if (an.хостов !== new Set(k.docs.map((d) => d.host)).size) r.push(`хостов ${new Set(k.docs.map((d) => d.host)).size}, в анатомии ${an.хостов}`);
  for (const [pole, n] of Object.entries(k.skipped)) if (an.пропущено?.[pole] !== n) r.push(`пропущено.${pole}: ${n}, в анатомии ${an.пропущено?.[pole]}`);
  return r;
}

/* ------------------------------------------------------------------ *
 * Бриф
 * ------------------------------------------------------------------ */

/** Имя файла брифа: путь адреса через дефис (`/max-payne-3/guide/` → `max-payne-3-guide.md`). */
export const imyaFajla = (url) => `${url.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'home'}.md`;

/**
 * Ветви маршрута — `PORYADOK` из самого `src/pages/[...slug].astro`, а не копия
 * списка: бриф называет, что печатается уже сейчас, и разойтись с маршрутом
 * ему не с чего («судью судят», раунд 1, R1-BRIFY-14). Не нашёл — отказ.
 */
const VETVI = (() => {
  const t = readFileSync(join(root, 'src/pages/[...slug].astro'), 'utf8');
  const m = t.match(/const PORYADOK = \[([^\]]*)\]/);
  if (!m) throw new Error('в src/pages/[...slug].astro нет const PORYADOK = [...] — ветви маршрута не прочитать');
  return new Set([...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
})();
const slownik = JSON.parse(readFileSync(fileURLToPath(import.meta.resolve('@factory/core/structure/blocks.json')), 'utf8'));
const statusBloka = (b) => {
  if (!slownik.блоки[b]?.реализован) return 'not in the core — the route skips it loudly; its implementation comes with the first page that has it (a core change is a question to the owner)';
  if (VETVI.has(b)) return 'printed by the route';
  return 'core block without a route branch yet — the branch is written with the first page of its form, owner’s look (plan P4)';
};

/** Игра страницы — для кадров и ключевого арта. */
const IGRA = {
  '/max-payne-1/': { game: 'Max Payne', klucz: 'hero' },
  '/max-payne-2/': { game: 'Max Payne 2: The Fall of Max Payne', klucz: 'mp2-art' },
  '/max-payne-3/': { game: 'Max Payne 3', klucz: 'mp3-art' },
  '/max-payne-3/guide/': { game: 'Max Payne 3', klucz: null },
};
/** Вопросы арта к пачке своей страницы (П85 п. 7). */
const VOPROSY_ARTA = {
  '/movie/': 'Movie stills of Max Payne (2008) are not publisher material of the games — a question to the owner in this page’s batch (П85 п. 7). The video block (trailer) is out of scope; official publisher channels only.',
  '/remake/': 'Materials of the remake itself — a question to the owner in this page’s batch (П85 п. 7; П81: the home page shows the remake with frames of the originals, named as originals).',
  '/voice-and-face/': 'Photos of people (actors, writers) — a question to the owner in this page’s batch (П85 п. 7).',
  '/media/': 'Covers carry the game logos — a question to the owner in this page’s batch (П85 п. 7; PRODUCT.md, fan-site legal limits).',
};
/** Открытое по странице, что знает пачка 0 («судью судят», раунд 1, R1-BRIFY-8, -9). */
const OTKRYTOE = {
  '/quotes/': 'The contract corridor 5093–6891 conflicts with short quotes (П67 п. 2; `CLAUDE.md` of the site, §6 — «decided in pachka 0»): an open question to the owner in the pachka 0 report; until the answer, the fuse of П43 decides when the honest text exists.',
  '/privacy/': 'Text — at publication (П63 п. 5, П85 п. 6): US privacy facts and the site mailbox are the owner’s; this brief is kept for that session.',
  '/404/': 'Written in pachka 0 — the route stand (П85 п. 6).',
};
/** Ключевой арт уже 3840 (мастер первого экрана, `MASTER_HERO` инструмента арта) —
 *  мал для первого экрана (бэклог 59 п. 2); по ширине записи, не по списку ключей. */
const malyMaster = (c) => (c?.width ?? 0) < 3840;

function brief(page, v, k) {
  const { struktura, anatomia, art } = v;
  const byUrl = new Map(struktura.pages.map((p) => [p.url, p]));
  const an = anatomia.страницы.find((a) => a.url === page.url);
  const cor = Array.isArray(page.corridor) ? `${page.corridor[0]}–${page.corridor[1]}` : 'null — no verdict, the number goes to the batch report (named decision)';
  const related = (page.related ?? []).map((u) => `- \`${u}\` — ${byUrl.get(u)?.h1 ?? '(not in the structure)'}`);
  const bloki = page.blocks.map((b) => `- \`${b.block}${b.role ? '#' + b.role : ''}\` — ${b.source}, ${b.confidence}${b.evidence ? `, evidence ${b.evidence}` : ''}. ${statusBloka(b.block)}`);
  const hero = page.blocks.some((b) => b.block === 'hero-key-art');
  const igra = IGRA[page.url];
  const kadry = igra ? Object.entries(art).filter(([, c]) => c.game === igra.game) : [];
  const licencja = [...new Set(Object.values(art).map((c) => c.license))];
  const tematy = (an?.темы ?? []).map((t) => `| ${t.тема} | ${t.документов}/${t.из} | ${Math.round(t.доля * 100)} % | ${t.вердикт} |`);
  const elementy = Object.entries(an?.элементы ?? {}).map(([n, e]) => `| ${n} | ${e.документов}/${e.из} | ${Math.round(e.доля * 100)} % | ${e.вердикт} |`);

  const heroArt = !hero
    ? 'not applicable — the page declares no `hero-key-art`'
    : igra?.klucz && art[igra.klucz]
      ? `\`${igra.klucz}\` — ${art[igra.klucz].opis} (${art[igra.klucz].width}×${art[igra.klucz].height}${malyMaster(art[igra.klucz]) ? `; a ${art[igra.klucz].width} master is small for a first screen — backlog 59 п. 2, decided with the first hero page` : ''})`
      : 'no key yet — a question in this page’s batch';

  return `# Brief: \`${page.url}\`

*Assembled by \`tools/brief-strony.mjs\` from the structure, the S3 anatomy and the corpus
manifest. Addresses only — no competitor wording (backlog, item 1; П85 п. 5).
\`npm run brief -- --check\` guards this mechanically.*

## Contract (structure.json — fill it, do not change it)

| Field | Value |
|---|---|
| type | \`${page.type}\` |
| h1 | ${page.h1} |
| title | ${page.title} |
| description | ${page.description} |
| parent | \`${page.parent}\` |
| cluster | ${page.cluster ?? '—'} · queries ${page.keywords?.length ?? 0} · demand ${page.volume ?? 0} (${struktura.site.semantics_source}) |
| corridor (contract) | ${cor} |
| hero art | ${heroArt} |

**Keywords** (${page.keywords?.length ?? 0}): ${(page.keywords ?? []).join(' · ') || '—'}

**Related** (\`link-list\` prints them from the structure, titled by their \`h1\`):
${related.join('\n') || '- —'}

**blocks[]** — the set and order of sections; each printed block needs its field in the content file:
${bloki.join('\n')}
${OTKRYTOE[page.url] ? `\n**Open for this page:** ${OTKRYTOE[page.url]}\n` : ''}
## Content plan (S3 anatomy, page corpus)

${an ? `- documents ${an.документов} from ${an.хостов} hosts, basket **${an.корзина}**
- **characters without spaces — the contract corridor: ${cor}**; the anatomy gives ${an.план.коридор[0]}–${an.план.коридор[1]}, median ${an.план.медиана_знаков}${an.план.ориентир ? ' (orientation only: fewer than four own documents, the niche median)' : ''}
- headings: h2 median ${an.план.h2_медиана}, h3 median ${an.план.h3_медиана}

| Topic (our vocabulary) | documents | share | verdict |
|---|---:|---:|---|
${tematy.join('\n') || '| — | | | |'}

| Page element | documents | share | verdict |
|---|---:|---:|---|
${elementy.join('\n')}

*Verdicts are the anatomy’s own words (\`structure/rules-s3.json\`): обязательна / обязателен — the norm of
the genre; на решение — to decide; редкая, не норма — rare, not the norm; гэп — one document; не считается —
too few documents to count.*` : '- no anatomy for this page — a service page outside the S3 corpus (no keywords)'}

## Page corpus documents for fact-checking (${k ? k.docs.length : 0}, hosts ${k ? new Set(k.docs.map((d) => d.host)).size : 0})

*Addresses, not text. A fact goes into print only if it is confirmed in one of these documents or in
\`sites/7thserpent.com/CLAUDE.md\` §2 (checked 2026-09-18); otherwise it is rephrased to what is
confirmed or dropped (П42 п. 1, П85 п. 1), and what is not in the sources goes to
\`docs/UNRESOLVED.md\` as a line, not into the text. Files: \`input/corpus/<file>\` (gzip). This is the
set the anatomy measured; the count is checked against \`s3-anatomy.json\`.*

${k && k.docs.length ? k.docs.map((d) => `- ${d.host} — ${d.url}`).join('\n') : '- —'}

## Art (П79 п. 3, П85 п. 7)

- License class of every publisher image on the site: ${licencja.map((l) => `«${l}»`).join('; ')} — printed in the footer for the frames this page shows.
${kadry.length ? `- Frames of ${igra.game} already in \`src/assets/gry/\`:\n${kadry.map(([key, c]) => `  - \`${key}\` — ${c.kind}: ${(c.opis ?? '—').replace(/^key art:\s*/, '')}`).join('\n')}` : '- No game of its own: frames are chosen in this page’s batch from `src/data/game-art.json`.'}${VOPROSY_ARTA[page.url] ? `\n- ${VOPROSY_ARTA[page.url]}` : ''}

## Writing rules (П42 п. 1–4 for this site, П85 п. 1; \`CLAUDE.md\` of the site, §2 and §5)

1. A fact not confirmed by the corpus or §2 is not printed; the list of flagged and dropped facts goes
   into the batch report. No self-flagging («possibly wrong») in published text.
2. Every paragraph about the remake, stores or availability carries its check date («as of September 2026»).
   Release dates — North American. Rumors and insider forecasts — only marked «rumor» with the source,
   better not at all (§2).
3. US English, fan-site voice; no piracy, «where to play», not «where to buy»; no publisher identity.
   Quotes — short, one or two lines, with game and chapter (П67 п. 2).
4. Internal addresses — from the root and only from the structure (the \`links\` gate stops the build on
   others); «where to play» links — only official stores (§5).
5. Length — the contract corridor; the \`corridor\` gate stops the build outside it (a \`null\` corridor —
   the number goes to the report, no verdict). No filler and no cuts: if honest text does not fit, the
   corridor changes by a named decision with the reason in the report (П43).
6. Byline and date are matters of taste: Code decides and names them in the batch report (П85 п. 1).
7. Not one competitor phrase: facts are checked in the documents above, the wording is ours.
`;
}

/* ------------------------------------------------------------------ *
 * Сторож чужих формулировок
 * ------------------------------------------------------------------ */

/**
 * Строки брифа с чужой последовательностью: [{ stroka, dokument, rezhim }] — без самих слов.
 * Единица текста — отрезок строки между разделителями списка и таблицы (`·`, `|`):
 * ключи через «·» — отдельные запросы, и последовательность через их стык —
 * склейка, а не фраза (первый прогон `--check` поймал так строку ключей `/remake/`).
 * Модель слов, свёртка имён игр, адреса и срез окончаний — ядра (`core/text/words.mjs`),
 * как у сторожа страниц; указатель — `uk.nayti(g, rezhim)` (`core/text/corpus.mjs`).
 * Одна находка на строку (первая по отрезкам и режимам).
 */
export function chuzhie(tekstBrifa, uk, imena = IMENA) {
  const imSl = imenaSlovami(imena);
  const out = [];
  tekstBrifa.split('\n').forEach((stroka, i) => {
    for (const otrezok of bezAdresov(stroka).split(/[·|]/)) {
      const ws0 = bezImen(slova(otrezok), imSl);
      for (const rezhim of REZHIMY) {
        const ws = vRezhime(ws0, rezhim);
        for (let j = 0; j + N_GRAM <= ws.length; j++) {
          const doc = uk.nayti(ws.slice(j, j + N_GRAM).join(' '), rezhim);
          if (doc) {
            out.push({ stroka: i + 1, dokument: doc, rezhim });
            return;
          }
        }
      }
    }
  });
  return out;
}

/** Указатель всего скачанного корпуса сайта — ядра; без корпуса или с неполным — громкий отказ. */
export const ukazatelSayta = () => ukazatelKorpusa(join(root, 'input/corpus'), { imena: IMENA });

/** Для тестов (`tools/brief-strony.test.mjs`): входы, генератор и ветви маршрута. */
export { vkhody, brief, VETVI };

/* ------------------------------------------------------------------ *
 * Запуск
 * ------------------------------------------------------------------ */

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const v = vkhody();
  const outDir = join(root, 'input/briefs');

  if (args.includes('--check')) {
    // Состав и побайтность: ровно по брифу на страницу дерева кроме главной,
    // и каждый равен выводу генератора сейчас — ручная правка и отставший бриф
    // (после npm run tree, anatomy, gameart) — отказ; «ok» о пустой папке
    // не выдаётся (раунд 1, R1-BRIFY-5).
    const ozhidaemye = new Map();
    let rashozhdenie = 0;
    for (const page of v.struktura.pages.filter((p) => p.url !== '/')) {
      const k = page.keywords?.length ? korpusStranicy(page, v) : null;
      const r = k ? sverkaSAnatomiej(page, v.anatomia.страницы.find((a) => a.url === page.url), k) : [];
      if (r.length) {
        rashozhdenie += 1;
        console.error(`${page.url}: отбор корпуса разошёлся с анатомией: ${r.join('; ')}`);
      }
      ozhidaemye.set(imyaFajla(page.url), brief(page, v, k));
    }
    const fajly = existsSync(outDir) ? readdirSync(outDir).filter((f) => f.endsWith('.md')).sort(cmp) : [];
    const net = [...ozhidaemye.keys()].filter((f) => !fajly.includes(f));
    const lishnie = fajly.filter((f) => !ozhidaemye.has(f));
    const uk = ukazatelSayta();
    let plokho = rashozhdenie + net.length + lishnie.length;
    for (const f of net) console.log(`НЕТ   ${f} — брифа страницы нет (npm run brief -- --all)`);
    for (const f of lishnie) console.log(`ЛИШНИЙ ${f} — страницы с таким брифом в структуре нет`);
    for (const f of fajly.filter((x) => ozhidaemye.has(x))) {
      const tekst = readFileSync(join(outDir, f), 'utf8');
      const otstal = tekst !== ozhidaemye.get(f);
      const r = chuzhie(tekst, uk);
      if (r.length || otstal) plokho += 1;
      const pometki = [
        ...(otstal ? ['≠ выводу генератора (правлен рукой или отстал — npm run brief -- --all)'] : []),
        ...r.map((x) => `чужое (${x.rezhim === 'srez' ? 'срез окончаний' : 'точно'}): строка ${x.stroka} (документ ${x.dokument})`),
      ];
      console.log(`${pometki.length ? 'ПЛОХО' : 'ok   '} ${f}${pometki.length ? ' — ' + pometki.join('; ') : ''}`);
    }
    console.log(
      `\nсторож: брифов ${fajly.filter((f) => ozhidaemye.has(f)).length} из ${ozhidaemye.size} (лишних ${lishnie.length}), документов корпуса ${uk.dokumentov}${uk.izKesha ? ' (указатель из кеша)' : ''}, n-грамма ${N_GRAM} слов, точно и со срезом окончаний; отказов — ${plokho}`
    );
    process.exit(plokho ? 1 : 0);
  }

  // Адрес — с ведущим «/»; иной аргумент не отбрасывается молча (раунд 1, R1-BRIFY-13).
  // В Git Bash «/адрес/» оболочка переписывает в путь Windows (и через npm run тоже) —
  // запускать с MSYS_NO_PATHCONV=1 или из PowerShell (раунд 2, R2-INSTRUMENTY-5).
  const chuzhieArgi = args.filter((a) => !a.startsWith('/') && !a.startsWith('--'));
  if (chuzhieArgi.length) {
    console.error(`не адрес страницы: ${chuzhieArgi.join(', ')} — адрес пишется от корня, со слэшем: /max-payne-3/`);
    process.exit(2);
  }

  const stdout = args.includes('--stdout');
  const cele = args.includes('--all')
    ? v.struktura.pages.filter((p) => p.url !== '/')
    : args.filter((a) => a.startsWith('/')).map((u) => {
        const p = v.struktura.pages.find((x) => x.url === u);
        if (!p) {
          console.error(`Адреса ${u} нет в structure.json`);
          process.exit(1);
        }
        if (u === '/') {
          console.error('главная — свой шаблон, брифа у неё нет');
          process.exit(1);
        }
        return p;
      });
  if (!cele.length) {
    console.error('node tools/brief-strony.mjs </адрес/> [--stdout] | --all | --check');
    process.exit(2);
  }
  if (!stdout) mkdirSync(outDir, { recursive: true });
  let plokho = 0;
  for (const page of cele) {
    const an = v.anatomia.страницы.find((a) => a.url === page.url);
    const k = page.keywords?.length ? korpusStranicy(page, v) : null;
    const rashozhdeniya = k ? sverkaSAnatomiej(page, an, k) : [];
    if (rashozhdeniya.length) {
      plokho += 1;
      console.error(`${page.url}: отбор корпуса разошёлся с анатомией — бриф не записан:\n  ${rashozhdeniya.join('\n  ')}`);
      continue;
    }
    const text = brief(page, v, k);
    if (stdout) console.log(text);
    else {
      writeFileSync(join(outDir, imyaFajla(page.url)), text);
      console.log(`бриф: ${page.url} → input/briefs/${imyaFajla(page.url)} (документов ${k ? k.docs.length : 0}${k ? ', счёт = анатомии' : ''})`);
    }
  }
  if (plokho) process.exit(1);
}
