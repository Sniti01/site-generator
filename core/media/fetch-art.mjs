#!/usr/bin/env node
/**
 * Pobiera zdjęcia epok z Wikimedia Commons według manifestu `src/data/art.json`
 * WITRYNY, której korzeń dostaje pierwszym argumentem.
 *
 *   node core/media/fetch-art.mjs <korzeń witryny>             — pobiera brakujące
 *   node core/media/fetch-art.mjs <korzeń> --dry-run           — tylko pokazuje, co by wybrał
 *   node core/media/fetch-art.mjs <korzeń> --force             — pobiera wszystko od nowa
 *   node core/media/fetch-art.mjs <korzeń> --only hero,londyn
 *
 * Bez argumentu bierze katalog bieżący — tak samo jak `core/gates/run.mjs`.
 *
 * Bierze wyłącznie licencje, które wolno użyć komercyjnie i zmodyfikować
 * (kadrowanie, duoton), a autora razem z licencją zapisuje do
 * `src/data/art-credits.json` witryny. Podpis pod zdjęciem stawia potem
 * komponent — atrybucji nikt nie przepisuje ręcznie.
 *
 * WYNIESIONE Z `sites/ac4bf-thewatch.com/tools/` 2026-09-10, trzecim
 * i ostatnim krokiem P3 (`docs/REUSE.md` §6, П29 p. 5). Adres wzięty
 * z `REUSE` §1.5, graf «Куда w `core/`».
 *
 * `sharp` JEST ZADEKLAROWANY W `core/package.json` JAKO PEER, i to nie
 * formalność. Przed wyniesieniem pakiet stał wyłącznie w `devDependencies`
 * witryny, a fizycznie leżał w korzeniu repozytorium przez hoisting
 * workspace'ów — czyli po przeprowadzce import rozwiązałby się sam, cicho,
 * a rdzeń miałby zależność, której nigdzie nie zgłosił. Cena deklaracji jest
 * zerowa: `sharp` to `optionalDependencies` samego Astro (7.2.10), więc
 * każda witryna na Astro już go ma. Rdzeń zostaje bez `dependencies` —
 * ta sama zasada, dla której `core/accept/pixels.mjs` czyta PNG własnym
 * kodem zamiast ciągnąć pakiet binarny.
 */

import sharp from 'sharp';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const onlyArg = args.indexOf('--only');
const only = onlyArg >= 0 && args[onlyArg + 1] ? new Set(args[onlyArg + 1].split(',')) : null;

// KORZEŃ WITRYNY PRZYCHODZI ARGUMENTEM, nie liczy się od miejsca modułu.
// Przed wyniesieniem stały tu trzy ścieżki liczone od `import.meta.url` —
// po przeprowadzce do `core/media/` czytałyby `core/src/data/art.json`
// i pisały do `core/src/assets/foto/`. To ta sama pułapka, którą `REUSE` §6
// opisał dla względnego globa, tylko głośniejsza: `readFileSync` wywala się
// z ENOENT zamiast milczeć. Idiom wzięty z `core/gates/run.mjs`
// i `core/accept/selftest.mjs`: argument albo katalog bieżący.
const siteRoot = args[0] && !args[0].startsWith('--') ? resolve(args[0]) : process.cwd();
const outDir = join(siteRoot, 'src/assets/foto');
const creditsPath = join(siteRoot, 'src/data/art-credits.json');
const manifestPath = join(siteRoot, 'src/data/art.json');

// Wikimedia prosi o opisowy User-Agent. Bez niego API potrafi odmówić.
const UA = 'bractwo-site-generator/0.1 (statyczny serwis o grach; skrypt pobierania ilustracji)';

// Licencje wolne do użytku komercyjnego i modyfikacji. Klucz to początek
// maszynowego kodu licencji z extmetadata; rank — im niżej, tym mniej warunków.
const ALLOWED = [
  { prefix: 'cc0', rank: 0 },
  { prefix: 'pd', rank: 0 },
  { prefix: 'cc-by-4.0', rank: 1 },
  { prefix: 'cc-by-3.0', rank: 1 },
  { prefix: 'cc-by-2.5', rank: 1 },
  { prefix: 'cc-by-2.0', rank: 1 },
  { prefix: 'cc-by-sa-4.0', rank: 2 },
  { prefix: 'cc-by-sa-3.0', rank: 2 },
  { prefix: 'cc-by-sa-2.5', rank: 2 },
  { prefix: 'cc-by-sa-2.0', rank: 2 },
];

// Globalnie odpada wszystko, co nie jest zdjęciem widoku.
const REJECT_WORDS = [
  'map',
  'karte',
  'plan',
  'diagram',
  'coat of arms',
  'logo',
  'seal',
  'flag',
  'chart',
  'stamp',
  'coin',
  'banknote',
  'manuscript',
  'letter',
  'document',
  'title page',
  'portrait of',
];

const stripHtml = (value) =>
  String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Dopasowanie po całych słowach: „plan" nie ma trafiać w „esplanade". */
function hasPhrase(haystack, phrases) {
  return phrases.some((phrase) => {
    const escaped = phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, 'i').test(haystack);
  });
}

function licenceOf(meta) {
  const code = String(meta?.License?.value ?? '').toLowerCase();
  return ALLOWED.find((entry) => code.startsWith(entry.prefix)) ?? null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Commons odpowiada 429, kiedy pytać za szybko. Odstęp między zapytaniami plus
 * ponowienie z rosnącą przerwą — inaczej skrypt wywala się w połowie listy.
 */
async function politeFetch(url, { attempts = 4 } = {}) {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': UA } });
    if (response.ok) return response;
    if ((response.status !== 429 && response.status !== 503) || attempt === attempts) {
      throw new Error(`Commons ${response.status}: ${url}`);
    }
    const wait = 2000 * 2 ** (attempt - 1);
    console.log(`          ${response.status} — czekam ${wait / 1000}s i ponawiam`);
    await sleep(wait);
  }
}

async function search(query, slot) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.search = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: '40',
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata',
    iiurlwidth: '2400',
    format: 'json',
  }).toString();

  await sleep(1200);
  const response = await politeFetch(url);
  const data = await response.json();
  const pages = Object.values(data?.query?.pages ?? {});

  const candidates = [];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info) continue;

    const meta = info.extmetadata ?? {};
    const licence = licenceOf(meta);
    if (!licence) continue;
    if (info.width < slot.minWidth) continue;

    const title = page.title.replace(/^File:/, '');
    const lower = title.toLowerCase();
    if (hasPhrase(lower, REJECT_WORDS)) continue;
    if (!hasPhrase(lower, slot.must)) continue;
    if (hasPhrase(lower, slot.avoid)) continue;

    candidates.push({
      title,
      width: info.width,
      height: info.height,
      aspect: info.width / info.height,
      download: info.thumburl || info.url,
      source: info.descriptionurl,
      author: stripHtml(meta.Artist?.value) || stripHtml(meta.Credit?.value) || 'nieznany',
      license: stripHtml(meta.LicenseShortName?.value) || licence.prefix.toUpperCase(),
      licenseUrl: meta.LicenseUrl?.value ?? '',
      rank: licence.rank,
    });
  }
  return candidates;
}

/** Im bliżej szerokiego kadru, im większy oryginał i im swobodniejsza
 *  licencja, tym lepiej. Kadr węższy niż minAspect odpada całkiem. */
function score(candidate, slot) {
  if (candidate.aspect < slot.minAspect) return -1;
  const aspectFit = 1 / (1 + Math.abs(candidate.aspect - 1.7));
  const size = Math.min(candidate.width / 4000, 1);
  const licence = (3 - candidate.rank) / 3;
  return aspectFit * 0.5 + size * 0.3 + licence * 0.2;
}

async function pick(slot) {
  for (const query of slot.queries) {
    const ranked = (await search(query, slot))
      .map((candidate) => ({ candidate, value: score(candidate, slot) }))
      .filter((entry) => entry.value > 0)
      .sort((a, b) => b.value - a.value);
    if (ranked.length) return { ...ranked[0].candidate, query };
  }
  return null;
}

const wszystkie = JSON.parse(readFileSync(manifestPath, 'utf8')).slots;
const slots = wszystkie.filter((slot) => !only || only.has(slot.id));
const credits = existsSync(creditsPath) ? JSON.parse(readFileSync(creditsPath, 'utf8')) : {};

// PRÓBA ŻYWOTNOŚCI ŚCIEŻEK, drukowana zawsze i przed pierwszym zapytaniem.
// Obowiązkowa po wyniesieniu z tego samego powodu, dla którego nagłówek
// `core/gates/check-assets.mjs` żąda jednorazowej próby żywotności globa:
// narzędzie w rdzeniu nie ma jak pokazać, że trafia do WITRYNY, a nie obok
// niej. Liczby w tych trzech wierszach są tym dowodem — i tym, co odczyta
// każdy, kto uruchomi narzędzie z niewłaściwego katalogu.
console.log(`korzeń witryny: ${siteRoot}`);
console.log(`manifest:       ${manifestPath} — slotów ${wszystkie.length}, w robocie ${slots.length}`);
console.log(
  `zapis:          ${outDir} (${existsSync(outDir) ? 'jest' : 'będzie utworzony'}), ` +
    `atrybucje ${creditsPath} — wpisów ${Object.keys(credits).length}`,
);

if (!dryRun) mkdirSync(outDir, { recursive: true });

let pobrane = 0;
let pominiete = 0;
let puste = 0;

for (const slot of slots) {
  const file = `${slot.id}.jpg`;
  const target = join(outDir, file);

  if (!force && existsSync(target) && credits[slot.id]) {
    console.log(`pominiete ${slot.id.padEnd(12)} plik juz jest (--force nadpisze)`);
    pominiete += 1;
    continue;
  }

  const chosen = await pick(slot);
  if (!chosen) {
    console.warn(
      `BRAK      ${slot.id.padEnd(12)} zadne zapytanie nie dalo kadru — popraw queries w src/data/art.json`,
    );
    puste += 1;
    continue;
  }

  const aspect = chosen.aspect.toFixed(2);
  console.log(
    `${dryRun ? 'wybrano  ' : 'pobieram '} ${slot.id.padEnd(12)} ${chosen.width}x${chosen.height} (${aspect}:1)  ${chosen.license}`,
  );
  console.log(`          "${chosen.query}" -> ${chosen.title}`);
  console.log(`          ${chosen.author}`);

  if (dryRun) continue;

  await sleep(800);
  const image = await politeFetch(chosen.download);
  let bytes = Buffer.from(await image.arrayBuffer());

  // Opcjonalne przycięcie w ułamkach boku: stare litografie miewają na dole
  // pas podpisów, a panoramy szew między płytami.
  if (slot.crop) {
    const pipeline = sharp(bytes);
    const { width, height } = await pipeline.metadata();
    const left = Math.round(width * (slot.crop.left ?? 0));
    const top = Math.round(height * (slot.crop.top ?? 0));
    const box = {
      left,
      top,
      width: Math.round(width * (1 - (slot.crop.left ?? 0) - (slot.crop.right ?? 0))),
      height: Math.round(height * (1 - (slot.crop.top ?? 0) - (slot.crop.bottom ?? 0))),
    };
    bytes = await sharp(bytes).extract(box).jpeg({ quality: 88 }).toBuffer();
    chosen.width = box.width;
    chosen.height = box.height;
    console.log(`          przyciete do ${box.width}x${box.height}`);
  }

  // Master schodzi do 2000px. Oryginały mają po 4–6 tys. pikseli, a Astro
  // kładzie plik źródłowy jako zapasowy `src` obok srcsetu — bez tego kroku
  // do dist trafia megabajt, którego żadna przeglądarka nie potrzebuje.
  const MASTER = 2000;
  const przed = await sharp(bytes).metadata();
  if (przed.width > MASTER) {
    bytes = await sharp(bytes).resize({ width: MASTER }).jpeg({ quality: 88 }).toBuffer();
    const po = await sharp(bytes).metadata();
    chosen.width = po.width;
    chosen.height = po.height;
    console.log(`          zmniejszone do ${po.width}x${po.height}`);
  }

  writeFileSync(target, bytes);

  credits[slot.id] = {
    file,
    author: chosen.author,
    license: chosen.license,
    licenseUrl: chosen.licenseUrl,
    source: chosen.source,
    title: chosen.title,
    width: chosen.width,
    height: chosen.height,
  };
  pobrane += 1;
}

if (!dryRun) {
  writeFileSync(creditsPath, `${JSON.stringify(credits, null, 2)}\n`, 'utf8');
}

console.log(
  `\n${dryRun ? 'Proba: nic nie zapisano.' : `Pobrano ${pobrane}, pominieto ${pominiete}.`}` +
    (puste ? ` Bez kadru: ${puste}.` : ''),
);
if (puste) process.exitCode = 1;
