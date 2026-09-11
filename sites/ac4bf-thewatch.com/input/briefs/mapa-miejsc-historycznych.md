# Bryf: `/mapa-miejsc-historycznych/`

*Złożony maszyną `tools/brief-strony.mjs` ze struktury, anatomii S3 i manifestu
korpusu. Bez jednej frazy konkurenta — reguła korpusu (backlog, punkt 1).*

## Umowa (structure.json — nie zmieniać, wypełniać)

| Pole | Wartość |
|---|---|
| typ | `map` |
| h1 | Mapa miejsc i postaci historycznych w Assassin’s Creed |
| title | Gdzie naprawdę leżą miejsca z gier Assassin’s Creed |
| description | Notre Dame, Big Ben, Stonehenge, Luksor, Sparta: prawdziwe miejsca, po których chodzi się w grach serii, i postacie, które naprawdę istniały. |
| rodzic | `/` |
| klaster | — · zapytań 45 · popyt 510 |
| art (slot `mapa-miejsc-historycznych`) | zdjęcie Commons (src/assets/foto) |

**Klucze** (45): stonehenge valhalla · argolida assassins creed odyssey · assassins creed odyssey pitagoras · assassins creed unity nostradamus · brazydas odyssey · alfred assassins creed valhalla · assassin creed valhalla ragnar · assassin creed valhalla ragnar lothbrok · assassins creed da vinci · assassins creed odyssey archidamos · assassins creed odyssey brazydas · assassins creed odyssey elis · assassins creed odyssey sparta · assassins creed olympia · assassins creed origins dolina królów · assassins creed origins luxor · assassins creed piri reis · assassins creed sparta · assassins creed valhalla alfred · assassins creed valhalla burgred · assassins creed valhalla cynewulf · assassins creed valhalla derby · assassins creed valhalla harald · assassins creed valhalla ivar · assassins creed valhalla ivarr · assassins creed valhalla winchester · brasidas assassins creed odyssey · burgred assassins creed valhalla · cynewulf assassins creed valhalla · elis assassins creed odyssey · fokida assassins creed · hornigold assassins creed · housesteads valhalla · ivar assassins creed valhalla · jacques de molay assassins creed · kitt assassins creed valhalla · ludovico ariosto assassins creed · marco polo assassins creed · notre dame ubisoft · odyssey atlantis · piri reis assassins creed · pitagoras assassins creed odyssey · ragnar assassins creed valhalla · sokrates assassins creed odyssey · valhalla ragnar lothbrok

**Related** (`link-list` drukuje je ze struktury):
- `/assassins-creed-unity/` — Assassin’s Creed Unity i rewolucja francuska
- `/assassins-creed-syndicate/` — Assassin’s Creed Syndicate: Londyn epoki przemysłowej
- `/assassins-creed-origins/` — Assassin’s Creed Origins: Bayek i Egipt sprzed naszej ery
- `/assassins-creed-odyssey/` — Assassin’s Creed Odyssey: antyczna Grecja w wersji RPG
- `/assassins-creed-valhalla/` — Wikińska Anglia w Assassin’s Creed Valhalla: od czego zacząć

**blocks[]** — kolejność i zestaw sekcji; każdy blok wymaga pola w pliku treści:
- `hero-key-art` — type-default, low
- `byline` — anatomy, high, evidence 43/46
- `story-row` — type-default, low
- `link-list` — type-default, low

## Plan treści (anatomia S3, korpus klastra)

- dokumentów 46 z 19 hostów, koszyk **—**
- **korytarz znaków bez spacji (umowa, pole `corridor`): 2120–2868** — z anatomii: 2120–2868, mediana 2494
- nagłówków: h2 mediana 1, h3 mediana 0

| Temat (nasz słownik) | dokumentów | udział | werdykt |
|---|---:|---:|---|
| wersje | 6/46 | 13 % | редкая |
| opinie | 2/46 | 4 % | редкая |
| fabula | 1/46 | 2 % | гэп |
| rozgrywka | 1/46 | 2 % | гэп |
| wymagania | 1/46 | 2 % | гэп |
| opis | 1/46 | 2 % | гэп |
| swiat | 1/46 | 2 % | гэп |
| zrodla | 1/46 | 2 % | гэп |

| Element strony | dokumentów | udział | werdykt |
|---|---:|---:|---|
| breadcrumbs | 39/46 | 85 % | обязателен |
| spis-tresci | 15/46 | 33 % | не норма |
| faq | 5/46 | 11 % | не норма |
| podobne | 16/46 | 35 % | не норма |
| tabela | 1/46 | 2 % | не норма |
| galeria | 17/46 | 37 % | не норма |
| wideo | 19/46 | 41 % | на решение |
| autor-data | 43/46 | 93 % | обязателен |
| ocena | 17/46 | 37 % | не норма |
| komentarze | 24/46 | 52 % | на решение |
| schema-org | 31/46 | 67 % | на решение |

## Dokumenty klastra do sprawdzania faktów (161, hostów 49)

*Lista adresów, nie treści. Fakt do druku musi być potwierdzony w jednym z nich
albo w materiale wydawcy; niepotwierdzony — przeformułować do potwierdzalnego
albo usunąć (П42). Pliki: `input/corpus/<file>` (gzip).*

- pl.wikipedia.org — https://pl.wikipedia.org/wiki/Assassin%E2%80%99s_Creed_Valhalla
- pl.wikipedia.org — https://pl.wikipedia.org/wiki/Piri_Reis
- pl.wikipedia.org — https://pl.wikipedia.org/wiki/Benjamin_Hornigold
- pl.wikipedia.org — https://pl.wikipedia.org/wiki/Jacques_de_Molay
- pl.wikipedia.org — https://pl.wikipedia.org/wiki/Marco_Polo
- pl.wikipedia.org — https://pl.wikipedia.org/wiki/Ludovico_Ariosto
- pl.wikipedia.org — https://pl.wikipedia.org/wiki/Argolida
- www.filmweb.pl — https://www.filmweb.pl/person/Ludovico+Ariosto-1275272
- www.gry-online.pl — https://www.gry-online.pl/poradniki/assassins-creed-valhalla/rog-ragnara/ze1ac63
- www.filmweb.pl — https://www.filmweb.pl/videogame/Assassin%27s+Creed%3A+Brotherhood+The+Da+Vinci+Disappearance-2011-729141
- www.gry-online.pl — https://www.gry-online.pl/poradniki/assassins-creed-valhalla/spadajace-gwiazdy/zb1abcd
- www.gry-online.pl — https://www.gry-online.pl/poradniki/assassins-creed-odyssey/kiedy-wybieramy-strone-w-konflikcie-sparty-i-aten/z5180c9
- store.steampowered.com — https://store.steampowered.com/app/937892/Assassins_CreedR_Odyssey__The_Fate_of_Atlantis/?l=polish&snr=1_5_9__405
- www.gry-online.pl — https://www.gry-online.pl/poradniki/assassins-creed-valhalla/zabojca-krolow-wazne-wybory/z61a8c9
- www.youtube.com — https://www.youtube.com/watch?v=5EXM3jTASmg
- www.gry-online.pl — https://www.gry-online.pl/poradniki/assassins-creed-revelations-pc-kompletny-poradnik-do-gry/misje-piri-reisa-bielun-gwozdzie-wabik-dymny/zebc27
- store.steampowered.com — https://store.steampowered.com/app/662351/Assassins_Creed_Origins__The_Curse_Of_The_Pharaohs/?l=polish&curator_clanid=1563722
- www.youtube.com — https://www.youtube.com/watch?v=ARkGIf-vACw
- www.gry-online.pl — https://www.gry-online.pl/poradniki/assassins-creed-valhalla/wielki-mistrz-zakonu-ojciec-spojler/z41a7ef
- www.youtube.com — https://www.youtube.com/watch?v=FOEIq1XdW04
- www.youtube.com — https://www.youtube.com/watch?v=Xi1dXtCOxpA
- www.youtube.com — https://www.youtube.com/watch?v=wA74lxcoitE
- www.gry-online.pl — https://www.gry-online.pl/poradniki/assassins-creed-valhalla/przechylenie-szali/z41a765
- www.youtube.com — https://www.youtube.com/watch?v=Zu7RCiirrCM
- www.youtube.com — https://www.youtube.com/watch?v=atCtvB1hwUs
- www.ubisoft.com — https://www.ubisoft.com/pl-pl/help/article/000064742
- www.gry-online.pl — https://www.gry-online.pl/poradniki/assassins-creed-valhalla/ciezar-wladzyheavy-is-the-head-solucja/z31a764
- www.gry-online.pl — https://www.gry-online.pl/poradniki/assassins-creed-valhalla/szeryf-z-wincestre/z31a9dd
- www.gry-online.pl — https://www.gry-online.pl/poradniki/assassins-creed-valhalla/prawo-urodzenia/z51a6f7
- www.gry-online.pl — https://www.gry-online.pl/poradniki/assassins-creed-odyssey/proces-sokratesa/z0193ba
- www.gry-online.pl — https://www.gry-online.pl/newsroom/stonehenge-i-rzymskie-pozostalosci-w-ac-valhalla/z11dc45
- www.ubisoft.com — https://www.ubisoft.com/en-gb/entertainment/parks-experiences/escape-games/save-notre-dame-on-fire
- www.gry-online.pl — https://www.gry-online.pl/poradniki/assassins-creed-odyssey/fokida/z318046
- www.youtube.com — https://www.youtube.com/watch?v=-etuU5wKf5w
- www.gry-online.pl — https://www.gry-online.pl/gry/assassins-creed-odyssey-the-fate-of-atlantis/zf5505
- www.gry-online.pl — https://www.gry-online.pl/poradniki/assassins-creed-unity/prolog/zd120f4
- www.ubisoft.com — https://www.ubisoft.com/pl-pl/help/assassins-creed-origins/gameplay/article/accessing-the-curse-of-the-pharaohs-in-assassin-s-creed-origins/000065560
- www.youtube.com — https://www.youtube.com/watch?v=Xqea4BcqFdw
- www.youtube.com — https://www.youtube.com/watch?v=Boyp2pqRjF0
- www.gry-online.pl — https://www.gry-online.pl/gry/assassins-creed-brotherhood-the-da-vinci-disappearance/z615
- www.youtube.com — https://www.youtube.com/watch?v=M0gVnCqE4xM
- www.youtube.com — https://www.youtube.com/watch?v=UMK4G_er-AQ
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-odyssey-zabijac-czy-nie-zabijac-sedzia-przysiegli-i-kat
- www.gry-online.pl — https://www.gry-online.pl/poradniki/assassins-creed-origins/krol-krolow/z91756f
- www.gry-online.pl — https://www.gry-online.pl/poradniki/assassins-creed-odyssey/czy-wystartowac-w-igrzyskach/zd18040
- www.gry-online.pl — https://www.gry-online.pl/poradniki/assassins-creed-unity/zagadki-nostradamusa/z81231a
- www.youtube.com — https://www.youtube.com/watch?v=0POpYU5fJpM
- www.youtube.com — https://www.youtube.com/watch?v=WLFOD-cal70
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-odyssey-ateny-czy-sparta-z-ktora-frakcja-sie-sprzymierzyc
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-odyssey-krolowie-sparty
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-odyssey-elis-misje-poboczne
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-odyssey-ostrakony-elis
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-valhalla-zabojca-krolow-szturm-na-zamek-caustow-ivarr
- en.wikipedia.org — https://en.wikipedia.org/wiki/Benjamin_Hornigold
- en.wikipedia.org — https://en.wikipedia.org/wiki/Ludovico_Ariosto
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-valhalla-ciezar-wladzy-leofrith-zabic-czy-oszczedzic
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-valhalla-kryjowka-burgreda-krypta-jak-wejsc
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-valhalla-szeryf-z-wincestre-uratuj-goodwina
- www.youtube.com — https://www.youtube.com/watch?v=7JnA4M-9Xoo
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-valhalla-wyposazenie-wincestre-anglia
- www.youtube.com — https://www.youtube.com/watch?v=jrqDqZzsMJA
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-valhalla-prawo-urodzenia-dotarcie-do-alrekstad
- www.youtube.com — https://www.youtube.com/watch?v=-JIjxdPDuOU
- www.youtube.com — https://www.youtube.com/watch?v=Kk9BWDnppaA
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-odyssey-odkrywajc-prawde-rycerze
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-valhalla-stojace-glazy-hamtunscire-anglia
- store.playstation.com — https://store.playstation.com/pl-pl/product/EP0001-CUSA09303_00-EXPANSIONBUNDLE2
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-odyssey-fokida-mapa
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-odyssey-fokida-misje-poboczne
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-odyssey-ostrakony-fokida
- store.playstation.com — https://store.playstation.com/pl-pl/product/EP0001-CUSA05625_00-DLCEXPENSIONS002
- www.youtube.com — https://www.youtube.com/watch?v=c3y84BM9KHA
- www.youtube.com — https://www.youtube.com/watch?v=olRR4GUPI0U
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-odyssey-ostrakony-argolida
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-origins-sekrety-i-znajdzki
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-origins-z-nowym-zadaniem-i-regionem-w-aktualizacji
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-unity-zagadki-nostradamusa
- www.eurogamer.pl — https://www.eurogamer.pl/assassins-creed-unity-zagadki-nostradamusa?page=2
- www.youtube.com — https://www.youtube.com/watch?v=FfzFS1EcSXg
- www.ppe.pl — https://www.ppe.pl/poradniki/209747/assassins-creed-valhalla-zakon-starozytnych--lokalizacja-czlonkow-zakonu.html
- www.youtube.com — https://www.youtube.com/watch?v=Ss2ptWi5QGc
- www.youtube.com — https://www.youtube.com/watch?v=y3D74Vdz6EQ
- www.ppe.pl — https://www.ppe.pl/poradniki/209747/assassins-creed-valhalla--zabojca-krolow.html
- www.youtube.com — https://www.youtube.com/watch?v=1lo7TFANjF0
- www.youtube.com — https://www.youtube.com/watch?v=1NNEU6bbMB8
- www.ppe.pl — https://www.ppe.pl/poradniki/395705/assassins-creed-black-flag-resynced-mord-i-rzez-benjamin-hornigold.html
- www.youtube.com — https://www.youtube.com/watch?v=RD0Ptyy7y7Q
- www.youtube.com — https://www.youtube.com/watch?v=YVSZbqW5K7w
- www.youtube.com — https://www.youtube.com/watch?v=ypet5CAH18o
- www.purepc.pl — https://www.purepc.pl/assassin-s-creed-origins-szczegoly-dotyczace-drugiego-dlc
- www.youtube.com — https://www.youtube.com/watch?v=MW1cn5yZ5fU
- www.youtube.com — https://www.youtube.com/watch?v=AKCEZokcfFg
- www.youtube.com — https://www.youtube.com/watch?v=2XkLuAwa81E
- www.youtube.com — https://www.youtube.com/watch?v=IXyoozGwNxA
- steamcommunity.com — https://steamcommunity.com/app/812140/discussions/0/1638661595042542094/
- ustatkowanygracz.pl — https://ustatkowanygracz.pl/w-assassins-creed-valhalla-bedziesz-mogl-zwiedzic-zabytkowe-stonehenge/
- steamcommunity.com — https://steamcommunity.com/app/201870/discussions/0/2284960483106873124/
- store.ubisoft.com — https://store.ubisoft.com/eu/assassin-s-creed-odyssey---the-fate-of-atlantis/5cae4a0b0c8ee4932c287a11.html?lang=pl-PL
- steamcommunity.com — https://steamcommunity.com/sharedfiles/filedetails/?l=indonesian&id=2898782546
- steamcommunity.com — https://steamcommunity.com/sharedfiles/filedetails/?id=1435150985
- www.youtube.com — https://www.youtube.com/watch?v=05clhqNpnrw
- www.youtube.com — https://www.youtube.com/watch?v=HUu8HqLIHAY
- www.youtube.com — https://www.youtube.com/watch?v=NNkrdmcVADQ
- www.youtube.com — https://www.youtube.com/watch?v=Ugstv_k-6oA
- www.youtube.com — https://www.youtube.com/watch?v=VAQYwZ9OeGk
- www.komputerswiat.pl — https://www.komputerswiat.pl/gaming/gry/ubisoft-udostepnia-wirtualna-wycieczke-po-notre-dame-pomoglo-assassins-creed/1j61388
- news.ubisoft.com — https://news.ubisoft.com/en-us/article/2Hh4JLkJ1GJIMEg0lk3Lfy/supporting-notredame-de-paris
- www.ign.com — https://www.ign.com/wikis/assassins-creed-valhalla/The_Lost_Drengir_of_Ragnar_Lothbrok
- gamerant.com — https://gamerant.com/assassins-creed-valhalla-ragnar-lothbrok-grave-location/
- www.ign.com — https://www.ign.com/wikis/assassins-creed-valhalla/Failing_Stars
- www.ign.com — https://www.ign.com/wikis/assassins-creed-valhalla/King_Killer
- www.ign.com — https://www.ign.com/wikis/assassins-creed-revelations/Piri_Reis
- www.ign.com — https://www.ign.com/wikis/assassins-creed-valhalla/Tilting_the_Balance
- www.republicworld.com — https://www.republicworld.com/tech/gaming/ac-valhalla-cynewulf-location-know-the-locations-of-kitt-ysane-and-cynewulf
- www.rockpapershotgun.com — https://www.rockpapershotgun.com/assassins-creed-valhalla-musicians-where-to-find-ysane-cynewulf-and-kitt-in-lunden
- www.rockpapershotgun.com — https://www.rockpapershotgun.com/assassins-creed-odyssey-olympics-how-to-complete-the-side-quests
- www.ign.com — https://www.ign.com/wikis/assassins-creed-valhalla/Wincestre
- mapgenie.io — https://mapgenie.io/assassins-creed-unity/guides/nostradamus-enigmas
- www.ign.com — https://www.ign.com/wikis/assassins-creed-odyssey/Unearthing_the_Truth
- www.sortiraparis.com — https://www.sortiraparis.com/pl/zainteresowania/hazard/articles/322372-notre-dame-de-paris-jak-ubisoft-pomogl-odbudowac-miasto-dzieki-assassin-s-creed-unity
- www.ign.com — https://www.ign.com/wikis/assassins-creed-valhalla/Stonehenge_-_Hamtunscire_Standing_Stones_Location_and_Solution
- www.ign.com — https://www.ign.com/wikis/assassins-creed-valhalla/Lagertha%27s_Axe
- www.cda.pl — https://www.cda.pl/video/38445794c
- www.ign.com — https://www.ign.com/games/assassins-creed-odyssey-the-fate-of-atlantis
- www.cda.pl — https://www.cda.pl/video/798712119/vfilm
- assassinscreedvalhalla.wiki.fextralife.com — https://assassinscreedvalhalla.wiki.fextralife.com/Burgred
- assassinscreedvalhalla.wiki.fextralife.com — https://assassinscreedvalhalla.wiki.fextralife.com/Harald
- www.ign.com — https://www.ign.com/wikis/assassins-creed-5-unity/Nostradamus_Enigmas
- www.gamepressure.com — https://www.gamepressure.com/assassins-creed-odyssey/elis/zcbb17
- www.pcgamer.com — https://www.pcgamer.com/deny-or-send-ivarr-ac-valhalla-king-killer-ubba/
- www.pcgamer.com — https://www.pcgamer.com/assassins-creed-ac-valhalla-tilting-the-balance-location/
- www.tiktok.com — https://www.tiktok.com/@amal.games/video/7344316411495451936
- www.eurogamer.net — https://www.eurogamer.net/assassins-creed-valhalla-kill-or-spare-leofrith-killing-sparing-heavy-is-the-head-7052
- lubimyczytac.pl — https://lubimyczytac.pl/autor/45922/ludovico-ariosto
- vandal.elespanol.com — https://vandal.elespanol.com/guias/guia-assassins-creed-unity/enigmas-de-nostradamus
- www.postavy.cz — https://www.postavy.cz/benjamin-hornigold/
- game8.co — https://game8.co/games/Assassins-Creed-Valhalla/archives/314989
- www.derbytelegraph.co.uk — https://www.derbytelegraph.co.uk/news/derby-news/gallery/explore-derbyshire-youve-never-seen-6909521
- www.gamerguides.com — https://www.gamerguides.com/assassins-creed-valhalla/guide/the-order-of-the-ancients/wardens-of-law/reeve-derby-the-vice
- www.gamerguides.com — https://www.gamerguides.com/assassins-creed-valhalla/guide/choices/rude-awakening-choices/what-to-say-to-king-harald
- www.gamerguides.com — https://www.gamerguides.com/assassins-creed-valhalla/guide/mysteries/hamtunscire/stonehenge
- www.deviantart.com — https://www.deviantart.com/agenger-one/art/Assassin-s-Creed-Hall-of-Fame-Marco-Polo-1220486271
- www.polygon.com — https://www.polygon.com/assassins-creed-valhalla-guide/22185403/wincestre-map-locations-wealth-mysteries-artifacts/
- www.thegamer.com — https://www.thegamer.com/assassins-creed-valhalla-wincestre-the-city-of-faith-guide/
- www.thegamer.com — https://www.thegamer.com/assassins-creed-unity-nostradamus-enigma-riddle-solutions-locations/
- www.amazon.pl — https://www.amazon.pl/Benjamin-Hornigold-Assassins-Action-Figure/dp/B00CS9NHQ0
- camzillasmom.com — https://camzillasmom.com/ac-valhalla-eurvicscire-wealth-collectibles-locations-guide/
- outsidergaming.com — https://outsidergaming.com/assassins-creed-valhalla-how-to-get-lagerthas-axe-at-housesteads/
- thetemplarknight.com — https://thetemplarknight.com/2012/03/18/jacques-molay-assassins-creed/
- www.smithsonianmag.com — https://www.smithsonianmag.com/history/the-medieval-sect-that-inspired-the-video-game-assassins-creed-180983032/
- pl.wikiquote.org — https://pl.wikiquote.org/wiki/Ludovico_Ariosto
- techlove.pl — https://techlove.pl/blog/2024/12/12/ubisoft-swietuje-odbudowe-notre-dame-publikujac-reklame-assassins-creed-unity/
- zagraceni.pl — http://zagraceni.pl/davinci
- polter.pl — https://polter.pl/konsole/Assassin-s-Creed-Origins-The-Curse-of-the-Pharaohs-c30302
- www.pcgameshardware.de — https://www.pcgameshardware.de/Assassins-Creed-Brands-279368/News/Olympia-Paris-2024-Eroeffnungsfeier-1452512/
- www.youtube.com — https://www.youtube.com/watch?v=P_-KW1yHHnk
- www.youtube.com — https://www.youtube.com/watch?v=nhOw-tKVTLU
- www.gosunoob.com — https://www.gosunoob.com/assassins-creed-odyssey/pausanias-archidamos-which-king-accuse-bloody-feast-quest/
- ebd.cda.pl — https://ebd.cda.pl/620x368/82503083f
- www.youtube.com — https://www.youtube.com/watch?v=H98YCF2SM2s
- www.youtube.com — https://www.youtube.com/playlist?list=PLCKfwQ4ypB3shPmeB0Xs5v1cWG1ZPYNAH

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
