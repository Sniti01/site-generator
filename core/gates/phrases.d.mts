// Объявление типов для `phrases.mjs` — интеграция импортируется из `astro.config.mjs` под `// @ts-check`,
// как `after-build.mjs` и `corridor.mjs`. Без него `astro check` даёт ts(7016).
import type { AstroIntegration } from 'astro';
import type { Ukazatel } from '../text/corpus.mjs';

/** Исключение сайта: текст в кавычках, страница, ряд и соседи. */
export interface Isklyuchenie {
  klass: string;
  stranica: string;
  tekst: string;
  ryad: { id?: string; metka: RegExp };
  posle?: RegExp;
  pered?: RegExp;
}

/** Данные сайта для сторожа. */
export interface DannyeFraz {
  imena?: string[];
  isklyucheniya?: Isklyuchenie[];
  stranica: (url: string) => boolean;
  minSlov?: number;
}

/** Поля головы, которых ровно по одному и непустые. */
export const POLYA_GOLOVY: string[];

/** Слова строки с меткой куска кавычек (-1 — вне кавычек, k — k-я пара, 'mix' — имя через границу). */
export function slovaSMetkoy(s: string, imSl: string[][]): { w: string; seg: number | 'mix' }[];

/** Суд одной страницы; бросает `OshibkaIzvlecheniya`, если страница не читается. */
export function sudStranicy(
  url: string,
  html: string,
  uk: Ukazatel,
  dannye: Omit<DannyeFraz, 'stranica'>
): { otkazy: string[]; razresheno: Map<string, string[]>; strok: number; slov: number };

/** Адрес страницы из `pathname` хука. */
export function adres(pathname: string): string;

/** Суд сборки: страницы круга (`html: null` — файла нет). */
export function sudSborki(
  stranicy: { url: string; html: string | null }[],
  uk: Ukazatel,
  dannye: Omit<DannyeFraz, 'stranica'>
): { otkazy: { url: string; chto: string }[]; itogi: { url: string; strok: number; slov: number; razresheno: Map<string, string[]> }[] };

/** Интеграция Astro — сторож 8 слов на `astro:build:done`. */
export default function phrases(opcii: { corpus?: string; dannye: DannyeFraz; kesh?: string | null }): AstroIntegration;
