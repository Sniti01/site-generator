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
// Czytany jest każdy atrybut `href` i `action` w znacznikach (także `HREF`,
// `xlink:href`; `action` — bo szukajka wraca w fali 2 formularzem, П24 rozw. 5);
// tekst nie jest znacznikiem, a wnętrze `<script>` i `<style>` jest wycinane.
// POZA RAMĄ, nazwane: `og:url`, JSON-LD (`url`, `@id`, `item`), `data-*`,
// adresy w skryptach, `src`/`srcset` — rozszerzyć, gdy pojawi się `core/seo`.
// Astro `base` inny niż `/` nie jest obsługiwany — ta fabryka go nie używa.
// Adres rozbiera
// `new URL(href, site)` — tak samo, jak zrobi przeglądarka: `//host/…`,
// `http://` i `https://`, `..`, `%`-kodowanie i tabulatory w środku
// normalizują się jednakowo. Dalej trzy pytania:
//   1. ta sama domena? — `hostname` równy hostowi `site` (schemat nieważny);
//      obca domena, `mailto:`, `tel:` — poza ramą;
//   2. plik czy strona? — ostatni segment z kropką to plik: liczy się tylko,
//      czy ISTNIEJE w `dist/` (ikona, mapa serwisu, `/_astro/…`); brak pliku —
//      odmowa. Strona nie ma kropki (schemat adresu struktury) — sprawdzana
//      w strukturze bez `#…` i `?…`;
//   3. adres bez korzenia (`poradniki/`) — ODMOWA, nie pominięcie: trasa
//      drukuje `primary`/`secondary`/`cta` z treści dosłownie, a taki adres
//      na `/gra/` wiedzie na `/gra/poradniki/` — 404 przy zielonej bramce.
// Komentarze HTML wycinane przed czytaniem (lekcja `after-build.mjs`).
//
// ŹRÓDŁO PRAWDY — `structure.json` witryny (П24 punkt 1): strona spoza
// struktury nie istnieje, więc link do niej wisi w próżni. Strona ze
// struktury JESZCZE NIE ZBUDOWANA linkiem-widmem nie jest: adres planowany
// różni się od adresu-widma, i dopóki treści nie ma, link czeka. Ścieżkę
// do struktury podaje konfiguracja witryny — rdzeń jej nie zgaduje.
//
// SĘDZIEGO OSĄDZONO W DNIU NARODZIN (reguła `CLAUDE.md`, 2026-09-11):
// pierwsza wersja porównywała napisy, nie adresy — `//host/…` brała za
// ścieżkę od korzenia (fałszywa odmowa), `http://swoja/…` za obcą domenę
// (fałszywy przepust), `/o-nas.html` za plik (przepust), `/site.webmanifest`
// za widmo (odmowa), adres bez korzenia pomijała z nieprawdziwym
// uzasadnieniem, `HREF=` nie widziała, a błąd ścieżki do struktury kończyła
// stosem zamiast wyroku. Wszystko z tej listy jest w baterii
// `core/accept/selftest.mjs`.
//
// CZEGO TA BRAMKA NIE ROBI: nie sprawdza, czy strona docelowa jest ZBUDOWANA —
// o tym mówi lista `pages` haka i `dist/`, nie struktura (pola `status`
// w umowie nie ma od 2026-09-11, П43: nikt go nie prowadził); nie czyta `src`
// ani `srcset`; nie ocenia, czy link prowadzi TAM, gdzie powinien. Cztery bramki
// wyniku (`after-build`, `anchors`, `links`, `corridor`) rzucają po kolei —
// pierwsza odmowa zasłania następne; przyjęte.

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { plikStrony } from './after-build.mjs';

const bezKomentarzy = (html) => html.replace(/<!--[\s\S]*?-->/g, '');

/**
 * Wszystkie wartości `href` i `action` w ZNACZNIKACH dokumentu, w kolejności
 * wystąpienia. Tylko podwójne cudzysłowy — Astro innych nie drukuje
 * (normalizuje `'…'` i bez cudzysłowów do `"…"`, dynamiczne przez
 * `addAttribute` też). Znacznik czytany z uwzględnieniem cudzysłowów:
 * literalny `>` w wartości statycznego atrybutu (`title="a>b"`) nie kończy go.
 */
export function hrefy(html) {
  const out = [];
  // Wnętrze <script> to nie znaczniki strony, choć może zawierać napis „<a href=…">" —
  // wycinane przed czytaniem; <style> także.
  const bezSkryptow = html.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '').replace(/<style\b[\s\S]*?<\/style\s*>/gi, '');
  for (const tag of bezSkryptow.matchAll(/<[a-zA-Z](?:[^>"']|"[^"]*"|'[^']*')*>/g)) {
    for (const m of tag[0].matchAll(/[\s:](?:href|action)\s*=\s*"([^"]*)"/gi)) out.push(m[1]);
  }
  return out;
}

/**
 * Klasyfikacja jednego `href`. Czysta funkcja: to ją sprawdza bateria.
 * @param {string} href
 * @param {string|undefined} site — `site` z konfiguracji, np. `https://ac4bf-thewatch.com`
 * @returns {{ rodzaj: 'poza', adres?: undefined }
 *        | { rodzaj: 'strona', adres: string }
 *        | { rodzaj: 'plik', adres: string }
 *        | { rodzaj: 'bez-korzenia', adres: string }}
 */
export function klasyfikujHref(href, site) {
  const h = href.trim();
  if (!h || h.startsWith('#')) return { rodzaj: 'poza' };
  const zeSchematem = /^[a-z][a-z0-9+.-]*:/i.test(h);
  const odKorzenia = h.startsWith('/');
  if (!zeSchematem && !odKorzenia) return { rodzaj: 'bez-korzenia', adres: h };

  let url;
  try {
    url = new URL(h, site ?? 'http://localhost/');
  } catch {
    return { rodzaj: 'bez-korzenia', adres: h };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { rodzaj: 'poza' };

  if (zeSchematem || h.startsWith('//')) {
    // Adres z hostem: swoja domena tylko, gdy host równy hostowi `site`.
    if (!site) return { rodzaj: 'poza' };
    let hostSite;
    try {
      hostSite = new URL(site).hostname.toLowerCase();
    } catch {
      return { rodzaj: 'poza' };
    }
    const host = url.hostname.toLowerCase();
    if (host !== hostSite && host !== `www.${hostSite}` && `www.${host}` !== hostSite) return { rodzaj: 'poza' };
  }

  let adres = url.pathname || '/';
  try {
    adres = decodeURIComponent(adres);
  } catch {
    // niepoprawne %-kodowanie — porównujemy surowo
  }
  const ostatni = adres.slice(adres.lastIndexOf('/') + 1);
  if (ostatni.includes('.')) return { rodzaj: 'plik', adres };
  return { rodzaj: 'strona', adres };
}

/**
 * Ocena jednej strony: lista problemów w kolejności wystąpienia, bez powtórzeń.
 * Pusta lista — strona w porządku.
 * @param {string} html
 * @param {Set<string>} drzewo — adresy ze struktury
 * @param {string|undefined} site
 * @param {(adres: string) => boolean} plikIstnieje — czy plik pod adresem leży w `dist/`
 * @returns {{ adres: string, powod: 'spoza struktury' | 'plik nie istnieje' | 'bez korzenia' }[]}
 */
export function ocenLinki(html, drzewo, site, plikIstnieje = () => true) {
  const h = bezKomentarzy(html);
  const problemy = [];
  const dodaj = (adres, powod) => {
    if (!problemy.some((p) => p.adres === adres && p.powod === powod)) problemy.push({ adres, powod });
  };
  for (const href of hrefy(h)) {
    const k = klasyfikujHref(href, site);
    if (k.rodzaj === 'poza') continue;
    if (k.rodzaj === 'bez-korzenia') dodaj(k.adres, 'bez korzenia');
    else if (k.rodzaj === 'plik') {
      if (!plikIstnieje(k.adres)) dodaj(k.adres, 'plik nie istnieje');
    } else if (!drzewo.has(k.adres)) dodaj(k.adres, 'spoza struktury');
  }
  return problemy;
}

/**
 * Ocena zbioru stron: rzuca przy zerze stron, pustej strukturze i przy
 * pierwszym problemie, z pełną listą. Wejście — pary {pathname, html}.
 * @param {{pathname: string, html: string}[]} strony
 * @param {Set<string>} drzewo
 * @param {string|undefined} site
 * @param {(adres: string) => boolean} plikIstnieje
 * @returns {{stron: number, linkow: number}}
 */
export function ocenStronyLinki(strony, drzewo, site, plikIstnieje = () => true) {
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
    linkow += hrefy(bezKomentarzy(html)).filter((h) => klasyfikujHref(h, site).rodzaj !== 'poza').length;
    // Główna przychodzi z haka jako pusty `pathname` — w odmowie ma być `/`, nie pusta kolumna.
    for (const p of ocenLinki(html, drzewo, site, plikIstnieje)) zle.push({ pathname: pathname || '/', ...p });
  }
  if (zle.length) {
    const opis = zle.map((z) => `  ${z.pathname}: ${z.adres} — ${z.powod}`).join('\n');
    throw new Error(
      `Linki bez celu — ${zle.length} na ${new Set(zle.map((z) => z.pathname)).size} z ${strony.length} stron:\n${opis}\n` +
        'Struktura jest źródłem prawdy o stronach (П24 punkt 1): dopisz stronę do structure.json ' +
        'albo popraw adres w treści, szablonie lub stopce — adres strony pisze się od korzenia, z końcowym ukośnikiem; nie tę bramkę.'
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
        try {
          if (!site) {
            throw new Error('links(): witryna bez `site` w konfiguracji — bezwzględnych linków nie da się przypisać do domeny, bramka nie zawęża ramy po cichu.');
          }
          const sciezka = resolve(korzen, structure);
          if (!existsSync(sciezka)) {
            throw new Error(`Nie ma pliku struktury: ${sciezka} — bramka linków nie ma z czym porównać. Popraw ścieżkę w links({ structure }).`);
          }
          let doc;
          try {
            doc = JSON.parse(readFileSync(sciezka, 'utf8'));
          } catch (e) {
            throw new Error(`Struktura ${sciezka} nie jest poprawnym JSON: ${e.message}`);
          }
          const drzewo = new Set((doc.pages ?? []).map((p) => p.url));
          const strony_ = [];
          const brak = [];
          for (const { pathname } of pages) {
            const p = plikStrony(dist, pathname);
            if (!p) brak.push(pathname || '/');
            else strony_.push({ pathname, html: readFileSync(p, 'utf8') });
          }
          if (brak.length) throw new Error(`Strony z listy budowania bez pliku w dist: ${brak.join(', ')}`);
          const plikIstnieje = (adres) => existsSync(join(dist, adres));
          const { stron: n, linkow } = ocenStronyLinki(strony_, drzewo, site, plikIstnieje);
          logger.info(`linki: ${stron(n)}, ${linkow} linków wewnętrznych, każdy na adres ze struktury (${drzewo.size} stron) albo istniejący plik`);
        } catch (e) {
          logger.error(`linki: odmowa`);
          throw e;
        }
      },
    },
  };
}
