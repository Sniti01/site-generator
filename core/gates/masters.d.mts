// Объявление типов для `masters.mjs` — интеграция импортируется из `astro.config.mjs` под `// @ts-check`.
// Без него `astro check` даёт ts(7016).
import type { AstroIntegration } from 'astro';

/** Утечки: файлы сборки, побайтно равные исходным растровым картинкам; бросает без папки или картинок. */
export function utechki(dist: string, istochniki: string | string[]): { utechki: { fajl: string; master: string }[]; masterov: number };

/** Интеграция Astro — сторож утечки мастеров на `astro:build:done`. */
export default function masters(opcii?: { istochniki?: string | string[] }): AstroIntegration;
