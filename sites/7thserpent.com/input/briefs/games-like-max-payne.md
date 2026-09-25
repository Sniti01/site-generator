# Brief: `/games-like-max-payne/`

*Assembled by `tools/brief-strony.mjs` from the structure, the S3 anatomy and the corpus
manifest. Addresses only — no competitor wording (backlog, item 1; П85 п. 5).
`npm run brief -- --check` guards this mechanically.*

## Contract (structure.json — fill it, do not change it)

| Field | Value |
|---|---|
| type | `topic` |
| h1 | Games like Max Payne: what to play next |
| title | Games like Max Payne — shooters with bullet time and noir stories |
| description | If you finished Max Payne 3 and want more: the games closest to Max Payne in gameplay and mood, from Remedy’s own titles to modern shooters with bullet time. |
| parent | `/` |
| cluster | games like max payne · queries 7 · demand 340 (Ahrefs, US) |
| corridor (contract) | null — no verdict, the number goes to the batch report (named decision) |
| hero art | not applicable — the page declares no `hero-key-art` |

**Keywords** (7): games like max payne · games like max payne 3 · games similar to max payne · games similar to max payne 3 · max payne like games · max payne similar games · max payne type games

**Related** (`link-list` prints them from the structure, titled by their `h1`):
- `/` — The Max Payne series, game by game
- `/gameplay/` — How Max Payne plays: bullet time, shootdodge, painkillers and weapons
- `/story/` — Max Payne story and characters: from New York to São Paulo
- `/remake/` — Max Payne 1 & 2 Remake: release date, platforms and news

**blocks[]** — the set and order of sections; each printed block needs its field in the content file:
- `story-row` — type-default, low. printed by the route
- `link-list` — type-default, low. printed by the route
- `cta-band` — type-default, low. core block without a route branch yet — the branch is written with the first page of its form, owner’s look (plan P4)

## Content plan (S3 anatomy, page corpus)

- documents 3 from 3 hosts, basket **low**
- **characters without spaces — the contract corridor: null — no verdict, the number goes to the batch report (named decision)**; the anatomy gives 2996–4054, median 3525 (orientation only: fewer than four own documents, the niche median)
- headings: h2 median 1, h3 median 0

| Topic (our vocabulary) | documents | share | verdict |
|---|---:|---:|---|
| similar | 1/3 | 33 % | не считается |

| Page element | documents | share | verdict |
|---|---:|---:|---|
| breadcrumbs | 3/3 | 100 % | не считается |
| spis-tresci | 0/3 | 0 % | не считается |
| faq | 0/3 | 0 % | не считается |
| podobne | 2/3 | 67 % | не считается |
| tabela | 0/3 | 0 % | не считается |
| galeria | 0/3 | 0 % | не считается |
| wideo | 1/3 | 33 % | не считается |
| autor-data | 0/3 | 0 % | не считается |
| ocena | 0/3 | 0 % | не считается |
| oceny-graczy | 0/3 | 0 % | не считается |
| komentarze | 1/3 | 33 % | не считается |
| schema-org | 0/3 | 0 % | не считается |

*Verdicts are the anatomy’s own words (`structure/rules-s3.json`): обязательна / обязателен — the norm of
the genre; на решение — to decide; редкая, не норма — rare, not the norm; гэп — one document; не считается —
too few documents to count.*

## Page corpus documents for fact-checking (3, hosts 3)

*Addresses, not text. A fact goes into print only if it is confirmed in one of these documents or in
`sites/7thserpent.com/CLAUDE.md` §2 (checked 2026-09-18); otherwise it is rephrased to what is
confirmed or dropped (П42 п. 1, П85 п. 1), and what is not in the sources goes to
`docs/UNRESOLVED.md` as a line, not into the text. Files: `input/corpus/<file>` (gzip). This is the
set the anatomy measured; the count is checked against `s3-anatomy.json`.*

- rawg.io — https://rawg.io/games/max-payne-3/suggestions
- steamcommunity.com — https://steamcommunity.com/app/204100/discussions/0/573770913622996215/
- store.steampowered.com — https://store.steampowered.com/recommended/morelike/app/204100/?snr=1_300_morelikev2__104

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
4. Internal addresses — from the root and only from the structure (the `links` gate stops the build on
   others); «where to play» links — only official stores (§5).
5. Length — the contract corridor; the `corridor` gate stops the build outside it (a `null` corridor —
   the number goes to the report, no verdict). No filler and no cuts: if honest text does not fit, the
   corridor changes by a named decision with the reason in the report (П43).
6. Byline and date are matters of taste: Code decides and names them in the batch report (П85 п. 1).
7. Not one competitor phrase: facts are checked in the documents above, the wording is ours.
