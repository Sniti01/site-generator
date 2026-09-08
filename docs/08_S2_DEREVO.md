# Дерево сайта: 31 страница на приёмку

> Выход стадии S2 `docs/05_STRUCTURE_TASK.md`. Правила отбора — Части C и D
> `docs/04_STRUCTURE_DECISIONS.md`, судьбы кластеров подтверждены владельцем
> (П25), контракт полей — `docs/07_STRUCTURE_CONTRACT.md`. Здесь: что за
> страницы получились, почему именно эти и чего в дереве нет.
>
> **Это главная точка сессии: дерево принимается глазами.** Числа проверены
> машиной, состав — нет: машина не знает, что «Ezio Collection» и «Ezio
> Auditore» стоит разводить, а «Chronicles: Russia» — нет.

## Где что лежит

| Файл | Что это |
|---|---|
| `sites/ac4bf-thewatch.com/structure/pages-s2.json` | **объявление состава**: какие страницы существуют, на каком кластере стоят, что в них слито |
| `sites/ac4bf-thewatch.com/tools/build-tree.mjs` | раскладка: каждому запросу выгрузки — ровно одно место; считает `volume`, `parent`, `blocks` |
| `sites/ac4bf-thewatch.com/structure/structure.json` | результат: дерево целиком, его читает гейт |

Разделение то же, что у разведки: **правила и состав — данными, счёт —
инструментом.** Строчку «эта страница существует» ищут в `pages-s2.json`,
а не в коде.

## Дерево

Отступом показан второй уровень. «В» — волна, «Корпус» — корзина покрытия
и сколько документов скачано из размера топа.

| Адрес | Тип | В | Кластер | Google | Запросов | Корпус |
|---|---|---:|---|---:|---:|---|
| `/` | home | 1 | `assassins` | 178790 | 122 | high 9/10 |
| `/assassins-creed-4-black-flag/` | game | 1 | `assassin black flag` + `assassins iv black flag` | 120300 | 33 | high 10/10 |
| └ `/assassins-creed-4-black-flag/freedom-cry/` | game | 1 | `assassins creed cry` | 1240 | 7 | high 8/10 |
| `/assassins-creed-3/` | game | 1 | `assassins 3` | 29480 | 45 | mid 6/10 |
| `/assassins-creed-origins/` | game | 1 | `assassin origins` | 23080 | 64 | high 7/10 |
| `/assassins-creed-valhalla/` | game | 1 | `assassin valhalla` | 21420 | 305 | high 9/10 |
| └ `/assassins-creed-valhalla/dawn-of-ragnarok/` | game | 1 | `valhalla ragnarok` + `dawn ragnarok` | 370 | 17 | high 9/10 |
| └ `/assassins-creed-valhalla/eivor/` | topic | 1 | `assassin eivor` | 310 | 8 | mid 6/10 |
| `/assassins-creed-mirage/` | game | 1 | `assassin mirage` | 15920 | 50 | high 8/10 |
| `/assassins-creed-odyssey/` | game | 1 | `assassin odyssey` | 15800 | 73 | high 8/10 |
| `/assassins-creed-unity/` | game | 1 | `assassin unity` | 14130 | 25 | high 9/10 |
| `/assassins-creed-syndicate/` | game | 1 | `assassin syndicate` + `assassins creed 6` | 11970 | 23 | high 9/10 |
| `/assassins-creed-2/` | game | 1 | `assassins 2` | 9450 | 41 | high 9/10 |
| └ `/assassins-creed-2/discovery/` | game | **2** | `assassins creed discovery` | 80 | 2 | low 3/6 |
| `/assassins-creed-brotherhood/` | game | 1 | `assassin brotherhood` | 7590 | 16 | high 7/10 |
| `/assassins-creed-1/` | game | 1 | `assassins 1` + `assassins creed 1ps4` | 6840 | 48 | high 7/10 |
| `/assassins-creed-rogue/` | game | 1 | `creed rogue` | 6380 | 16 | high 8/10 |
| `/assassins-creed-revelations/` | game | 1 | `assassin revelation` + `ezio auditore revelations` | 3970 | 8 | high 7/10 |
| `/assassins-creed-liberation/` | game | 1 | `assassin liberation` | 3940 | 27 | high 8/10 |
| `/ezio-auditore/` | topic | 1 | `ezio auditore` | 3100 | 24 | high 7/10 |
| └ `/ezio-auditore/the-ezio-collection/` | game | 1 | `assassin ezio` | 660 | 5 | high 7/10 |
| `/assassins-creed-chronicles/` | game | 1 | `assassin chronicles` + `assassin creed russia` | 2820 | 16 | high 8/10 |
| `/mapa-miejsc-historycznych/` | map | 1 | — (страница владельца) | 890 | 54 | — |
| `/poradniki/` | hub | 1 | `najlepszy assasin creed` | 830 | 4 | mid 4/10 |
| └ `/poradniki/od-czego-zaczac/` | guide | 1 | `assassin creed po kolei` | 400 | 3 | mid 6/8 |
| `/assassins-creed-pirates/` | game | 1 | `assassins pirates` | 660 | 5 | high 7/10 |
| `/o-serii/` | topic | 1 | `assassin ubisoft` + `assassins creed 7` | 260 | 9 | high 10/10 |
| `/assassins-creed-ii-wojna-swiatowa/` | topic | 1 | `assassins creed world war` | 210 | 12 | mid 4/7 |
| `/assassins-creed-rodowod/` | topic | 1 | `assassins lineage` | 160 | 4 | low 3/3 |
| `/assassins-creed-shadows/` | game | 1 | `assassin red` | 150 | 4 | low 3/5 |
| `/assassins-creed-za-darmo/` | topic | 1 | `assassin creed za darmo` | 120 | 4 | high 7/9 |

**31 страница: 30 в волне 1, одна в волне 2.**

## Откуда взялись ровно эти страницы

Правила Части C дали пул кластеров, из которых страница вообще может
получиться, — 37 штук: 20 головы и 17 середины. Всё остальное правила уже
израсходовали: 141 кластер отдаёт ключи хабам, 64 ушли в `no_page`, 3 —
в `exclusions`. Кластеров хвоста среди страниц нет ни одного.

| Откуда | Кластеров | Страниц | Слито |
|---|---:|---:|---:|
| голова (≥ 830/мес) | 20 | 19 | 1 |
| середина (70–830/мес) | 17 | 11 | 6 |
| страница владельца | — | 1 | — |
| **итого** | **37** | **31** | **7** |

Волна 1 — тридцать сильнейших по Google-сумме, как велит Часть D.3; волна 2 —
то, что осталось после тридцатой строки. Осталась ровно одна страница:
`/assassins-creed-2/discovery/`, 80 запросов в месяц, корзина low. **Это факт,
а не недосмотр,** и он же — главный вопрос владельцу ниже.

### Семь слияний

Четыре вынуждены гейтом: пересечение топов ≥ 50 % означает, что две страницы
будут отбирать выдачу друг у друга (Часть C.6).

| Кластер | Уходит в | Пересечение | Почему |
|---|---|---:|---|
| `assassins iv black flag` | `assassin black flag` | 50 % | одна игра, разведённая кластеризатором надвое |
| `assassins creed 6` | `assassin syndicate` | 100 % | «какая часть шестая» — ответ на это Syndicate |
| `dawn ragnarok` | `valhalla ragnarok` | 50 % | одно дополнение под двумя именами |
| `assassins creed 7` | `assassin ubisoft` | 50 % | обе фразы о серии целиком и её нумерации |

Три — по смыслу, без принуждения гейта: `assassins creed 1ps4` — платформенный
запрос той же игры (Часть C.3); `assassin creed russia` — часть той же трилогии
Chronicles, а страниц у Китая и Индии нет; `ezio auditore revelations` — тот же
персонаж в той же игре.

### Три кластера, которым разведка назначила хаб, а здесь у них своя страница

Часть C.4 оставляет середине оба исхода — «волна 2 либо слияние по смыслу», —
поэтому это решение стадии S2, а не отход от подтверждённой пачки.

| Кластер | Разведка предлагала | Стало | Основание |
|---|---|---|---|
| `assassin ezio` (660) | в `ezio auditore` | `/ezio-auditore/the-ezio-collection/` | выдача другая: у `assassin ezio` в топе карточки издания The Ezio Collection, у `ezio auditore` — статьи о персонаже; общих адресов 3 из 10 |
| `assassin eivor` (260) | в `assassin valhalla` | `/assassins-creed-valhalla/eivor/` | персонаж, а не игра; прецедент — Ezio, у которого своя страница при 2460 |
| `assassins creed discovery` (80) | в `assassins 2` | `/assassins-creed-2/discovery/` | это отдельная игра 2009 года на Nintendo DS и iOS, а не режим внутри AC II |

## Учёт запросов

| Куда | Запросов |
|---|---:|
| на страницах | 1074 |
| `exclusions` | 34 |
| `no_page` | 318 |
| **всего** | **1426** из 1426 |

Числа сходятся с подтверждёнными пачками П25 построчно: `exclusions` — 6 фраз
кластеров плюс 28 некластеризованных; `no_page` — 252 плюс 66.

**`volume` страницы и Google-сумма кластера — разные числа, и это нормально.**
`volume` считается сложением частотностей фраз страницы, а колонка «Кластеры»
выгрузки даёт свою сумму по группе: у `assassins pirates` 450 против 660
сложением. Источник обоих — Google; расходятся они там, где планировщик
объединяет близкие формулировки. Контракт требует сложения по `keywords`,
поэтому в дереве стоит оно.

## Связность и входы

- **Родитель каждой страницы волны 1 сам в волне 1** — проверка 8 гейта,
  проходит. Единственная страница волны 2 висит под страницей волны 1, что
  правилу не противоречит.
- **Единственный CTA главной ведёт на `/poradniki/od-czego-zaczac/`** —
  страница есть, волна 1. Вторая ссылка главной, «Otwórz pełny katalog» из
  `CatalogStack`, ведёт на `/poradniki/` — тоже есть.
- Глубина 2 при `MAX_DEPTH = 2`, сирот нет, адреса не расходятся с родителями.

Остальные 47 внутренних адресов вёрстки в дерево не входят: это
демонстрационный материал `src/data/site.ts` («tytuły poradników, daty
i liczniki to materiał demonstracyjny do podmiany») плюс служебные ссылки
подвала. Правкой вёрстки S2 не занимается; список — в отчёте сессии.

## Чего в дереве нет и почему

**1. Шести сквозных тем «Некластеризовано».** `ksiazki` (210/мес), `lore`
(210), `przejscie` (70), `mobilne` (50), `rating` (30), `lokalizacja` (30) —
26 фраз. У каждой темы есть спрос, но **нет кластера**, а `cluster` контракт
требует у всех, кроме страницы владельца. Фразы разложены ключами по ближайшим
страницам: `desmond miles assassins creed 3` — на страницу AC3, `assassins
creed valhalla ppsspp` — на Valhalla, остальные на главную. Строка о нехватке
стоит в `docs/UNRESOLVED.md`.

Четыре темы, у которых одноимённый кластер нашёлся, страницами стали:
`film` → `/assassins-creed-rodowod/`, `epoki` →
`/assassins-creed-ii-wojna-swiatowa/`, `kolejnosc` → `/poradniki/od-czego-zaczac/`,
`карта мест` и `люди истории` → страница владельца.

**2. Страницы под `assassin creed nexus` (210/мес).** Разведка отправила фразу
«к кластеру `assassin creed nexus`», а кластера с таким именем в выгрузке нет:
имя стоит в словаре игр `rules-s0.json`, но кластеризатор его не создал. Фраза
принята ключом на главную, строка — в `UNRESOLVED.md`.

**3. Ни одной страницы типа `legal`.** Служебные страницы спроса не имеют,
а `cluster: null` контракт разрешает только владельцу. При этом подвал сайта
ведёт на `/prywatnosc/`, `/redakcja/`, `/kontakt/` и `/o-nas/` — четыре
настоящих входа, которые контракт сегодня выразить не может. Вопрос владельцу.

## Типы: сколько страниц каждого

| Тип | Страниц |
|---|---:|
| `game` | 21 |
| `topic` | 6 |
| `home` | 1 |
| `hub` | 1 |
| `guide` | 1 |
| `map` | 1 |
| `legal` | **0** |

Закрытый список типов подтверждается вместе с приёмкой дерева
(`docs/07`, П24). Теперь видно, сколько страниц каждого типа существует, —
и что `legal` не существует и существовать не может, пока `cluster` обязателен.

## Как запускать

```
node tools/build-tree.mjs --dry-run          # только счёт, файл не трогается
node tools/build-tree.mjs                    # пишет structure/structure.json
npm run gates -w ac4bf-thewatch.com          # девять проверок структуры среди четырёх гейтов
```

Инструмент падает, если хотя бы одному запросу не нашлось места, если кластер
назначен двум страницам или если объявленный ключ не встречается в выгрузке
знак в знак. **Тихой потери части семантики быть не может** — это тот же
довод, по которому заведён сам гейт.

## Что дальше

S3 — анатомия корпуса: два прохода по одному корпусу заполняют `blocks[]`
страниц волны 1 доказательствами (`source: anatomy`, `evidence`). Сегодня
у всех страниц стоят умолчания типа (`source: type-default`, `confidence:
low`) — они законны, но это ещё не анатомия. Страницы корзины low
(`/assassins-creed-2/discovery/`, `/assassins-creed-rodowod/`,
`/assassins-creed-shadows/`) получат только план содержания: анатомия на трёх
документах не считается (Часть D.3).
