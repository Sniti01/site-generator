// Deklaracja typów dla `links.mjs` — importowanej z `astro.config.mjs`
// pod `// @ts-check`, jak `after-build.mjs` i `anchors.mjs`. Bez tego
// `astro check` zgłasza ts(7016).
import type { AstroIntegration } from 'astro';

export type Klasa =
  | { rodzaj: 'poza'; adres?: undefined }
  | { rodzaj: 'strona'; adres: string }
  | { rodzaj: 'plik'; adres: string }
  | { rodzaj: 'bez-korzenia'; adres: string };

export interface ProblemLinku {
  adres: string;
  powod: 'spoza struktury' | 'plik nie istnieje' | 'bez korzenia';
}

/** Wszystkie wartości `href` w znacznikach dokumentu (także `HREF`, `xlink:href`). */
export function hrefy(html: string): string[];

/** Klasyfikacja jednego `href` względem `site`: poza ramą, strona, plik, adres bez korzenia. */
export function klasyfikujHref(href: string, site: string | undefined): Klasa;

/** Ocena jednej strony: problemy bez powtórzeń; pusta lista, gdy w porządku. */
export function ocenLinki(
  html: string,
  drzewo: Set<string>,
  site: string | undefined,
  plikIstnieje?: (adres: string) => boolean
): ProblemLinku[];

/** Ocena zbioru: rzuca przy zerze stron, pustej strukturze i przy problemach. */
export function ocenStronyLinki(
  strony: { pathname: string; html: string }[],
  drzewo: Set<string>,
  site: string | undefined,
  plikIstnieje?: (adres: string) => boolean
): { stron: number; linkow: number };

/** Integracja Astro. Haki: `astro:config:done` (site, korzeń) i `astro:build:done`. */
export default function links(opcje: { structure: string }): AstroIntegration;
