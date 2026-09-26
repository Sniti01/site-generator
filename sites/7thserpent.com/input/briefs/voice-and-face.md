# Brief: `/voice-and-face/`

*Assembled by `tools/brief-strony.mjs` from the structure, the S3 anatomy and the corpus
manifest. Addresses only — no competitor wording (backlog, item 1; П85 п. 5).
`npm run brief -- --check` guards this mechanically.*

## Contract (structure.json — fill it, do not change it)

| Field | Value |
|---|---|
| type | `topic` |
| h1 | Who is behind Max Payne: the voice, the face and the creators |
| title | Max Payne’s voice and face — McCaffrey, Sam Lake, Timothy Gibbs |
| description | James McCaffrey voiced Max in all three games; Sam Lake gave him his first face, Timothy Gibbs the second. Who made the games, the Max Payne 3 cast, and why Max went bald. |
| parent | `/` |
| cluster | max payne va · queries 39 · demand 2160 (Ahrefs, US) |
| corridor (contract) | 3753–5077 |
| hero art | not applicable — the page declares no `hero-key-art` |

**Keywords** (39): max payne face · james mccaffrey max payne · max payne voice actor · sam lake max payne · max payne actor · max payne bald · max payne character designer · max payne 1 face · max payne 3 voice actor · max payne 3 face · max payne sam lake · sam lake max payne face · max payne 3 cast · james mccaffrey max payne 3 · max payne 3 bald · max payne 3 face model · max payne developer · max payne face model · max payne james mccaffrey · max payne va · remedy max payne · voice of max payne · who made max payne · who voices max payne · max payne 1 voice actor · max payne 3 james mccaffrey · max payne 3 shaved head · max payne 3 voice actors · max payne cosplay · max payne creator · max payne face texture · max payne model · max payne original face · max payne remedy · max payne voice · remedy entertainment max payne · timothy gibbs max payne · who owns max payne · who played max payne

**Related** (`link-list` prints them from the structure, titled by their `h1`):
- `/story/` — Max Payne story and characters: from New York to São Paulo
- `/max-payne-1/` — Max Payne (2001): the original game, its ports and the mobile version
- `/max-payne-3/` — Max Payne 3 (2012): São Paulo, platforms and what to know before playing
- `/remake/` — Max Payne 1 & 2 Remake: release date, platforms and news
- `/media/` — Max Payne art and media: cover art, comics, soundtracks and memes
- `/movie/` — Max Payne, the 2008 movie: cast, plot and where to watch it

**blocks[]** — the set and order of sections; each printed block needs its field in the content file:
- `byline` — anatomy, medium, evidence 14/23. core block without a route branch yet — the branch is written with the first page of its form, owner’s look (plan P4)
- `story-row` — type-default, low. printed by the route
- `link-list` — type-default, low. printed by the route
- `cta-band` — type-default, low. printed by the route

## Content plan (S3 anatomy, page corpus)

- documents 23 from 16 hosts, basket **high**
- **characters without spaces — the contract corridor: 3753–5077**; the anatomy gives 3753–5077, median 4415
- headings: h2 median 3, h3 median 1

| Topic (our vocabulary) | documents | share | verdict |
|---|---:|---:|---|
| characters | 8/23 | 35 % | редкая |
| sources | 7/23 | 30 % | редкая |
| development | 6/23 | 26 % | редкая |
| media | 6/23 | 26 % | редкая |
| reception | 5/23 | 22 % | редкая |
| versions | 5/23 | 22 % | редкая |
| series | 4/23 | 17 % | редкая |
| film | 3/23 | 13 % | редкая |
| gameplay | 3/23 | 13 % | редкая |
| walkthrough | 3/23 | 13 % | редкая |
| about | 1/23 | 4 % | гэп |
| lore | 1/23 | 4 % | гэп |
| plot | 1/23 | 4 % | гэп |
| requirements | 1/23 | 4 % | гэп |

| Page element | documents | share | verdict |
|---|---:|---:|---|
| breadcrumbs | 14/23 | 61 % | на решение |
| spis-tresci | 6/23 | 26 % | не норма |
| faq | 0/23 | 0 % | не норма |
| podobne | 12/23 | 52 % | на решение |
| tabela | 6/23 | 26 % | не норма |
| galeria | 4/23 | 17 % | не норма |
| wideo | 2/23 | 9 % | не норма |
| autor-data | 14/23 | 61 % | на решение |
| ocena | 0/23 | 0 % | не норма |
| oceny-graczy | 0/23 | 0 % | не норма |
| komentarze | 7/23 | 30 % | не норма |
| schema-org | 21/23 | 91 % | обязателен |

*Verdicts are the anatomy’s own words (`structure/rules-s3.json`): обязательна / обязателен — the norm of
the genre; на решение — to decide; редкая, не норма — rare, not the norm; гэп — one document; не считается —
too few documents to count.*

## Page corpus documents for fact-checking (23, hosts 16)

*Addresses, not text. A fact goes into print only if it is confirmed in one of these documents or in
`sites/7thserpent.com/CLAUDE.md` §2 (checked 2026-09-18); otherwise it is rephrased to what is
confirmed or dropped (П42 п. 1, П85 п. 1), and what is not in the sources goes to
`docs/UNRESOLVED.md` as a line, not into the text. Files: `input/corpus/<file>` (gzip). This is the
set the anatomy measured; the count is checked against `s3-anatomy.json`.*

- carboncostume.com — https://carboncostume.com/max-payne-2001/
- en.wikipedia.org — https://en.wikipedia.org/wiki/James_McCaffrey_(actor)
- en.wikipedia.org — https://en.wikipedia.org/wiki/Max_Payne
- en.wikipedia.org — https://en.wikipedia.org/wiki/Max_Payne_(character)
- en.wikipedia.org — https://en.wikipedia.org/wiki/Max_Payne_(video_game)
- en.wikipedia.org — https://en.wikipedia.org/wiki/Remedy_Entertainment
- en.wikipedia.org — https://en.wikipedia.org/wiki/Sam_Lake
- kotaku.com — https://kotaku.com/max-payne-3-pc-mod-sam-lake-nexus-alexsavvy-1850671945
- maddieman.wordpress.com — https://maddieman.wordpress.com/2009/03/24/timothy-gibbs-is-max-payne-3-a-quick-analysis/
- variety.com — https://variety.com/2023/digital/obituaries-people-news/james-mccaffrey-dead-max-payne-alan-wake-2-1235843750/
- wccftech.com — https://wccftech.com/remedy-silence-on-max-payne-1-and-2-remake-rockstar-control/
- www.deviantart.com — https://www.deviantart.com/outfits-hub/art/Max-Payne-2001-DIY-Costume-Guide-1300883400
- www.deviantart.com — https://www.deviantart.com/stevencojo/gallery/46609249/max-payne-cosplay
- www.gamesradar.com — https://www.gamesradar.com/6-step-guide-making-max-payne-face/
- www.gamesradar.com — https://www.gamesradar.com/max-payne-face-remake-sam-lake-james-mccaffrey-recast-remedy-rockstar/
- www.gamingbible.com — https://www.gamingbible.com/news/heres-how-a-game-designer-became-max-payne-20220407
- www.ign.com — https://www.ign.com/articles/2011/09/09/max-payne-3-maxs-new-look
- www.pcgamer.com — https://www.pcgamer.com/finally-someone-has-fixed-max-payne-3-for-me-by-modding-in-maxs-true-original-face/
- www.remedygames.com — https://www.remedygames.com/games/max-payne-1-2-remake
- www.resetera.com — https://www.resetera.com/threads/who-should-portray-max-payne-in-the-upcoming-remake.651471/
- www.techradar.com — https://www.techradar.com/gaming/consoles-pc/max-payne-face-model-sam-lake-explains-the-thought-process-behind-making-that-expression-in-the-first-game
- www.thegamer.com — https://www.thegamer.com/max-payne-remake-face/
- www.theguardian.com — https://www.theguardian.com/film/2023/dec/19/james-mccaffrey-dies-65-cause-of-death-myeloma-blood-cancer-max-payne-alan-wake

## Art (П79 п. 3, П85 п. 7)

- License class of every publisher image on the site: «publisher material (Rockstar Games), not under a free license — used solely to identify the games in the series that the site’s pages are about» — printed in the footer for the frames this page shows.
- No game of its own: frames are chosen in this page’s batch from `src/data/game-art.json`.
- Photos of people (actors, writers) — a question to the owner in this page’s batch (П85 п. 7).

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
