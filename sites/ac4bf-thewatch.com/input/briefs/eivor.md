# Bryf: `/assassins-creed-valhalla/eivor/`

*Złożony maszyną `tools/brief-strony.mjs` ze struktury, anatomii S3 i manifestu
korpusu. Bez jednej frazy konkurenta — reguła korpusu (backlog, punkt 1).*

## Umowa (structure.json — nie zmieniać, wypełniać)

| Pole | Wartość |
|---|---|
| typ | `topic` |
| h1 | Kim jest Eivor w Assassin’s Creed Valhalla? |
| title | Eivor z Valhalli — historia wikińskiego wojownika z Norwegii |
| description | Eivor z klanu Kruka: skąd pochodzi, dlaczego płynie do Anglii i co zmienia wybór płci bohatera w Assassin’s Creed Valhalla. Bez zbędnych spoilerów. |
| rodzic | `/assassins-creed-valhalla/` |
| klaster | assassin eivor · zapytań 12 · popyt 350 |
| art (slot `eivor`) | nie dotyczy — strona bez hero-key-art |

**Klucze** (12): eivor valhalla · eivor assassins creed · assassins creed valhalla eivor · ac valhalla eivor · eivor assassins creed valhalla · assassin eivor · assassins creed odyssey eivor · eivor assassin · eivor vikings · eivor wolfsmal · valhalla eivor · vikings eivor

**Related** (`link-list` drukuje je ze struktury):
- `/assassins-creed-valhalla/` — Wikińska Anglia w Assassin’s Creed Valhalla: od czego zacząć
- `/assassins-creed-valhalla/dawn-of-ragnarok/` — Dawn of Ragnarök, czyli mitologiczny dodatek do Valhalli
- `/ezio-auditore/` — Ezio Auditore — postać, historia i miejsce w serii

**blocks[]** — kolejność i zestaw sekcji; każdy blok wymaga pola w pliku treści:
- `byline` — anatomy, medium, evidence 4/6
- `toc` — anatomy, medium, evidence 3/6
- `story-row` — type-default, low
- `gallery` — anatomy, medium, evidence 3/6
- `verdict-box` — anatomy, medium, evidence 3/6
- `link-list` — manual, high
- `cta-band` — type-default, low

## Plan treści (anatomia S3, korpus klastra)

- dokumentów 6 z 6 hostów, koszyk **mid**
- **korytarz znaków bez spacji: 3348–4530** (mediana 3939)
- nagłówków: h2 mediana 3, h3 mediana 2

| Temat (nasz słownik) | dokumentów | udział | werdykt |
|---|---:|---:|---|
| rozgrywka | 1/6 | 17 % | гэп |
| opis | 1/6 | 17 % | гэп |
| swiat | 1/6 | 17 % | гэп |
| fabula | 1/6 | 17 % | гэп |
| produkcja | 1/6 | 17 % | гэп |
| opinie | 1/6 | 17 % | гэп |
| zrodla | 1/6 | 17 % | гэп |
| poradnik | 1/6 | 17 % | гэп |

| Element strony | dokumentów | udział | werdykt |
|---|---:|---:|---|
| breadcrumbs | 3/6 | 50 % | на решение |
| spis-tresci | 3/6 | 50 % | на решение |
| faq | 2/6 | 33 % | не норма |
| podobne | 2/6 | 33 % | не норма |
| tabela | 1/6 | 17 % | не норма |
| galeria | 3/6 | 50 % | на решение |
| wideo | 3/6 | 50 % | на решение |
| autor-data | 4/6 | 67 % | на решение |
| ocena | 3/6 | 50 % | на решение |
| komentarze | 2/6 | 33 % | не норма |
| schema-org | 5/6 | 83 % | обязателен |

## Dokumenty klastra do sprawdzania faktów (15, hostów 12)

*Lista adresów, nie treści. Fakt do druku musi być potwierdzony w jednym z nich
albo w materiale wydawcy; niepotwierdzony — przeformułować do potwierdzalnego
albo usunąć (П42). Pliki: `input/corpus/<file>` (gzip).*

- pl.wikipedia.org — https://pl.wikipedia.org/wiki/Assassin%E2%80%99s_Creed_Valhalla
- www.gry-online.pl — https://www.gry-online.pl/poradniki/assassins-creed-valhalla/eivor-plec-asasyn-personalizacja/z81a042
- www.filmweb.pl — https://www.filmweb.pl/character/Eivor-1752
- www.ubisoft.com — https://www.ubisoft.com/pl-pl/game/assassins-creed/news/6xmE9vV9Pgm2CoW60YAGkn/assassins-creed-crossover-stories-opowieci-ponad-czasem-ju-dostpne
- www.youtube.com — https://www.youtube.com/watch?v=g4nL1QmVPV8
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-valhalla-eivor-miala-byc-wylacznie-kobieta
- www.youtube.com — https://www.youtube.com/playlist?list=PL0fSTml3BFP0tE-Uyz10yNwpjjvny76vu
- www.youtube.com — https://www.youtube.com/watch?v=9m0CExo0B-8
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-crossover-stories-juz-dzis-w-ac-valhlalla-i-odyssey-eivor-spotka-kassandre
- scryfall.com — https://scryfall.com/card/acr/54/de/eivor-wolfsmal-(eivor-wolf-kissed)
- poptoys.pl — https://poptoys.pl/products/eivor-assassins-creed-valhalla-pvc-statue-25-cm/
- www.eivor.com — https://www.eivor.com/
- www.tiktok.com — https://www.tiktok.com/@owda007/video/7514588192994118934
- fource.pl — https://fource.pl/pl/events/eivor-fo/
- www.assassins-creed.de — https://www.assassins-creed.de/valhalla/valhalla_protagonisten.htm

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
