# Bryf: `/assassins-creed-chronicles/`

*Złożony maszyną `tools/brief-strony.mjs` ze struktury, anatomii S3 i manifestu
korpusu. Bez jednej frazy konkurenta — reguła korpusu (backlog, punkt 1).*

## Umowa (structure.json — nie zmieniać, wypełniać)

| Pole | Wartość |
|---|---|
| typ | `game` |
| h1 | Assassin’s Creed Chronicles — trzy gry, trzy epoki |
| title | Chiny, Indie i Rosja — Assassin’s Creed Chronicles w 2D |
| description | Trylogia poza główną serią: skradanie w dwóch wymiarach, inni bohaterowie i inna kamera niż w dużych częściach. Osobne gry w Chinach, Indiach i Rosji. |
| rodzic | `/` |
| klaster | assassin chronicles · zapytań 16 · popyt 2820 |
| art (slot `assassins-creed-chronicles`) | materiał wydawcy (src/assets/gry) |

**Klucze** (16): ac chronicles · assassin chronicles · assassin s creed chronicles · assassins creed chronicles · assassin chronicles china · assassin creed russia · assassin s creed chronicles india · assassin creed chronicles ps4 · assassin creed 2d · assassins creed chronicles ps vita · assassins creed chronicles psvita · ac chronicles ps4 · assassins creed chronicles pc · assassins creed chronicles russia ps4 · assassins creed chronicles xbox · assassins creed chronicles xbox one

**Related** (`link-list` drukuje je ze struktury):
- `/assassins-creed-2/discovery/` — Assassin’s Creed II: Discovery, czyli Ezio w Hiszpanii
- `/assassins-creed-pirates/` — Assassin’s Creed Pirates: gra mobilna, nie główna część serii
- `/assassins-creed-syndicate/` — Assassin’s Creed Syndicate: Londyn epoki przemysłowej

**blocks[]** — kolejność i zestaw sekcji; każdy blok wymaga pola w pliku treści:
- `hero-key-art` — type-default, low
- `byline` — anatomy, medium, evidence 4/9
- `story-row` — type-default, low
- `gallery` — anatomy, medium, evidence 6/9
- `verdict-box` — anatomy, high, evidence 8/9
- `link-list` — manual, high
- `cta-band` — type-default, low

## Plan treści (anatomia S3, korpus klastra)

- dokumentów 9 z 6 hostów, koszyk **high**
- **korytarz znaków bez spacji: 4665–6311** (mediana 5488)
- nagłówków: h2 mediana 6, h3 mediana 2

| Temat (nasz słownik) | dokumentów | udział | werdykt |
|---|---:|---:|---|
| rozgrywka | 5/9 | 56 % | на решение |
| opinie | 5/9 | 56 % | на решение |
| fabula | 3/9 | 33 % | редкая |
| opis | 2/9 | 22 % | редкая |
| wersje | 2/9 | 22 % | редкая |
| wymagania | 2/9 | 22 % | редкая |
| poradnik | 2/9 | 22 % | редкая |
| zrodla | 1/9 | 11 % | гэп |
| produkcja | 1/9 | 11 % | гэп |
| premiera | 1/9 | 11 % | гэп |

| Element strony | dokumentów | udział | werdykt |
|---|---:|---:|---|
| breadcrumbs | 3/9 | 33 % | не норма |
| spis-tresci | 3/9 | 33 % | не норма |
| faq | 1/9 | 11 % | не норма |
| podobne | 1/9 | 11 % | не норма |
| tabela | 3/9 | 33 % | не норма |
| galeria | 6/9 | 67 % | на решение |
| wideo | 0/9 | 0 % | не норма |
| autor-data | 4/9 | 44 % | на решение |
| ocena | 8/9 | 89 % | обязателен |
| komentarze | 2/9 | 22 % | не норма |
| schema-org | 6/9 | 67 % | на решение |

## Dokumenty klastra do sprawdzania faktów (29, hostów 20)

*Lista adresów, nie treści. Fakt do druku musi być potwierdzony w jednym z nich
albo w materiale wydawcy; niepotwierdzony — przeformułować do potwierdzalnego
albo usunąć (П42). Pliki: `input/corpus/<file>` (gzip).*

- pl.wikipedia.org — https://pl.wikipedia.org/wiki/Assassin%E2%80%99s_Creed_Chronicles
- www.ubisoft.com — https://www.ubisoft.com/pl-pl/game/assassins-creed/chronicles
- www.gry-online.pl — https://www.gry-online.pl/gry/assassins-creed-chronicles-trilogy/zd4c4b
- store.steampowered.com — https://store.steampowered.com/app/354380/Assassins_Creed_Chronicles_China/?l=polish
- store.steampowered.com — https://store.steampowered.com/app/359600/Assassins_Creed_Chronicles_Russia/
- www.gry-online.pl — https://www.gry-online.pl/gry/assassins-creed-chronicles-russia/zd41a7
- store.steampowered.com — https://store.steampowered.com/app/359610/Assassins_Creed_Chronicles_India/
- www.xbox.com — https://www.xbox.com/pl-PL/games/store/assassins-creed-chronicles-trilogy/c4hb1xwt02dk
- www.xbox.com — https://www.xbox.com/pl-PL/play/games/assassin's-creed-chronicles-india/BTMS1PXLQ6P6
- perfectblue.pl — https://perfectblue.pl/produkt/gra-ps4-ps5-assassins-creed-chronicles-en/
- www.gry-online.pl — https://www.gry-online.pl/gry/assassins-creed-chronicles-china/z53e8e
- www.gry-online.pl — https://www.gry-online.pl/gry/assassins-creed-chronicles-india/zc41a6
- en.wikipedia.org — https://en.wikipedia.org/wiki/Assassin%27s_Creed_Chronicles
- store.playstation.com — https://store.playstation.com/pl-pl/product/EP0001-CUSA03440_00-ACCHRONICLESTRIL
- www.olx.pl — https://www.olx.pl/elektronika/gry-konsole/q-assassin's-creed-chronicles/
- muve.pl — https://muve.pl/p/assassin-s-creed-chronicles-china-pc-pl-digital-414243
- store.playstation.com — https://store.playstation.com/pl-pl/product/EP0001-CUSA01356_00-ACCHRONICLESEP03
- store.playstation.com — https://store.playstation.com/concept/205867/?smcid=pdc:us-en:web-pdc-games-ubisoft-plus-classics
- www.instant-gaming.com — https://www.instant-gaming.com/pl/3762-kup-assassin-s-creed-chronicles-india-pc-game-ubisoft-connect-europe/
- www.youtube.com — https://www.youtube.com/watch?v=z0TGYEvBIS0
- grymel.pl — https://grymel.pl/ubisoft/5209-assassins-creed-chronicles-pl.html
- www.youtube.com — https://www.youtube.com/playlist?list=PLSW8Cda0AgWIdcQ13SIrbTixEsgXfZw11
- ultima.pl — https://ultima.pl/ct/xbox-one/gry/akcja/assassins-creed-chronicles-2
- www.amazon.pl — https://www.amazon.pl/Assassins-Creed-Chronicles-Trilogy-Vita/dp/B019DYYU90
- apps.microsoft.com — https://apps.microsoft.com/detail/9pjpzk79n5vg?hl=en-US&gl=US
- www.ign.com — https://www.ign.com/articles/2015/04/21/assassins-creed-chronicles-china-review
- www.metacritic.com — https://www.metacritic.com/game/assassins-creed-chronicles/
- www.pricecharting.com — https://www.pricecharting.com/game/playstation-vita/assassin%27s-creed-chronicles
- www.keye.pl — https://www.keye.pl/assassin-s-creed-chronicles-india-p29181

## Zasady pisania (П42, bez wyczytki właściciela)

1. Głos przyjętych stron: główna i `/assassins-creed-4-black-flag/` — fakty
   o grach prawdziwe, bez tabloidu, werdykt słowami bez punktacji (П28).
2. Fakt niepotwierdzony korpusem lub materiałem wydawcy — nie drukuje się.
   Lista pominiętych i przeformułowanych idzie do raportu paczki.
3. Samo-oznaczenie «możliwie błędne» w opublikowanym tekście — niedopuszczalne.
4. Adresy w treści — tylko od korzenia i tylko ze struktury; bramka `links`
   przerywa budowanie na innych.
5. Długość — w korytarzu wyżej; dziś to wiersz raportu, nie bramka (decyzja
   właściciela w toku).
6. Podpis: «Redakcja · Bractwo», data — dzień budowania strony.
