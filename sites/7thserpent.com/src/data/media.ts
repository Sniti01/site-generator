import type { ImageMetadata } from 'astro';
import gameCredits from './game-art.json';

/**
 * Разрешатель кадра — единственное место витрины, которое знает, где лежат
 * изображения и откуда они. Форма — первого сайта (`src/data/media.ts`,
 * договор П4: ядро получает готовые `ImageMetadata` пропсом), источник
 * один: материалы издателя со Steam (`src/assets/gry/`, `tools/fetch-game-art.mjs`,
 * П79 п. 3). Commons и рисованного запаса у главной второго сайта нет.
 *
 * КЛЮЧ — имя файла и ключ записи в `game-art.json` одновременно: `hero`,
 * `<игра>-k<nn>` (скриншот по индексу витрины).
 *
 * НЕИЗВЕСТНЫЙ КЛЮЧ — ПРЕРВАННАЯ СБОРКА, а не пустая рамка: у кадров главной
 * нет запасной графики, и `SmartImage` без `src` напечатал бы пустое место
 * `zapas`. Гейт ресурсов (`gates/assets.mjs`) стережёт те же файлы на диске.
 */

export interface GameCredit {
  file: string;
  game: string;
  appid: number;
  kind: string;
  opis: string | null;
  license: string;
  source: string;
  width: number;
  height: number;
}

export interface Kadr {
  src: ImageMetadata;
  alt: string;
  game: string;
}

const gry = import.meta.glob<{ default: ImageMetadata }>('../assets/gry/*.jpg', { eager: true });

export const credits = gameCredits as Record<string, GameCredit>;

export function kadr(key: string): Kadr {
  const plik = Object.entries(gry).find(([path]) => path.endsWith(`/${key}.jpg`))?.[1].default;
  const credit = credits[key];
  if (!plik || !credit) {
    throw new Error(
      `Кадр "${key}": ${plik ? '' : 'нет файла src/assets/gry/' + key + '.jpg; '}${credit ? '' : 'нет записи в game-art.json; '}` +
        'скачайте его npm run gameart или уберите ключ со страницы.'
    );
  }
  return {
    src: plik,
    // alt — что на кадре, и чей это кадр: «Max Payne 3 — close-up of Max…».
    alt: `${credit.game} — ${credit.opis ?? 'publisher material'}`,
    game: credit.game,
  };
}
