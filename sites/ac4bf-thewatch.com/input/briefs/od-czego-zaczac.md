# Bryf: `/poradniki/od-czego-zaczac/`

*Złożony maszyną `tools/brief-strony.mjs` ze struktury, anatomii S3 i manifestu
korpusu. Bez jednej frazy konkurenta — reguła korpusu (backlog, punkt 1).*

## Umowa (structure.json — nie zmieniać, wypełniać)

| Pole | Wartość |
|---|---|
| typ | `guide` |
| h1 | Od której części zacząć: Assassin’s Creed po kolei |
| title | Assassin’s Creed po kolei — chronologia i premiery serii |
| description | Chronologia wydarzeń i kolejność premier obok siebie: gdzie najlepiej wejść w serię, które wątki łączą się ze sobą i co da się pominąć bez szkody dla fabuły. |
| rodzic | `/poradniki/` |
| klaster | assassin creed po kolei · zapytań 2 · popyt 390 |
| art (slot `od-czego-zaczac`) | nie dotyczy — strona bez hero-key-art |

**Klucze** (2): assassin creed po kolei · assassin po kolei

**Related** (`link-list` drukuje je ze struktury):
- `/poradniki/` — Który Assassin’s Creed jest najlepszy
- `/assassins-creed-1/` — Assassin’s Creed 1 — początek serii i historia Altaïra
- `/assassins-creed-4-black-flag/` — Assassin’s Creed IV: Black Flag — piracka odsłona serii
- `/` — Cała seria Assassin’s Creed, część po części

**blocks[]** — kolejność i zestaw sekcji; każdy blok wymaga pola w pliku treści:
- `byline` — anatomy, high, evidence 6/6
- `story-row` — type-default, low
- `link-list` — type-default, low
- `cta-band` — type-default, low

## Plan treści (anatomia S3, korpus klastra)

- dokumentów 6 z 6 hostów, koszyk **mid**
- **korytarz znaków bez spacji (umowa, pole `corridor`): 7675–10383** — z anatomii: 7675–10383, mediana 9029
- nagłówków: h2 mediana 3, h3 mediana 1

| Temat (nasz słownik) | dokumentów | udział | werdykt |
|---|---:|---:|---|
| seria | 2/6 | 33 % | редкая |
| wersje | 2/6 | 33 % | редкая |
| opis | 1/6 | 17 % | гэп |
| media | 1/6 | 17 % | гэп |
| opinie | 1/6 | 17 % | гэп |
| zrodla | 1/6 | 17 % | гэп |
| fabula | 1/6 | 17 % | гэп |
| rozgrywka | 1/6 | 17 % | гэп |
| postacie | 1/6 | 17 % | гэп |

| Element strony | dokumentów | udział | werdykt |
|---|---:|---:|---|
| breadcrumbs | 2/6 | 33 % | не норма |
| spis-tresci | 1/6 | 17 % | не норма |
| faq | 2/6 | 33 % | не норма |
| podobne | 1/6 | 17 % | не норма |
| tabela | 1/6 | 17 % | не норма |
| galeria | 2/6 | 33 % | не норма |
| wideo | 1/6 | 17 % | не норма |
| autor-data | 6/6 | 100 % | обязателен |
| ocena | 1/6 | 17 % | не норма |
| komentarze | 0/6 | 0 % | не норма |
| schema-org | 4/6 | 67 % | на решение |

## Dokumenty klastra do sprawdzania faktów (6, hostów 6)

*Lista adresów, nie treści. Fakt do druku musi być potwierdzony w jednym z nich
albo w materiale wydawcy; niepotwierdzony — przeformułować do potwierdzalnego
albo usunąć (П42). Pliki: `input/corpus/<file>` (gzip).*

- pl.wikipedia.org — https://pl.wikipedia.org/wiki/Assassin%E2%80%99s_Creed_(seria)
- www.gry-online.pl — https://www.gry-online.pl/gry/seria-assassins-creed/zf7dd
- www.youtube.com — https://www.youtube.com/watch?v=t20uW8AqfiY
- news.ubisoft.com — https://news.ubisoft.com/pl-pl/article/6ceMaQ0MpYMPeN1mJxXlLF/jak-gra-w-gry-z-serii-assassins-creed-w-kolejnoci
- www.redbull.com — https://www.redbull.com/pl-pl/assassins-creed-chronologia-czesci
- antyweb.pl — https://antyweb.pl/w-jakiej-kolejnosci-grac-w-assassins-creed

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
