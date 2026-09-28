// Объявление типов для `head.mjs` — интеграция импортируется из `astro.config.mjs` под `// @ts-check`.
// Без него `astro check` даёт ts(7016).
import type { AstroIntegration } from 'astro';

/** Ожидание сайта: имя, второе имя, контекст JSON-LD, адреса без BreadcrumbList. */
export interface OzhidanieGolovy {
  imya: string;
  alternativnoe: string;
  kontekst: string;
  bezSpiska?: string[];
}

/** Структура сайта — то, что судье нужно из `structure.json`. */
export interface StrukturaGolovy {
  site?: { domain?: string };
  pages: { url: string; h1?: string; parent?: string | null }[];
}

export type Otkaz = { vid: string; chto: string };

/** Цепочка крошек по договору: обход `parent` от страницы к главной. */
export function cepochka(struktura: StrukturaGolovy, url: string): { url: string; label: string }[];

/** Отказы одной страницы; пустой — сверено. */
export function sudit(url: string, html: string, struktura: StrukturaGolovy, ozhidanie: OzhidanieGolovy): Otkaz[];

/** Страницы сборки: `index.html` в папках `dist/`, кроме `_astro/`. */
export function stranicyDist(dist: string): { url: string; file: string }[];

/** Суд набора страниц: отказ при нуле страниц и без главной. */
export function suditNabor(stranicy: { url: string; html: string }[], struktura: StrukturaGolovy, ozhidanie: OzhidanieGolovy): (Otkaz & { url: string })[];

/** Интеграция Astro — судья головы и крошек на `astro:build:done`. */
export default function head(opcii: { structure: string; ozhidanie: OzhidanieGolovy }): AstroIntegration;
