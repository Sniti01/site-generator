# Bryf: `/assassins-creed-revelations/`

*Złożony maszyną `tools/brief-strony.mjs` ze struktury, anatomii S3 i manifestu
korpusu. Bez jednej frazy konkurenta — reguła korpusu (backlog, punkt 1).*

## Umowa (structure.json — nie zmieniać, wypełniać)

| Pole | Wartość |
|---|---|
| typ | `game` |
| h1 | Assassin’s Creed Revelations — koniec historii Ezia |
| title | Assassin’s Creed Revelations — Ezio w Konstantynopolu |
| description | Rok 2011, Konstantynopol i starzejący się Ezio śladami Altaïra. Czym Revelations domyka trylogię i co nowego wnosi do formuły znanej z Brotherhood. |
| rodzic | `/` |
| klaster | assassin revelation · zapytań 8 · popyt 3970 |
| art (slot `assassins-creed-revelations`) | materiał wydawcy (src/assets/gry) |

**Klucze** (8): ac revelation · assassin revelation · ezio auditore revelations · assassins creed re · assassin creed revelation ps4 · assassins creed 2011 · assassins creed objawienia · ezio auditore da firenze revelations

**Related** (`link-list` drukuje je ze struktury):
- `/assassins-creed-brotherhood/` — Assassin’s Creed Brotherhood — odbudowa bractwa w Rzymie
- `/ezio-auditore/` — Ezio Auditore — postać, historia i miejsce w serii
- `/assassins-creed-2/` — Assassin’s Creed 2 — druga część serii i debiut Ezia

**blocks[]** — kolejność i zestaw sekcji; każdy blok wymaga pola w pliku treści:
- `hero-key-art` — type-default, low
- `byline` — anatomy, medium, evidence 6/9
- `story-row` — type-default, low
- `gallery` — anatomy, medium, evidence 4/9
- `verdict-box` — anatomy, high, evidence 7/9
- `link-list` — manual, high
- `cta-band` — type-default, low

## Plan treści (anatomia S3, korpus klastra)

- dokumentów 9 z 8 hostów, koszyk **high**
- **korytarz znaków bez spacji (umowa, pole `corridor`): 3419–4625** — z anatomii: 3419–4625, mediana 4022
- nagłówków: h2 mediana 4, h3 mediana 1

| Temat (nasz słownik) | dokumentów | udział | werdykt |
|---|---:|---:|---|
| rozgrywka | 3/9 | 33 % | редкая |
| fabula | 2/9 | 22 % | редкая |
| produkcja | 2/9 | 22 % | редкая |
| opis | 2/9 | 22 % | редкая |
| dlc | 2/9 | 22 % | редкая |
| opinie | 2/9 | 22 % | редкая |
| zrodla | 1/9 | 11 % | гэп |
| wymagania | 1/9 | 11 % | гэп |
| swiat | 1/9 | 11 % | гэп |
| poradnik | 1/9 | 11 % | гэп |
| premiera | 1/9 | 11 % | гэп |
| seria | 1/9 | 11 % | гэп |
| wersje | 1/9 | 11 % | гэп |

| Element strony | dokumentów | udział | werdykt |
|---|---:|---:|---|
| breadcrumbs | 3/9 | 33 % | не норма |
| spis-tresci | 3/9 | 33 % | не норма |
| faq | 1/9 | 11 % | не норма |
| podobne | 2/9 | 22 % | не норма |
| tabela | 2/9 | 22 % | не норма |
| galeria | 4/9 | 44 % | на решение |
| wideo | 1/9 | 11 % | не норма |
| autor-data | 6/9 | 67 % | на решение |
| ocena | 7/9 | 78 % | обязателен |
| komentarze | 3/9 | 33 % | не норма |
| schema-org | 6/9 | 67 % | на решение |

## Dokumenty klastra do sprawdzania faktów (12, hostów 11)

*Lista adresów, nie treści. Fakt do druku musi być potwierdzony w jednym z nich
albo w materiale wydawcy; niepotwierdzony — przeformułować do potwierdzalnego
albo usunąć (П42). Pliki: `input/corpus/<file>` (gzip).*

- www.filmweb.pl — https://www.filmweb.pl/character/Ezio+Auditore-1738
- pl.wikipedia.org — https://pl.wikipedia.org/wiki/Assassin%E2%80%99s_Creed:_Revelations
- www.ubisoft.com — https://www.ubisoft.com/pl-pl/game/assassins-creed/revelations
- www.gry-online.pl — https://www.gry-online.pl/gry/assassins-creed-revelations/z09af
- store.steampowered.com — https://store.steampowered.com/app/201870/Assassins_Creed_Revelations/
- www.xbox.com — https://www.xbox.com/pl-PL/games/store/assassins-creed-revelations/bx2jj48f0ckr
- www.gry-online.pl — https://www.gry-online.pl/recenzje/assassins-creed-revelations-recenzja-finalu-trylogii-ezio-auditor/z01ec7
- www.youtube.com — https://www.youtube.com/watch?v=HMsbMK9Odoc
- en.wikipedia.org — https://en.wikipedia.org/wiki/Assassin%27s_Creed_Revelations
- skupszop.pl — https://skupszop.pl/ksiazka/assassins-creed-objawienia
- kuznia.art.pl — https://kuznia.art.pl/nowosci-wydawnicze/565-assassins-creed-objawienia-oliver-bowden.html
- zazyjkultury.pl — https://zazyjkultury.pl/assassins-creed-objawienia-oliver-bowden/

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
