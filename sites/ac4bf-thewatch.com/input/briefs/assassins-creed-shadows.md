# Bryf: `/assassins-creed-shadows/`

*Złożony maszyną `tools/brief-strony.mjs` ze struktury, anatomii S3 i manifestu
korpusu. Bez jednej frazy konkurenta — reguła korpusu (backlog, punkt 1).*

## Umowa (structure.json — nie zmieniać, wypełniać)

| Pole | Wartość |
|---|---|
| typ | `game` |
| h1 | Assassin’s Creed Shadows, dawniej Red: dwoje bohaterów |
| title | Japonia w Assassin’s Creed Shadows — dawnym projekcie Red |
| description | Assassin’s Creed Shadows to odsłona zapowiadana wcześniej jako Red: feudalna Japonia, dwoje grywalnych bohaterów i to, czym różni się od poprzednich części. |
| rodzic | `/` |
| klaster | assassin red · zapytań 5 · popyt 160 |
| art (slot `japonia`) | materiał wydawcy (src/assets/gry) |

**Klucze** (5): assassin creed red · assassin red · assassins creed 2024 · assassins creed red ps4 · assassins creed titans

**Related** (`link-list` drukuje je ze struktury):
- `/` — Cała seria Assassin’s Creed, część po części
- `/assassins-creed-mirage/` — Assassin’s Creed Mirage: Basim, Bagdad i kameralna skala
- `/poradniki/od-czego-zaczac/` — Od której części zacząć: Assassin’s Creed po kolei

**blocks[]** — kolejność i zestaw sekcji; każdy blok wymaga pola w pliku treści:
- `hero-key-art` — type-default, low
- `story-row` — type-default, low
- `link-list` — manual, high
- `cta-band` — type-default, low

## Plan treści (anatomia S3, korpus klastra)

- dokumentów 3 z 3 hostów, koszyk **low**
- **korytarz znaków bez spacji: 3900–5276** (mediana 4588, orientacyjny — własnych dokumentów mniej niż cztery)
- nagłówków: h2 mediana 8, h3 mediana 7

| Temat (nasz słownik) | dokumentów | udział | werdykt |
|---|---:|---:|---|
| produkcja | 3/3 | 100 % | не считается |
| wersje | 3/3 | 100 % | не считается |
| rozgrywka | 2/3 | 67 % | не считается |
| swiat | 2/3 | 67 % | не считается |
| fabula | 2/3 | 67 % | не считается |
| opinie | 2/3 | 67 % | не считается |
| postacie | 2/3 | 67 % | не считается |
| ciekawostki | 2/3 | 67 % | не считается |
| opis | 1/3 | 33 % | не считается |
| zrodla | 1/3 | 33 % | не считается |
| gatunek | 1/3 | 33 % | не считается |
| poradnik | 1/3 | 33 % | не считается |
| wymagania | 1/3 | 33 % | не считается |
| seria | 1/3 | 33 % | не считается |
| dlc | 1/3 | 33 % | не считается |

| Element strony | dokumentów | udział | werdykt |
|---|---:|---:|---|
| breadcrumbs | 2/3 | 67 % | не считается |
| spis-tresci | 1/3 | 33 % | не считается |
| faq | 1/3 | 33 % | не считается |
| podobne | 1/3 | 33 % | не считается |
| tabela | 1/3 | 33 % | не считается |
| galeria | 1/3 | 33 % | не считается |
| wideo | 1/3 | 33 % | не считается |
| autor-data | 3/3 | 100 % | не считается |
| ocena | 2/3 | 67 % | не считается |
| komentarze | 2/3 | 67 % | не считается |
| schema-org | 3/3 | 100 % | не считается |

## Dokumenty klastra do sprawdzania faktów (8, hostów 6)

*Lista adresów, nie treści. Fakt do druku musi być potwierdzony w jednym z nich
albo w materiale wydawcy; niepotwierdzony — przeformułować do potwierdzalnego
albo usunąć (П42). Pliki: `input/corpus/<file>` (gzip).*

- pl.wikipedia.org — https://pl.wikipedia.org/wiki/Assassin%E2%80%99s_Creed_Shadows
- www.playstation.com — https://www.playstation.com/pl-pl/games/assassins-creed-shadows/
- www.gry-online.pl — https://www.gry-online.pl/gry/assassins-creed-shadows/ze6440
- cdaction.pl — https://cdaction.pl/newsy/assassins-creed-red-nadchodzi-przelom-w-jakosci-serii/
- www.ign.com — https://www.ign.com/articles/assassins-creed-shadows-attack-on-titan-crossover-launches-tomorrow-but-free-quest-only-available-for-a-month
- www.youtube.com — https://www.youtube.com/watch?v=LgIV2VdfXeE
- www.youtube.com — https://www.youtube.com/watch?v=P-EfaTVFQbY&vl=pl
- www.youtube.com — https://www.youtube.com/watch?v=cWLo9vgIJPs

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
