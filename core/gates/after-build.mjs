// Bramka PO zbudowaniu: sprawdza WYNIK, nie zamiar.
//
// Cztery bramki z `run.mjs` idą przed `astro build` i czytają źródła:
// umowę, tokeny, zasoby, strukturę. Żadna nie widzi tego, co naprawdę
// wylądowało w `dist/`. Ta jedna widzi — i dlatego jest integracją Astro
// na haku `astro:build:done`, a nie skryptem w npm: `npm run build` ma
// upadać sam, bez drugiej komendy, którą można zapomnieć.
//
// Powód — 2026-09-10/11. `core/structure/schema.json` żąda `h1` od każdej
// strony jako pola obowiązkowego i unikalnego, a `check-structure.mjs`
// pilnuje tego POLA w umowie. Znacznika `<h1>` w HTML nie pilnował nikt:
// jedyne `<h1>` w repozytorium drukował `HeroKeyArt`, bezwarunkowo, i sześć
// stron fali 1 bez tego bloku zbudowałoby się bez nagłówka przy zielonych
// bramkach. To ten sam rodzaj ślepoty, co miara CSS bez wbudowanych stylów:
// obowiązek zapisany polem, wykonany znacznikiem, sprawdzony tylko po jednej
// stronie. Lista takich pól — `docs/UNRESOLVED.md`, wiersz z 2026-09-11.
//
// SĘDZIEGO OSĄDZONO W DNIU NARODZIN (reguła `CLAUDE.md`), i cztery rzeczy
// niżej wynikają z tego przeglądu, nie z pierwszego szkicu:
//   1. liczy się po liście `pages` z haka, nie po wszystkich `*.html`
//      w `dist/` — inaczej plik weryfikacyjny Search Console z `public/`
//      albo HTML przekierowania Astro (bez `<h1>`) roniłby budowanie
//      z radą «popraw szablon», którego taki plik nie ma;
//   2. komentarze HTML są wycinane przed liczeniem — kompilator Astro
//      zostawia `<!-- … -->` z ciała szablonu w wyniku, więc
//      `<!-- <h1> stary --> ` obok prawdziwego `<h1>` dawało ×2, a bez
//      prawdziwego — ×1, czyli cichy przepust;
//   3. zero stron to odmowa, nie zielone «0 stron»: prawda o pustym zbiorze
//      nie jest prawdą o stronach;
//   4. wiersz logu mówi jedno z dwóch, nie «wszystko dobrze — NIE».
//
// Regresją jest kod wyjścia ≠ 0: rzucony tu błąd przerywa `astro build`.
// Liczby drukowane obok zmieniają się legalnie.
//
// CZEGO TA BRAMKA NIE ROBI: nie ocenia treści nagłówka i nie porównuje go
// z `h1` ze struktury — to zadanie dla sprawdzenia „pole równa się
// znacznikowi", które nie jest jeszcze napisane (UNRESOLVED, jw.).

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Liczba znaczników `<h1` w dokumencie — otwierających, nie zamykających,
 * poza komentarzami HTML. `<script>` i `<template>` nie są wycinane celowo:
 * `<h1` w nich z tego serwisu nie wychodzi (Markdown nie jest renderowany,
 * `set:html` tylko u SVG i kredytu), a wycinanie skryptów regexem to
 * własny rodzaj kłamstwa.
 */
export function policzH1(html) {
  const bezKomentarzy = html.replace(/<!--[\s\S]*?-->/g, '');
  return (bezKomentarzy.match(/<h1[\s>]/g) ?? []).length;
}

/**
 * Plik strony dla `pathname` z haka: `build.format: 'directory'` kładzie
 * `/a/` w `a/index.html`, format `file` — w `a.html`. Sprawdzane są oba,
 * bo `pathname` nie mówi, którym formatem budowano.
 */
export function plikStrony(dist, pathname) {
  const czysty = pathname.replace(/^\/|\/$/g, '');
  const katalog = join(dist, czysty, 'index.html');
  if (existsSync(katalog)) return katalog;
  const plik = join(dist, `${czysty || 'index'}.html`);
  if (existsSync(plik)) return plik;
  return null;
}

/** Polska liczebność: 1 strona, 2–4 strony, 0 i 5+ stron. */
const stron = (n) => `${n} ${n === 1 ? 'strona' : n >= 2 && n <= 4 ? 'strony' : 'stron'}`;

/**
 * Integracja Astro. Jedyny hak: `astro:build:done`.
 * @returns {import('astro').AstroIntegration}
 */
export default function afterBuild() {
  return {
    name: 'factory:after-build',
    hooks: {
      'astro:build:done': ({ dir, pages, logger }) => {
        const dist = fileURLToPath(dir);

        if (!pages.length) {
          throw new Error(
            'Zbudowano zero stron — bramka h1 nie ma czego sprawdzać, a zielone «0 stron» ' +
              'byłoby prawdą o pustym zbiorze, nie o serwisie. Statyczna fabryka bez stron to błąd.'
          );
        }

        const zle = [];
        let policzono = 0;
        for (const { pathname } of pages) {
          const p = plikStrony(dist, pathname);
          if (!p) {
            zle.push({ p: pathname, n: 'plik nie istnieje' });
            continue;
          }
          policzono += 1;
          const n = policzH1(readFileSync(p, 'utf8'));
          if (n !== 1) zle.push({ p: pathname, n: `<h1> ×${n}` });
        }

        if (zle.length) {
          logger.error(`h1: ${stron(pages.length)}, bez dokładnie jednego nagłówka — ${zle.length}`);
          const opis = zle.map((z) => `  ${z.p}: ${z.n}`).join('\n');
          throw new Error(
            `Strona bez dokładnie jednego <h1> — ${zle.length} z ${pages.length}:\n${opis}\n` +
              'Nagłówek drukuje ten, kto drukuje stronę (punkt 23 backlogu). ' +
              'Popraw szablon strony — nie tę bramkę.'
          );
        }
        logger.info(`h1: ${stron(policzono)}, na każdej dokładnie jeden nagłówek`);
      },
    },
  };
}
