/**
 * Treść strony głównej. Fakty o grach są prawdziwe; tytuły poradników,
 * daty i liczniki to materiał demonstracyjny do podmiany przez właściciela.
 */

export const site = {
  name: 'Bractwo',
  tagline: 'Nieoficjalny przewodnik po serii Assassin’s Creed',
  lang: 'pl',
};

export const nav = [
  { label: 'Epoki', href: '#zejscie' },
  { label: 'Poradniki', href: '#katalog' },
  { label: 'Mapy', href: '/mapy/' },
  { label: 'Postacie', href: '/postacie/' },
  { label: 'Aktualności', href: '/aktualnosci/' },
];

export type EraId = 'jerozolima' | 'wlochy' | 'karaiby' | 'londyn' | 'japonia';

export interface Guide {
  title: string;
  href: string;
  minutes: number;
}

export interface Era {
  id: EraId;
  year: string;
  /** Pełny zakres lat, gdy gra obejmuje więcej niż jeden rok. */
  span: string;
  place: string;
  game: string;
  released: string;
  hero: string;
  headline: string;
  body: string;
  /** Wysokość na skali zejścia, w procentach: 0 = iglica, 100 = stóg. */
  depth: number;
  guides: Guide[];
}

export const eras: Era[] = [
  {
    id: 'jerozolima',
    year: '1191',
    span: '1191',
    place: 'Ziemia Święta',
    game: 'Assassin’s Creed',
    released: '2007',
    hero: 'Altaïr Ibn-La’Ahad',
    headline: 'Trzecia krucjata',
    body: 'Jerozolima, Akka i Damaszek w czasie trzeciej krucjaty. Altaïr traci rangę mistrza i odzyskuje ją, likwidując dziewięć celów wskazanych przez Al Mualima. Stąd wzięło się wszystko, co seria robi do dziś: punkty widokowe, tłum jako osłona i ukryte ostrze.',
    depth: 8,
    guides: [
      { title: 'Dziewięć celów Al Mualima — kolejność i najkrótsza droga', href: '/poradniki/ac1-cele/', minutes: 12 },
      { title: 'Wszystkie sto flag Templariuszy, miasto po mieście', href: '/poradniki/ac1-flagi/', minutes: 21 },
      { title: 'Punkty widokowe: pełna mapa trzech miast', href: '/poradniki/ac1-punkty-widokowe/', minutes: 9 },
    ],
  },
  {
    id: 'wlochy',
    year: '1476',
    span: '1476–1499',
    place: 'Włochy',
    game: 'Assassin’s Creed II',
    released: '2009',
    hero: 'Ezio Auditore da Firenze',
    headline: 'Renesans',
    body: 'Florencja, Wenecja, Forlì i San Gimignano. Syn bankiera zostaje asasynem w ciągu jednej nocy, a gra otwiera się na rzeczy, które seria potem powtarza przez dekadę: własna posiadłość, sześć grobowców, dwadzieścia glifów i prawda ukryta pod nimi.',
    depth: 26,
    guides: [
      { title: 'Zbroja Altaïra: sześć grobowców asasynów krok po kroku', href: '/poradniki/ac2-grobowce/', minutes: 18 },
      { title: 'Sto piór Petruccia — mapy wszystkich dzielnic', href: '/poradniki/ac2-piora/', minutes: 24 },
      { title: 'Dwadzieścia glifów i układanki Podmiotu 16', href: '/poradniki/ac2-glify/', minutes: 16 },
    ],
  },
  {
    id: 'japonia',
    year: '1579',
    span: '1579',
    place: 'Japonia',
    game: 'Assassin’s Creed Shadows',
    released: '2025',
    hero: 'Naoe i Yasuke',
    headline: 'Okres Sengoku',
    body: 'Prowincja Yamashiro i okolice pod koniec okresu walczących prowincji. Dwoje bohaterów o przeciwnych metodach: shinobi, która żyje z cienia, i samuraj, który cienia nie potrzebuje. Pory roku zmieniają nie tylko widok, ale i to, gdzie da się przejść.',
    depth: 46,
    guides: [
      { title: 'Naoe czy Yasuke: kogo brać do jakiego zadania', href: '/poradniki/shadows-bohaterowie/', minutes: 10 },
      { title: 'Kryjówka — co budować w pierwszej kolejności', href: '/poradniki/shadows-kryjowka/', minutes: 13 },
      { title: 'Pory roku a skradanie się: zima kontra lato', href: '/poradniki/shadows-pory-roku/', minutes: 9 },
    ],
  },
  {
    id: 'karaiby',
    year: '1715',
    span: '1715–1722',
    place: 'Indie Zachodnie',
    game: 'Assassin’s Creed IV: Black Flag',
    released: '2013',
    hero: 'Edward Kenway',
    headline: 'Złoty wiek piractwa',
    body: 'Hawana, Nassau i Kingston, a między nimi otwarte morze. Walijski korsarz wchodzi w spór asasynów z templariuszami dla pieniędzy i zostaje w nim na dobre. Kawka jest tu drugą postacią, a nie środkiem transportu.',
    depth: 66,
    guides: [
      { title: 'Cztery legendarne okręty: taktyka na każdy z osobna', href: '/poradniki/ac4-legendarne-okrety/', minutes: 14 },
      { title: 'Pełne ulepszenia Kawki — w jakiej kolejności', href: '/poradniki/ac4-kawka/', minutes: 11 },
      { title: 'Mapy skarbów: gdzie kopać i czego szukać', href: '/poradniki/ac4-mapy-skarbow/', minutes: 26 },
    ],
  },
  {
    id: 'londyn',
    year: '1868',
    span: '1868',
    place: 'Londyn',
    game: 'Assassin’s Creed Syndicate',
    released: '2015',
    hero: 'Jacob i Evie Frye',
    headline: 'Rewolucja przemysłowa',
    body: 'Wiktoriański Londyn podzielony na dzielnice, które przejmuje się gang po gangu. Bliźnięta Frye grają dwa różne style: Jacob wchodzi drzwiami, Evie oknem. Linka z hakiem po raz pierwszy zmienia geometrię wspinaczki.',
    depth: 88,
    guides: [
      { title: 'Przejmowanie dzielnic: od Whitechapel do City', href: '/poradniki/syndicate-dzielnice/', minutes: 15 },
      { title: 'Jacob czy Evie — kto do czego się nadaje', href: '/poradniki/syndicate-blizniaki/', minutes: 8 },
      { title: 'Wszystkie punkty widokowe i skrzynie nad Tamizą', href: '/poradniki/syndicate-tamiza/', minutes: 19 },
    ],
  },
];

export interface FreshGuide {
  title: string;
  href: string;
  era: EraId;
  kind: string;
  date: string;
  dateLabel: string;
}

export const fresh: FreshGuide[] = [
  {
    title: 'Kolejność chronologiczna serii — od Isu do dnia dzisiejszego',
    href: '/poradniki/kolejnosc-chronologiczna/',
    era: 'wlochy',
    kind: 'Przewodnik',
    date: '2026-08-24',
    dateLabel: '24 sierpnia 2026',
  },
  {
    title: 'Od czego zacząć w 2026 roku, jeśli nie grałeś w nic',
    href: '/poradniki/od-czego-zaczac/',
    era: 'japonia',
    kind: 'Dla nowych',
    date: '2026-08-19',
    dateLabel: '19 sierpnia 2026',
  },
  {
    title: 'Parkour przez trzy pokolenia silnika: co się naprawdę zmieniło',
    href: '/artykuly/parkour-trzy-pokolenia/',
    era: 'londyn',
    kind: 'Analiza',
    date: '2026-08-11',
    dateLabel: '11 sierpnia 2026',
  },
  {
    title: 'Wszystkie ukryte ostrza serii i jak działały naprawdę',
    href: '/artykuly/ukryte-ostrza/',
    era: 'jerozolima',
    kind: 'Sprzęt',
    date: '2026-08-03',
    dateLabel: '3 sierpnia 2026',
  },
  {
    title: 'Żeglowanie w Black Flag: pełny poradnik dla powracających',
    href: '/poradniki/ac4-zeglowanie/',
    era: 'karaiby',
    kind: 'Poradnik',
    date: '2026-07-28',
    dateLabel: '28 lipca 2026',
  },
];

export interface CatalogGroup {
  title: string;
  href: string;
  count: number;
  items: { label: string; href: string }[];
}

export const catalog: CatalogGroup[] = [
  {
    title: 'Przejścia',
    href: '/przejscia/',
    count: 42,
    items: [
      { label: 'Wątek główny, część po części', href: '/przejscia/watek-glowny/' },
      { label: 'Zadania poboczne warte czasu', href: '/przejscia/poboczne/' },
      { label: 'Zakończenia i sceny po napisach', href: '/przejscia/zakonczenia/' },
      { label: 'Trofea i osiągnięcia na sto procent', href: '/przejscia/trofea/' },
    ],
  },
  {
    title: 'Mapy i znajdźki',
    href: '/mapy/',
    count: 68,
    items: [
      { label: 'Skrzynie, pióra, flagi, glify', href: '/mapy/znajdzki/' },
      { label: 'Punkty widokowe wszystkich części', href: '/mapy/punkty-widokowe/' },
      { label: 'Mapy skarbów i wraki', href: '/mapy/skarby/' },
      { label: 'Grobowce i lochy', href: '/mapy/grobowce/' },
    ],
  },
  {
    title: 'Walka i sprzęt',
    href: '/sprzet/',
    count: 37,
    items: [
      { label: 'Buildy pod skradanie i pod otwartą walkę', href: '/sprzet/buildy/' },
      { label: 'Broń: co realnie się opłaca', href: '/sprzet/bron/' },
      { label: 'Zbroje i komplety bonusów', href: '/sprzet/zbroje/' },
      { label: 'Umiejętności — kolejność odblokowania', href: '/sprzet/umiejetnosci/' },
    ],
  },
  {
    title: 'Fabuła i świat',
    href: '/fabula/',
    count: 51,
    items: [
      { label: 'Chronologia serii bez spoilerów', href: '/fabula/chronologia/' },
      { label: 'Isu, Eden i cała reszta mitologii', href: '/fabula/isu/' },
      { label: 'Kim jest kto: asasyni i templariusze', href: '/fabula/postacie/' },
      { label: 'Historia kontra gra: co jest prawdą', href: '/fabula/historia/' },
    ],
  },
];
