# S0 — разведка данных: пачки на подтверждение

> Выход стадии S0 `docs/05_STRUCTURE_TASK.md`. Здесь **предложения**;
> решает владелец. Подтверждаются пачки — то есть правила, — а не строки:
> к каждой пачке приложен полный список того, что она забирает, чтобы
> подтверждение было зрячим.
>
> Машинный вид того же самого — `sites/ac4bf-thewatch.com/structure/s0-recon.json`;
> пересчитывается `npm run recon` из папки сайта, правила и словари живут
> в `structure/rules-s0.json` и меняются там, а не в коде.

---

## 1. Что прочитано и что сошлось

| Вход | Что в нём | Проверка |
|---|---|---|
| `input/clustering-google-2026-09-07.xlsx` | 1426 фраз, 257 кластеров + строка «Некластеризовано» (264 фразы) | `sha256 466f2042…` совпал с записью `input/corpus/run.json` — выгрузка та же, по которой брался корпус |
| лист «Не сопоставлено» | 13 фраз без объёма Google | адаптер читает ровно 13, как обещает лист «Легенда»; все с WS 0–7 |
| корпус конкурентов (пункт 2 бэклога) | 3479 адресов, 2098 скачано | покрытие по кластерам: 102 high, 86 mid, 69 low |

**Источник истины — колонки Google.** WS в выгрузке оставлен для сравнения
и в решениях не участвует: так сказано на листе «Легенда» и повторено
в Части A `04`. Расхождение между ними велико и не косметическое —
у кластера `assassins` WS-сумма 4 715 538 против 139 090 Google, — поэтому
любое число ниже читается только как Google.

Учёт сходится, и это проверяет сам инструмент: если сумма судеб не даст
1426, `npm run recon` вернёт ненулевой код.

| Куда попало | Фраз |
|---|---:|
| кластеры → слить_в_хаб | 585 |
| кластеры → no_page | 252 |
| кластеры → страница | 222 |
| кластеры → волна_2 | 67 |
| кластеры → люди_истории | 22 |
| кластеры → карта_мест | 8 |
| кластеры → exclusions | 6 |
| «Некластеризовано» → к_кластеру | 108 |
| «Некластеризовано» → no_page | 66 |
| «Некластеризовано» → новая_тема | 62 |
| «Некластеризовано» → exclusions | 28 |
| **Всего учтено** | **1426** из 1426 |

---

## 2. Три поправки к посылкам Части C

Ни одна не отменяет решения владельца; каждая говорит, что признак,
записанный в постановке, на этих данных считается иначе.

**1. Колонка «% Агрегаторов» пуста.** Часть C.2 называет её первым признаком
магазинного интента. В выгрузке 1415 фраз из 1426 несут `0`, остальные
одиннадцать — `10`. Признака в ней нет; по ней нельзя отделить `ac valhalla
allegro` от `assassin valhalla`. Вместо неё считаются два других признака
из той же Части C.2 — **состав топа снимка** и **недобор корпуса по отказам
магазинов**, — и добавлен третий, механический: **магазинное слово в имени
кластера**.

**2. Ещё две колонки пусты.** «Главных страниц» — ноль у 1417 фраз из 1426;
«Топоним в запросе» — прочерк у всех 1426. В решениях не используются;
названы здесь, чтобы следующая сессия не искала в них смысл.

**3. Части C.2 и C.3 сталкиваются на платформенных кластерах.** У `assassin
ps4` (1570/мес) шесть маркетплейсов в топе из десяти — по C.2 это `no_page`.
По C.3 платформенный кластер сливается ключами в хаб игры, в раздел
«Na czym zagrać». Столкновение разрешено **в пользу C.3**, и вот почему:
спрос «во что поиграть на PS4» информационный, магазинной выдачу делает
рынок, а не запрос. Обратный порядок отправил бы в `no_page` пятнадцать
кластеров и 1570 запросов в месяц — ровно те ключи, ради которых раздел
и заводится. Порядок признаков записан данными: `rules-s0.json`,
`магазинный_интент.порядок_признаков`.

Магазинным словам это не мешает: `ac valhalla allegro`, `valhalla gold
edition` и `assassins creed g2a` уходят в `no_page` раньше, чем дело
доходит до платформ.

---

## 3. Пачка 1 — пороги хвоста (Часть C.4)

**Пороги заданы долями объёма, а не круглыми числами.** На этом
распределении круглый порог произволен: между 200 и 300 запросами в месяц
нет ни разрыва, ни ступени — ровный склон. Доля объёма — величина,
у которой есть смысл: «кластеры, за пределами которых лежит меньше процента
спроса». Числа, которые доли дают на выгрузке 2026-09-07:

| Полоса | Граница | Кластеров | Объём Google | Доля |
|---|---|---:|---:|---:|
| Голова | ≥ 830/мес | 27 | 404 660 | 95.06 % |
| Середина | 70–830/мес | 73 | 16 850 | 3.96 % |
| Хвост | < 70/мес | 157 | 4 200 | 0.99 % |
| **Всего** | | **257** | **425 710** | **100 %** |

Десять кластеров держат 85 % объёма, медиана кластера — 40 запросов
в месяц. Отсюда и форма распределения:

| Google-сумма кластера | Кластеров | Объём | Доля объёма |
|---|---:|---:|---:|
| 0–10 | 6 | 0 | 0.00 % |
| 10–20 | 28 | 280 | 0.07 % |
| 20–30 | 64 | 1 280 | 0.30 % |
| 30–50 | 35 | 1 250 | 0.29 % |
| 50–100 | 41 | 2 740 | 0.64 % |
| 100–200 | 26 | 3 530 | 0.83 % |
| 200–500 | 22 | 7 100 | 1.67 % |
| 500–1 000 | 12 | 8 320 | 1.95 % |
| 1 000–5 000 | 11 | 24 540 | 5.76 % |
| 5 000–20 000 | 7 | 84 310 | 19.80 % |
| 20 000 и выше | 5 | 292 360 | 68.68 % |

**Что предлагается закрепить:**

- **голова — 95 % объёма, граница 830/мес, 27 кластеров.** Кандидат
  в собственную страницу;
- **середина — до 99 % объёма, 70–830/мес, 73 кластера.** Волна 2 либо
  слияние по смыслу;
- **хвост — последний процент, ниже 70/мес, 157 кластеров.** Слияние
  в родителя или `no_page`.

Доли — данные (`rules-s0.json`, раздел `хвост`), и при пересъёмке
семантики границы пересчитаются сами. Если владелец предпочитает
закрепить именно числа (830 и 70), это тоже правится в файле, но тогда
на новой выгрузке они устареют молча.

---

## 4. Судьбы кластеров: что дают правила Части C целиком

| Судьба | Кластеров | Фраз | Объём Google | Что это значит |
|---|---:|---:|---:|---|
| страница | 20 | 222 | 397 240 | кандидат в собственную страницу |
| волна_2 | 17 | 67 | 3 330 | страница второй волны либо слияние по смыслу |
| карта_мест | 4 | 8 | 120 | материал страницы владельца |
| люди_истории | 8 | 22 | 230 | реальные люди из игр — тема-спутник карты |
| слить_в_хаб | 141 | 585 | 20 710 | ключи уходят в хаб игры, своей страницы нет |
| no_page | 64 | 252 | 3 100 | по теме, страницу не делаем |
| exclusions | 3 | 6 | 980 | не по теме |

### 4.1. Голова — 20 кандидатов в страницы

Семь кластеров головы ушли из этого списка раньше: платформенные
(`assassin ps4`, `assassin ps5`, `origins ps4`, `syndicate ps4`,
`valhalla ps5`, `ps4 valhalla`) — в хабы игр, `god of war valhalla` —
в `exclusions`.

| Google | Фраз | Кластер | Корзина корпуса | Скачано |
|---:|---:|---|---|---:|
| 139 090 | 12 | `assassins` | high | 9 |
| 74 170 | 10 | `assassin black flag` | high | 10 |
| 29 600 | 2 | `assassins iv black flag` | mid | 5 |
| 28 600 | 15 | `assassins 3` | mid | 6 |
| 20 900 | 14 | `assassin origins` | high | 7 |
| 16 670 | 32 | `assassin valhalla` | high | 9 |
| 14 700 | 16 | `assassin mirage` | high | 8 |
| 14 190 | 18 | `assassin odyssey` | high | 8 |
| 13 430 | 8 | `assassin unity` | high | 9 |
| 10 880 | 10 | `assassin syndicate` | high | 9 |
| 8 990 | 13 | `assassins 2` | high | 9 |
| 5 450 | 6 | `creed rogue` | high | 8 |
| 4 970 | 8 | `assassin brotherhood` | high | 7 |
| 3 880 | 5 | `assassin revelation` | high | 7 |
| 3 290 | 16 | `assassin liberation` | high | 8 |
| 2 460 | 8 | `ezio auditore` | high | 7 |
| 2 060 | 10 | `assassins 1` | high | 7 |
| 1 840 | 8 | `assassin chronicles` | high | 8 |
| 1 240 | 7 | `assassins creed cry` | high | 8 |
| 830 | 4 | `najlepszy assasin creed` | mid | 4 |

`assassins` — это главная: 139 090/мес, брендовая голова (Часть C.1).

### 4.2. Середина — 17 кластеров волны 2

| Google | Фраз | Кластер | Хаб по правилу | Корзина |
|---:|---:|---|---|---|
| 660 | 5 | `assassin ezio` | `ezio auditore` | high |
| 450 | 5 | `assassins pirates` | `assassins pirates` | high |
| 390 | 2 | `assassin creed po kolei` | — | mid |
| 260 | 8 | `assassin eivor` | `assassin valhalla` | mid |
| 250 | 10 | `valhalla ragnarok` | `assassin valhalla` | high |
| 130 | 4 | `assassin ubisoft` | — | high |
| 120 | 2 | `assassin creed russia` | `assassin chronicles` | low |
| 120 | 4 | `assassin creed za darmo` | — | high |
| 120 | 2 | `assassin red` | — | low |
| 120 | 2 | `assassins creed 1ps4` | `assassins 1` | low |
| 120 | 5 | `assassins creed 7` | — | high |
| 120 | 2 | `assassins lineage` | — | low |
| 110 | 3 | `assassins creed world war` | — | mid |
| 100 | 2 | `assassins creed 6` | `assassin syndicate` | low |
| 100 | 7 | `dawn ragnarok` | `assassin valhalla` | high |
| 80 | 2 | `assassins creed discovery` | `assassins 2` | low |
| 80 | 2 | `ezio auditore revelations` | `assassin revelation` | low |

### 4.3. Слияния в хабы — 141 кластер

Платформенные и хвостовые кластеры отдают ключи хабам игр. Пятнадцать
кластеров о серии в целом (`assassin ps4`, `assassin switch`,
`assassins creed psp`…) отнесены к `assassins`: у них платформа названа,
а игра — нет.

| Хаб | Кластеров сливается | Фраз | Объём Google |
|---|---:|---:|---:|
| `assassins` | 15 | 67 | 4 550 |
| `assassin valhalla` | 48 | 242 | 3 780 |
| `assassins 1` | 11 | 35 | 2 070 |
| `assassin origins` | 12 | 44 | 1 690 |
| `assassin black flag` | 5 | 16 | 1 650 |
| `assassin odyssey` | 13 | 44 | 1 450 |
| `assassin mirage` | 6 | 32 | 1 090 |
| `assassin syndicate` | 2 | 9 | 950 |
| `assassin unity` | 4 | 13 | 660 |
| `assassin liberation` | 2 | 10 | 640 |
| `ezio auditore` | 2 | 8 | 560 |
| `assassins 3` | 6 | 23 | 550 |
| `creed rogue` | 2 | 8 | 440 |
| `assassins 2` | 8 | 22 | 390 |
| `assassin brotherhood` | 2 | 6 | 150 |
| `assassin chronicles` | 2 | 4 | 60 |
| `assassin red` | 1 | 2 | 30 |

---

## 5. Пачка 2 — черновик `no_page` (Часть C.2)

Всего **64 кластера (252 фразы, 3 100 запросов в месяц)** и **66
некластеризованных фраз (890/мес)**. У каждой строки причина — она стоит
в `s0-recon.json` рядом с записью.

**магазинное слово в имени кластера** — 53 кластеров, 2 680 запросов в месяц:

`valhalla deluxe` (200), `assassin creed deluxe edition` (170), `assassin creed ultimate edition` (170), `assassins creed complete edition` (140), `assassins creed ragnarok edition` (90), `valhalla gold edition` (90), `assassins creed g2a` (80), `odyssey deluxe edition` (80), `odyssey gold edition` (80), `valhalla ultimate` (80), `ac black flag eneba` (70), `ac valhalla allegro` (70), `assassins creed valhalla eneba` (70), `ac origins eneba` (60), `ac valhalla cena` (60), `assassins creed media expert` (60), `assassins creed mirage deluxe` (60), `assassins creed odyssey eneba` (60), `assassins creed valhalla ragnarok edition xbox` (60), `season pass valhalla` (60), `valhalla complete edition xbox` (60), `ac valhalla ceneo` (50), `assassin creed valhalla olx` (50), `assassins creed rogue deluxe` (50), `assassins creed valhalla g2a` (50), `assassins creed valhalla gb` (50), `assassins creed 4 deluxe edition` (40), `ac unity notre dame edition` (30), `assassins creed 2 deluxe edition` (30), `assassins creed odyssey allegro` (30), `assassins creed odyssey olx` (30), `assassins creed valhalla ps4 media markt` (30), `season pass odyssey` (30), `ac syndicate eneba` (20), `assassin creed valhalla xbox one allegro` (20), `assassins creed mirage ps5 collectors edition` (20), `assassins creed omega edition` (20), `assassins creed origins allegro` (20), `assassins creed origins gb` (20), `assassins creed unity allegro` (20), `assassins creed valhalla gold xbox` (20), `assassins creed valhalla kinguin` (20), `assassins creed valhalla season pass pc` (20), `brotherhood deluxe edition` (20), `season pass valhalla ps5` (20), `valhalla ragnarok edition ps5` (20), `valhalla ragnarok season pass` (20), `assassins creed amazon` (10), `assassins creed ps4 amazon` (10), `assassins creed valhalla gb ps4` (10), `assassins creed valhalla gold edition pc` (10), `origins season pass ps4` (10), `valhalla season pass xbox` (10)

**тема не восстановлена — нужен глаз** — 5 кластеров, 120 запросов в месяц:

`assassins creed 2015` (40), `ubisoft forward` (30), `assassins creed 18` (20), `assassins creed edition` (20), `assassins creed 2022` (10)

**кроссовер с чужой игрой** — 3 кластеров, 50 запросов в месяц:

`fortnite ezio` (30), `assassin fortnite` (10), `eivor fortnite` (10)

**маркетплейсы заняли топ снимка (≥ 5 из 10)** — 2 кластеров, 210 запросов в месяц:

`assassins creed origins edition` (170), `assassins creed valhalla edition` (40)

**побочная тема серии: мерч, музыка, коллаборации** — 1 кластеров, 40 запросов в месяц:

`assassins creed reebok` (40)

Некластеризованные фразы, попавшие сюда по тем же правилам:

- **магазинное слово в самой фразе** — 53, 600/мес
- **побочная тема серии: мерч, музыка, коллаборации** — 10, 260/мес
- **кроссовер с чужой игрой** — 3, 30/мес

**Три причины, по которым список именно такой:**

1. **Маркетплейсы считаются отдельно от сторов платформ.** Steam,
   PlayStation Store, Xbox, Ubisoft Store и Epic стоят в выдаче любого
   игрового запроса, включая чисто информационные. Если считать их
   признаком покупки, магазинными окажутся все хабы игр — у `assassin
   valhalla` их четыре из десяти.
2. **Признак «недобор корпуса» включается только на полной выдаче.**
   У кластера с тремя-четырьмя адресами два отказа дают половину и
   объявляют магазинным любой узкий запрос. Так едва не ушёл в `no_page`
   `assassins creed notre dame` — на деле кандидат в карту мест.
3. **Мерч и музыка разведены с магазинами.** `lego assassins creed`,
   `reebok`, `pure arts`, `sabaton` — тема серии, но не тема сайта;
   в `s0-recon.json` у них своя причина («побочная тема серии»),
   а не «магазинный интент».

---

## 6. Пачка 3 — `exclusions` (не по теме)

**Кластеры — 3 (6 фраз, 980/мес):**

- `god of war valhalla` — 900/мес, 2 фраз; чужая вселенная: «god of war»
- `syndicate 1993` — 70/мес, 2 фраз; чужая вселенная: «syndicate 1993»
- `vikings valhalla playstation` — 10/мес, 2 фраз; чужая вселенная: «vikings valhalla»

**Некластеризованные фразы — 28 (1790/мес):**

- **коды, артикулы и номера патчей** — 21: acodyssey exe (10), assassins creed black flag 992 442 (10), assassins creed exe (10), assassins creed iv 179 593 (10), assassins creed odyssey 1.5 3 (10), assassins creed odyssey 1.5 6 (10), assassins creed odyssey 1.56 (10), assassins creed rogue 500 501 (10), assassins creed valhalla 1.5 3 (10), assassins creed valhalla exe (10), blus31465 (10), pcsb00074 (10), ubisoft 0x30010001 (10), 0100670014482000 (0), 0x70000d04 (0), ac 15 ubisoft (0), ac valhalla 1.5 3 (0), assassins creed valhalla 1.2 1 (0), blus31193 (0), valhalla 1.5 (0), valhalla 1.6 0 (0)
- **чужие вселенные** — 7: witcher2 (1600), assassins creed horizon (10), hitman iv (10), ninja s creed (10), tom clancy 2 the division (10), vikings ps5 (10), watch dogs legion grobowiec asasynów (10)

Про `witcher2` (1600/мес) стоит сказать отдельно: это самая крупная
некластеризованная фраза, и она из чужой вселенной целиком. Ни одного
запроса про «Ведьмака» в семантике больше нет.

---

## 7. Пачка 4 — судьбы «Некластеризовано» (264 фразы)

| Судьба | Фраз | Объём Google |
|---|---:|---:|
| к_кластеру | 108 | 2 100 |
| no_page | 66 | 890 |
| новая_тема | 62 | 1 230 |
| exclusions | 28 | 1 790 |
| **Всего** | **264** | **6 010** |

Уверенность проставлена у каждой строки: **184 high, 54 medium, 26 low**.
Низкая — это не «наугад», а «правило не сработало, нужен глаз»; все
26 таких фраз перечислены ниже целиком.

### 7.1. Ключами в существующие кластеры — 108 фраз

- `assassin valhalla` — 30 фраз: ac valhalla ps4 pro (10), anomalia assassins creed valhalla (10), assassin creed valhalla gold (10), assassin valhalla ragnarok (10), assassins creed odyssey eivor (10), assassins creed valhalla 21 9 (10), assassins creed valhalla alvar (10), assassins creed valhalla dolby vision (10), assassins creed valhalla elamigos (10), assassins creed valhalla eurogamer (10), assassins creed valhalla gog (10), assassins creed valhalla konstruktor (10), assassins creed valhalla mirage (10), assassins creed valhalla origin (10), assassins creed valhalla osada (10), assassins creed valhalla ps4 ubisoft connect (10), assassins creed valhalla tekla (10), assassins creed valhalla windows 8.1 (10), dawn of ragnarok ubisoft (10), dlc ragnarok (10), eivor wolfsmal (10), ezio auditore valhalla (10), holger assassins creed valhalla (10), orlog ubisoft (10), valhalla xbox 360 (10), warzyciel assassins creed valhalla (10), xbox one assassins creed valhalla (10), assassins creed valhalla version 7.0 (0), edwin assassins creed valhalla (0), ubisoft ragnarok (0)
- `assassins` — 26 фраз: assassin creed 2 steam (30), assassins creed macbook (30), assassin multiplayer (20), assassin remastered (20), assassin creed youtube (10), assassin rebel collection (10), assassins creed anthology xbox 360 (10), assassins creed avatar (10), assassins creed collection pc (10), assassins creed dead kings ps4 (10), assassins creed exclusive (10), assassins creed hd (10), assassins creed leila (10), assassins creed maxime béland (10), assassins creed platinum ps3 (10), assassins creed uplay (10), avatar assassins creed (10), eva assassins creed (10), parkour assassins creed (10), pod ubisoft (10), the flight assassins creed (10), torres assassins creed (10), ubisoft 15 (10), xbox cloud gaming assassins creed (10), assassins creed iii steven masters (0), assassins creed15 (0)
- `assassin odyssey` — 10 фраз: assassins creed odyssey symmachia spartańska (20), assassins creed assassins creed odyssey (10), assassins creed odyssey 4k (10), assassins creed odyssey statek (10), assassins creed odyssey windows 11 (10), assassins creed odyssey youtube (10), assassins creed odyssey za darmo (10), dlc odyssey ps4 (10), hades assassins creed odyssey (10), epic assassins creed odyssey (0)
- `ezio auditore` — 8 фраз: assassins creed ezio auditore da firenze (10), ezio auditore 4k (10), ezio auditore avatar (10), ezio auditore cape (10), ezio auditore da firenze games (10), ezio auditore game (10), ezio auditore hd (10), ezio auditore collection switch (0)
- `assassin origins` — 6 фраз: assassins creed origins steam (70), ac origins epic (10), assassins creed origins 4k (10), assassins creed origins ps4 pro (10), discovery tour ancient egypt (10), origins game pass (10)
- `assassins 3` — 5 фраз: connor assassin (70), assassins creed 3 pc (20), assa 3 (10), assassins creed 3 youtube (10), assassins creed assassins creed iii benedict arnold (0)
- `assassin black flag` — 4 фраз: assassins creed czarna bandera (40), assassins creed black flag kody (20), pancerz templariuszy black flag (10), assassins creed iv black flag eric baptizat (0)
- `assassins 2` — 4 фраз: assassins creed 2 black edition (10), assassins creed 2 hd (10), assassins creed 2 youtube (10), assassins creed 2 za darmo (10)
- `assassin unity` — 4 фраз: assassins creed unity switch (10), assassins creed unity ubisoft (10), assassins creed unity xbox series s (10), assassins creed unity za darmo (10)
- `assassin chronicles` — 2 фраз: assassin chronicles china (140), assassin s creed chronicles india (70)
- `assassin mirage` — 2 фраз: assassins creed mirage youtube (10), assassins creed rift ps4 (0)
- `creed rogue` — 1 фраз: assassins rogue (480)
- `assassin creed nexus` — 1 фраз: assassin creed nexus (210)
- `assassin syndicate` — 1 фраз: assassins creed victory (30)
- `assassin liberation` — 1 фраз: assassin creed liberation steam (10)
- `assassins 1` — 1 фраз: assassins creed 1 youtube (10)
- `assassin brotherhood` — 1 фраз: assassins creed brotherhood romulus (10)
- `assassin revelation` — 1 фраз: assassins creed objawienia (10)

### 7.2. Новые темы — 62 фразы

- **люди истории** — 13 фраз: al mualim (210), assassins creed unity nostradamus (20), assassins creed da vinci (10), assassins creed odyssey archidamos (10), assassins creed valhalla burgred (10), assassins creed valhalla harald (10), burgred assassins creed valhalla (10), hornigold assassins creed (10), ivar assassins creed valhalla (10), jacques de molay assassins creed (10), ludovico ariosto assassins creed (10), marco polo assassins creed (10), sokrates assassins creed odyssey (10)
- **карта мест** — 11 фраз: stonehenge valhalla (30), argolida assassins creed odyssey (20), assassins creed olympia (10), assassins creed origins dolina królów (10), assassins creed origins luxor (10), assassins creed valhalla derby (10), assassins creed valhalla winchester (10), fokida assassins creed (10), housesteads valhalla (10), notre dame ubisoft (10), odyssey atlantis (10)
- **epoki** — 9 фраз: assassins creed empire (20), assassin ww2 (10), assassins creed 1492 (10), assassins creed 1944 (10), assassins creed mars (10), assassins creed titans (10), assassins creed world war 1 (10), assassins creed world war 2 ps4 (10), spin off assassins creed (10)
- **ksiazki** — 7 фраз: assassin creed renesans (110), assassins creed porzuceni (30), assassins creed pojednanie (20), assassins creed pustynna przysięga (20), assassins creed openbaring anton gill (10), assassins creed the chain (10), assassins creed uprising 1 (10)
- **przejscie** — 7 фраз: assassins creed 2 100 (10), assassins creed 3 100 (10), assassins creed black flag 100 (10), assassins creed brotherhood 100 (10), assassins creed odyssey 100 (10), assassins creed rogue 100 (10), assassins creed syndicate 100 (10)
- **mobilne** — 5 фраз: assassin ppsspp (10), assassins creed 2 java (10), assassins creed gameloft (10), assassins creed nokia (10), assassins creed valhalla ppsspp (10)
- **lore** — 4 фраз: desmond miles assassins creed 3 (140), templariusze assassins creed (40), assassins creed bractwo (20), templariusze a asasyni (10)
- **film** — 2 фраз: assassins creed filmy (30), assassins creed lineage ps4 (10)
- **rating** — 2 фраз: assassins creed pegi (20), assassins creed pegi 16 (10)
- **lokalizacja** — 1 фраз: assassins creed po polsku (30)
- **kolejnosc** — 1 фраз: assassins creed 9 (10)

Темы сквозные: они собирают фразы, которые кластеризатор раскидал
поодиночке. Две из них — `ksiazki` (книги серии) и `lore` (тамплиеры,
братство, Десмонд) — в кластерах не назывались вовсе. У остальных есть
маленький одноимённый кластер, и фразы к нему просто прирастают:
`assassins lineage` (120) — кино, `assassins creed world war` (110) —
эпохи, `assassins creed java` (60) — мобильные, `assassins creed 100`
(20) — прохождение на 100 %, `assassins creed 18` (20) — возрастной
рейтинг.

Ни одна тема не тянет на страницу волны 1 по объёму; предложение —
держать их кандидатами волны 2, а сейчас записать фразы ключами
к соответствующим кластерам.

### 7.3. Не по теме и без страницы

Разложены выше, в пачках 2 и 3: 28 фраз в `exclusions`, 66 в `no_page`.

### 7.4. Низкая уверенность — 26 фраз, все ≤ 30/мес

Правило дало «запрос о серии без опознанной темы». Предложение — принять
их ключами на главную и вернуться к ним глазами на стадии S2, когда дерево
уже будет видно:

assassin creed 2 steam (30), assassins creed macbook (30), assassin multiplayer (20), assassin remastered (20), assassin creed youtube (10), assassin rebel collection (10), assassins creed anthology xbox 360 (10), assassins creed avatar (10), assassins creed collection pc (10), assassins creed dead kings ps4 (10), assassins creed exclusive (10), assassins creed hd (10), assassins creed leila (10), assassins creed maxime béland (10), assassins creed platinum ps3 (10), assassins creed uplay (10), avatar assassins creed (10), eva assassins creed (10), parkour assassins creed (10), pod ubisoft (10), the flight assassins creed (10), torres assassins creed (10), ubisoft 15 (10), xbox cloud gaming assassins creed (10), assassins creed iii steven masters (0), assassins creed15 (0)

---

## 8. Кандидаты в тему карты исторических мест

Это ответ на отдельный вопрос стадии S0: **кандидаты нашлись, и их
достаточно на страницу.**

**Кластеры — 4:**

- `assassins creed notre dame` — 70/мес, 2 фраз; историческое место: «notre dame»
- `assassins creed big ben` — 20/мес, 2 фраз; историческое место: «big ben»
- `assassins creed sparta` — 20/мес, 2 фраз; историческое место: «sparta»
- `assassins creed odyssey elis` — 10/мес, 2 фраз; историческое место: «elis»

**Некластеризованные фразы — 11:**

- stonehenge valhalla — 30/мес; историческое место: «stonehenge»
- argolida assassins creed odyssey — 20/мес; историческое место: «argolida»
- assassins creed olympia — 10/мес; историческое место: «olympia»
- assassins creed origins dolina królów — 10/мес; историческое место: «dolina królów»
- assassins creed origins luxor — 10/мес; историческое место: «luxor»
- assassins creed valhalla derby — 10/мес; историческое место: «derby»
- assassins creed valhalla winchester — 10/мес; историческое место: «winchester»
- fokida assassins creed — 10/мес; историческое место: «fokida»
- housesteads valhalla — 10/мес; историческое место: «housesteads»
- notre dame ubisoft — 10/мес; историческое место: «notre dame»
- odyssey atlantis — 10/мес; историческое место: «atlantis»

Рядом обнаружилась тема-спутник — **реальные люди, попавшие в игры**:
8 кластеров и 13 фраз. Она не про места, но живёт по той же логике
«история внутри игры», и решать её судьбу разумно вместе с картой.

**Кластеры:**

- `ac syndicate kuba rozpruwacz` — 70/мес, 4 фраз; историческое лицо: «kuba rozpruwacz»
- `assassin creed valhalla ragnar` — 40/мес, 4 фраз; историческое лицо: «ragnar»
- `brasidas assassins creed odyssey` — 40/мес, 3 фраз; историческое лицо: «brasidas»
- `assassins creed odyssey pitagoras` — 20/мес, 2 фраз; историческое лицо: «pitagoras»
- `assassins creed valhalla cynewulf` — 20/мес, 3 фраз; историческое лицо: «cynewulf»
- `assassins creed valhalla ivar` — 20/мес, 2 фраз; историческое лицо: «ivar»
- `alfred assassins creed valhalla` — 10/мес, 2 фраз; историческое лицо: «alfred»
- `assassins creed piri reis` — 10/мес, 2 фраз; историческое лицо: «piri reis»

**Фразы:**

- al mualim — 210/мес; историческое лицо: «al mualim»
- assassins creed unity nostradamus — 20/мес; историческое лицо: «nostradamus»
- assassins creed da vinci — 10/мес; историческое лицо: «da vinci»
- assassins creed odyssey archidamos — 10/мес; историческое лицо: «archidamos»
- assassins creed valhalla burgred — 10/мес; историческое лицо: «burgred»
- assassins creed valhalla harald — 10/мес; историческое лицо: «harald»
- burgred assassins creed valhalla — 10/мес; историческое лицо: «burgred»
- hornigold assassins creed — 10/мес; историческое лицо: «hornigold»
- ivar assassins creed valhalla — 10/мес; историческое лицо: «ivar»
- jacques de molay assassins creed — 10/мес; историческое лицо: «jacques de molay»
- ludovico ariosto assassins creed — 10/мес; историческое лицо: «ludovico ariosto»
- marco polo assassins creed — 10/мес; историческое лицо: «marco polo»
- sokrates assassins creed odyssey — 10/мес; историческое лицо: «sokrates»

**Что это значит для страницы владельца.** Суммарный объём мал —
120/мес по кластерам мест и 230/мес по людям, — и по частотному порогу
такая страница не прошла бы. Она и не должна: Часть D.2 выводит её
из-под порога полем `owner: true`. Важно другое — **семантика под неё
есть**, то есть страница не окажется без единого запроса: Stonehenge,
Housesteads, Luxor, Dolina Królów, Atlantyda, Olympia, Notre Dame,
Big Ben, Winchester, Sparta, Argolida, Fokida, Elis.

---

## 9. Антиканнибализация: 4 пары с общей выдачей

Детектор из `1weekinvr` (пересечение топов ≥ 50 %) прогнан по кандидатам
в страницы. Делитель — меньший из двух топов: у кластера с четырьмя
адресами и кластера с десятью общая четвёрка означает полное совпадение
первого, а не 40 %.

| Пара кластеров | Google | Общих адресов | Пересечение | Основание |
|---|---:|---:|---:|---|
| `assassin black flag` × `assassins iv black flag` | 74 170 / 29 600 | 3 из 10 и 6 | 50 % | полные топы |
| `assassin syndicate` × `assassins creed 6` | 10 880 / 100 | 3 из 10 и 3 | 100 % | слабое: топ короче пяти адресов |
| `valhalla ragnarok` × `dawn ragnarok` | 250 / 100 | 5 из 10 и 10 | 50 % | полные топы |
| `assassin ubisoft` × `assassins creed 7` | 130 / 120 | 4 из 10 и 8 | 50 % | полные топы |

Первая пара — настоящая находка: `assassin black flag` (74 170) и
`assassins iv black flag` (29 600) — **это одна игра, разведённая
кластеризатором на два кластера**. Одна страница; ключи слабого уходят
в сильный. Без этого две страницы конкурировали бы между собой
за 103 770 запросов в месяц.

Вторая пара опирается на топ из трёх адресов — основание слабое, но по
смыслу верное: `assassins creed 6` — это вопрос «какая часть шестая»,
и ответ на него Syndicate.

Третья и четвёртая — на решение: `dawn ragnarok` это дополнение к Valhalla,
а `assassins creed 7` — тот же вопрос о нумерации, что и `assassins creed
6`. Предложение: `valhalla ragnarok` + `dawn ragnarok` — одна страница
дополнения; `assassins creed 6/7` — оба в тему «kolejność» вместе
с `assassin creed po kolei` (390/мес).

---

## 10. Что из этого следует для волны 1 — арифметика, не решение

Дерево строится на стадии S2, здесь только счёт, чтобы владелец видел,
хватает ли материала на тридцать страниц:

- **20 кандидатов головы** − 1 слияние (`assassins iv black flag`
  в `assassin black flag`) = **19**, из них одна — главная;
- **+1** страница владельца (карта мест, `owner: true`);
- **+17** кластеров середины, из которых часть сольётся по смыслу;
- **+7** сквозных тем из «Некластеризовано» (книги, лор, эпохи,
  мобильные, 100 %, кино, рейтинг) — кандидаты волны 2, не волны 1;
- **+`/poradniki/od-czego-zaczac/`** — обязательная страница Части D.2,
  на неё указывает единственный CTA главной. Семантика под неё есть:
  `assassin creed po kolei` (390) и `najlepszy assasin creed` (830).

Тридцать страниц набираются с запасом, и добор идёт из середины,
а не из хвоста — это важно: у кластеров середины корпус в основном
корзины high и mid, то есть анатомия по ним считается.

---

## 11. Открытые вопросы

### Политические — владельцу

**П1. Гео плана Google Keyword Planner — вопрос снят, он уже закрыт.**
Лист «Легенда» выгрузки заканчивается предупреждением про гео и валюту
аккаунта, и он был вынесен владельцу как открытый. Это ошибка сессии:
ответ записан в `docs/BACKLOG.md`, пункт 2 — «Гео и язык плана Keyword
Planner проверены: Польша, польский. Вопрос, стоявший на листе «Легенда»
внутри файла, закрыт — записано и здесь, и в теле коммита семантики,
чтобы не открывался заново». Предупреждение внутри xlsx осталось, ответ
на него лежит рядом с корпусом; сверяться с бэклогом надо было раньше,
чем задавать вопрос.

**П2. Форма поиска в шапке.** Развилка 5 принята («поиск — волной 2»),
и факт по ней проверен: `core/chrome/SiteHeader.astro` рисует две живые
формы, `sites/ac4bf-thewatch.com` передаёт им `searchAction="/szukaj/"`,
страницы по этому адресу нет. Это битый вход, который развилка велела
скрыть.

Правка не сделана намеренно: она в ядре, меняет рендер шапки и требует
пиксельной приёмки, а объём S0 — разведка данных. Варианты:

1. **отдельным коммитом сейчас** — с пиксельной приёмкой шапки;
2. **вместе с первой страницей волны 1** (рекомендация): диффа шапки
   всё равно будет сниматься, и приёмка пройдёт один раз, а не два;
3. **оставить как есть до подключения `pagefind`** — не рекомендуется:
   до волны 2 это единственный элемент интерфейса, ведущий в 404.

**П3. Подтверждение четырёх пачек.** Пороги (раздел 3), `no_page`
(раздел 5), `exclusions` (раздел 6), судьбы «Некластеризовано»
(раздел 7). Достаточно «принимаю» либо правок по номерам разделов.

**П4. Тема-спутник карты мест — заводить ли.** Восемь кластеров и
13 фраз про реальных людей из игр (Аль-Муалим, Пири-реис, Жак де Моле,
Сократ, Марко Поло, Альфред Великий, Ивар Бескостный). Рекомендация: **не заводить
отдельной страницей в волне 1**, а держать материалом карты — у неё
и мест-то на одну страницу; отдельный хаб «люди истории» — волна 2,
если карта покажет спрос.

### Технические — решены здесь, записаны для следующей сессии

1. **Порядок признаков C.2 и C.3** — в пользу C.3 (раздел 2, поправка 3);
   записан данными в `rules-s0.json`.
2. **Пороги долями объёма, а не числами** — чтобы пересъёмка семантики
   не оставляла в файле устаревшие константы (раздел 3).
3. **Мерч и музыка отделены от магазинов** — своя причина в `no_page`
   («побочная тема серии»), иначе `sabaton` объяснялся бы «магазинным
   интентом» (раздел 5).
4. **Признак недобора корпуса требует полной выдачи** (≥ 5 адресов) —
   иначе короткий топ ложно даёт «магазинный» вердикт (раздел 5).
5. **Хаб кластера ищется сначала по имени, потом по фразам** — имя даёт
   кластеризатор, и оно не всегда называет игру: у `assassins creed 2010`
   все фразы про Brotherhood.
6. **Адаптер выгрузки написан заново модулем** (`tools/lib/clustering.mjs`),
   хотя такой же читатель zip есть внутри `tools/fetch-corpus.mjs`: тот
   заперт в скрипте, который на импорте начинает качать корпус. Свести
   оба в один — работа после приёмки дерева, не сейчас.

---

## 12. Ответы владельца, 2026-09-08

- **Пачки разделов 3, 5, 6, 7 — приняты.** Пороги (голова 830/мес,
  середина 70, хвост ниже), черновик `no_page`, `exclusions` и судьбы
  всех 264 некластеризованных фраз утверждены как основание дерева.
  Записано в `DECISIONS.md`, П25.
- **Тема-спутник «люди истории» — вариант (а):** не отдельная страница,
  а материал страницы карты мест; отдельный хаб — волна 2, если карта
  покажет спрос.
- **Форма поиска `/szukaj/` — вариант (а):** скрывается вместе с первой
  страницей волны 1, одной пиксельной приёмкой, а не отдельным коммитом
  сейчас.

---

## 13. Что дальше

Стадия S0 закрыта. Идёт S1 — схема `structure.json`, валидатор-гейт
и словарь умолчаний «тип → блоки»; дерево по подтверждённым пачкам
строится на S2 и выносится владельцу на приёмку глазами.
