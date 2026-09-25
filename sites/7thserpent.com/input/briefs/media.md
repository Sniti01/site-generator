# Brief: `/media/`

*Assembled by `tools/brief-strony.mjs` from the structure, the S3 anatomy and the corpus
manifest. Addresses only — no competitor wording (backlog, item 1; П85 п. 5).
`npm run brief -- --check` guards this mechanically.*

## Contract (structure.json — fill it, do not change it)

| Field | Value |
|---|---|
| type | `topic` |
| h1 | Max Payne art and media: covers, wallpapers, comics and soundtracks |
| title | Max Payne cover art, wallpapers, concept art, memes, soundtrack |
| description | Cover art and box art of all three games, wallpapers, screenshots, concept art, the logo and font, the graphic novel, trailers, the HEALTH soundtrack, memes and GIFs. |
| parent | `/` |
| cluster | max payne cover · queries 40 · demand 950 (Ahrefs, US) |
| corridor (contract) | 1986–2686 |
| hero art | not applicable — the page declares no `hero-key-art` |

**Keywords** (40): max payne 3 cover art · max payne meme · max payne logo · max payne 3 art · max payne comic · max payne cover · max payne 3 artwork · max payne 3 cover · max payne wallpaper · max payne 3 trailer · max payne font · max payne ps2 cover · max payne 2 cover · max payne 2 wallpaper · max payne 3 gif · max payne 3 logo · max payne 3 soundtrack · max payne 3 wallpaper · max payne art · max payne cover art · max payne gif · max payne memes · health max payne 3 · max payne 1 cover · max payne 1 screenshots · max payne 1 wallpaper · max payne 2 screenshots · max payne 3 comic · max payne 3 concept art · max payne 3 cover girl · max payne 3 font · max payne 3 ps3 cover · max payne 3 screenshots · max payne 3 trailers · max payne artwork · max payne avatar · max payne box art · max payne game cover · max payne screenshots · max payne trailer

**Related** (`link-list` prints them from the structure, titled by their `h1`):
- `/quotes/` — Max Payne quotes: the best lines from all three games
- `/voice-and-face/` — Who is behind Max Payne: the voice, the face and the creators
- `/max-payne-3/` — Max Payne 3 (2012): São Paulo, platforms and what to know before playing
- `/` — The Max Payne series, game by game

**blocks[]** — the set and order of sections; each printed block needs its field in the content file:
- `story-row` — type-default, low. printed by the route
- `link-list` — type-default, low. printed by the route
- `cta-band` — type-default, low. core block without a route branch yet — the branch is written with the first page of its form, owner’s look (plan P4)

## Content plan (S3 anatomy, page corpus)

- documents 58 from 40 hosts, basket **high**
- **characters without spaces — the contract corridor: 1986–2686**; the anatomy gives 1986–2686, median 2336
- headings: h2 median 2, h3 median 0

| Topic (our vocabulary) | documents | share | verdict |
|---|---:|---:|---|
| about | 19/58 | 33 % | редкая |
| media | 16/58 | 28 % | редкая |
| reception | 6/58 | 10 % | редкая |
| versions | 6/58 | 10 % | редкая |
| characters | 5/58 | 9 % | редкая |
| development | 4/58 | 7 % | редкая |
| sources | 4/58 | 7 % | редкая |
| walkthrough | 4/58 | 7 % | редкая |
| film | 3/58 | 5 % | редкая |
| gameplay | 3/58 | 5 % | редкая |
| requirements | 3/58 | 5 % | редкая |
| series | 3/58 | 5 % | редкая |
| plot | 2/58 | 3 % | редкая |
| cheats | 1/58 | 2 % | гэп |
| faq-tema | 1/58 | 2 % | гэп |
| where-to-play | 1/58 | 2 % | гэп |

| Page element | documents | share | verdict |
|---|---:|---:|---|
| breadcrumbs | 22/58 | 38 % | не норма |
| spis-tresci | 7/58 | 12 % | не норма |
| faq | 2/58 | 3 % | не норма |
| podobne | 12/58 | 21 % | не норма |
| tabela | 13/58 | 22 % | не норма |
| galeria | 13/58 | 22 % | не норма |
| wideo | 4/58 | 7 % | не норма |
| autor-data | 16/58 | 28 % | не норма |
| ocena | 4/58 | 7 % | не норма |
| oceny-graczy | 4/58 | 7 % | не норма |
| komentarze | 11/58 | 19 % | не норма |
| schema-org | 37/58 | 64 % | на решение |

*Verdicts are the anatomy’s own words (`structure/rules-s3.json`): обязательна / обязателен — the norm of
the genre; на решение — to decide; редкая, не норма — rare, not the norm; гэп — one document; не считается —
too few documents to count.*

## Page corpus documents for fact-checking (58, hosts 40)

*Addresses, not text. A fact goes into print only if it is confirmed in one of these documents or in
`sites/7thserpent.com/CLAUDE.md` §2 (checked 2026-09-18); otherwise it is rephrased to what is
confirmed or dropped (П42 п. 1, П85 п. 1), and what is not in the sources goes to
`docs/UNRESOLVED.md` as a line, not into the text. Files: `input/corpus/<file>` (gzip). This is the
set the anatomy measured; the count is checked against `s3-anatomy.json`.*

- store.rockstargames.com — http://store.rockstargames.com/game/buy-max-payne-3
- acclaimmag.com — https://acclaimmag.com/art/gaming-max-payne-3-official-cover-art/
- alphacoders.com — https://alphacoders.com/max-payne-2-the-fall-of-max-payne-wallpapers
- alphacoders.com — https://alphacoders.com/max-payne-3-wallpapers
- alphacoders.com — https://alphacoders.com/max-payne-wallpapers
- commons.wikimedia.org — https://commons.wikimedia.org/wiki/File:Max_Payne_3_Cover.jpg
- commons.wikimedia.org — https://commons.wikimedia.org/wiki/File:Max_Payne_Logo.svg
- couchsoup.com — https://couchsoup.com/video-games/max-payne-3-is-a-work-of-art-what-modern-games-can-learn/
- diffuser.fm — https://diffuser.fm/max-payne-3-trailer-whats-the-song/
- en.wikipedia.org — https://en.wikipedia.org/wiki/Max_Payne
- en.wikipedia.org — https://en.wikipedia.org/wiki/Max_Payne_2:_The_Fall_of_Max_Payne
- en.wikipedia.org — https://en.wikipedia.org/wiki/Max_Payne_3
- forums.duke4.net — https://forums.duke4.net/topic/6596-i-found-a-bunch-of-max-payne-alpha-screenshots-from-1997/
- gamesdb.launchbox-app.com — https://gamesdb.launchbox-app.com/games/images/3949-max-payne
- gamesdb.launchbox-app.com — https://gamesdb.launchbox-app.com/games/images/756-max-payne-2-the-fall-of-max-payne
- gamesdb.launchbox-app.com — https://gamesdb.launchbox-app.com/games/images/757-max-payne
- hyperpix.net — https://hyperpix.net/fonts/max-payne-font/
- imgflip.com — https://imgflip.com/memegenerator/387324684/Max-Payne
- memebase.cheezburger.com — https://memebase.cheezburger.com/tag/max-payne
- music.apple.com — https://music.apple.com/us/album/max-payne-3-official-soundtrack/1655220221
- open.spotify.com — https://open.spotify.com/album/5WWosyWLObT7BowuLqcnar
- paynereactor.com — https://paynereactor.com/max-payne-20-making-of-the-artwork-by-anebarone/
- pitchfork.com — https://pitchfork.com/reviews/albums/16646-max-payne-3-ost/
- rog.asus.com — https://rog.asus.com/articles/gaming/max-payne-3-official-game-trailer/
- seeklogo.com — https://seeklogo.com/vector-logo/89501/max-payne
- spong.com — https://spong.com/game/covers-box-art/11025577/Max-Payne-PS2/79974
- steamcommunity.com — https://steamcommunity.com/app/12140/images/
- steamcommunity.com — https://steamcommunity.com/app/12140/screenshots/
- steamcommunity.com — https://steamcommunity.com/app/12150/screenshots/
- store.steampowered.com — https://store.steampowered.com/app/204100/Max_Payne_3/
- tenor.com — https://tenor.com/view/max-payne-max-payne3-goddamnit-god-damnit-gif-21047161
- wallhaven.cc — https://wallhaven.cc/index.php/tag/179988
- wallpaper.mob.org — https://wallpaper.mob.org/pc/gallery/tag=max%20payne%203/
- wallpapercave.com — https://wallpapercave.com/max-payne-2-wallpaper
- wallpapercave.com — https://wallpapercave.com/max-payne-3-wallpapers
- www.anthroxstudio.com — https://www.anthroxstudio.com/max-payne-3
- www.dafont.com — https://www.dafont.com/forum/read/52488/max-payne-3-in-game-font
- www.deviantart.com — https://www.deviantart.com/3d-neo-sanctuary/gallery/56707894/max-payne
- www.deviantart.com — https://www.deviantart.com/gta-nerd/art/Max-Payne-font-100595407
- www.deviantart.com — https://www.deviantart.com/insanebuddy47/art/Max-Payne-2-Cover-Art-910367011
- www.deviantart.com — https://www.deviantart.com/kaito23/art/Max-Payne-%282%29-Wallpaper-289581965
- www.deviantart.com — https://www.deviantart.com/markhunds/art/Max-Payne-Cover-Art-Remastered-908739179
- www.deviantart.com — https://www.deviantart.com/mintymilkkkk/art/Max-Payne-Wallpaper-939559700
- www.deviantart.com — https://www.deviantart.com/patrickbrown/art/Max-Payne-3-302461068
- www.deviantart.com — https://www.deviantart.com/shadowstg/art/Max-Payne-3-PC-Wallpaper-1219514219
- www.empireonline.com — https://www.empireonline.com/movies/news/new-max-payne-trailer/
- www.goodreads.com — https://www.goodreads.com/book/show/18209541
- www.honestgamers.com — https://www.honestgamers.com/assets/22657/view/0.html
- www.honestgamers.com — https://www.honestgamers.com/assets/3575/view/0.html
- www.ign.com — https://www.ign.com/movies/max-payne/trailers
- www.onlinewebfonts.com — https://www.onlinewebfonts.com/fonts/max_payne_3_game_download
- www.pngkey.com — https://www.pngkey.com/detail/u2w7u2r5r5w7o0o0_user-posted-image-max-payne-3-logo-font/
- www.rottentomatoes.com — https://www.rottentomatoes.com/m/max_payne
- www.shacknews.com — https://www.shacknews.com/article/28190/max-payne-2-screenshots
- www.steamgamecovers.com — https://www.steamgamecovers.com/covers/max-payne-2
- www.thegamer.com — https://www.thegamer.com/max-payne-hilarious-memes-even-max-payne-would-find-funny/
- www.theouterhaven.net — https://www.theouterhaven.net/2012/03/the-official-max-payne-3-cover-art-revealed/
- www.xbox.com — https://www.xbox.com/en-US/games/store/max-payne-3/9pfkhjh25tff

## Art (П79 п. 3, П85 п. 7)

- License class of every publisher image on the site: «publisher material (Rockstar Games), not under a free license — used solely to identify the games in the series that the site’s pages are about» — printed in the footer for the frames this page shows.
- No game of its own: frames are chosen in this page’s batch from `src/data/game-art.json`.
- Covers carry the game logos — a question to the owner in this page’s batch (П85 п. 7; PRODUCT.md, fan-site legal limits).

## Writing rules (П42 п. 1–4 for this site, П85 п. 1; `CLAUDE.md` of the site, §2 and §5)

1. A fact not confirmed by the corpus or §2 is not printed; the list of flagged and dropped facts goes
   into the batch report. No self-flagging («possibly wrong») in published text.
2. Every paragraph about the remake, stores or availability carries its check date («as of September 2026»).
   Release dates — North American. Rumors and insider forecasts — only marked «rumor» with the source,
   better not at all (§2).
3. US English, fan-site voice; no piracy, «where to play», not «where to buy»; no publisher identity.
   Quotes — short, one or two lines, with game and chapter (П67 п. 2).
4. Internal addresses — from the root and only from the structure (the `links` gate stops the build on
   others); external links — only official stores and publisher pages (§5).
5. Length — the contract corridor; the `corridor` gate stops the build outside it (a `null` corridor —
   the number goes to the report, no verdict). No filler and no cuts: if honest text does not fit, the
   corridor changes by a named decision with the reason in the report (П43).
6. Byline and date are matters of taste: Code decides and names them in the batch report (П85 п. 1).
7. Not one competitor phrase: facts are checked in the documents above, the wording is ours.
