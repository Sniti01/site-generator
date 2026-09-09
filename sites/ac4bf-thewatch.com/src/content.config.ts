import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

/**
 * Treść stron fali 1. Jedno pole i ani jednego więcej: `url`.
 *
 * Tytuł, h1, opis i słowa kluczowe NIE są tu przyjmowane — mieszkają
 * w `structure.json` (П24 punkt 3, «pola SEO się nie dublują»). Schemat jest
 * miejscem, gdzie ta zasada przestaje być umową i staje się błędem budowania:
 * `title` we front matterze wywali walidację, a nie przejdzie niezauważony.
 */
export const collections = {
  tresc: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/tresc' }),
    schema: z.object({
      url: z.string().startsWith('/').endsWith('/'),
    }),
  }),
};
