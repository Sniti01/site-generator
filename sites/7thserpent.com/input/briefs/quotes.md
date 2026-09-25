# Brief: `/quotes/`

*Assembled by `tools/brief-strony.mjs` from the structure, the S3 anatomy and the corpus
manifest. Addresses only — no competitor wording (backlog, item 1; П85 п. 5).
`npm run brief -- --check` guards this mechanically.*

## Contract (structure.json — fill it, do not change it)

| Field | Value |
|---|---|
| type | `topic` |
| h1 | Max Payne quotes: the best lines from all three games |
| title | Max Payne quotes — the famous monologues and one-liners |
| description | The most memorable Max Payne quotes: the noir monologues of the first game, the lines of Max Payne 2, and the darkest one-liners of Max Payne 3, sorted by game. |
| parent | `/` |
| cluster | max payne quotes · queries 3 · demand 270 (Ahrefs, US) |
| corridor (contract) | 5093–6891 |
| hero art | not applicable — the page declares no `hero-key-art` |

**Keywords** (3): max payne quotes · max payne 3 quotes · max payne 2 quotes

**Related** (`link-list` prints them from the structure, titled by their `h1`):
- `/story/` — Max Payne story and characters: from New York to São Paulo
- `/media/` — Max Payne art and media: covers, wallpapers, comics and soundtracks
- `/voice-and-face/` — Who is behind Max Payne: the voice, the face and the creators

**blocks[]** — the set and order of sections; each printed block needs its field in the content file:
- `byline` — anatomy, medium, evidence 2/4. core block without a route branch yet — the branch is written with the first page of its form, owner’s look (plan P4)
- `story-row` — type-default, low. printed by the route
- `gallery` — anatomy, medium, evidence 2/4. core block without a route branch yet — the branch is written with the first page of its form, owner’s look (plan P4)
- `link-list` — type-default, low. printed by the route
- `cta-band` — type-default, low. core block without a route branch yet — the branch is written with the first page of its form, owner’s look (plan P4)

## Content plan (S3 anatomy, page corpus)

- documents 4 from 3 hosts, basket **mid**
- **characters without spaces — the contract corridor: 5093–6891**; the anatomy gives 5093–6891, median 5992
- headings: h2 median 9, h3 median 0

| Topic (our vocabulary) | documents | share | verdict |
|---|---:|---:|---|
| characters | 1/4 | 25 % | гэп |
| development | 1/4 | 25 % | гэп |
| media | 1/4 | 25 % | гэп |
| quotes | 1/4 | 25 % | гэп |
| sources | 1/4 | 25 % | гэп |

| Page element | documents | share | verdict |
|---|---:|---:|---|
| breadcrumbs | 2/4 | 50 % | на решение |
| spis-tresci | 1/4 | 25 % | не норма |
| faq | 0/4 | 0 % | не норма |
| podobne | 2/4 | 50 % | на решение |
| tabela | 0/4 | 0 % | не норма |
| galeria | 2/4 | 50 % | на решение |
| wideo | 0/4 | 0 % | не норма |
| autor-data | 2/4 | 50 % | на решение |
| ocena | 0/4 | 0 % | не норма |
| oceny-graczy | 0/4 | 0 % | не норма |
| komentarze | 0/4 | 0 % | не норма |
| schema-org | 3/4 | 75 % | обязателен |

## Page corpus documents for fact-checking (4, hosts 3)

*Addresses, not text. A fact goes into print only if it is confirmed in one of these documents or in
`sites/7thserpent.com/CLAUDE.md` §2 (checked 2026-09-18); otherwise it is rephrased to what is
confirmed or dropped (П42 п. 1, П85 п. 1), and what is not in the sources goes to
`docs/UNRESOLVED.md` as a line, not into the text. Files: `input/corpus/<file>` (gzip). This is the
set the anatomy measured; the count is checked against `s3-anatomy.json`.*

- backloggd.com — https://backloggd.com/u/LarsJinn/list/favorite-max-payne-quotes-1/
- en.wikiquote.org — https://en.wikiquote.org/wiki/Max_Payne_2:_The_Fall_of_Max_Payne
- www.thegamer.com — https://www.thegamer.com/max-payne-hilarious-quotes-make-forget-life-tragic/
- www.thegamer.com — https://www.thegamer.com/max-payne-quotes-relatable/

## Art (П79 п. 3, П85 п. 7)

- License class of every publisher image on the site: «publisher material (Rockstar Games), not under a free license — used solely to identify the games in the series that the site’s pages are about» — printed in the footer for the frames this page shows.
- No game of its own: frames are chosen in this page’s batch from `src/data/game-art.json`.

## Writing rules (П42 п. 1–4 for this site, П85 п. 1; `CLAUDE.md` of the site, §2 and §5)

1. A fact not confirmed by the corpus or §2 is not printed; the list of flagged and dropped facts goes
   into the batch report. No self-flagging («possibly wrong») in published text.
2. Every paragraph about the remake, stores or availability carries its check date («as of September 2026»).
   Release dates — North American. Rumors and insider forecasts — only marked «rumor» with the source,
   better not at all (§2).
3. US English, fan-site voice; no piracy, «where to play», not «where to buy»; no publisher identity.
   Quotes — short, one or two lines, with game and chapter (П67 п. 2).
4. Addresses in the content — from the root and only from the structure; the `links` gate stops the build.
5. Length — the contract corridor; the `corridor` gate stops the build outside it. No filler and no
   cuts: if honest text does not fit, the corridor changes by a named decision with the reason in the
   report (П43).
6. Byline and date are matters of taste: Code decides and names them in the batch report (П85 п. 1).
7. Not one competitor phrase: facts are checked in the documents above, the wording is ours.
