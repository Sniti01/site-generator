// Разовые пробы новых ветвей маршрута пачки 1 (сессия 14, П89) — ветвь `cta-band` и кадр ряда
// `art`. Замороженные пробы договора (`sites/7thserpent.com/tools/proby-tresci.mjs`, 42fa5f3,
// правка — только заместители по ответу владельца 1) новых ветвей не судят («судью судят»,
// раунд 1: R1-ZAM-6, -7, R1-MARSHRUT-8), дописывать их в объёме нельзя. Эти пробы — тем же
// устройством, отдельным инструментом в папке доклада:
//
//   node proby-p1.mjs            — все пробы: подмена файлов, `astro build` в отдельную папку,
//                                  возврат байтов и сверка sha256; затем сверка собранных
//                                  страниц сайта по `dist/` (после `npm run build`)
//   node proby-p1.mjs --tolko-dist — только сверка `dist/`
//
// СТАРТ: подменяемые файлы обязаны совпадать с индексом git (как у проб договора); временная
// папка сборки — `.astro/dist-proba-p1` (правило `.astro/` — в корневом .gitignore репозитория,
// действует на любой глубине). Пока идут пробы,
// сборки, `tree:check`, `glowa`, пробы договора и коммиты не запускать. Ctrl+C не нажимать:
// прерванный прогон — `git diff` и `git checkout -- <файл>`.
// ОТРИЦАТЕЛЬНАЯ проба ждёт ненулевой код и все свои строки в выводе сборки.
// СВЕРКА dist/ (положительная, по настоящим страницам): на каждой странице маршрута с
// `cta-band` в blocks[] — ровно один `section.cta`, он последний блок <main>, его кнопка ведёт
// по `cta.href` файла содержания; у каждой страницы маршрута кадры рядов (`.foto.kadr-ryadu`)
// и нота подвала согласованы: кадров нет — ноты нет, кадры есть — нота есть, и игры ноты — ровно
// игры кадров (по `game-art.json`); число кадров — число рядов с `art` в файле содержания.
// ПРЕДЕЛЫ (названы): вид призыва и кадра не судится (это кадры стопа и глаза владельца);
// разбор HTML — регулярными выражениями по разметке, которую печатает этот маршрут.
import { readFileSync, writeFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const root = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const OUT = '.astro/dist-proba-p1';
const tolkoDist = process.argv.includes('--tolko-dist');
const P = {
  stend: join(root, 'src/content/tresc/404.md'),
  pc: join(root, 'src/content/tresc/pc.md'),
  media: join(root, 'src/content/tresc/media.md'),
  struktura: join(root, 'structure/structure.json'),
};
const sha = (b) => createHash('sha256').update(b).digest('hex');
const git = (args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });

let plokho = 0;
if (!tolkoDist) {
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
  const PROBY = [
    { id: 'Q1', imya: 'поле cta в содержании, а блока cta-band у страницы нет', fajly: { stend: zamena(iskhod.stend, 'related:\n', 'cta:\n  title: Proba\n  lead: Proba lead.\n  href: /\n  label: Proba\nrelated:\n') }, zhdem: ['Поле без блока', '`cta`', '`cta-band`'] },
    { id: 'Q2', imya: 'cta-band объявлен, поля cta в содержании нет', fajly: { struktura: strukturaS('/404/', (p) => { p.blocks = bloki('story-row', 'link-list', 'cta-band'); }) }, zhdem: ['blocks[] и печать разошлись', 'без содержания: cta-band (нет поля cta в содержании)'] },
    { id: 'Q3', imya: 'href призыва «/\\host/» — схема', fajly: { pc: zamena(iskhod.pc, '  href: /mods/\n', '  href: /\\evil.example/\n') }, zhdem: ['pc.md data does not match collection schema', 'cta.href'] },
    { id: 'Q4', imya: 'href призыва «//host/» — схема', fajly: { pc: zamena(iskhod.pc, '  href: /mods/\n', '  href: //evil.example/x\n') }, zhdem: ['pc.md data does not match collection schema', 'cta.href'] },
    { id: 'Q5', imya: 'href призыва «http://» — схема', fajly: { pc: zamena(iskhod.pc, '  href: /mods/\n', '  href: http://evil.example/\n') }, zhdem: ['pc.md data does not match collection schema', 'cta.href'] },
    { id: 'Q6', imya: 'кадр ряда с неизвестным ключом — разрешатель kadr()', fajly: { media: zamena(iskhod.media, '    art: mp2-k01\n', '    art: mp9-k99\n') }, zhdem: ['Кадр "mp9-k99"'] },
    { id: 'Q7', imya: 'ключ кадра не kebab — схема', fajly: { media: zamena(iskhod.media, '    art: mp2-k01\n', '    art: Mp2_K01\n') }, zhdem: ['media.md data does not match collection schema', '.art'] },
    { id: 'Q8', imya: 'вхождение cta-band с ролью — ROLE_UMIE', fajly: { struktura: strukturaS('/pc/', (p) => { p.blocks = bloki('story-row', 'link-list', 'cta-band#proba'); }) }, zhdem: ['Вхождение блока с ролью', 'cta-band#proba'] },
    { id: 'Q9', imya: 'порядок: cta-band перед link-list в blocks[]', fajly: { struktura: strukturaS('/pc/', (p) => { p.blocks = bloki('story-row', 'cta-band', 'link-list'); }) }, zhdem: ['blocks[] и печать разошлись', 'разошёлся только порядок'] },
  ];
  const vernut = () => {
    const osh = [];
    for (const [k, f] of Object.entries(P)) {
      try { writeFileSync(f, iskhod[k]); } catch (e) { osh.push(`${f}: ${e.message}`); }
    }
    return osh;
  };
  for (const p of PROBY) {
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
    console.log(`${zam.length ? 'ПЛОХО' : 'ok   '} ${p.id} ${p.imya.padEnd(58)} код ${kod}`);
    for (const z of zam) console.log('      ' + z);
    if (zam.length) for (const l of out.split('\n').filter((l) => /Error|Ошиб|Поле|Вхожд|blocks\[\]|Кадр|schema|href|art/.test(l)).slice(-6)) console.log('      | ' + l.slice(0, 200));
  }
  rmSync(join(root, OUT), { recursive: true, force: true });
  console.log(`пробы: ${PROBY.length - plokho}/${PROBY.length}; файлы возвращены и сверены побайтово`);
}

// — сверка собранных страниц dist/ (или `--dist <папка>` — копия сборки, для проб самой сверки) —
// Раунд 2 «судью судят»: кадры — по ключам в напечатанных <img src> и в порядке рядов (R2-MARSHRUT-3);
// нота — только внутри p.ft__art-note подвала (-4); адрес кнопки сравнивается после раскрытия
// сущностей (-6); файлы содержания — по всему дереву, как у загрузчика `**/*.md` (-7); свежесть —
// заголовки рядов и призыва из файла содержания обязаны стоять в HTML страницы (-8: старая сборка
// с прежними текстами — отказ, а не «ok»). Файл содержания разбирается пакетом `yaml` (тот же
// YAML 1.2, что у загрузчика Astro), а не регулярками.
const iDist = process.argv.indexOf('--dist');
const dist = iDist >= 0 ? process.argv[iDist + 1] : join(root, 'dist');
if (!existsSync(dist)) { console.error('нет dist/ сайта — сначала npm run build'); process.exit(2); }
const { parse: yamlParse } = await import('yaml');
const struktura = JSON.parse(readFileSync(P.struktura, 'utf8'));
const kredity = JSON.parse(readFileSync(join(root, 'src/data/game-art.json'), 'utf8'));
const tresc = join(root, 'src/content/tresc');
const mdFajly = [];
const obkhod = (d) => { for (const x of readdirSync(d, { withFileTypes: true })) { const p = join(d, x.name); if (x.isDirectory()) obkhod(p); else if (x.name.endsWith('.md')) mdFajly.push(p); } };
obkhod(tresc);
const raskryt = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (m, k) => {
  if (k[0] === '#') return String.fromCodePoint(k[1].toLowerCase() === 'x' ? parseInt(k.slice(2), 16) : Number(k.slice(1)));
  return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }[k.toLowerCase()];
});
let stranic = 0;
for (const f of mdFajly) {
  const md = readFileSync(f, 'utf8');
  const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const dane = fm ? yamlParse(fm[1]) : null;
  const url = dane?.url;
  const page = struktura.pages.find((p) => p.url === url);
  const zam = [];
  stranic += 1;
  if (!page) { console.log(`ПЛОХО dist ${f}: адрес ${url} не в структуре`); plokho += 1; continue; }
  const htmlF = join(dist, url.slice(1), 'index.html');
  if (!existsSync(htmlF)) { console.log(`ПЛОХО dist ${url}: страницы нет в сборке`); plokho += 1; continue; }
  const html = readFileSync(htmlF, 'utf8');
  const main = html.slice(html.search(/<main\b/), html.search(/<\/main>/));
  const tekstHtml = raskryt(html);
  // свежесть: заголовки рядов и призыва — в HTML
  const rows = dane.rows ?? [];
  for (const t of [...rows.map((r) => r.title), dane.cta?.title].filter(Boolean)) if (!tekstHtml.includes(t)) zam.push(`в HTML нет заголовка «${t}» из файла содержания — сборка старая или печать разошлась`);
  // призыв
  const ctaObyavlen = page.blocks.some((b) => b.block === 'cta-band');
  const sekcii = [...main.matchAll(/<section class="([^"]*)"/g)].map((m) => m[1]);
  const ctaN = sekcii.filter((c) => c.split(/\s+/).includes('cta')).length;
  if (ctaObyavlen) {
    if (ctaN !== 1) zam.push(`призывов ${ctaN}, ждали 1`);
    else if (!sekcii[sekcii.length - 1].split(/\s+/).includes('cta')) zam.push('призыв не последний блок <main>');
    const knopka = (main.match(/<a[^>]*class="btn btn-primary[^"]*cta__btn[^"]*"[^>]*>/) || [''])[0];
    const hrefHtml = raskryt((knopka.match(/href="([^"]*)"/) || [])[1] ?? '');
    if (!dane.cta?.href || hrefHtml !== dane.cta.href) zam.push(`кнопка призыва ведёт на ${hrefHtml}, в содержании ${dane.cta?.href}`);
  } else if (ctaN !== 0) zam.push(`призыв напечатан (${ctaN}), а блока нет`);
  // кадры: ключи напечатанных картинок в порядке рядов
  const klyuchiMd = rows.map((r) => r.art).filter(Boolean);
  const kadry = [...main.matchAll(/<div class="foto kadr-ryadu"[^>]*>\s*<img\b[^>]*\bsrc="([^"]*)"/g)].map((m) => (m[1].match(/\/_astro\/([a-z0-9-]+)\./) || [])[1] ?? '?');
  if (kadry.join(',') !== klyuchiMd.join(',')) zam.push(`кадры страницы [${kadry.join(', ')}] ≠ ключи рядов [${klyuchiMd.join(', ')}]`);
  // нота подвала — только внутри p.ft__art-note
  const noty = [...html.matchAll(/<p class="ft__art-note[^"]*"[^>]*>([\s\S]*?)<\/p>/g)].map((m) => raskryt(m[1]).replace(/\s+/g, ' '));
  const igryNoty = (noty.join(' ').match(/Games: ([^.]+)\./) || [])[1];
  const klass = noty.some((n) => /License class: /.test(n));
  const igryKadrov = [...new Set(klyuchiMd.map((k) => kredity[k]?.game))].sort();
  if (klyuchiMd.length === 0 && noty.length) zam.push('кадров нет, а нота об арте есть');
  if (klyuchiMd.length > 0) {
    if (!igryNoty) zam.push('кадры есть, а ноты об арте нет');
    else if (igryNoty.split(', ').sort().join('|') !== igryKadrov.join('|')) zam.push(`игры ноты «${igryNoty}» ≠ игры кадров «${igryKadrov.join(', ')}»`);
    if (!klass) zam.push('нет строки класса лицензии');
  }
  if (zam.length) plokho += 1;
  console.log(`${zam.length ? 'ПЛОХО' : 'ok   '} dist ${url.padEnd(24)} призыв ${ctaObyavlen ? 'объявлен' : 'нет'}, кадров ${kadry.length}${igryNoty ? ', нота: ' + igryNoty : ''}`);
  for (const z of zam) console.log('      ' + z);
}
if (!stranic) { console.error('страниц маршрута не найдено'); process.exit(2); }
console.log(plokho ? `ПЛОХО: ${plokho}` : 'итог: всё как ждали');
process.exit(plokho ? 1 : 0);
