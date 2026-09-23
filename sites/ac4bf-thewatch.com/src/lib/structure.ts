import structure from '../../structure/structure.json';

/**
 * Jedyne wejście do `structure.json` po stronie witryny.
 *
 * Struktura jest źródłem prawdy o stronach (decyzja П24 punkt 1): strony spoza
 * niej nie ma, a build ma się wywalić, nie zmilczeć. Dlatego `getPage` rzuca
 * wyjątkiem zamiast zwracać `undefined` — wołane w `getStaticPaths` zamienia
 * błędny adres w przerwany build, a nie w cichą pustą stronę.
 *
 * Pola SEO — `title`, `h1`, `description`, `keywords`, `parent`, `related` —
 * mieszkają TYLKO tutaj (П24 punkt 3). We front matterze treści ich nie ma
 * i schemat kolekcji ich nie przyjmuje.
 */

/**
 * Kształt zdjęty z danych, nie wymyślony: przejrzane polami wszystkie 30 stron.
 * `cluster` i `parent` bywają `null` (nie brakiem klucza), a `confidence` jest
 * napisem, nie liczbą. Typ opisuje to, co w kontrakcie stoi.
 */
export interface StructurePage {
  url: string;
  /** Nie zawężone do unii: słownik typów należy do kontraktu, nie do witryny. */
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
  /**
   * Korytarz długości — znaki bez spacji w `<main>` zbudowanej strony,
   * `[min, max]` z anatomii S3/S4 albo `null` z nazwanej decyzji (П43).
   * Pilnuje bramka wyniku `core/gates/corridor.mjs`. Pola `status` tu nie ma
   * od 2026-09-11: nikt go nie prowadził, stan strony wynika z istnienia
   * pliku treści i sborki, nie z ręcznego napisu.
   */
  corridor: [number, number] | null;
  volume: number;
  owner: boolean;
}

export const site = structure.site;
export const pages = structure.pages as StructurePage[];

const wedlugUrl = new Map(pages.map((strona) => [strona.url, strona]));

/** Strona ze struktury albo przerwany build — trzeciej drogi nie ma. */
export function getPage(url: string): StructurePage {
  const strona = wedlugUrl.get(url);
  if (!strona) {
    throw new Error(
      `Adres ${url} nie istnieje w structure.json (${pages.length} stron). ` +
        'Struktura jest źródłem prawdy o stronach — decyzja П24 punkt 1. ' +
        'Dopisz stronę do struktury albo popraw pole `url` w treści.'
    );
  }
  return strona;
}

/** Jedno ogniwo okruszków: adres i etykieta. */
export interface Crumb {
  href: string;
  label: string;
}

/**
 * Okruszki — droga od głównej do strony, po `parent` struktury (П24 p. 2:
 * okruszki i `BreadcrumbList` to jeden obchód po tym polu; П57, odp. 4a:
 * etykieta to `h1` strony, główna nazywa się po ludzku). Główna daje
 * jedno ogniwo — komponent takiej drogi nie drukuje. Pętla po `parent`
 * kończy się na `null` korzenia; cykl albo rodzic spoza struktury to
 * przerwany build, jak u `getPage`.
 */
export function getBreadcrumbs(url: string): Crumb[] {
  const trail: Crumb[] = [];
  let strona: StructurePage | null = getPage(url);
  const widziane = new Set<string>();
  while (strona) {
    if (widziane.has(strona.url)) {
      throw new Error(`Okruszki: cykl w polu parent przy ${strona.url} — popraw structure.json.`);
    }
    widziane.add(strona.url);
    trail.unshift({ href: strona.url, label: strona.url === '/' ? 'Home' : strona.h1 });
    strona = strona.parent ? getPage(strona.parent) : null;
  }
  return trail;
}
