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
  /**
   * Konkretny plik Commons (`File:…` albo sam tytuł) — wybór z arkusza
   * kandydatów, П57 (2026-09-15, «kadry rzędom»). Gdy jest, narzędzie nie
   * szuka: bierze ten plik, sprawdza tylko licencję i szerokość. `queries`,
   * `must`, `avoid` są wtedy zbędne.
   */
  file?: string;
  /** Kolejne podejścia, od najlepszego; pierwsze trafione wygrywa. */
  queries?: string[];
  /** Tytuł pliku musi zawierać choć jedno z tych słów. Wyszukiwarka Commons
   *  ocenia opis, nie kadr: bez tego pod „tall ship" trafia skan listu. */
  must?: string[];
  /** I nie może zawierać żadnego z tych — tu odpada współczesność w kadrze
   *  epoki oraz detal architektoniczny zamiast widoku. */
  avoid?: string[];
  /**
   * `false` wyłącza globalną listę odrzuceń narzędzia (mapy, plany, portrety,
   * dokumenty…) dla tego slotu — sloty ludzi, rycin i planów miast (П57)
   * inaczej nie dostaną żadnego kandydata. Domyślnie lista działa.
   */
  avoidDefault?: boolean;
  /**
   * Autor do atrybucji wpisany ręką — z pierwszeństwem nad polami `Artist`
   * i `Credit` z Commons (2026-09-16, backlog 50 p. 3). Na przypadki, których
   * czyszczenie w narzędziu nie tyka celowo: akapit z przypisem zamiast
   * nazwiska, URL zamiast imienia. Narzędzie zapisuje go do `art-credits.json`
   * jak każdy inny autor — plik atrybucji nadal pisze tylko ono.
   */
  author?: string;
  /** Kadr pionowy nie wejdzie w panoramę. */
  minAspect: number;
  minWidth: number;
  /**
   * Przycięcie w ułamkach boku (0–1), przed zmniejszeniem mastera — narzędzie
   * czytało je od początku, typ dostał to pole 2026-09-15: portret w ramie
   * 21:13 bez `crop` traci ponad połowę wysokości.
   */
  crop?: { left?: number; right?: number; top?: number; bottom?: number };
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
