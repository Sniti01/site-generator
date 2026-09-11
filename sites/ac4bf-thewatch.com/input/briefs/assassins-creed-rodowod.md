# Bryf: `/assassins-creed-rodowod/`

*Złożony maszyną `tools/brief-strony.mjs` ze struktury, anatomii S3 i manifestu
korpusu. Bez jednej frazy konkurenta — reguła korpusu (backlog, punkt 1).*

## Umowa (structure.json — nie zmieniać, wypełniać)

| Pole | Wartość |
|---|---|
| typ | `topic` |
| h1 | Rodowód, czyli film o ojcu Ezia z Assassin’s Creed II |
| title | Assassin’s Creed: Rodowód — prequel w wersji aktorskiej |
| description | Rodowód to krótkometrażowy film aktorski z 2009 roku o Giovannim Auditore. Tłumaczymy, jak wiąże się z fabułą Assassin’s Creed II i czy warto go obejrzeć. |
| rodzic | `/` |
| klaster | assassins lineage · zapytań 4 · popyt 160 |
| art (slot `assassins-creed-rodowod`) | nie dotyczy — strona bez hero-key-art |

**Klucze** (4): assassins creed rodowód · assassins creed filmy · assassins creed lineage ps4 · assassins lineage

**Related** (`link-list` drukuje je ze struktury):
- `/ezio-auditore/` — Ezio Auditore — postać, historia i miejsce w serii
- `/` — Cała seria Assassin’s Creed, część po części
- `/assassins-creed-2/` — Assassin’s Creed 2 — druga część serii i debiut Ezia

**blocks[]** — kolejność i zestaw sekcji; każdy blok wymaga pola w pliku treści:
- `story-row` — type-default, low
- `link-list` — manual, high
- `cta-band` — type-default, low

## Plan treści (anatomia S3, korpus klastra)

- dokumentów 3 z 3 hostów, koszyk **low**
- **korytarz znaków bez spacji (umowa, pole `corridor`): 3900–5276** — z anatomii: 3900–5276, mediana 4588, orientacyjna — własnych dokumentów mniej niż cztery
- nagłówków: h2 mediana 1, h3 mediana 8

| Temat (nasz słownik) | dokumentów | udział | werdykt |
|---|---:|---:|---|
| fabula | 1/3 | 33 % | не считается |
| obsada | 1/3 | 33 % | не считается |
| zrodla | 1/3 | 33 % | не считается |
| swiat | 1/3 | 33 % | не считается |
| postacie | 1/3 | 33 % | не считается |
| wersje | 1/3 | 33 % | не считается |

| Element strony | dokumentów | udział | werdykt |
|---|---:|---:|---|
| breadcrumbs | 1/3 | 33 % | не считается |
| spis-tresci | 2/3 | 67 % | не считается |
| faq | 1/3 | 33 % | не считается |
| podobne | 2/3 | 67 % | не считается |
| tabela | 1/3 | 33 % | не считается |
| galeria | 1/3 | 33 % | не считается |
| wideo | 0/3 | 0 % | не считается |
| autor-data | 3/3 | 100 % | не считается |
| ocena | 2/3 | 67 % | не считается |
| komentarze | 2/3 | 67 % | не считается |
| schema-org | 2/3 | 67 % | не считается |

## Dokumenty klastra do sprawdzania faktów (17, hostów 11)

*Lista adresów, nie treści. Fakt do druku musi być potwierdzony w jednym z nich
albo w materiale wydawcy; niepotwierdzony — przeformułować do potwierdzalnego
albo usunąć (П42). Pliki: `input/corpus/<file>` (gzip).*

- pl.wikipedia.org — https://pl.wikipedia.org/wiki/Assassin%E2%80%99s_Creed_(seria)
- www.gry-online.pl — https://www.gry-online.pl/gry/seria-assassins-creed/zf7dd
- www.filmweb.pl — https://www.filmweb.pl/film/Assassin%27s+Creed-2016-659803
- pl.wikipedia.org — https://pl.wikipedia.org/wiki/Assassin%E2%80%99s_Creed_(film)
- pl.wikipedia.org — https://pl.wikipedia.org/wiki/Assassin%E2%80%99s_Creed:_Rodow%C3%B3d
- www.filmweb.pl — https://www.filmweb.pl/world/Assassin%27s+Creed-27
- www.filmweb.pl — https://www.filmweb.pl/serial/Assassin%27s+Creed%3A+Rodow%C3%B3d-2009-545516
- www.filmweb.pl — https://www.filmweb.pl/film/Assassin%27s+Creed-2016-659803/descs
- www.gry-online.pl — https://www.gry-online.pl/opinie/przewodnik-po-uniwersum-assassins-creed/rok-1476-assassins-creed-lineage/za22f
- www.ultima.pl — https://www.ultima.pl/ct/playstation-4/gry/akcja/assassins-creed-the-ezio-collection
- store.playstation.com — https://store.playstation.com/pl-pl/concept/225519
- www.purepc.pl — https://www.purepc.pl/assassin-s-creed-the-ezio-collection-w-drodze-na-ps4-i-xone
- grymel.pl — https://grymel.pl/5306-gra-playstation-4-assassin-s-creed-the-ezio-collection.html
- pl.ign.com — https://pl.ign.com/assassins-creed-film
- upflix.pl — https://upflix.pl/film/zobacz/assassins-creed-2016
- www.damagier.pl — https://www.damagier.pl/popkultura/filmy/assassins-creed-5-rzeczy-ktore-polozyly-film/
- www.youtube.com — https://www.youtube.com/watch?v=esg9aLODDjQ

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
