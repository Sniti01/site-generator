// Bramka PO zbudowaniu, czwarta po `after-build.mjs`, `anchors.mjs`
// i `links.mjs`: DŁUGOŚĆ TEKSTU KAŻDEJ STRONY MIEŚCI SIĘ W KORYTARZU Z UMOWY.
//
// Decyzja właściciela П43 (2026-09-11), na start paczki 1 tekstów fali 1:
// «korytarz długości — bramką, liczba w umowie». Liczba to pole `corridor`
// strony w `structure.json` — para `[min, max]` znaków bez spacji, zdjęta
// z anatomii korpusu S3/S4 (mediana konkurentów klastra ±15 %), albo `null`
// dla strony, której korytarz nie dotyczy: pole jest OBOWIĄZKOWE, `null`
// jest decyzją nazwaną w `DECISIONS.md`, a brak pola — błędem kontraktu.
//
// BEZPIECZNIK, dosłownie z decyzji: tekst, który nie mieści się w korytarzu,
// NIE JEST dopychany wodą ani cięty — zmienia się korytarz, nazwaną decyzją
// z przyczyną w raporcie. Dlatego ta bramka NIE MA żadnego wyłącznika:
// ani flagi, ani zmiennej środowiska, ani listy wyjątków. Jedyna droga obok
// odmowy prowadzi przez `structure.json`, czyli przez umowę i jej dziennik.
//
// MIARA — TA SAMA LINIJKA, KTÓRĄ MIERZONO KONKURENTÓW (`tools/anatomy-s3.mjs`,
// `readDoc`): tekst obszaru treści, znaczniki zdjęte, `<script>`, `<style>`,
// `<noscript>` i komentarze wycięte, encje rozwinięte (`&nbsp;` to spacja),
// białe znaki zbite do jednej spacji, spacje usunięte, reszta policzona.
// Obszar treści u nas to JEDYNY `<main>` strony (`Base.astro`: `<main id="tresc">`);
// u konkurentów anatomia brała największy `<article>` albo `<main>` — ten sam
// zamiar: treść bez szapki, stopki i menu. Tekst linków, napisów przy
// przyciskach i podpisów pod zdjęciami LICZY SIĘ — u konkurentów też się
// liczył. Strona bez `<main>` albo z dwoma — odmowa: nie ma czego mierzyć.
//
// STRONY, KTÓRYCH NIE MA W STRUKTURZE, nie przechodzą po cichu: `getPage`
// zatrzymuje je wcześniej, ale bramka wyniku nie polega na bramce źródeł —
// adres spoza umowy to odmowa także tu. Zero stron — odmowa (lekcja
// `after-build.mjs`). Strona z `corridor: null` dostaje wiersz z liczbą
// w dzienniku budowania — liczba idzie do raportu paczki, wyroku nie ma.
//
// SĘDZIEGO SĄDZI SIĘ PRZED ZAUFANIEM (reguła `CLAUDE.md`): bateria
// w `core/accept/selftest.mjs` — granice korytarza (min, max, o jeden obok),
// `null`, brak pola, zły kształt pary, zero i dwa `<main>`, encje, komentarz
// z tekstem, skrypt z tekstem, adres spoza struktury, zero stron, odmowa
// nazywająca stronę, liczbę i korytarz.
//
// CZEGO TA BRAMKA NIE ROBI: nie ocenia, CO jest napisane — tylko ile;
// nie liczy nagłówka `<title>` ani `description` (to nie treść strony);
// nie sprawdza pokrycia kluczy — to wiersz raportu, nie bramka (plan P4, p.3).

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { plikStrony } from './after-build.mjs';

const unesc = (s) =>
  s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));

const strip = (html) =>
  html
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ');

/**
 * Tekst obszaru treści: wnętrze jedynego `<main>` po zdjęciu znaczników,
 * z białymi znakami zbitymi do jednej spacji. Rzuca, gdy `<main>` nie ma
 * albo jest więcej niż jeden — strona bez obszaru treści nie ma długości.
 * @param {string} html
 * @returns {string}
 */
export function tekstMain(html) {
  const bezKomentarzy = html.replace(/<!--[\s\S]*?-->/g, ' ');
  const otwarcia = bezKomentarzy.match(/<main(?=[\s>])/gi) ?? [];
  if (otwarcia.length !== 1) {
    throw new Error(
      `znaczników <main> jest ${otwarcia.length}, a obszar treści musi być dokładnie jeden — ` +
        'bramka nie zgaduje, który z nich mierzyć.'
    );
  }
  const m = bezKomentarzy.match(/<main(?=[\s>])[^>]*>([\s\S]*?)<\/main\s*>/i);
  if (!m) throw new Error('znacznik <main> otwarty, ale nie zamknięty — obszar treści bez końca.');
  return unesc(strip(m[1])).replace(/\s+/g, ' ').trim();
}

/**
 * Znaki bez spacji — ta sama miara, co `znaki` w `tools/anatomy-s3.mjs`.
 * @param {string} tekst — po `tekstMain`
 * @returns {number}
 */
export const znakiBezSpacji = (tekst) => tekst.replace(/ /g, '').length;

/**
 * Kształt pola `corridor`: `null` albo para liczb całkowitych `0 < min <= max`.
 * Zwraca opis wady albo `null`, gdy kształt dobry. `undefined` — brak pola.
 * @param {unknown} korytarz
 * @returns {string | null}
 */
export function wadaKorytarza(korytarz) {
  if (korytarz === undefined) return 'brak pola `corridor` w strukturze — umowa bez liczby';
  if (korytarz === null) return null;
  if (!Array.isArray(korytarz) || korytarz.length !== 2) return '`corridor` ma być parą `[min, max]` albo `null`';
  const [min, max] = korytarz;
  if (!Number.isInteger(min) || !Number.isInteger(max)) return '`corridor`: obie granice mają być liczbami całkowitymi';
  if (min <= 0) return '`corridor`: dolna granica ma być dodatnia';
  if (min > max) return `\`corridor\`: dolna granica ${min} większa od górnej ${max}`;
  return null;
}

/**
 * Wyrok dla jednej strony: liczba znaków wobec korytarza.
 * @param {string} html
 * @param {[number, number] | null | undefined} korytarz
 * @returns {{ znaki: number, wyrok: 'w korytarzu' | 'za krótko' | 'za długo' | 'bez korytarza' | 'zła umowa', powod?: string }}
 */
export function ocenKorytarz(html, korytarz) {
  const znaki = znakiBezSpacji(tekstMain(html));
  const wada = wadaKorytarza(korytarz);
  if (wada) return { znaki, wyrok: 'zła umowa', powod: wada };
  if (korytarz === null) return { znaki, wyrok: 'bez korytarza' };
  const [min, max] = korytarz;
  if (znaki < min) return { znaki, wyrok: 'za krótko' };
  if (znaki > max) return { znaki, wyrok: 'za długo' };
  return { znaki, wyrok: 'w korytarzu' };
}

const para = (k) => (Array.isArray(k) ? `${k[0]}–${k[1]}` : String(k));

/**
 * Adres strony w formie umowy z `pathname` haka `astro:build:done`: hak
 * daje `assassins-creed-4-black-flag/` (bez ukośnika z przodu) i `` dla
 * głównej — struktura pisze `/assassins-creed-4-black-flag/` i `/`.
 * Znaleziono pierwszym budowaniem 2026-09-11: bateria miała `/gra/` z ukośnikiem
 * i przepuściła to, czego hak nigdy nie daje. Odtąd bateria ma formę haka.
 * @param {string} pathname
 * @returns {string}
 */
export const adresStrony = (pathname) => `/${String(pathname ?? '').replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/');

/**
 * Ocena zbioru stron. Rzuca przy zerze stron i przy pierwszym problemie —
 * z pełną listą: strona spoza struktury, zła umowa, brak `<main>`, poza
 * korytarzem. Zwraca rachunek do wiersza dziennika.
 * @param {{pathname: string, html: string}[]} strony
 * @param {Map<string, {corridor?: unknown}>} struktura — strony umowy po adresie
 * @returns {{ stron: number, wKorytarzu: {pathname: string, znaki: number, korytarz: [number, number]}[], bezKorytarza: {pathname: string, znaki: number}[] }}
 */
export function ocenStronyKorytarz(strony, struktura) {
  if (!strony.length) {
    throw new Error(
      'Zbudowano zero stron — bramka korytarza nie ma czego mierzyć, a zielone «0 stron» ' +
        'byłoby prawdą o pustym zbiorze, nie o serwisie.'
    );
  }
  if (!struktura.size) {
    throw new Error('Struktura bez adresów — bramka korytarza nie ma z czym porównać. Sprawdź ścieżkę do structure.json.');
  }
  const zle = [];
  const wKorytarzu = [];
  const bezKorytarza = [];
  for (const { pathname, html } of strony) {
    const adres = adresStrony(pathname);
    const strona = struktura.get(adres);
    if (!strona) {
      zle.push(`${adres}: adresu nie ma w structure.json — strona spoza umowy nie ma korytarza`);
      continue;
    }
    let ocena;
    try {
      ocena = ocenKorytarz(html, strona.corridor);
    } catch (e) {
      zle.push(`${adres}: ${e.message}`);
      continue;
    }
    const { znaki, wyrok } = ocena;
    if (wyrok === 'zła umowa') zle.push(`${adres}: ${ocena.powod}`);
    else if (wyrok === 'bez korytarza') bezKorytarza.push({ pathname: adres, znaki });
    else if (wyrok === 'w korytarzu') wKorytarzu.push({ pathname: adres, znaki, korytarz: strona.corridor });
    else zle.push(`${adres}: ${znaki} znaków bez spacji, korytarz ${para(strona.corridor)} — ${wyrok}`);
  }
  if (zle.length) {
    throw new Error(
      `Długość poza umową — ${zle.length} z ${strony.length} stron:\n${zle.map((z) => `  ${z}`).join('\n')}\n` +
        'Tekstu nie dopycha się wodą ani nie tnie (П43): jeśli liczba jest uczciwa, zmienia się korytarz ' +
        'w structure.json — nazwaną decyzją z przyczyną w raporcie. Nie tę bramkę.'
    );
  }
  return { stron: strony.length, wKorytarzu, bezKorytarza };
}

/** Polska liczebność: 1 strona, 2–4 strony, 0 i 5+ stron. */
const stron = (n) => `${n} ${n === 1 ? 'strona' : n >= 2 && n <= 4 ? 'strony' : 'stron'}`;

/**
 * Integracja Astro. Haki: `astro:config:done` — korzeń witryny;
 * `astro:build:done` — czyta strony po liście `pages`, jak trzy bramki obok.
 * @param {{ structure: string }} opcje — ścieżka do structure.json względem korzenia witryny
 * @returns {import('astro').AstroIntegration}
 */
export default function corridor({ structure } = {}) {
  if (!structure) throw new Error('corridor(): podaj ścieżkę do structure.json — bramka nie zgaduje, gdzie leży umowa.');
  let korzen;
  return {
    name: 'factory:corridor',
    hooks: {
      'astro:config:done': ({ config }) => {
        korzen = fileURLToPath(config.root);
      },
      'astro:build:done': ({ dir, pages, logger }) => {
        const dist = fileURLToPath(dir);
        try {
          const sciezka = resolve(korzen, structure);
          if (!existsSync(sciezka)) {
            throw new Error(`Nie ma pliku struktury: ${sciezka} — bramka korytarza nie ma z czym porównać. Popraw ścieżkę w corridor({ structure }).`);
          }
          let doc;
          try {
            doc = JSON.parse(readFileSync(sciezka, 'utf8'));
          } catch (e) {
            throw new Error(`Struktura ${sciezka} nie jest poprawnym JSON: ${e.message}`);
          }
          const struktura = new Map((doc.pages ?? []).map((p) => [p.url, p]));
          const strony_ = [];
          const brak = [];
          for (const { pathname } of pages) {
            const p = plikStrony(dist, pathname);
            if (!p) brak.push(pathname || '/');
            else strony_.push({ pathname, html: readFileSync(p, 'utf8') });
          }
          if (brak.length) throw new Error(`Strony z listy budowania bez pliku w dist: ${brak.join(', ')}`);
          const { stron: n, wKorytarzu, bezKorytarza } = ocenStronyKorytarz(strony_, struktura);
          logger.info(
            `korytarz: ${stron(n)} — w korytarzu ${wKorytarzu.length}, bez korytarza (null w umowie) ${bezKorytarza.length}; znaki bez spacji`
          );
          for (const s of wKorytarzu) logger.info(`  ${s.pathname}: ${s.znaki} w ${para(s.korytarz)}`);
          for (const s of bezKorytarza) logger.info(`  ${s.pathname}: ${s.znaki} — bez korytarza, liczba do raportu`);
        } catch (e) {
          logger.error('korytarz: odmowa');
          throw e;
        }
      },
    },
  };
}
