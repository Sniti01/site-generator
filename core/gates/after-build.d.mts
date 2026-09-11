// Deklaracja typów dla `after-build.mjs` — jedynej bramki, którą witryna
// importuje przez `@factory/core/...` z pliku pod `// @ts-check`
// (`astro.config.mjs`). Pozostałe bramki woła `run.mjs` po ścieżce i typów
// nie potrzebują. Bez tego pliku `astro check` zgłasza ts(7016).
import type { AstroIntegration } from 'astro';

/** Liczba znaczników `<h1` w dokumencie — otwierających, nie zamykających. */
export function policzH1(html: string): number;

/** Integracja Astro. Jedyny hak: `astro:build:done`. */
export default function afterBuild(): AstroIntegration;
