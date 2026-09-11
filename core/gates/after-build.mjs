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
// Regresją jest kod wyjścia ≠ 0: rzucony tu błąd przerywa `astro build`.
// Liczby drukowane obok (ile stron, ile nagłówków) zmieniają się legalnie.
//
// CZEGO TA BRAMKA NIE ROBI: nie ocenia treści nagłówka i nie porównuje go
// z `h1` ze struktury — to zadanie dla sprawdzenia „pole równa się
// znacznikowi", które nie jest jeszcze napisane (UNRESOLVED, jw.).

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Wszystkie `*.html` w katalogu, w stałej kolejności po ścieżce. */
function strony(dir) {
  const out = [];
  const idz = (d) => {
    for (const nazwa of readdirSync(d).sort()) {
      const p = join(d, nazwa);
      if (statSync(p).isDirectory()) idz(p);
      else if (nazwa.endsWith('.html')) out.push(p);
    }
  };
  idz(dir);
  return out;
}

/** Liczba znaczników `<h1` w dokumencie — otwierających, nie zamykających. */
export function policzH1(html) {
  return (html.match(/<h1[\s>]/g) ?? []).length;
}

/**
 * Integracja Astro. Jedyny hak: `astro:build:done`.
 * @returns {import('astro').AstroIntegration}
 */
export default function afterBuild() {
  return {
    name: 'factory:after-build',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        const lista = strony(dist);
        const zle = [];
        for (const p of lista) {
          const n = policzH1(readFileSync(p, 'utf8'));
          if (n !== 1) zle.push({ p: relative(dist, p).replace(/\\/g, '/'), n });
        }
        logger.info(`h1: ${lista.length} stron, po jednym nagłówku na każdej${zle.length ? ' — NIE' : ''}`);
        if (zle.length) {
          const opis = zle.map((z) => `  ${z.p}: <h1> ×${z.n}`).join('\n');
          throw new Error(
            `Strona bez dokładnie jednego <h1> — ${zle.length} z ${lista.length}:\n${opis}\n` +
              'Nagłówek drukuje ten, kto drukuje stronę (punkt 23 backlogu). ' +
              'Popraw szablon strony — nie tę bramkę.'
          );
        }
      },
    },
  };
}
