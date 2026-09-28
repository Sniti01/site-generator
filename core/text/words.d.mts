// Объявление типов для `words.mjs` — импортируют инструменты и тесты сайта. Без него `astro check`
// даёт ts(7016).
export type Rezhim = 'tochno' | 'srez';

export const N_GRAM: number;
export const REZHIMY: Rezhim[];
export const APOSTROFY: RegExp;
export function slova(s: string): string[];
export function imenaSlovami(imena: string[]): string[][];
export function bezImen<T extends string | { w: string }>(ws: T[], imenaSl: string[][]): T[];
export function srez(w: string): string;
export function vRezhime(ws: string[], rezhim: Rezhim): string[];
export function hesh(g: string): number;
export function bezAdresov(t: string): string;
