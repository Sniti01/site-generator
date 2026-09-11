// Deklaracja typów dla `links.mjs` — importowanej z `astro.config.mjs`
// pod `// @ts-check`, jak `after-build.mjs` i `anchors.mjs`. Bez tego
// `astro check` zgłasza ts(7016).
import type { AstroIntegration } from 'astro';

/** Adres strony z `href` albo `null`, gdy `href` jest poza ramą bramki. */
export function adresZHref(href: string, site: string | undefined): string | null;

/** Ocena jednej strony: widma — adresy spoza struktury; pusta lista, gdy w porządku. */
export function ocenLinki(html: string, drzewo: Set<string>, site: string | undefined): string[];

/** Ocena zbioru: rzuca przy zerze stron, pustej strukturze i przy widmach. */
export function ocenStronyLinki(
  strony: { pathname: string; html: string }[],
  drzewo: Set<string>,
  site: string | undefined
): { stron: number; linkow: number };

/** Integracja Astro. Haki: `astro:config:done` (site, korzeń) i `astro:build:done`. */
export default function links(opcje: { structure: string }): AstroIntegration;
