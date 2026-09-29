// Общее для образцов скептика SV23-O2 (раунд 2, «опасный проход» по правке раунда 1): пути, образцы ответов домена,
// запись вывода в свою папку. Репозиторий — только чтение: сторож импортируется по абсолютному пути, его ветка команды
// при импорте не срабатывает. Сети нет: ответы — подставной poluchit или подмена globalThis.fetch.
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

export const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/e23fb3af-937c-42f5-91ca-cf6567cf6a1c/scratchpad/sud-sv23-o2';
export const REPO = 'D:/SEO/cloud/site-generator';
export const STOROZH = `${REPO}/sites/7thserpent.com/tools/storozha-vykladki.mjs`;
export const SV = await import(pathToFileURL(STOROZH).href);

export const W = 'https://www.7thserpent.com/';
export const G = 'https://7thserpent.com/';
export const otv = (status, telo = '', location = '') => ({ status, telo, location });
export const oshibka = (kod) => ({ oshibka: kod });
/** Ответы только из образца; запрос вне образца — ошибка (сети нет). */
export const iz = (karta) => async (adres) => {
  if (!(adres in karta)) throw new Error(`запрос вне образца: ${adres}`);
  return karta[adres];
};
/** Заглушка хостера — как в пробе (замер 2026-09-29: 200, этот <title>, без canonical). */
export const ZAGLUSHKA = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Поздравляем, сайт создан!</title></head><body><h1>Поздравляем, сайт создан!</h1></body></html>';
export const PERVOGO = '<!doctype html><html><head><title>AC4BF — The Watch</title><link rel="canonical" href="https://www.ac4bf-thewatch.com/"></head></html>';

export const poslednyaya = (r) => r.stroki[r.stroki.length - 1];
export const itogStroka = (r) => (r.ok ? 'ПРОХОД' : 'СТОП');

export function vyvod(imya, stroki) {
  writeFileSync(join(PAPKA, imya), `${stroki.join('\n')}\n`);
}
