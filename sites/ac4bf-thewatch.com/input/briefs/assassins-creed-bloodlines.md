# Bryf: `/assassins-creed-bloodlines/`

*Złożony maszyną `tools/brief-strony.mjs` ze struktury, anatomii S3 i manifestu
korpusu. Bez jednej frazy konkurenta — reguła korpusu (backlog, punkt 1).*

## Umowa (structure.json — nie zmieniać, wypełniać)

| Pole | Wartość |
|---|---|
| typ | `game` |
| h1 | Assassin’s Creed: Bloodlines — odsłona na PSP |
| title | Bloodlines na PSP — Altaïr na Cyprze po pierwszej części |
| description | Gra z 2009 roku na PlayStation Portable: Altaïr rusza na Cypr tropem templariuszy. Co Bloodlines dopowiada między pierwszą a drugą częścią serii. |
| rodzic | `/` |
| klaster | assassins creed psp · zapytań 3 · popyt 1450 |
| art (slot `assassins-creed-bloodlines`) | zdjęcie Commons (src/assets/foto) |

**Klucze** (3): assassin s creed psp · assassins creed psp · assassins creed 1 psp

**Related** (`link-list` drukuje je ze struktury):
- `/assassins-creed-1/` — Assassin’s Creed 1 — początek serii i historia Altaïra
- `/` — Cała seria Assassin’s Creed, część po części
- `/poradniki/od-czego-zaczac/` — Od której części zacząć: Assassin’s Creed po kolei

**blocks[]** — kolejność i zestaw sekcji; każdy blok wymaga pola w pliku treści:
- `hero-key-art` — type-default, low
- `story-row` — type-default, low
- `gallery` — anatomy, medium, evidence 4/8
- `verdict-box` — anatomy, high, evidence 6/8
- `link-list` — manual, high
- `cta-band` — type-default, low

## Plan treści (anatomia S3, korpus klastra)

- dokumentów 8 z 8 hostów, koszyk **high**
- **korytarz znaków bez spacji: 3075–4161** (mediana 3618)
- nagłówków: h2 mediana 1, h3 mediana 2

| Temat (nasz słownik) | dokumentów | udział | werdykt |
|---|---:|---:|---|
| opinie | 2/8 | 25 % | редкая |
| wersje | 2/8 | 25 % | редкая |
| fabula | 1/8 | 13 % | гэп |
| wymagania | 1/8 | 13 % | гэп |
| rozgrywka | 1/8 | 13 % | гэп |
| opis | 1/8 | 13 % | гэп |
| media | 1/8 | 13 % | гэп |

| Element strony | dokumentów | udział | werdykt |
|---|---:|---:|---|
| breadcrumbs | 5/8 | 63 % | на решение |
| spis-tresci | 1/8 | 13 % | не норма |
| faq | 2/8 | 25 % | не норма |
| podobne | 2/8 | 25 % | не норма |
| tabela | 3/8 | 38 % | не норма |
| galeria | 4/8 | 50 % | на решение |
| wideo | 1/8 | 13 % | не норма |
| autor-data | 3/8 | 38 % | не норма |
| ocena | 6/8 | 75 % | обязателен |
| komentarze | 3/8 | 38 % | не норма |
| schema-org | 8/8 | 100 % | обязателен |

## Dokumenty klastra do sprawdzania faktów (8, hostów 8)

*Lista adresów, nie treści. Fakt do druku musi być potwierdzony w jednym z nich
albo w materiale wydawcy; niepotwierdzony — przeformułować do potwierdzalnego
albo usunąć (П42). Pliki: `input/corpus/<file>` (gzip).*

- www.gry-online.pl — https://www.gry-online.pl/gry/assassins-creed-bloodlines/zf2517
- en.wikipedia.org — https://en.wikipedia.org/wiki/Assassin%27s_Creed:_Bloodlines
- www.olx.pl — https://www.olx.pl/elektronika/gry-konsole/q-assassin-creed-psp/
- www.ppe.pl — https://www.ppe.pl/gry/Assassin-039-s-Creed-Bloodlines/197
- archive.org — https://archive.org/details/assassins-creed-bloodlines-usa-en-fr-de-es-it
- www.krakow.gameover.pl — https://www.krakow.gameover.pl/sklep/index.php?p3200
- www.svetiphonu.cz — https://www.svetiphonu.cz/pl/assassin--s-creed--bloodlines-na-psp/
- www.romsgames.net — https://www.romsgames.net/playstation-portable-rom-assassins-creed-bloodlines/

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
