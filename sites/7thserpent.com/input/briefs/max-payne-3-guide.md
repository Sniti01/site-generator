# Brief: `/max-payne-3/guide/`

*Assembled by `tools/brief-strony.mjs` from the structure, the S3 anatomy and the corpus
manifest. Addresses only — no competitor wording (backlog, item 1; П85 п. 5).
`npm run brief -- --check` guards this mechanically.*

## Contract (structure.json — fill it, do not change it)

| Field | Value |
|---|---|
| type | `guide` |
| h1 | Max Payne 3 walkthrough: all chapters, golden guns, clues and trophies |
| title | Max Payne 3 guide — chapters, golden guns, clues, achievements |
| description | A chapter-by-chapter Max Payne 3 guide: how many chapters there are, how long it takes, golden gun and clue locations, the airport shootout, and every trophy. |
| parent | `/max-payne-3/` |
| cluster | max payne 3 guide · queries 28 · demand 990 (Ahrefs, US) |
| corridor (contract) | 3174–4294 |
| hero art | not applicable — the page declares no `hero-key-art` |

**Keywords** (28): how long is max payne 3 · max payne 3 mission list · how many chapters in max payne 3 · max payne 3 chapters · max payne 3 golden guns · max payne 3 walkthrough · how many chapters are in max payne 3 · max payne 3 achievements · max payne 3 collectibles · max payne 3 how long to beat · how long to beat max payne 3 · max payne 3 guide · max payne 3 trophies · hltb max payne 3 · max payne 3 achievement guide · max payne 3 airport · max payne 3 airport shootout · max payne 3 chapter 12 · max payne 3 chapter 4 · max payne 3 chapter 7 · max payne 3 clues · max payne 3 clues and golden gun locations · max payne 3 favela · max payne 3 golden gun locations · max payne 3 golden gun parts · max payne 3 length · max payne 3 levels · max payne 3 trophy guide

**Related** (`link-list` prints them from the structure, titled by their `h1`):
- `/max-payne-3/` — Max Payne 3 (2012): São Paulo, platforms and what to know before playing
- `/cheats/` — Max Payne cheats for every game: PC codes, console cheats and trainers
- `/gameplay/` — How Max Payne plays: bullet time, shootdodge, painkillers and weapons
- `/pc/` — Max Payne on PC: requirements, fixes and controllers

**blocks[]** — the set and order of sections; each printed block needs its field in the content file:
- `byline` — anatomy, medium, evidence 15/25. printed by the route
- `story-row` — type-default, low. printed by the route
- `video` — manual, high. not in the core — the route skips it loudly; its implementation comes with the first page that has it (a core change is a question to the owner)
- `link-list` — type-default, low. printed by the route
- `cta-band` — type-default, low. printed by the route

## Content plan (S3 anatomy, page corpus)

- documents 25 from 14 hosts, basket **high**
- **characters without spaces — the contract corridor: 3174–4294**; the anatomy gives 3174–4294, median 3734
- headings: h2 median 2, h3 median 1

| Topic (our vocabulary) | documents | share | verdict |
|---|---:|---:|---|
| walkthrough | 10/25 | 40 % | на решение |
| media | 9/25 | 36 % | редкая |
| about | 4/25 | 16 % | редкая |
| requirements | 3/25 | 12 % | редкая |
| development | 2/25 | 8 % | редкая |
| faq-tema | 1/25 | 4 % | гэп |
| gameplay | 1/25 | 4 % | гэп |
| plot | 1/25 | 4 % | гэп |
| reception | 1/25 | 4 % | гэп |
| sources | 1/25 | 4 % | гэп |
| versions | 1/25 | 4 % | гэп |

| Page element | documents | share | verdict |
|---|---:|---:|---|
| breadcrumbs | 18/25 | 72 % | обязателен |
| spis-tresci | 3/25 | 12 % | не норма |
| faq | 1/25 | 4 % | не норма |
| podobne | 8/25 | 32 % | не норма |
| tabela | 4/25 | 16 % | не норма |
| galeria | 6/25 | 24 % | не норма |
| wideo | 2/25 | 8 % | не норма |
| autor-data | 15/25 | 60 % | на решение |
| ocena | 1/25 | 4 % | не норма |
| oceny-graczy | 2/25 | 8 % | не норма |
| komentarze | 10/25 | 40 % | на решение |
| schema-org | 22/25 | 88 % | обязателен |

*Verdicts are the anatomy’s own words (`structure/rules-s3.json`): обязательна / обязателен — the norm of
the genre; на решение — to decide; редкая, не норма — rare, not the norm; гэп — one document; не считается —
too few documents to count.*

## Page corpus documents for fact-checking (25, hosts 14)

*Addresses, not text. A fact goes into print only if it is confirmed in one of these documents or in
`sites/7thserpent.com/CLAUDE.md` §2 (checked 2026-09-18); otherwise it is rephrased to what is
confirmed or dropped (П42 п. 1, П85 п. 1), and what is not in the sources goes to
`docs/UNRESOLVED.md` as a line, not into the text. Files: `input/corpus/<file>` (gzip). This is the
set the anatomy measured; the count is checked against `s3-anatomy.json`.*

- store.rockstargames.com — http://store.rockstargames.com/game/buy-max-payne-3
- en.wikipedia.org — https://en.wikipedia.org/wiki/Max_Payne_3
- exhaustport.wordpress.com — https://exhaustport.wordpress.com/2012/11/15/the-curse-of-the-favela-level/
- open.spotify.com — https://open.spotify.com/track/6NWsWHIN5TXTv8NOw64omR
- portforward.com — https://portforward.com/games/walkthroughs/Max-Payne-3/Chapter-IV-Anyone-can-buy-me-a-drink.htm
- portforward.com — https://portforward.com/games/walkthroughs/Max-Payne-3/Chapter-XII-The-Great-American-Savior-of-the-Poor.htm
- portforward.com — https://portforward.com/games/walkthroughs/Max-Payne/Chapter-7-POLICE-BRUTALITY.htm
- steamcommunity.com — https://steamcommunity.com/sharedfiles/filedetails/?id=257634803
- store.steampowered.com — https://store.steampowered.com/app/204100/Max_Payne_3/
- thehdroom.com — https://thehdroom.com/news/max-payne-3-clues-and-golden-guns-parts-locations-guide-39106/
- www.gamepressure.com — https://www.gamepressure.com/maxpayne3/chapter-iv-p-1/z23a86
- www.gamepressure.com — https://www.gamepressure.com/maxpayne3/clues-and-golden-guns-chapter-vii/zc3c0f
- www.gamesradar.com — https://www.gamesradar.com/max-payne-3-golden-gun-parts-and-clues-guide/
- www.gamesradar.com — https://www.gamesradar.com/max-payne-3-golden-gun-parts-and-clues-guide/5/
- www.ign.com — https://www.ign.com/videos/max-payne-3-chapter-12-walkthrough
- www.ign.com — https://www.ign.com/videos/max-payne-3-chapter-4-walkthrough
- www.ign.com — https://www.ign.com/wikis/max-payne-3/Chapter_1
- www.ign.com — https://www.ign.com/wikis/max-payne-3/Chapter_12
- www.ign.com — https://www.ign.com/wikis/max-payne-3/Chapter_4
- www.ign.com — https://www.ign.com/wikis/max-payne-3/Chapter_7
- www.ign.com — https://www.ign.com/wikis/max-payne-3/Golden_Guns
- www.ign.com — https://www.ign.com/wikis/max-payne-3/Walkthrough
- www.noobfeed.com — https://www.noobfeed.com/articles/max-payne-3-chapter-4-clues-golden-gun-parts
- www.thegamer.com — https://www.thegamer.com/max-payne-3-airport-level/
- www.xbox.com — https://www.xbox.com/en-US/games/store/max-payne-3/9pfkhjh25tff

## Art (П79 п. 3, П85 п. 7)

- License class of every publisher image on the site: «publisher material (Rockstar Games), not under a free license — used solely to identify the games in the series that the site’s pages are about» — printed in the footer for the frames this page shows.
- Frames of Max Payne 3 already in `src/assets/gry/`:
  - `mp3-k15` — screenshot [15]: Max, bald and bearded, in a tropical shirt above a São Paulo favela
  - `mp3-k04` — screenshot [4]: Max in a suit holding two pistols, sparks falling around him
  - `mp3-k13` — screenshot [13]: close-up of Max aiming a pistol against a grey sky
  - `mp3-k06` — screenshot [6]: Max in green light, a submachine gun raised beside his face
  - `mp3-k10` — screenshot [10]: Max in a white tank top firing two submachine guns in a warehouse
  - `mp3-k01` — screenshot [1]: Max in a suit climbs a stairwell with a pistol, a man following below
  - `mp3-art` — key art (library_hero_2x.jpg): Max, bearded, crouches behind a rusted metal wall with a pistol; on the left a bald man in a tank top holds a shotgun under a utility pole in green haze

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
