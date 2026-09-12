# 2026-09-12 · План содержания `/assassins-creed-valhalla/` до текста (П46); правило «эталон равен сборке» закреплено; эпохи пачки 2 проставлены

Ветка `phase-3`, вершина на старте — `fe6318b` (доклад пачки 3), дерево
чистое, подтверждено. На финале — см. последний коммит; всё запушено.
Объём — П46: (1) закрепить правило приёмки в `11_PRIEMKA` и README
эталона; (2) `era` семи страниц пачки 2 одной правкой; (3) **Valhalla —
план содержания до текста, планом-докладом; дальше без команды не идти.**
Текст Valhalla **не написан** — это и есть исполнение.

---

## Первой строкой, как велит П33

**`npm run accept` — `201/201`, `exit=0`. `npm run gates` — `4/4`, `exit=0`.**
`npm run build` — `exit=0`, 25 страниц, четыре сторожа результата зелёные:
`h1: 25`, `kotwice: 25`, `linki: 25 stron, 753 linków`, `korytarz: 25 stron —
w korytarzu 22, bez korytarza 3`. `astro check` — 0 ошибок, 0 предупреждений
(два хинта `ts(6133)/ts(6198)` в `tools/fetch-corpus.mjs` — старые, вне
правок). Пиксельная приёмка не снималась: правки этой сессии — документы,
семь полей `era` на страницах без эталона и план; эталонные кадры главной
и Black Flag правки не касаются (проверено: страницы не трогались).

## Сверка открытых вопросов прошлого доклада — по П38

Три политических вопроса доклада пачки 3 — все закрыты П46:
(1) не-судьи и два правила → «эталон равен сборке», реестр пуст по правилу,
`ne-sudyi.json` — печать для карты диффов; (2) зона 4 — принята как
записана; (3) эпохи семи страниц пачки 2 — да, одной правкой. Список
записей П36 прошлого доклада — все на месте (П45, `szum.mjs`/`szum.json`,
`era`, девять текстов, папка доклада).

---

# Что сделано

## 1. П46 записан; правило приёмки закреплено (`197e543`)

`DECISIONS.md` — П46 с ответами владельца дословно и следствиями.
`docs/11_PRIEMKA.md` — абзац П45 дописан: правило одно — «эталон равен
сборке», между эталоном и сборкой только зоны `szum.json`, реестр README
пуст по правилу, `ne-sudyi.json` — печать для карты диффов, кода не меняет.
`_baseline/README.md` — «Файлы рядом с кадрами» (не-судьи) и «Реестр
принятых расхождений»: правило «не нулём, а включением» помечено прежней
редакцией 2026-09-09 → 2026-09-12 и объясняет истории; строка таблицы —
«реестр пуст по правилу П46». Проза везде описывает код как есть: печать
не-судей и `exit` по зонам не менялись.

**Строкой, не правкой:** шапки `core/accept/frames.mjs` (строки 66–70)
и `szum.mjs` (44–46, 253) по-прежнему зовут вопрос о не-судьях «вопросом
владельцу». Правка комментария судьи — с ближайшей правкой судьи, чтобы
не заводить состязательную проверку ради комментария (инвариант 1).

## 2. `era` семи страниц пачки 2 (`acfd329`) и бэклог 37 (`3b22478`)

По спискам `guides` главной (`site.ts`): `bloodlines` → `jerozolima`;
`brotherhood`, `revelations`, `ezio-auditore` → `wlochy`; `freedom-cry`,
`rogue`, `pirates` → `karaiby`. Семь файлов, по одной строке, CRLF сохранён
(`git ls-files --eol`: `i/crlf w/crlf`, `git add --renormalize .` ничего
не тронул). В сборке ряды семи страниц несут `layer--<эпоха>`; у Revelations
ряд `fabula` держит свой `jerozolima` — эпоха ряда старше эпохи страницы,
как записано в маршруте. **Эталонный кадр не тронут:** у семи страниц
эталонов нет, Black Flag не правился. Бэклог 37 закрыт.

## 3. План содержания `/assassins-creed-valhalla/` — ниже, целиком

---

# План содержания `/assassins-creed-valhalla/`

## Рамка из контракта (не меняется, заполняется)

| Поле | Значение |
|---|---|
| тип | `game`; **без `byline` и без `toc`** — `blocks[]`: `hero-key-art · story-row · gallery · verdict-box · link-list · cta-band` |
| h1 | Wikińska Anglia w Assassin’s Creed Valhalla: od czego zacząć |
| title | Assassin’s Creed Valhalla — poradniki, regiony i znajdźki |
| description | Wyprawa Eivora do Anglii w Assassin’s Creed Valhalla: kolejność regionów, rozbudowa osady, walka i buildy, a także to, na co uważać na starcie. |
| коридор | **3425–4633** знака без пробелов (анатомия: 13 документов, 11 хостов, медиана 4029; h2 медиана 4) |
| запросов / объём | **270 / 21 090 в месяц** — четверть семантики волны 1 |
| related (из структуры) | `/assassins-creed-valhalla/eivor/`, `/assassins-creed-valhalla/dawn-of-ragnarok/`, `/assassins-creed-odyssey/`, `/assassins-creed-mirage/` |
| арт | `assassins-creed-valhalla` (ключевой арт Steam, appid 2208920); для второго кадра — `dawn-of-ragnarok` |
| `era` | **нет**: Англия IX века вне пяти эпох — ряды в `--accent` по правилу (П45) |
| судья вида | эталон страницы игры (Black Flag), новых кадров не нужно |

## Чего просит спрос — 270 запросов по намерениям

Полная раскладка с каждым запросом и объёмом —
**`docs/reports/2026-09-12-valhalla-plan/klucze-po-sekcjach.md`**.

| Группа | Запросов | Объём | Доля | Где на странице |
|---|---:|---:|---:|---|
| имя игры (`assassin creed valhalla` 9900, `acvalhalla` 2400, `asc valhalla` 2400, `assassin valhalla` 1300…) | 16 | 16 560 | **78,5 %** | h1, lead, секция 1 |
| платформы (PS5 390, PS4 320×3, Xbox, Series S; PS3/X360/Nintendo — «нет») | 79 | 2 830 | 13,4 % | секция 4 |
| PC, магазины, подписки (Steam 140+70, PC 110, Uplay/Ubisoft Connect, Epic, GOG, Game Pass, Ubisoft+, PSN, cena, za darmo, gold/complete/deluxe) | 65 | 900 | 4,3 % | секция 4 |
| в игре (orlog, zeloci, włócznia Leonidasa, osada, konstruktor, anomalia, Gunnar, Tekla, Holger, Bjorn, Alvar, Edwin, warzyciel, multiplayer, 100 %) | 26 | 290 | 1,4 % | секции 3 и 5 |
| техника (dlss, 4k/60fps, dx11, GB, Windows 8.1, 21:9, Dolby Vision, PEGI/18, pl/po polsku) | 23 | 240 | 1,1 % | секция 4 |
| другие игры (Odyssey, Mirage, Discovery Tour, Ezio, «valhalla 2», «assassin creed v») | 11 | 130 | 0,6 % | секции 5–6, `link-list` |
| версии и патчи (1.1.2 … 1.6.2 и консольные 5.10 … 7.20, dlc 1/2, 2022, 2023) | 43 | 70 | 0,3 % | секция 5, один абзац |
| медиа (youtube, eurogamer) | 3 | 30 | 0,1 % | нигде отдельно |
| не обслуживается (elamigos, ppsspp, kody) | 4 | 40 | 0,2 % | нигде — П42: факты, не читы и не пиратство |

**Вывод для раскладки.** Четыре пятых объёма — имя игры: страница прежде
всего обязана ответить «что это за игра», как отвечают все принятые
страницы игр. Второй по весу вопрос — **на чём и где** (18 % вместе):
одна секция целиком. Хвост в 200 запросов по 0–20 в месяц — 43 номера
версий, имена жителей осады, Orlog, зелоты — закрывается не секцией
на запрос, а **одним абзацем на группу**, чтобы точные формы встречались
в тексте (покрытие ключей у пачек 2–3 было 1–2 формы на страницу — здесь
можно больше без ущерба голосу).

## Как это раскладывается в коридор

`main` без `toc` и `byline` (≈ −300 против Odyssey). Бюджет знаков
без пробелов при потолке 4633: h1 + lead ≈ 290; галерея (заголовок, lead,
две подписи) ≈ 200; вердикт ≈ 450; заголовок и четыре ссылки `related` +
призыв ≈ 250. **На ряды остаётся ≈ 3 440 → пять рядов по ≈ 690**
(заголовок + meta + два коротких абзаца), плотность как у Odyssey
(5402 при шести рядах с оглавлением). Цель черновика — **4 400–4 600**.

## Ряды — пять

| # | `id` · `year` | Заголовок ряда (PL) | Что в двух абзацах | Запросы | ≈ знаков |
|---|---|---|---|---|---:|
| 1 | `co-to-za-gra` · `2020` · арт `assassins-creed-valhalla` | Dwunasta część serii — klan Kruka w Anglii IX wieku | (а) премьера 10 XI 2020 (PS5 — 12 XI), платформы старта, Ubisoft Montréal и 14 студий, AnvilNext 2.0; Англия 873 года, Eivor и брат Sigurd, Ukryci против Zakonu Starożytnych, Ælfred; выбор пола и переключение Animusem (канон); (б) приём — Metacritic 80–84, GOL 8/10 («najlepsza z erpegowych»), продажи — лучшая первая неделя серии, второй по доходу тайтл Ubisoft (> 1 mld USD); Layla замыкает нить Origins–Odyssey. Ссылка на `/eivor/` — история Eivora там | имя (78,5 %), 2020, youtube | 800 |
| 2 | `anglia-i-osada` · `873` · без кадра (столбец, П44) | Norwegia, Anglia i Krucza Przystań: kolejność regionów i osada | (а) Norwegia как пролог, потом Англия: регионы с **sugerowaną mocą** — старт Ledecestrescire/Grantebridgescire, дальше по возрастанию; Lunden, Wincestre, Jórvík; Asgard/Jotunheim в видениях; (б) осада Ravensthorpe — первая с Black Flag, что значит для игры: кузнец **Gunnar** (класс предметов, руны), **Tekla** — warzyciel, **Holger** — поэт («Wina i kara»), konstruktor, wieczerze; ресурсы — с najazdów; «rzeczne najazdy» — бесплатное обновление. Что первым строить — кузня (eurogamer) | osada, konstruktor, gunnar, tekla, holger, warzyciel, bjorn/alvar/edwin (если корпус подтвердит, кто это) | 720 |
| 3 | `walka-i-aktywnosci` · `Orlog` · без кадра | Walka, skradanie, orlog i zeloci — na co uważać na starcie | (а) две брони любого оружия, ukryte ostrze вернулось, wzrok Odyna и ворон Sýnin, drzewko zamiast poziomów, 25 archetypów wrogów; drakkar призывается у любой воды; **multiplayer — нет**, jomswikingowie как обмен отрядами; (б) активности: **Orlog** (кости), flyting, picie; **zeloci** — охотники Zakonu, трое несут tabliczki do Excalibura; **anomalie Animusa**; 100 % — 149 h по HLTB (eurogamer), 168 h по статистике GOL | orlog, zeloci, anomalia, multiplayer, 100 | 720 |
| 4 | `platformy-i-wersje` · `2020–2024` · без кадра | Platformy, sklepy, edycje i wymagania: PS4/PS5, Xbox, PC | (а) PS4/Xbox One с **darmowym ulepszeniem** до PS5/Series (4K/60 на PS5 и Series X); **нет** PS3, Xbox 360, Switch/Nintendo (частые запросы — ответ прямо); polskie napisy, angielskie głosy; PEGI 18; (б) PC: старт на Ubisoft Connect (Uplay) и Epic, **Steam с 6 XII 2022**; GOG/Origin — нет; требования — 160 GB и Windows 10 (Windows 8.1 — нет), только DX12 (dx11 — нет); edycje Standard / Gold (season pass) / Ultimate/Valhalla / Ragnarök, потом Complete; подписки — Ubisoft+, Game Pass (январь 2024), PS Plus Extra; «za darmo» = darmowe weekendy i Discovery Tour | платформы + PC/магазины + техника (≈ 19 % объёма, 167 запросов) | 760 |
| 5 | `dodatki-i-aktualizacje` · `2021–2023` · арт `dawn-of-ragnarok` | Dodatki, darmowe aktualizacje i numery łatek | (а) przepustka: **Gniew druidów** (13 V 2021, Irlandia), **Oblężenie Paryża** (12 VIII 2021); **Świt Ragnaröku** (10 III 2022, osobna strona); darmowe: Rzeczne najazdy, Mistrzowskie wyzwania, Grobowce poległych, **Opowieści ponad czasem** (14 XII 2021, spotkanie z Kasandrą; **Włócznia Leonidasa** — skrzynia na Isle of Skye), Zapomniana saga, **Ostatni rozdział** (TU 1.6.2, XI–XII 2022), Discovery Tour: Epoka wikingów (osobno, 19 X 2021); (б) numeracja: Ubisoft liczy **Title Update 1.0.2 → 1.6.2**, ostatni **1.7.0** (21 II 2023; łatka pod Windows 11 24H2 — I 2025); konsole pokazują własne numery **5.x–7.20** (7.10 = TU 1.6.1, 7.20 = TU 1.6.2); dlc 1/2 = druidzi/Paryż; Mirage wyrósł z planowanego dodatku, crossover z Basimem w 1.6.2 | версии и патчи (43), dlc, discovery tour, odyssey, mirage, włócznia leonidasa, 2022/2023 | 760 |

Суммарно ряды ≈ 3 760 — на 300 выше бюджета 3 440; резать при черновике
будут абзацы (а) рядов 1 и 4, где факты дублируют галерею/вердикт;
если после линз текст > 4633 — см. вопрос 1 владельцу.

**Порядок рядов** — от имени к покупке к дополнениям: читатель с запросом
«assassin creed valhalla ps5» доходит до ответа за один экран прокрутки
после героя; читатель по имени получает «что это» первым. Ряды 2–3 —
исполнение обещания h1 («od czego zacząć», «kolejność regionów»,
«rozbudowa osady», «walka», «na co uważać») — стоят до магазинов, потому
что h1 их обещает раньше, чем `title` обещает «poradniki».

## Остальные блоки

- **Hero.** `lead` ≈ 250: двенадцатая часть, 2020, Eivor и клан Kruka
  из Норвегии в Англию 873 года, RPG-линия после Origins и Odyssey,
  самая большая игра серии. `primary` → `#co-to-za-gra` «Co jest w grze»;
  `secondary` → `/poradniki/od-czego-zaczac/` «Od czego zacząć serię»
  (образец родительских страниц: Odyssey, Mirage; дочерние ведут к родителю).
- **Галерея** (`gallery`, анатомия 8/13): два кадра материала издателя —
  ключевой арт Valhalla и арт Świt Ragnaröku с подписью «największy dodatek
  serii, osobna strona»; `lead` по образцу («zrzutów ekranu w materiale
  wydawcy nie ma»).
- **Вердикт** (`verdict-box`, 7/13; П28 — словами, без балла), ≈ 450:
  (1) для кого — кто хочет самую большую игру серии и осаду как центр,
  99 h основной + побочные, 149 h на 100 % (HLTB через eurogamer),
  86/168 h по статистике GOL; лучшая из RPG-линии по GOL; (2) начинать
  ли серию с неё — нет: Rock Paper Shotgun назвал её слабой точкой входа,
  Mirage (861 год, Basim) — приквел и короче; для нити Layli — после
  Origins и Odyssey; проводник даёт два порядка.
- **`related`** печатается из структуры (четыре адреса выше); заголовок
  «Powiązane strony». **Призыв** — единственная цель П29: проводник.
- **Оглавления и подписи нет** — контракт; якоря рядов остаются
  (`#co-to-za-gra` для `primary`).

## Факты, которые пойдут в печать, и где они подтверждены

Все — в корпусе кластера (`input/corpus`, 278 документов Valhalla); линза
фактов получит этот список и **все 24 принятых текста** (Odyssey, Mirage,
Origins, Dawn of Ragnarök, проводник — с ними пересечения по Layli,
Basimowi, Crossover Stories, Discovery Tour).

| Факт | Источник в корпусе |
|---|---|
| премьера 10 XI 2020; PS5 — 12 XI; перенос с 17 XI под старт Xbox Series | pl.wikipedia, en.wikipedia, gry-online (энциклопедия) |
| Ubisoft Montréal + 14 студий; AnvilNext 2.0; Ismail ушёл в VI 2020, McDevitt — сценарий | pl.wikipedia |
| 873 год, Eivor Wilcza Paszcza, Sigurd, Kjotve, Styrbjorn, Basim i Haytham, Ukryci / Zakon; Ælfred; Lunden, Wincestre, Jórvík; Asgard, Jotunheim | pl.wikipedia |
| пол Eivora и переключение Animusem — канон; polskie napisy, angielskie głosy | gry-online (энциклопедия) |
| осада возвращается впервые с Black Flag; ресурсы с najazdów; wieczerze +3 h | pl.wikipedia; gry-online «osada» |
| Gunnar — kowal (класс предметов, руны), что строить первым | eurogamer «co budować najpierw» |
| Tekla — warzyciel; Holger — «Wina i kara»; Bjorn, Alvar, Edwin | gry-online «napój Piktów», «wina i kara»; **Bjorn/Alvar/Edwin — проверить, кто они, до печати; не подтвердится — имена не печатаются** |
| zeloci: трое (Wotan, Hrothgar, Heike) несут tabliczki do Excalibura; 11 tabliczek | gry-online (форум путеводителя) |
| Orlog, flyting, picie, układanie kopczyków; drakkar у любой воды; multiplayer — нет | pl.wikipedia; gry-online |
| Metacritic 80–84; GOL 8/10; IGN 8; Game Informer 9,25; RPS — слабая точка входа | pl.wikipedia |
| лучшая первая неделя серии; > 1,8 mln do 17 XI 2020; drugi najbardziej dochodowy tytuł Ubisoft, > 1 mld USD | pl.wikipedia |
| darmowe ulepszenie PS4 → PS5, Xbox One → Series; 4K/60 на PS5 и Series X | pl.wikipedia; eurogamer «4K i 60 FPS również na PS5»; gry-online «darmowa aktualizacja na PS5» |
| PC: Epic + Ubisoft Connect, **Steam 6 XII 2022**; Stadia до 18 I 2023; Luna | en.wikipedia; gry-online (патч 1.6.2) |
| wymagania: 160 GB, Windows 10 64-bit; GTX 960 / RTX 2080 для 4K/30 | gry-online (энциклопедия); ubisoft help «system requirements» |
| edycje: Standard, Gold (season pass), Valhalla/Ultimate, Ragnarök; Complete — позже | en.wikipedia; store.ubisoft (Deluxe, Kompletna, Ragnarök) |
| Game Pass — январь 2024; PS Plus Extra/Premium; Ubisoft+ | eurogamer.net; gry-online (метки) |
| Gniew druidów 13 V 2021; Oblężenie Paryża 12 VIII 2021; Świt Ragnaröku 10 III 2022, ≈ 35 h; Discovery Tour 19 X 2021, osobno | pl.wikipedia; gry-online news |
| Rzeczne najazdy 16 II 2021; Mistrzowskie wyzwania 15 VI; Grobowce poległych 9 XI; Opowieści ponad czasem 14 XII 2021; Zapomniana saga 2 VIII 2022 | pl.wikipedia |
| Włócznia Leonidasa — skrzynia на Isle of Skye (Crossover Stories) | gry-online «crossover stories — wyposażenie Isle of Skye» |
| TU 1.6.2 — Ostatni rozdział, вышел раньше срока (29 XI вместо 6 XII 2022); последний для Stadia; TU 1.7.0 — 21 II 2023; łatka 1.7.0 pod Windows 11 24H2 — I 2025 (≈ 500 MB) | ubisoft news (TU 1.6.2, 1.7.0); gry-online news |
| консольные номера: 7.10 = TU 1.6.1 (27 IX 2022), 7.20 = TU 1.6.2 (29 XI 2022) | mp1st (в корпусе, англ.) |
| Mirage — приквел (861), рос как дополнение к Valhalla; crossover в 1.6.2 | pl.wikipedia; gry-online news |
| 99 h / 149 h (HLTB); 86,4 / 167,7 h (GOL, статистика игроков) | eurogamer «jest za duże»; gry-online |

**Риски фактов — что печататься не будет, если корпус не подтвердит:**
`DLSS` (в игре его нет; корпус не подтверждает ни DLSS, ни FSR — запрос
закрывается абзацем «wymagania i ustawienia PC» без слова DLSS);
реальный размер установки после патчей (в корпусе — только «160 GB»
из требований, его и печатаем); точный день входа в Game Pass (в корпусе —
«первая волна 2024»; печатаем «w styczniu 2024» только если найдётся день,
иначе «na początku 2024»); Bjorn / Alvar / Edwin — кто это; `assassins
creed valhalla 2` — сиквела нет, отвечаем строкой про Mirage; `assassin
creed v` — читаем как «V = Valhalla», отдельно не обслуживаем.

## Способ написания — тот же, что у пачек 2–3

Один агент-черновик по этому плану, брифу `input/briefs/assassins-creed-valhalla.md`
и корпусу через читалку (только чтение); две линзы: **факты** — опровергнуть
каждое утверждение по корпусу, материалу издателя и **всем принятым
текстам** (расхождение с принятым — стоп); **форма и заимствования** —
YAML против схемы и `blocks[]` (без `byline`/`toc`!), ключи арта, адреса,
`year` ≤ 9 знаков, вердикт без балла, дословные совпадения окнами по 8 слов,
длина. Отчёт помеченного и выкинутого и покрытие ключей — в папку доклада
(П42 п. 2). Коммит один: `P4: текст assassins-creed-valhalla — N в 3425–4633…`.
Кадры не снимаются (судья — эталон игры), если владелец не попросит глазами.

---

# Гейты и проверки

| Проверка | Результат |
|---|---|
| `npm run accept` | 201/201, `exit=0` |
| `npm run gates` | 4/4, `exit=0` |
| `npm run build` | `exit=0`, 25 страниц; `after-build`, `anchors`, `links` (753), `corridor` (22 в коридоре, 3 `null`) |
| `astro check` | 0 ошибок, 0 предупреждений, 2 старых хинта (`tools/fetch-corpus.mjs`) |
| ряды семи страниц в `dist/` | `layer--jerozolima` ×5 (bloodlines), `layer--wlochy` (brotherhood 7, revelations 4 + `jerozolima` 1, ezio 5), `layer--karaiby` (freedom-cry 4, rogue 9, pirates 5) |
| `git ls-files --eol` | `i/` = `w/`: семь `.md` содержания CRLF, документы LF; `git add --renormalize .` не тронул ничего |

Коммиты: `197e543` (П46, правило), `acfd329` (`era` ×7), `3b22478`
(бэклог 37), далее — доклад.

---

# Факты, важные будущим сессиям

1. **Правило приёмки одно — «эталон равен сборке»** (П46): дифф вне зон
   `szum.json` — отказ; реестра нет; не-судьи — печать для карты диффов.
2. **Бэклог 37 закрыт**; `era` остаётся полем для будущих страниц из пяти
   эпох; Valhalla и темы пачки 4 — вне пяти.
3. **Valhalla:** 78,5 % объёма — имя игры; коридор 3425–4633 без `toc`
   и `byline`; пять рядов по ≈ 690; хвост в 200 запросов закрывается
   абзацами, не секциями. 43 номера версий — консольные 5.x–7.x против
   TU 1.x Ubisoft; `DLSS` в игре нет.
4. Читалка корпуса пачек 2–3 (`korpus.mjs`) в репозитории не лежит —
   каждая сессия пишет свою в scratchpad; кандидат на пункт бэклога
   (строкой, не правкой: объём).

---

# Открытые вопросы

## Технические — решены

- Секция версий и патчей — **один абзац в ряду 5**, не отдельный ряд:
  43 запроса при объёме 70; ценность — точные формы в тексте.
- `secondary` героя → проводник (образец родительских страниц).
- Хинты `astro check` в `tools/fetch-corpus.mjs` — вне объёма, не трогались.

## Политические — владельцу

1. **Коридор Valhalla 3425–4633 при 270 запросах.** План уложен в него
   пятью рядами (цель 4400–4600), но ряды в сумме на ≈ 300 знаков тяжелее
   бюджета. Варианты: (а) **держать коридор**, резать дубли фактов при
   черновике; если после линз текст > 4633 — предохранитель П43 п. 2
   именованным решением в докладе с причиной (четыре намерения без `toc`);
   (б) расширить заранее до ≈ 3425–5800 и дать версиям/патчам шестой ряд.
   **Рекомендация — (а):** анатомия честная (13 документов, `high`),
   а 78 % объёма — имя, которому длинная страница не нужна.
2. **Обещание h1 «od czego zacząć» и «kolejność regionów».** План читает
   его как **стартовые советы** (ряды 2–3: порядок регионов по sugerowanej
   mocy, что строить первым, на что смотреть в бою), а не как прохождение:
   поradnik-прохождение — отдельная страница волны 2 по данным Search
   Console (как «która najlepsza», П44). Подтвердить чтение или велеть
   иначе.
3. **Слово на текст.** «Дальше без команды не идти» — черновик Valhalla
   не начат; по слову владельца — одна сессия: черновик, две линзы,
   сборка, доклад пачки с отчётом помеченного и выкинутого.

---

# Записи, обещанные этой сессией — по П36

| Что | Где | Источник |
|---|---|---|
| вердикты владельца | **П46** `DECISIONS.md` | владелец |
| правило «эталон равен сборке», не-судьи — печать | `docs/11_PRIEMKA.md`, `_baseline/README.md` | П46 п. 1 |
| `era` семи страниц | `src/content/tresc/{bloodlines,brotherhood,revelations,ezio-auditore,freedom-cry,rogue,pirates}.md` | П46 п. 2 |
| бэклог 37 закрыт | `docs/BACKLOG.md` | П46 п. 2 |
| план содержания Valhalla; 270 запросов по секциям | этот доклад; `docs/reports/2026-09-12-valhalla-plan/klucze-po-sekcjach.md` | П46 п. 3 |

**Обещано и НЕ сделано:** ничего. **Дальше — только по команде:** текст
Valhalla по плану; затем пачка 4 (Eivor, II wojna, Rodowód, za darmo
474–642, `/mapa-miejsc-historycznych/`); затем сводный доклад волны 1 —
вход в пакет решений владельца по главной (П46 п. 4).
