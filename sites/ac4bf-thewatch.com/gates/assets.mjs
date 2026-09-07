// Dane witryny dla bramki zasobów z `@factory/core/gates`.
// Wpis to krotka [ścieżka, opis]: ścieżka liczy się od `src/assets/`.
//
// Lista jest własnością witryny, nie rdzenia. Rdzeń wie, jak sprawdzić,
// czy plik leży na dysku; tylko witryna wie, których plików naprawdę wymaga
// jej gotowa strona.
//
// PUSTA LISTA JEST POPRAWNA i oznacza świeży klon szablonu — bramka wtedy
// przechodzi. To nie jest usterka do naprawienia: szablon ma się składać
// i wyglądać skończenie, zanim ktokolwiek uruchomi `npm run art`
// czy `npm run gameart`. Ta sama zasada co przy nieistniejącym
// `src/assets/foto/` w MIGRATION.md: „Nie «naprawiać»”.
//
// Wpis dodaje się wtedy, gdy strona bez tego pliku wygląda gorzej, niż
// powinna — nie wtedy, gdy plik po prostu istnieje. Dlatego okładek
// (`*-okladka.jpg`) tu nie ma: pobiera je `tools/fetch-game-art.mjs`
// i nazywa `game-art.json`, ale żaden komponent ich dziś nie rysuje.

// Kluczowy art gier: `EraMedia` szuka go jako `<slot>.jpg` i to jest
// pierwsze źródło z trzech. Bez niego kadr schodzi na rysowaną panoramę —
// strona się złoży, ale wygląda jak plansza, nie jak serwis o grze.
const slots = [
  ['hero', 'kadr pierwszego ekranu'],
  ['jerozolima', 'kadr epoki jerozolima'],
  ['wlochy', 'kadr epoki wlochy'],
  ['karaiby', 'kadr epoki karaiby'],
  ['londyn', 'kadr epoki londyn'],
  ['japonia', 'kadr epoki japonia'],
];

export default slots.map(([slot, opis]) => [`gry/${slot}.jpg`, opis]);
