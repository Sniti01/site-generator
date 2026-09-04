#!/usr/bin/env node
/**
 * Pobiera materiały gier z witryny Steam według src/data/games.json:
 * kluczowy art (library_hero), okładkę 3:4 (library_600x900) i zrzut ekranu.
 * To ten sam zestaw, z którego żyje każdy serwis o grach.
 *
 *   node tools/fetch-game-art.mjs               — pobiera brakujące
 *   node tools/fetch-game-art.mjs --dry-run     — pokazuje, co by wziął
 *   node tools/fetch-game-art.mjs --force
 *   node tools/fetch-game-art.mjs --only londyn,hero
 *   node tools/fetch-game-art.mjs --shots japonia   — wypisuje wszystkie
 *                                 zrzuty gry, żeby wybrać indeks do games.json
 *
 * UWAGA PRAWNA, świadomie zapisana w kodzie: to są materiały wydawcy, bez
 * wolnej licencji. Używamy ich do identyfikacji gier, o których są poradniki.
 * Logotypów gier (logo.png) skrypt NIE pobiera — własna identyfikacja serwisu
 * nie może korzystać z symboliki wydawcy (PRODUCT.md).
 */

import sharp from 'sharp';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src/assets/gry');
const manifestPath = join(root, 'src/data/games.json');
const creditsPath = join(root, 'src/data/game-art.json');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const pick = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : null;
};
const only = pick('--only') ? new Set(pick('--only').split(',')) : null;
const shotsFor = pick('--shots');

const CDN = 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps';
const UA = 'bractwo-site-generator/0.1 (statyczny serwis o grach)';
const MASTER = 1920;
// Pierwszy ekran ma panel prawie kwadratowy, a banner biblioteki jest 3:1 —
// przy object-fit: cover zrodlo jest skalowane w gore o polowe i widac miekkosc.
// Wariant 2x (3840x1240) wchodzi z pomniejszeniem, wiec zostaje ostry.
const MASTER_HERO = 3840;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function politeFetch(url, { attempts = 3 } = {}) {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': UA } });
    if (response.ok) return response;
    if ((response.status !== 429 && response.status !== 503) || attempt === attempts) {
      throw new Error(`Steam ${response.status}: ${url}`);
    }
    const wait = 2000 * attempt;
    console.log(`          ${response.status} — czekam ${wait / 1000}s`);
    await sleep(wait);
  }
}

async function appDetails(appid) {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&filters=basic,screenshots`;
  await sleep(900);
  const data = await (await politeFetch(url)).json();
  const entry = data[String(appid)];
  if (!entry?.success) throw new Error(`Steam nie zna appid ${appid}`);
  return entry.data;
}

/** Zapisuje obraz: master do rozsądnej szerokości i zawsze przekodowany —
 *  pliki ze Steama bywają po półtora megabajta bez potrzeby. */
async function save(bytes, target, maxWidth = MASTER) {
  const pipeline = sharp(bytes);
  const meta = await pipeline.metadata();
  const out = await (meta.width > maxWidth ? sharp(bytes).resize({ width: maxWidth }) : sharp(bytes))
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  writeFileSync(target, out);
  const final = await sharp(out).metadata();
  return { width: final.width, height: final.height };
}

/** Starsze gry nie mają nowych materiałów biblioteki — schodzimy po liście. */
async function pobierzOkladke(appid) {
  const kandydaci = [
    { plik: 'library_600x900.jpg', szer: 600 },
    { plik: 'capsule_616x353.jpg', szer: 616 },
    { plik: 'header.jpg', szer: 460 },
  ];
  for (const kandydat of kandydaci) {
    try {
      await sleep(400);
      const response = await politeFetch(`${CDN}/${appid}/${kandydat.plik}`, { attempts: 1 });
      return { bytes: Buffer.from(await response.arrayBuffer()), ...kandydat };
    } catch {
      // brak tego wariantu, próbujemy następnego
    }
  }
  return null;
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

// Tryb podglądu zrzutów: nic nie pobiera, tylko wypisuje listę z indeksami.
if (shotsFor) {
  const game =
    shotsFor === 'hero'
      ? manifest.hero
      : manifest.games.find((item) => item.era === shotsFor);
  if (!game) {
    console.error(`Nie znam "${shotsFor}" w src/data/games.json`);
    process.exit(1);
  }
  const details = await appDetails(game.appid);
  console.log(`${details.name} — ${details.screenshots.length} zrzutow:`);
  details.screenshots.forEach((shot, index) => {
    console.log(`  [${index}] ${shot.path_full}`);
  });
}

// Tryb pobierania.
if (!shotsFor) {

const credits = existsSync(creditsPath) ? JSON.parse(readFileSync(creditsPath, 'utf8')) : {};
if (!dryRun) mkdirSync(outDir, { recursive: true });

let pobrane = 0;

// --- kluczowy art na pierwszy ekran ---
if (!only || only.has('hero')) {
  const target = join(outDir, 'hero.jpg');
  if (force || !existsSync(target) || !credits.hero) {
    const details = await appDetails(manifest.hero.appid);
    let wariant = 'library_hero_2x.jpg';
    let bytes = null;
    if (!dryRun) {
      await sleep(500);
      try {
        bytes = Buffer.from(
          await (
            await politeFetch(`${CDN}/${manifest.hero.appid}/${wariant}`, { attempts: 1 })
          ).arrayBuffer(),
        );
      } catch {
        wariant = 'library_hero.jpg';
        await sleep(400);
        bytes = Buffer.from(
          await (await politeFetch(`${CDN}/${manifest.hero.appid}/${wariant}`)).arrayBuffer(),
        );
      }
    }
    console.log(`${dryRun ? 'wybrano ' : 'pobieram'} hero        ${details.name} — ${wariant}`);
    if (!dryRun) {
      const size = await save(bytes, target, MASTER_HERO);
      credits.hero = {
        file: 'hero.jpg',
        game: details.name,
        appid: manifest.hero.appid,
        kind: `kluczowy art (${wariant})`,
        source: `https://store.steampowered.com/app/${manifest.hero.appid}/`,
        ...size,
      };
      pobrane += 1;
    }
  } else {
    console.log('pominiete hero        plik juz jest');
  }
}

// --- zrzut ekranu i okładka na każdą epokę ---
for (const game of manifest.games) {
  if (only && !only.has(game.era)) continue;

  const shotTarget = join(outDir, `${game.era}.jpg`);
  const coverTarget = join(outDir, `${game.era}-okladka.jpg`);
  if (!force && existsSync(shotTarget) && credits[game.era]) {
    console.log(`pominiete ${game.era.padEnd(11)} pliki juz sa`);
    continue;
  }

  const details = await appDetails(game.appid);
  const shots = details.screenshots ?? [];
  const index = Math.min(game.shot ?? 0, shots.length - 1);
  const shot = shots[index];
  if (!shot) {
    console.warn(`BRAK      ${game.era.padEnd(11)} ${details.name} nie ma zrzutow`);
    continue;
  }

  console.log(`${dryRun ? 'wybrano ' : 'pobieram'} ${game.era.padEnd(11)} ${details.name}`);
  if (dryRun) continue;

  // Zrzut, nie library_hero: banner biblioteki ma proporcje 3:1 i bohatera
  // dosunietego do prawej krawedzi, wiec w panelu 21:13 zostaje z niego pusty
  // plan. Zrzuty sa 16:9 i kadruja sie czysto. Indeks wybrany recznie tak,
  // zeby nie bylo HUD-u ani znaku wodnego — patrz uwaga w games.json.
  const zrodlo = `zrzut ekranu [${index}]`;
  await sleep(400);
  const bytes = Buffer.from(await (await politeFetch(shot.path_full)).arrayBuffer());
  const shotSize = await save(bytes, shotTarget);

  const okladka = await pobierzOkladke(game.appid);
  const coverSize = okladka ? await save(okladka.bytes, coverTarget, okladka.szer) : null;
  if (!okladka) {
    console.log(`          ${details.name}: brak materialu okladki w witrynie`);
  }

  credits[game.era] = {
    file: `${game.era}.jpg`,
    cover: okladka ? `${game.era}-okladka.jpg` : null,
    game: details.name,
    appid: game.appid,
    kind: zrodlo,
    shot: zrodlo.startsWith('zrzut') ? index : null,
    source: `https://store.steampowered.com/app/${game.appid}/`,
    ...shotSize,
    coverWidth: coverSize?.width ?? null,
    coverHeight: coverSize?.height ?? null,
  };
  pobrane += 1;
  writeFileSync(creditsPath, `${JSON.stringify(credits, null, 2)}\n`, 'utf8');
}

if (!dryRun) {
  writeFileSync(creditsPath, `${JSON.stringify(credits, null, 2)}\n`, 'utf8');
}

console.log(dryRun ? '\nProba: nic nie zapisano.' : `\nPobrano ${pobrane} pozycji.`);
}
