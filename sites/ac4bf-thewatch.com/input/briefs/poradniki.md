# Bryf: `/poradniki/`

*Złożony maszyną `tools/brief-strony.mjs` ze struktury, anatomii S3 i manifestu
korpusu. Bez jednej frazy konkurenta — reguła korpusu (backlog, punkt 1).*

## Umowa (structure.json — nie zmieniać, wypełniać)

| Pole | Wartość |
|---|---|
| typ | `hub` |
| h1 | Który Assassin’s Creed jest najlepszy |
| title | Najlepszy Assassin’s Creed — porównanie i poradniki |
| description | Która odsłona serii Assassin’s Creed wciąga najbardziej, która się zestarzała i po co wracać do starszych części. Obok tego spis poradników do gier. |
| rodzic | `/` |
| klaster | najlepszy assasin creed · zapytań 4 · popyt 830 |
| art (slot `poradniki`) | zdjęcie Commons (src/assets/foto) |

**Klucze** (4): najlepszy assasin creed · najlepszy assassin creed · najlepszy assassins creed · najlepszy assassin

**Related** (`link-list` drukuje je ze struktury):
- `/poradniki/od-czego-zaczac/` — Od której części zacząć: Assassin’s Creed po kolei
- `/assassins-creed-za-darmo/` — Jak zagrać w Assassin’s Creed za darmo i legalnie
- `/` — Cała seria Assassin’s Creed, część po części

**blocks[]** — kolejność i zestaw sekcji; każdy blok wymaga pola w pliku treści:
- `hero-key-art` — type-default, low
- `card-rail` — type-default, low
- `link-columns` — type-default, low
- `link-list` — manual, high
- `cta-band` — type-default, low

## Plan treści (anatomia S3, korpus klastra)

- dokumentów 3 z 3 hostów, koszyk **mid**
- **korytarz znaków bez spacji (umowa, pole `corridor`): null — bez wyroku, liczba do raportu (decyzja nazwana w DECISIONS.md)** — z anatomii: 3900–5276, mediana 4588, orientacyjna — własnych dokumentów mniej niż cztery
- nagłówków: h2 mediana 11, h3 mediana 6

| Temat (nasz słownik) | dokumentów | udział | werdykt |
|---|---:|---:|---|
| wersje | 1/3 | 33 % | не считается |
| rozgrywka | 1/3 | 33 % | не считается |

| Element strony | dokumentów | udział | werdykt |
|---|---:|---:|---|
| breadcrumbs | 2/3 | 67 % | не считается |
| spis-tresci | 0/3 | 0 % | не считается |
| faq | 0/3 | 0 % | не считается |
| podobne | 2/3 | 67 % | не считается |
| tabela | 0/3 | 0 % | не считается |
| galeria | 1/3 | 33 % | не считается |
| wideo | 1/3 | 33 % | не считается |
| autor-data | 3/3 | 100 % | не считается |
| ocena | 0/3 | 0 % | не считается |
| komentarze | 1/3 | 33 % | не считается |
| schema-org | 3/3 | 100 % | не считается |

## Dokumenty klastra do sprawdzania faktów (4, hostów 4)

*Lista adresów, nie treści. Fakt do druku musi być potwierdzony w jednym z nich
albo w materiale wydawcy; niepotwierdzony — przeformułować do potwierdzalnego
albo usunąć (П42). Pliki: `input/corpus/<file>` (gzip).*

- www.gry-online.pl — https://www.gry-online.pl/newsroom/ranking-gier-assassins-creed-od-najgorszej-do-najlepszej-czesci-c/z1270f2
- spidersweb.pl — https://spidersweb.pl/2019/06/assassins-creed-ktory-najlepszy.html
- www.redbull.com — https://www.redbull.com/pl-pl/najlepsze-gry-z-serii-assassins-creed
- gaming.komputronik.pl — https://gaming.komputronik.pl/g/najlepszy-assassins-creed-ranking-gier/

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
