// Bramka PO zbudowaniu, druga po `after-build.mjs`: całość kotwic na stronie.
//
// Decyzja właściciela П40 (2026-09-11), przed pierwszą przesiadką wzorca.
// Na każdej stronie: wszystkie `id`, wszystkie `href="#…"`, wszystkie
// `aria-labelledby` i `aria-describedby`. Wisząca kotwica → odmowa z nazwą
// strony i kotwicy. Zdublowany `id` → odmowa: dubel psuje kotwicę po cichu,
// przeglądarka bierze pierwszy, a drugi element zostaje bez adresu.
//
// RAMA — WEWNĄTRZ STRONY. Linki między stronami (`/#zejscie`) tej bramki
// nie obchodzą: to adres, nie kotwica. Kotwica bez celu (`href="#"`) też
// nie jest sprawdzana — to „na górę", nie odwołanie do elementu.
//
// Powód, zmierzony 2026-09-10 na `/assassins-creed-4-black-flag/`: cztery
// linki z szapki wiodły donikąd (`#zejscie` ×2, `#katalog` ×2) — kotwice
// z głównej zostały w menu wszystkich stron. Bramka struktury tego nie
// widzi z tej samej przyczyny, co brak `<h1>`: obowiązek jest w HTML,
// a bramka czyta umowę. Trzydzieści stron fali 1 dałoby setkę wiszących
// linków w szapce, i wzorzec by je zamroził.
//
// SĘDZIEGO OSĄDZONO PRZED ZAUFANIEM (reguła `CLAUDE.md`): bateria wzorców
// w `core/accept/selftest.mjs` — wiszący `href`, wiszący `aria`, dubel `id`,
// strona bez kotwic (zielona), zero stron (odmowa). Komentarze HTML wycinane
// przed czytaniem — lekcja `after-build.mjs` z tego samego dnia.
//
// CZEGO TA BRAMKA NIE ROBI: nie ocenia, czy kotwica prowadzi TAM, gdzie
// powinna; nie czyta `href` bez `#`; nie zagląda do `<script>`.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { plikStrony } from './after-build.mjs';

const bezKomentarzy = (html) => html.replace(/<!--[\s\S]*?-->/g, '');

/** Wszystkie wartości atrybutu w dokumencie, w kolejności wystąpienia. */
function atrybut(html, nazwa) {
  const re = new RegExp(`\\s${nazwa}\\s*=\\s*"([^"]*)"`, 'g');
  return [...html.matchAll(re)].map((m) => m[1]);
}

/**
 * Ocena jednej strony. Zwraca listę problemów — pustą, gdy strona jest
 * w porządku. Czysta funkcja: to ją sprawdza bateria wzorców.
 * @param {string} html
 * @returns {{rodzaj: 'dubel'|'href'|'aria', kotwica: string}[]}
 */
export function ocenKotwice(html) {
  const h = bezKomentarzy(html);
  const problemy = [];

  const idy = atrybut(h, 'id');
  const znane = new Set();
  const zdublowane = new Set();
  for (const id of idy) {
    if (znane.has(id)) zdublowane.add(id);
    znane.add(id);
  }
  for (const id of zdublowane) problemy.push({ rodzaj: 'dubel', kotwica: id });

  for (const href of atrybut(h, 'href')) {
    if (!href.startsWith('#') || href === '#') continue;
    const cel = decodeURIComponent(href.slice(1));
    if (!znane.has(cel)) problemy.push({ rodzaj: 'href', kotwica: href });
  }

  for (const nazwa of ['aria-labelledby', 'aria-describedby']) {
    for (const lista of atrybut(h, nazwa)) {
      for (const cel of lista.split(/\s+/).filter(Boolean)) {
        if (!znane.has(cel)) problemy.push({ rodzaj: 'aria', kotwica: `${nazwa}="${cel}"` });
      }
    }
  }

  return problemy;
}

/**
 * Ocena zbioru stron: rzuca przy zerze stron i przy pierwszym problemie,
 * z pełną listą. Wejście — pary {pathname, html}; tak bateria testuje
 * odmowę na zerze bez budowania czegokolwiek.
 * @param {{pathname: string, html: string}[]} strony
 * @returns {number} liczba sprawdzonych stron
 */
export function ocenStrony(strony) {
  if (!strony.length) {
    throw new Error(
      'Zbudowano zero stron — bramka kotwic nie ma czego sprawdzać, a zielone «0 stron» ' +
        'byłoby prawdą o pustym zbiorze, nie o serwisie.'
    );
  }
  const zle = [];
  for (const { pathname, html } of strony) {
    for (const p of ocenKotwice(html)) zle.push({ pathname, ...p });
  }
  if (zle.length) {
    const nazwy = { dubel: 'zdublowany id', href: 'wisząca kotwica', aria: 'wiszące odwołanie' };
    const opis = zle.map((z) => `  ${z.pathname}: ${nazwy[z.rodzaj]} ${z.kotwica}`).join('\n');
    throw new Error(
      `Kotwice bez celu albo zdublowane — ${zle.length} na ${new Set(zle.map((z) => z.pathname)).size} z ${strony.length} stron:\n${opis}\n` +
        'Rama jest wewnątrz strony: link do innej strony pisze się z adresem (`/#zejscie`), nie samą kotwicą. ' +
        'Popraw szablon albo treść — nie tę bramkę.'
    );
  }
  return strony.length;
}

/** Polska liczebność: 1 strona, 2–4 strony, 0 i 5+ stron. */
const stron = (n) => `${n} ${n === 1 ? 'strona' : n >= 2 && n <= 4 ? 'strony' : 'stron'}`;

/**
 * Integracja Astro. Jedyny hak: `astro:build:done`. Czyta strony po liście
 * `pages` z haka, nie po wszystkich `*.html` — lekcja `after-build.mjs`.
 * @returns {import('astro').AstroIntegration}
 */
export default function anchors() {
  return {
    name: 'factory:anchors',
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
          const n = ocenStrony(strony_);
          logger.info(`kotwice: ${stron(n)}, każda kotwica ma cel, żaden id się nie powtarza`);
        } catch (e) {
          logger.error(`kotwice: ${stron(strony_.length)} — odmowa`);
          throw e;
        }
      },
    },
  };
}
