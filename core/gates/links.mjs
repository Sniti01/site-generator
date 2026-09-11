// Bramka PO zbudowaniu, trzecia po `after-build.mjs` i `anchors.mjs`:
// KAŻDY link wewnętrzny prowadzi na adres ze struktury.
//
// Decyzja właściciela П42 (2026-09-11), przed pierwszą paczką tekstów fali 1:
// «gejt „widmo roni budowanie" — jeśli rama to nie cały serwis, rozszerzyć
// na wszystkie linki wewnętrzne DO paczki 1: teksty je rozmnożą». Do tego
// dnia adres spoza drzewa przerywał budowanie tylko tam, gdzie tytuł linku
// brano ze struktury przez `getPage` (listy warstw, taśma i stóg głównej,
// `related`). Linki z plików treści — `primary`, `secondary`, `cta`, `toc`,
// ręczne adresy w akapitach — i ze stopki nikt nie sprawdzał; 2026-09-11
// stopka niosła cztery widma na każdej stronie, a główna 43 z 53 adresów.
//
// RAMA — CAŁY SERWIS: strony z listy `pages` haka `astro:build:done`, jak
// u dwóch bramek obok (lekcja `after-build.mjs`: nie po `*.html` w dist).
// Sprawdzany jest każdy `href` względny od korzenia (`/…`) i bezwzględny
// tej samej domeny (`site` z konfiguracji). Adres bierze się bez fragmentu
// (`#…`) i bez zapytania (`?…`); `/_astro/` i pliki z rozszerzeniem
// (obrazy, ikona, mapa serwisu) nie są stronami i nie są sprawdzane;
// `#…`, `mailto:`, `tel:` i obce domeny — poza ramą. Komentarze HTML
// wycinane przed czytaniem (lekcja `after-build.mjs`).
//
// ŹRÓDŁO PRAWDY — `structure.json` witryny (П24 punkt 1): strona spoza
// struktury nie istnieje, więc link do niej wisi w próżni. Strona ze
// struktury JESZCZE NIE ZBUDOWANA linkiem-widmem nie jest: adres planowany
// różni się od adresu-widma, i dopóki treści nie ma, link czeka. Ścieżkę
// do struktury podaje konfiguracja witryny — rdzeń jej nie zgaduje.
//
// SĘDZIEGO OSĄDZONO PRZED ZAUFANIEM (reguła `CLAUDE.md`): bateria wzorców
// w `core/accept/selftest.mjs` — link do strony drzewa, widmo, fragment
// i zapytanie zdjęte, bezwzględny tej samej domeny, obca domena, `/_astro/`,
// plik z rozszerzeniem, brak końcowego ukośnika, komentarz, zero stron.
//
// CZEGO TA BRAMKA NIE ROBI: nie sprawdza, czy strona docelowa jest zbudowana
// (to powie struktura polem `status`, nie link); nie czyta `src`; nie ocenia,
// czy link prowadzi TAM, gdzie powinien.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { plikStrony } from './after-build.mjs';

const bezKomentarzy = (html) => html.replace(/<!--[\s\S]*?-->/g, '');

/** Wszystkie wartości `href` w dokumencie, w kolejności wystąpienia. */
function hrefy(html) {
  return [...html.matchAll(/\shref\s*=\s*"([^"]*)"/g)].map((m) => m[1]);
}

/**
 * Adres strony z `href` albo `null`, gdy `href` jest poza ramą bramki.
 * Czysta funkcja: to ją sprawdza bateria wzorców.
 * @param {string} href
 * @param {string|undefined} site — `site` z konfiguracji, np. `https://ac4bf-thewatch.com`
 * @returns {string|null}
 */
export function adresZHref(href, site) {
  let h = href.trim();
  if (!h || h.startsWith('#')) return null;
  if (/^(mailto|tel|javascript):/i.test(h)) return null;
  if (/^https?:\/\//i.test(h)) {
    if (!site) return null;
    const origin = site.replace(/\/+$/, '');
    if (!h.toLowerCase().startsWith(origin.toLowerCase() + '/') && h.toLowerCase() !== origin.toLowerCase()) return null;
    h = h.slice(origin.length) || '/';
  }
  if (!h.startsWith('/')) return null; // adres względny bez korzenia — poza ramą, trasa ich nie drukuje
  h = h.split('#')[0].split('?')[0];
  if (h.startsWith('/_astro/')) return null;
  if (/\.[a-z0-9]{2,5}$/i.test(h)) return null; // plik, nie strona
  return h;
}

/**
 * Ocena jednej strony: lista widm — adresów spoza `drzewo` — w kolejności
 * wystąpienia, bez powtórzeń. Pusta lista — strona w porządku.
 * @param {string} html
 * @param {Set<string>} drzewo — adresy ze struktury
 * @param {string|undefined} site
 * @returns {string[]}
 */
export function ocenLinki(html, drzewo, site) {
  const h = bezKomentarzy(html);
  const widma = [];
  for (const href of hrefy(h)) {
    const adres = adresZHref(href, site);
    if (adres === null) continue;
    if (!drzewo.has(adres) && !widma.includes(adres)) widma.push(adres);
  }
  return widma;
}

/**
 * Ocena zbioru stron: rzuca przy zerze stron i przy pierwszym widmie,
 * z pełną listą. Wejście — pary {pathname, html}.
 * @param {{pathname: string, html: string}[]} strony
 * @param {Set<string>} drzewo
 * @param {string|undefined} site
 * @returns {{stron: number, linkow: number}}
 */
export function ocenStronyLinki(strony, drzewo, site) {
  if (!strony.length) {
    throw new Error(
      'Zbudowano zero stron — bramka linków nie ma czego sprawdzać, a zielone «0 stron» ' +
        'byłoby prawdą o pustym zbiorze, nie o serwisie.'
    );
  }
  if (!drzewo.size) {
    throw new Error('Struktura bez adresów — bramka linków nie ma z czym porównać. Sprawdź ścieżkę do structure.json.');
  }
  const zle = [];
  let linkow = 0;
  for (const { pathname, html } of strony) {
    linkow += hrefy(bezKomentarzy(html)).filter((h) => adresZHref(h, site) !== null).length;
    // Główna przychodzi z haka jako pusty `pathname` — w odmowie ma być `/`, nie pusta kolumna.
    for (const adres of ocenLinki(html, drzewo, site)) zle.push({ pathname: pathname || '/', adres });
  }
  if (zle.length) {
    const opis = zle.map((z) => `  ${z.pathname}: ${z.adres}`).join('\n');
    throw new Error(
      `Linki do adresów spoza struktury — ${zle.length} na ${new Set(zle.map((z) => z.pathname)).size} z ${strony.length} stron:\n${opis}\n` +
        'Struktura jest źródłem prawdy o stronach (П24 punkt 1): dopisz stronę do structure.json ' +
        'albo popraw adres w treści, szablonie lub stopce — nie tę bramkę.'
    );
  }
  return { stron: strony.length, linkow };
}

/** Polska liczebność: 1 strona, 2–4 strony, 0 i 5+ stron. */
const stron = (n) => `${n} ${n === 1 ? 'strona' : n >= 2 && n <= 4 ? 'strony' : 'stron'}`;

/**
 * Integracja Astro. Haki: `astro:config:done` — bierze `site` i korzeń
 * witryny; `astro:build:done` — czyta strony po liście `pages`.
 * @param {{ structure: string }} opcje — ścieżka do structure.json względem korzenia witryny
 * @returns {import('astro').AstroIntegration}
 */
export default function links({ structure } = {}) {
  if (!structure) throw new Error('links(): podaj ścieżkę do structure.json — bramka nie zgaduje, gdzie leży struktura.');
  let site;
  let korzen;
  return {
    name: 'factory:links',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = config.site;
        korzen = fileURLToPath(config.root);
      },
      'astro:build:done': ({ dir, pages, logger }) => {
        const dist = fileURLToPath(dir);
        const sciezka = new URL(structure, `file:///${korzen.replace(/\\/g, '/').replace(/\/?$/, '/')}`);
        const doc = JSON.parse(readFileSync(sciezka, 'utf8'));
        const drzewo = new Set((doc.pages ?? []).map((p) => p.url));
        const strony_ = [];
        const brak = [];
        for (const { pathname } of pages) {
          const p = plikStrony(dist, pathname);
          if (!p) brak.push(pathname);
          else strony_.push({ pathname, html: readFileSync(p, 'utf8') });
        }
        if (brak.length) throw new Error(`Strony z listy budowania bez pliku w dist: ${brak.join(', ')}`);
        try {
          const { stron: n, linkow } = ocenStronyLinki(strony_, drzewo, site);
          logger.info(`linki: ${stron(n)}, ${linkow} linków wewnętrznych, każdy na adres ze struktury (${drzewo.size} stron)`);
        } catch (e) {
          logger.error(`linki: ${stron(strony_.length)} — odmowa`);
          throw e;
        }
      },
    },
  };
}
