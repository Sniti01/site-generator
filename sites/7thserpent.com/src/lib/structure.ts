import structure from '../../structure/structure.json';

/**
 * Единственный вход в `structure.json` со стороны витрины — копия формы
 * первого сайта (`sites/ac4bf-thewatch.com/src/lib/structure.ts`).
 *
 * Структура — источник правды о страницах (П24 п. 1): страницы вне неё
 * нет, и сборка обязана упасть, а не промолчать. Поэтому `getPage` бросает,
 * а не возвращает `undefined`: неверный адрес на главной — прерванная
 * сборка, а не ссылка-призрак.
 *
 * АДРЕС ИЗ СТРУКТУРЫ — ПЛАНОВЫЙ, НЕ ПРИЗРАК (сессия 9, П79 п. 4 объёма).
 * Главная ссылается на страницы дерева волны 1, которые ещё не собраны:
 * маршрут `[...slug]` и тексты — пачка 0. Ссылка на адрес, стоящий
 * в структуре, законна (прецедент подвала первого сайта, П27 п. 3); ссылка
 * мимо структуры роняет сборку здесь. Сторож `links` ядра подключится вместе
 * с маршрутом (бэклог 54 п. 9) и потребует ещё и файл в `dist/`.
 *
 * Поля SEO — `title`, `h1`, `description` — живут только в структуре (П24 п. 3).
 */

/** Форма снята с данных: 18 страниц дерева; `corridor` бывает `null` (П43, П71). */
export interface StructurePage {
  url: string;
  type: string;
  h1: string;
  title: string;
  description: string;
  cluster: string | null;
  keywords: string[];
  parent: string | null;
  related: string[];
  blocks: Array<{
    block: string;
    source: string;
    confidence: string;
    role?: string;
    evidence?: string;
  }>;
  wave: number;
  corridor: [number, number] | null;
  volume: number;
}

export const site = structure.site;
export const pages = structure.pages as unknown as StructurePage[];

const poAdresu = new Map(pages.map((strona) => [strona.url, strona]));

/** Страница из структуры или прерванная сборка — третьего пути нет. */
export function getPage(url: string): StructurePage {
  const strona = poAdresu.get(url);
  if (!strona) {
    throw new Error(
      `Адреса ${url} нет в structure.json (${pages.length} страниц). ` +
        'Структура — источник правды о страницах (П24 п. 1): добавьте страницу ' +
        'в pages-s2.json и прогоните npm run tree или исправьте адрес.'
    );
  }
  return strona;
}
