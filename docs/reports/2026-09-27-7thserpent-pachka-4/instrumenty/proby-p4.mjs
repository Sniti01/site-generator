// Разовые пробы новой ветви маршрута пачки 4 (сессия 17, П95 п. 2) — ветвь `gallery` и её поле схемы.
// Замороженные пробы договора (`sites/7thserpent.com/tools/proby-tresci.mjs`, 42fa5f3; правка — только
// заместители, П90 п. 3) и разовые пробы пачек 1 и 2 (`proby-p1.mjs` — 734afa7, `proby-p2.mjs` — 6c127da)
// новую ветвь не судят — форма та же, отдельным инструментом в папке доклада (слова владельца П95 п. 2:
// «формой proby-p2»):
//
//   node proby-p4.mjs              — все пробы: подмена файлов, `astro build` в отдельную папку,
//                                    возврат байтов и сверка sha256; затем сверка собранных
//                                    страниц сайта по `dist/` (после `npm run build`)
//   node proby-p4.mjs G4 G11       — только названные пробы (неизвестное имя — код 2), затем сверка
//   node proby-p4.mjs --tolko-dist — только сверка `dist/`; `--dist <папка>` — другая папка сборки
//                                    (только вместе с `--tolko-dist` или `--proba`)
//   node proby-p4.mjs --proba      — проба самой сверки: порчи HTML собранных страниц (и копии
//                                    содержания или структуры) в памяти; каждая обязана дать
//                                    замечание своей причиной; контроль — неиспорченные страницы без замечаний
// Неизвестный флаг и `--dist` без `--tolko-dist`/`--proba` — код 2, пробы не запускаются («судью судят»,
// раунд 1, P4-R1-PROBY-8: опечатка во флаге молча включала полный режим с подменой файлов).
//
// СТАРТ: подменяемые файлы обязаны совпадать с индексом git (как у проб договора); временная папка
// сборки — `.astro/dist-proba-p4` (правило `.astro/` — в корневом .gitignore). Пока идут пробы,
// сборки, `tree:check`, `glowa`, другие пробы и коммиты не запускать, репозиторий не читать. Ctrl+C
// не нажимать: прерванный прогон — `git diff` и `git checkout -- <файл>`.
// ОТРИЦАТЕЛЬНАЯ проба ждёт ненулевой код и все свои строки в выводе сборки. Отрицательные пробы
// ставят галерею на стенд `/404/` (поле в `404.md`, вхождение в `blocks[]` структуры) и на `/max-payne-3/`
// (кадр галереи = кадр героя); настоящую `/quotes/` не подменяют — её судит сверка.
// СВЕРКА dist/ (положительная, по настоящим страницам маршрута, по файлам содержания). Текст обеих
// сторон нормализуется одной функцией (`norm`: любые пробельные, включая неразрывный, сворачиваются
// в пробел, края срезаются — как `tekst()` схемы):
//   свежесть — `h1` страницы = `h1` структуры;
//   галерея объявлена ⇔ в <main> ровно одна `section.gallery`; у неё `aria-labelledby="gallery-title"`;
//   `h2#gallery-title` с классами `gallery__title` и `t-headline`, текст = `title`; строка под заголовком
//   (`p.gallery__lead`) есть ⇔ `lead`, текст = `lead`;
//   место — после конца героя, подписи byline и КОНЦА последнего ряда (`section.layer`; галерея
//   внутри ряда — отказ), раньше «связанных» (`section.link-list`) и призыва (`section.cta`) —
//   порядок `PORYADOK` маршрута; строка под заголовком — раньше сетки;
//   кадры — `li` со словом `gallery__item` в классе ровно столько, сколько `items`, в порядке файла;
//   во всей секции `figure` и `img` — ровно по числу кадров; в каждом `li` ровно одна `div.foto`
//   с классом тона `kadr-galerei` и ровно одна картинка: ключ `src` и КАЖДОГО кандидата `srcset` =
//   `art`, `alt` = «<игра> — <опис>» записи кадра (`game-art.json`, формула `kadr()`); подпись —
//   ровно одна `figcaption` с ролью `t-caption`, текст = `caption`; другого текста в `li` нет;
//   класс `kadr-galerei` (словом в `class` любого элемента) в <main> — только у кадров галереи,
//   столько же, сколько кадров; галереи нет в `blocks[]` — ни `section.gallery`, ни `kadr-galerei`;
//   нота подвала — игры ноты = игры ВСЕХ кадров страницы (кадр героя, кадры рядов и кадры галереи
//   по `game-art.json`), классы строки лицензии = классы записей тех же кадров; кадров нет — ноты нет.
// ПРЕДЕЛЫ (названы): вид галереи не судится (сетка, рамка 16:10, кадровка — это кадры стопа и глаза
// владельца); что подпись кадра не выдаёт скриншот за кадр сцены реплики — текст, его судят глаза
// и сверка фактов, не этот инструмент; ряды, подпись byline, герой, «связанные» и призыв судят сверки
// пачек 1 и 2 (`proby-p1.mjs`, `proby-p2.mjs`) — их нота кадров галереи не знает, и на странице,
// где кадры есть только у галереи, они кончаются ожидаемым «кадров нет, а нота об арте есть» (П95
// «Как прочитано» п. 10); разбор HTML — регулярными выражениями по разметке, которую печатают этот
// маршрут и блоки ядра (`Gallery`, `SmartImage`): атрибут ищется по первому вхождению имени после
// пробела; `<picture><source>`, `sizes` и ширины кандидатов не судятся; теги внутри текста заголовка,
// строки под ним и подписи не судятся (на месте тега — пробел); из нот подвала берётся первая
// «Games:» — вторая нота не судится; вложенные `section` внутри рядов или героя сверка не ждёт
// (конец ряда — первый `</section>` после его начала); фронтматтер разбирается пакетом `yaml` с ключами
// слияния, как `js-yaml` загрузчика Astro; режим по умолчанию сверяет `dist/`, который сам прогон проб
// не собирает: запускать сразу после сборки последнего коммита — вывод называет HEAD и чистоту дерева
// (предел R3-MARSHRUT-3 пачки 1). Пределы, названные «судью судят» (раунд 1): P4-R1-PROBY-6.
import { readFileSync, writeFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const root = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const OUT = '.astro/dist-proba-p4';
const argi = process.argv.slice(2);
const tolkoDist = argi.includes('--tolko-dist');
const rezhimProby = argi.includes('--proba');
{
  const iD = argi.indexOf('--dist');
  const neizvFlagi = argi.filter((a, i) => a.startsWith('--') && !['--tolko-dist', '--proba', '--dist'].includes(a) && !(iD >= 0 && i === iD + 1));
  if (neizvFlagi.length) { console.error('неизвестные флаги: ' + neizvFlagi.join(' ') + ' — есть --tolko-dist, --proba, --dist <папка>'); process.exit(2); }
  if (iD >= 0 && !tolkoDist && !rezhimProby) { console.error('--dist <папка> — только с --tolko-dist или --proba: полный режим проб сверяет dist/ сайта'); process.exit(2); }
  if (iD >= 0 && (!argi[iD + 1] || argi[iD + 1].startsWith('--'))) { console.error('--dist без папки'); process.exit(2); }
}
const P = {
  stend: join(root, 'src/content/tresc/404.md'),
  mp3: join(root, 'src/content/tresc/max-payne-3.md'),
  struktura: join(root, 'structure/structure.json'),
};
const sha = (b) => createHash('sha256').update(b).digest('hex');
const git = (args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });

let plokho = 0;
if (!tolkoDist && !rezhimProby) {
  const rel = Object.values(P).map((f) => f.slice(root.length + 1));
  const d = git(['diff', '--quiet', '--', ...rel]);
  if (d.status !== 0) {
    console.error('подменяемые файлы отличаются от индекса git (или git не запустился) — сначала git add или git checkout');
    process.exit(2);
  }
  const iskhod = Object.fromEntries(Object.entries(P).map(([k, f]) => [k, readFileSync(f, 'utf8')]));
  const iskhodSha = Object.fromEntries(Object.entries(P).map(([k, f]) => [k, sha(readFileSync(f))]));
  const zamena = (t, iz, na) => {
    const n = t.split(iz).length - 1;
    if (n !== 1) throw new Error(`проба: «${iz.slice(0, 50)}» встречается ${n} раз, а нужен один`);
    return t.replace(iz, () => na);
  };
  const strukturaS = (pravki) => {
    const o = JSON.parse(iskhod.struktura);
    for (const [url, f] of Object.entries(pravki)) {
      const p = o.pages.find((x) => x.url === url);
      if (!p) throw new Error('проба: страницы ' + url + ' нет в структуре');
      f(p);
    }
    return JSON.stringify(o, null, 1) + '\n';
  };
  const bloki = (...imena) => imena.map((b) => { const [block, role] = b.split('#'); return { block, source: 'manual', confidence: 'high', ...(role ? { role } : {}) }; });
  /** Поле `gallery` для файла содержания: кадры — строки YAML списка `items`. */
  const GAL = (items, dop = '') => 'gallery:\n  title: Proba gallery\n' + dop + '  items:\n' + items.join('');
  const KADR = (art, caption = 'Proba caption') => `    - art: ${art}\n      caption: ${caption}\n`;
  const sGal = (tekst) => zamena(iskhod.stend, 'related:\n', tekst + 'related:\n');
  const S404 = (...b) => strukturaS({ '/404/': (p) => { p.blocks = bloki(...b); } });
  const S_GAL = S404('story-row', 'gallery', 'link-list');
  const PROBY = [
    { id: 'G1', imya: 'поле gallery в содержании, а блока gallery у страницы нет', fajly: { stend: sGal(GAL([KADR('mp1-k11')])) }, zhdem: ['Поле без блока', '`gallery`'] },
    { id: 'G2', imya: 'gallery объявлен, поля gallery нет', fajly: { struktura: S_GAL }, zhdem: ['blocks[] и печать разошлись', 'без содержания: gallery (нет поля gallery в содержании)'] },
    { id: 'G3', imya: 'ключ кадра галереи неизвестен — разрешатель kadr()', fajly: { stend: sGal(GAL([KADR('mp9-k99')])), struktura: S_GAL }, zhdem: ['Кадр "mp9-k99"'] },
    { id: 'G4', imya: 'ключ кадра галереи не kebab — схема', fajly: { stend: sGal(GAL([KADR('Mp1_K11')])), struktura: S_GAL }, zhdem: ['404.md data does not match collection schema', 'gallery.items.0.art: Invalid string'] },
    { id: 'G5', imya: 'подпись кадра из пробелов — tekst() схемы', fajly: { stend: sGal(GAL([KADR('mp1-k11', "'  '")])), struktura: S_GAL }, zhdem: ['404.md data does not match collection schema', 'gallery.items.0.caption: Too small'] },
    { id: 'G6', imya: 'подписи кадра нет — схема', fajly: { stend: sGal(GAL(['    - art: mp1-k11\n'])), struktura: S_GAL }, zhdem: ['404.md data does not match collection schema', 'gallery.items.0.caption'] },
    { id: 'G7', imya: 'alt в кадре галереи — лишний ключ, .strict()', fajly: { stend: sGal(GAL([KADR('mp1-k11') + '      alt: Proba alt\n'])), struktura: S_GAL }, zhdem: ['404.md data does not match collection schema', 'Unrecognized key: "alt"'] },
    { id: 'G8', imya: 'пустой список кадров — схема', fajly: { stend: sGal('gallery:\n  title: Proba gallery\n  items: []\n'), struktura: S_GAL }, zhdem: ['404.md data does not match collection schema', 'gallery.items: Too small'] },
    { id: 'G9', imya: 'лишний ключ в gallery — .strict()', fajly: { stend: sGal(GAL([KADR('mp1-k11')], '  kolumny: 3\n')), struktura: S_GAL }, zhdem: ['404.md data does not match collection schema', 'Unrecognized key: "kolumny"'] },
    { id: 'G10', imya: 'пустой заголовок галереи — tekst() схемы', fajly: { stend: sGal('gallery:\n  title: \'\'\n  items:\n' + KADR('mp1-k11')), struktura: S_GAL }, zhdem: ['404.md data does not match collection schema', 'gallery.title: Too small'] },
    { id: 'G11', imya: 'один кадр дважды в галерее — отказ маршрута', fajly: { stend: sGal(GAL([KADR('mp1-k11'), KADR('mp1-k11', 'Proba second')])), struktura: S_GAL }, zhdem: ['Кадр галереи повторяет кадр этой страницы на /404/', 'mp1-k11'] },
    { id: 'G12', imya: 'кадр галереи = кадр ряда той же страницы — отказ маршрута', fajly: { stend: zamena(sGal(GAL([KADR('mp1-k11')])), '    year: Error 404\n', '    year: Error 404\n    art: mp1-k11\n'), struktura: S_GAL }, zhdem: ['Кадр галереи повторяет кадр этой страницы на /404/', 'mp1-k11'] },
    { id: 'G13', imya: 'вхождение gallery с ролью — ROLE_UMIE', fajly: { stend: sGal(GAL([KADR('mp1-k11')])), struktura: S404('story-row', 'gallery#proba', 'link-list') }, zhdem: ['Вхождение блока с ролью', 'gallery#proba'] },
    { id: 'G14', imya: 'порядок: gallery перед story-row в blocks[]', fajly: { stend: sGal(GAL([KADR('mp1-k11')])), struktura: S404('gallery', 'story-row', 'link-list') }, zhdem: ['blocks[] и печать разошлись', 'разошёлся только порядок'] },
    { id: 'G15', imya: 'строка под заголовком из пробела — tekst() схемы', fajly: { stend: sGal(GAL([KADR('mp1-k11')], "  lead: ' '\n")), struktura: S_GAL }, zhdem: ['404.md data does not match collection schema', 'gallery.lead: Too small'] },
    // Ключа title нет вовсе — обязательность поля (G10 судит только пустую строку; P4-R1-PROBY-10).
    { id: 'G17', imya: 'ключа title у галереи нет — обязательность поля в схеме', fajly: { stend: sGal('gallery:\n  items:\n' + KADR('mp1-k11')), struktura: S_GAL }, zhdem: ['404.md data does not match collection schema', 'gallery.title'] },
    {
      id: 'G16', imya: 'кадр галереи = кадр героя той же страницы — отказ маршрута',
      fajly: {
        mp3: zamena(iskhod.mp3, 'related:\n', GAL([KADR('mp3-art')]) + 'related:\n'),
        struktura: strukturaS({ '/max-payne-3/': (p) => { const i = p.blocks.findIndex((b) => b.block === 'link-list'); p.blocks.splice(i, 0, ...bloki('gallery')); } }),
      },
      zhdem: ['Кадр галереи повторяет кадр этой страницы на /max-payne-3/', 'mp3-art'],
    },
  ];
  // Значение `--dist <папка>` — не имя пробы.
  const iDistArg = argi.indexOf('--dist');
  const imena = argi.filter((a, i) => !a.startsWith('--') && !(iDistArg >= 0 && i === iDistArg + 1));
  const neizv = imena.filter((a) => !PROBY.some((p) => p.id === a.toUpperCase()));
  if (neizv.length) { console.error('неизвестные пробы: ' + neizv.join(', ')); process.exit(2); }
  const proby = imena.length ? PROBY.filter((p) => imena.some((a) => a.toUpperCase() === p.id)) : PROBY;
  const vernut = () => {
    const osh = [];
    for (const [k, f] of Object.entries(P)) {
      try { writeFileSync(f, iskhod[k]); } catch (e) { osh.push(`${f}: ${e.message}`); }
    }
    return osh;
  };
  for (const p of proby) {
    let out = '', kod = null;
    try {
      rmSync(join(root, OUT), { recursive: true, force: true });
      for (const [k, t] of Object.entries(p.fajly)) writeFileSync(P[k], t);
      const r = spawnSync(`npm exec -- astro build --outDir ${OUT}`, { cwd: root, shell: true, encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' } });
      out = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
      kod = r.status;
    } finally {
      const osh = vernut();
      if (osh.length) { console.error('возврат файлов не удался:\n  ' + osh.join('\n  ')); process.exit(2); }
    }
    for (const [k, f] of Object.entries(P)) if (sha(readFileSync(f)) !== iskhodSha[k]) { console.error(`файл ${f} не восстановлен побайтово`); process.exit(2); }
    const net = p.zhdem.filter((s) => !out.includes(s));
    const zam = [];
    if (kod === 0) zam.push('сборка прошла, а ждали отказа');
    if (net.length) zam.push('нет в выводе: ' + net.map((s) => `«${s}»`).join(', '));
    if (zam.length) plokho += 1;
    console.log(`${zam.length ? 'ПЛОХО' : 'ok   '} ${p.id.padEnd(4)} ${p.imya.padEnd(62)} код ${kod}`);
    for (const z of zam) console.log('      ' + z);
    if (zam.length) for (const l of out.split('\n').filter((l) => /Error|Ошиб|Поле|Вхожд|Блок|blocks\[\]|Кадр|schema|gallery|Unrecognized|Too small|Invalid/.test(l)).slice(-6)) console.log('      | ' + l.slice(0, 200));
  }
  rmSync(join(root, OUT), { recursive: true, force: true });
  console.log(`пробы: ${proby.length - plokho}/${proby.length}; файлы возвращены и сверены побайтово`);
}

// — сверка собранных страниц dist/ (или `--dist <папка>`) —
const iDist = argi.indexOf('--dist');
const dist = iDist >= 0 ? argi[iDist + 1] : join(root, 'dist');
if (!existsSync(dist)) { console.error('нет папки сборки — сначала npm run build'); process.exit(2); }
const head = git(['rev-parse', '--short', 'HEAD']).stdout.trim();
const chisto = git(['status', '--porcelain', '--', 'src', 'structure']).stdout.trim() === '';
console.log(`сверка: ${dist}; HEAD ${head}, src и structure ${chisto ? 'совпадают с HEAD' : 'ИЗМЕНЕНЫ после HEAD'}`);
const { parse: yamlParse } = await import('yaml');
const struktura = JSON.parse(readFileSync(P.struktura, 'utf8'));
const kredity = JSON.parse(readFileSync(join(root, 'src/data/game-art.json'), 'utf8'));
const raskryt = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (m, k) => {
  if (k[0] === '#') return String.fromCodePoint(k[1].toLowerCase() === 'x' ? parseInt(k.slice(2), 16) : Number(k.slice(1)));
  return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }[k.toLowerCase()];
});
/** Одна нормализация для обеих сторон сверки. */
const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const tekst = (html) => norm(raskryt(html.replace(/<[^>]+>/g, ' ')));
/** Значение атрибута — по имени с границей: перед именем пробел (`data-src` за `src` не сойдёт). */
const atr = (teg, imya) => {
  const m = teg.match(new RegExp(`(?<=\\s)${imya}="([^"]*)"`));
  return m ? raskryt(m[1]) : undefined;
};
const klassy = (teg) => (atr(teg, 'class') ?? '').split(/\s+/).filter(Boolean);
/** Ключ кадра — только из пути `/_astro/<ключ>.<хеш>.<расширение>` своего сайта: чужой хост или путь
 *  с `..` дают «?». */
const klyuchAdresa = (u) => (u.match(/^\/_astro\/([a-z0-9-]+)\.[^/]+$/) || [])[1] ?? '?';
const zhdemAlt = (k) => (kredity[k] ? `${kredity[k].game} — ${kredity[k].opis ?? 'publisher material'}` : undefined);
/** Замечания о картинке кадра: ключ `src` и каждого кандидата `srcset` = ключ, `alt` — по записи. */
function sverkaKartinki(img, klyuch, gde) {
  const zam = [];
  if (!img) return [`${gde}: нет картинки`];
  const kandidaty = (atr(img, 'srcset') ?? '').split(',').map((c) => c.trim().split(/\s+/)[0]).filter(Boolean);
  if (!kandidaty.length) zam.push(`${gde}: у картинки нет srcset`);
  const chuzhie = [...new Set([atr(img, 'src') ?? '', ...kandidaty].map(klyuchAdresa).filter((k) => k !== klyuch))];
  if (chuzhie.length) zam.push(`${gde}: в src или srcset ключи ${chuzhie.join(', ')}, в содержании ${klyuch}`);
  const alt = atr(img, 'alt') ?? '';
  if (alt !== zhdemAlt(klyuch)) zam.push(`${gde}: alt «${alt.slice(0, 70)}» ≠ записи кадра ${klyuch} «${String(zhdemAlt(klyuch)).slice(0, 70)}»`);
  return zam;
}

/** Замечания сверки одной страницы: пусто — галерея и нота такие, как обещает файл содержания. */
function sverka(page, dane, html) {
  const zam = [];
  const iMain = html.search(/<main\b/);
  const iKonec = html.search(/<\/main>/);
  if (iMain < 0 || iKonec < 0) return ['нет <main>'];
  const main = html.slice(iMain, iKonec);
  const bloki = page.blocks.map((b) => b.block);
  const h1 = (main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
  if (h1 === undefined) zam.push('нет <h1> в <main>');
  else if (tekst(h1) !== norm(page.h1)) zam.push(`h1 «${tekst(h1)}» ≠ h1 структуры «${norm(page.h1)}» — сборка старая или печать разошлась`);
  const galerei = [...main.matchAll(/<section class="gallery\b/g)].length;
  // Класс тона — словом в `class` любого элемента, а не буквальным началом `<div class="foto kadr-galerei"`
  // (раунд 1, P4-R1-PROBY-2).
  const tonovVsego = [...main.matchAll(/\sclass="[^"]*(?<![\w-])kadr-galerei(?![\w-])[^"]*"/g)].length;
  const galereyaObyavlena = bloki.includes('gallery');
  if (galereyaObyavlena) {
    const g = dane.gallery;
    if (galerei !== 1) zam.push(`галерей ${galerei}, ждали 1`);
    else if (!g) zam.push('галерея объявлена, а поля gallery в содержании нет');
    else {
      const iG = main.search(/<section class="gallery\b/);
      const iGKonec = main.indexOf('</section>', iG);
      const sek = main.slice(iG, iGKonec);
      const teg = (sek.match(/^<section\b[^>]*>/) || [''])[0];
      if (atr(teg, 'aria-labelledby') !== 'gallery-title') zam.push(`aria-labelledby галереи «${atr(teg, 'aria-labelledby') ?? '—'}», ждали gallery-title`);
      // место: после КОНЦА героя, byline и КОНЦА последнего ряда, раньше «связанных» и призыва
      // (раунд 1, P4-R1-PROBY-4: сравнение с началом ряда пропускало галерею внутри ряда)
      const iByline = main.search(/<div class="byline\b/);
      const iRyady = [...main.matchAll(/<section class="layer\b/g)].map((m) => m.index);
      const iKonecRyada = iRyady.length ? main.indexOf('</section>', iRyady[iRyady.length - 1]) : -1;
      const iHero = main.search(/<section class="hero"/);
      const iKonecHero = iHero >= 0 ? main.indexOf('</section>', iHero) : -1;
      const iLinki = main.search(/<section class="link-list\b/);
      const iCta = main.search(/<section class="cta\b/);
      if (iHero >= 0 && iKonecHero > iG) zam.push('галерея не после героя');
      if (iByline >= 0 && iByline > iG) zam.push('галерея раньше подписи byline');
      if (iKonecRyada >= 0 && iKonecRyada > iG) zam.push('галерея не после рядов (ряд ниже галереи или галерея внутри ряда)');
      if (iLinki >= 0 && iLinki < iG) zam.push('галерея не перед «связанными» (link-list выше галереи)');
      if (iCta >= 0 && iCta < iG) zam.push('галерея не перед призывом (cta выше галереи)');
      // заголовок и строка под ним
      const h2 = sek.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/);
      if (!h2) zam.push('у галереи нет заголовка h2');
      else {
        const h2teg = h2[0].match(/^<h2\b[^>]*>/)[0];
        if (atr(h2teg, 'id') !== 'gallery-title') zam.push('у заголовка галереи нет id="gallery-title"');
        const k = klassy(h2teg);
        if (!k.includes('gallery__title') || !k.includes('t-headline')) zam.push(`классы заголовка галереи «${k.join(' ')}», ждали gallery__title и t-headline`);
        if (tekst(h2[1]) !== norm(g.title)) zam.push(`заголовок галереи «${tekst(h2[1])}», в содержании «${norm(g.title)}»`);
      }
      const lead = sek.match(/<p class="gallery__lead\b[^"]*"[^>]*>([\s\S]*?)<\/p>/);
      if (g.lead === undefined) { if (lead) zam.push('строка под заголовком галереи напечатана, а lead нет'); }
      else if (!lead) zam.push('строки под заголовком галереи (lead) нет');
      else if (tekst(lead[1]) !== norm(g.lead)) zam.push(`строка под заголовком галереи «${tekst(lead[1]).slice(0, 60)}», в содержании «${norm(g.lead).slice(0, 60)}»`);
      if (lead && lead.index > sek.search(/<ul\b/)) zam.push('строка под заголовком галереи стоит после сетки');
      // кадры — по месту и в порядке файла; `li` — по слову gallery__item в классе, `figure` и `img` —
      // по всей секции (раунд 1, P4-R1-PROBY-3, -5: лишний кадр вне засчитанного li проходил молча)
      const punkty = [...sek.matchAll(/<li\s[^>]*class="[^"]*(?<![\w-])gallery__item(?![\w-])[^"]*"[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
      const items = g.items ?? [];
      if (punkty.length !== items.length) zam.push(`кадров галереи ${punkty.length}, в файле содержания ${items.length}`);
      const figur = [...sek.matchAll(/<figure\b/g)].length;
      const kartinok = [...sek.matchAll(/<img\b/g)].length;
      if (figur !== items.length || kartinok !== items.length) zam.push(`в галерее figure ${figur}, img ${kartinok}, а кадров в файле содержания ${items.length}`);
      items.forEach((it, i) => {
        const li = punkty[i];
        if (li === undefined) return;
        const gde = `кадр галереи ${i + 1} (${it.art})`;
        const kartinkiLi = [...li.matchAll(/<img\b[^>]*>/g)];
        if (kartinkiLi.length !== 1) zam.push(`${gde}: картинок ${kartinkiLi.length}, ждали 1`);
        const foto = [...li.matchAll(/<div class="(foto\b[^"]*)"[^>]*>\s*(<img\b[^>]*>)/g)];
        if (foto.length !== 1) { zam.push(`${gde}: оболочек .foto с картинкой ${foto.length}, ждали 1`); return; }
        if (!foto[0][1].split(/\s+/).includes('kadr-galerei')) zam.push(`${gde}: без класса тона kadr-galerei («${foto[0][1]}»)`);
        zam.push(...sverkaKartinki(foto[0][2], it.art, gde));
        const podpisi = [...li.matchAll(/<figcaption\b([^>]*)>([\s\S]*?)<\/figcaption>/g)];
        if (podpisi.length !== 1) zam.push(`${gde}: подписей figcaption ${podpisi.length}, ждали 1`);
        else {
          if (!klassy(' ' + podpisi[0][1]).includes('t-caption')) zam.push(`${gde}: подпись без роли t-caption`);
          if (tekst(podpisi[0][2]) !== norm(it.caption)) zam.push(`${gde}: подпись «${tekst(podpisi[0][2])}», в содержании «${norm(it.caption)}»`);
        }
        const lishnee = tekst(li.replace(/<figcaption\b[\s\S]*?<\/figcaption>/g, ' '));
        if (lishnee) zam.push(`${gde}: текст в кадре вне подписи «${lishnee.slice(0, 60)}»`);
      });
      if (tonovVsego !== items.length) zam.push(`kadr-galerei в <main> ${tonovVsego} раз, кадров галереи ${items.length} — класс тона вне галереи или лишний`);
    }
  } else {
    if (galerei) zam.push(`галерея напечатана (${galerei}), а блока нет`);
    if (tonovVsego) zam.push(`kadr-galerei в <main> без галереи (${tonovVsego})`);
  }
  // нота подвала — по ВСЕМ кадрам страницы: героя, рядов и галереи
  const klyuchiKadrov = [
    ...(bloki.includes('hero-key-art') && dane.art ? [dane.art] : []),
    ...(dane.rows ?? []).map((r) => r.art).filter(Boolean),
    ...(galereyaObyavlena ? (dane.gallery?.items ?? []).map((it) => it.art) : []),
  ];
  const noty = [...html.matchAll(/<p class="ft__art-note[^"]*"[^>]*>([\s\S]*?)<\/p>/g)].map((m) => tekst(m[1]));
  const igryNoty = (noty.join(' ').match(/Games: ([^.]+)\./) || [])[1];
  const igryKadrov = [...new Set(klyuchiKadrov.map((k) => kredity[k]?.game))].sort();
  if (!klyuchiKadrov.length && noty.length) zam.push('кадров нет, а нота об арте есть');
  if (klyuchiKadrov.length) {
    if (!igryNoty) zam.push('кадры есть, а ноты об арте нет');
    else if (igryNoty.split(', ').sort().join('|') !== igryKadrov.join('|')) zam.push(`игры ноты «${igryNoty}» ≠ игры кадров «${igryKadrov.join(', ')}»`);
    const strokaKlassa = noty.find((n) => n.startsWith('License class: '));
    const klassyKadrov = [...new Set(klyuchiKadrov.map((k) => kredity[k]?.license).filter(Boolean))].sort();
    if (!strokaKlassa) zam.push('нет строки класса лицензии');
    else {
      const klassyNoty = strokaKlassa.slice('License class: '.length).replace(/\.$/, '').split('; ').sort();
      if (klassyNoty.join('|') !== klassyKadrov.join('|')) zam.push(`класс лицензии ноты «${klassyNoty.join('; ').slice(0, 60)}» ≠ классам записей кадров`);
    }
  }
  return zam;
}

const tresc = join(root, 'src/content/tresc');
const mdFajly = [];
const obkhod = (d) => { for (const x of readdirSync(d, { withFileTypes: true })) { const p = join(d, x.name); if (x.isDirectory()) obkhod(p); else if (x.name.endsWith('.md')) mdFajly.push(p); } };
obkhod(tresc);
const stranicy = [];
for (const f of mdFajly) {
  const md = readFileSync(f, 'utf8');
  const fm = md.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---/);
  const dane = fm ? yamlParse(fm[1], { merge: true }) : null;
  const page = struktura.pages.find((p) => p.url === dane?.url);
  if (!page) { console.log(`ПЛОХО dist ${f}: адрес ${dane?.url} не в структуре`); plokho += 1; continue; }
  const htmlF = join(dist, page.url.slice(1), 'index.html');
  if (!existsSync(htmlF)) { console.log(`ПЛОХО dist ${page.url}: страницы нет в сборке`); plokho += 1; continue; }
  stranicy.push({ page, dane, html: readFileSync(htmlF, 'utf8') });
}
if (!stranicy.length) { console.error('страниц маршрута не найдено'); process.exit(2); }
if (!stranicy.some((s) => s.page.blocks.some((b) => b.block === 'gallery'))) { console.error('ни одна страница сборки не объявляет gallery — сверять ветвь не на чем'); process.exit(2); }

if (rezhimProby) {
  // Порчи — по /quotes/ (галерея, кадры только у неё, без героя) и по странице без галереи с героем
  // и кадрами рядов (/max-payne-2/) и без героя (/pc/); каждая обязана дать замечание, в котором есть
  // её причина. Порча может править и копию содержания или структуры (`dane`, `page`).
  const po = (url) => stranicy.find((s) => s.page.url === url);
  const q = po('/quotes/');
  const m2 = po('/max-payne-2/');
  const pc = po('/pc/');
  if (!q || !m2 || !pc) { console.error('для пробы нужны /quotes/, /max-payne-2/ и /pc/ в сборке'); process.exit(2); }
  const klon = (o) => JSON.parse(JSON.stringify(o));
  const GALEREYA = /<section class="gallery\b[\s\S]*?<\/section>/;
  const PUNKT = (n) => new RegExp(`(?:<li class="gallery__item\\b[\\s\\S]*?<\\/li>){${n - 1}}(<li class="gallery__item\\b[\\s\\S]*?<\\/li>)`);
  const vzyat = (h, re) => (h.match(re) || [''])[0];
  const punkt = (h, n) => (h.match(PUNKT(n)) || [])[1] ?? '';
  const [k1, k2, k3] = q.dane.gallery.items.map((it) => it.art);
  const PORCHI = [
    { imya: 'контроль /quotes/', s: q, prichina: null },
    { imya: 'контроль /max-payne-2/', s: m2, prichina: null },
    { imya: 'контроль /pc/', s: pc, prichina: null },
    {
      // Настоящий U+00A0 с обеих сторон, не сущность `&nbsp;` (её `raskryt` сводит к пробелу
      // до `norm`, и контроль ничего не проверял — раунд 1, P4-R1-PROBY-1).
      imya: 'контроль: неразрывные пробелы и края', s: q, prichina: null,
      html: (h) => h.replace(/(<figcaption\b[^>]*>Max) /, '$1 ').replace(/(<h2 class="gallery__title[^>]*>The) /, '$1 '),
      dane: (d) => { d.gallery.items[0].caption = '  ' + d.gallery.items[0].caption.replace(' ', ' ') + ' \n'; d.gallery.title = d.gallery.title.replace(' ', ' ') + ' '; return d; },
    },
    { imya: 'галерея снята', s: q, html: (h) => h.replace(GALEREYA, ''), prichina: 'галерей 0' },
    { imya: 'вторая галерея', s: q, html: (h) => h.replace('</main>', vzyat(h, GALEREYA) + '</main>'), prichina: 'галерей 2' },
    { imya: 'галерея перед рядами', s: q, html: (h) => { const g = vzyat(h, GALEREYA); return h.replace(g, '').replace(/<section class="layer\b/, g + '<section class="layer'); }, prichina: 'галерея не после рядов' },
    { imya: 'галерея перед подписью byline', s: q, html: (h) => { const g = vzyat(h, GALEREYA); return h.replace(g, '').replace(/<div class="byline\b/, g + '<div class="byline'); }, prichina: 'галерея раньше подписи byline' },
    { imya: 'галерея после «связанных»', s: q, html: (h) => { const g = vzyat(h, GALEREYA); return h.replace(g, '').replace(/(<section class="link-list\b[\s\S]*?<\/section>)/, '$1' + g); }, prichina: 'галерея не перед «связанными»' },
    { imya: 'галерея после призыва', s: q, html: (h) => { const g = vzyat(h, GALEREYA); return h.replace(g, '').replace('</main>', g + '</main>'); }, prichina: 'галерея не перед призывом' },
    { imya: 'aria-labelledby на чужой id', s: q, html: (h) => h.replace('aria-labelledby="gallery-title"', 'aria-labelledby="related-title"'), prichina: 'aria-labelledby галереи «related-title»' },
    { imya: 'id заголовка другой', s: q, html: (h) => h.replace('id="gallery-title"', 'id="proba-title"'), prichina: 'нет id="gallery-title"' },
    { imya: 'заголовок без роли t-headline', s: q, html: (h) => h.replace('class="gallery__title t-headline"', 'class="gallery__title"'), prichina: 'классы заголовка галереи' },
    { imya: 'текст заголовка другой', s: q, html: (h) => h.replace(/(<h2 class="gallery__title[^>]*>)[^<]*/, '$1Proba'), prichina: 'заголовок галереи «Proba»' },
    { imya: 'строка под заголовком снята', s: q, html: (h) => h.replace(/<p class="gallery__lead\b[\s\S]*?<\/p>/, ''), prichina: 'строки под заголовком галереи (lead) нет' },
    { imya: 'строка под заголовком другая', s: q, html: (h) => h.replace(/(<p class="gallery__lead\b[^>]*>)[^<]*/, '$1Proba lead'), prichina: 'строка под заголовком галереи «Proba lead»' },
    { imya: 'строка под заголовком без lead', s: q, dane: (d) => { delete d.gallery.lead; return d; }, prichina: 'напечатана, а lead нет' },
    { imya: 'кадр снят', s: q, html: (h) => h.replace(punkt(h, 2), ''), prichina: 'кадров галереи 2, в файле содержания 3' },
    { imya: 'кадры переставлены', s: q, html: (h) => { const a = punkt(h, 1); const b = punkt(h, 2); return h.replace(a, '\u0000').replace(b, a).replace('\u0000', b); }, prichina: `кадр галереи 1 (${k1}): в src или srcset ключи ${k2}` },
    { imya: 'src кадра другой', s: q, html: (h) => h.replace(new RegExp(`(<div class="foto kadr-galerei"[^>]*>\\s*<img\\b[^>]*?\\ssrc="/_astro/)${k2}`), '$1mp2-k00'), prichina: `кадр галереи 2 (${k2}): в src или srcset ключи mp2-k00` },
    { imya: 'srcset кадра другой', s: q, html: (h) => h.replace(new RegExp(`(<img\\b[^>]*?\\ssrcset="[^"]*?/_astro/)${k3}`), '$1mp3-k13'), prichina: `кадр галереи 3 (${k3}): в src или srcset ключи mp3-k13` },
    { imya: 'кадр с чужого хоста', s: q, html: (h) => h.replace(new RegExp(`(<div class="foto kadr-galerei"[^>]*>\\s*<img\\b[^>]*?\\ssrc=")/_astro/(${k1})`), '$1https://evil.example/_astro/$2'), prichina: `кадр галереи 1 (${k1}): в src или srcset ключи ?` },
    { imya: 'alt от другого кадра', s: q, html: (h) => h.replace(new RegExp(`(<img\\b[^>]*?\\ssrc="/_astro/${k1}[^"]*"[^>]*?\\salt=")[^"]*`), '$1' + zhdemAlt('mp1-k12')), prichina: `кадр галереи 1 (${k1}): alt` },
    { imya: 'картинка кадра снята', s: q, html: (h) => h.replace(/(<div class="foto kadr-galerei"[^>]*>)\s*<img\b[^>]*>/, '$1'), prichina: 'оболочек .foto с картинкой 0' },
    { imya: 'класс тона снят', s: q, html: (h) => h.replace('<div class="foto kadr-galerei">', '<div class="foto">'), prichina: 'без класса тона kadr-galerei' },
    { imya: 'класс тона на чужом элементе', s: q, html: (h) => h.replace('</main>', '<div class="foto kadr-galerei"></div></main>'), prichina: 'kadr-galerei в <main> 4 раз' },
    { imya: 'подпись кадра другая', s: q, html: (h) => { const li = punkt(h, 2); return h.replace(li, li.replace(/(<figcaption\b[^>]*>)[^<]*/, '$1Proba')); }, prichina: `кадр галереи 2 (${k2}): подпись «Proba»` },
    { imya: 'подпись кадра снята', s: q, html: (h) => { const li = punkt(h, 3); return h.replace(li, li.replace(/<figcaption\b[\s\S]*?<\/figcaption>/, '')); }, prichina: `кадр галереи 3 (${k3}): подписей figcaption 0` },
    { imya: 'подпись без роли t-caption', s: q, html: (h) => h.replace('class="gallery__caption t-caption"', 'class="gallery__caption t-micro"'), prichina: 'подпись без роли t-caption' },
    { imya: 'галерея без блока', s: pc, html: (h) => h.replace('</main>', vzyat(q.html, GALEREYA) + '</main>'), prichina: 'галерея напечатана (1), а блока нет' },
    { imya: 'класс тона без галереи', s: m2, html: (h) => h.replace('</main>', '<div class="foto kadr-galerei"></div></main>'), prichina: 'kadr-galerei в <main> без галереи' },
    { imya: 'игра ноты снята', s: q, html: (h) => h.replace(/(Games: [^<]*?), Max Payne 3/, '$1'), prichina: 'игры ноты' },
    { imya: 'нота об арте снята', s: q, html: (h) => h.replace(/<p class="ft__art-note[^"]*"[^>]*>[\s\S]*?<\/p>/g, ''), prichina: 'ноты об арте нет' },
    { imya: 'класс лицензии подменён', s: q, html: (h) => h.replace(/(License class: )[^<]*/, '$1CC BY-SA 4.0.'), prichina: 'класс лицензии ноты' },
    { imya: 'кадр галереи вне ноты (копия содержания)', s: q, dane: (d) => { d.gallery.items[2].art = 'mp2-k00'; return d; }, prichina: 'игры ноты' },
    { imya: 'h1 структуры другой (старая сборка)', s: q, page: (p) => { p.h1 += ' proba'; return p; }, prichina: 'h1 структуры' },
    { imya: 'галерея снята из blocks[] копии структуры', s: q, page: (p) => { p.blocks = p.blocks.filter((b) => b.block !== 'gallery'); return p; }, prichina: 'галерея напечатана (1), а блока нет' },
    // Порчи раунда 1 (P4-R1-PROBY-3, -4, -5, -7): у каждой ветви сверки — своя причина.
    { imya: 'поля gallery нет (копия содержания)', s: q, dane: (d) => { delete d.gallery; return d; }, prichina: 'поля gallery в содержании нет' },
    { imya: 'заголовок h2 галереи снят', s: q, html: (h) => h.replace(/<h2 class="gallery__title[\s\S]*?<\/h2>/, ''), prichina: 'нет заголовка h2' },
    { imya: 'srcset кадра снят', s: q, html: (h) => h.replace(/(<div class="foto kadr-galerei"[^>]*>\s*<img\b[^>]*?)\ssrcset="[^"]*"/, '$1'), prichina: 'у картинки нет srcset' },
    { imya: 'строка класса лицензии снята', s: q, html: (h) => h.replace(/<p class="ft__art-note[^"]*"[^>]*>\s*License class:[\s\S]*?<\/p>/, ''), prichina: 'нет строки класса' },
    { imya: 'нота без кадров', s: pc, html: (h) => h.replace('</body>', '<p class="ft__art-note t-caption">Games: Max Payne.</p></body>'), prichina: 'кадров нет, а нота' },
    { imya: 'h1 снят', s: q, html: (h) => h.replace(/<h1\b[\s\S]*?<\/h1>/, ''), prichina: 'нет <h1> в <main>' },
    { imya: 'галерея внутри последнего ряда', s: q, html: (h) => { const g = vzyat(h, GALEREYA); const bez = h.replace(g, ''); const i = bez.lastIndexOf('<section class="layer'); const j = bez.indexOf('</section>', i); return bez.slice(0, j) + g + bez.slice(j); }, prichina: 'галерея внутри ряда' },
    {
      imya: 'галерея выше героя (копия с галереей)', s: m2,
      html: (h) => h.replace(/(<main\b[^>]*>)/, '$1' + vzyat(q.html, GALEREYA)),
      dane: (d) => { d.gallery = klon(q.dane.gallery); return d; },
      page: (p) => { p.blocks = [...p.blocks, { block: 'gallery' }]; return p; },
      prichina: 'галерея не после героя',
    },
    { imya: 'вторая картинка в кадре', s: q, html: (h) => h.replace(/(<div class="foto kadr-galerei"[^>]*>\s*<img\b[^>]*>)/, '$1<img src="/_astro/mp1-k12.x.webp" alt="">'), prichina: 'картинок 2' },
    { imya: 'лишняя figure в сетке вне li', s: q, html: (h) => { const g = vzyat(h, GALEREYA); return h.replace(g, g.replace('</ul>', '<figure><img src="/_astro/mp1-k12.x.webp" alt=""></figure></ul>')); }, prichina: 'в галерее figure 4, img 4' },
    { imya: 'лишний li с двумя классами', s: q, html: (h) => { const g = vzyat(h, GALEREYA); return h.replace(g, g.replace('</ul>', '<li class="proba gallery__item"><figure><div class="foto"><img src="/_astro/mp1-k12.x.webp" alt=""></div></figure></li></ul>')); }, prichina: 'кадров галереи 4' },
    { imya: 'текст сцены в кадре вне подписи', s: q, html: (h) => h.replace(/(<figure class="gallery__figure"[^>]*>)/, '$1<p>From Chapter 3</p>'), prichina: 'текст в кадре вне подписи «From Chapter 3»' },
    { imya: 'строка под заголовком после сетки', s: q, html: (h) => { const l = vzyat(h, /<p class="gallery__lead\b[\s\S]*?<\/p>/); const g = vzyat(h, GALEREYA); return h.replace(g, g.replace(l, '').replace('</ul>', '</ul>' + l)); }, prichina: 'стоит после сетки' },
    { imya: 'класс тона вторым словом на чужом элементе', s: q, html: (h) => h.replace('</main>', '<span class="x kadr-galerei"></span></main>'), prichina: 'kadr-galerei в <main> 4 раз' },
  ];
  let plokhoProb = 0;
  for (const x of PORCHI) {
    const h = x.html ? x.html(x.s.html) : x.s.html;
    const dane = x.dane ? x.dane(klon(x.s.dane)) : x.s.dane;
    const page = x.page ? x.page(klon(x.s.page)) : x.s.page;
    const z = sverka(page, dane, h);
    const primenilas = !x.html || h !== x.s.html;
    const ok = primenilas && (x.prichina === null ? z.length === 0 : z.some((y) => y.includes(x.prichina)));
    if (!ok) plokhoProb += 1;
    const itog = !primenilas ? 'порча не применилась' : x.prichina === null ? 'замечаний ' + z.length + (z.length ? ': ' + z.join(' | ').slice(0, 150) : '') : z.join(' | ').slice(0, 150);
    console.log(`${ok ? 'ok   ' : 'ПЛОХО'} ${x.imya.padEnd(44)} ${itog}`);
  }
  console.log(`проба сверки: ${PORCHI.length - plokhoProb}/${PORCHI.length}`);
  // «ПЛОХО dist …» при загрузке страниц тоже роняет код (раунд 1, P4-R1-PROBY-9).
  process.exit(plokhoProb || plokho ? 1 : 0);
}

for (const s of stranicy) {
  const z = sverka(s.page, s.dane, s.html);
  if (z.length) plokho += 1;
  const bloki = s.page.blocks.map((b) => b.block);
  console.log(`${z.length ? 'ПЛОХО' : 'ok   '} dist ${s.page.url.padEnd(24)} галерея ${bloki.includes('gallery') ? 'есть, кадров ' + (s.dane.gallery?.items ?? []).length : 'нет'}`);
  for (const x of z) console.log('      ' + x);
}
console.log(plokho ? `ПЛОХО: ${plokho}` : 'итог: всё как ждали');
process.exit(plokho ? 1 : 0);
