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

      /** Epoka strony spoza artu — paleta rzędów, gdy art jest slugiem gry
       *  (П45, 2026-09-12; backlog 37 zamyka się stroną po stronie). Tylko
       *  jedna z pięciu epok `stronaEpoki`; gra spoza pięciu pola nie ma
       *  i zostaje w `--accent`. Trasa: epoka rzędu → epoka strony z artu →
       *  to pole → bez domyślnej. */
      era: z.enum(['jerozolima', 'wlochy', 'karaiby', 'londyn', 'japonia']).optional(),

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

      /* — card-rail —
         LISTA, NIE POJEDYNCZY OBIEKT, i to nie zapas: `blocks[]` wolno
         zadeklarować dwie taśmy na jednej stronie, jeśli różni je `role`
         (`/ezio-auditore/`). Trasa dopasowuje wpis do wystąpienia po tym
         polu; wpis bez `role` obsługuje wystąpienie bez `role`.
         Zmiana kształtu nic nie kosztowała: pole `cards` nie miało w tej
         chwili ani jednego użycia w treści. */
      cards: z
        .array(
          z.object({
            role: z.string().optional(),
            title: z.string(),
            lead: z.string().optional(),
            items: z.array(
              z.object({
                href: z.string(),
                title: z.string(),
                kind: z.string().optional(),
                place: z.string().optional(),
                /** Klucz kadru (`game-art.json` albo `art-credits.json`) — trasa
                 *  rozstrzyga go przez `mediaFor`, jak `GuideRail` na głównej.
                 *  Bez klucza karta idzie bez miejsca na kadr (punkt 34, П44). */
                art: z.string().optional(),
              })
            ),
          })
        )
        .optional(),

      /* — link-columns —
         Cztery kolumny prawdziwych linków. Kształt grup taki sam, jakiego
         `LinkColumns` żąda propsem, i taki sam, jaki `CatalogStack` podaje
         na głównej ze `src/data/site.ts`. */
      columns: z
        .object({
          title: z.string(),
          lead: z.string(),
          label: z.string(),
          href: z.string(),
          groups: z.array(
            z.object({
              title: z.string(),
              href: z.string(),
              count: z.number(),
              items: z.array(z.object({ label: z.string(), href: z.string() })),
            })
          ),
        })
        .optional(),

      /* — byline — */
      byline: z
        .object({
          author: z.string(),
          /** Машинная дата: только она едет в `<time datetime>`. */
          date: z.string(),
          dateLabel: z.string(),
          role: z.string().optional(),
        })
        .optional(),

      /* — toc: пункты называет страница, из разметки они не выводятся — */
      toc: z
        .object({
          title: z.string(),
          items: z.array(z.object({ href: z.string(), title: z.string() })).nonempty(),
        })
        .optional(),

      /* — gallery: кадры идут ДАННЫМИ, по прецеденту card-rail — */
      gallery: z
        .object({
          title: z.string(),
          lead: z.string().optional(),
          items: z
            .array(z.object({ art: z.string(), alt: z.string(), caption: z.string().optional() }))
            .nonempty(),
        })
        .optional(),

      /* — verdict-box: БАЛЛА НЕТ, и его негде подать — */
      verdict: z
        .object({
          label: z.string(),
          body: z.array(z.string()).nonempty(),
        })
        .optional(),

      /* — link-list: заголовок секции; сами ссылки приходят из `related` — */
      related: z.object({ title: z.string() }).optional(),

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
