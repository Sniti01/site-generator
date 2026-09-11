// Deklaracja typów dla `anchors.mjs` — importowanej z `astro.config.mjs`
// pod `// @ts-check`, jak `after-build.mjs`. Bez tego `astro check`
// zgłasza ts(7016).
import type { AstroIntegration } from 'astro';

export interface ProblemKotwicy {
  rodzaj: 'dubel' | 'href' | 'aria';
  kotwica: string;
}

/** Ocena jednej strony: pusta lista, gdy w porządku. */
export function ocenKotwice(html: string): ProblemKotwicy[];

/** Ocena zbioru: rzuca przy zerze stron i przy problemach; zwraca liczbę sprawdzonych. */
export function ocenStrony(strony: { pathname: string; html: string }[]): number;

/** Integracja Astro. Jedyny hak: `astro:build:done`. */
export default function anchors(): AstroIntegration;
