#!/usr/bin/env node
// Gate: struktura witryny zgadza się z kontraktem i z semantyką, z której
// powstała. Umowa opisana jest w `core/structure/schema.json`, słownik nazw
// bloków w `core/structure/blocks.json`.
//
// Po co bramka, skoro plik i tak czyta się oczami. Bo rozjazd struktury
// z semantyką jest cichy: zapytanie wypada z rozliczenia i nie ma tego kto
// zauważyć, dwa klastry o wspólnym wyniku wyszukiwania zjadają się nawzajem
// dopiero po miesiącu, a duplikat `title` widać wyłącznie w indeksie Google.
// To ten sam rodzaj milczącej awarii co zły `@source` — i tak samo trzeba
// go zamienić na kod wyjścia ≠ 0.
//
// Podział odpowiedzialności ten sam co przy zasobach i kontraście: rachunek
// jest wspólny i mieszka w rdzeniu, dane są witryny — plik
// `<witryna>/structure/structure.json`, a wyliczenie semantyki wskazuje
// w nim pole `site.semantics`.
//
// PUSTE DRZEWO JEST POPRAWNE i oznacza etap przed S2: kontrakt już jest,
// stron jeszcze nie ma. Bramka sprawdza wtedy nagłówek witryny i przechodzi.
// BRAK PLIKU poprawny nie jest — nie da się go odróżnić od zapomnianego.
//
// Reguły liczbowe (MAX_DEPTH, próg przecięcia wyników) są danymi schematu,
// nie stałymi w tym pliku: próg zaszyty w kodzie za miesiąc nikogo nie znajdzie.
//
// Samosprawdzenie: `node core/gates/check-structure.mjs --selftest` puszcza
// walidator po przypadkach z `core/structure/fixtures/selftest.json` — jeden
// poprawny i po jednym na każdą regułę. Bramka, której nikt nie widział
// upadającej, jest obietnicą, a nie sprawdzeniem.

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const coreRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

const SCHEMA = join(coreRoot, 'structure/schema.json');
const BLOCKS = join(coreRoot, 'structure/blocks.json');
const FIXTURES = join(coreRoot, 'structure/fixtures/selftest.json');

/* ---------------------------------------------------------------- *
 * Semantyka: z wyliczenia klastrów robimy to, czego potrzebują reguły.
 * ---------------------------------------------------------------- */

/** @returns {{phrases: Map<string, {cluster: string, urls: string[]}>, urlsByCluster: Map<string, Set<string>>, clusters: Set<string>}} */
function shapeSemantics(rows) {
  const phrases = new Map();
  const urlsByCluster = new Map();
  const clusters = new Set();
  for (const row of rows) {
    phrases.set(row.phrase, { cluster: row.cluster, urls: row.urls ?? [] });
    if (!row.cluster) continue;
    clusters.add(row.cluster);
    if (!urlsByCluster.has(row.cluster)) urlsByCluster.set(row.cluster, new Set());
    for (const u of row.urls ?? []) urlsByCluster.get(row.cluster).add(u);
  }
  return { phrases, urlsByCluster, clusters };
}

/** Domyślne wczytanie semantyki: xlsx wskazany przez `site.semantics`. */
async function loadSemanticsFromSite(siteRoot, site) {
  const path = join(siteRoot, site.semantics);
  if (!existsSync(path)) {
    throw new Error(`semantyka nie istnieje: ${site.semantics} (pole site.semantics)`);
  }
  const { readClustering } = await import(pathToFileURL(join(coreRoot, 'structure/clustering.mjs')).href);
  const data = readClustering(path);
  return shapeSemantics(data.phrases.map((p) => ({ phrase: p.phrase, cluster: p.cluster, urls: p.urls })));
}

/* ---------------------------------------------------------------- *
 * Walidator: funkcja czysta, żeby dało się ją puścić po przypadkach.
 * ---------------------------------------------------------------- */

const depthOf = (url) => (url === '/' ? 0 : url.split('/').filter(Boolean).length);
const parentPathOf = (url) => {
  const parts = url.split('/').filter(Boolean);
  parts.pop();
  return parts.length ? `/${parts.join('/')}/` : '/';
};

export function validateStructure({ doc, semantics, blocks, schema }) {
  const errors = [];
  const err = (msg) => errors.push(msg);
  const rules = schema['правила'];
  const pageSchema = schema.page;
  const blockSchema = schema.blocks_item;

  /* — nagłówek witryny — */
  const site = doc.site;
  if (!site || typeof site !== 'object') {
    err('brak sekcji `site` — nagłówek witryny jest obowiązkowy');
    return { errors, stats: null };
  }
  for (const [field, spec] of Object.entries(schema.site)) {
    if (spec['обязательно'] && (site[field] === undefined || site[field] === null || site[field] === '')) {
      err(`site.${field}: pole obowiązkowe, a go nie ma`);
    }
  }
  if (site.total_queries !== undefined && semantics && site.total_queries !== semantics.phrases.size) {
    err(`site.total_queries = ${site.total_queries}, a w wyliczeniu jest ${semantics.phrases.size} zapytań`);
  }

  const pages = doc.pages ?? [];
  const exclusions = doc.exclusions ?? [];
  const noPage = doc.no_page ?? [];

  /* — pola stron, zamknięte listy, kształt adresu — */
  const urlRe = new RegExp(rules['url_образец']);
  const byUrl = new Map();
  for (const [i, page] of pages.entries()) {
    const where = `pages[${i}] ${page.url ?? '(bez url)'}`;

    for (const [field, spec] of Object.entries(pageSchema)) {
      const value = page[field];
      const missing = value === undefined || (spec['тип'] !== 'строка | null' && value === null);
      if (spec['обязательно'] && missing) {
        err(`${where}: brak obowiązkowego pola \`${field}\``);
        continue;
      }
      if (missing || value === null) continue;
      if (spec['значения'] && !spec['значения'].includes(value)) {
        err(`${where}: \`${field}\` = ${JSON.stringify(value)}, a lista zamknięta to ${spec['значения'].join(', ')}`);
      }
    }

    if (typeof page.url === 'string') {
      if (!urlRe.test(page.url)) err(`${where}: adres nie pasuje do wzorca ${rules['url_образец']}`);
      if (byUrl.has(page.url)) err(`${where}: adres powtórzony`);
      byUrl.set(page.url, page);
      if (depthOf(page.url) > rules.MAX_DEPTH) {
        err(`${where}: głębokość ${depthOf(page.url)}, a MAX_DEPTH = ${rules.MAX_DEPTH}`);
      }
    }

    // Bez klastra wolno żyć dwóm stronom: właściciela — ta stoi poza progiem
    // częstotliwości — i służbowej, bo polityka prywatności popytu w wyszukiwarce
    // nie ma z definicji, a poza strukturą strona istnieć nie może (P24,
    // rozwidlenie 1). Decyzja właściciela z 2026-09-08, punkt W2.
    if (page.cluster === null && page.owner !== true && page.type !== 'legal') {
      err(`${where}: \`cluster: null\` wolno tylko stronie właściciela (\`owner: true\`) albo służbowej (\`type: legal\`)`);
    }
    if (page.cluster && semantics && !semantics.clusters.has(page.cluster)) {
      err(`${where}: klaster «${page.cluster}» nie występuje w wyliczeniu`);
    }
    if (Array.isArray(page.keywords) && page.keywords.length === 0 && page.owner !== true && page.type !== 'legal') {
      err(`${where}: pusta lista \`keywords\` — strona bez popytu; wolno to tylko stronie właściciela albo służbowej`);
    }

    /* — bloki — */
    for (const [k, item] of (page.blocks ?? []).entries()) {
      const bwhere = `${where}: blocks[${k}]`;
      for (const [field, spec] of Object.entries(blockSchema)) {
        const value = item[field];
        if (spec['обязательно'] && (value === undefined || value === null || value === '')) {
          err(`${bwhere}: brak obowiązkowego pola \`${field}\``);
          continue;
        }
        if (value === undefined || value === null) continue;
        if (spec['значения'] && !spec['значения'].includes(value)) {
          err(`${bwhere}: \`${field}\` = ${JSON.stringify(value)}, a lista zamknięta to ${spec['значения'].join(', ')}`);
        }
      }
      const known = blocks['блоки'][item.block];
      if (!known) {
        err(`${bwhere}: nazwa «${item.block}» spoza słownika rdzenia (core/structure/blocks.json)`);
      } else if (known['уровень'] !== 'секция') {
        err(`${bwhere}: «${item.block}» to ${known['уровень']}, a w \`blocks[]\` stoją tylko sekcje`);
      }
      if (item.evidence && item.source !== 'anatomy') {
        err(`${bwhere}: \`evidence\` wolno tylko przy \`source: anatomy\``);
      }
    }
  }

  /* — jedna strona główna, rodzice, sieroty, spójność fali — */
  const homes = pages.filter((p) => p.parent === null);
  if (pages.length > 0) {
    if (homes.length === 0) err('nie ma strony bez rodzica — drzewo nie ma korzenia');
    if (homes.length > 1) err(`stron bez rodzica jest ${homes.length}: ${homes.map((p) => p.url).join(', ')}`);
  }
  for (const page of pages) {
    if (page.parent === null || page.parent === undefined) continue;
    if (!byUrl.has(page.parent)) {
      err(`${page.url}: rodzic «${page.parent}» nie istnieje — sierota`);
      continue;
    }
    if (page.parent !== parentPathOf(page.url)) {
      err(`${page.url}: rodzic to «${page.parent}», a adres wskazuje na «${parentPathOf(page.url)}» — okruszki rozjadą się z adresem`);
    }
    if (page.wave === 1 && byUrl.get(page.parent).wave !== 1) {
      err(`${page.url}: strona fali 1, a jej rodzic «${page.parent}» jest w fali ${byUrl.get(page.parent).wave} (część D.1)`);
    }
  }
  for (const page of pages) {
    for (const rel of page.related ?? []) {
      if (!byUrl.has(rel)) err(`${page.url}: \`related\` wskazuje na nieistniejące «${rel}»`);
    }
  }

  /* — globalna jednoznaczność title, description, h1 — */
  for (const field of ['title', 'description', 'h1']) {
    const seen = new Map();
    for (const page of pages) {
      const value = page[field];
      if (typeof value !== 'string') continue;
      if (seen.has(value)) err(`\`${field}\` powtórzone: «${value}» na ${seen.get(value)} i ${page.url}`);
      else seen.set(value, page.url);
    }
  }

  /* — rozliczenie: każde zapytanie dokładnie raz — */
  let tally = null;
  if (semantics && (pages.length || exclusions.length || noPage.length)) {
    const places = new Map();
    const put = (query, place) => {
      if (!places.has(query)) places.set(query, []);
      places.get(query).push(place);
    };
    for (const page of pages) for (const kw of page.keywords ?? []) put(kw, `strona ${page.url}`);
    for (const [i, row] of exclusions.entries()) {
      if (!row.query || !row.reason) err(`exclusions[${i}]: obowiązkowe są \`query\` i \`reason\``);
      if (row.query) put(row.query, 'exclusions');
    }
    for (const [i, row] of noPage.entries()) {
      if (!row.query || !row.reason) err(`no_page[${i}]: obowiązkowe są \`query\` i \`reason\``);
      if (row.query) put(row.query, 'no_page');
      if (row.mentioned_on && !byUrl.has(row.mentioned_on)) {
        err(`no_page[${i}]: \`mentioned_on\` wskazuje na nieistniejące «${row.mentioned_on}»`);
      }
    }
    for (const [query, list] of places) {
      if (list.length > 1) err(`zapytanie «${query}» rozliczone ${list.length} razy: ${list.join(', ')}`);
      if (!semantics.phrases.has(query)) err(`zapytanie «${query}» (${list[0]}) nie występuje w wyliczeniu — sprawdź znak w znak`);
    }
    const lost = [...semantics.phrases.keys()].filter((q) => !places.has(q));
    if (lost.length) {
      err(`zapytań nierozliczonych: ${lost.length} — ani strona, ani exclusions, ani no_page. Pierwsze: ${lost.slice(0, 5).map((q) => `«${q}»`).join(', ')}`);
    }
    tally = {
      strony: pages.reduce((s, p) => s + (p.keywords?.length ?? 0), 0),
      exclusions: exclusions.length,
      no_page: noPage.length,
      wyliczenie: semantics.phrases.size,
      zgubione: lost.length,
    };
  }

  /* — antykanibalizacja — */
  if (semantics) {
    const withCluster = pages.filter((p) => p.cluster && semantics.urlsByCluster.has(p.cluster));
    for (let i = 0; i < withCluster.length; i++) {
      for (let j = i + 1; j < withCluster.length; j++) {
        const a = withCluster[i];
        const b = withCluster[j];
        if (a.cluster === b.cluster) {
          err(`${a.url} i ${b.url} stoją na tym samym klastrze «${a.cluster}» — jeden klaster to jedna strona`);
          continue;
        }
        const A = semantics.urlsByCluster.get(a.cluster);
        const B = semantics.urlsByCluster.get(b.cluster);
        if (!A.size || !B.size) continue;
        let common = 0;
        for (const u of A) if (B.has(u)) common += 1;
        // Dzielimy przez mniejszy wynik: cztery wspólne adresy przy wyniku
        // czteroelementowym to pokrycie całkowite, a nie 40 procent.
        const share = common / Math.min(A.size, B.size);
        if (share >= rules['пересечение_топов']) {
          err(
            `${a.url} («${a.cluster}») i ${b.url} («${b.cluster}»): wyniki wyszukiwania pokrywają się w ${Math.round(share * 100)} % ` +
              `(${common} wspólnych adresów) — próg to ${Math.round(rules['пересечение_топов'] * 100)} %`
          );
        }
      }
    }
  }

  const stats = {
    stron: pages.length,
    poziomy: pages.length ? Math.max(...pages.map((p) => depthOf(p.url ?? '/'))) : 0,
    fala1: pages.filter((p) => p.wave === 1).length,
    fala2: pages.filter((p) => p.wave === 2).length,
    tally,
  };
  return { errors, stats };
}

/* ---------------------------------------------------------------- *
 * Bramka.
 * ---------------------------------------------------------------- */

export default async function checkStructure(siteRoot, opts = {}) {
  const docPath = join(siteRoot, 'structure/structure.json');

  if (!existsSync(docPath)) {
    console.error(`BRAK DANYCH: ${docPath} nie istnieje — witryna nie mówi, jakie ma strony.`);
    console.error('Puste drzewo jest poprawne (pages: []); brak pliku nie jest — nie da się go odróżnić od zapomnianego.');
    return false;
  }

  let doc;
  try {
    doc = readJson(docPath);
  } catch (e) {
    console.error(`ZŁE DANE: ${docPath} nie daje się rozebrać — ${e.message}`);
    return false;
  }

  const schema = readJson(SCHEMA);
  const blocks = readJson(BLOCKS);

  let semantics = null;
  const emptyTree = !(doc.pages?.length || doc.exclusions?.length || doc.no_page?.length);
  if (!emptyTree) {
    try {
      const load = opts.loadSemantics ?? loadSemanticsFromSite;
      semantics = await load(siteRoot, doc.site ?? {});
    } catch (e) {
      console.error(`ZŁE DANE: ${e.message}`);
      return false;
    }
  }

  const { errors, stats } = validateStructure({ doc, semantics, blocks, schema });

  if (emptyTree) {
    console.log('Struktura: kontrakt jest, drzewa jeszcze nie ma (pages: 0) — etap przed S2. Bramka przechodzi.');
    if (errors.length === 0) return true;
  }

  for (const e of errors) console.error(`  ${e}`);

  if (stats && !emptyTree) {
    const t = stats.tally;
    console.log(
      `Struktura: ${stats.stron} stron (fala 1: ${stats.fala1}, fala 2: ${stats.fala2}), ` +
        `zagnieżdżenie ${stats.poziomy}, ${schema['правила'].MAX_DEPTH} dozwolone.`
    );
    if (t) {
      console.log(
        `Rozliczenie zapytań: ${t.strony} na stronach + ${t.exclusions} exclusions + ${t.no_page} no_page ` +
          `wobec ${t.wyliczenie} w wyliczeniu.`
      );
    }
  }

  if (errors.length > 0) {
    console.error(`Struktura: ${errors.length} niezgodności z kontraktem.`);
    return false;
  }
  if (!emptyTree) console.log('Struktura: zgodna z kontraktem.');
  return true;
}

/* ---------------------------------------------------------------- *
 * Samosprawdzenie walidatora.
 * ---------------------------------------------------------------- */

function applyPatch(doc, patch) {
  const copy = structuredClone(doc);
  for (const [path, value] of Object.entries(patch)) {
    const parts = path.split('.');
    const last = parts.pop();
    let node = copy;
    for (const part of parts) node = node[/^\d+$/.test(part) ? Number(part) : part];
    const key = /^\d+$/.test(last) ? Number(last) : last;
    if (value === '__usuń__') {
      if (Array.isArray(node)) node.splice(key, 1);
      else delete node[key];
    } else {
      if (Array.isArray(node) && key === node.length) node.push(value);
      else node[key] = value;
    }
  }
  return copy;
}

async function selftest() {
  const cases = readJson(FIXTURES);
  const schema = readJson(SCHEMA);
  const blocks = readJson(BLOCKS);
  const semantics = shapeSemantics(cases['семантика']);

  let failed = 0;
  for (const test of cases['случаи']) {
    const doc = applyPatch(cases.base, test['правка'] ?? {});
    const { errors } = validateStructure({ doc, semantics, blocks, schema });
    const hit = test['ждём'] === null ? errors.length === 0 : errors.some((e) => e.includes(test['ждём']));
    if (!hit) failed += 1;
    const mark = hit ? 'ok  ' : 'ŹLE ';
    const what = test['ждём'] === null ? 'bez błędów' : `błąd zawiera «${test['ждём']}»`;
    console.log(`${mark} ${test['имя'].padEnd(26)} ${what}${hit ? '' : ` — dostaliśmy: ${errors.join(' | ') || 'nic'}`}`);
  }

  console.log(`\n${cases['случаи'].length - failed}/${cases['случаи'].length} przypadków walidatora zachowuje się jak umówiono.`);
  return failed === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ok = process.argv.includes('--selftest')
    ? await selftest()
    : await checkStructure(process.argv[2] ? resolve(process.argv[2]) : process.cwd());
  if (!ok) process.exit(1);
}
