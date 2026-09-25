/**
 * Данные витрины: имя, меню шапки и колонки подвала.
 *
 * С сессии 9 (П79) меню и подвал ведут на адреса дерева волны 1, которые
 * ещё не собраны (тексты страниц спроса — с пачки 1): адрес из структуры —
 * плановый, не призрак. Каждый адрес проходит `getPage`
 * (`src/lib/structure.ts`) — адрес мимо `structure.json` роняет сборку;
 * с пачки 0 (П85 п. 2) собранные страницы после сборки читает ещё и сторож
 * `links` ядра. Файла страницы в `dist/` он не требует — только адрес
 * в структуре (`core/gates/links.mjs`, «czego ta bramka nie robi»).
 */
import { getPage } from '../lib/structure';

export const site = {
  name: '7thserpent.com',
  /** Видимое имя знака «Семёрка из трассы» (сессия 11, П83): «7 TH / SERPENT».
   *  Стоит первым в подписи ссылки знака (WCAG 2.5.3) и в имени знака подвала. */
  znak: '7th Serpent',
  tagline: 'An unofficial Max Payne fan site',
  lang: 'en',
};

const link = (label: string, url: string) => ({ label, href: getPage(url).url });

export const nav = [
  link('Max Payne', '/max-payne-1/'),
  link('Max Payne 2', '/max-payne-2/'),
  link('Max Payne 3', '/max-payne-3/'),
  link('Remake', '/remake/'),
  link('Movie', '/movie/'),
];

export const footerColumns = [
  {
    title: 'The games',
    links: [
      link('Max Payne (2001)', '/max-payne-1/'),
      link('Max Payne 2', '/max-payne-2/'),
      link('Max Payne 3', '/max-payne-3/'),
      link('The remake', '/remake/'),
    ],
  },
  {
    title: 'More',
    links: [
      link('The 2008 movie', '/movie/'),
      link('Story and characters', '/story/'),
      link('Quotes', '/quotes/'),
      link('Mods', '/mods/'),
    ],
  },
  {
    title: 'Site',
    links: [link('Home', '/'), link('Privacy policy', '/privacy/')],
  },
];
