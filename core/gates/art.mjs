// Bramka PO zbudowaniu, piąta po `corridor.mjs`: każdy klucz artu w treści
// rozwiązał się w plik — czyli w `<img>`, nie w zapas.
//
// Decyzja właściciela П57 (2026-09-15) — punkt 40 backlogu wchodzi do zakresu
// «kadry rzędom» PRZED masową edycją `art:` u 112 rzędów. Powód, zmierzony
// 2026-09-15: nieznany klucz `art` (literówka, niedociągnięty plik) nie roni
// budowania — `mediaFor` oddaje `src: undefined`, `SmartImage` drukuje slot
// `zapas`, a witryna kładzie tam `EraSkyline`: rząd dostaje dwie kolumny
// i gradient nieba bez sylwetki, bramki zielone. W galerii zapasu nie ma —
// rama `.gallery__frame` zostaje pusta. Sto dwanaście nowych kluczy w 28
// plikach to sto dwanaście okazji do cichej literówki.
//
// RAMA — WYNIK W `dist/`, nie frontmatter. Bramka nie czyta plików treści
// (jądro nie ma parsera YAML i nie dostaje go «przy okazji»), tylko HTML:
// zapas drukuje się WYŁĄCZNIE przy nierozwiązanym kluczu, więc każda klasa
// `skyline` w zbudowanej stronie to klucz bez pliku — dziś zero na 32
// stronach, łącznie z główną (jej pięć warstw i bohater mają pliki).
// Pusta rama galerii — to samo. Karty (`card-rail`) do ramy NIE wchodzą:
// karta bez pola `art` jest legalna (`[...slug].astro`: `if (!k.art) return k`)
// i po `dist/` nie da się jej odróżnić od literówki — zostaje wierszem
// raportu, jak dotąd.
//
// SĘDZIEGO OSĄDZONO PRZED ZAUFANIEM (reguła `CLAUDE.md`): bateria wzorców
// w `core/accept/selftest.mjs` — strona czysta, zapas w rzędzie, w bohaterze,
// w galerii, poza znanym kontenerem, pusta rama galerii, zapas
// w komentarzu (nie liczy się), zero stron (odmowa z tekstem), odmowa nazywa
// stronę (także główną z pustym `pathname` haka) i miejsce, dwie złe strony
// w jednej odmowie. Przegląd w dniu narodzin (2026-09-15) dał trzy rzeczy:
//   1. kotwice regexów nie są przybite do kolejności atrybutów ani do tego,
//      że `skyline`/`gallery__frame` jest pierwszą klasą — inaczej przejście
//      szablonu na `class:list` z modyfikatorem oślepiłoby bramkę po cichu;
//   2. wiersz logu niesie liczby żywotności (ramy galerii, rzędy z kadrem,
//      bohaterowie) — zero przy 23 stronach z galerią widać gołym okiem,
//      a zielone «0 problemów» przy zerze ram byłoby prawdą o niczym;
//   3. mutacja na żywo: klucz galerii/rzędu/bohatera podmieniony w treści
//      → `astro build` czerwone z nazwą strony i miejsca; treść przywrócona
//      bajt w bajt, dist przebudowany na czysto.
// Komentarze HTML wycinane przed czytaniem — lekcja `after-build.mjs`.
//
// CZEGO TA BRAMKA NIE ROBI: nie sprawdza, czy klucz wskazuje WŁAŚCIWY kadr;
// nie czyta rejestrów `game-art.json`/`art-credits.json` (klucz z plikiem
// bez wpisu rejestru przechodzi — `alt` i stopka mają swoje źródła);
// nie ocenia kart (karta bez `art` jest legalna i po HTML nieodróżnialna
// od literówki); nie widzi `art:` strony bez bloku `hero-key-art` — taki
// klucz czyta tylko paleta rzędów, kadru nie drukuje. Bramka jest dla
// witryn, które trzymają art w repozytorium (tu: 47 plików `src/assets/`);
// witryna żyjąca na zapasie do pierwszego `npm run gameart` jej nie podłącza.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { plikStrony } from './after-build.mjs';

const bezKomentarzy = (html) => html.replace(/<!--[\s\S]*?-->/g, '');

/** Nazwy miejsc po klasie kontenera — do odmowy, żeby wskazać, GDZIE. */
const MIEJSCA = [
  ['layer__art', 'rząd'],
  ['hero__art', 'bohater'],
  ['gallery__frame', 'galeria'],
];

/** Najbliższy znany kontener przed pozycją `poz` (w oknie 600 znaków). */
function miejsce(html, poz) {
  const okno = html.slice(Math.max(0, poz - 600), poz);
  let najlepsze = { nazwa: 'inne', gdzie: -1 };
  for (const [klasa, nazwa] of MIEJSCA) {
    const i = okno.lastIndexOf(`class="${klasa}`);
    if (i > najlepsze.gdzie) najlepsze = { nazwa, gdzie: i };
  }
  return najlepsze.nazwa;
}

/** Klasa w atrybucie `class="…"` — na dowolnej pozycji listy klas, dowolna
 *  kolejność atrybutów w znaczniku. `(?:^|\s)` i `(?:\s|")` trzymają granice
 *  słowa: `skyline-nie` to nie `skyline`. */
const klasa = (nazwa) => new RegExp(`class="(?:[^"]*\\s)?${nazwa}(?:\\s|")`, 'g');

/**
 * Ocena jednej strony. Zwraca listę problemów — pustą, gdy każdy klucz
 * artu rozwiązał się w plik. Czysta funkcja: to ją sprawdza bateria.
 * @param {string} html
 * @returns {{rodzaj: 'zapas'|'galeria', miejsce: string}[]}
 */
export function ocenArt(html) {
  const h = bezKomentarzy(html);
  const problemy = [];

  // Zapas witryny: `<div class="skyline …">` — drukowany tylko w slocie
  // `zapas` SmartImage, czyli tylko bez `src`.
  for (const m of h.matchAll(klasa('skyline'))) {
    problemy.push({ rodzaj: 'zapas', miejsce: miejsce(h, m.index) });
  }

  // Galeria bez zapasu: pusta rama — `<div … class="gallery__frame …" …>`
  // z niczym poza białymi znakami przed `</div>`.
  for (const _ of h.matchAll(/<div\b[^>]*\bclass="(?:[^"]*\s)?gallery__frame(?:\s|")[^>]*>\s*<\/div>/g)) {
    problemy.push({ rodzaj: 'galeria', miejsce: 'galeria' });
  }

  return problemy;
}

/**
 * Liczby żywotności strony — ile ram galerii, rzędów z kadrem i bohaterów
 * z artem strona drukuje. Nie sądzą; idą do wiersza logu, żeby zero było
 * widoczne (bramka, która niczego nie liczy, jest zielona na pustej stronie).
 * @param {string} html
 */
export function policzMiejsca(html) {
  const h = bezKomentarzy(html);
  const ile = (nazwa) => [...h.matchAll(klasa(nazwa))].length;
  return { ram: ile('gallery__frame'), rzedow: ile('layer__art'), bohaterow: ile('hero__art') };
}

/** Adres strony z `pathname` haka: `` → `/`, `gra/` → `/gra/` (jak corridor). */
const adres = (pathname) => `/${String(pathname ?? '').replace(/^\/+/, '')}`;

/**
 * Ocena zbioru stron: rzuca przy zerze stron i przy pierwszym problemie,
 * z pełną listą. Wejście — pary {pathname, html}, jak u `anchors.mjs`;
 * `pathname` w formie haka (`` dla głównej) — w odmowie drukuje się adres.
 * @param {{pathname: string, html: string}[]} strony
 * @returns {{stron: number, ram: number, rzedow: number, bohaterow: number}}
 */
export function ocenStronyArt(strony) {
  if (!strony.length) {
    throw new Error(
      'Zbudowano zero stron — bramka artu nie ma czego sprawdzać, a zielone «0 stron» ' +
        'byłoby prawdą o pustym zbiorze, nie o serwisie.'
    );
  }
  const zle = [];
  const suma = { stron: strony.length, ram: 0, rzedow: 0, bohaterow: 0 };
  for (const { pathname, html } of strony) {
    for (const p of ocenArt(html)) zle.push({ pathname: adres(pathname), ...p });
    const m = policzMiejsca(html);
    suma.ram += m.ram;
    suma.rzedow += m.rzedow;
    suma.bohaterow += m.bohaterow;
  }
  if (zle.length) {
    const nazwy = { zapas: 'zapas zamiast kadru', galeria: 'pusta rama galerii' };
    const opis = zle.map((z) => `  ${z.pathname}: ${nazwy[z.rodzaj]} — miejsce: ${z.miejsce}`).join('\n');
    throw new Error(
      `Klucze artu bez pliku — ${zle.length} na ${new Set(zle.map((z) => z.pathname)).size} z ${strony.length} stron:\n${opis}\n` +
        'Klucz `art` w treści musi mieć plik `src/assets/gry/<klucz>.jpg` albo `src/assets/foto/<klucz>.jpg`. ' +
        'Popraw klucz albo dociągnij plik (`npm run gameart`, `npm run art`) — nie tę bramkę.'
    );
  }
  return suma;
}

/** Polska liczebność: 1 strona; 2–4, 22–24, 32–34… strony; reszta stron. */
const stron = (n) => {
  const r = n % 10;
  const d = n % 100;
  const forma = n === 1 ? 'strona' : r >= 2 && r <= 4 && !(d >= 12 && d <= 14) ? 'strony' : 'stron';
  return `${n} ${forma}`;
};

/**
 * Integracja Astro. Jedyny hak: `astro:build:done`. Czyta strony po liście
 * `pages` z haka, nie po wszystkich `*.html` — lekcja `after-build.mjs`.
 * @returns {import('astro').AstroIntegration}
 */
export default function art() {
  return {
    name: 'factory:art',
    hooks: {
      'astro:build:done': ({ dir, pages, logger }) => {
        const dist = fileURLToPath(dir);
        const strony_ = [];
        const brak = [];
        for (const { pathname } of pages) {
          const p = plikStrony(dist, pathname);
          if (!p) brak.push(pathname);
          else strony_.push({ pathname, html: readFileSync(p, 'utf8') });
        }
        if (brak.length) throw new Error(`Strony z listy budowania bez pliku w dist: ${brak.join(', ')}`);
        try {
          const s = ocenStronyArt(strony_);
          logger.info(
            `art: ${stron(s.stron)}, każdy klucz artu rozwiązał się w plik — zapasu i pustych ram nie ma; ` +
              `ram galerii ${s.ram}, rzędów z kadrem ${s.rzedow}, bohaterów ${s.bohaterow}`
          );
        } catch (e) {
          logger.error(`art: ${stron(strony_.length)} — odmowa`);
          throw e;
        }
      },
    },
  };
}
