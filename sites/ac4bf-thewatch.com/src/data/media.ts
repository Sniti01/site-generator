import type { ImageMetadata } from 'astro';
import { artSlots, type ArtCredit } from './art';
import photoCredits from './art-credits.json';
import gameCredits from './game-art.json';

/**
 * Rozstrzygacz źródła kadru — jedyne miejsce w witrynie, które wie, gdzie leżą
 * obrazy i skąd pochodzą. Trzy poziomy, w tej kolejności:
 *
 * 1. materiał gry ze Steama (`src/assets/gry/`) — kluczowy art w pełnym kolorze;
 * 2. zdjęcie z Wikimedia Commons (`src/assets/foto/`) — duoton w kolorze epoki;
 * 3. nic — wtedy kadr rysuje zapasową grafikę, jeśli ma gdzie.
 *
 * DLACZEGO MODUŁ, A NIE KOMPONENT. Rdzeń dostaje obrazy propsem (decyzja П4),
 * a `CardRail` rysuje karty z danych — więc metadane muszą powstać zanim
 * zacznie się rysowanie. Komponentu nie da się wywołać z frontmattera, modułu
 * owszem; dzięki temu rozstrzygacz jest jeden dla `EraMedia` i dla listy kart.
 *
 * GLOB MIESZKA TUTAJ, a nie w rdzeniu, i nie z wygody. Wzorzec relatywny jedzie
 * razem z modułem: przeniesiony do `core/`, wskazywałby na `core/assets/gry/`
 * i zwracał zero dopasowań — cicho, przy zielonej budowie. Wzorzec od korzenia
 * działa i z rdzenia, ale byłby drugą umową na zasoby obok propsowej.
 */

export interface GameCredit {
  /** Nazwa gry — trafia do `alt` i do podpisu. */
  game: string;
  /** Karta gry w witrynie Steam. */
  source: string;
}

export interface MediaSource {
  /** Metadane obrazu albo `undefined`, gdy nie pobrano niczego. */
  src?: ImageMetadata;
  alt: string;
  /** Kompromis wagi i jakości zależy od tego, jak duży jest kadr. */
  quality: number;
  /** Modyfikator otoczki: materiał wydawcy idzie w pełnym kolorze. */
  class?: string;
  /** Czy wypadł materiał gry — decyduje o formie podpisu. */
  game: boolean;
  gameCredit?: GameCredit;
  photoCredit?: ArtCredit;
}

const gry = import.meta.glob<{ default: ImageMetadata }>('../assets/gry/*.{jpg,jpeg,png,webp}', {
  eager: true,
});
const foto = import.meta.glob<{ default: ImageMetadata }>('../assets/foto/*.{jpg,jpeg,png,webp}', {
  eager: true,
});

const znajdz = (zbior: Record<string, { default: ImageMetadata }>, slot: string) =>
  Object.entries(zbior).find(([path]) => path.endsWith(`/${slot}.jpg`))?.[1].default;

/**
 * Kadr dla slotu: `hero` albo identyfikator epoki. Nazwa slotu jest zarazem
 * nazwą pliku i kluczem w obu plikach kredytowych — jedno imię, trzy miejsca.
 */
export function mediaFor(slot: string, alt?: string): MediaSource {
  const gra = znajdz(gry, slot);
  const zdjecie = gra ? undefined : znajdz(foto, slot);
  const gameCredit = (gameCredits as Record<string, GameCredit>)[slot];
  const photoCredit = (photoCredits as Record<string, ArtCredit>)[slot];

  return {
    src: gra ?? zdjecie,
    alt:
      alt ??
      (gra
        ? `${gameCredit?.game ?? 'Assassin’s Creed'} — materiał wydawcy`
        : (artSlots.find((item) => item.id === slot)?.subject ?? '')),
    // Pierwszy ekran ogląda się na całej szerokości, więc dostaje wyższą jakość
    // niż panele epok i kafle w taśmie. Zdjęcie z Commons schodzi niżej: duoton
    // i tak zjada część detalu.
    quality: gra ? (slot === 'hero' ? 80 : 72) : 62,
    class: gra ? 'foto--gra' : undefined,
    game: Boolean(gra),
    gameCredit,
    photoCredit,
  };
}
