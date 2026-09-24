/**
 * Данные витрины: имя, меню шапки и колонки подвала.
 *
 * С сессии 9 (П79) меню и подвал ведут на адреса дерева волны 1, которые
 * ещё не собраны (маршрут `[...slug]` и тексты — пачка 0): адрес из
 * структуры — плановый, не призрак. Каждый адрес проходит `getPage`
 * (`src/lib/structure.ts`) — адрес мимо `structure.json` роняет сборку.
 * До сессии 9 меню несло один пункт «Home»: сторож `links` ядра, когда
 * подключится вместе с маршрутом, потребует и файл в `dist/`.
 */
import { getPage } from '../lib/structure';

export const site = {
  name: '7thserpent.com',
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
