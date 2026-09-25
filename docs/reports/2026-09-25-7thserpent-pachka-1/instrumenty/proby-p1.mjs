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
// папка сборки — `.astro/dist-proba-p1` (в .gitignore сайта — `.astro/`). Пока идут пробы,
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
const iDist = process.argv.indexOf('--dist');
const dist = iDist >= 0 ? process.argv[iDist + 1] : join(root, 'dist');
if (!existsSync(dist)) { console.error('нет dist/ сайта — сначала npm run build'); process.exit(2); }
const struktura = JSON.parse(readFileSync(P.struktura, 'utf8'));
const kredity = JSON.parse(readFileSync(join(root, 'src/data/game-art.json'), 'utf8'));
const tresc = join(root, 'src/content/tresc');
let stranic = 0;
for (const f of readdirSync(tresc).filter((x) => x.endsWith('.md'))) {
  const md = readFileSync(join(tresc, f), 'utf8');
  const url = (md.match(/^url: (\S+)$/m) || [])[1];
  const page = struktura.pages.find((p) => p.url === url);
  const html = readFileSync(join(dist, url.slice(1), 'index.html'), 'utf8');
  const main = html.slice(html.search(/<main\b/), html.search(/<\/main>/));
  const zam = [];
  stranic += 1;
  // призыв
  const ctaObyavlen = page.blocks.some((b) => b.block === 'cta-band');
  const sekcii = [...main.matchAll(/<section class="([^"]*)"/g)].map((m) => m[1]);
  const ctaN = sekcii.filter((c) => c.split(/\s+/).includes('cta')).length;
  if (ctaObyavlen) {
    if (ctaN !== 1) zam.push(`призывов ${ctaN}, ждали 1`);
    else if (!sekcii[sekcii.length - 1].split(/\s+/).includes('cta')) zam.push('призыв не последний блок <main>');
    const hrefMd = (md.match(/^cta:\n(?:  .*\n)*?  href: (\S+)$/m) || [])[1];
    const knopka = (main.match(/<a[^>]*class="btn btn-primary[^"]*cta__btn[^"]*"[^>]*>/) || [''])[0];
    const hrefHtml = (knopka.match(/href="([^"]*)"/) || [])[1];
    if (!hrefMd || hrefHtml !== hrefMd) zam.push(`кнопка призыва ведёт на ${hrefHtml}, в содержании ${hrefMd}`);
  } else if (ctaN !== 0) zam.push(`призыв напечатан (${ctaN}), а блока нет`);
  // кадры и нота
  const klyuchiMd = [...md.matchAll(/^    art: (\S+)$/gm)].map((m) => m[1]);
  const kadrov = [...main.matchAll(/<div class="foto kadr-ryadu"/g)].length;
  if (kadrov !== klyuchiMd.length) zam.push(`кадров ${kadrov}, рядов с art ${klyuchiMd.length}`);
  const nota = html.match(/Games: ([^<.]+)\./);
  const igryKadrov = [...new Set(klyuchiMd.map((k) => kredity[k]?.game))].sort();
  if (klyuchiMd.length === 0 && nota) zam.push('кадров нет, а нота об арте есть');
  if (klyuchiMd.length > 0) {
    if (!nota) zam.push('кадры есть, а ноты об арте нет');
    else if (nota[1].split(', ').sort().join('|') !== igryKadrov.join('|')) zam.push(`игры ноты «${nota[1]}» ≠ игры кадров «${igryKadrov.join(', ')}»`);
    if (!/License class: /.test(html)) zam.push('нет строки класса лицензии');
  }
  if (zam.length) plokho += 1;
  console.log(`${zam.length ? 'ПЛОХО' : 'ok   '} dist ${url.padEnd(24)} призыв ${ctaObyavlen ? 'объявлен' : 'нет'}, кадров ${kadrov}${nota ? ', нота: ' + nota[1] : ''}`);
  for (const z of zam) console.log('      ' + z);
}
if (!stranic) { console.error('страниц маршрута не найдено'); process.exit(2); }
console.log(plokho ? `ПЛОХО: ${plokho}` : 'итог: всё как ждали');
process.exit(plokho ? 1 : 0);
