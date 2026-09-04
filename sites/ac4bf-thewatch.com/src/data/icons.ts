/**
 * Zestaw ikon witryny: siedem nazw po polsku. Rysowanie jest w rdzeniu
 * (`@factory/core/primitives/Icon.astro`), tutaj tylko słownik — to on
 * jest własnością witryny i u następnej będzie inny.
 *
 * Ścieżki muszą mieścić się w siatce 24×24 i w kresce 1.5; rdzeń tego
 * nie sprawdza, bo nie ma czym — sprawdza to oko na przeglądzie.
 */
export type IconName =
  | 'szukaj'
  | 'strzalka-w-prawo'
  | 'strzalka-w-lewo'
  | 'w-dol'
  | 'menu'
  | 'zamknij'
  | 'czas';

export const iconPaths: Record<IconName, string> = {
  szukaj: '<circle cx="11" cy="11" r="6.25"/><path d="M15.6 15.6 20 20"/>',
  'strzalka-w-prawo': '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
  'strzalka-w-lewo': '<path d="M20 12H5"/><path d="m11 6-6 6 6 6"/>',
  'w-dol': '<path d="m6 9 6 6 6-6"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  zamknij: '<path d="m6 6 12 12"/><path d="m18 6-12 12"/>',
  czas: '<circle cx="12" cy="12" r="8.25"/><path d="M12 7.5V12l3 1.75"/>',
};
