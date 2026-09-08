# Волна 1 целиком: тридцать страниц, готовых к вёрстке

> Выход стадии S4 `docs/05_STRUCTURE_TASK.md` — финализация волны 1. Дерево
> принято владельцем (П26), анатомия измерена (S3, `docs/09_S3_ANATOMIA.md`),
> имена блоков названы (П28). Здесь всё вместе: что за страницы, из чего
> каждая состоит и сходятся ли числа.

## Числа, которые обязаны сойтись

| Что | Сколько |
|---|---:|
| страниц волны 1 | **30** |
| страниц волны 2 | 0 — пополняется из Search Console после индексации (П26) |
| запросов на страницах | 1081 |
| `exclusions` | 34 |
| `no_page` | 311 |
| **всего запросов** | **1426** из 1426 |
| суммарный объём страниц | 481 390 запросов в месяц |
| блоков в `blocks[]` | 197: умолчаний типа 115, анатомии 80, руки 2 |
| из них анатомии по именам | `byline` 23, `gallery` 23, `verdict-box` 22, `toc` 12 |
| уверенность анатомии | `high` 31, `medium` 49 |

Учёт проверяет гейт при каждой сборке: запрос, потерянный или посчитанный
дважды, роняет её.

## Типы

| Тип | Страниц |
|---|---:|
| `game` | 21 |
| `topic` | 5 |
| `home` | 1 |
| `hub` | 1 |
| `guide` | 1 |
| `map` | 1 |
| `legal` | 0 — разрешён контрактом (П26), заводится с правкой подвала (П27) |

## Тридцать страниц

**Жирным** — блоки, подтверждённые анатомией корпуса (`source: anatomy`,
`evidence` в `structure.json`); _курсивом_ — поставленные рукой на приёмке
(`source: manual`); обычным — умолчания типа (`source: type-default`).
Коридор — знаки без пробелов в теле статьи, ±15 % от медианы конкурентов;
звёздочка значит, что своих документов меньше четырёх и взята медиана ниши.

| Адрес | Тип | Запросов | Объём | Коридор знаков | `blocks[]` |
|---|---|---:|---:|---|---|
| `/` | home | 141 | 179930 | 2606–3526 | hero-key-art · **byline** · story-row · band-quote · card-rail · _link-list_ · **gallery** · link-columns · cta-band |
| `/assassins-creed-4-black-flag/` | game | 33 | 120300 | 5403–7311 | hero-key-art · **byline** · **toc** · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| └ `/assassins-creed-4-black-flag/freedom-cry/` | game | 7 | 1240 | 2744–3712 | hero-key-art · **byline** · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| `/assassins-creed-3/` | game | 45 | 29480 | 5365–7259 | hero-key-art · **byline** · **toc** · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| `/assassins-creed-origins/` | game | 67 | 23120 | 3138–4246 | hero-key-art · **byline** · **toc** · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| `/assassins-creed-valhalla/` | game | 270 | 21090 | 3425–4633 | hero-key-art · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| └ `/assassins-creed-valhalla/dawn-of-ragnarok/` | game | 53 | 710 | 2583–3495 | hero-key-art · **byline** · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| └ `/assassins-creed-valhalla/eivor/` | topic | 12 | 350 | 3348–4530 | **byline** · **toc** · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| `/assassins-creed-mirage/` | game | 50 | 15920 | 7292–9866 | hero-key-art · **byline** · **toc** · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| `/assassins-creed-odyssey/` | game | 73 | 15800 | 4271–5779 | hero-key-art · **byline** · **toc** · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| `/assassins-creed-unity/` | game | 27 | 14200 | 4514–6106 | hero-key-art · **toc** · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| `/assassins-creed-syndicate/` | game | 29 | 12070 | 3616–4892 | hero-key-art · **byline** · **toc** · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| `/assassins-creed-2/` | game | 39 | 9430 | 5550–7508 | hero-key-art · **byline** · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| └ `/assassins-creed-2/discovery/` | game | 4 | 100 | 2462–3332 | hero-key-art · story-row · card-rail · cta-band |
| `/assassins-creed-brotherhood/` | game | 16 | 7590 | 4537–6139 | hero-key-art · **byline** · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| `/assassins-creed-rogue/` | game | 16 | 6380 | 12068–16328 | hero-key-art · **byline** · **toc** · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| `/assassins-creed-1/` | game | 38 | 4740 | 6470–8754 | hero-key-art · **byline** · **toc** · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| `/assassins-creed-revelations/` | game | 8 | 3970 | 3419–4625 | hero-key-art · **byline** · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| `/assassins-creed-liberation/` | game | 27 | 3940 | 6567–8885 | hero-key-art · **byline** · **toc** · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| `/ezio-auditore/` | topic | 29 | 3760 | 3037–4109 | **byline** · **toc** · story-row · card-rail · _card-rail_ · **gallery** · **verdict-box** · cta-band |
| `/assassins-creed-chronicles/` | game | 16 | 2820 | 4665–6311 | hero-key-art · **byline** · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| `/assassins-creed-bloodlines/` | game | 3 | 1450 | 3075–4161 | hero-key-art · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| `/poradniki/` | hub | 4 | 830 | 3900–5276\* | hero-key-art · card-rail · link-columns · cta-band |
| └ `/poradniki/od-czego-zaczac/` | guide | 2 | 390 | 7675–10383 | **byline** · story-row · link-list · cta-band |
| `/assassins-creed-pirates/` | game | 5 | 660 | 2492–3372 | hero-key-art · **byline** · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| `/mapa-miejsc-historycznych/` | map | 45 | 510 | 2120–2868 | hero-key-art · **byline** · story-row · link-list |
| `/assassins-creed-ii-wojna-swiatowa/` | topic | 9 | 170 | 2718–3678 | **byline** · story-row · card-rail · **gallery** · **verdict-box** · cta-band |
| `/assassins-creed-shadows/` | game | 5 | 160 | 3900–5276\* | hero-key-art · story-row · card-rail · cta-band |
| `/assassins-creed-rodowod/` | topic | 4 | 160 | 3900–5276\* | story-row · card-rail · cta-band |
| `/assassins-creed-za-darmo/` | topic | 4 | 120 | 474–642 | **byline** · story-row · card-rail · cta-band |

**У четырёх страниц анатомии нет** — `/assassins-creed-2/discovery/`,
`/assassins-creed-shadows/`, `/assassins-creed-rodowod/` и `/poradniki/`:
корзина покрытия low или своих документов меньше четырёх. У них остаётся
умолчание типа и план содержания по нише — так велит Часть D.3, и это
пометка, а не пробел.

## Как читается `blocks[]`

Три источника не смешиваются, и это главное свойство поля:

- **`type-default`, `confidence: low`** — скелет по типу страницы
  (`core/structure/type-blocks.json`). Это соглашение, а не измерение.
- **`anatomy`, `confidence: high` или `medium`, `evidence: «7/8»`** — норма
  жанра, измеренная по корпусу: у скольких документов элемент найден. `high` —
  элемент у 70 % документов и выше, `medium` — 40–69 %.
- **`manual`, `confidence: high`** — решение человека. Сегодня таких два, оба
  с приёмки дерева: раздел нумерации серии на главной и раздел издания
  The Ezio Collection на странице персонажа.

Порядок в списке — порядок на странице. Анатомия места не мерила: положение
элемента в документе корпус даёт ненадёжно. Порядок взят редакторским
умолчанием (`structure/rules-s3.json`, `порядок_на_странице`) и уточняется
при вёрстке, а не здесь.

## Что осталось за пределами страниц

| Куда | Запросов | Чем это было |
|---|---:|---|
| `no_page` | 311 | магазинный интент (изданиями и площадками), побочные темы серии, хвост без восстановленной темы |
| `exclusions` | 34 | чужие вселенные и коды-артикулы |

Обе пачки подтверждены владельцем на S0 (П25); из `no_page` на S2 вернулись
семь запросов двух кластеров «gb» — решением П26, отдельным полем и с печатью
в выводе инструмента.

**Сквозные темы без кластера** (`ksiazki`, `lore`, `przejscie`, `mobilne`,
`rating`, `lokalizacja` — 26 фраз, 600 запросов в месяц) страницами не стали
и живут ключами на ближайших страницах: страницей может стать только кластер.
К ним, как и к FAQ с блоком похожего, возвращаются по данным Search Console
после индексации волны 1 (П26, П28).

## Открытые вопросы жанра

**1. Вердикт без балла.** `verdict-box` стоит на 22 страницах, и по решению
П28 это вывод словами: балл ниша ставит, мы — нет. Как именно он выглядит,
решается при вёрстке блока, но правило записано заранее, чтобы вёрстка
не завела шкалу «10 из 10» по инерции.

**2. Четыре блока не реализованы.** `verdict-box`, `gallery`, `byline`, `toc`
названы, но файлов под ними нет. Это законное состояние словаря
(`core/structure/blocks.json`: «нереализованное имя допустимо») — анатомия
называет блок раньше, чем P3 вынесет компонент. Порядок работ задан П27:
инструменты приёмки и вёрстка первой страницы волны 1.

**3. Коридор `/assassins-creed-za-darmo/` оставлен как измерен** — 474–642
знака, решение владельца. Число честное: все шесть документов кластера —
короткие новости о раздачах. Писать по нему страницу нельзя, и это сказано
здесь, чтобы при вёрстке коридор не приняли за норму.

**4. `/assassins-creed-valhalla/` держит 270 запросов из 1081** — четверть
всей семантики страниц. План содержания у неё самый тяжёлый, и разложить его
по разделам придётся глазами.

## Что дальше

Структура закрыта: дерево, план содержания и `blocks[]` собраны и проверены
машиной. Дальше — вёрстка по П27: инструменты приёмки в репозиторий, затем
первая страница волны 1, вместе с ней сокрытие формы поиска `/szukaj/`
и правка второй схемы навигации в подвале.
