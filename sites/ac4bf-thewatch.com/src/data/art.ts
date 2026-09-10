import manifest from './art.json';
import type { ArtSlot } from '@factory/core/media/art.ts';

/**
 * Zdjęcia epok. W repozytorium nie trzymamy adresów ani wyników wyszukiwania —
 * tylko zapytania w `art.json`. `core/media/fetch-art.mjs` sam znajduje kadr
 * w Wikimedia Commons, ściąga go do `src/assets/foto/` i zapisuje autora oraz
 * licencję do `art-credits.json`. Żeby podmienić zdjęcie, zmienia się zapytanie
 * i uruchamia `npm run art` ponownie — nikt nie szuka ręcznie.
 *
 * TYPY WYJECHAŁY DO RDZENIA 2026-09-10, razem z narzędziem — `ArtSlot`
 * i `ArtCredit` mieszkają w `core/media/art.ts`. Tu został manifest witryny
 * i jego typowanie: zapytania są redakcyjnym wyborem tego świata, a nie formą.
 * `ArtCredit` re-eksportowany, bo czyta go `SiteFooter` i `media.ts` — żeby
 * witryna nie musiała znać dwóch adresów pod jedną umowę.
 */

export type { ArtSlot, ArtCredit } from '@factory/core/media/art.ts';

export const artSlots: ArtSlot[] = manifest.slots;
