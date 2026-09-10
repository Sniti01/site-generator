/**
 * Umowa manifestu zdjęć: kształt slotu, który czyta `core/media/fetch-art.mjs`,
 * i kształt atrybucji, którą to samo narzędzie zapisuje.
 *
 * TU SĄ WYŁĄCZNIE TYPY, ŻADNYCH WARTOŚCI, i to jest granica wyniesienia.
 * `art.json` z zapytaniami i `art-credits.json` z autorami zostają u witryny:
 * zapytania są redakcyjnym wyborem konkretnego świata, a autorzy — skutkiem
 * pobrania na tej konkretnej witrynie. Rdzeń zna formę, nie treść — ta sama
 * zasada, co w `core/styles/ROLES.md` («rdzeń niesie formę, wartości zostają
 * u witryny»).
 *
 * Wyniesione z `sites/ac4bf-thewatch.com/src/data/art.ts` 2026-09-10, razem
 * z narzędziem: `docs/REUSE.md` §1.5 wymienia tę parę jednym wierszem.
 * Witrynie został tam plik na trzy linijki — wczytuje swój manifest i nadaje
 * mu ten typ.
 */

export interface ArtSlot {
  /** Nazwa pliku bez rozszerzenia; zarazem klucz w art-credits.json. */
  id: string;
  /** Co ma być na kadrze — trafia do `alt`. */
  subject: string;
  /** Kolejne podejścia, od najlepszego; pierwsze trafione wygrywa. */
  queries: string[];
  /** Tytuł pliku musi zawierać choć jedno z tych słów. Wyszukiwarka Commons
   *  ocenia opis, nie kadr: bez tego pod „tall ship" trafia skan listu. */
  must: string[];
  /** I nie może zawierać żadnego z tych — tu odpada współczesność w kadrze
   *  epoki oraz detal architektoniczny zamiast widoku. */
  avoid: string[];
  /** Kadr pionowy nie wejdzie w panoramę. */
  minAspect: number;
  minWidth: number;
}

export interface ArtCredit {
  /** Nazwa pliku w src/assets/foto/ razem z rozszerzeniem. */
  file: string;
  /** Autor, już oczyszczony z HTML. */
  author: string;
  /** Skrót licencji, np. „CC BY-SA 4.0”. */
  license: string;
  licenseUrl: string;
  /** Strona pliku w Commons — tam prowadzi podpis. */
  source: string;
  title: string;
  width: number;
  height: number;
}
