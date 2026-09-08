# Дерево сайта: 30 страниц, принято владельцем

> Выход стадии S2 `docs/05_STRUCTURE_TASK.md`. Правила отбора — Части C и D
> `docs/04_STRUCTURE_DECISIONS.md`, судьбы кластеров подтверждены владельцем
> (П25), контракт полей — `docs/07_STRUCTURE_CONTRACT.md`.
>
> **Дерево принято 2026-09-08 с правками** — решения П26 и П27. Здесь оно
> в принятом виде: что за страницы, почему именно эти и чего в дереве нет.

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
| `/` | home | 1 | `assassins` + `assassin xbox 360` + `assassin ubisoft` + `assassins creed 7` | 179930 | 141 | high 9/10 |
| `/assassins-creed-4-black-flag/` | game | 1 | `assassin black flag` + `assassins iv black flag` | 120300 | 33 | high 10/10 |
| └ `/assassins-creed-4-black-flag/freedom-cry/` | game | 1 | `assassins creed cry` | 1240 | 7 | high 8/10 |
| `/assassins-creed-3/` | game | 1 | `assassins 3` | 29480 | 45 | mid 6/10 |
| `/assassins-creed-origins/` | game | 1 | `assassin origins` (+ `…origins gb` из `no_page`) | 23120 | 67 | high 7/10 |
| `/assassins-creed-valhalla/` | game | 1 | `assassin valhalla` (+ `…valhalla gb` из `no_page`) | 21090 | 270 | high 9/10 |
| └ `/assassins-creed-valhalla/dawn-of-ragnarok/` | game | 1 | `valhalla ragnarok` + `dawn ragnarok` и ещё девять кластеров дополнения | 710 | 53 | high 9/10 |
| └ `/assassins-creed-valhalla/eivor/` | topic | 1 | `assassin eivor` + `eivor vikings` | 350 | 12 | mid 6/10 |
| `/assassins-creed-mirage/` | game | 1 | `assassin mirage` | 15920 | 50 | high 8/10 |
| `/assassins-creed-odyssey/` | game | 1 | `assassin odyssey` | 15800 | 73 | high 8/10 |
| `/assassins-creed-unity/` | game | 1 | `assassin unity` + `assassins creed notre dame` | 14200 | 27 | high 9/10 |
| `/assassins-creed-syndicate/` | game | 1 | `assassin syndicate` + `assassins creed 6` + `ac syndicate kuba rozpruwacz` + `assassins creed big ben` | 12070 | 29 | high 9/10 |
| `/assassins-creed-2/` | game | 1 | `assassins 2` | 9430 | 39 | high 9/10 |
| └ `/assassins-creed-2/discovery/` | game | 1 | `assassins creed discovery` + `assassins creed 2 nintendo ds` | 100 | 4 | low 3/6 |
| `/assassins-creed-brotherhood/` | game | 1 | `assassin brotherhood` | 7590 | 16 | high 7/10 |
| `/assassins-creed-rogue/` | game | 1 | `creed rogue` | 6380 | 16 | high 8/10 |
| `/assassins-creed-1/` | game | 1 | `assassins 1` + `assassins creed 1ps4` | 4740 | 38 | high 7/10 |
| `/assassins-creed-revelations/` | game | 1 | `assassin revelation` + `ezio auditore revelations` | 3970 | 8 | high 7/10 |
| `/assassins-creed-liberation/` | game | 1 | `assassin liberation` | 3940 | 27 | high 8/10 |
| `/ezio-auditore/` | topic | 1 | `ezio auditore` + `assassin ezio` + `ezio ps4` | 3760 | 29 | high 7/10 |
| `/assassins-creed-chronicles/` | game | 1 | `assassin chronicles` + `assassin creed russia` | 2820 | 16 | high 8/10 |
| `/assassins-creed-bloodlines/` | game | 1 | `assassins creed psp` | 1450 | 3 | high 8/10 |
| `/poradniki/` | hub | 1 | `najlepszy assasin creed` | 830 | 4 | mid 4/10 |
| └ `/poradniki/od-czego-zaczac/` | guide | 1 | `assassin creed po kolei` | 390 | 2 | mid 6/8 |
| `/assassins-creed-pirates/` | game | 1 | `assassins pirates` | 660 | 5 | high 7/10 |
| `/mapa-miejsc-historycznych/` | map | 1 | — (страница владельца) | 510 | 45 | — |
| `/assassins-creed-ii-wojna-swiatowa/` | topic | 1 | `assassins creed world war` | 170 | 9 | mid 4/7 |
| `/assassins-creed-shadows/` | game | 1 | `assassin red` | 160 | 5 | low 3/5 |
| `/assassins-creed-rodowod/` | topic | 1 | `assassins lineage` | 160 | 4 | low 3/3 |
| `/assassins-creed-za-darmo/` | topic | 1 | `assassin creed za darmo` | 120 | 4 | high 7/9 |

**Тридцать страниц, все в волне 1. Волна 2 пуста, и это решение, а не
недосмотр:** П26 — волна 2 пополняется из Search Console после индексации
волны 1, то есть по тому, что люди действительно спросят, а не по догадке
из выгрузки.

## Что изменила приёмка

| Что | Было в черновике | Стало по решению владельца |
|---|---|---|
| `/o-serii/` | отдельная страница на `assassin ubisoft` | слита в главную: кластеры, тема «kolejnosc» и ключ `spin off` ушли на `/`, там же ручной блок `link-list` с ролью `numeracja-serii` |
| `/ezio-auditore/the-ezio-collection/` | отдельная страница издания | сборник стал разделом страницы персонажа: ручной блок `card-rail` с ролью `the-ezio-collection`, 1210/мес спроса на издание живут там же |
| `Assassin's Creed: Bloodlines` | кластера не было ни у одной страницы | своя страница `/assassins-creed-bloodlines/`, 1450/мес; кластер поднят из слияний решением владельца |
| `/assassins-creed-2/discovery/` | волна 2 | волна 1 — два слота освободились, один занял Bloodlines, второй она |
| карта мест | 890/мес, среди них `al mualim`, DLC «Kuba Rozpruwacz» и два коллекционных издания | 510/мес, только настоящие места и настоящие люди; `al mualim` (вымышленный) — на `/assassins-creed-1/`, DLC и издания — на Syndicate и Unity |
| два кластера «gb» | в `no_page` с причиной «магазинное слово» | возвращены на страницы Valhalla и Origins: запросы «сколько занимает на диске», в топе системные требования Ubisoft и Steam |
| тип `legal` | завести страницу было нечем | контракт разрешает `cluster: null` служебной странице так же, как странице владельца |

**Возврат из `no_page` объявляется отдельным полем** `возвращено_из_no_page`,
а не рядовым слиянием: он отменяет строку пачки, подтверждённой владельцем.
Инструмент требует, чтобы у кластера действительно стояла судьба `no_page`,
и печатает возвраты отдельной строкой — чтобы отмену решения нельзя было
провести молча.

## Откуда взялись ровно эти страницы

Правила Части C дали пул кластеров, из которых страница вообще может
получиться, — 37 штук: 20 головы и 17 середины. Счёт по всем 257 кластерам
выгрузки (судьбы разведки, они не менялись):

| Куда ушёл кластер | Кластеров |
|---|---:|
| пул страниц: голова | 20 |
| пул страниц: середина | 17 |
| ключами в хабы игр | 141 |
| `no_page` | 64 |
| материал страницы владельца (4 карта мест + 8 люди истории) | 12 |
| `exclusions` | 3 |
| **всего** | **257** |

Две поправки к этому счёту сделаны решением владельца, а не правилом:
`assassins creed psp` поднят из группы слияний в страницу Bloodlines, два
кластера «gb» вернулись из `no_page` на страницы игр. Судьбы в
`s0-recon.json` при этом не переписывались — поправки объявлены в дереве
и видны в его печати.

Из пула в 37 кластеров получилось 29 страниц, тридцатая — Bloodlines.
Волна 1 — тридцать сильнейших, как велит Часть D.3.

**Десять кластеров середины стоят в волне 1** — `assassin ezio`, `assassins
pirates`, `assassin creed po kolei`, `assassin eivor`, `valhalla ragnarok`,
`assassin ubisoft`, `assassin creed za darmo`, `assassin red`, `assassins
lineage`, `assassins creed world war`. Разведка пометила их «волна_2», и
основание для подъёма — **Часть D.3, добор до тридцати**: голова даёт только
19 страниц, а с картой мест двадцать. Части C.4 такого исхода не знает —
там у середины два выхода, волна 2 и слияние; третий появляется из D.3.

**`wave` — ручное объявление, не вычисленное значение.** Пороги хвоста
записаны долями и при пересъёмке семантики пересчитаются сами; правило
«тридцать сильнейших» живёт прозой Части D.3 и полем `wave`. На новой
выгрузке пороги сдвинутся молча, а раскладка по волнам — нет.

### Двадцать пять слияний, три разных рода

**Род 1 — вынуждено гейтом, четыре.** Пересечение топов ≥ 50 % означает,
что две страницы будут отбирать выдачу друг у друга (Часть C.6).

| Кластер | Уходит в | Пересечение | Почему |
|---|---|---:|---|
| `assassins iv black flag` | `assassin black flag` | 50 % | одна игра, разведённая кластеризатором надвое |
| `assassins creed 6` | `assassin syndicate` | 100 % | «какая часть шестая» — ответ на это Syndicate |
| `dawn ragnarok` | `valhalla ragnarok` | 50 % | одно дополнение под двумя именами |
| `assassins creed 7` | `assassin ubisoft` | 50 % | обе фразы о серии целиком и её нумерации |

**Род 2 — по смыслу, три.** `assassins creed 1ps4` — платформенный запрос той
же игры (Часть C.3); `assassin creed russia` — часть той же трилогии
Chronicles, а страниц у Китая и Индии нет; `ezio auditore revelations` — тот
же персонаж в той же игре.

**Род 3 — поправка хаба по выдаче.** Разведка узнаёт хаб по словам во фразах,
и в этих случаях выдача называет другую страницу. Это не отход
от подтверждённой пачки: хабы слияний в пачки П25 не входили, а правило C.3
«платформенный кластер — в хаб игры» соблюдено; поправлено то, **какая**
это игра.

| Кластеры | Стояли на | Стали на | Что говорит выдача |
|---|---|---|---|
| девять кластеров дополнения (`ac valhalla ragnarok pc`, `valhalla ragnarok ps5`, …) | `assassin valhalla` | `/assassins-creed-valhalla/dawn-of-ragnarok/` | у фразы `assassin valhalla ragnarok` пересечение с якорем дополнения 6 из 10, с якорем игры — 0 из 10 |
| `ezio ps4` (550/мес) | `ezio auditore` | раздел издания на `/ezio-auditore/` | вся выдача — карточки The Ezio Collection |
| `assassins creed psp` (730/мес) | `assassins 1` | `/assassins-creed-bloodlines/` | все десять адресов топа про Bloodlines, про AC1 нет ни одного |
| `assassin xbox 360` (600/мес) | `assassins 1` | `/` | витрины магазинов плюс страница серии, а не первой части |
| `assassins creed 2 nintendo ds` | `assassins 2` | `/assassins-creed-2/discovery/` | выдача целиком про AC II: Discovery |
| `eivor vikings` | `assassin valhalla` | `/assassins-creed-valhalla/eivor/` | выдача про персонажа, а не про игру |
| `ac syndicate kuba rozpruwacz`, `assassins creed big ben` | карта мест | `/assassins-creed-syndicate/` | карточки дополнения и коллекционного издания в магазинах консолей |
| `assassins creed notre dame` | карта мест | `/assassins-creed-unity/` | листинг Allegro и «gra PS4 AC Unity Notre Dame» |

Первая строка — самая важная: без неё дочерняя страница дополнения дралась
бы с родителем за один и тот же интент, **и гейт бы этого не увидел** —
обе группы фраз лежали внутри одного кластера, а гейт сравнивает кластеры,
а не страницы.

### Четыре кластера, которым разведка назначила хаб, а здесь у них своя страница

| Кластер | Разведка предлагала | Стало | Пересечение с хабом |
|---|---|---|---:|
| `assassin ezio` (660) | в `ezio auditore` | раздел на `/ezio-auditore/` | 30 % |
| `assassin eivor` (260) | в `assassin valhalla` | `/assassins-creed-valhalla/eivor/` | 10 % |
| `valhalla ragnarok` (250) | в `assassin valhalla` | `/assassins-creed-valhalla/dawn-of-ragnarok/` | 0 % |
| `assassins creed discovery` (80) | в `assassins 2` | `/assassins-creed-2/discovery/` | 0 % |

Пересечение (общих адресов у топов кластера и хаба) объясняет, почему они
**не слиты**; почему они в волне 1 — объясняет Часть D.3. Из четырёх один,
`assassin ezio`, на приёмке всё же стал разделом, а не страницей: решение
владельца.

**Разведка предлагала для `assassins creed 6` и `7` иное.** S0, раздел 9:
«оба в тему „kolejność“ вместе с `assassin creed po kolei`». Машинный
`s0-recon.json` рекомендовал то, что сделано здесь: шестую — в Syndicate,
ключи седьмой — в сильный кластер пары. Разведка разошлась сама с собой,
прозой и машиной; дерево пошло за машиной, потому что оба слияния вынуждены
порогом каннибализации. После приёмки вопросы нумерации собраны на главной
вместе с темой «kolejnosc».

## Учёт запросов

| Куда | Запросов |
|---|---:|
| на страницах | 1081 |
| `exclusions` | 34 |
| `no_page` | 311 |
| **всего** | **1426** из 1426 |

`exclusions` — те же 34, что подтвердил П25. `no_page` было 318, стало 311:
семь фраз двух кластеров «gb» вернулись на страницы игр решением владельца
(П26). Больше ни одна строка пачек не тронута.

**`volume` страницы и Google-сумма кластера — разные числа, и это нормально.**
`volume` считается сложением частотностей фраз страницы, а колонка «Кластеры»
выгрузки даёт свою сумму по группе: у `assassins pirates` 450 против 660
сложением, у `assassins creed psp` 730 против 1450. Источник обоих — Google;
расходятся они там, где планировщик объединяет близкие формулировки.

## Связность и входы

- **Родитель каждой страницы волны 1 сам в волне 1** — проверка 8 гейта,
  проходит; в волне 1 сейчас все тридцать.
- **Единственный CTA главной ведёт на `/poradniki/od-czego-zaczac/`** —
  страница есть. Вторая ссылка главной, «Otwórz pełny katalog» из
  `CatalogStack`, ведёт на `/poradniki/` — тоже есть.
- Глубина 2 при `MAX_DEPTH = 2`, сирот нет, адреса не расходятся с родителями,
  `related` у всех тридцати ведут на существующие страницы.

**Остальные 47 внутренних адресов вёрстки в дерево не входят, и они трёх
разных сортов.** Тридцать пять — демонстрационный материал `src/data/site.ts`
(заголовки поradников, даты, счётчики), о чём сказано в самом файле. Семь —
**вторая схема навигации**: разделы подвала `/przejscia/`, `/mapy/`,
`/sprzet/`, `/fabula/`, слой эпох `/epoki/<id>/` (одна строка кода, пять живых
адресов), `/postacie/`, `/aktualnosci/`. Четыре — служебные входы
`/prywatnosc/`, `/redakcja/`, `/kontakt/`, `/o-nas/`. Сорок седьмой —
`/favicon.svg`, не страница. По П27 подвал, слой эпох и форма поиска
`/szukaj/` приводятся к принятой схеме адресов вместе с первой страницей
волны 1, одной пиксельной приёмкой.

## Чего в дереве нет и почему

**1. Шести сквозных тем «Некластеризовано».** `ksiazki` (210/мес), `lore`
(210), `przejscie` (70), `mobilne` (50), `rating` (30), `lokalizacja` (30) —
26 фраз, 600 запросов в месяц. У четырёх тем кластера нет вовсе; у `mobilne`
и `przejscie` кластер есть (`assassins creed java`, `assassins creed 100`),
но оба хвостовые и уже израсходованы хабом `assassins 1`.

Разложены они по-разному, и это стоит знать при чтении `pages-s2.json`:
`ksiazki`, `rating`, `lokalizacja` и `kolejnosc` главная забирает целиком
полем `темы`; `lore` и `mobilne` разложены ключами поимённо (`desmond miles
assassins creed 3` — на страницу AC3, `assassins creed valhalla ppsspp` —
на Valhalla, остальные на главную); тема `przejscie` целиком живёт на семи
страницах игр, каждая фраза на своей.

Две темы, у которых нашёлся смысловой кластер, страницами стали: `film` →
`/assassins-creed-rodowod/` (кластер `assassins lineage`) и `epoki` →
`/assassins-creed-ii-wojna-swiatowa/` (`assassins creed world war`).
Одноимённого кластера нет ни у одной — совпадает предмет, а не имя. Темы
«карта мест» и «люди истории» кластера не имеют вовсе: их держит страница
владельца, живущая вне порога по признаку `owner: true`.

**2. Страницы под `assassin creed nexus` (210/мес).** Разведка отправила фразу
«к кластеру `assassin creed nexus`», а кластера с таким именем в выгрузке нет:
имя стоит в словаре игр `rules-s0.json`, но кластеризатор его не создал. Фраза
принята ключом на главную, строка — в `docs/UNRESOLVED.md`.

**3. Ни одной страницы типа `legal` — пока.** Контракт их теперь разрешает
(П26: `cluster: null` можно странице владельца и служебной), но заводятся они
вместе с правкой подвала по П27: сегодня писать `/prywatnosc/` в дерево
значит объявить страницу, которой никто не верстает.

## Типы: сколько страниц каждого

| Тип | Страниц |
|---|---:|
| `game` | 21 |
| `topic` | 5 |
| `home` | 1 |
| `hub` | 1 |
| `guide` | 1 |
| `map` | 1 |
| `legal` | 0 (разрешён, заводится по П27) |

Закрытый список типов подтверждён владельцем вместе с деревом (П26).

## Как запускать

```
node tools/build-tree.mjs --dry-run          # только счёт, файл не трогается
node tools/build-tree.mjs                    # пишет structure/structure.json
npm run gates -w ac4bf-thewatch.com          # девять проверок структуры среди четырёх гейтов
```

Инструмент падает, если хотя бы одному запросу не нашлось места; если кластер
назначен двум страницам; если объявленный ключ не встречается в выгрузке знак
в знак; если ключ совпал с именем кластера (почти всегда это описка — хотели
забрать кластер целиком); если объявленная тема или судьба в разведке никому
не назначена; если возврат из `no_page` объявлен кластеру, у которого судьба
другая. **Тихой потери части семантики быть не может.**

## Что дальше

S3 — анатомия корпуса: два прохода заполняют `blocks[]` тридцати страниц
доказательствами (`source: anatomy`, `evidence`). Сегодня стоят умолчания типа
(`source: type-default`, `confidence: low`) плюс два ручных блока, поставленных
на приёмке. Страницы корзины low (`/assassins-creed-2/discovery/`,
`/assassins-creed-rodowod/`, `/assassins-creed-shadows/`) получат только план
содержания: анатомия на трёх документах не считается (Часть D.3).
