// Deklaracja typów dla `art.mjs` — importowanej z `astro.config.mjs`
// pod `// @ts-check`, jak `anchors.mjs`. Bez tego `astro check`
// zgłasza ts(7016).
import type { AstroIntegration } from 'astro';

export interface ProblemArtu {
  rodzaj: 'zapas' | 'galeria';
  miejsce: string;
}

/** Ocena jednej strony: pusta lista, gdy każdy klucz artu rozwiązał się w plik. */
export function ocenArt(html: string): ProblemArtu[];

/** Liczby żywotności strony — nie sądzą, idą do logu. */
export function policzMiejsca(html: string): { ram: number; rzedow: number; bohaterow: number };

/** Ocena zbioru: rzuca przy zerze stron i przy problemach; zwraca liczby. */
export function ocenStronyArt(strony: { pathname: string; html: string }[]): {
  stron: number;
  ram: number;
  rzedow: number;
  bohaterow: number;
};

/** Integracja Astro. Jedyny hak: `astro:build:done`. */
export default function art(): AstroIntegration;
