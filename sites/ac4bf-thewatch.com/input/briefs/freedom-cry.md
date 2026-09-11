# Bryf: `/assassins-creed-4-black-flag/freedom-cry/`

*Złożony maszyną `tools/brief-strony.mjs` ze struktury, anatomii S3 i manifestu
korpusu. Bez jednej frazy konkurenta — reguła korpusu (backlog, punkt 1).*

## Umowa (structure.json — nie zmieniać, wypełniać)

| Pole | Wartość |
|---|---|
| typ | `game` |
| h1 | Freedom Cry: Adéwalé i wolność na Saint-Domingue |
| title | Freedom Cry — dodatek do Assassin’s Creed IV: Black Flag |
| description | Adéwalé, dawny kwatermistrz Jackdawa, ląduje na Saint-Domingue i uderza w handel niewolnikami. Krótsza, zamknięta historia, wydana też jako osobna gra. |
| rodzic | `/assassins-creed-4-black-flag/` |
| klaster | assassins creed cry · zapytań 7 · popyt 1240 |
| art (slot `freedom-cry`) | materiał wydawcy (src/assets/gry) |

**Klucze** (7): assassins creed iv freedom cry · assassins freedom cry · freedom cry ps4 · assassins creed cry · assassins creed freedom · assassins creed freedom cry ps3 · assassins creed freedom cry xbox 360

**Related** (`link-list` drukuje je ze struktury):
- `/assassins-creed-4-black-flag/` — Assassin’s Creed IV: Black Flag — piracka odsłona serii
- `/assassins-creed-liberation/` — Assassin’s Creed Liberation HD: pierwsza bohaterka serii
- `/assassins-creed-rogue/` — Assassin’s Creed Rogue: asasyn po stronie templariuszy

**blocks[]** — kolejność i zestaw sekcji; każdy blok wymaga pola w pliku treści:
- `hero-key-art` — type-default, low
- `byline` — anatomy, medium, evidence 4/7
- `story-row` — type-default, low
- `gallery` — anatomy, high, evidence 5/7
- `verdict-box` — anatomy, high, evidence 5/7
- `link-list` — manual, high
- `cta-band` — type-default, low

## Plan treści (anatomia S3, korpus klastra)

- dokumentów 7 z 7 hostów, koszyk **high**
- **korytarz znaków bez spacji (umowa, pole `corridor`): 2744–3712** — z anatomii: 2744–3712, mediana 3228
- nagłówków: h2 mediana 2, h3 mediana 2

| Temat (nasz słownik) | dokumentów | udział | werdykt |
|---|---:|---:|---|
| wersje | 2/7 | 29 % | редкая |
| opinie | 2/7 | 29 % | редкая |
| fabula | 1/7 | 14 % | гэп |
| dlc | 1/7 | 14 % | гэп |
| swiat | 1/7 | 14 % | гэп |
| premiera | 1/7 | 14 % | гэп |
| wymagania | 1/7 | 14 % | гэп |
| opis | 1/7 | 14 % | гэп |
| rozgrywka | 1/7 | 14 % | гэп |
| produkcja | 1/7 | 14 % | гэп |

| Element strony | dokumentów | udział | werdykt |
|---|---:|---:|---|
| breadcrumbs | 3/7 | 43 % | на решение |
| spis-tresci | 2/7 | 29 % | не норма |
| faq | 1/7 | 14 % | не норма |
| podobne | 1/7 | 14 % | не норма |
| tabela | 1/7 | 14 % | не норма |
| galeria | 5/7 | 71 % | обязателен |
| wideo | 0/7 | 0 % | не норма |
| autor-data | 4/7 | 57 % | на решение |
| ocena | 5/7 | 71 % | обязателен |
| komentarze | 2/7 | 29 % | не норма |
| schema-org | 6/7 | 86 % | обязателен |

## Dokumenty klastra do sprawdzania faktów (8, hostów 8)

*Lista adresów, nie treści. Fakt do druku musi być potwierdzony w jednym z nich
albo w materiale wydawcy; niepotwierdzony — przeformułować do potwierdzalnego
albo usunąć (П42). Pliki: `input/corpus/<file>` (gzip).*

- www.gry-online.pl — https://www.gry-online.pl/gry/assassins-creed-iv-black-flag-freedom-cry/z539f3
- store.steampowered.com — https://store.steampowered.com/app/277590/Assassins_Creed_Freedom_Cry/?l=polish
- www.xbox.com — https://www.xbox.com/pl-PL/games/store/assassins-creed-iv-black-flag-freedom-cry/bvt23t7mdrq8
- store.ubisoft.com — https://store.ubisoft.com/eu/assassin-s-creed--freedom-cry---standalone-game/56c4948188a7e300458b46ce.html?lang=pl-PL
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-black-flag-resynced-czy-jest-dodatek-krzyk-wolnosci-dlc-freedom-cry
- en.wikipedia.org — https://en.wikipedia.org/wiki/Assassin%27s_Creed_Freedom_Cry
- store.playstation.com — https://store.playstation.com/pl-pl/product/EP0001-CUSA00435_00-ACBFDLCSPSA00001
- muve.pl — https://muve.pl/p/assassins-creed-freedom-cry-standalone-game-pc-uplay-1223308

## Zasady pisania (П42, bez wyczytki właściciela)

1. Głos przyjętych stron: główna i `/assassins-creed-4-black-flag/` — fakty
   o grach prawdziwe, bez tabloidu, werdykt słowami bez punktacji (П28).
2. Fakt niepotwierdzony korpusem lub materiałem wydawcy — nie drukuje się.
   Lista pominiętych i przeformułowanych idzie do raportu paczki.
3. Samo-oznaczenie «możliwie błędne» w opublikowanym tekście — niedopuszczalne.
4. Adresy w treści — tylko od korzenia i tylko ze struktury; bramka `links`
   przerywa budowanie na innych.
5. Długość — w korytarzu z umowy (pole `corridor` w structure.json); bramka
   wyniku `corridor` mierzy znaki bez spacji w `<main>` zbudowanej strony
   i przerywa budowanie poza parą (П43). Bezpiecznik: tekstu nie dopycha się
   wodą ani nie tnie — zmienia się korytarz, nazwaną decyzją z przyczyną
   w raporcie paczki. `null` w umowie — liczba do raportu, bez wyroku.
6. Podpis: «Redakcja · Bractwo», data — dzień budowania strony.
