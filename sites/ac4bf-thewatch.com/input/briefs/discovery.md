# Bryf: `/assassins-creed-2/discovery/`

*Złożony maszyną `tools/brief-strony.mjs` ze struktury, anatomii S3 i manifestu
korpusu. Bez jednej frazy konkurenta — reguła korpusu (backlog, punkt 1).*

## Umowa (structure.json — nie zmieniać, wypełniać)

| Pole | Wartość |
|---|---|
| typ | `game` |
| h1 | Assassin’s Creed II: Discovery, czyli Ezio w Hiszpanii |
| title | Osobna gra na Nintendo DS — Assassin’s Creed II: Discovery |
| description | To nie tryb w Assassin’s Creed II, tylko samodzielna gra 2D z 2009 roku, wydana też na iOS. Ezio wyrusza do Hiszpanii, a rozgrywka toczy się w rzucie z boku. |
| rodzic | `/assassins-creed-2/` |
| klaster | assassins creed discovery · zapytań 4 · popyt 100 |
| art (slot `discovery`) | zdjęcie Commons (src/assets/foto) |

**Klucze** (4): assassins creed discovery · assassins creed 2 discovery · assassins creed 2 nintendo ds · assassins creed ii discovery 2009

**Related** (`link-list` drukuje je ze struktury):
- `/assassins-creed-2/` — Assassin’s Creed 2 — druga część serii i debiut Ezia
- `/assassins-creed-pirates/` — Assassin’s Creed Pirates: gra mobilna, nie główna część serii
- `/assassins-creed-chronicles/` — Assassin’s Creed Chronicles — trzy gry, trzy epoki

**blocks[]** — kolejność i zestaw sekcji; każdy blok wymaga pola w pliku treści:
- `hero-key-art` — type-default, low
- `story-row` — type-default, low
- `link-list` — manual, high
- `cta-band` — type-default, low

## Plan treści (anatomia S3, korpus klastra)

- dokumentów 5 z 5 hostów, koszyk **low**
- **korytarz znaków bez spacji (umowa, pole `corridor`): 2462–3332** — z anatomii: 2462–3332, mediana 2897
- nagłówków: h2 mediana 3, h3 mediana 1

| Temat (nasz słownik) | dokumentów | udział | werdykt |
|---|---:|---:|---|
| produkcja | 2/5 | 40 % | на решение |
| opinie | 2/5 | 40 % | на решение |
| zrodla | 1/5 | 20 % | гэп |
| fabula | 1/5 | 20 % | гэп |
| rozgrywka | 1/5 | 20 % | гэп |
| wersje | 1/5 | 20 % | гэп |
| postacie | 1/5 | 20 % | гэп |
| ciekawostki | 1/5 | 20 % | гэп |

| Element strony | dokumentów | udział | werdykt |
|---|---:|---:|---|
| breadcrumbs | 3/5 | 60 % | не считается |
| spis-tresci | 3/5 | 60 % | не считается |
| faq | 1/5 | 20 % | не считается |
| podobne | 1/5 | 20 % | не считается |
| tabela | 3/5 | 60 % | не считается |
| galeria | 2/5 | 40 % | не считается |
| wideo | 1/5 | 20 % | не считается |
| autor-data | 4/5 | 80 % | не считается |
| ocena | 3/5 | 60 % | не считается |
| komentarze | 2/5 | 40 % | не считается |
| schema-org | 5/5 | 100 % | не считается |

## Dokumenty klastra do sprawdzania faktów (5, hostów 5)

*Lista adresów, nie treści. Fakt do druku musi być potwierdzony w jednym z nich
albo w materiale wydawcy; niepotwierdzony — przeformułować do potwierdzalnego
albo usunąć (П42). Pliki: `input/corpus/<file>` (gzip).*

- pl.wikipedia.org — https://pl.wikipedia.org/wiki/Assassin%E2%80%99s_Creed_II:_Discovery
- www.gry-online.pl — https://www.gry-online.pl/gry/assassins-creed-ii-discovery/ze26ae
- cdaction.pl — https://cdaction.pl/newsy/schowaj-ezio-do-kieszeni-ubisoft-zapowiada-assassin-s-creed-ii-discovery-na-nintendo-ds/
- en.wikipedia.org — https://en.wikipedia.org/wiki/Assassin%27s_Creed_II:_Discovery
- sklepgamer.pl — https://sklepgamer.pl/6731-assassin-s-creed-ii-discovery-ds-uzywana-ds-usa.html

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
