# Bryf: `/assassins-creed-za-darmo/`

*Złożony maszyną `tools/brief-strony.mjs` ze struktury, anatomii S3 i manifestu
korpusu. Bez jednej frazy konkurenta — reguła korpusu (backlog, punkt 1).*

## Umowa (structure.json — nie zmieniać, wypełniać)

| Pole | Wartość |
|---|---|
| typ | `topic` |
| h1 | Jak zagrać w Assassin’s Creed za darmo i legalnie |
| title | Assassin’s Creed za darmo — legalne sposoby i pułapki |
| description | Kiedy w Assassin’s Creed można zagrać za darmo legalnie: rozdania Ubisoftu, darmowe weekendy i abonamenty. Wyjaśniamy, dlaczego lepiej omijać pirackie kopie. |
| rodzic | `/` |
| klaster | assassin creed za darmo · zapytań 4 · popyt 120 |
| art (slot `assassins-creed-za-darmo`) | nie dotyczy — strona bez hero-key-art |

**Klucze** (4): assassin creed za darmo · assassins creed za darmo · assassin za darmo · assassins creed za darmo 2022

**Related** (`link-list` drukuje je ze struktury):
- `/poradniki/` — Który Assassin’s Creed jest najlepszy
- `/` — Cała seria Assassin’s Creed, część po części
- `/assassins-creed-mirage/` — Assassin’s Creed Mirage: Basim, Bagdad i kameralna skala

**blocks[]** — kolejność i zestaw sekcji; każdy blok wymaga pola w pliku treści:
- `byline` — anatomy, medium, evidence 4/6
- `story-row` — type-default, low
- `link-list` — manual, high
- `cta-band` — type-default, low

## Plan treści (anatomia S3, korpus klastra)

- dokumentów 6 z 6 hostów, koszyk **high**
- **korytarz znaków bez spacji: 474–642** (mediana 558)
- nagłówków: h2 mediana 0, h3 mediana 0

| Temat (nasz słownik) | dokumentów | udział | werdykt |
|---|---:|---:|---|
| opinie | 1/6 | 17 % | гэп |
| swiat | 1/6 | 17 % | гэп |
| cena | 1/6 | 17 % | гэп |

| Element strony | dokumentów | udział | werdykt |
|---|---:|---:|---|
| breadcrumbs | 3/6 | 50 % | на решение |
| spis-tresci | 1/6 | 17 % | не норма |
| faq | 2/6 | 33 % | не норма |
| podobne | 1/6 | 17 % | не норма |
| tabela | 0/6 | 0 % | не норма |
| galeria | 1/6 | 17 % | не норма |
| wideo | 0/6 | 0 % | не норма |
| autor-data | 4/6 | 67 % | на решение |
| ocena | 1/6 | 17 % | не норма |
| komentarze | 4/6 | 67 % | на решение |
| schema-org | 4/6 | 67 % | на решение |

## Dokumenty klastra do sprawdzania faktów (7, hostów 7)

*Lista adresów, nie treści. Fakt do druku musi być potwierdzony w jednym z nich
albo w materiale wydawcy; niepotwierdzony — przeformułować do potwierdzalnego
albo usunąć (П42). Pliki: `input/corpus/<file>` (gzip).*

- www.ubisoft.com — https://www.ubisoft.com/pl-pl/game/assassins-creed/free-weekend
- lowcygier.pl — https://lowcygier.pl/darmowe/assassins-creed-mirage-na-pc-za-darmo-od-intela-wystarczy-zapisac-sie-do-newslettera/
- spidersweb.pl — https://spidersweb.pl/2025/08/assassins-creed-mirage-game-pass-xbox-pc.html
- www.gram.pl — https://www.gram.pl/news/ubisoft-rozdaje-dostep-do-swojej-uslugi-zagracie-za-darmo-w-assassins-creed-shadows-i-wiecej
- planetagracza.pl — https://planetagracza.pl/gry-za-darmo-assassins-creed-mirage/
- apps.microsoft.com — https://apps.microsoft.com/detail/9nn1m88hl5m6?hl=pl-PL&gl=PL
- fanboy.pl — https://fanboy.pl/assasins-creed-black-flag-za-darmo/

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
