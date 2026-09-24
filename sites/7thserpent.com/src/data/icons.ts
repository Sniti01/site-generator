/**
 * Набор иконок витрины. Рисование — в ядре (`@factory/core/primitives/Icon.astro`:
 * сетка 24×24, штрих 1.5, `currentColor`), здесь только словарь — он
 * собственность сайта. Пути — те же, что у первого сайта: стрелки одного
 * веса на всех сайтах фабрики не спорят с темой.
 */
export type IconName = 'arrow-right' | 'arrow-left' | 'arrow-down';

export const iconPaths: Record<IconName, string> = {
  'arrow-right': '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
  'arrow-left': '<path d="M20 12H5"/><path d="m11 6-6 6 6 6"/>',
  'arrow-down': '<path d="m6 9 6 6 6-6"/>',
};
