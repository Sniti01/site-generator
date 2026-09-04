import manifest from './art.json';

/**
 * Zdjęcia epok. W repozytorium nie trzymamy adresów ani wyników wyszukiwania —
 * tylko zapytania w `art.json`. `tools/fetch-art.mjs` sam znajduje kadr
 * w Wikimedia Commons, ściąga go do `src/assets/foto/` i zapisuje autora oraz
 * licencję do `art-credits.json`. Żeby podmienić zdjęcie, zmienia się zapytanie
 * i uruchamia skrypt ponownie — nikt nie szuka ręcznie.
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

export const artSlots: ArtSlot[] = manifest.slots;

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
