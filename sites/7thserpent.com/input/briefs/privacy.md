# Brief: `/privacy/`

*Assembled by `tools/brief-strony.mjs` from the structure, the S3 anatomy and the corpus
manifest. Addresses only — no competitor wording (backlog, item 1; П85 п. 5).
`npm run brief -- --check` guards this mechanically.*

## Contract (structure.json — fill it, do not change it)

| Field | Value |
|---|---|
| type | `legal` |
| h1 | Privacy policy |
| title | Privacy policy — 7thserpent.com |
| description | What 7thserpent.com does with visitor data, what the hosting provider logs, and what rights a reader has under US law. |
| parent | `/` |
| cluster | — · queries 0 · demand 0 (Ahrefs, US) |
| corridor (contract) | null — no verdict, the number goes to the batch report (named decision) |
| hero art | not applicable — the page declares no `hero-key-art` |

**Keywords** (0): —

**Related** (`link-list` prints them from the structure, titled by their `h1`):
- —

**blocks[]** — the set and order of sections; each printed block needs its field in the content file:
- `byline` — manual, high. core block without a route branch yet — the branch is written with the first page of its form, owner’s look (plan P4)
- `story-row` — type-default, low. printed by the route

**Open for this page:** Text — at publication (П63 п. 5, П85 п. 6): US privacy facts and the site mailbox are the owner’s; this brief is kept for that session.

## Content plan (S3 anatomy, page corpus)

- no anatomy for this page — a service page outside the S3 corpus (no keywords)

## Page corpus documents for fact-checking (0, hosts 0)

*Addresses, not text. A fact goes into print only if it is confirmed in one of these documents or in
`sites/7thserpent.com/CLAUDE.md` §2 (checked 2026-09-18); otherwise it is rephrased to what is
confirmed or dropped (П42 п. 1, П85 п. 1), and what is not in the sources goes to
`docs/UNRESOLVED.md` as a line, not into the text. Files: `input/corpus/<file>` (gzip). This is the
set the anatomy measured; the count is checked against `s3-anatomy.json`.*

- —

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
