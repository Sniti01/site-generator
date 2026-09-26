// Разовые пробы новых ветвей маршрута пачки 2 (сессия 15, П91) — ветви `hero-key-art` (с кадром,
// кадровкой и подписью кадра) и `byline`. Замороженные пробы договора
// (`sites/7thserpent.com/tools/proby-tresci.mjs`, 42fa5f3; правка — только заместители, П90 п. 3)
// и разовые пробы пачки 1 (`docs/reports/2026-09-25-7thserpent-pachka-1/instrumenty/proby-p1.mjs`,
// 734afa7) новых ветвей не судят — форма та же, отдельным инструментом в папке доклада
// (прецедент — «Дополнение к П89» п. 5):
//
//   node proby-p2.mjs              — все пробы: подмена файлов, `astro build` в отдельную папку,
//                                    возврат байтов и сверка sha256; затем сверка собранных
//                                    страниц сайта по `dist/` (после `npm run build`)
//   node proby-p2.mjs R4 R10       — только названные пробы (неизвестное имя — код 2), затем сверка
//   node proby-p2.mjs --tolko-dist — только сверка `dist/` (или `--dist <папка>`)
//   node proby-p2.mjs --proba      — проба самой сверки: порчи HTML собранных страниц (и копии
//                                    содержания) в памяти, каждая обязана дать замечание своей
//                                    причиной; контроль — неиспорченные страницы без замечаний
//
// СТАРТ: подменяемые файлы обязаны совпадать с индексом git (как у проб договора); временная папка
// сборки — `.astro/dist-proba-p2` (правило `.astro/` — в корневом .gitignore). Пока идут пробы,
// сборки, `tree:check`, `glowa`, другие пробы и коммиты не запускать. Ctrl+C не нажимать:
// прерванный прогон — `git diff` и `git checkout -- <файл>`.
// ОТРИЦАТЕЛЬНАЯ проба ждёт ненулевой код и все свои строки в выводе сборки.
// СВЕРКА dist/ (положительная, по настоящим страницам маршрута, по файлам содержания). Текст
// обеих сторон нормализуется одной функцией (`norm`: любые пробельные, включая неразрывный,
// сворачиваются в пробел, края срезаются — как `tekst()` схемы):
//   герой объявлен ⇔ в <main> ровно один `section.hero`, и он — первый блок <main> (раньше
//   первого `section`); у секции `aria-labelledby="page-title"`; `h1#page-title` с классами
//   `hero__title` и `t-headline` — в колонке текста героя (`.hero__text`, перед лидом),
//   `.page-head` нет; героя нет — `h1` в `header.page-head`, подписи кадра героя нет;
//   обёртка `div.geroy` открывается вплотную перед героем и закрывается вплотную после него
//   (на ней держатся скрим, тон и кадровка маршрута);
//   кадр героя — ключ `src` и КАЖДОГО кандидата `srcset` = `art`; `alt` = «<игра> — <опис>»
//   записи кадра в `game-art.json` (полное равенство, формула `kadr()`);
//   тон — `div.geroy` несёт `geroy--stal` ⇔ вид записи кадра не «key art»; кадровка —
//   `style="--fokus: …"` ⇔ `artFocus` (значение то же);
//   подпись кадра — ровно одна `p.podpis-geroya.t-caption` в <main>, последним элементом секции
//   героя (место `dopisek` ядра, над скримом) ⇔ `artCaption`, текст тот же; `.foto__credit` в рамке
//   арта героя нет; у `/remake/` подпись обязана быть (П91 п. 4: кадр оригинала);
//   кнопки — `btn-primary` и `btn-secondary` героя: адрес и надпись = `primary`/`secondary`;
//   иконка главной кнопки — стрелка вниз при якоре, вправо при адресе (пути `src/data/icons.ts`);
//   лид — текст `.hero__lead` = `lead`;
//   подпись byline объявлена ⇔ ровно один `div.byline` в <main>, после героя и раньше первого
//   ряда; `time[datetime]` = `date`, текст автора, даты и приписки = файлу содержания;
//   ряды — по месту («судью судят», раунд 2, P2-R2-SVERKA-1, -4): `section.layer` в <main> ровно
//   столько, сколько рядов в файле, и в порядке печати маршрута (вхождения `story-row` по
//   `blocks[]`, в каждом — ряды его роли в порядке файла); у каждого — `id`, надзаголовок
//   (`.t-label`) = `year`, `h2` = `title`, `.layer__meta` = `meta`, абзацы `.layer__body` — по
//   порядку и полным равенством = `body`, классы `band` ⇔ `band`, `layer--flip` ⇔ `flip`,
//   `layer--bez-kadru` ⇔ нет `art`; кадр ряда — ключ `src` и каждого кандидата `srcset` = `art`,
//   `alt` — по записи кадра;
//   нота подвала — игры ноты = игры кадров страницы (кадр героя и кадры рядов по `game-art.json`),
//   классы строки лицензии = классы записей тех же кадров; кадров нет — ноты нет;
//   свежесть — `h1` страницы = `h1` структуры, лид героя, подписи и ряды — полным равенством
//   (выше): удалённый, сокращённый или переставленный ряд старой сборки — отказ.
// ПРЕДЕЛЫ (названы): вид героя и подписи не судится (это кадры стопа и глаза владельца); контраст
// судит замер пикселей (`kontrast-geroy-snyatie.js`); растяжение арта и `sizes` не судятся
// (`rastyazhenie.js` — числом в докладе); `related` и призыв (`cta`) свежестью не судятся (их судит
// сверка пачки 1, `proby-p1.mjs`, — на `/remake/` она кончается ожидаемым ПЛОХО по ноте: кадра ряда
// там нет, а кадр героя ей неизвестен, П91 «Как прочитано» п. 9); разбор HTML — регулярными
// выражениями по разметке, которую печатают этот маршрут и блоки ядра (`HeroKeyArt`, `Byline`,
// `SmartImage`, `StoryRow`): атрибут ищется по первому вхождению имени после пробела; дубли
// элементов (вторая `img` или `svg`, третья кнопка, вторая нота, `<picture><source>`) и теги
// внутри текста (на месте тега `tekst()` ставит пробел) не судятся (раунд 2, P2-R2-SVERKA-5);
// фронтматтер разбирается пакетом `yaml` с ключами слияния, как `js-yaml` загрузчика Astro
// (раунд 2, P2-R2-SVERKA-6); режим по умолчанию сверяет `dist/`, который сам прогон проб
// не собирает: запускать сразу после сборки последнего коммита — вывод называет HEAD и чистоту
// дерева (предел R3-MARSHRUT-3 пачки 1).
import { readFileSync, writeFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const root = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const OUT = '.astro/dist-proba-p2';
const argi = process.argv.slice(2);
const tolkoDist = argi.includes('--tolko-dist');
const rezhimProby = argi.includes('--proba');
const P = {
  stend: join(root, 'src/content/tresc/404.md'),
  mp3: join(root, 'src/content/tresc/max-payne-3.md'),
  mp2: join(root, 'src/content/tresc/max-payne-2.md'),
  remake: join(root, 'src/content/tresc/remake.md'),
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
  const strukturaS = (url, f) => {
    const o = JSON.parse(iskhod.struktura);
    const p = o.pages.find((x) => x.url === url);
    if (!p) throw new Error('проба: страницы ' + url + ' нет в структуре');
    f(p);
    return JSON.stringify(o, null, 1) + '\n';
  };
  const bloki = (...imena) => imena.map((b) => { const [block, role] = b.split('#'); return { block, source: 'manual', confidence: 'high', ...(role ? { role } : {}) }; });
  const PRIMARY = '  href: "#where-to-play"\n  label: Where to play it today\nsecondary:';
  const SECONDARY = '  href: /max-payne-3/guide/\n  label: The walkthrough\n';
  const BYLINE = "  date: '2026-09-26'\n  dateLabel: September 26, 2026\n";
  const PROBY = [
    { id: 'R1', imya: 'поле героя lead в содержании, а hero-key-art у страницы нет', fajly: { stend: zamena(iskhod.stend, 'related:\n', 'lead: Proba lead.\nrelated:\n') }, zhdem: ['Поле без блока', '`lead`', '`hero-key-art`'] },
    { id: 'R2', imya: 'hero-key-art объявлен, в содержании нет art', fajly: { mp3: zamena(iskhod.mp3, 'art: mp3-art\n', '') }, zhdem: ['Блок hero-key-art объявлен на /max-payne-3/', 'нет: `art`.'] },
    { id: 'R3', imya: 'hero-key-art объявлен, полей героя нет вовсе', fajly: { struktura: strukturaS('/404/', (p) => { p.blocks = bloki('hero-key-art', 'story-row', 'link-list'); }) }, zhdem: ['Блок hero-key-art объявлен на /404/', 'нет: `lead`, `primary`, `secondary`, `art`.'] },
    { id: 'R4', imya: 'ключ арта героя неизвестен — разрешатель kadr()', fajly: { mp3: zamena(iskhod.mp3, 'art: mp3-art\n', 'art: mp9-art\n') }, zhdem: ['Кадр "mp9-art"'] },
    { id: 'R5', imya: 'ключ арта героя не kebab — схема', fajly: { mp3: zamena(iskhod.mp3, 'art: mp3-art\n', 'art: Mp3_Art\n') }, zhdem: ['max-payne-3.md data does not match collection schema', 'art: Invalid string'] },
    { id: 'R6', imya: 'кнопка героя «//host/» — схема', fajly: { mp3: zamena(iskhod.mp3, PRIMARY, '  href: //evil.example/x\n  label: Where to play it today\nsecondary:') }, zhdem: ['max-payne-3.md data does not match collection schema', 'primary.href'] },
    { id: 'R7', imya: 'кнопка героя «/\\host/» — схема', fajly: { mp3: zamena(iskhod.mp3, PRIMARY, '  href: /\\evil.example/\n  label: Where to play it today\nsecondary:') }, zhdem: ['max-payne-3.md data does not match collection schema', 'primary.href'] },
    { id: 'R8', imya: 'кнопка героя на внешний https — схема', fajly: { mp3: zamena(iskhod.mp3, PRIMARY, '  href: https://evil.example/\n  label: Where to play it today\nsecondary:') }, zhdem: ['max-payne-3.md data does not match collection schema', 'primary.href'] },
    { id: 'R9', imya: 'кнопка героя — якорь не kebab — схема', fajly: { mp3: zamena(iskhod.mp3, PRIMARY, '  href: "#Where-To-Play"\n  label: Where to play it today\nsecondary:') }, zhdem: ['max-payne-3.md data does not match collection schema', 'primary.href'] },
    { id: 'R10', imya: 'кнопка героя — якорь на раздел, которого нет — сторож anchors', fajly: { mp3: zamena(iskhod.mp3, PRIMARY, '  href: "#no-such-row"\n  label: Where to play it today\nsecondary:') }, zhdem: ['Kotwice bez celu', '/max-payne-3/', 'no-such-row'] },
    { id: 'R11', imya: 'поле byline в содержании, а блока byline у страницы нет', fajly: { mp3: zamena(iskhod.mp3, 'rows:\n', "byline:\n  author: Proba\n  date: '2026-09-26'\n  dateLabel: September 26, 2026\nrows:\n") }, zhdem: ['Поле без блока', '`byline`'] },
    { id: 'R12', imya: 'byline объявлен, поля byline нет', fajly: { mp2: zamena(iskhod.mp2, "byline:\n  role: Written by\n  author: 7th Serpent\n" + BYLINE, '') }, zhdem: ['blocks[] и печать разошлись', 'без содержания: byline (нет поля byline в содержании)'] },
    { id: 'R13', imya: 'дата подписи не календарная — схема', fajly: { mp2: zamena(iskhod.mp2, "  date: '2026-09-26'\n", "  date: '2026-02-31'\n") }, zhdem: ['max-payne-2.md data does not match collection schema', 'byline.date', 'не календарная дата'] },
    { id: 'R14', imya: 'лишний ключ в byline — .strict()', fajly: { mp2: zamena(iskhod.mp2, '  author: 7th Serpent\n', '  author: 7th Serpent\n  lishnee: Proba\n') }, zhdem: ['max-payne-2.md data does not match collection schema', 'Unrecognized key: "lishnee"'] },
    { id: 'R15', imya: 'пустой автор подписи — tekst() схемы', fajly: { mp2: zamena(iskhod.mp2, '  author: 7th Serpent\n', "  author: '  '\n") }, zhdem: ['max-payne-2.md data does not match collection schema', 'byline.author: Too small'] },
    { id: 'R16', imya: 'вхождение hero-key-art с ролью — ROLE_UMIE', fajly: { struktura: strukturaS('/max-payne-3/', (p) => { p.blocks = bloki('hero-key-art#proba', 'story-row', 'link-list', 'cta-band'); }) }, zhdem: ['Вхождение блока с ролью', 'hero-key-art#proba'] },
    { id: 'R17', imya: 'порядок: byline перед hero-key-art в blocks[]', fajly: { struktura: strukturaS('/max-payne-2/', (p) => { p.blocks = bloki('byline', 'hero-key-art', 'story-row', 'link-list', 'cta-band'); }) }, zhdem: ['blocks[] и печать разошлись', 'разошёлся только порядок'] },
    { id: 'R18', imya: 'artCaption на странице без героя — поле без блока', fajly: { stend: zamena(iskhod.stend, 'related:\n', 'artCaption: Proba\nrelated:\n') }, zhdem: ['Поле без блока', '`artCaption`', '`hero-key-art`'] },
    { id: 'R19', imya: 'artFocus вне 0–100 % — схема', fajly: { mp3: zamena(iskhod.mp3, 'artFocus: 60% 50%\n', 'artFocus: 120% 50%\n') }, zhdem: ['max-payne-3.md data does not match collection schema', 'artFocus: Invalid string'] },
    { id: 'R20', imya: 'контурная кнопка «//host/» — схема', fajly: { mp3: zamena(iskhod.mp3, SECONDARY, '  href: //evil.example/x\n  label: The walkthrough\n') }, zhdem: ['max-payne-3.md data does not match collection schema', 'secondary.href'] },
    { id: 'R21', imya: 'кнопка героя — якорь на другой странице — схема', fajly: { mp3: zamena(iskhod.mp3, PRIMARY, '  href: /max-payne-1/#where-to-play\n  label: Where to play it today\nsecondary:') }, zhdem: ['max-payne-3.md data does not match collection schema', 'primary.href'] },
    { id: 'R22', imya: 'дата словами — не та же дата — схема', fajly: { mp2: zamena(iskhod.mp2, BYLINE, "  date: '2026-09-26'\n  dateLabel: September 25, 2026\n") }, zhdem: ['max-payne-2.md data does not match collection schema', 'byline.dateLabel', 'не та же дата словами'] },
    { id: 'R23', imya: 'дата подписи позже дня сборки — схема', fajly: { mp2: zamena(iskhod.mp2, BYLINE, "  date: '2099-01-01'\n  dateLabel: January 1, 2099\n") }, zhdem: ['max-payne-2.md data does not match collection schema', 'byline.date', 'дата подписи 2099-01-01 позже дня сборки'] },
    { id: 'R24', imya: 'дата подписи раньше 2000 года — схема', fajly: { mp2: zamena(iskhod.mp2, BYLINE, "  date: '1999-12-31'\n  dateLabel: December 31, 1999\n") }, zhdem: ['max-payne-2.md data does not match collection schema', 'byline.date', 'дата подписи раньше 2000 года'] },
  ];
  // Значение `--dist <папка>` — не имя пробы (раунд 2, P2-R2-SVERKA-8).
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
    console.log(`${zam.length ? 'ПЛОХО' : 'ok   '} ${p.id.padEnd(3)} ${p.imya.padEnd(62)} код ${kod}`);
    for (const z of zam) console.log('      ' + z);
    if (zam.length) for (const l of out.split('\n').filter((l) => /Error|Ошиб|Поле|Вхожд|Блок|blocks\[\]|Кадр|schema|href|art|byline|дата|Kotwice|kotwica/.test(l)).slice(-6)) console.log('      | ' + l.slice(0, 200));
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
const ikonyTs = readFileSync(join(root, 'src/data/icons.ts'), 'utf8');
const ikona = (imya) => {
  const m = ikonyTs.match(new RegExp(`'${imya}':\\s*'([^']*)'`));
  if (!m) { console.error(`нет иконки ${imya} в src/data/icons.ts`); process.exit(2); }
  return m[1];
};
const IKONY = { 'arrow-down': ikona('arrow-down'), 'arrow-right': ikona('arrow-right') };
/** Страницы, чей кадр героя — чужой игры и обязан нести подпись (П91 п. 4). */
const OBYAZATELNA_PODPIS = new Set(['/remake/']);
const raskryt = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (m, k) => {
  if (k[0] === '#') return String.fromCodePoint(k[1].toLowerCase() === 'x' ? parseInt(k.slice(2), 16) : Number(k.slice(1)));
  return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }[k.toLowerCase()];
});
/** Одна нормализация для обеих сторон сверки (раунд 1, P1). */
const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const tekst = (html) => norm(raskryt(html.replace(/<[^>]+>/g, ' ')));
/** Значение атрибута — по имени с границей: перед именем пробел, так что `data-style`
 *  или `data-src` за `style` и `src` не сойдут (раунд 2, P2-R2-SVERKA-5). */
const atr = (teg, imya) => {
  const m = teg.match(new RegExp(`(?<=\\s)${imya}="([^"]*)"`));
  return m ? raskryt(m[1]) : undefined;
};
/** Ключ кадра — только из пути `/_astro/<ключ>.<хеш>.<расширение>` своего сайта: чужой хост
 *  или путь с `..` дают «?» (раунд 2, P2-R2-SVERKA-5). */
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

/** Замечания сверки одной страницы: пусто — страница такова, как обещает её файл содержания. */
function sverka(page, dane, html) {
  const zam = [];
  const iMain = html.search(/<main\b/);
  const iKonec = html.search(/<\/main>/);
  if (iMain < 0 || iKonec < 0) return ['нет <main>'];
  const main = html.slice(iMain, iKonec);
  const bloki = page.blocks.map((b) => b.block);
  // свежесть: h1 структуры (лид, подписи и ряды — полным равенством ниже)
  const h1 = (main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
  if (h1 === undefined) zam.push('нет <h1> в <main>');
  else if (tekst(h1) !== norm(page.h1)) zam.push(`h1 «${tekst(h1)}» ≠ h1 структуры «${norm(page.h1)}» — сборка старая или печать разошлась`);
  // герой
  const geroiev = [...main.matchAll(/<section class="hero"/g)].length;
  const heroObyavlen = bloki.includes('hero-key-art');
  const iHero = main.search(/<section class="hero"/);
  const iPervayaSekciya = main.search(/<section\b/);
  const iKonecHero = iHero >= 0 ? main.indexOf('</section>', iHero) : -1;
  const podpisiVsego = [...main.matchAll(/<p class="podpis-geroya\b/g)].length;
  if (heroObyavlen) {
    if (geroiev !== 1) zam.push(`героев ${geroiev}, ждали 1`);
    else {
      if (iHero !== iPervayaSekciya) zam.push('герой не первый блок <main>');
      const hero = main.slice(iHero, iKonecHero);
      const sekciya = (hero.match(/^<section\b[^>]*>/) || [''])[0];
      const aria = atr(sekciya, 'aria-labelledby');
      if (aria !== 'page-title') zam.push(`aria-labelledby героя «${aria ?? '—'}», ждали page-title — id h1 героя`);
      // обёртка — вплотную вокруг героя
      const obertka = main.slice(0, iHero).match(/<div class="(geroy(?: [^"]*)?)"[^>]*>\s*$/);
      if (!obertka) zam.push('нет обёртки div.geroy вплотную перед героем — скрим, тон и кадровка маршрута героя не достанут');
      else if (!/^\s*<\/div>/.test(main.slice(iKonecHero + '</section>'.length))) zam.push('обёртка div.geroy не закрывается вплотную после героя');
      // h1 — в колонке текста, перед лидом
      const h1Tag = (hero.match(/<h1\b[^>]*>/) || [''])[0];
      if (!h1Tag) zam.push('h1 не внутри героя');
      else {
        const iTekst = hero.indexOf('<div class="hero__text"');
        const iH1 = hero.search(/<h1\b/);
        const iLid = hero.search(/<p class="hero__lead/);
        if (!(iTekst >= 0 && iTekst < iH1 && (iLid < 0 || iH1 < iLid))) zam.push('h1 героя не в колонке текста (.hero__text, перед лидом)');
        const klass = (atr(h1Tag, 'class') ?? '').split(/\s+/);
        if (!klass.includes('hero__title') || !klass.includes('t-headline')) zam.push(`классы h1 героя «${klass.join(' ')}», ждали hero__title и t-headline`);
        if (atr(h1Tag, 'id') !== 'page-title') zam.push('у h1 героя нет id="page-title"');
      }
      if (/class="page-head/.test(main)) zam.push('при герое напечатана .page-head');
      // кадр: src и каждый кандидат srcset, alt — по записи кадра
      const art = (hero.match(/<div class="hero__art"[^>]*>([\s\S]*?)<div class="hero__scrim"/) || [])[1] ?? '';
      zam.push(...sverkaKartinki((art.match(/<img\b[^>]*>/) || [])[0], dane.art, 'кадр героя'));
      if (/class="foto__credit/.test(art)) zam.push('подпись в рамке арта героя (.foto__credit) — под скримом');
      // тон и кадровка — по обёртке
      if (obertka) {
        const stal = obertka[1].split(/\s+/).includes('geroy--stal');
        const kluchevoy = /^key art\b/.test(kredity[dane.art]?.kind ?? '');
        if (stal === kluchevoy) zam.push(`тон кадра: geroy--stal ${stal ? 'есть' : 'нет'}, а вид записи — ${kredity[dane.art]?.kind}`);
        const fokus = (atr(obertka[0], 'style') ?? '').match(/--fokus:\s*([^;"]+)/)?.[1]?.trim();
        if ((fokus ?? null) !== (dane.artFocus ?? null)) zam.push(`кадровка ${fokus ?? '—'}, в содержании ${dane.artFocus ?? '—'}`);
      }
      // подпись кадра — место dopisek: последний элемент секции героя; одна на всю <main>;
      // текст — без перехода через границу абзаца (раунд 2, P2-R2-SVERKA-5)
      const vKonce = hero.match(/<p class="(podpis-geroya\b[^"]*)"[^>]*>([^<]*(?:<(?!\/?p\b)[^<]*)*)<\/p>\s*$/);
      if (dane.artCaption) {
        if (podpisiVsego !== 1 || !vKonce) zam.push(`подпись кадра: в <main> ${podpisiVsego} шт., последним элементом героя (место dopisek) — ${vKonce ? 'да' : 'нет'}; ждали одну, последней`);
        else {
          if (!vKonce[1].split(/\s+/).includes('t-caption')) zam.push(`подпись кадра без роли t-caption («${vKonce[1]}»)`);
          if (tekst(vKonce[2]) !== norm(dane.artCaption)) zam.push(`текст подписи кадра «${tekst(vKonce[2])}», в содержании «${norm(dane.artCaption)}»`);
        }
      } else if (podpisiVsego) zam.push('подпись кадра напечатана, а в содержании её нет');
      if (OBYAZATELNA_PODPIS.has(page.url) && !dane.artCaption) zam.push(`подпись «оригинал» обязательна у героя ${page.url} (П91 п. 4), а artCaption нет`);
      // кнопки и иконка главной
      for (const [klassKnopki, pole] of [['btn-primary', 'primary'], ['btn-secondary', 'secondary']]) {
        const a = hero.match(new RegExp(`<a class="btn ${klassKnopki}\\b[^"]*"[^>]*>([\\s\\S]*?)</a>`));
        if (!a) { zam.push(`нет кнопки ${klassKnopki}`); continue; }
        const href = atr(a[0].match(/^<a\b[^>]*>/)[0], 'href') ?? '';
        if (href !== dane[pole]?.href) zam.push(`${pole}: адрес ${href}, в содержании ${dane[pole]?.href}`);
        if (tekst(a[1]) !== norm(dane[pole]?.label)) zam.push(`${pole}: надпись «${tekst(a[1])}», в содержании «${norm(dane[pole]?.label)}»`);
        if (pole === 'primary') {
          const imya = String(dane.primary?.href).startsWith('#') ? 'arrow-down' : 'arrow-right';
          const svg = (a[1].match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/) || [])[1];
          if (svg !== IKONY[imya]) zam.push(`иконка главной кнопки — не ${imya} (адрес ${dane.primary?.href})`);
        }
      }
      const lead = hero.match(/<p class="hero__lead[^"]*"[^>]*>([\s\S]*?)<\/p>/);
      if (!lead || tekst(lead[1]) !== norm(dane.lead)) zam.push('лид героя разошёлся с файлом содержания');
    }
  } else {
    if (geroiev !== 0) zam.push(`герой напечатан (${geroiev}), а блока нет`);
    if (!/<header class="page-head[^"]*"[^>]*>\s*<h1\b/.test(main)) zam.push('без героя h1 не в header.page-head');
    if (podpisiVsego) zam.push('подпись кадра героя напечатана без героя');
  }
  // подпись byline
  const bylinov = [...main.matchAll(/<div class="byline\b/g)].length;
  if (bloki.includes('byline')) {
    if (bylinov !== 1) zam.push(`подписей ${bylinov}, ждали 1`);
    else {
      const iByline = main.search(/<div class="byline\b/);
      const iPervyyRyad = main.search(/<section class="layer\b/);
      if (heroObyavlen && iByline < iKonecHero) zam.push('подпись не после героя');
      if (iPervyyRyad >= 0 && iByline > iPervyyRyad) zam.push('подпись после первого ряда');
      const blok = main.slice(iByline, main.indexOf('</div>', iByline));
      const time = blok.match(/<time\b[^>]*>([\s\S]*?)<\/time>/);
      const datetime = time ? atr(time[0].match(/^<time\b[^>]*>/)[0], 'datetime') : undefined;
      if (datetime !== dane.byline?.date) zam.push(`datetime ${datetime ?? '—'}, в содержании ${dane.byline?.date}`);
      if (!time || tekst(time[1]) !== norm(dane.byline?.dateLabel)) zam.push('подпись даты разошлась с файлом содержания');
      const avtor = blok.match(/<span class="byline__author[^"]*"[^>]*>([\s\S]*?)<\/span>/);
      if (!avtor || tekst(avtor[1]) !== norm(dane.byline?.author)) zam.push('автор подписи разошёлся с файлом содержания');
      const rol = blok.match(/<span class="byline__role[^"]*"[^>]*>([\s\S]*?)<\/span>/);
      const rolZhdem = dane.byline?.role === undefined ? undefined : norm(dane.byline.role);
      if ((rol ? tekst(rol[1]) : undefined) !== rolZhdem) zam.push('приписка подписи разошлась с файлом содержания');
    }
  } else if (bylinov !== 0) zam.push(`подпись напечатана (${bylinov}), а блока нет`);
  // ряды — по месту и в порядке печати маршрута (раунд 2, P2-R2-SVERKA-1, -4)
  const rows = dane.rows ?? [];
  const zhdemRyady = page.blocks
    .filter((b) => b.block === 'story-row')
    .flatMap((b) => rows.filter((r) => (r.role || undefined) === (b.role || undefined)));
  const ryady = [...main.matchAll(/<section class="(layer\b[^"]*)"([^>]*)>([\s\S]*?)<\/section>/g)].map((m) => ({ klass: m[1].split(/\s+/), id: atr(' ' + m[2], 'id'), telo: m[3] }));
  if (ryady.length !== zhdemRyady.length) zam.push(`рядов в <main> ${ryady.length}, в файле содержания к печати ${zhdemRyady.length}`);
  const poryadok = ryady.map((r) => r.id).join(' ');
  if (poryadok !== zhdemRyady.map((r) => r.id).join(' ')) zam.push(`порядок рядов «${poryadok}» ≠ порядку печати «${zhdemRyady.map((r) => r.id).join(' ')}»`);
  for (const r of zhdemRyady) {
    const s = ryady.find((x) => x.id === r.id);
    if (!s) { zam.push(`ряда ${r.id} нет в <main>`); continue; }
    const pole = (re) => { const m = s.telo.match(re); return m ? tekst(m[1]) : undefined; };
    if (pole(/<p class="t-label[^"]*"[^>]*>([\s\S]*?)<\/p>/) !== norm(r.year)) zam.push(`ряд ${r.id}: year разошёлся с файлом содержания`);
    if (pole(/<h2\b[^>]*>([\s\S]*?)<\/h2>/) !== norm(r.title)) zam.push(`ряд ${r.id}: заголовок разошёлся с файлом содержания`);
    if (pole(/<p class="layer__meta[^"]*"[^>]*>([\s\S]*?)<\/p>/) !== norm(r.meta)) zam.push(`ряд ${r.id}: meta разошлась с файлом содержания`);
    const telo = (s.telo.match(/<div class="layer__body[^"]*"[^>]*>([\s\S]*?)<\/div>/) || [])[1] ?? '';
    const abzacy = [...telo.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((m) => tekst(m[1]));
    const zhdemAbzacy = (r.body ?? []).map(norm);
    if (abzacy.join('\n') !== zhdemAbzacy.join('\n')) zam.push(`ряд ${r.id}: абзацы разошлись с файлом содержания (напечатано ${abzacy.length}, в файле ${zhdemAbzacy.length})`);
    if (zhdemAbzacy.some((x) => x === '') || [r.year, r.title, r.meta].some((x) => norm(x) === '')) zam.push(`ряд ${r.id}: поле ряда пусто у сверки (разбор фронтматтера)`);
    if (s.klass.includes('band') !== Boolean(r.band)) zam.push(`ряд ${r.id}: класс band ${s.klass.includes('band') ? 'есть' : 'нет'}, в содержании band: ${Boolean(r.band)}`);
    if (s.klass.includes('layer--flip') !== Boolean(r.flip)) zam.push(`ряд ${r.id}: класс layer--flip ${s.klass.includes('layer--flip') ? 'есть' : 'нет'}, в содержании flip: ${Boolean(r.flip)}`);
    if (s.klass.includes('layer--bez-kadru') !== !r.art) zam.push(`ряд ${r.id}: класс layer--bez-kadru ${s.klass.includes('layer--bez-kadru') ? 'есть' : 'нет'}, в содержании art: ${r.art ?? '—'}`);
    const kadry = [...s.telo.matchAll(/<div class="foto kadr-ryadu"[^>]*>\s*(<img\b[^>]*>)/g)].map((m) => m[1]);
    if (r.art) {
      if (kadry.length !== 1) zam.push(`ряд ${r.id}: кадров ряда ${kadry.length}, ждали 1`);
      else zam.push(...sverkaKartinki(kadry[0], r.art, `ряд ${r.id}: кадр ряда`));
    } else if (kadry.length) zam.push(`ряд ${r.id}: кадр ряда напечатан, а art нет`);
  }
  // нота подвала — по всем кадрам страницы: игры и классы лицензии
  const klyuchiKadrov = [...(heroObyavlen && dane.art ? [dane.art] : []), ...rows.map((r) => r.art).filter(Boolean)];
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
  // Ключи слияния `<<:` — как у js-yaml загрузчика Astro (раунд 2, P2-R2-SVERKA-6).
  const dane = fm ? yamlParse(fm[1], { merge: true }) : null;
  const page = struktura.pages.find((p) => p.url === dane?.url);
  if (!page) { console.log(`ПЛОХО dist ${f}: адрес ${dane?.url} не в структуре`); plokho += 1; continue; }
  const htmlF = join(dist, page.url.slice(1), 'index.html');
  if (!existsSync(htmlF)) { console.log(`ПЛОХО dist ${page.url}: страницы нет в сборке`); plokho += 1; continue; }
  stranicy.push({ page, dane, html: readFileSync(htmlF, 'utf8') });
}
if (!stranicy.length) { console.error('страниц маршрута не найдено'); process.exit(2); }

if (rezhimProby) {
  // Порчи — по страницам с героем и подписью кадра (/remake/), с героем на ключевом арте без
  // подписей (/max-payne-3/), с героем, byline и кадрами рядов (/max-payne-2/) и без героя (/pc/);
  // каждая обязана дать замечание, в котором есть её причина, — подстрока, которая есть только
  // в замечании своей ветви (раунд 2, P2-R2-SVERKA-2). Порча может править и копию содержания
  // или структуры страницы (`dane`, `page`) — так проверяется нормализация сторон.
  const po = (url) => stranicy.find((s) => s.page.url === url);
  const rm = po('/remake/');
  const m2 = po('/max-payne-2/');
  const m3 = po('/max-payne-3/');
  const pc = po('/pc/');
  if (!rm || !m2 || !m3 || !pc) { console.error('для пробы нужны /remake/, /max-payne-2/, /max-payne-3/ и /pc/ в сборке'); process.exit(2); }
  const klon = (o) => JSON.parse(JSON.stringify(o));
  const OBERTKA = /<div class="geroy[^"]*"[^>]*>(?=<section class="hero")/;
  const PODPIS = /<p class="podpis-geroya[^"]*"[^>]*>[\s\S]*?<\/p>/;
  const BYLINE = /<div class="byline\b[\s\S]*?<\/div>/;
  const RYAD = (id) => new RegExp(`<section class="layer\\b[^"]*" id="${id}"[\\s\\S]*?</section>`);
  const vzyat = (h, re) => (h.match(re) || [''])[0];
  const PORCHI = [
    { imya: 'контроль /remake/', s: rm, prichina: null },
    { imya: 'контроль /max-payne-2/', s: m2, prichina: null },
    { imya: 'контроль /max-payne-3/', s: m3, prichina: null },
    { imya: 'контроль /pc/', s: pc, prichina: null },
    {
      imya: 'контроль: неразрывные пробелы и края', s: rm, prichina: null,
      html: (h) => h.replace(/(<p class="podpis-geroya[^"]*"[^>]*>Pictured:) /, '$1&nbsp;').replace(/(<h1\b[^>]*>Max) /, '$1&nbsp;'),
      dane: (d) => { d.artCaption = d.artCaption.replace('Pictured: ', 'Pictured: ') + ' \n'; d.primary.label = ' ' + d.primary.label.replace(' ', ' '); d.rows[0].title = d.rows[0].title.replace(' ', ' ') + ' '; return d; },
      page: (p) => { p.h1 = p.h1.replace(' ', ' ') + ' '; return p; },
    },
    {
      imya: 'контроль: двойной пробел автора byline', s: m2, prichina: null,
      dane: (d) => { d.byline.author = d.byline.author.replace(' ', '  '); return d; },
    },
    { imya: 'h1 снят', s: rm, html: (h) => h.replace(/<h1\b[\s\S]*?<\/h1>/, ''), prichina: 'нет <h1> в <main>' },
    { imya: 'h1 вынесен из героя', s: rm, html: (h) => { const t = vzyat(h, /<h1\b[\s\S]*?<\/h1>/); return h.replace(t, '').replace('</section></div>', '</section></div>' + t); }, prichina: 'h1 не внутри героя' },
    { imya: 'h1 без hero__title', s: rm, html: (h) => h.replace('class="hero__title t-headline"', 'class="t-headline"'), prichina: 'классы h1 героя' },
    { imya: 'h1 в рамке арта', s: rm, html: (h) => { const t = vzyat(h, /<h1\b[\s\S]*?<\/h1>/); return h.replace(t, '').replace(/(<div class="hero__art"[^>]*>)/, '$1' + t); }, prichina: 'не в колонке текста' },
    { imya: 'id h1 другой', s: rm, html: (h) => h.replace(/(<h1\b[^>]*)id="page-title"/, '$1id="proba"'), prichina: 'у h1 героя нет id="page-title"' },
    { imya: 'aria-labelledby на чужой id', s: rm, html: (h) => h.replace('aria-labelledby="page-title"', 'aria-labelledby="release-date-title"'), prichina: 'aria-labelledby героя «release-date-title»' },
    { imya: 'кадр героя другой (src)', s: rm, html: (h) => h.replace(/(<div class="hero__art"[^>]*>[\s\S]*?<img\b[^>]*?\ssrc="\/_astro\/)mp1-k13/, '$1mp1-k14'), prichina: 'кадр героя: в src или srcset ключи mp1-k14' },
    { imya: 'кадр героя другой (srcset)', s: rm, html: (h) => h.replace(/(<div class="hero__art"[^>]*>[\s\S]*?<img\b[^>]*?\ssrcset="[^"]*?\/_astro\/)mp1-k13/, '$1mp3-k15'), prichina: 'кадр героя: в src или srcset ключи mp3-k15' },
    { imya: 'кадр героя с чужого хоста', s: rm, html: (h) => h.replace(/(<div class="hero__art"[^>]*>[\s\S]*?<img\b[^>]*?\ssrc=")\/_astro\//, '$1https://evil.example/_astro/'), prichina: 'кадр героя: в src или srcset ключи ?' },
    { imya: 'картинка героя снята', s: rm, html: (h) => h.replace(/(<div class="hero__art"[^>]*>[\s\S]*?)<img\b[^>]*>/, '$1'), prichina: 'кадр героя: нет картинки' },
    { imya: 'srcset героя снят', s: rm, html: (h) => h.replace(/(<div class="hero__art"[^>]*>[\s\S]*?<img\b[^>]*?)\ssrcset="[^"]*"/, '$1'), prichina: 'кадр героя: у картинки нет srcset' },
    { imya: 'alt от другого кадра той же игры', s: rm, html: (h) => h.replace(/(<div class="hero__art"[^>]*>[\s\S]*?<img\b[^>]*?\salt=")[^"]*/, '$1' + zhdemAlt('mp1-k14')), prichina: 'кадр героя: alt' },
    { imya: 'обёртка снята', s: rm, html: (h) => h.replace(OBERTKA, ''), prichina: 'нет обёртки' },
    { imya: 'обёртка закрыта до героя', s: rm, html: (h) => h.replace(OBERTKA, (t) => t + '</div><div>'), prichina: 'нет обёртки' },
    { imya: 'byline внутри обёртки после героя', s: m2, html: (h) => { const b = vzyat(h, BYLINE); return h.replace(b, '').replace('</section></div>', '</section>' + b + '</div>'); }, prichina: 'не закрывается вплотную' },
    { imya: 'тон: сталь снята', s: rm, html: (h) => h.replace('class="geroy geroy--stal"', 'class="geroy"'), prichina: 'тон кадра: geroy--stal нет' },
    { imya: 'тон: сталь на ключевом арте', s: m3, html: (h) => h.replace('class="geroy"', 'class="geroy geroy--stal"'), prichina: 'тон кадра: geroy--stal есть' },
    { imya: 'кадровка другая', s: rm, html: (h) => h.replace('--fokus: 55% 60%', '--fokus: 10% 50%'), prichina: 'кадровка 10% 50%' },
    { imya: 'кадровка в data-style перед style', s: rm, html: (h) => h.replace('style="--fokus: 55% 60%"', 'data-style="--fokus: 55% 60%" style="--fokus: 10% 50%"'), prichina: 'кадровка 10% 50%' },
    { imya: 'подпись кадра убрана', s: rm, html: (h) => h.replace(PODPIS, ''), prichina: 'подпись кадра: в <main> 0 шт.' },
    { imya: 'подпись кадра в рамке арта', s: rm, html: (h) => { const t = vzyat(h, PODPIS); return h.replace(t, '').replace('<div class="foto">', '<div class="foto">' + t.replace('podpis-geroya', 'foto__credit')); }, prichina: '(.foto__credit)' },
    { imya: 'копия подписи в рамке арта', s: rm, html: (h) => { const t = vzyat(h, PODPIS); return h.replace('<div class="foto">', '<div class="foto">' + t.replace('podpis-geroya t-caption', 'foto__credit t-micro')); }, prichina: '(.foto__credit)' },
    { imya: 'подпись кадра в колонке текста', s: rm, html: (h) => { const t = vzyat(h, PODPIS); return h.replace(t, '').replace(/(<div class="hero__text"[^>]*>)/, '$1' + t); }, prichina: 'последним элементом героя (место dopisek) — нет' },
    { imya: 'вторая подпись кадра вне героя', s: rm, html: (h) => h.replace('</main>', vzyat(h, PODPIS) + '</main>'), prichina: 'подпись кадра: в <main> 2 шт.' },
    { imya: 'подпись кадра без роли t-caption', s: rm, html: (h) => h.replace('class="podpis-geroya t-caption"', 'class="podpis-geroya t-micro"'), prichina: 'без роли t-caption' },
    { imya: 'текст подписи кадра другой', s: rm, html: (h) => h.replace(/(<p class="podpis-geroya[^"]*"[^>]*>[^<]*)not the remake/, '$1the remake'), prichina: 'текст подписи кадра' },
    { imya: 'подпись кадра разбита на два абзаца', s: rm, html: (h) => h.replace(/(<p class="podpis-geroya[^"]*"[^>]*>[^<]*?), not the remake<\/p>/, '$1</p><p>, not the remake</p>'), prichina: 'последним элементом героя (место dopisek) — нет' },
    { imya: 'подпись кадра без artCaption', s: m2, html: (h) => h.replace('</section></div>', '<p class="podpis-geroya t-caption">Proba</p></section></div>'), prichina: 'подпись кадра напечатана, а в содержании её нет' },
    { imya: 'подпись «оригинал» снята с /remake/', s: rm, html: (h) => h.replace(PODPIS, ''), dane: (d) => { delete d.artCaption; return d; }, prichina: 'обязательна у героя' },
    { imya: 'подпись героя без героя', s: pc, html: (h) => h.replace('<main id="content">', '<main id="content"><p class="podpis-geroya t-caption">Proba</p>'), prichina: 'напечатана без героя' },
    { imya: 'адрес главной кнопки другой', s: rm, html: (h) => h.replace('href="#release-date"', 'href="#progress"'), prichina: 'primary: адрес #progress' },
    { imya: 'надпись контурной кнопки другая', s: rm, html: (h) => h.replace('>The 2001 original<', '>Proba<'), prichina: 'secondary: надпись' },
    { imya: 'контурной кнопки нет', s: rm, html: (h) => h.replace(/<a class="btn btn-secondary[\s\S]*?<\/a>/, ''), prichina: 'нет кнопки btn-secondary' },
    { imya: 'кнопки перепутаны', s: rm, html: (h) => h.replace('class="btn btn-primary', 'class="btn btn-PROBA').replace('class="btn btn-secondary', 'class="btn btn-primary').replace('class="btn btn-PROBA', 'class="btn btn-secondary'), prichina: 'primary: адрес /max-payne-1/' },
    { imya: 'иконка вправо при якоре', s: rm, html: (h) => h.replace(IKONY['arrow-down'], IKONY['arrow-right']), prichina: 'иконка главной кнопки' },
    { imya: 'лид другой', s: rm, html: (h) => h.replace('Remedy is rebuilding', 'Remedy is building'), prichina: 'лид героя разошёлся' },
    { imya: '.page-head рядом с героем', s: rm, html: (h) => h.replace('<main id="content">', '<main id="content"><header class="page-head container section"></header>'), prichina: 'при герое напечатана .page-head' },
    { imya: 'секция перед героем', s: rm, html: (h) => h.replace('<main id="content">', '<main id="content"><section class="proba section"></section>'), prichina: 'герой не первый' },
    { imya: 'два героя', s: rm, html: (h) => { const i = h.search(/<section class="hero"/); const j = h.indexOf('</section>', i) + '</section>'.length; return h.slice(0, j) + h.slice(i, j) + h.slice(j); }, prichina: 'героев 2' },
    { imya: 'герой без блока', s: pc, html: (h) => h.replace('<main id="content">', '<main id="content"><section class="hero"></section>'), prichina: 'герой напечатан (1), а блока нет' },
    { imya: 'без героя h1 не в .page-head', s: pc, html: (h) => h.replace('<header class="page-head', '<div class="page-head'), prichina: 'без героя h1 не в header.page-head' },
    { imya: 'h1 структуры другой (старая сборка)', s: rm, page: (p) => { p.h1 += ' proba'; return p; }, prichina: 'h1 структуры' },
    { imya: 'ряд удалён', s: rm, html: (h) => h.replace(RYAD('max-payne-4'), ''), prichina: 'рядов в <main> 5' },
    { imya: 'ряды переставлены', s: rm, html: (h) => { const a = vzyat(h, RYAD('voice')); const b = vzyat(h, RYAD('originals')); return h.replace(a, '\u0000').replace(b, a).replace('\u0000', b); }, prichina: 'порядок рядов' },
    { imya: 'id ряда другой', s: rm, html: (h) => h.replace('id="originals"', 'id="originals-proba"'), prichina: 'ряда originals нет в <main>' },
    { imya: 'надзаголовок ряда другой', s: rm, html: (h) => h.replace(/(<section class="layer[^"]*" id="progress"[\s\S]*?<p class="t-label"[^>]*>)[^<]*/, '$1Proba'), prichina: 'ряд progress: year' },
    { imya: 'заголовок ряда другой', s: rm, html: (h) => h.replace('>No date yet<', '>Proba<'), prichina: 'ряд release-date: заголовок' },
    { imya: 'meta ряда другая', s: rm, html: (h) => h.replace(/(<section class="layer[^"]*" id="voice"[\s\S]*?<p class="layer__meta[^"]*"[^>]*>)[^<]*/, '$1Proba'), prichina: 'ряд voice: meta' },
    { imya: 'абзац ряда сокращён', s: rm, html: (h) => h.replace(/(Remedy’s in-house engine|its in-house engine)\./, 'it.'), prichina: 'ряд what-it-is: абзацы' },
    { imya: 'абзац ряда удалён', s: rm, html: (h) => h.replace(/(<section class="layer[^"]*" id="release-date"[\s\S]*?<div class="layer__body[^"]*"[^>]*>[\s\S]*?)<p\b[^>]*>So, as of[\s\S]*?<\/p>/, '$1'), prichina: 'ряд release-date: абзацы' },
    { imya: 'ряд без band', s: rm, html: (h) => h.replace(/(<section class="layer section) band( layer--bez-kadru" id="voice")/, '$1$2'), prichina: 'ряд voice: класс band' },
    { imya: 'ряд с layer--flip', s: m2, html: (h) => h.replace('class="layer section" id="story"', 'class="layer section layer--flip" id="story"'), prichina: 'ряд story: класс layer--flip' },
    { imya: 'ряд без кадра с кадром', s: rm, html: (h) => h.replace('class="layer section layer--bez-kadru" id="progress"', 'class="layer section" id="progress"'), prichina: 'ряд progress: класс layer--bez-kadru' },
    { imya: 'кадр ряда другой', s: m2, html: (h) => h.replace(/(<section class="layer[^"]*" id="story"[\s\S]*?<img\b[^>]*?\ssrc="\/_astro\/)mp2-k01/, '$1mp2-k02'), prichina: 'ряд story: кадр ряда: в src или srcset ключи mp2-k02' },
    { imya: 'кадр ряда без art', s: rm, html: (h) => h.replace(/(<section class="layer[^"]*" id="progress"[\s\S]*?)<\/section>/, (t, a) => a + '<div class="foto kadr-ryadu"><img src="/_astro/mp1-k13.x.webp" alt=""></div></section>'), prichina: 'ряд progress: кадр ряда напечатан, а art нет' },
    { imya: 'поле ряда пусто у сверки', s: rm, html: (h) => h.replace(/(<section class="layer[^"]*" id="voice"[\s\S]*?<p class="t-label"[^>]*>)[^<]*/, '$1'), dane: (d) => { d.rows.find((r) => r.id === 'voice').year = '  '; return d; }, prichina: 'ряд voice: поле ряда пусто' },
    { imya: 'кадр ряда снят', s: m2, html: (h) => h.replace(/(<section class="layer[^"]*" id="story"[\s\S]*?)<div class="foto kadr-ryadu"[^>]*>\s*<img\b[^>]*>/, '$1<div class="foto">'), prichina: 'ряд story: кадров ряда 0' },
    { imya: 'игра ноты другая', s: rm, html: (h) => h.replace(/Games: Max Payne\./, 'Games: Max Payne 3.'), prichina: 'игры ноты' },
    { imya: 'нота об арте снята', s: rm, html: (h) => h.replace(/<p class="ft__art-note[^"]*"[^>]*>[\s\S]*?<\/p>/g, ''), prichina: 'ноты об арте нет' },
    { imya: 'строка класса лицензии снята', s: rm, html: (h) => h.replace(/<p class="ft__art-note[^"]*"[^>]*>\s*License class:[\s\S]*?<\/p>/, ''), prichina: 'нет строки класса' },
    { imya: 'класс лицензии подменён', s: rm, html: (h) => h.replace(/(License class: )[^<]*/, '$1CC BY-SA 4.0.'), prichina: 'класс лицензии ноты' },
    { imya: 'нота без кадров', s: pc, html: (h) => h.replace('</body>', '<p class="ft__art-note t-caption">Games: Max Payne.</p></body>'), prichina: 'кадров нет, а нота' },
    { imya: 'datetime подписи другой', s: m2, html: (h) => h.replace('datetime="2026-09-26"', 'datetime="2026-09-25"'), prichina: 'datetime 2026-09-25' },
    { imya: 'дата словами другая', s: m2, html: (h) => h.replace(/(<time\b[^>]*>)September 26, 2026/, '$1September 25, 2026'), prichina: 'подпись даты разошлась' },
    { imya: 'подпись byline убрана', s: m2, html: (h) => h.replace(BYLINE, ''), prichina: 'подписей 0' },
    { imya: 'подпись после первого ряда', s: m2, html: (h) => { const b = vzyat(h, BYLINE); return h.replace(b, '').replace('</main>', b + '</main>'); }, prichina: 'подпись после первого ряда' },
    { imya: 'подпись перед героем', s: m2, html: (h) => { const b = vzyat(h, BYLINE); return h.replace(b, '').replace('<main id="content">', '<main id="content">' + b); }, prichina: 'подпись не после героя' },
    { imya: 'автор подписи другой', s: m2, html: (h) => h.replace(/(<span class="byline__author[^"]*"[^>]*>)[^<]*/, '$1Proba'), prichina: 'автор подписи' },
    { imya: 'приписка другая', s: m2, html: (h) => h.replace(/(<span class="byline__role[^"]*"[^>]*>)[^<]*/, '$1By'), prichina: 'приписка подписи' },
    { imya: 'приписка снята', s: m2, html: (h) => h.replace(/<span class="byline__role[^"]*"[^>]*>[^<]*<\/span>/, ''), prichina: 'приписка подписи' },
    { imya: 'byline без блока', s: m3, html: (h) => h.replace('</section></div>', '</section></div><div class="byline section--light"><p><span class="byline__author">Proba</span></p></div>'), prichina: 'подпись напечатана (1), а блока нет' },
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
    console.log(`${ok ? 'ok   ' : 'ПЛОХО'} ${x.imya.padEnd(40)} ${itog}`);
  }
  console.log(`проба сверки: ${PORCHI.length - plokhoProb}/${PORCHI.length}`);
  process.exit(plokhoProb ? 1 : 0);
}

for (const s of stranicy) {
  const z = sverka(s.page, s.dane, s.html);
  if (z.length) plokho += 1;
  const bloki = s.page.blocks.map((b) => b.block);
  console.log(`${z.length ? 'ПЛОХО' : 'ok   '} dist ${s.page.url.padEnd(24)} герой ${bloki.includes('hero-key-art') ? s.dane.art : 'нет'}, подпись кадра ${s.dane.artCaption ? 'есть' : 'нет'}, byline ${bloki.includes('byline') ? 'есть' : 'нет'}, рядов ${(s.dane.rows ?? []).length}`);
  for (const x of z) console.log('      ' + x);
}
console.log(plokho ? `ПЛОХО: ${plokho}` : 'итог: всё как ждали');
process.exit(plokho ? 1 : 0);
