import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

/**
 * Treść stron fali 1.
 *
 * Tytuł, h1, opis i słowa kluczowe NIE są tu przyjmowane — mieszkają
 * w `structure.json` (П24 punkt 3, «pola SEO się nie dublują»). Schemat jest
 * miejscem, gdzie ta zasada przestaje być umową i staje się błędem budowania:
 * `title` we front matterze wywali walidację, a nie przejdzie niezauważony.
 *
 * Reszta pól to DANE BLOKÓW, nie SEO. Który blok i w jakiej kolejności —
 * mówi `blocks[]` w strukturze; czym go wypełnić — mówi ten plik. Podział
 * jest celowy: kolejność sekcji należy do kontraktu, a zdania do treści.
 */

const link = z.object({
  href: z.string(),
  label: z.string(),
});

export const collections = {
  tresc: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/tresc' }),
    schema: z.object({
      url: z.string().startsWith('/').endsWith('/'),

      /** Klucz kadru w `game-art.json` — czym wypełnić miejsce `art`. */
      art: z.string().optional(),

      /* — hero-key-art — */
      lead: z.string(),
      primary: link,
      secondary: link,

      /* — story-row, po jednym wpisie na rząd — */
      rows: z
        .array(
          z.object({
            id: z.string(),
            /** Nadtytuł w roli `t-year`: rdzeń tej roli nie zna, niesie ją witryna. */
            year: z.string(),
            title: z.string(),
            meta: z.string(),
            body: z.array(z.string()).nonempty(),
            flip: z.boolean().default(false),
            band: z.boolean().default(false),
            art: z.string().optional(),
          })
        )
        .default([]),

      /* — card-rail — */
      cards: z
        .object({
          title: z.string(),
          lead: z.string().optional(),
          items: z.array(
            z.object({
              href: z.string(),
              title: z.string(),
              kind: z.string().optional(),
              place: z.string().optional(),
            })
          ),
        })
        .optional(),

      /* — cta-band — */
      cta: z
        .object({
          title: z.string(),
          lead: z.string(),
          href: z.string(),
          label: z.string(),
        })
        .optional(),
    }),
  }),
};
