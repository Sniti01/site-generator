/**
 * Treść strony głównej. Fakty o grach są prawdziwe. Tytuły i rodzaje wpisów
 * idą ze struktury (`getPage`), liczniki stogu — z drzewa, daty kart taśmy —
 * z podpisów stron (П50, 2026-09-15); materiału demonstracyjnego tu nie ma
 * od 2026-09-15 (do 2026-09-11 były nim tytuły i liczniki, do 2026-09-15 — daty).
 */

export const site = {
  name: 'The Brotherhood',
  tagline: 'An unofficial guide to the Assassin’s Creed series',
  lang: 'en',
};

/**
 * Menu główne. Trzy ostatnie pozycje prowadziły pod `/mapy/`, `/postacie/`
 * i `/aktualnosci/` — adresy drugiej schematyki, których w drzewie nie ma
 * (П27 punkt 3). Zastąpione adresami z drzewa.
 *
 * Kotwice `#zejscie` i `#katalog` są ADRESAMI BEZWZGLĘDNYMI od 2026-09-11
 * (punkt 24 backlogu, П40 krok 2). Do tego dnia stały gołe — «to miejsca
 * na stronie, nie adresy» — i dowód był prawdziwy dla głównej, i tylko dla
 * niej: szapka drukuje się na każdej stronie, a `#zejscie` istnieje na jednej.
 * Na `/assassins-creed-4-black-flag/` cztery linki z menu wiodły donikąd
 * (szapka i szuflada, po dwa). Z `/` z przodu prowadzą z każdej strony
 * na główną do właściwego miejsca; na samej głównej przeglądarka traktuje
 * `/#zejscie` jak kotwicę tej samej strony. Pilnuje tego `core/gates/anchors.mjs`.
 */
export const nav = [
  { label: 'Eras', href: '/#zejscie' },
  { label: 'Guides', href: '/#katalog' },
  { label: 'Locations map', href: '/historical-locations-map/' },
  // «Film Rodowód» od 2026-09-12 (П44, punkt 35): strona pod tym adresem jest
  // o filmie Lineage, nie o rodowodzie serii — etykieta «Rodowód serii» obiecywała
  // co innego. Stopka (SiteFooter.astro) dostała tę samą etykietę 2026-09-15
  // (П50, punkt 39).
  { label: 'Lineage film', href: '/assassins-creed-lineage/' },
];

export type EraId = 'jerozolima' | 'wlochy' | 'karaiby' | 'londyn' | 'japonia';

/**
 * Strona gry, w której epoka jest osadzona. Warstwy prowadziły pod
 * `/epoki/<id>/` — siódmy adres drugiej schematyki, którego w drzewie nie ma
 * (П27 punkt 3). Epoka nie ma własnej strony i mieć jej nie planuje: prowadzi
 * do gry, która ją niesie.
 */
export const stronaEpoki: Record<EraId, string> = {
  jerozolima: '/assassins-creed-1/',
  wlochy: '/assassins-creed-2/',
  karaiby: '/assassins-creed-4-black-flag/',
  londyn: '/assassins-creed-syndicate/',
  japonia: '/assassins-creed-shadows/',
};

/**
 * Pozycja listy w warstwie: TYLKO ADRES. Tytuł i dopisek bierze `EraLayer`
 * ze struktury (`getPage(href).h1`, typ strony), więc adres spoza drzewa
 * przerywa budowanie zamiast wisieć martwym linkiem. Do 2026-09-11 stały tu
 * tytuły i minuty czytania piętnastu poradników, których w drzewie nie było
 * (43 adresy-widma na głównej, odpowiedź właściciela 3а): zamienione na strony
 * epoki istniejące w fali 1 — 7 zamian, 8 zdjęć (Japonia i Londyn bez listy).
 */
export interface Guide {
  href: string;
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
  /** Wysokość na skali zejścia, w procentach: 0 = iglica, 100 = stóg (środek
   *  bloku `#katalog` w środku okna — П44 dop., 2026-09-12). Zapas SSR zanim
   *  wstanie skrypt `DescentRail`; liczony tym samym wzorem na geometrii
   *  1440×900 sborki 2026-09-12: (środek warstwy − 450) / (środek stogu − 450). */
  depth: number;
  guides: Guide[];
}

export const eras: Era[] = [
  {
    id: 'jerozolima',
    year: '1191',
    span: '1191',
    place: 'Holy Land',
    game: 'Assassin’s Creed',
    released: '2007',
    hero: 'Altaïr Ibn-La’Ahad',
    headline: 'The Third Crusade',
    body: 'Jerusalem, Acre and Damascus during the Third Crusade. Altaïr loses his rank of master and wins it back by eliminating nine targets named by Al Mualim. Everything the series still does today started here: viewpoints, the crowd as cover and the hidden blade.',
    depth: 12,
    // Cypr 1191, prosto po Jerozolimie: jedyna strona drzewa z tej epoki poza samą grą.
    guides: [{ href: '/assassins-creed-bloodlines/' }],
  },
  {
    id: 'wlochy',
    year: '1476',
    span: '1476–1499',
    place: 'Italy',
    game: 'Assassin’s Creed II',
    released: '2009',
    hero: 'Ezio Auditore da Firenze',
    headline: 'The Renaissance',
    body: 'Florence, Venice, Forlì and San Gimignano. A banker’s son becomes an Assassin in a single night, and the game opens up to things the series would repeat for a decade: an estate of your own, six tombs, twenty glyphs and the truth hidden beneath them.',
    depth: 22,
    guides: [
      { href: '/assassins-creed-brotherhood/' },
      { href: '/assassins-creed-revelations/' },
      { href: '/ezio-auditore/' },
    ],
  },
  {
    id: 'japonia',
    year: '1579',
    span: '1579',
    place: 'Japan',
    game: 'Assassin’s Creed Shadows',
    released: '2025',
    hero: 'Naoe and Yasuke',
    headline: 'The Sengoku period',
    body: 'Yamashiro Province and its surroundings at the end of the Warring States period. Two heroes with opposite methods: a shinobi who lives in the shadows and a samurai who has no need for them. The seasons change not only the view but also where you can get through.',
    depth: 37,
    // W drzewie fali 1 nie ma innej strony z Japonii poza samą grą — lista zdjęta.
    guides: [],
  },
  {
    id: 'karaiby',
    year: '1715',
    span: '1715–1722',
    place: 'West Indies',
    game: 'Assassin’s Creed IV: Black Flag',
    released: '2013',
    hero: 'Edward Kenway',
    headline: 'The Golden Age of Piracy',
    body: 'Havana, Nassau and Kingston, with the open sea between them. A Welsh privateer joins the feud between the Assassins and the Templars for money and stays in it for good. The Jackdaw is a second character here, not a means of transport.',
    depth: 48,
    guides: [
      { href: '/assassins-creed-4-black-flag/freedom-cry/' },
      { href: '/assassins-creed-rogue/' },
      { href: '/assassins-creed-pirates/' },
    ],
  },
  {
    id: 'londyn',
    year: '1868',
    span: '1868',
    place: 'London',
    game: 'Assassin’s Creed Syndicate',
    released: '2015',
    hero: 'Jacob and Evie Frye',
    headline: 'The Industrial Revolution',
    body: 'Victorian London divided into boroughs that you take over gang by gang. The Frye twins play two different styles: Jacob comes in through the door, Evie through the window. The rope launcher changes the geometry of climbing for the first time.',
    depth: 68,
    // W drzewie fali 1 nie ma innej strony z Londynu poza samą grą — lista zdjęta.
    guides: [],
  },
];

/**
 * Słownik typów strony ze struktury → słowo przy linku. Jedyne miejsce,
 * które zna te słowa; trasa ma własne dwa («Gra»/«Tekst»).
 */
export const rodzaj: Record<string, string> = {
  game: 'Game',
  topic: 'Article',
  guide: 'Guide',
  hub: 'Catalog',
  map: 'Map',
  home: 'Home',
};

/**
 * Karta taśmy «Świeżo z Animusa»: adres i epoka (paleta i kadr).
 * Tytuł i rodzaj bierze `GuideRail` ze struktury, DATĘ — z `byline` pliku
 * treści strony (П50, 2026-09-15, punkt 1а): jedno źródło daty na witrynę.
 * Do 2026-09-15 daty stały tutaj jako materiał demonstracyjny
 * (28 lipca – 24 sierpnia 2026), bo strony były `planned`.
 * 2026-09-11: cztery z pięciu adresów były widmami — zamienione na strony
 * TEJ SAMEJ EPOKI z drzewa, żeby paleta i kadr karty zostały (4 zamiany, 0 zdjęć).
 * Skład taśmy — te same pięć adresów do fali 2 (П50).
 */
export interface FreshGuide {
  href: string;
  era: EraId;
}

export const fresh: FreshGuide[] = [
  { href: '/ezio-auditore/', era: 'wlochy' },
  { href: '/guides/where-to-start/', era: 'japonia' },
  { href: '/assassins-creed-syndicate/', era: 'londyn' },
  { href: '/assassins-creed-1/', era: 'jerozolima' },
  { href: '/assassins-creed-4-black-flag/', era: 'karaiby' },
];

/**
 * Dział stogu: nagłówek działu prowadzi pod `href` (strona z drzewa),
 * `pages` to WSZYSTKIE strony działu — licznik działu jest ich liczbą,
 * a `CatalogStack` pokazuje pierwsze cztery. Etykiety bierze ze struktury.
 * Do 2026-09-11 katalog niósł cztery działy drugiej schematyki (`/przejscia/`,
 * `/mapy/`, `/sprzet/`, `/fabula/`) z szesnastoma podstronami — 20 widm.
 * Zamienione na cztery działy DRZEWA: 20 zamian, 0 zdjęć; liczniki prawdziwe
 * (6 + 6 + 9 + 7 = 28 stron poza główną i hubem).
 */
export interface CatalogGroup {
  title: string;
  href: string;
  pages: string[];
}

export const catalog: CatalogGroup[] = [
  {
    title: 'Altaïr and Ezio',
    href: '/assassins-creed-1/',
    pages: [
      '/assassins-creed-1/',
      '/assassins-creed-2/',
      '/assassins-creed-brotherhood/',
      '/assassins-creed-revelations/',
      '/assassins-creed-2/discovery/',
      '/assassins-creed-bloodlines/',
    ],
  },
  {
    title: 'The New World and the seas',
    href: '/assassins-creed-4-black-flag/',
    pages: [
      '/assassins-creed-3/',
      '/assassins-creed-4-black-flag/',
      '/assassins-creed-rogue/',
      '/assassins-creed-liberation/',
      '/assassins-creed-4-black-flag/freedom-cry/',
      '/assassins-creed-pirates/',
    ],
  },
  {
    title: 'Revolutions and the RPG era',
    href: '/assassins-creed-shadows/',
    pages: [
      '/assassins-creed-unity/',
      '/assassins-creed-syndicate/',
      '/assassins-creed-origins/',
      '/assassins-creed-odyssey/',
      '/assassins-creed-chronicles/',
      '/assassins-creed-mirage/',
      '/assassins-creed-valhalla/',
      '/assassins-creed-valhalla/dawn-of-ragnarok/',
      '/assassins-creed-shadows/',
    ],
  },
  {
    title: 'Guides, characters, places',
    href: '/guides/',
    pages: [
      '/guides/where-to-start/',
      '/assassins-creed-free/',
      '/ezio-auditore/',
      '/historical-locations-map/',
      '/assassins-creed-world-war-2/',
      '/assassins-creed-lineage/',
      '/assassins-creed-valhalla/eivor/',
    ],
  },
];

/**
 * Numeracja serii — czternaście numerowanych części głównej linii w kolejności
 * premier. Blok `link-list#numeracja-serii` stoi w `blocks[]` głównej od
 * strony struktury (`manual`, `high`) i do 2026-09-11 nie był drukowany;
 * sprawdzenie «`blocks[]` równa się wydrukowi» (П32 p.4, wariant b) tego nie
 * przepuszcza — więc lista jest. Fakty o grach prawdziwe, adresy z drzewa.
 */
export interface Czesc {
  href: string;
  title: string;
  year: string;
}

export const numeracja: Czesc[] = [
  { href: '/assassins-creed-1/', title: 'Assassin’s Creed', year: '2007' },
  { href: '/assassins-creed-2/', title: 'Assassin’s Creed II', year: '2009' },
  { href: '/assassins-creed-brotherhood/', title: 'Assassin’s Creed: Brotherhood', year: '2010' },
  { href: '/assassins-creed-revelations/', title: 'Assassin’s Creed: Revelations', year: '2011' },
  { href: '/assassins-creed-3/', title: 'Assassin’s Creed III', year: '2012' },
  { href: '/assassins-creed-4-black-flag/', title: 'Assassin’s Creed IV: Black Flag', year: '2013' },
  { href: '/assassins-creed-rogue/', title: 'Assassin’s Creed: Rogue', year: '2014' },
  { href: '/assassins-creed-unity/', title: 'Assassin’s Creed: Unity', year: '2014' },
  { href: '/assassins-creed-syndicate/', title: 'Assassin’s Creed: Syndicate', year: '2015' },
  { href: '/assassins-creed-origins/', title: 'Assassin’s Creed: Origins', year: '2017' },
  { href: '/assassins-creed-odyssey/', title: 'Assassin’s Creed: Odyssey', year: '2018' },
  { href: '/assassins-creed-valhalla/', title: 'Assassin’s Creed: Valhalla', year: '2020' },
  { href: '/assassins-creed-mirage/', title: 'Assassin’s Creed: Mirage', year: '2023' },
  { href: '/assassins-creed-shadows/', title: 'Assassin’s Creed: Shadows', year: '2025' },
];

/**
 * Podpis głównej (`byline`, П32 p.3, odpowiedź właściciela 2): jak u strony gry —
 * «Redakcja · Bractwo»; data — DZIEŃ PRZESIADKI WZORCA, nie dzień poprawki.
 * Jeśli przesiadka przesunie się na inny dzień, zmienia się ta jedna para.
 */
export const podpis = {
  role: 'Editorial team',
  author: 'The Brotherhood',
  date: '2026-09-16',
  dateLabel: 'September 16, 2026',
};
