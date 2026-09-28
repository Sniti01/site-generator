// Объявление типов для `extract.mjs` — импортируют инструменты и тесты сайта. Без него `astro check`
// даёт ts(7016).
import type { Uzel } from './html.mjs';

export type Stroka = { tekst: string; uzel: Uzel };
export type Tok = { tip: 'blok' | 'strochnyi' | 'probel' | 'tekst'; v?: string; uzel?: Uzel };

export const BLOCHNYE: Set<string>;
export const YACHEYKI: Set<string>;
export const NE_TEKST: Set<string>;
export const ATRIBUTY_TEKSTA: string[];
export const POLYA_META: string[];
export function chistit(s: string): string;
export function potok(koren: Uzel): Tok[];
export function stroki(tok: Tok[], na: string): Stroka[];
export class OshibkaIzvlecheniya extends Error {}
export function izvlechStranicu(html: string): {
  doc: Uzel;
  main: Uzel;
  vplotnuyu: Stroka[];
  cherezProbel: Stroka[];
  golova: Record<string, string[]>;
  atributy: { atr: string; tekst: string; uzel: Uzel }[];
};
export function izvlechDokument(html: string): { vplotnuyu: string[]; cherezProbel: string[] };
