# Bryf: `/assassins-creed-pirates/`

*Złożony maszyną `tools/brief-strony.mjs` ze struktury, anatomii S3 i manifestu
korpusu. Bez jednej frazy konkurenta — reguła korpusu (backlog, punkt 1).*

## Umowa (structure.json — nie zmieniać, wypełniać)

| Pole | Wartość |
|---|---|
| typ | `game` |
| h1 | Assassin’s Creed Pirates: gra mobilna, nie główna część serii |
| title | Pirates — Assassin’s Creed na telefon, same bitwy morskie |
| description | Mobilna gra na iOS i Androida ogranicza się do żeglowania i starć na pełnym morzu. Bez skradania, bez wspinaczki, bez fabuły z głównych części. |
| rodzic | `/` |
| klaster | assassins pirates · zapytań 5 · popyt 660 |
| art (slot `assassins-creed-pirates`) | zdjęcie Commons (src/assets/foto) |

**Klucze** (5): ac pirates · assassin s creed pirates · assassins creed pirates · assassins pirates · assassins creed pirates ios

**Related** (`link-list` drukuje je ze struktury):
- `/assassins-creed-4-black-flag/` — Assassin’s Creed IV: Black Flag — piracka odsłona serii
- `/assassins-creed-2/discovery/` — Assassin’s Creed II: Discovery, czyli Ezio w Hiszpanii
- `/assassins-creed-chronicles/` — Assassin’s Creed Chronicles — trzy gry, trzy epoki

**blocks[]** — kolejność i zestaw sekcji; każdy blok wymaga pola w pliku treści:
- `hero-key-art` — type-default, low
- `byline` — anatomy, medium, evidence 4/6
- `story-row` — type-default, low
- `gallery` — anatomy, medium, evidence 4/6
- `verdict-box` — anatomy, high, evidence 5/6
- `link-list` — manual, high
- `cta-band` — type-default, low

## Plan treści (anatomia S3, korpus klastra)

- dokumentów 6 z 6 hostów, koszyk **high**
- **korytarz znaków bez spacji (umowa, pole `corridor`): 2492–3372** — z anatomii: 2492–3372, mediana 2932
- nagłówków: h2 mediana 2, h3 mediana 1

| Temat (nasz słownik) | dokumentów | udział | werdykt |
|---|---:|---:|---|
| wersje | 2/6 | 33 % | редкая |
| opinie | 2/6 | 33 % | редкая |
| cena | 1/6 | 17 % | гэп |
| wymagania | 1/6 | 17 % | гэп |
| opis | 1/6 | 17 % | гэп |
| rozgrywka | 1/6 | 17 % | гэп |
| produkcja | 1/6 | 17 % | гэп |

| Element strony | dokumentów | udział | werdykt |
|---|---:|---:|---|
| breadcrumbs | 2/6 | 33 % | не норма |
| spis-tresci | 1/6 | 17 % | не норма |
| faq | 1/6 | 17 % | не норма |
| podobne | 2/6 | 33 % | не норма |
| tabela | 1/6 | 17 % | не норма |
| galeria | 4/6 | 67 % | на решение |
| wideo | 1/6 | 17 % | не норма |
| autor-data | 4/6 | 67 % | на решение |
| ocena | 5/6 | 83 % | обязателен |
| komentarze | 2/6 | 33 % | не норма |
| schema-org | 6/6 | 100 % | обязателен |

## Dokumenty klastra do sprawdzania faktów (7, hostów 7)

*Lista adresów, nie treści. Fakt do druku musi być potwierdzony w jednym z nich
albo w materiale wydawcy; niepotwierdzony — przeformułować do potwierdzalnego
albo usunąć (П42). Pliki: `input/corpus/<file>` (gzip).*

- www.gry-online.pl — https://www.gry-online.pl/gry/assassins-creed-pirates/z63e95
- www.xbox.com — https://www.xbox.com/pl-PL/games/store/assassins-creed-iv-black-flag-illustrious-pirates-pack/bpwtnfl359vx
- en.wikipedia.org — https://en.wikipedia.org/wiki/Assassin%27s_Creed:_Pirates
- store.playstation.com — https://store.playstation.com/pl-pl/product/EP0001-CUSA00009_00-SPACBFDLCULCPACK
- gexe.pl — https://gexe.pl/assassins-creed-pirates
- archive.org — https://archive.org/details/com.ubisoft.assassin.pirates-ios
- www.gamereactor.pl — https://www.gamereactor.pl/assassins-creed-pirates/

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
