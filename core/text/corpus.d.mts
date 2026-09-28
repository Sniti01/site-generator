// Объявление типов для `corpus.mjs` — импортируют инструменты и тесты сайта. Без него `astro check`
// даёт ts(7016).
import type { Rezhim } from './words.mjs';

/** Указатель корпуса: документ по 8-грамме (подтверждённый словами) или `null`. */
export interface Ukazatel {
  dokumentov: number;
  pustyh: number;
  vosmigramm: Record<Rezhim, number>;
  nayti(g: string, rezhim: Rezhim): string | null;
  izKesha?: boolean;
  oshibkaKesha?: string | null;
}

export class OshibkaKorpusa extends Error {}
export type DokumentKorpusa = { url: string; fajl: string; charset: string | null };
export function dokumentyKorpusa(papka: string): DokumentKorpusa[];
export function tekstDokumentaKorpusa(d: { fajl: string; charset: string | null }): string;
export function ukazatelIzTekstov(
  teksty: { url: string; vplotnuyu: string | string[]; cherezProbel: string | string[] }[],
  opcii?: { imena?: string[] }
): Ukazatel;
export const KESH_PO_UMOLCHANIYU: string;
export function ukazatelKorpusa(
  papka: string,
  opcii?: { imena?: string[]; kesh?: string | null; chitat?: (fajl: string) => Buffer }
): Ukazatel & { izKesha: boolean; oshibkaKesha: string | null };
