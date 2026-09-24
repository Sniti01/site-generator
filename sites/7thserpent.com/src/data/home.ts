/**
 * Содержание главной (сессия 9, П79 п. 4 объёма). Тексты пишет Code по
 * фактам `CLAUDE.md` §2 сайта; всё, чего там нет, не пишется. Каждый абзац
 * о ремейке несёт дату проверки («as of September 2026»). Даты выхода —
 * североамериканские (§2, «Правила текста о предмете»).
 *
 * АДРЕСА — ТОЛЬКО ИЗ СТРУКТУРЫ. Каждый `href` ниже проходит `getPage`
 * при сборке (`src/lib/structure.ts`): адрес мимо `structure.json` роняет
 * сборку. Страницы дерева ещё не собраны (маршрут и тексты — пачка 0),
 * ссылки ведут на плановые адреса — решение сессии, записано в докладе.
 *
 * Кадры — ключи `src/data/media.ts` (материалы издателя со Steam, П79 п. 3).
 */
import { getPage } from '../lib/structure';

/** Адрес, проверенный структурой; возвращает его же. */
const adres = (url: string) => getPage(url).url;

/** Неразрывные пробелы внутри: дата и «1 & 2 Remake» не рвутся на переносе
 *  (проверочный проход финального ревью, регрессия 2). */
const nb = (s: string) => s.replace(/ /g, ' ');

export interface GameRow {
  /** Якорь ряда и чипа первого экрана. */
  id: string;
  /** Отметка на трассере: год выхода или «TBA». */
  year: string;
  title: string;
  meta: string;
  body: string;
  href: string;
  linkLabel: string;
  /** Три панели страницы-кадра: первая — большая. Пусто — ряд без кадра. */
  panels: [string, string, string] | [];
  /** Кадровка панелей, у которых сюжет не в центре кадра: ключ → сторона
   *  (`GameRow.astro`, модификаторы `panele__kadr--lewo` / `--prawo`). */
  kadrowka?: Record<string, 'lewo' | 'prawo'>;
  /** Плашка рассказчика под кадром (приём графической новеллы, П79). */
  caption?: string;
}

export const hero = {
  lead:
    'Three games, a 2008 movie and a remake that, as of September 2026, is still in development. ' +
    'An unofficial fan guide to the series, from New York in 2001 to São Paulo.',
  primaryLabel: 'The games in order',
  secondaryLabel: 'The remake',
  secondaryHref: adres('/remake/'),
  chipsLabel: 'Jump to a game',
};

export const rows: GameRow[] = [
  {
    id: 'max-payne',
    year: '2001',
    title: 'Max Payne',
    meta: `Remedy Entertainment · Windows, ${nb('July 25, 2001')} · Metacritic 89 on PC`,
    body:
      'New York, 2001: three years after Max’s wife and daughter were killed, a drug called Valkyr leads ' +
      'back to a military project that Nicole Horne revived. Sam Lake wrote the story — and, with no budget ' +
      'for actors, lent Max his face.',
    href: adres('/max-payne-1/'),
    linkLabel: 'More on Max Payne (2001)',
    panels: ['mp1-k13', 'mp1-k14', 'mp1-k09'],
    caption: 'New York, 2001.',
  },
  {
    id: 'max-payne-2',
    year: '2003',
    title: 'Max Payne 2: The Fall of Max Payne',
    meta: `Remedy Entertainment · Windows, ${nb('October 15, 2003')} · Metacritic 86 on PC`,
    body:
      'Two years later, the story pulls in Mona Sax, Vladimir Lem and Senator Alfred Woden’s Inner Circle. ' +
      'There are two endings, and the second one is reached only on the hardest difficulty.',
    href: adres('/max-payne-2/'),
    linkLabel: 'More on Max Payne 2',
    panels: ['mp2-k00', 'mp2-k03', 'mp2-k01'],
    caption: 'New York, two years later.',
  },
  {
    id: 'max-payne-3',
    year: '2012',
    title: 'Max Payne 3',
    meta: `Rockstar Studios · PS3 and Xbox 360, ${nb('May 15, 2012')} · Metacritic 87 on PC and PS3`,
    body:
      'Nine years after the second game, Max is in São Paulo with the Branco family and his partner Raul ' +
      'Passos; along the way he shaves his head and quits drinking. Rockstar made this one — Remedy only ' +
      'consulted near the end.',
    href: adres('/max-payne-3/'),
    linkLabel: 'More on Max Payne 3',
    panels: ['mp3-k15', 'mp3-k04', 'mp3-k13'],
    caption: 'São Paulo, nine years after that.',
  },
  {
    id: 'remake',
    year: 'TBA',
    title: `Max Payne ${nb('1 & 2 Remake')}`,
    meta: `Remedy Entertainment · PC, PlayStation 5, Xbox Series X|S · announced ${nb('April 6, 2022')}`,
    body:
      'One game that remakes the first two, built by Remedy on its Northlight engine and funded and ' +
      'published by Rockstar Games. As of September 2026 it is still in development, and there is no ' +
      'release date.',
    href: adres('/remake/'),
    linkLabel: 'What’s known about the remake',
    // Кадров самого ремейка в источниках нет (§2 сайта: анонсы — у Rockstar,
    // картинка анонса — логотип). Страница панелей — из оригиналов, которые
    // ремейк переделывает (П81): Max Payne [10] и [6], ключевой арт Max Payne 2.
    // Плашка и `alt` (имя игры впереди) называют оригиналы — кадры не выдаются
    // за ремейк.
    panels: ['mp1-k10', 'mp2-art', 'mp1-k06'],
    kadrowka: { 'mp1-k10': 'lewo', 'mp2-art': 'prawo' },
    caption: `What the remake retells: ${nb('New York')}, 2001 and 2003.`,
  },
];

/**
 * Цитата полосы — короткая, с игрой и главой (П67 п. 2, П79 п. 4).
 * Источник — документ корпуса `www.thegamer.com` («10 Hilarious Max Payne
 * Quotes…», 23.11.2020; снимок корпуса 2026-09-18): реплика и глава —
 * оттуда дословно. Нуарные реплики Max Payne 2 со страницы Wikiquote
 * в корпусе есть, но без глав — по правилу «с главой» они не годятся.
 */
export const quote = {
  text: 'I stood out in this place like a streetwalker in a monastery.',
  source: 'Max Payne 3, Chapter 7 — Max wanders through one of São Paulo’s favelas.',
};

/** Лента: страницы вокруг игр, по кадру издателя на карточку; ни один кадр
 *  ленты не повторяет панель рядов. Приписка — предмет страницы словом, а не
 *  тип контракта: «Topic» на каждой карточке ничего не сообщал (финальное
 *  ревью impeccable, правка 4). */
export const readNext = {
  title: 'Around the series',
  lead: 'The story, the people behind Max, the way the games play, the lines people quote and the mods.',
  cards: [
    { href: adres('/story/'), kadr: 'mp3-k01', kind: 'Story' },
    { href: adres('/voice-and-face/'), kadr: 'mp1-k12', kind: 'People' },
    { href: adres('/gameplay/'), kadr: 'mp2-k02', kind: 'Gameplay' },
    { href: adres('/quotes/'), kadr: 'mp3-k06', kind: 'Quotes' },
    { href: adres('/max-payne-3/guide/'), kadr: 'mp3-k10', kind: 'Walkthrough', place: 'Max Payne 3' },
    { href: adres('/mods/'), kadr: 'mp1-k05', kind: 'Mods' },
  ] as { href: string; kadr: string; kind: string; place?: string }[],
};

/** Порядок выхода — ответ на «max payne games in order». Мобильная версия —
 *  порт первой игры (§2), её страница — раздел `/max-payne-1/` (П65). */
export const inOrder = {
  title: 'The games in order',
  items: [
    { href: adres('/max-payne-1/'), title: 'Max Payne', meta: 'July 2001' },
    { href: adres('/max-payne-2/'), title: 'Max Payne 2: The Fall of Max Payne', meta: 'October 2003' },
    { href: adres('/max-payne-1/'), title: 'Max Payne Mobile, the first game on iOS and Android', meta: 'April 2012' },
    { href: adres('/max-payne-3/'), title: 'Max Payne 3', meta: 'May 2012' },
    { href: adres('/remake/'), title: `Max Payne ${nb('1 & 2 Remake')}`, meta: 'No date yet' },
  ],
};

/** Каталог: все страницы дерева волны 1 по предмету; `/privacy/` и `/404/`
 *  — служебные, в подвале. Заголовок группы — ссылка на её первую страницу. */
const grupa = (title: string, urls: string[], href = urls[0]) => ({
  title,
  href: adres(href),
  count: urls.length,
  items: urls.map((url) => ({ label: getPage(url).h1, href: adres(url) })),
});

export const catalog = {
  title: 'Every page, by subject',
  lead: 'The three games and the remake, how to play them today, the story and the people behind Max, the movie and the rest.',
  label: 'The whole story',
  href: adres('/story/'),
  groups: [
    grupa('The games', ['/max-payne-1/', '/max-payne-2/', '/max-payne-3/', '/remake/']),
    grupa('Playing', ['/max-payne-3/guide/', '/cheats/', '/mods/', '/pc/']),
    grupa('Story and people', ['/story/', '/voice-and-face/', '/gameplay/', '/quotes/']),
    grupa('Screen and more', ['/movie/', '/media/', '/games-like-max-payne/']),
  ],
};

export const start = {
  title: 'New to Max Payne?',
  lead: 'Start where it started: New York, 2001. The first game’s page covers its versions, from the original PC release to the 2012 mobile port.',
  href: adres('/max-payne-1/'),
  label: 'Start with Max Payne (2001)',
};

/** Ключи кадров главной — для подвала (атрибуция по странице, П57 п. 1 у первого сайта). */
export const kluczeGlownej = [
  'hero',
  ...rows.flatMap((row) => row.panels),
  ...readNext.cards.map((card) => card.kadr),
  'mp1-k11',
];
