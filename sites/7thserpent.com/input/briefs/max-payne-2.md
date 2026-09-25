# Brief: `/max-payne-2/`

*Assembled by `tools/brief-strony.mjs` from the structure, the S3 anatomy and the corpus
manifest. Addresses only — no competitor wording (backlog, item 1; П85 п. 5).
`npm run brief -- --check` guards this mechanically.*

## Contract (structure.json — fill it, do not change it)

| Field | Value |
|---|---|
| type | `game` |
| h1 | Max Payne 2: The Fall of Max Payne |
| title | Max Payne 2: The Fall of Max Payne (2003) — story, platforms, PS2 |
| description | Max Payne 2: The Fall of Max Payne from 2003 — what changed from the first game, Mona Sax, the PS2 and Xbox versions, how it sold, and where to play it today. |
| parent | `/` |
| cluster | max payne 2 · queries 15 · demand 3020 (Ahrefs, US) |
| corridor (contract) | 9123–12343 |
| hero art | `mp2-art` — key art: black silhouettes of Max and Mona Sax in an embrace, each holding a pistol, on white (1920×620; a 1920 master is small for a first screen — backlog 59 п. 2, decided with the first hero page) |

**Keywords** (15): max payne 2 · max payne 2: the fall of max payne · max payne 2 release date · max payne 2 the fall of max payne · max payne 2 ps2 · max payne 2 ps3 · max payne 2 ps4 · max payne 2 xbox · max payne 2 review · max payne 2 fall of max payne · max payne 2 game · max payne 2 pc · max payne 2 sales · max payne 2 steam · the fall of max payne

**Related** (`link-list` prints them from the structure, titled by their `h1`):
- `/max-payne-1/` — Max Payne (2001): the original game, its ports and the mobile version
- `/max-payne-3/` — Max Payne 3 (2012): São Paulo, platforms and what to know before playing
- `/story/` — Max Payne story and characters: from New York to São Paulo
- `/mods/` — The best Max Payne mods: from the Kung Fu mod to RTX Remix
- `/remake/` — Max Payne 1 & 2 Remake: release date, platforms and news

**blocks[]** — the set and order of sections; each printed block needs its field in the content file:
- `hero-key-art` — type-default, low. core block without a route branch yet — the branch is written with the first page of its form, owner’s look (plan P4)
- `byline` — anatomy, medium, evidence 3/7. core block without a route branch yet — the branch is written with the first page of its form, owner’s look (plan P4)
- `story-row` — type-default, low. printed by the route
- `link-list` — type-default, low. printed by the route
- `cta-band` — type-default, low. printed by the route

## Content plan (S3 anatomy, page corpus)

- documents 7 from 7 hosts, basket **high**
- **characters without spaces — the contract corridor: 9123–12343**; the anatomy gives 9123–12343, median 10733
- headings: h2 median 3, h3 median 3

| Topic (our vocabulary) | documents | share | verdict |
|---|---:|---:|---|
| about | 3/7 | 43 % | на решение |
| development | 2/7 | 29 % | редкая |
| media | 2/7 | 29 % | редкая |
| reception | 2/7 | 29 % | редкая |
| gameplay | 1/7 | 14 % | гэп |
| plot | 1/7 | 14 % | гэп |
| requirements | 1/7 | 14 % | гэп |
| series | 1/7 | 14 % | гэп |
| sources | 1/7 | 14 % | гэп |
| versions | 1/7 | 14 % | гэп |
| walkthrough | 1/7 | 14 % | гэп |

| Page element | documents | share | verdict |
|---|---:|---:|---|
| breadcrumbs | 0/7 | 0 % | не норма |
| spis-tresci | 1/7 | 14 % | не норма |
| faq | 0/7 | 0 % | не норма |
| podobne | 0/7 | 0 % | не норма |
| tabela | 3/7 | 43 % | на решение |
| galeria | 2/7 | 29 % | не норма |
| wideo | 0/7 | 0 % | не норма |
| autor-data | 3/7 | 43 % | на решение |
| ocena | 1/7 | 14 % | не норма |
| oceny-graczy | 2/7 | 29 % | не норма |
| komentarze | 2/7 | 29 % | не норма |
| schema-org | 3/7 | 43 % | на решение |

*Verdicts are the anatomy’s own words (`structure/rules-s3.json`): обязательна / обязателен — the norm of
the genre; на решение — to decide; редкая, не норма — rare, not the norm; гэп — one document; не считается —
too few documents to count.*

## Page corpus documents for fact-checking (7, hosts 7)

*Addresses, not text. A fact goes into print only if it is confirmed in one of these documents or in
`sites/7thserpent.com/CLAUDE.md` §2 (checked 2026-09-18); otherwise it is rephrased to what is
confirmed or dropped (П42 п. 1, П85 п. 1), and what is not in the sources goes to
`docs/UNRESOLVED.md` as a line, not into the text. Files: `input/corpus/<file>` (gzip). This is the
set the anatomy measured; the count is checked against `s3-anatomy.json`.*

- superadventuresingaming.blogspot.com — http://superadventuresingaming.blogspot.com/2014/05/max-payne-2-fall-of-max-payne-pc.html
- en.wikipedia.org — https://en.wikipedia.org/wiki/Max_Payne_2:_The_Fall_of_Max_Payne
- steamcommunity.com — https://steamcommunity.com/app/12150
- steamdb.info — https://steamdb.info/app/12150/
- steemit.com — https://steemit.com/gaming/@cryptocitizen/max-payne-1-and-2-how-to-run-on-steam
- www.ign.com — https://www.ign.com/games/max-payne-2-the-fall-of-max-payne
- www.xbox.com — https://www.xbox.com/en-US/games/store/max-payne-2-the-fall-of-max-payne/9p8mq0x518gc

## Art (П79 п. 3, П85 п. 7)

- License class of every publisher image on the site: «publisher material (Rockstar Games), not under a free license — used solely to identify the games in the series that the site’s pages are about» — printed in the footer for the frames this page shows.
- Frames of Max Payne 2: The Fall of Max Payne already in `src/assets/gry/`:
  - `mp2-k00` — screenshot [0]: Max fires a pistol on a rainy night street beside a street lamp, debris flying from an explosion
  - `mp2-k03` — screenshot [3]: Max raises a sawed-off shotgun in a night alley under a Dead End sign, fires burning behind him
  - `mp2-k01` — screenshot [1]: Max and Mona Sax side by side, both armed
  - `mp2-k02` — screenshot [2]: Max dives past a warehouse wall firing a pistol, spent casings in the air
  - `mp2-art` — key art (library_hero_2x.jpg): black silhouettes of Max and Mona Sax in an embrace, each holding a pistol, on white

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
