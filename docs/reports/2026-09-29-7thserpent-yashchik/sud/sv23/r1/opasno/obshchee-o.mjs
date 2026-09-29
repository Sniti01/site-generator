// Общее для образцов скептика SV23-O («опасный проход»): пути, образцы ответов домена, запуск команды сторожа
// с подгрузками (--import) замка сети и подмен fetch, запись вывода в свою папку. Репозиторий — только чтение:
// сторож импортируется по абсолютному пути, его CLI-ветка при импорте не срабатывает.
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

export const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/e23fb3af-937c-42f5-91ca-cf6567cf6a1c/scratchpad/sud-sv23-o';
export const REPO = 'D:/SEO/cloud/site-generator';
export const STOROZH = `${REPO}/sites/7thserpent.com/tools/storozha-vykladki.mjs`;
export const PROBY = `${REPO}/sites/7thserpent.com/tools/testy/storozha-vykladki.test.mjs`;
export const WF_PUT = `${REPO}/.github/workflows/deploy-7thserpent.yml`;
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
export const nash = (put = '/') => `<!doctype html><html><head><title>7th Serpent</title><link rel="canonical" href="https://www.7thserpent.com${put}"></head><body></body></html>`;
/** Заглушка хостера — как в пробе (замер 2026-09-29: 200, этот <title>, без canonical). */
export const ZAGLUSHKA = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Поздравляем, сайт создан!</title></head><body><h1>Поздравляем, сайт создан!</h1></body></html>';

export const adresFajla = (put) => pathToFileURL(put).href;

/** Команда `domen` сторожа (или его копии) с подгрузками; окружение — process.env без SERPENT_DOMAIN_BOUND, плюс dop. */
export function zapuskKomandy(storozh, podgruzki, dop) {
  const { SERPENT_DOMAIN_BOUND, ...okruzhenie } = process.env;
  const argi = [...podgruzki.flatMap((p) => ['--import', p]), storozh, 'domen'];
  return spawnSync(process.execPath, argi, { encoding: 'utf8', env: { ...okruzhenie, ...dop }, timeout: 120000 });
}

export function vyvod(imya, stroki) {
  writeFileSync(join(PAPKA, imya), `${stroki.join('\n')}\n`);
}
