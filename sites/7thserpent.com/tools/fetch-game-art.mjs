#!/usr/bin/env node
/**
 * Материалы издателя со Steam для главной (П79 п. 3): ключевой арт первого
 * экрана (library_hero), ключевой арт игры для страницы панелей (поле `art`
 * игры, ключ `<слот>-art`; сессия 10, П81) и выбранные скриншоты — по
 * `src/data/games.json`, в `src/assets/gry/`, с записью в `src/data/game-art.json`.
 *
 *   node tools/fetch-game-art.mjs               — качает недостающее
 *   node tools/fetch-game-art.mjs --dry-run     — показывает, что взял бы
 *   node tools/fetch-game-art.mjs --force       — перекачивает всё
 *   node tools/fetch-game-art.mjs --only mp1,hero
 *   node tools/fetch-game-art.mjs --shots mp2   — печатает все скриншоты
 *                                  игры с индексами и хешами, для выбора
 *   node tools/fetch-game-art.mjs --embed-only  — вшивает строку
 *                                  происхождения в уже скачанные файлы
 *
 * Копия инструмента первого сайта (`sites/ac4bf-thewatch.com/tools/
 * fetch-game-art.mjs`), сокращённая до того, что нужно главной второго
 * сайта: ключевой арт и скриншоты по индексу с хешем `ss` (кадры рядов,
 * П57). Обложек нет: на обложке логотип игры,
 * а собственное оформление сайта на символике издателя стоять не может
 * (PRODUCT.md, «Юридическое ограничение фан-сайтов»). По той же причине
 * не качается `logo.png`.
 *
 * КЛАСС ЛИЦЕНЗИИ пишется в каждую запись кредитов (`license`) и отдельной
 * строкой в подвал — как у первого сайта (П42, П57 п. 2); формула — та же,
 * что у первого сайта в английской редакции (П76), с именем издателя этих
 * игр: Rockstar Games у всех трёх (API `appdetails`, 2026-09-23; дополнение
 * к П79).
 *
 * ФАЙЛЫ СВОИ: всё скачанное лежит в репозитории и уезжает в сборку через
 * `astro:assets`; собранная страница не делает ни одного внешнего запроса.
 * Кандидаты для выбора (все скриншоты игры) сюда не качаются — их смотрят
 * контактным листом вне `src/assets/` (корневой `.gitignore`, `input/kadry/`).
 */

const LICENSE =
  'publisher material (Rockstar Games), not under a free license — used solely to identify the games in the series that the site’s pages are about';

import sharp from 'sharp';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src/assets/gry');
const manifestPath = join(root, 'src/data/games.json');
const creditsPath = join(root, 'src/data/game-art.json');

// ПРОИСХОЖДЕНИЕ ВНУТРИ ФАЙЛА: у каждого растра главной происхождение записано
// в самом JPEG (COM-сегмент, форма `embed-prompt.mjs` скилла impeccable —
// контракт FINISH направления главной, сессия 9). Источник правды остаётся
// `game-art.json`; строка в файле — копия, чтобы происхождение путешествовало
// с файлом. В собранные webp метаданные не попадают (их снимает оптимизатор).
//   node tools/fetch-game-art.mjs --embed-only  — вшить строку в уже скачанные
const EMBED = join(root, '../../.claude/skills/impeccable/scripts/embed-prompt.mjs');
const pochodzenie = (key, c) =>
  `sourced: publisher material — ${c.game}, ${c.kind}, ${c.source}; license class: ${c.license}; ` +
  `record: src/data/game-art.json key "${key}"; fetched by tools/fetch-game-art.mjs`;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const embedOnly = args.includes('--embed-only');
const pick = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : null;
};
const only = pick('--only') ? new Set(pick('--only').split(',')) : null;
const shotsFor = pick('--shots');

const CDN = 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps';
const UA = '7thserpent-site-generator/0.1 (static fan site)';
// Скриншоты у этих игр не шире 1920 — мастер их не ужимает; ключевой арт
// первого экрана — 3840 (library_hero_2x): панель героя почти квадратная,
// баннер 3:1, и при `object-fit: cover` браузеру нужна ширина втрое больше
// ширины панели (правило `sizes` первого сайта, DESIGN.md «Photography»).
const MASTER = 1920;
const MASTER_HERO = 3840;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Постоянный идентификатор скриншота — хеш `ss_<hex>` из адреса; у старых
 *  витрин (Max Payne, Max Payne 2) хеша нет, адрес — `<10 цифр>.1920x1080.jpg`,
 *  тогда идентификатор — это число (тот же разбор, что у первого сайта). */
const hashZrzutu = (shot) => {
  const adres = String(shot?.path_full ?? '');
  return (adres.match(/ss_([0-9a-f]+)/) ?? [])[1] ?? (adres.match(/\/(\d{6,})\.\d+x\d+\.jpg/) ?? [])[1] ?? null;
};

async function politeFetch(url, { attempts = 3 } = {}) {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': UA } });
    if (response.ok) return response;
    if ((response.status !== 429 && response.status !== 503) || attempt === attempts) {
      throw new Error(`Steam ${response.status}: ${url}`);
    }
    const wait = 2000 * attempt;
    console.log(`          ${response.status} — жду ${wait / 1000} с`);
    await sleep(wait);
  }
}

const cache = new Map();
async function appDetails(appid) {
  if (cache.has(appid)) return cache.get(appid);
  const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=us&l=english`;
  await sleep(900);
  const data = await (await politeFetch(url)).json();
  const entry = data[String(appid)];
  if (!entry?.success) throw new Error(`Steam не знает appid ${appid}`);
  cache.set(appid, entry.data);
  return entry.data;
}

/** Мастер — перекодированный JPEG не шире `maxWidth`: файлы Steam бывают
 *  тяжелее, чем нужно, а Astro кладёт мастер запасным `src` рядом с srcset. */
async function save(bytes, target, maxWidth = MASTER) {
  const meta = await sharp(bytes).metadata();
  const out = await (meta.width > maxWidth ? sharp(bytes).resize({ width: maxWidth }) : sharp(bytes))
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  writeFileSync(target, out);
  const final = await sharp(out).metadata();
  return { width: final.width, height: final.height };
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

if (shotsFor) {
  const game = manifest.games.find((item) => item.slot === shotsFor);
  if (!game) {
    console.error(`Нет слота "${shotsFor}" в src/data/games.json`);
    process.exit(1);
  }
  const details = await appDetails(game.appid);
  console.log(`${details.name} — ${details.screenshots.length} скриншотов:`);
  details.screenshots.forEach((shot, index) => console.log(`  [${index}] ss ${hashZrzutu(shot)}  ${shot.path_full}`));
  process.exit(0);
}

const credits = existsSync(creditsPath) ? JSON.parse(readFileSync(creditsPath, 'utf8')) : {};
if (!dryRun) mkdirSync(outDir, { recursive: true });
let pobrano = 0;
const zapisz = () => writeFileSync(creditsPath, `${JSON.stringify(credits, null, 2)}\n`, 'utf8');
const nuzhno = (key) => force || !existsSync(join(outDir, `${key}.jpg`)) || !credits[key];
const vshit = (key) => {
  const c = credits[key];
  if (!c) throw new Error(`Нет записи "${key}" в game-art.json — нечего вшивать`);
  if (!existsSync(EMBED)) throw new Error(`Нет ${EMBED} — происхождение не вшито`);
  execFileSync(process.execPath, [EMBED, join(outDir, c.file), '--prompt', pochodzenie(key, c)], { stdio: 'ignore' });
};

if (embedOnly) {
  for (const key of Object.keys(credits)) {
    vshit(key);
    console.log(`вшито  ${key}`);
  }
  process.exit(0);
}

/** Ключевой арт игры (`library_hero_2x`, при отказе — `library_hero`) под
 *  ключом `key`: первый экран (`hero`, мастер 3840) и ключевой арт игры
 *  в страницу панелей (`<слот>-art`, поле `art` игры в манифесте, мастер
 *  1920 — панель узкая; сессия 10, П81: ряд ремейка). */
async function kluczowyArt(key, appid, opis, maxWidth) {
  if (!nuzhno(key)) {
    console.log(`есть    ${key.padEnd(11)} файл и запись на месте`);
    return;
  }
  const details = await appDetails(appid);
  let wariant = 'library_hero_2x.jpg';
  console.log(`${dryRun ? 'взял бы' : 'качаю  '} ${key.padEnd(11)} ${details.name} — ${wariant}`);
  if (dryRun) return;
  let bytes;
  try {
    await sleep(500);
    bytes = Buffer.from(await (await politeFetch(`${CDN}/${appid}/${wariant}`, { attempts: 1 })).arrayBuffer());
  } catch {
    wariant = 'library_hero.jpg';
    await sleep(400);
    bytes = Buffer.from(await (await politeFetch(`${CDN}/${appid}/${wariant}`)).arrayBuffer());
  }
  const size = await save(bytes, join(outDir, `${key}.jpg`), maxWidth);
  credits[key] = {
    file: `${key}.jpg`,
    game: details.name,
    appid,
    kind: `key art (${wariant})`,
    opis: opis ?? null,
    license: LICENSE,
    source: `https://store.steampowered.com/app/${appid}/`,
    ...size,
  };
  pobrano += 1;
  zapisz();
  vshit(key);
}

// --- ключевой арт первого экрана ---
if (!only || only.has('hero')) await kluczowyArt('hero', manifest.hero.appid, manifest.hero.opis, MASTER_HERO);

// --- ключевой арт игр (страницы панелей) ---
for (const game of manifest.games) {
  if (!game.art || (only && !only.has(game.slot))) continue;
  await kluczowyArt(`${game.slot}-art`, game.appid, game.art.opis, MASTER);
}

// --- скриншоты по играм ---
for (const game of manifest.games) {
  if (only && !only.has(game.slot)) continue;

  for (const wpis of game.zrzuty ?? []) {
    const key = `${game.slot}-k${String(wpis.i).padStart(2, '0')}`;
    if (!nuzhno(key)) {
      console.log(`есть    ${key.padEnd(11)} файл и запись на месте`);
      continue;
    }
    const details = await appDetails(game.appid);
    const shots = details.screenshots ?? [];
    let index = wpis.i;
    let shot = shots[index];
    // Порядок списка Steam не обещан: кадр ищется по хешу, имя файла остаётся.
    if (wpis.ss && (!shot || hashZrzutu(shot) !== wpis.ss)) {
      const found = shots.findIndex((s) => hashZrzutu(s) === wpis.ss);
      if (found < 0) {
        console.warn(`НЕТ     ${key.padEnd(11)} скриншот ss ${wpis.ss} исчез с витрины`);
        continue;
      }
      console.warn(`        ${key}: порядок списка Steam сменился — ss ${wpis.ss} теперь [${found}], имя файла прежнее`);
      index = found;
      shot = shots[index];
    }
    if (!shot) {
      console.warn(`НЕТ     ${key.padEnd(11)} у ${details.name} нет скриншота [${wpis.i}]`);
      continue;
    }
    console.log(`${dryRun ? 'взял бы' : 'качаю  '} ${key.padEnd(11)} ${details.name} — скриншот [${wpis.i}]: ${wpis.opis}`);
    if (dryRun) continue;
    await sleep(400);
    const bytes = Buffer.from(await (await politeFetch(shot.path_full)).arrayBuffer());
    const size = await save(bytes, join(outDir, `${key}.jpg`));
    credits[key] = {
      file: `${key}.jpg`,
      game: details.name,
      appid: game.appid,
      kind: `screenshot [${wpis.i}]`,
      shot: wpis.i,
      ss: hashZrzutu(shot),
      opis: wpis.opis ?? null,
      license: LICENSE,
      source: `https://store.steampowered.com/app/${game.appid}/`,
      ...size,
    };
    pobrano += 1;
    zapisz();
    vshit(key);
  }
}

console.log(dryRun ? '\nПроба: ничего не записано.' : `\nСкачано позиций: ${pobrano}.`);
