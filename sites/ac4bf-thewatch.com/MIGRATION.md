# MIGRATION — переезд главной в `sites/ac4bf-thewatch.com/`

Фаза 0 проекта Site Factory. Задача одна: не потерять уже сделанную главную
`ac4bf-thewatch.com` и доказать, что рендер не изменился.

| | |
|---|---|
| Дата | 2026-09-04 |
| Ветка | `phase0-migration` → `main` |
| Тег отката | `phase0-baseline` на `5498d41` |
| Коммиты | `4547573` (0a) · `8ea2c42` (DECISIONS.md) · `b59cfd3` (0b) · 0c · 0d |
| Node / npm | 26.4.0 / 11.17.0 |
| Astro | 7.2.10 (в lock; в манифесте `^7.2.6`) |
| Tailwind | 4.3.3 · sharp 0.35.4 |

Фаза выполнена четырьмя коммитами, у каждого свой гейт. `0a` и `0b` намеренно
не склеены: `0a` меняет содержимое одного файла и потому не может быть
побайтово нейтральным, `0b` не меняет содержимого вообще и потому проверяется
с нулевым допуском.

---

## 1. Что переехало

Правило: **папка сайта стала и корнем Astro-приложения, и `projectRoot` для
скилла impeccable.** Всё, что эти два инструмента ищут относительно своего
корня, уехало вниз; фабричное осталось в корне репозитория.

Относительные пути внутри переехавшего дерева **не изменились** — именно
поэтому сборка идентична (см. §6).

| Было | Стало | Почему |
|---|---|---|
| `src/` (35 файлов) | `sites/ac4bf-thewatch.com/src/` | приложение, целиком одним куском |
| `public/favicon.svg` | `sites/ac4bf-thewatch.com/public/` | `/favicon.svg` — единственная корнеотносительная строка в коде |
| `astro.config.mjs` | `sites/ac4bf-thewatch.com/` | **расположение этого файла задаёт корень Astro** |
| `tsconfig.json` | `sites/ac4bf-thewatch.com/` | `include: ["**/*"]` разрешается относительно себя |
| `tools/` (5 скриптов) | `sites/ac4bf-thewatch.com/tools/` | каждый берёт корень как `dirname(import.meta.url)/..` |
| `.impeccable/` (35 файлов) | `sites/ac4bf-thewatch.com/.impeccable/` | `getImpeccableDir() = projectRoot + '/.impeccable'` |
| `DESIGN.md` | `sites/ac4bf-thewatch.com/` | посайтовая дизайн-система «Skok wiary» |
| `docs/03_BRIEF_ac4bf-thewatch.yaml` | `sites/ac4bf-thewatch.com/brief/site.yaml` | заготовка брифа стала брифом сайта |

Итого 80 переименований. Полный список — в приложении А.

### Осталось в корне репозитория

| Путь | Почему |
|---|---|
| `PRODUCT.md` | описывает фабрику, а не сайт: слово `ac4bf` в нём не встречается ни разу. Наследуется всеми сайтами — см. §5 |
| `docs/`, `archiv/`, `references/` | фабричный уровень. `archiv/*` — единственный письменный разбор `references/1–5`, то есть артефакт стадии REFERENCE |
| `.claude/` (скилл impeccable + 4 агента) | Claude Code ищет их от корня рабочей папки, не от `projectRoot` |
| `package-lock.json` | у npm-воркспейсов ровно один lock-файл, на корне. `sites/*/package-lock.json` не создаём никогда |
| `.gitignore` | все шаблоны не заякорены и совпадают на любой глубине, поэтому `sites/*/dist/` и `sites/*/.astro/` уже покрыты. `.claude/settings.local.json` содержит слэш и заякорен на корень — там `.claude/` и остался. **Файл не правился** |
| `DECISIONS.md` | журнал решений фабрики |

### Удалено, а не перенесено

`node_modules/`, `dist/`, `.astro/`, `.playwright-mcp/` — генерируемое и
перечислено в `.gitignore`. Пересоздаются сборкой.

---

## 2. Правок импортов: НОЛЬ

Ни один импорт, путь или спецификатор в `src/` не изменён. Основания, проверенные
пофайлово до переезда:

- все импорты внутри `src/` относительные (`./`, `../`) и не выходят за `src/`;
- алиасов путей нет: в `tsconfig.json` отсутствуют `paths` и `baseUrl`;
- контент-коллекций нет — `.astro/content.d.ts` даёт `ContentConfig = never`,
  поэтому жёсткая привязка `srcDir/content` ни при чём;
- оба `import.meta.glob` в `src/components/EraMedia.astro` (`../assets/gry/*`,
  `../assets/foto/*`) относительны файлу, а сопоставление идёт по
  `path.endsWith('/' + slot + '.jpg')` — от глубины вложенности не зависит;
- единственная корнеотносительная строка в коде, `href="/favicon.svg"`
  в `src/layouts/Base.astro:26`, осталась верной: `public/` переехал вместе
  с приложением.

---

## 3. Что всё-таки правилось

Три файла, и только один из них — из `src/`.

### 3.1. `src/styles/global.css:1` — коммит `0a`

```diff
-@import 'tailwindcss';
+@import 'tailwindcss' source('../../src');
```

**Зачем.** Tailwind v4 сканирует корень Vite/Astro, а не папку CSS-файла.
До правки в отгружаемый CSS попадали строки-кандидаты из вендоренного скилла
`.claude/skills/impeccable/**` — 80 мёртвых селекторов. Ни один не использовался:
в `index.html` 159 class-токенов, все рукописные, `@apply` в `global.css` нет.
CSS похудел с 49 154 до 40 300 байт, при этом `index.html` остался побайтово
идентичен с точностью до имени CSS-файла.

Без этой правки переезд убрал бы `.claude/` из зоны сканирования сам, и
побайтово идентичная сборка на шаге `0b` была бы невозможна в принципе.

`source(...)` задаёт `compiler.root`, то есть **заменяет** неявный источник
`{base: viteRoot, pattern: "**/*"}`, а не дополняет его, как сделал бы `@source`.

### 3.2. Новый корневой `package.json`

Только `workspaces: ["sites/*"]` и три оркестрационных скрипта через
`--workspaces --if-present`. **Без `astro` в зависимостях и без голого скрипта
`astro build`** — это предохранитель: в корне больше нет `astro.config.mjs`,
и сборка оттуда собрала бы сайт с дефолтным конфигом (без sitemap, без Tailwind,
`site` не задан) в `<repo>/dist`. Появление `dist/` в корне — признак того,
что собрали не оттуда.

### 3.3. `"name"` в манифесте сайта

`site-generator` → `ac4bf-thewatch.com`. Обязательно: корень уже занимает имя
`site-generator`, два одинаковых имени в одном воркспейсе дают
`EDUPLICATEWORKSPACE`. Ничего не импортирует пакет по имени, публикации нет
(`private: true`), поэтому переименование безопасно. Работают обе формы:
`-w ac4bf-thewatch.com` и `-w sites/ac4bf-thewatch.com`.

---

## 4. Инвариант окончаний строк

**В репозитории они смешанные, и это надо знать до любой правки.**

| Файл | Окончания |
|---|---|
| `sites/ac4bf-thewatch.com/src/styles/global.css` | CRLF |
| `sites/ac4bf-thewatch.com/package.json` | CRLF (32 строки) |
| `PRODUCT.md` | CRLF |
| `.gitignore` | CRLF |
| корневой `package.json` | LF |
| `package-lock.json` | LF |
| `sites/ac4bf-thewatch.com/astro.config.mjs`, `tsconfig.json` | LF |
| `DECISIONS.md`, `docs/*` | LF |

`core.autocrlf=false`, `core.eol` не задан — git ничего не конвертирует,
в объектах лежит ровно то, что в рабочем дереве.

**Две ловушки, обе сработали по ходу Фазы 0.**

1. **`sed -i` нормализует переводы строк по всему файлу.** Первая попытка
   правки `global.css` дала диффу в 585 строк вместо одной: sed прочитал
   CRLF-файл, отбросил `\r` и записал LF. Правка сделана заново через
   `printf` + `tail -n +2` с явным `\r\n`. **Для правок содержимого в этом
   репозитории `sed -i` использовать нельзя.**

2. **npm берёт окончания строк `package-lock.json` из корневого
   `package.json`.** Корневой манифест, созданный в CRLF, заставил
   `npm install` переписать весь lock из LF в CRLF: диффа раздулась до
   5910 строк и скрыла настоящее изменение в 25 добавлений и 14 удалений.
   Лечится тем, что корневой `package.json` держится в LF — тогда lock
   остаётся LF и диффа читается построчно.

### `.gitattributes` — применён

Правило вместо памяти. Взят осторожный вариант: заморозить текущие байты, ничего
не перенормируя.

```gitattributes
# В репозитории смешанные окончания строк, и это осознанно: содержимое файлов
# в Фазе 0 не менялось. Git не конвертирует ничего ни при checkout, ни при commit.
* -text

# Исключение: lock переписывается npm, и его окончания зависят от корневого
# package.json. Пин на LF делает диффу lock читаемой независимо от того,
# в чём окажется манифест.
package-lock.json text eol=lf
```

Проверено, что правило ничего не перенормирует: `git add --renormalize .` не
тронул ни одного отслеживаемого файла, а `git ls-files --eol` до и после
совпадает построчно — у всех файлов `i/` равно `w/`.

**Чего сознательно не взяли:** `* text=auto eol=lf`. Это перевело бы все
CRLF-файлы (`global.css`, манифест сайта, `PRODUCT.md`, `.gitignore`) на LF
одним большим коммитом. Если стандартизация на LF понадобится — это отдельное
осознанное решение и отдельный коммит, а не побочный эффект настройки атрибутов.

---

## 5. Неочевидные инварианты — не сломать при доработке

- **`tools/` обязан оставаться прямым потомком корня Astro.** Все пять скриптов
  берут корень как `join(dirname(fileURLToPath(import.meta.url)), '..')`.
  Если `tools/` отстанет от `src/`, `check-contrast.mjs` упадёт с `ENOENT`
  на `<root>/src/styles/global.css`, а `fetch-art.mjs` начнёт писать ассеты
  туда, где их никто не читает.
- **Расположение `astro.config.mjs` задаёт пространство хешей скоупа.** Astro
  передаёт компилятору `normalizedFilename` — путь относительно `config.root`,
  и из него выводятся `data-astro-cid-*`. Добавление `root`/`srcDir`/`outDir`
  в конфиг или сборка из другой папки меняют все хеши разом.
- **`src/assets/foto/` намеренно не существует.** Глоб в `EraMedia.astro` по
  отсутствующей папке молча возвращает `{}` — это рабочая ветка, папку создаёт
  `tools/fetch-art.mjs`. Не «чинить».
- **`src/data/art-credits.json` — это `{}` намеренно.** Пока он пуст, ветка
  фотографий не рендерится и весь арт эпох приходит из `src/assets/gry/`.
- **Зона сканирования Tailwind прибита к `src/` сайта.** Компоненты, вынесенные
  в `core/`, в неё не попадут — Tailwind вдобавок не сканирует `node_modules`,
  а воркспейс-пакет подключается симлинком оттуда. При первом выносе блока
  понадобится `@source '../../../../core';`. Подробнее — в корневом `DECISIONS.md`.
- **Контекст impeccable разрешается пофайлово.** `PRODUCT.md` наследуется
  от корня репозитория, `DESIGN.md` берётся из папки сайта. Если у сайта
  появится собственный `PRODUCT.md`, он перекроет корневой автоматически.

---

## 6. Три подтверждения

### Подтверждение 1 — идентичность сборки

`sites/ac4bf-thewatch.com/dist` **побайтово идентичен** сборке до переезда.
Манифест SHA-256 всех 50 файлов, сравнение с эталоном `manifest-0a.txt`:

```
$ diff manifest-0a.txt manifest-0b.txt
$ echo $?
0
```

Пустой вывод, нулевой допуск. Совпали в том числе хеши скоупа `data-astro-cid-*`,
имена всех 24 трансформированных `.webp` и 5 `.jpg`, 12 файлов шрифтов,
`sitemap-0.xml`, `sitemap-index.xml`, `favicon.svg` и `canonical`.

Гейт `0a` (правка Tailwind, до переезда) отработал ровно как предсказано:
изменились 2 файла из 50 — `index.*.css` и `index.html`; `index.html` побайтово
идентичен с точностью до имени CSS-файла; селекторы CSS — 0 добавлений,
80 удалений; пересечение удалённых селекторов со 159 используемыми классами — 0.

### Подтверждение 2 — идентичность зависимостей

407 разрешённых версий не изменились при переходе на воркспейсы:

```
$ diff versions-before.txt versions-after.txt
$ echo $?
0
```

Якоря: `astro@7.2.10`, `tailwindcss@4.3.3`, `sharp@0.35.4`.

Проверка обязательна и идёт **первой**: `npm ci` после перехода на воркспейсы
падает, поэтому один `npm install` неизбежен, а он может увести версию внутри
`^`-диапазона. Без этой сверки расхождение сборки было бы неотличимо от провала
переезда.

**Расхождение по `sharp` — предсуществующее, переездом не внесено.** Старый
`package.json` объявлял `sharp: ^0.35.4` в `devDependencies`, а корневой узел
старого lock его не содержал: sharp приходил только опциональной транзитивной
зависимостью astro. Обязательный `npm install` это согласовал — отсюда в диффе
lock смена флага `optional` → `devOptional` у `sharp` и `@img/colour`.
Состав и версии не изменились, что и показывает сверка выше.

### Подтверждение 3 — гейты и визуал

`npm run gates -w ac4bf-thewatch.com` — вывод и код возврата не изменились:
39/39 пар контраста, 18 файлов токенов, `exit=0`. Это заодно прямая проверка,
что `tools/` остался прямым потомком корня.

Контекст impeccable из папки сайта разрешается верно:

```
"projectRoot": "…\\sites\\ac4bf-thewatch.com",
"repoRoot":    "…\\site-generator",
"productPath": "..\\..\\PRODUCT.md",     ← inherited
"designPath":  "DESIGN.md",              ← child
"surfaceBriefPath": ".impeccable\\surfaces\\src-pages-index-astro.md",
"surfaceBriefReason": "slug"
```

Бриф поверхности найден **по слагу**, а не по запасному «единственный бриф
в папке»: относительный путь `src/pages/index.astro` не изменился, поэтому ни
переименование файла, ни правка фронтматтера не потребовались.

Эталон рендера — `_baseline/`, четыре кадра с прод-превью (`astro preview`),
не с dev-сервера: в dev Astro включает `annotateSourceFile` и dev-toolbar,
поэтому dev-разметка заведомо не равна прод-сборке.

| Файл | Размер |
|---|---|
| `baseline-desktop-hero-1440x900.png` | 1440×900 |
| `baseline-desktop-full-1440.png` | 1440×8819 |
| `baseline-mobile-hero-390x844.png` | 390×844 |
| `baseline-mobile-full-390.png` | 390×11617 |

**Высоты не совпадают со старыми снимками `.impeccable/review/`
(8678 и 8659) — это ожидаемо и не регрессия.** В `EraMedia` и `CatalogStack`
есть `loading="lazy"`; если не прокрутить страницу до низа перед съёмкой,
часть картинок не успевает занять место и full-page выходит короче. Именно
поэтому у старой пары impeccable две разные высоты между собой — 8678 и 8659.
Эталоны `_baseline/` сняты после явной прокрутки до конца и обратно, с
ожиданием `document.fonts.ready`; на момент съёмки 11 из 11 изображений
загружены. То есть `_baseline/` длиннее, потому что он полный.

Скриншоты — **вторичная** проверка. Основная — манифест: он покрывает все
50 файлов, включая то, куда скриншот не дотянется (карты сайта, шрифты,
`.webp`-варианты на ширины, которые ни один тестовый вьюпорт не выберет,
правила за неподошедшими медиазапросами). Гейтить на байтах PNG нельзя —
растеризация шрифтов между прогонами не детерминирована; сверяются размеры
и глаз.

---

## 7. Как это запускается теперь

```bash
npm install                                  # один раз, из корня репозитория
npm run dev     -w ac4bf-thewatch.com        # http://localhost:4321/
npm run build   -w ac4bf-thewatch.com
npm run preview -w ac4bf-thewatch.com        # прод-сборка, для съёмки эталонов
npm run gates   -w ac4bf-thewatch.com        # контраст + токены
npm run build                                # все сайты: --workspaces --if-present
```

Голый `astro build` из корня репозитория — **ошибка**: там нет
`astro.config.mjs`. Появление `dist/` в корне это и означает.

---

## 8. Отложено намеренно

- ~~**`site: 'https://bractwo.example'`**~~ — **сделано после приёмки Фазы 0,
  отдельным коммитом.** См. §9.
- **Корневой `PRODUCT.md`** всё ещё описывает шаблон-для-клонирования и прямо
  отрицает монорепо. Правится отдельным коммитом (Р1, Р6 в `DECISIONS.md`).
  Собственный `PRODUCT.md` сайта, когда появится, перекроет корневой без настройки.
- **`.impeccable/design.json` старее `DESIGN.md`** (сайдкар 16:51, документ 22:36
  того же дня). Дрейф был до Фазы 0; `impeccable doctor` его покажет. Чинить —
  это правка контента, не переезда.
- **34 МБ скриншотов в `.impeccable/review/`.** Перенесены, не удалены: в
  репозитории один исходный коммит, блобы уже в истории, и `git rm` не уменьшил
  бы клон без переписывания истории, зато уничтожил бы визуальный след, на
  который опирается `contact-sheet.mjs`. Вопрос хранения — отдельное решение.
- **`core/`** — не создан. Пустая папка «на будущее» — расширение объёма без гейта.

---

## 9. После приёмки: реальный домен

`site: 'https://bractwo.example'` → `'https://ac4bf-thewatch.com'`.
Отдельным коммитом, уже в `main`, потому что правка ломает побайтовую сверку
Фазы 0 — что и подтвердилось ровно в ожидаемом объёме.

Против эталона Фазы 0 изменились **три файла из 50** и только они:
`index.html`, `sitemap-0.xml`, `sitemap-index.xml`. CSS, все 24 `.webp`,
5 `.jpg`, 12 шрифтов и `favicon.svg` — побайтово те же.

`index.html` с нормализованными доменом и именем CSS-файла **идентичен**
сборке до Фазы 0, и все 11 хешей скоупа `data-astro-cid-*` совпадают.
Строки `bractwo.example` в `dist/` не осталось.

### Эталон `_baseline/` пересниматься не стал — и это проверено, а не предположено

Пересъёмка выполнена (прод-превью, тот же протокол: `document.fonts.ready`,
прокрутка до низа и обратно, 11 из 11 изображений загружены, высоты те же
8819 и 11617). Результат сравнён с лежащими в репозитории эталонами попиксельно
через `sharp`:

| Кадр | Отличий |
|---|---|
| `baseline-desktop-hero-1440x900.png` | побайтово идентичен |
| `baseline-mobile-hero-390x844.png` | побайтово идентичен |
| `baseline-desktop-full-1440.png` | 0.2808 % субпикселей, макс. отклонение 12 из 255 |
| `baseline-mobile-full-390.png` | 0.3027 % субпикселей, макс. отклонение 10 из 255 |

Это шум растеризации шрифтов и композитинга на длинной странице — тот самый,
из-за которого гейтить на байтах PNG запрещено (§6). Визуальной разницы нет,
и её и не могло быть: домен живёт в `<link rel="canonical">` и в карте сайта,
в пиксели он не попадает по построению.

Поэтому файлы эталона **оставлены прежними**: замена добавила бы около 5 МБ
бинарных блобов в историю ради шума. Эталон остаётся действительным —
доказательством служит сверка выше, а не дата съёмки файлов.

Пересниматься `_baseline/` обязан тогда, когда меняется **рендер**, а не
метаданные документа.

---

## Приложение А. Полный список переименований (80)

| Было | Стало |
|---|---|
| `.impeccable/design.json` | `sites/ac4bf-thewatch.com/.impeccable/design.json` |
| `.impeccable/questions/6069a34d.state.json` | `sites/ac4bf-thewatch.com/.impeccable/questions/6069a34d.state.json` |
| `.impeccable/review/ac-desktop-full.png` | `sites/ac4bf-thewatch.com/.impeccable/review/ac-desktop-full.png` |
| `.impeccable/review/ac-desktop-hero.png` | `sites/ac4bf-thewatch.com/.impeccable/review/ac-desktop-hero.png` |
| `.impeccable/review/ac-figure.png` | `sites/ac4bf-thewatch.com/.impeccable/review/ac-figure.png` |
| `.impeccable/review/ac-final-full.png` | `sites/ac4bf-thewatch.com/.impeccable/review/ac-final-full.png` |
| `.impeccable/review/ac-full-2.png` | `sites/ac4bf-thewatch.com/.impeccable/review/ac-full-2.png` |
| `.impeccable/review/ac-hero-2.png` | `sites/ac4bf-thewatch.com/.impeccable/review/ac-hero-2.png` |
| `.impeccable/review/ac-hero-3.png` | `sites/ac4bf-thewatch.com/.impeccable/review/ac-hero-3.png` |
| `.impeccable/review/ac-hero-final.png` | `sites/ac4bf-thewatch.com/.impeccable/review/ac-hero-final.png` |
| `.impeccable/review/ac-hero-fixed.png` | `sites/ac4bf-thewatch.com/.impeccable/review/ac-hero-fixed.png` |
| `.impeccable/review/ac-mobile-2.png` | `sites/ac4bf-thewatch.com/.impeccable/review/ac-mobile-2.png` |
| `.impeccable/review/ac-mobile-3.png` | `sites/ac4bf-thewatch.com/.impeccable/review/ac-mobile-3.png` |
| `.impeccable/review/ac-mobile-final.png` | `sites/ac4bf-thewatch.com/.impeccable/review/ac-mobile-final.png` |
| `.impeccable/review/ac-mobile-hero.png` | `sites/ac4bf-thewatch.com/.impeccable/review/ac-mobile-hero.png` |
| `.impeccable/review/arkusz-ac1.jpg` | `sites/ac4bf-thewatch.com/.impeccable/review/arkusz-ac1.jpg` |
| `.impeccable/review/arkusz-foto.jpg` | `sites/ac4bf-thewatch.com/.impeccable/review/arkusz-foto.jpg` |
| `.impeccable/review/arkusz-gry.jpg` | `sites/ac4bf-thewatch.com/.impeccable/review/arkusz-gry.jpg` |
| `.impeccable/review/arkusz-japonia.jpg` | `sites/ac4bf-thewatch.com/.impeccable/review/arkusz-japonia.jpg` |
| `.impeccable/review/arkusz-londyn.jpg` | `sites/ac4bf-thewatch.com/.impeccable/review/arkusz-londyn.jpg` |
| `.impeccable/review/final-hero.png` | `sites/ac4bf-thewatch.com/.impeccable/review/final-hero.png` |
| `.impeccable/review/foto-full-2.png` | `sites/ac4bf-thewatch.com/.impeccable/review/foto-full-2.png` |
| `.impeccable/review/foto-full.png` | `sites/ac4bf-thewatch.com/.impeccable/review/foto-full.png` |
| `.impeccable/review/foto-hero.png` | `sites/ac4bf-thewatch.com/.impeccable/review/foto-hero.png` |
| `.impeccable/review/foto-japonia-2.png` | `sites/ac4bf-thewatch.com/.impeccable/review/foto-japonia-2.png` |
| `.impeccable/review/foto-japonia.png` | `sites/ac4bf-thewatch.com/.impeccable/review/foto-japonia.png` |
| `.impeccable/review/foto-mobile.png` | `sites/ac4bf-thewatch.com/.impeccable/review/foto-mobile.png` |
| `.impeccable/review/foto-wlochy.png` | `sites/ac4bf-thewatch.com/.impeccable/review/foto-wlochy.png` |
| `.impeccable/review/gry-full.png` | `sites/ac4bf-thewatch.com/.impeccable/review/gry-full.png` |
| `.impeccable/review/gry-hero.png` | `sites/ac4bf-thewatch.com/.impeccable/review/gry-hero.png` |
| `.impeccable/review/gry-japonia.png` | `sites/ac4bf-thewatch.com/.impeccable/review/gry-japonia.png` |
| `.impeccable/review/gry-karaiby.png` | `sites/ac4bf-thewatch.com/.impeccable/review/gry-karaiby.png` |
| `.impeccable/review/gry-mobile.png` | `sites/ac4bf-thewatch.com/.impeccable/review/gry-mobile.png` |
| `.impeccable/review/ostry-hero.png` | `sites/ac4bf-thewatch.com/.impeccable/review/ostry-hero.png` |
| `.impeccable/surfaces/src-pages-index-astro.md` | `sites/ac4bf-thewatch.com/.impeccable/surfaces/src-pages-index-astro.md` |
| `DESIGN.md` | `sites/ac4bf-thewatch.com/DESIGN.md` |
| `astro.config.mjs` | `sites/ac4bf-thewatch.com/astro.config.mjs` |
| `docs/03_BRIEF_ac4bf-thewatch.yaml` | `sites/ac4bf-thewatch.com/brief/site.yaml` |
| `public/favicon.svg` | `sites/ac4bf-thewatch.com/public/favicon.svg` |
| `src/assets/gry/hero.jpg` | `sites/ac4bf-thewatch.com/src/assets/gry/hero.jpg` |
| `src/assets/gry/japonia-okladka.jpg` | `sites/ac4bf-thewatch.com/src/assets/gry/japonia-okladka.jpg` |
| `src/assets/gry/japonia.jpg` | `sites/ac4bf-thewatch.com/src/assets/gry/japonia.jpg` |
| `src/assets/gry/jerozolima-okladka.jpg` | `sites/ac4bf-thewatch.com/src/assets/gry/jerozolima-okladka.jpg` |
| `src/assets/gry/jerozolima.jpg` | `sites/ac4bf-thewatch.com/src/assets/gry/jerozolima.jpg` |
| `src/assets/gry/karaiby-okladka.jpg` | `sites/ac4bf-thewatch.com/src/assets/gry/karaiby-okladka.jpg` |
| `src/assets/gry/karaiby.jpg` | `sites/ac4bf-thewatch.com/src/assets/gry/karaiby.jpg` |
| `src/assets/gry/londyn-okladka.jpg` | `sites/ac4bf-thewatch.com/src/assets/gry/londyn-okladka.jpg` |
| `src/assets/gry/londyn.jpg` | `sites/ac4bf-thewatch.com/src/assets/gry/londyn.jpg` |
| `src/assets/gry/wlochy-okladka.jpg` | `sites/ac4bf-thewatch.com/src/assets/gry/wlochy-okladka.jpg` |
| `src/assets/gry/wlochy.jpg` | `sites/ac4bf-thewatch.com/src/assets/gry/wlochy.jpg` |
| `src/components/CatalogStack.astro` | `sites/ac4bf-thewatch.com/src/components/CatalogStack.astro` |
| `src/components/CreedBand.astro` | `sites/ac4bf-thewatch.com/src/components/CreedBand.astro` |
| `src/components/CtaBand.astro` | `sites/ac4bf-thewatch.com/src/components/CtaBand.astro` |
| `src/components/DescentRail.astro` | `sites/ac4bf-thewatch.com/src/components/DescentRail.astro` |
| `src/components/EraLayer.astro` | `sites/ac4bf-thewatch.com/src/components/EraLayer.astro` |
| `src/components/EraMedia.astro` | `sites/ac4bf-thewatch.com/src/components/EraMedia.astro` |
| `src/components/EraSkyline.astro` | `sites/ac4bf-thewatch.com/src/components/EraSkyline.astro` |
| `src/components/Grain.astro` | `sites/ac4bf-thewatch.com/src/components/Grain.astro` |
| `src/components/GuideRail.astro` | `sites/ac4bf-thewatch.com/src/components/GuideRail.astro` |
| `src/components/Hero.astro` | `sites/ac4bf-thewatch.com/src/components/Hero.astro` |
| `src/components/Icon.astro` | `sites/ac4bf-thewatch.com/src/components/Icon.astro` |
| `src/components/SiteFooter.astro` | `sites/ac4bf-thewatch.com/src/components/SiteFooter.astro` |
| `src/components/SiteHeader.astro` | `sites/ac4bf-thewatch.com/src/components/SiteHeader.astro` |
| `src/components/Viewpoint.astro` | `sites/ac4bf-thewatch.com/src/components/Viewpoint.astro` |
| `src/components/Wordmark.astro` | `sites/ac4bf-thewatch.com/src/components/Wordmark.astro` |
| `src/data/art-credits.json` | `sites/ac4bf-thewatch.com/src/data/art-credits.json` |
| `src/data/art.json` | `sites/ac4bf-thewatch.com/src/data/art.json` |
| `src/data/art.ts` | `sites/ac4bf-thewatch.com/src/data/art.ts` |
| `src/data/game-art.json` | `sites/ac4bf-thewatch.com/src/data/game-art.json` |
| `src/data/games.json` | `sites/ac4bf-thewatch.com/src/data/games.json` |
| `src/data/site.ts` | `sites/ac4bf-thewatch.com/src/data/site.ts` |
| `src/layouts/Base.astro` | `sites/ac4bf-thewatch.com/src/layouts/Base.astro` |
| `src/pages/index.astro` | `sites/ac4bf-thewatch.com/src/pages/index.astro` |
| `src/styles/global.css` | `sites/ac4bf-thewatch.com/src/styles/global.css` |
| `tools/check-contrast.mjs` | `sites/ac4bf-thewatch.com/tools/check-contrast.mjs` |
| `tools/check-tokens.mjs` | `sites/ac4bf-thewatch.com/tools/check-tokens.mjs` |
| `tools/contact-sheet.mjs` | `sites/ac4bf-thewatch.com/tools/contact-sheet.mjs` |
| `tools/fetch-art.mjs` | `sites/ac4bf-thewatch.com/tools/fetch-art.mjs` |
| `tools/fetch-game-art.mjs` | `sites/ac4bf-thewatch.com/tools/fetch-game-art.mjs` |
| `tsconfig.json` | `sites/ac4bf-thewatch.com/tsconfig.json` |
