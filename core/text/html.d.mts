// Объявление типов для `html.mjs` — фундамент судей импортируют инструменты сайта (`tools/sverka.mjs`
// из `astro.config.mjs` под `// @ts-check`). Без него `astro check` даёт ts(7016). Узел — дерево parse5
// адаптера по умолчанию; судьи читают его поля (`tagName`, `attrs`, `childNodes`, `parentNode`, `value`)
// на узлах разных видов, поэтому узел здесь не сужен.
export type Uzel = any;

export const NS_HTML: string;
export function razobrat(html: string, opcii?: { skripty?: boolean }): Uzel;
export function element(u: Uzel): boolean;
export function vHtml(u: Uzel): boolean;
export function imya(u: Uzel): string;
export function atr(u: Uzel, imyaAtr: string): string | undefined;
export function klassy(u: Uzel): Set<string>;
export function tenevoyShablon(u: Uzel): boolean;
export function deti(u: Uzel): Uzel[];
export function elementy(koren: Uzel, pred?: (u: Uzel) => boolean): Uzel[];
export function pervyi(koren: Uzel, pred: (u: Uzel) => boolean): Uzel | null;
export function predki(u: Uzel): Uzel[];
export function chasti(doc: Uzel): { html: Uzel; head: Uzel; body: Uzel };
export function strokaIshodnika(u: Uzel): number | null;
export function tekstVsego(u: Uzel): string;
export function tekstDetey(u: Uzel): string;
