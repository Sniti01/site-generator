// Deklaracja typów dla `corridor.mjs` — importowanej z `astro.config.mjs`
// pod `// @ts-check`, jak `after-build.mjs`, `anchors.mjs` i `links.mjs`.
// Bez tego `astro check` zgłasza ts(7016).
import type { AstroIntegration } from 'astro';

export type Korytarz = [number, number] | null;

export type Wyrok = 'w korytarzu' | 'za krótko' | 'za długo' | 'bez korytarza' | 'zła umowa';

/** Tekst jedynego `<main>` po zdjęciu znaczników; rzuca przy zerze albo dwóch `<main>`. */
export function tekstMain(html: string): string;

/** Znaki bez spacji — miara `tools/anatomy-s3.mjs`. */
export function znakiBezSpacji(tekst: string): number;

/** Opis wady kształtu pola `corridor` albo `null`, gdy kształt dobry. */
export function wadaKorytarza(korytarz: unknown): string | null;

/** Wyrok dla jednej strony: liczba znaków wobec korytarza. */
export function ocenKorytarz(html: string, korytarz: unknown): { znaki: number; wyrok: Wyrok; powod?: string };

/** Ocena zbioru: rzuca przy zerze stron, pustej strukturze i przy problemach. */
export function ocenStronyKorytarz(
  strony: { pathname: string; html: string }[],
  struktura: Map<string, { corridor?: unknown }>
): {
  stron: number;
  wKorytarzu: { pathname: string; znaki: number; korytarz: [number, number] }[];
  bezKorytarza: { pathname: string; znaki: number }[];
};

/** Integracja Astro. Haki: `astro:config:done` (korzeń) i `astro:build:done`. */
export default function corridor(opcje: { structure: string }): AstroIntegration;
