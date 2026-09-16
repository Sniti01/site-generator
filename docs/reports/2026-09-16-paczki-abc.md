# 2026-09-16 · Сессия 3 «кадры рядам» — пачки A, B, C: 88 рядов на 26 страницах с кадром, герои четырёх страниц, судьи не тронуты (три контрольные съёмки, kB повторена — `exit=0`)

Ветка `phase-4`, вершина на старте — `81ecfa0` (доклад сессии 2), `main` =
`254574d`, дерево чистое; прошлая сессия завершилась штатно (доклад,
`/review`, приёмка события по таблице — механическая). Команда владельца:
«сессия 3 „пачки A, B, C" по разделу 10 плана и бэклогу 48 — старт командой владельца».
Объём — **сессия 3 по разделу 10 плана** `2026-09-15-plan-kadry-ryadam.md`
(П57 «Следствия», П58 «Следствия», бэклог 48): пачки A (11 страниц),
B (7), C (8) по коммиту на страницу; две замены (Brotherhood `co-jest-w-grze`,
Eivor `kim-jest`); герои Eivor, Rodowód, II wojna, od-czego-zaczac с лидами
по П42; кадр единственному ряду za-darmo; после каждой пачки — гейты
и контрольная съёмка 26 кадров судей с `check`; доклад пачек с таблицей
«ряд → кадр → почему». Правок вида на судьях (главная, Black Flag) — ноль
по построению (П57 п. 1 б); объём не расширялся; найденное вне объёма —
строками (бэклог 50).

---

## Первой строкой, как велит П33

**`npm run accept` — `225/225`, `exit=0`.** **`npm run gates` — `4/4`,
`exit=0`.** `npm run build` (`4f34e1f`) — `exit=0`, 32 страницы, 2,8 с
(кэш `webp` тёплый; сборка с новыми `webp` пачки — до 9 с); сторожа:
`h1: 32`, `kotwice: 32`, `linki: 979/32` (975 → 979: по кнопке героя
у четырёх страниц), `korytarz: 28 + 4 null`, **`art: 52/150/29`** (было
52/62/25: рядов с кадром 62 → 150, героев 25 → 29). **Пиксельная приёмка
судей против `_baseline/` действует всю сессию:** контрольные съёмки после
пачек A, B и C — игра 15/15 и главная 11/11, **геометрия совпала, `exit=0`**;
по 0 различий — все кадры kA и kC, у kB главная — 10 по нулю и полный 390
в допуске зон (зерно), игра — `exit=1` по зерну героя на полном 390,
повторный прогон kB2 побайтово равен эталону (раздел 5, `kontrola/hashe.txt`). `astro check` не запускался (код сайта не менялся, кроме
`fetch-game-art.mjs` — не TypeScript).

## Сверка открытых вопросов прошлого доклада — по П38

| Вопрос доклада сессии 2 | Исход | Где |
|---|---|---|
| 1. Приёмка события по таблице (механическая) | без возражений владельца — событие закрыто, эталон `8d9ba13` действует | эта сессия строилась на нём |
| 2. Сессия 3 — пачки A, B, C по команде | **команда получена — исполнено** | этот доклад |
| 3. Выкладка — по П58 п. 1 после сессии 3, кнопкой владельца | **пора:** всё, что план относил к «когда всё готово», сделано | «Политические» п. 1 |
| 4. Переносятся (тип 404, `noindex`, П53 п. 1–3, лист второго сайта, `/404/` глазами, сайт раньше ящика, бэклог 47 п. 9, бэклог 49) | переносятся дальше | «Политические» п. 6 |

---

# 1. Счёт сессии

| Что | Число |
|---|---|
| Коммитов в `phase-4` (`2b8ede5 … 4f34e1f`) | 29 + доклад: конвейеры 3 (A Steam+Commons, B+C Commons, B+C Steam), страницы 26 (11 + 7 + 8) |
| Ряды с кадром (гейт `art`, включая пять слоёв главной) | 62 → **150** (+88 рядов содержания; замен 2) |
| Ряды без кадра после сессии | 24: `/prywatnosc/` 8 и `/404/` 1 по П57 п. 3, **15 столбцов по причине** (раздел 4) |
| Герои | 25 → **29** (Eivor, Rodowód, II wojna, od-czego-zaczac) |
| Кадры Steam (`src/assets/gry/*-kNN.jpg`) | +64 файла, +16,3 МиБ (было 10 после 1б); всего записей `game-art.json` 93, игр 20 |
| Кадры Commons (`src/assets/foto/`) | +22 файла, +12,4 МБ (9 A + 12 B/C + `foto-signoria`); слотов `art.json` 10 → 32, атрибуций 32 |
| Репозиторий | `src/assets` 14,7 → 43,3 МиБ (+28,7; план считал ≈ +40 от 12,7 — П57 п. 5 принял); `dist/` 21 → 52 МБ, `webp` 570 |
| Подбор | каталог 156 кадров 19 слотов по полным кадрам; 3 линзы × (11 страниц + 6 единиц); судья на единицу; проверка каждого выбранного кадра свежим взглядом; 146 агентов (`dobor-sedzia.md`, `katalog-kadrow.json`) |
| Лиды героев | 4 × 3 линзы (ряды / корпус / польский), 12 агентов; 1 stop (год 872 у Eivor — снят) + 5 fix (повтор первого ряда у всех четырёх черновиков, у II wojna ещё двусмысленность) — первые фразы четырёх лидов переписаны |
| Контрольные съёмки | kA (`bc8ff83`), kB + kB2 (`d84e6c6`), kC (`4f34e1f`) — 26 кадров каждая, `check` против эталона `8d9ba13` |

**Раскладка против плана (раздел 4, «112 рядов»):** план считал 103 ряда
в пачках; получили 88 с кадром и 15 столбцов. Разница — не в спросе,
а в витрине: HUD, кровь, инфографика и промо-плашки съели запас у Shadows
(3 чистых из 9), Syndicate (2 из 13 + один спасённый из-под ложного флага),
Rogue (3 из 5), Liberation (3 из 7), Valhalla (3 из 5), Unity (3 из 6;
[4] — две белые строки пикселей в файле витрины); кадров современности
(Desmond, Abstergo) нет ни на одной витрине — ряды `desmond`/`watek`
получают либо кадр эпохи (od-czego, AC1, AC2), либо столбец (AC3).
Commons закрыл 22 слота (план ≈ 23).

# 2. Таблица «ряд → кадр → почему» — по страницам

Метод — как в 1б: каталог всех кадров игры по полным файлам (HUD, знак,
кровь, текст, положение сюжета, края), затем три подборщика тремя линзами
(сюжет ряда / ритм страницы / геометрия рамки 21:13), судья на страницу
с голосами, затем проверка каждого выбранного кадра свежим взглядом
с задачей «отвергнуть». Commons — по листам кандидатов глазами ведущего
(`input/kadry/commons/<slot>/`, вне git; `art.json` несёт `file`, `crop`,
`subject` — alt). Полный журнал — `2026-09-16-paczki-abc/dobor-sedzia.md`,
каталог — `katalog-kadrow.json`. **Решения ведущего вопреки судье или
проверке названы в колонке «почему»** и сведены ниже.

**Решения ведущего (исполнитель, отмена — за владельцем):**

1. **Зона среза для проверяющих пачки B была задана неверно** (12 % для
   16:9; верно — 4,5 %, 12 % — только у Liberation 2,12:1). Из 11 отказов
   проверки девять — «по краям»; шесть из них по ошибочной зоне (Valhalla
   [2], Dawn [2], Rogue [3], Freedom Cry [2], [5], India [7]) перечитаны
   по 4,5 % и приняты (alt Freedom Cry поправлены по проверке: «nad
   powalonym wrogiem», «z garłaczem»); три отвергнуты по верной зоне 4,5 %
   и **приняты ведущим вопреки проверке** — Valhalla [3] (наплечник/локоть
   у среза), **Rogue [2]** и **Liberation [4]** (второстепенные фигуры
   у среза). Оставшиеся два — Rogue [1] (контур цели — отказ подтверждён)
   и Dawn [1] (дефект файла — п. 2).
2. **Дефекты файлов витрины:** Unity [4] (две белые строки внизу —
   видны в рамке) — отказ, ряд столбцом; Dawn [1] (серый крайний столбец
   x = 0 — вне зоны cover) — принят; Rogue [1] (чёрный крайний столбец
   **и** контур захвата цели) — отказ.
3. **Valhalla [1]** — ряду `kim-jest` Eivor: кисть на топорище срезана
   краем самого мастера, судья отложил при 2–1 «за»; иного кандидата на
   замену keyart нет.
4. **Syndicate [5]** — флаг `games.json` «знак воды 0–5» на [5] не
   подтвердился (полный кадр, четыре угла) — `uwaga` поправлена, кадр
   взят на `fabula` вместо [8] (контур Eagle Vision).
5. **Brotherhood:** судья ставил [11] (осада Монтериджони) на `bractwo`,
   а `fabula` отдавал Commons; ведущий переставил — [11] на `fabula`
   («Monteriggioni pada» дословно), `bractwo` ← рисунок Леонардо (BM,
   «czołg» из текста), `wydania` ← фото Монтериджони. Commons у страницы 4,
   как предсказал бэклог 48.
6. **Rogue:** `co-to-za-gra` столбцом под героем, [4] — сюжетному
   `shay-cormac` (у судьи было наоборот); `watek-wspolczesny` +
   `wydania-i-wersje` — столбцы парой, `komu` ← Commons (Нью-Йорк ≈ 1760).
7. **Повторы кадров между страницами** (план разд. 2 п. 5 допускает) —
   шесть кадров Steam и один ключ Commons:
   Valhalla [0], [2] на Valhalla и Eivor; Mirage [0] — ряд `komu`
   страницы Mirage и герой od-czego-zaczac; BF [3], [4], [6] — на za-darmo,
   II wojna, Pirates; Commons `discovery` (Alhambra) — на Discovery
   (герой) и Rodowód (`inne-filmy-serii`). Внутри страниц повторов нет.
8. **Commons вместо гравюр с «грязным» полем автора:** гравюры Чёрной
   Бороды (Cole/Nicholls) несут в поле `Artist` Commons сноску-абзац,
   карта Zannoni — URL; подвал печатал бы их. Взяты kryptogram La Buse
   (автор — Levasseur) и карта Homann 1737.
9. **`foto-paryz-1940`** — единственный слот с мастером 800 px
   (Bundesarchiv, CC BY-SA 3.0 de): крупнее в свободных лицензиях
   не нашлось (проверено пятью запросами; NARA-фото «Frenchman weeps»
   отвергнуто — снято в Марселе 1941, а не в Париже 1940). Вопрос владельцу.
10. **Год переправы Eivor снят из лида:** ряды страницы Eivor держат 872
    («lata 872–878»), страница Valhalla и корпус (pl/en.wikipedia) — 873;
    расхождение двух страниц — строкой в бэклог, тексты не правились.


### Пачка A — Steam-страницы с запасом (11)

**/assassins-creed-1/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| fabula | `jerozolima-k03` | Altaïr krzyżuje miecze z krzyżowcami w wąskiej uliczce | Ряд о девяти целях и войне «po obu stronach, chrześcijańskiej i muzułmańskiej», последний в списке — Robert de Sablé, магистр тамплиеров из окружения Ричарда: … · 2 z 3 (trzeci — [6]) |
| rozgrywka | `jerozolima-k10` | Altaïr odchodzi w głąb zatłoczonej ulicy, plecami do nas | Голоса 1–1–1 ([6] / [10] / [3]); [3] ушёл в fabula. По сюжету оба оставшихся годятся, но [10] дословно повторяет тело ряда: «W spokojnym idzie w tłumie ... … · 1–1–1, decyzja sędziego |
| watek-wspolczesny | `jerozolima-k08` | Altaïr wisi na murze nad ulicą z łukami, w dole przechodnie | Кадров Десмонда и Abstergo в каталоге нет; ряд говорит, что Animus «czyta pamięć przodków», а wspomnienie «to zapis, a nie życie» — любой кадр Altaïra и есть то, что видит Десмонд. … · 2 z 3 (trzeci — [10]) |
| wersje | `jerozolima-k04` | Altaïr na białym koniu wjeżdża na plac wśród palm i tłumu | Ряд абстрактный (издания и платформы), но чистых кадров хватает на все ряды, так что столбец не нужен. Всадник ничему в тексте не противоречит; … · 2 z 3 (trzeci — bez kadru) |
| odbior | `jerozolima-k05` | Altaïr wspina się po drabinie nad placem z fontanną i straganami | Голоса 1–1–1 ([8] / [4] / [5]); [8] и [4] уже заняты рядами выше, где у них большинство. По сюжету [5] закрывает ряд дословно: … · 1–1–1, decyzja sędziego |

**/assassins-creed-2/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| fabula | `foto-florencja-1470` | Florencja około 1470 roku — Pianta della Catena, widok miasta przypisywany Francescowi Rossellemu | Commons: Pianta della Catena — Флоренция ≈1470, годы фабулы (1476–1499); на витрине AC2 Флоренции нет (все 8 кадров — Венеция) |
| rozgrywka | `wlochy-k03` | Ezio płynie kanałem o zmierzchu, pod arkadami patrol straży | Meta ряда открывается словом «Pływanie», тело — «Ezio pływa, więc woda przestaje być ścianą» и тут же «straż patrzy uważniej»: … · 2 z 3 (trzeci — [5]) |
| watek-wspolczesny | `wlochy-k01` | Ezio skacze z dachu nad wenecki kanał, widok z góry | Desmonda, Lucy, Shauna, Rebeki i Minerwy w katalogu nie ma; rząd tłumaczy się efektem krwawienia — «Desmond uczy się od Ezia», a skok wiary to ta umiejętność w najczystszej postaci, widok z góry czyta się jak obserwacja … · 3 z 3 |
| dodatki-i-wydania | `foto-savonarola` | Stracenie Savonaroli na Piazza della Signoria — obraz przypisywany Francescowi Rossellemu, około 1500 roku | Commons: «Stracenie Savonaroli» (ok. 1500) — Стос próżności, дополнение о Флоренции 1497 под Савонаролой |
| jak-zaczac | `wlochy-k05` | Ezio nocą chwyta halabardę strażnika przy fontannie, w tle pełnia | Голоса 1–1–1 ([4] story, [5] rhythm, [2] geometry), решение по сюжету ряда: последний абзац — «Walka jest prosta — wygrywa kontra… wyzwanie jest w cichym podejściu»; … · 1–1–1, decyzja sędziego |

**/assassins-creed-3/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| haytham-i-connor | `assassins-creed-3-k04` | Connor w kapturze walczy z czerwonymi kurtkami na bruku Bostonu | Сюжет: ряд о сыне-асасине против британцев, в теле дословно Boston и masakra bostońska — кадр даёт Коннора в белом капюшоне против красных мундиров у краснокирпичного дома на брусчатке; … · 3 z 3 |
| swiat-i-rozgrywka | `assassins-creed-3-k02` | Młody Connor skacze z urwiska nad jesienną doliną pogranicza | Сюжет: заголовок и тело ряда — pogranicze, las, klify, rzeki, wioska Connora, pory roku — в кадре обрыв, осенний лес, озеро с рекой и молодой Коннор в наряде из деревни, без капюшона. Ритм: … · 3 z 3 |
| aquila | `assassins-creed-3-k09` | Connor na dachu nad zimowym portem Bostonu pełnym żaglowców | Единственный палубный кадр [0] стоит героем и в co-to-za-gra — повтор запрещён; [9] — второй и последний кадр с морем: гавань Бостона, десяток парусников, корабль под парусом слева, Union Jack на мачте. … · 3 z 3 |
| komu-i-od-czego-zaczac | `assassins-creed-3-k08` | Connor w kapturze, za nim Aveline w zaśnieżonym brzozowym lesie | Большинство 2 из 3 (story + geometry), кадр чист. Сюжет: тело ряда дословно называет «Liberation … ma w Nowym Jorku wspólną misję z Connorem» — кадр из этой самой совместной миссии, двое героев двух игр в одном кадре, плюс «pory … · 2 z 3 (trzeci — [5]) |

**/assassins-creed-brotherhood/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| co-jest-w-grze | `assassins-creed-brotherhood-k09` | Ezio gna na białym koniu przez bramę, za nim straż, w tle Panteon | Заголовок ряда «Rzym zamiast Florencji», тело — «Akcja toczy się w Rzymie lat 1499–1507»: … · 3 z 3 |
| fabula | `assassins-creed-brotherhood-k11` | Ezio strzela z armaty z murów Monteriggioni w wieże oblężnicze | Steam [11]: осада Монтериджони — дословно «Monteriggioni pada»; перестановка ведущего (у судьи [11] стоял на bractwo, fabula — Commons) · судья 3 z 3 за [11] на странице |
| miasto | `foto-rzym-piranesi` | Koloseum w rycinie Giovanniego Battisty Piranesiego z XVIII wieku | Commons: Пиранези, Колизей — Рим XVIII в. (план: гравюра Пиранези) |
| bractwo | `foto-leonardo-czolg` | Wóz bojowy Leonarda da Vinci — rysunek z około 1485 roku | Commons: рисунок Леонардо — боевая колесница и «танк» (BM) — «cztery maszyny wojenne z projektów Leonarda, w tym czołg» из ряда |
| tryb-sieciowy | `assassins-creed-brotherhood-k04` | Skok z ukrytym ostrzem na kapłana w tłumie targu, doktor na dachu | Ряд о мультиплеере — кадр мультиплеера здесь разрешён заданием. Тело ряда дословно: … · 3 z 3 |
| dodatki-i-znajdzki | `foto-kopernik` | Mikołaj Kopernik — portret toruński z około 1580 roku | Commons: портрет Коперника (toruński, ok. 1580), crop к лицу — «Spisek Kopernika» |
| wydania | `foto-monteriggioni` | Monteriggioni — mury i wieże toskańskiego miasteczka z XIII wieku | Commons: фото Монтериджони (панорама стен) — абстрактный ряд; чистых кадров Brotherhood не осталось |

**/assassins-creed-revelations/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| co-to-za-gra | `assassins-creed-revelations-k05` | Hagia Sophia o zachodzie słońca, ptaki nad dachami Konstantynopola | Ряд «Konstantynopol zamiast Rzymu», meta «Konstantynopol · 1511–1512», в теле дословно «stolicy Imperium Osmańskiego» и «Hagią Sophią» — кадр показывает именно её и город без фигуры; Эцио на странице уже даёт герой [0]. … · 3 z 3 |
| co-nowego | `assassins-creed-revelations-k01` | Ezio zjeżdża na haku po linie nad dachami Konstantynopola | Ряд «Ostrze z hakiem, bomby i obrona kryjówek», meta «Tyrolki», в теле «zjeżdża po linach nad ulicami» — единственный чистый кадр с механикой ряда: Эцио на тросе за крюк над двором рынка. … · 3 z 3 |

**/assassins-creed-syndicate/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| bliznieta-frye | `londyn-k07` | Evie i asasyn w kapturze rozmawiają z mężczyzną na targu | Ряд «Dwie postacie · przełączanie w mieście» — кадр 07 единственный чистый, где оба близнеца в одной сцене: … · 3 z 3 |
| fabula | `londyn-k05` | Jacob na linie między iglicami Westminsteru o świcie | Решение ведущего: судья ставил [8] (Jacob в цеху у горна, 3 z 3), проверка отвергла — белый контур подсветки на персонаже (маркер цели); [5] стоял под флагом games.json «znak wodny 0–5», по полному кадру и четырём углам знака нет — флаг снят, кадр взят: Лондон Джейкоба с крыш, «przejmuje dzielnicę po dzielnicy» |

**/assassins-creed-shadows/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| naoe-i-yasuke | `japonia-k05` | Naoe ogląda ukryte ostrze na cudzym przedramieniu, w tle pożar | Единогласно. Текст ряда: «zabójstwo ukrytym ostrzem za jednym ciosem», ярлык — Naoe; в кадре её лицо крупным планом и выдвинутый скрытый клинок на чужом предплечье (кто держит — не видно, не называю). … · 3 z 3 |
| werdykt | `japonia-k07` | Naoe na gałęzi sosny nad zieloną doliną, zamkiem i zatoką we mgle | Большинство: story и geometry — werdykt, rhythm — od-red-do-premiery. Сюжет решает в пользу вердикта: … · 2 z 3 (trzeci — od-red-do-premiery) |

**/assassins-creed-origins/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| bayek-i-aya | `assassins-creed-origins-k04` | Postać w masce Anubisa nad mumią w malowanej krypcie | Ряд открывается фразой «ludzie w maskach ciągną Bayeka i jego syna do krypty pod świątynią» — кадр даёт ровно это: … · 2 z 3 (rhythm, geometry; story — [5]) |
| egipt-i-walka | `assassins-creed-origins-k03` | Bayek z łukiem na wielbłądzie, żołnierze z tarczami nacierają | Текст ряда — «jeździ się konno lub na wielbłądzie», «cztery łuki», «tarczą blokuje się ciosy», «walka na hitboksach»; кадр показывает всё разом: … · 3 z 3 |
| dodatki-i-wydania | `assassins-creed-origins-k02` | Bayek na głowie Sfinksa w niskim słońcu, Senu krąży nad nim | При 1–1–1 решено по сюжету ряда: story предлагал [4], но он ушёл большинством в bayek-i-aya; из оставшихся [2] и [0] ближе к тексту [2] — «Wycieczka krajoznawcza: 75 tras z przewodnikiem, bez walki, opracowanych z egiptologami»: … · 1–1–1 (story — [4], rhythm — [2], geometry — [0]), decyzja sędziego |

**/assassins-creed-odyssey/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| aleksios-albo-kasandra | `assassins-creed-odyssey-k05` | Aleksios i dwaj wojownicy w spartańskich hełmach w mroku świątyni | Głosy 1–1–1 (story [5], rhythm [0], geometry [1]); [0] odchodzi do komu większością 2 z 3, więc spór [5] vs [1] rozstrzygam po fabule rzędu. Tytuł «Aleksios albo Kasandra — wyrzutek z krwi Leonidasa»: … · 1–1–1, decyzja sędziego (po fabule; [0] zajęty przez komu) |
| swiat-i-rozgrywka | `assassins-creed-odyssey-k04` | Spartańscy łucznicy podpalają z pokładu ateński okręt | Jedyny kadr z okrętem — «okręt Adrestia» w tytule, meta «Ateny · Sparta · bitwy»: czerwone grzebienie Sparty przeciw żaglowi z sową Aten, wybrzeże ze świątyniami daje «Grecję». Rytm: … · 3 z 3 |
| dodatki-i-wydania | `assassins-creed-odyssey-k01` | Kasandra rozmawia z Sokratesem na targu pod Akropolem | Głosy 1–1–1 (story [1], rhythm [5], geometry [7]): [5] zajęty przez rząd 1, [7] odrzucony (czerwone plamy na płótnach nad basenem czytają się jak zakrwawione szmaty — wzgląd właściciela), zostaje [1]. … · 1–1–1, decyzja sędziego ([5] zajęty, [7] odrzucony) |
| komu-i-od-czego-zaczac | `assassins-creed-odyssey-k00` | Jeździec w hełmie na koniu dęba nad grecką doliną, w górze orzeł | Większość 2 z 3 (story, geometry; rhythm dał [1]). Ciało rzędu: «dużego RPG w otwartym świecie: tygodni w Grecji» — vista z doliną, wsią na skale, oliwkami i śnieżnymi górami to otwarty świat jednym kadrem; … · 2 z 3 (trzeci — [1]) |

**/assassins-creed-unity/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| co-to-za-gra | `assassins-creed-unity-k01` | Arno na dachu nad paryską ulicą pełną barykad i dymu | Meta ряда — «Paryż · 1789–1794 · Arno Dorian», body — «Akcja toczy się w Paryżu od wigilii rewolucji»: один Арно на коньке крыши над улицей с баррикадами, телегами и дымом — Париж революции дословно, без повтора четвёрки героя. … · 3 z 3 |
| paryz | `foto-paryz-1739` | Paryż na planie Turgota z 1739 roku — Pont Neuf i cypel Île de la Cité | Commons: план Тюрго 1739, лист KU 11 — Pont Neuf и cypel Île de la Cité (план: «план Тюрго 1739») |
| parkour-i-kooperacja | `assassins-creed-unity-k02` | Czterech asasynów na barykadzie nad tłumem z trójkolorową flagą | Body ряда — «gra do czterech osób i każdy jest Arnem z własnym wyglądem»: единственный кадр каталога с четырьмя ассасинами в разной одежде; стоят на баррикаде из мебели — «w górę i w dół» тоже читается. … · 3 z 3 |

**/assassins-creed-mirage/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| co-to-za-gra | `assassins-creed-mirage-k08` | Basim skacze z bramy z ukrytym ostrzem na strażnika w tłumie | Tytuł rzędu «Bagdad i Basim», body kończy się na «skradania, parkouru i skrytobójstw» — kadr daje wszystko naraz: … · 3 z 3 |
| basim | `assassins-creed-mirage-k02` | Basim w płaszczu ze sztyletem otoczony przez zamaskowanych bandytów | Rząd o drodze «od złodzieja z Anbaru do Ukrytego» — jedyny czysty kadr z twarzą Basima w zgrzebnym płaszczu zamiast bagdadzkiej bieli, samotnego wśród bandytów w ruinach: czyta się jako wczesny Basim między dwoma światami. Rytm: … · 3 z 3 |
| bagdad | `foto-samarra` | Samarra, IX wiek — spiralny minaret Malwija Wielkiego Meczetu kalifa al-Mutawakkila | Commons: минарет Малвия в Самарре — IX век, мечеть al-Mutawakkila (калиф из ряда basim); плана Круглого города в свободных лицензиях с шириной ≥ 1600 не нашлось |
| skradanie-i-parkour | `assassins-creed-mirage-k06` | Nocą Basim z ukrytym ostrzem czai się nad tarasem, niżej dwaj nieświadomi | Dosłowne trafienie w «Ukryte ostrze» i w body («kryjówka na widoku», «cicha eliminacja», balans zniechęcający do otwartej walki): … · 3 z 3 |
| od-rift-do-doliny-pamieci | `foto-hegra` | AlUla — Qasr al-Farid, nabatejski grobowiec w Hegrze (Mada’in Salih), Arabia Saudyjska | Commons: Qasr al-Farid, Hegra/AlUla — «region AlUla» Doliny Pamięci |
| wydania-i-wersje | `assassins-creed-mirage-k09` | Basim w czerni i złocie z szablą i sztyletem między dwoma strażnikami | Body: Deluxe daje «odzienie, miecz, sztylet» — w kadrze Basim w czarno-złotym stroju odmiennym od standardowej bieli, z szablą i sztyletem; to kosmetyczny pakiet na oko (katalog: … · 3 z 3 |
| komu-i-od-czego-zaczac | `assassins-creed-mirage-k00` | Basim skacze z belki nad skalnym grobowcem w pustynnym wąwozie | Rząd abstrakcyjny (komu i od czego zacząć, odsyła do poradnika), więc kadr ma nie przeczyć tekstowi i zamknąć stronę spokojnie: … · 3 z 3 |

### Пачка B — Steam с тесным запасом и DLC (7)

**/assassins-creed-valhalla/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| anglia-i-osada | `assassins-creed-valhalla-k02` | Eivor na dziobie drakkaru wskazuje toporem kościół w niskim słońcu | Текст ряда: Англия, Krucza Przystań, «materiały dają najazdy na klasztory» — драккар клана на реке подходит к саксонской церкви с крестовыми хоругвями и палисадом. … · 3/3 (story, rhythm, geometry) |
| walka-i-aktywnosci | `assassins-creed-valhalla-k00` | Eivor z dwoma toporami naciera na wojownika z kiścieniem w śniegu | Meta ряда «Broń w obu rękach» и «wrogów jest 25 archetypów»: проверено по полному кадру — у Eivora два топора (поднятый в правой, датский в левой), противник с кистенём — один из архетипов. … · 3/3 (story, rhythm, geometry); opis взят у rhythm — два топора подтверждены по кадру |

**/assassins-creed-valhalla/eivor/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| kim-jest | `assassins-creed-valhalla-k01` | Eivor dmie w róg na dziobie drakkaru, za nim nocny najazd i pożar | ЗАМЕНА keyart → скриншот (пункт 2 списка события, вторая замена): единственный кандидат — [1]; судья отложил (кисть Eivora на топорище срезана краем самого мастера) при голосах 2–1 за кадр; решение ведущего — взять: срез у кромки мастера после cover читается как кадрирование; «prowadzi klan Kruka za Morze Północne» — драккар и ночной набег |
| norwegia-i-kjotve | `assassins-creed-valhalla-k00` | Eivor z dwoma toporami naciera na wojownika z kiścieniem w śniegu | ПОВТОР 1 из 2 (тот же кадр в walka-i-aktywnosci страницы Valhalla; подпись одна, ключ один). Единственная зимняя Норвегия набора: снег, ели, длинные дома; … · 3/3 (story, rhythm, geometry) |
| anglia-i-osada | `assassins-creed-valhalla-k02` | Eivor na dziobie drakkaru wskazuje toporem kościół w niskim słońcu | ПОВТОР 2 из 2 (тот же кадр в anglia-i-osada страницы Valhalla). Дословно «surowce zwozi z najazdów na nadrzeczne wioski i klasztory», «z Sasami» — драккар перед прибрежной церковью с крестами на знамёнах. flip=false: … · 3/3 (story, rhythm, geometry) |
| ukryci-i-basim | `assassins-creed-valhalla-k03` | Eivor nad pergaminem naradza się z dwoma sojusznikami w kościele | Единственный спокойный кадр набора — Eivor над пергаменом с двумя союзниками в церкви («listy … poszlaki … nazwiska»); проверка отвергла по зоне 4,5 % (наплечник Eivora ~37 px и локоть правого ~40 px у среза) — принят ведущим: второстепенные части фигур · судья 3/3 |

**/assassins-creed-valhalla/dawn-of-ragnarok/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| fabula | `dawn-of-ragnarok-k02` | Wojowniczka w brązowej zbroi i Havi w sali zalanej lawą | Ряд про Havi-Одина, Сурта и Свартальфхейм, залитый огнём Муспелей: в кадре узнаваемый Havi (капюшон, повязка, вороний плащ) в зале краснолюдов, залитом лавой, с горящим тронным столпом — сюжетная сцена, не бой. … · 2 (rhythm, geometry) против 1 (story → [4]) |
| co-nowego | `dawn-of-ragnarok-k01` | Havi włócznią roztrzaskuje zamrożonego wroga na lodowe odłamki | «Havi włócznią roztrzaskuje zamrożonego wroga» — сила льда на оружии из ряда; проверка отвергла: серый крайний столбец x=0 файла витрины (вне зоны cover — 86 px среза) и зона 12 % — принят ведущим · судья 3 (story, rhythm, geometry) |
| wydania-i-komu | `dawn-of-ragnarok-k04` | Krasnolud w kuźni podaje Havi świeżo wykuty karwasz | Абстрактный ряд (издания, цены, «po podstawce», «opowieść zakłada wątki mitologiczne», совет «odpocząć»): … · 2 (rhythm, geometry) против 1 (story → [2]) |

**/assassins-creed-rogue/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| shay-cormac | `assassins-creed-rogue-k04` | Shay na kłodzie nad leśną zatoką patrzy na okręt o czerwonych żaglach | Решение ведущего: судья ставил [1] (Shay с пистолетом в порту, 3–0), проверка отвергла — белый контур захвата цели на солдате и чёрный крайний столбец файла; [4] (у судьи — co-to-za-gra) перенесён на сюжетный ряд о Shay, co-to-za-gra остаётся столбцом под героем-keyart |
| morrigan | `assassins-creed-rogue-k03` | Morrigan pod czerwonymi żaglami łamie lód o zachodzie słońca | Дословно текст ряда: «taran: Morrigan kruszy krę, przebija się przez zamarznięte przesmyki» — нос поднимается над трескающимися льдинами, брызги, ледяная бухта; … · 3–0 (story, rhythm, geometry) |
| lowca-asasynow | `assassins-creed-rogue-k02` | Shay krzyżuje szable z zakapturzonym asasynem na brukowanej ulicy | «Shay krzyżuje szable z asasynem» — единственный кадр охоты на ассасинов; проверка отвергла по зоне 4,5 % (второстепенные ассасины по бокам: кисть с кинжалом справа, предплечье слева у среза) — принят ведущим, центральный клинч цел · судья 3–0 |
| komu-i-od-czego-zaczac | `foto-nowy-jork-1750` | Nowy Jork około 1760 roku — widok miasta od południowego wschodu, rycina Pierre’a-Charles’a Canota | Commons: Canot, widok Nowego Jorku ok. 1760 — «zobaczy Nowy Jork sprzed rewolucji» из ряда |

**/assassins-creed-4-black-flag/freedom-cry/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| adewale | `freedom-cry-k02` | Adéwalé unosi maczetę w szalupie nad powalonym wrogiem, w tle okręt | Adéwalé с мачете в шлюпке — «maczeta» ряда; проверка отвергла по зоне 12 % (падающий враг у правого края) и по alt — принят ведущим по 4,5 %, alt поправлен по проверке («nad powalonym wrogiem» вместо «wróg wpada do wody») · судья 3/3 |
| wydania | `freedom-cry-k05` | Nocą Adéwalé z garłaczem skrada się do dwóch żołnierzy przy ognisku | [5] 1280×720 — единственный второй чистый кадр; проверка отвергла по зоне 12 % и по alt («pistolet» → «garłacz» — по полному кадру и тексту ряда «maczeta i garłacz») — принят ведущим по 4,5 %, alt поправлен · судья 3/3 |

**/assassins-creed-chronicles/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| co-to-za-gra | `assassins-creed-chronicles-k04` | Shao Jun walczy w płonącej sali pałacu, obok leży strażnik | Ряд объясняет формат — «widok z boku i liniowe poziomy w 2,5D, postać biegnie po jednej płaszczyźnie»; … · 2–1 (story, geometry → [4]; rhythm → [1]) |
| indie | `chronicles-india-k03` | Arbaaz biegnie przez ogród obok malowanych słoni | Большинство при чистом кадре: Arbaaz крупно и узнаваем (белый капюшон, красный шарф), расписные слоны с махаутом и купола дворца — Пенджаб Państwa Sikhów 1841 года, «India w nasyconych kolorach». … · 2–1 (rhythm, geometry → [3]; story → [2]) |
| rosja | `chronicles-russia-k10` | Nikołaj na dachu patrzy na Moskwę, wieże Kremla w czerwieni | Meta ряда — «Moskwa · Kreml», текст — «wyciąga Anastazję z Kremla»: … · 3–0 (story, rhythm, geometry) |
| rozgrywka | `chronicles-india-k07` | Arbaaz zwisa z muru pod tarasem, wyżej stoją dwaj strażnicy | «Arbaaz zwisa z muru pod tarasem, wyżej strażnicy» — «mijając strażników o zaznaczonym polu widzenia»; проверка отвергла по зоне 12 % (кисть на x≈1686 при линии 1690), по 4,5 % запас 148 px — принят; «patrolują» → «stoją» по проверке · судья 2–1 |
| wydania-i-komu | `chronicles-russia-k06` | Nikołaj na nabrzeżu pod stalowym mostem, czerwone niebo Moskwy | Голоса 1–1–1 — решено по сюжету ряда: «Kolejność jest jedna: China, India, Russia» — страница замыкается последней игрой порядка, а Nikołaj, идущий вперёд по пристани, отвечает подписи года «Start». … · 1–1–1 (story → Russia [6]; rhythm → India [2]; geometry → China [3]) — по сюжету ряда |

**/assassins-creed-liberation/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| aveline | `assassins-creed-liberation-k01` | Aveline z profilu patrzy na nocny plac Nowego Orleanu | Единственный чистый кадр, где Авелин крупно: лицо в профиль под треуголкой занимает правую четверть кадра — правило единицы «aveline — крупно». Ряд о ней самой («należy do elity miasta, a po kryjomu uwalnia niewolników»): … · story [1], geometry [1] — 2; rhythm [4] — 1 |
| trzy-persony | `assassins-creed-liberation-k04` | O zachodzie Aveline z maczetą i ukrytym ostrzem naprzeciw zbira i oficera | Aveline в персоне asasynki с мачете и скрытым клинком — единственный кадр персоны (niewolnica на витрине нет, dama — только keyart); проверка отвергла по зоне 4,5 % (офицер у правого среза, кулак у левого) и по alt (sztylet → ukryte ostrze, strażnicy → zbir i oficer) — принят ведущим, alt поправлен · судья 2:1 |
| nowy-orlean | `assassins-creed-liberation-k02` | Nocą na bagnach Aveline podchodzi do chaty na palach ze świecami | Заголовок «Nowy Orlean, bagna i Chichén Itzá», мета «konary zamiast dachów»: ночные болота с мёртвыми кипарисами в синем тумане и хижина на сваях со свечами — среда ряда, которой нет ни у героя, ни у соседей. flip=true: … · story [2], rhythm [2], geometry [2] — 3 |

### Пачка C — Commons и темы (8)

**/assassins-creed-bloodlines/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| fabula | `foto-akka` | Akka — mur morski krzyżowców, fotografia z lat 1920–1933 | Commons: Akka, mur morski krzyżowców (American Colony 1920–1933, PD) — «Z Akki na Cypr» |
| wersje | `foto-psp` | Sony PlayStation Portable — konsola PSP-1000 | Commons: PSP-1000 (Evan-Amos) — «Tylko PSP» |
| dla-kogo | `jerozolima-k06` | Altaïr na gzymsie nad placem z fontanną i szubienicą | Steam AC1 [6]: Altaïr над площадью — донор пачки A; «co stało się z Altaïrem … po finale jedynki» |

**/assassins-creed-pirates/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| co-to-jest | `foto-bitwa-morska` | Bitwa morska u wybrzeży Cartageny w 1708 roku — obraz Samuela Scotta | Commons: Samuel Scott, «Wager's Action off Cartagena, 1708» — Карибы золотого века пиратства |
| fabula | `foto-la-buse` | Kryptogram La Buse — zaszyfrowana wiadomość o skarbie Oliviera Levasseura | Commons: kryptogram La Buse — сам «skarb La Buse» |
| wersje | `foto-karaiby-mapa` | Karaiby na mapie Homanna z 1737 roku — Zatoka Meksykańska i Antyle | Commons: карта Хоманна 1737, полоса Карибов — абстрактный ряд |
| nie-mylic | `karaiby-k06` | Edward brodzi ku plaży, za nim Kawka pod czarną banderą | Steam BF [6] (повтор с Black Flag/edward-kenway — план разд. 2 п. 5 допускает): остров и Kawka — «Wyspa …, żagle dla Kawki» |

**/assassins-creed-2/discovery/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| rozgrywka | `wlochy-k04` | Ezio walczy ze strażą przed bazyliką św. Marka | Steam AC2 [4]: Ezio против стражи с алебардами у Сан-Марко — «halabardników … zabić»; кадров 2,5D на витрине нет |
| wydania-i-dla-kogo | `foto-nintendo-ds` | Nintendo DS Lite — konsola przenośna z dwoma ekranami | Commons: Nintendo DS Lite (Evan-Amos) — «Kartridż DS» |

**/mapa-miejsc-historycznych/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| anglia-wikingow | `foto-stonehenge` | Stonehenge — krąg kamienny w hrabstwie Wiltshire | Commons: Stonehenge (CC0) — первое место ряда |
| grecja-i-egipt | `foto-delfy` | Delfy — tolos świątyni Ateny Pronaia u stóp Parnasu | Commons: tolos w Delfach — «Fokida z Delfami» |

**/assassins-creed-rodowod/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| jak-laczy-sie-z-dwojka | `foto-signoria` | Florencja — wieża Palazzo Vecchio nad dachami miasta | Commons: wieża Palazzo Vecchio — plac egzekucji z początku dwójki; Флоренции у витрины AC2 нет |
| jak-obejrzec | `wlochy-k02` | Ezio nurkuje z gondoli do laguny, na molo straż z halabardą | Steam AC2 [2] — донор пачки A; абстрактный ряд |
| inne-filmy-serii | `discovery` | Hiszpania końca XV wieku, Alhambra nad Grenadą — II: Discovery, 1491 | Commons discovery (Alhambra, ключ страницы Discovery) — Andaluzja Aguilara z filmu 2016; повтор ключа Commons между страницами |
| czy-warto | `wlochy-k07` | Ezio spada z góry na strażnika na pomoście nad kanałem | Steam AC2 [7] — донор пачки A; абстрактный ряд |

**/assassins-creed-ii-wojna-swiatowa/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| skad-pytanie | `assassins-creed-odyssey-k02` | Kassandra kopie ateńskiego hoplitę w leśnej bitwie | Steam Odyssey [2] — «od Grecji Odyssey»: самая ранняя эпоха ряда |
| dlaczego-trudno | `foto-paryz-1940` | Paryż pod okupacją — defilada niemiecka na Polach Elizejskich, 1940 rok (Bundesarchiv) | Commons: Bundesarchiv, defilada na Polach Elizejskich 1940 — 800×504, крупнее в свободных лицензиях нет (вопрос владельцу) |
| co-dalej | `karaiby-k04` | Edward na gałęzi w dżungli nad ruinami | Steam BF [4] (повтор с Black Flag/wydania) — «Black Flag Resynced» из ряда |

**/poradniki/od-czego-zaczac/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| dwie-kolejnosci | `assassins-creed-odyssey-k06` | Kassandra z toporem między dwoma osiłkami w błękitnych hełmach | Steam Odyssey [6] — Odyssey: первая по хронологии, одиннадцатая по премьерам — сама «двойная ось» |
| chronologia | `assassins-creed-origins-k01` | Bayek z Senu przed Sfinksem nocą, w tle piramidy Gizy | Steam Origins [1]: Sfinks nocą — «Origins, Egipt lat 49–44 p.n.e.» |
| watek-wspolczesny | `assassins-creed-origins-k00` | Bayek idzie pustynią ku niskiemu słońcu, z lewej trzy hieny | Steam Origins [0] — кадров современности ни у одной витрины нет; Bayek, чьи воспоминания переживает Layla |
| co-pominac | `chronicles-india-k02` | Arbaaz w skoku wiary nad pałacem z mandalą o zachodzie słońca | Steam Chronicles India [2] — spin-off из списка ряда; свободный кадр пачки B |

**/assassins-creed-za-darmo/**

| ряд | ключ | что в кадре (alt) | почему · голоса |
|---|---|---|---|
| legalnie | `karaiby-k03` | nurkowanie do skrzyni we wraku | Steam BF [3] (повтор с Black Flag/abstergo) — «Rozdania na stałe: Black Flag (2017)»; skrzynia we wraku |


# 3. Герои четырёх страниц — лиды по П42, коридоры, структура

Форма — как у Ezio (`148f5d2`): `hero-key-art` рукой во входе
`pages-s2.json` (`manual`), `npm run tree` воспроизводит `structure.json`
(diff — только страница), в содержании — `art`, `lead`, `primary`,
`secondary`; умолчания `type-blocks.json` не тронуты (П57 п. 3). Каждый
лид проверен тремя линзами до вставки (`dobor-sedzia.md`, раздел C):
факты против рядов страницы, против корпуса (одноразовая читалка
`narzedzia/korpus.mjs` — бэклог 43), польский язык и стиль. **Помеченного
и выкинутого — 1 stop + 5 fix:** год 872 у Eivor (корпус и страница Valhalla:
873 — снят); первые фразы всех четырёх черновиков (дословный повтор зачина
первого ряда — Eivor «wiking z Norwegii, który…», od-czego «dwie osie
czasu», коллаж оборотов рядов у Rodowód, у II wojna ещё двусмысленность
«kończy się na Londynie») — переписаны. Все оставшиеся утверждения
подтверждены рядами страниц и корпусом.

| Страница | Арт героя | Лид (знаков без пробелов) | Кнопки | Коридор |
|---|---|---|---|---|
| `/assassins-creed-valhalla/eivor/` | keyart `assassins-creed-valhalla` (3840, уже в `gry/`); ряду `kim-jest` — Valhalla [1] | 164: «Wiking, który wyprowadza klan Kruka z Norwegii za Morze Północne i zakłada w Mercji Kruczą Przystań. Sojusznik Ukrytych, nie asasyn — jak Edward Kenway w Black Flag; płeć bohatera wybiera gracz.» | `#kim-jest` «Kim jest Eivor» · `/assassins-creed-valhalla/` «Strona Valhalli» | 4334 → **4524** в [3348, 4530] (запас 6 знаков — впритык, как считал план) |
| `/assassins-creed-rodowod/` | Commons `assassins-creed-rodowod` — Florencja, Kronika Norymberska 1493 (PD, 2440 → 2000), дуотон золота | 199: «Film aktorski Ubisoftu z 2009 roku: 36 minut w trzech odcinkach o Giovannim Auditore, bankierze i asasynie z Florencji, którego śledztwo prowadzi do templariuszy. Kończy się przed egzekucją, od której zaczyna się Assassin’s Creed II.» | `#co-to-jest` «Czym jest Rodowód» · `/assassins-creed-2/` «Assassin’s Creed II» | 4360 → **4591** в [3900, 5276] |
| `/assassins-creed-ii-wojna-swiatowa/` | Commons `assassins-creed-ii-wojna-swiatowa` — NARA, żołnierze na moście Westminsterskim ≈ 1917 (PD; мастер 1882 после кропа — класс героев 1280–1920, как Ezio) | 147: «Najpóźniejsza epoka czternastu części głównej linii to Londyn roku 1868. Pierwsza wojna dostała misje poboczne w Syndicate, druga — tylko epizod w Unity; osobnej gry nie ma.» | `#skad-pytanie` «Skąd to pytanie» · `/assassins-creed-syndicate/` «Strona Syndicate» | 3466 → **3641** в [2718, 3678] |
| `/poradniki/od-czego-zaczac/` | Steam `assassins-creed-mirage-k00` — Basim в прыжке над скальной гробницей (1920; сюжет в 58–84 % кадра; повтор с рядом `komu` страницы Mirage — единственный чистый кадр Mirage с такой геометрией; бэклог 48 п. 2 — из Mirage, не AC1) | 203: «Serię da się ułożyć na dwa sposoby: według premier, od jedynki z 2007 roku po Shadows z 2025, albo według epok, od Grecji V wieku p.n.e. po Rosję roku 1918. Trzy wejścia do serii zamiast jednego: klasyka Ezia, świat Black Flag albo RPG od Origins.» | `#trzy-wejscia` «Trzy wejścia» · `/poradniki/` «Wszystkie poradniki» | 12113 → **12345** в [7675, 12500] |

`/assassins-creed-za-darmo/` — героя нет (П57 п. 3 а), кадр единственному
ряду `legalnie` ← BF [3]; коридор 604 в [474, 642] не тронут.
`/prywatnosc/`, `/404/` — без героя и кадров (П57 п. 3 а). Кадры героев
для глаз — `2026-09-16-paczki-abc/*-hero-{1440,390}.jpg` и полные страницы.

# 4. Столбцы — 15 рядов без кадра, по причине

| Страница | Ряд | Почему столбец |
|---|---|---|
| `/assassins-creed-3/` | `desmond` | на витрине AC3R нет ни одного кадра современности (3 из 3 линз); любой кадр Коннора под заголовком о Desmond обманул бы alt |
| `/assassins-creed-revelations/` | `wersje-i-dodatki` | единственный свободный кадр [4] — кровь у шеи янычара; чистых не осталось (свободных было ровно три) |
| `/assassins-creed-syndicate/` | `victory-i-szostka`, `wydania-i-dodatki` | чистых кадров три ([5], [7], [8] — [8] с контуром подсветки); 0–4 знак воды, 9–12 инфографика с текстом; пара соседних столбцов |
| `/assassins-creed-shadows/` | `od-red-do-premiery`, `wydania-i-dodatki` | 9 кадров, чистых 3 ([6] уже слой главной), остальные HUD/меню ([1] Naoe на шпиле и [4] Yasuke на коне — только с компасом; свои скриншоты П56 исключил) |
| `/assassins-creed-unity/` | `premiera-i-wydania`, `komu-i-od-czego-zaczac` | чистых три ([1], [2], [4]); [4] — две белые строки пикселей внизу файла витрины (измерено), [0] кровь под гильотиной, [3] кровь, [5] HUD; пара |
| `/assassins-creed-valhalla/` | `platformy-i-wersje` | 5 кадров, чистых 3 на 7 рядов двух страниц; [4] — промо-рендер с рунами |
| `/assassins-creed-rogue/` | `co-to-za-gra`, `watek-wspolczesny`, `wydania-i-wersje` | чистых 3 ([1] — контур захвата цели + чёрный столбец файла, [0] — инфографика); `co-to-za-gra` под героем-keyart, `watek` + `wydania` — пара |
| `/assassins-creed-liberation/` | `co-to-za-gra`, `wydania`, `komu-i-ktora-wersja` | чистых 3 ([3] кровь на брусчатке; [5], [6] — плашки «HD vs Vita» с логотипами и текстом); `co-to-za-gra` под героем, `wydania` + `komu` — пара |

Четыре из них закрылись бы кадрами с малой кровью или дефектом файла —
вопрос владельцу («Политические» п. 3).

# 5. Контрольные съёмки судей — три пачки

Генератор сессии 2 без изменений (`docs/reports/2026-09-16-sobytie-kadry/
sniazka-gen.mjs`), `astro preview`, Playwright MCP, один прогон на пачку
(план разд. 8: «26 кадров, один прогон — как контроль драйвера»), `check`
против эталона `8d9ba13`; журналы — `2026-09-16-paczki-abc/kontrola/`.

| Прогон | Сборка | Игра (15) | Главная (11) |
|---|---|---|---|
| kA — после пачки A | `bc8ff83` | 0 различий 15/15, геометрия совпала, `exit=0` | 0 различий 11/11, `exit=0` |
| kB — после пачки B | `d84e6c6` | **`exit=1`**: `mobile-full-390` — 23 субпикселя (макс 3) в рамке 368×108 от (17, 323) — коробка картинки героя (hero y 135–1145); остальные 14 — 0 | `exit=0`: 10 кадров 0, `mobile-full-390` — зерно в четырёх зонах шума (2-hero 26 098 макс 3, 2-wlochy слой 1617 и галерея 4790 макс 1, зона 4 108 001 макс 2) |
| kB2 — повтор игры | `d84e6c6` | 0 различий 15/15, `exit=0`; все 15 кадров **побайтово равны эталону** (`kontrola/hashe.txt`; kA и kC — тоже 15/15 и 11/11) | — |
| kC — после пачки C | `4f34e1f` | 0 различий 15/15, `exit=0` | 0 различий 11/11, `exit=0` |

Разбор kB: HTML и лист судей пачки не трогают (ключей на них не прибавилось,
CSS не менялся), kB2 на той же сборке равен эталону байт в байт — это
зерно растеризации картинки героя на полном 390, класс П50 (там —
бимодальное зерно полного 390 главной). Повтора между прогонами одной
сборки с числом нет (1 из 4 прогонов игры в сессии) — по П45/П51 п. 3 зона
не заводится, эталон не трогается; наблюдение — строкой в бэклог 50.

# 6. Commons — 22 слота

| Слот | Ряд | Файл Commons | Лицензия | Кроп / мастер |
|---|---|---|---|---|
| `foto-florencja-1470` | AC2 `fabula` | Rosselli (attr.), Pianta della Catena, 1470 | PD | 2000×865 (2,31:1 — cover режет бока) |
| `foto-savonarola` | AC2 `dodatki-i-wydania` | Rosselli (attr.), supplizio del Savonarola, ok. 1500 (veduta) | CC BY-SA 4.0 (фото Bini) | 2000×1309 |
| `foto-rzym-piranesi` | Brotherhood `miasto` | Piranesi-17029 (Colosseo) | PD | crop 2/2/3/12 % → 2000×1133 |
| `foto-leonardo-czolg` | Brotherhood `bractwo` | Leonardo, Studies of military tank-like machines (BM, cropped) | PD | 2000×1410 |
| `foto-kopernik` | Brotherhood `dodatki-i-znajdzki` | Nikolaus Kopernikus MOT | PD | crop top 10 / bottom 40 % → 1832×1145 |
| `foto-monteriggioni` | Brotherhood `wydania` | Monteriggioni-panorama1 | CC BY-SA 3.0 | 2000×1151 |
| `foto-paryz-1739` | Unity `paryz` | Turgot map Paris KU 11 | PD | 2000×1208 |
| `foto-samarra` | Mirage `bagdad` | Samarra, Iraq (Chris Hoare) | CC BY 2.0 | crop bottom 8 % → 2000×1206 |
| `foto-hegra` | Mirage `od-rift-do-doliny-pamieci` | Mada'in Saleh 2017 | CC BY-SA 4.0 | crop bottom 8 % → 2000×1228 |
| `foto-nowy-jork-1750` | Rogue `komu` | Canot, South East View of the City of New York (Yale) | CC0 | 1920×1219 |
| `foto-akka` | Bloodlines `fabula` | Akka, Crusader sea wall, 1920–1933 (American Colony) | PD | crop top 12 % → 2000×1307 |
| `foto-psp` | Bloodlines `wersje` | Psp-1000 (Evan-Amos) | PD | 2000×1135 |
| `foto-bitwa-morska` | Pirates `co-to-jest` | Samuel Scott, Wager's Action off Cartagena, 1708 | PD | 2000×1398 |
| `foto-la-buse` | Pirates `fabula` | Cryptogramme de La Buse | PD | crop top 15 / bottom 30 % → 1160×702 (мастер < 2000) |
| `foto-karaiby-mapa` | Pirates `wersje` | 1737 Homann Heirs — D'Anville, West Indies | PD | crop 2/2/27/25 % → 2000×1194 |
| `foto-nintendo-ds` | Discovery `wydania-i-dla-kogo` | Nintendo-DS-Lite-Black-Open (Evan-Amos, PNG → JPEG) | PD | crop 10/10 % → 2000×1350 |
| `foto-stonehenge` | Mapa `anglia-wikingow` | Stonehenge 2011 2 | CC0 | crop 12/12 % → 2000×1032 |
| `foto-delfy` | Mapa `grecja-i-egipt` | Delphi, Tholos 2015-09 (2) | CC BY-SA 4.0 | 2000×1319 |
| `foto-signoria` | Rodowód `jak-laczy-sie-z-dwojka` | Palazzo Vecchio — Piazzale Michelangelo (Galeotti) | CC BY 4.0 | 2000×1328 |
| `assassins-creed-rodowod` | герой | Florence1493 (Schedel) | PD | 2000×1003 |
| `assassins-creed-ii-wojna-swiatowa` | герой | American troops … crossing Westminster Bridge (NARA 530734) | PD | crop 1/1/1/5 % → 1882×1424 |
| `foto-paryz-1940` | II wojna `dlaczego-trudno` | Bundesarchiv Bild 146-1994-036-09A | CC BY-SA 3.0 de | **800×504** |

Подвал по странице (П57 п. 1 б) печатает атрибуции только там, где ключ
использован: новых у Brotherhood — четыре (всего пять), у Pirates — три
(всего пять), у главной и Black Flag — как было (контрольные съёмки это и показали). Три атрибуции несут
поле автора как отдало Commons: «Unknown author Unknown author» (Kopernik),
«Unknown author Unknown author or not provided» (NARA), «Unknown Unknown»
(Bundesarchiv) — то же, что у прежних записей;
чистка — бэклог 50.

# 7. Найденное по ходу — строкой, не правкой (бэклог 50)

- **Тексты двух страниц расходятся в годе переправы Eivor:** `eivor.md`
  («lata 872–878», «Rok 872 odwraca układ … Sigurd wybiera Anglię») против
  `assassins-creed-valhalla.md` («W roku 873 … wyprowadzają», meta
  «Anglia · 873»); корпус (pl/en.wikipedia) — 873. Правка текста —
  процессом П42, не этой сессией.
- **Файлы витрины Steam с дефектами края:** Unity [4] — две белые строки
  внизу; Rogue [1] — чёрный крайний столбец; Dawn [1] — серый крайний
  столбец; `fetch-game-art.mjs` их не режет (кропа у Steam-кадров нет).
- **Поле автора Commons** приходит с мусором: сноски-абзацы (гравюры
  Чёрной Бороды), URL (карты Geographicus), дубль «Unknown author Unknown
  author» (`stripHtml` склеивает два узла `Artist`); подвал печатает как
  есть. Место — `fetch-art.mjs` (ядро) или поле `author` в слоте.
- **`fetch-art.mjs --kandydaci --force` не чистит папку кандидатов:**
  прежние миниатюры остаются под старыми номерами, лист показывает их
  вперемешку (foto-paryz-1940 — пришлось удалить папку рукой).
- **`--kandydaci` ищет по `must` в заголовке файла:** «Nuremberg Chronicle
  Florence» не нашёлся, пока в `must` не попали `florencia`/`schedel` —
  словарь заголовков Commons многоязычный.
- **Флаг `games.json` «znak wodny 0–5» у Syndicate** был шире факта —
  поправлен (в объёме, конвейер); прочие `uwaga` не перепроверялись.
- **Повторы между страницами** (раздел 2 п. 7) — шесть кадров Steam
  и ключ Commons `discovery` на двух страницах; ключ `foto-nowy-jork-1750`
  назван по плановому «≈ 1750», подпись и атрибуция — ≈ 1760 (Canot).
- **Кадров современности нет ни на одной витрине Steam** — ряды `desmond`
  (AC3, столбец), `watek-wspolczesny` (AC1, AC2, od-czego — кадры эпохи).
- **Зерно героя игры на полном 390** — один прогон из четырёх (kB),
  побайтово равен эталону в остальных; кандидат в зону только при повторе.
- **Витрина Chronicles India/Russia** даёт имена «Assassin’s Creed®
  Chronicles: India/Russia» — печатаются подвалом только страницы
  Chronicles; в `game-art.json` игр стало 20.
- **`input/kadry/commons/`** — 22 папки кандидатов и листы
  `arkusze/commons-*.jpg` (вне git), как у Steam.
- Бэклог 47 п. 1 (карточки хаба `/poradniki/` с условными ключами) — теперь
  у od-czego-zaczac и za-darmo есть свои кадры (`assassins-creed-mirage-k00`,
  `karaiby-k03`); замена ключей карточек — правка `poradniki.md`, не в объёме.
- Бэклог 47 п. 5 (ложный текст галереи Liberation «zrzutów … nie ma») —
  кадры пачки B на странице есть, текст не правился (содержание).

---

# Гейты и проверки

| Проверка | Результат |
|---|---|
| `npm run accept` | 225/225, `exit=0` |
| `npm run gates` / `npm run build` (`4f34e1f`) | 4/4; `exit=0`, 32 страницы; `h1` 32, `kotwice` 32, `linki` 979, `korytarz` 28 + 4 null, `art` 52/150/29; сборка после каждой пачки — зелёная |
| коридоры героев | Eivor 4524 [3348, 4530], Rodowód 4591 [3900, 5276], II wojna 3641 [2718, 3678], od-czego 12345 [7675, 12500] — все в коридоре, числа коридоров не менялись |
| `npm run tree` | воспроизвёл `structure.json` четыре раза, diff — только страница с новым блоком (`source: manual`, первым по порядку) |
| `npm run gameart` | 35 + 29 файлов «pobieram», `Pobrano`, хеши/индексы сошлись; `gameart:check` после — «pominiete … plik juz jest» на всех |
| `npm run art` | 22 слота по `file`, лицензии из `ALLOWED`, `art-credits.json` после каждого слота; 429 Commons — повторы инструмента, один обрыв на кандидатах (перезапущено) |
| подбор кадров | каталог 156 кадров; A: 11 судей, 44 назначения, 2 отказа проверки (Syndicate [8], Unity [4]); B: 6 судей, 22 назначения, 11 отказов проверки: 6 — по ошибочной зоне 12 % (перечитаны, приняты, два alt поправлены), 3 — по зоне 4,5 % (Valhalla [3], Rogue [2], Liberation [4] — приняты ведущим с оговоркой), 1 — Dawn [1] дефект файла вне cover (принят), 1 — Rogue [1] контур цели (отказ подтверждён) |
| лиды героев | 12 линз: 1 stop (872 → снят), 5 fix (повтор первого ряда у четырёх, двусмысленность у II wojna — первые фразы переписаны), противоречий корпусу после правки нет |
| контрольные съёмки | kA 0/0 `exit=0`; kB игра `exit=1` (зерно героя 390) → kB2 0 различий, байты = эталон; kB главная `exit=0`; kC 0/0 `exit=0` |
| `dist/` | `.skyline` 0 (гейт `art`); alt на страницах — из `opis`/`subject`, повторов alt внутри страницы нет там, где кадры разные |
| `git ls-files --eol` | `i/` = `w/`: `games.json`, `art.json`, `*.md` содержания, `fetch-game-art.mjs` — CRLF; `game-art.json`, `art-credits.json`, `pages-s2.json`, `structure.json`, доклад и папка — LF; `sed -i` не применялся; правки JSON/YAML — скриптами прямой записи (`narzedzia/`) с проверкой отсутствия голых LF и round-trip сериализатора `games.json` |
| `git status` | чисто после каждого коммита; `input/kadry/`, `.playwright-mcp/` игнорируются; 29 коммитов запушены по одному |

---

# Факты, важные будущим сессиям

1. **Витрины Steam беднее, чем кажутся по числу кадров:** после HUD, крови,
   знаков, инфографики и промо-рендеров чистых остаётся 30–60 % (Shadows
   3/9, Rogue 3/5, Liberation 3/7, Valhalla 3/5, Mirage 5/10, AC1 7/11);
   считать по каталогу, не по счёту.
2. **Рамка 21:13 режет 4,5 % ширины у 16:9** — это единственная зона среза;
   «12 %» относится только к кадрам 2,12:1. Ошибка в задании проверяющим
   стоила семи ложных отказов — формулировать зону числом на кадр.
3. **Дефекты файлов витрины по краям** (белые/чёрные/серые крайние строки
   и столбцы) существуют у трёх игр; видимы только по горизонтальным
   краям (высота не режется) — проверять крайние строки числом.
4. **Powtórka kadru между страницами** — рабочий приём при тесном запасе
   (Valhalla/Eivor, BF на трёх страницах тем); внутри страницы — нет.
5. **Commons `Artist` — не имя:** сноски, URL, дубли; выбирать файл
   с учётом того, что подвал напечатает поле дословно.
6. **Портреты и картины в дуотоне** (Kopernik crop к лицу, Savonarola,
   Piranesi, Leonardo, Catena, kryptogram, Kronika Norymberska как герой) —
   на страницах стоят; светлые рисунки (Леонардо) дают самый яркий блок
   ряда — взгляд владельца.
7. **Лид героя — не коллаж рядов:** все четыре черновика линза стиля
   вернула за дословный повтор первого ряда; факт из двух рядов (год)
   корпус может опровергнуть — проверять и корпусом.
8. **Коридор Eivor впритык (запас 6):** любая правка лида длиннее —
   именованное решение по коридору (П43 п. 2).
9. **Зерно героя на полном 390 у игры** — один прогон из четырёх; правило
   «три прогона» остаётся страховкой и для контрольных съёмок: при
   `exit=1` без правок судьи — повторить прогон прежде чем искать причину.
10. **Git Bash подменяет аргумент `/url/` путём** (`C:/Program Files/Git/...`) —
    `MSYS_NO_PATHCONV=1` перед `node`.

---

# Открытые вопросы

## Технические — решены

- Зона среза для проверки — 4,5 %; семь отказов пачки B перечитаны
  ведущим, два кадра приняты с оговоркой (раздел 2 п. 1).
- Кадры с дефектом файла: видимый (Unity [4]) — отказ; невидимый в рамке
  (Dawn [1]) — принят; вместе с контуром цели (Rogue [1]) — отказ.
- Три отказа проверки по зоне 4,5 % (Valhalla [3], Rogue [2], Liberation [4])
  приняты ведущим: у среза — второстепенные фигуры или части фигур;
  два alt Freedom Cry и один Liberation поправлены по замечаниям проверки.
- Замена `kim-jest` Eivor — Valhalla [1] при срезе кисти краем мастера.
- Brotherhood — [11] на `fabula`, четыре Commons (перестановка судьи).
- Rogue — три столбца (один под героем, два парой), Commons на `komu`.
- Commons с «грязным» автором заменены (La Buse, Homann).
- Год из лида Eivor снят; три первые фразы лидов переписаны.
- Кадры повторяются между страницами там, где витрина пуста (7 пар).
- Контрольная съёмка kB — повторена, зерно; эталон не тронут, зон нет.
- `uwaga` londyn в `games.json` поправлена по факту (конвейер, в объёме).

## Политические — владельцу (стоп глазами не требуется планом; выкладка — п. 1)

1. **Выкладка (П58 п. 1 «когда всё готово»):** готово — 26 страниц с кадрами,
   четыре героя, судьи не тронуты, гейты 4/4, accept 225/225. Кнопка
   «Deploy ac4bf-thewatch.com» → ветка `phase-4` (`4f34e1f` + доклад);
   предохранитель П52 п. 3 не тронут, `main` не трогается. Живой сайт —
   `870b8bd`. **Рекомендация — выложить и смотреть живьём;** папка
   `2026-09-16-paczki-abc/` даёт полные кадры восьми страниц (четыре героя
   1440/390, Brotherhood, Pirates, Mirage, Chronicles) для взгляда до кнопки.
2. **Взгляды по классу Commons в дуотоне** (план, вопрос 7): картины
   и гравюры (Savonarola, Catena, Piranesi, Leonardo, Homann, kryptogram),
   портрет с кропом к лицу (Kopernik), герои-гравюра (Rodowód) и герой-фото
   1917 (II wojna), продуктовые снимки консолей (PSP, DS) — принять или
   назвать, что снять (ряд вернётся столбцом или получит другой кадр).
   **Рекомендация — принять как собрано:** дуотон уравнивает картину,
   гравюру и фото в один класс графики (DESIGN.md), как у фото эпох.
3. **Четыре столбца закрываемы «малой кровью» или дефектом файла** —
   только по слову владельца: Revelations `wersje-i-dodatki` ← [4] (всплеск
   у шеи янычара); Unity `premiera-i-wydania` ← [0] (пятно под гильотиной),
   `komu` ← [4] (две белые строки внизу — видны); Liberation
   `co-to-za-gra` или `wydania` ← [3] (полоска крови на брусчатке — один
   ряд). Не столбец, но того же класса: Dawn `fabula` мог бы нести [3]
   (дословные «Muspelowie», лезвие топора срезано мастером) вместо [2].
   **Рекомендация — оставить столбцы**, правило «кровь — не брать» держать.
4. **`foto-paryz-1940` 800 px** (Bundesarchiv) на ряду `dlaczego-trudno` —
   оставить (мягче на Retina) или столбец. Рекомендация — оставить: сюжет
   ряда именно этот, крупнее в свободных лицензиях нет.
5. **Расхождение 872/873** между `eivor.md` и `assassins-creed-valhalla.md`
   (корпус — 873) — правка текста Eivor по П42: (а) отдельной правкой сейчас
   / (б) в следующей волне текстов. **Рекомендация — (б):** лид уже без
   года, на страницах спорят два ряда, не заголовки.
6. **Переносятся без ответа:** тип 404, `noindex`, приёмка П53 п. 1–3,
   лист второго сайта, `/404/` глазами, сайт в сети раньше ящика, бэклог
   47 п. 9, бэклог 49 (при следующем событии вида), бэклог 47 п. 1 и 5
   (карточки хаба, текст галереи Liberation — теперь есть чем закрыть).
7. **Вливание `phase-4` в `main`** — на приёмке, решение владельца.

**Дальше — по команде владельца (выкладка кнопкой, вливание); без команды
не идти.**

---

# Записи, обещанные этой сессией — по П36

| Что | Где | Источник |
|---|---|---|
| конвейер A (35 Steam + 9 Commons), `hashZrzutu` для старых карт, `uwaga` londyn | `2b8ede5` | план разд. 2–3, находка |
| 11 страниц пачки A | `73ecf62 … bc8ff83` | план разд. 4, П57 п. 2 |
| конвейер Commons B+C (12), Steam B+C (29), `foto-signoria` | `4392640`, `8a3413d` | план разд. 2–3, бэклог 48 |
| 7 страниц пачки B, герой Eivor + замена `kim-jest` | `b6aa55b … d84e6c6` (`18e655d` — Eivor со структурой) | план разд. 4–5, П57 п. 3 |
| 8 страниц пачки C, герои Rodowód, II wojna, od-czego, кадр za-darmo | `b5d2a46 … 4f34e1f` | план разд. 4–5, П57 п. 3, бэклог 48 |
| таблица «ряд → кадр → почему», решения ведущего, столбцы | этот доклад, разделы 2, 4 | план разд. 10, П44 |
| лиды героев — отчёт помеченного | раздел 3; `dobor-sedzia.md` раздел C | П42 п. 2 |
| журналы подбора, каталог кадров, журналы `check`, инструменты прямой записи, кадры для глаз | `docs/reports/2026-09-16-paczki-abc/` | план разд. 2 п. 4, инвариант 1 |
| бэклог 50 | `docs/BACKLOG.md` | находки |
| команда «старт 3», двенадцать решений исполнителя (десять раздела 2 + столбцы раздела 4 + съёмка kB раздела 5) | дополнение к П58 в `DECISIONS.md` (исполнитель, статус — приёмка глазами по выкладке) | CLAUDE.md «что решаешь сам» |

**Обещано и НЕ сделано:** выкладка — кнопка владельца (П58 п. 1); всё
остальное из объёма сессии 3 сделано. Вне объёма и не тронуто: тексты
(872/873, галерея Liberation, карточки хаба), `frames.mjs` (пункт 19),
генератор (бэклог 49), `fetch-art.mjs` (автор, `--force`).
