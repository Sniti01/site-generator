# Brief: `/movie/`

*Assembled by `tools/brief-strony.mjs` from the structure, the S3 anatomy and the corpus
manifest. Addresses only — no competitor wording (backlog, item 1; П85 п. 5).
`npm run brief -- --check` guards this mechanically.*

## Contract (structure.json — fill it, do not change it)

| Field | Value |
|---|---|
| type | `topic` |
| h1 | Max Payne, the 2008 movie: cast, plot and where to watch it |
| title | Max Payne (2008) movie — Mark Wahlberg, cast, streaming, sequel |
| description | The 2008 Max Payne movie with Mark Wahlberg, Mila Kunis and Olga Kurylenko: the cast, how it differs from the game, where to stream it, and whether a sequel ever happened. |
| parent | `/` |
| cluster | max payne (film) · queries 34 · demand 8190 (Ahrefs, US) |
| corridor (contract) | 5170–6994 |
| hero art | no key yet — a question in this page’s batch |

**Keywords** (34): max payne (film) · max payne movie · max payne cast · max payne film · watch max payne (film) · female lead in max payne movie 2008 debut · max payne mark wahlberg · max payne movie cast · max payne 2 movie · max payne movie 2 · olga kurylenko max payne · mark wahlberg max payne · max payne producer · max payne retribution · movies like max payne · cast of max payne · max payne 2008 · max payne streaming · movie max payne · max payne movie review · max payne movies · max payne natasha · max payne actors · max payne blu ray · max payne full movie · max payne mila kunis · max payne movie streaming · max payne the movie · max payne: retribution · mila kunis max payne · natasha max payne · stream max payne · watch max payne · what is the movie max payne about

**Related** (`link-list` prints them from the structure, titled by their `h1`):
- `/` — The Max Payne series, game by game
- `/story/` — Max Payne story and characters: from New York to São Paulo
- `/voice-and-face/` — Who is behind Max Payne: the voice, the face and the creators
- `/max-payne-1/` — Max Payne (2001): the original game, its ports and the mobile version

**blocks[]** — the set and order of sections; each printed block needs its field in the content file:
- `hero-key-art` — manual, high. core block without a route branch yet — the branch is written with the first page of its form, owner’s look (plan P4)
- `story-row` — type-default, low. printed by the route
- `video` — manual, high. not in the core — the route skips it loudly; its implementation comes with the first page that has it (a core change is a question to the owner)
- `link-list` — type-default, low. printed by the route
- `cta-band` — type-default, low. printed by the route

## Content plan (S3 anatomy, page corpus)

- documents 12 from 12 hosts, basket **high**
- **characters without spaces — the contract corridor: 5170–6994**; the anatomy gives 5170–6994, median 6082
- headings: h2 median 1, h3 median 0

| Topic (our vocabulary) | documents | share | verdict |
|---|---:|---:|---|
| film | 6/12 | 50 % | на решение |
| media | 4/12 | 33 % | редкая |
| reception | 3/12 | 25 % | редкая |
| characters | 2/12 | 17 % | редкая |
| similar | 2/12 | 17 % | редкая |
| versions | 2/12 | 17 % | редкая |
| about | 1/12 | 8 % | гэп |
| development | 1/12 | 8 % | гэп |
| gameplay | 1/12 | 8 % | гэп |
| plot | 1/12 | 8 % | гэп |
| requirements | 1/12 | 8 % | гэп |
| series | 1/12 | 8 % | гэп |
| sources | 1/12 | 8 % | гэп |

| Page element | documents | share | verdict |
|---|---:|---:|---|
| breadcrumbs | 4/12 | 33 % | не норма |
| spis-tresci | 2/12 | 17 % | не норма |
| faq | 0/12 | 0 % | не норма |
| podobne | 8/12 | 67 % | на решение |
| tabela | 5/12 | 42 % | на решение |
| galeria | 1/12 | 8 % | не норма |
| wideo | 5/12 | 42 % | на решение |
| autor-data | 3/12 | 25 % | не норма |
| ocena | 2/12 | 17 % | не норма |
| oceny-graczy | 3/12 | 25 % | не норма |
| komentarze | 2/12 | 17 % | не норма |
| schema-org | 8/12 | 67 % | на решение |

*Verdicts are the anatomy’s own words (`structure/rules-s3.json`): обязательна / обязателен — the norm of
the genre; на решение — to decide; редкая, не норма — rare, not the norm; гэп — one document; не считается —
too few documents to count.*

## Page corpus documents for fact-checking (12, hosts 12)

*Addresses, not text. A fact goes into print only if it is confirmed in one of these documents or in
`sites/7thserpent.com/CLAUDE.md` §2 (checked 2026-09-18); otherwise it is rephrased to what is
confirmed or dropped (П42 п. 1, П85 п. 1), and what is not in the sources goes to
`docs/UNRESOLVED.md` as a line, not into the text. Files: `input/corpus/<file>` (gzip). This is the
set the anatomy measured; the count is checked against `s3-anatomy.json`.*

- www.dvdbeaver.com — http://www.dvdbeaver.com/film2/DVDReviews44/max_payne_blu-ray.htm
- bestsimilar.com — https://bestsimilar.com/movies/18134-max-payne
- en.wikipedia.org — https://en.wikipedia.org/wiki/Max_Payne_(film)
- filmshortage.com — https://filmshortage.com/trailers/max-payne-retribution-2/
- insidepulse.com — https://insidepulse.com/2009/02/13/max-payne-blu-ray-review/
- letterboxd.com — https://letterboxd.com/film/max-payne/
- popdose.com — https://popdose.com/dvd-review-max-payne/
- tv.apple.com — https://tv.apple.com/us/movie/max-payne/umc.cmc.fp3k20uo8je1f25hzf0hawt
- www.blu-ray.com — https://www.blu-ray.com/movies/Max-Payne-Blu-ray/3159/
- www.hometheatershack.com — https://www.hometheatershack.com/threads/max-payne-blu-ray-review.16110/
- www.justwatch.com — https://www.justwatch.com/us/movie/max-payne
- www.rottentomatoes.com — https://www.rottentomatoes.com/m/max_payne

## Art (П79 п. 3, П85 п. 7)

- License class of every publisher image on the site: «publisher material (Rockstar Games), not under a free license — used solely to identify the games in the series that the site’s pages are about» — printed in the footer for the frames this page shows.
- No game of its own: frames are chosen in this page’s batch from `src/data/game-art.json`.
- Movie stills of Max Payne (2008) are not publisher material of the games — a question to the owner in this page’s batch (П85 п. 7). The video block (trailer) is out of scope; official publisher channels only.

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
