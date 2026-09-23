---
name: Зимняя ночь
description: "Нуар фан-сайта Max Payne: холодная сине-чёрная ночь, снег вместо белого и один тёплый свет — натриевый фонарь."

# Фронтматтер нормативен. Значения совпадают со `src/styles/global.css` —
# это его контракт: токен, отсутствующий здесь, в CSS не появляется.
# Проза ниже объясняет, где и почему токен применяется, но не переобъявляет
# его значение. Шасси (имена токенов, роли, шкала, радиусы, конструкция) —
# первого сайта (П63 п. 3 (а)); переопределены значения палитры и гарнитуры.
colors:
  # --- Шасси: холодная сине-чёрная ночь ---
  bg: "#090c11"                              # фон страницы
  bg-band: "#0e1217"                         # соседняя полоса, подвал, ящик меню
  surface: "#13181e"                         # карточка
  surface-2: "#1b2026"                       # приподнятая поверхность, тихая кнопка
  ink: "#e5eaee"                             # основной текст — снег, намеренно не #FFF
  ink-muted: "#a1abb3"                       # лид, подписи, подвал
  hairline: "rgb(229 234 238 / 0.12)"        # волос обрамления
  hairline-strong: "rgb(229 234 238 / 0.26)" # контурная кнопка, рамка карточки под курсором
  wash: "rgb(229 234 238 / 0.06)"            # подсветка контурной кнопки под курсором
  wash-strong: "rgb(229 234 238 / 0.1)"      # подсветка тихой кнопки под курсором
  danger: "#e85c57"                          # только опасность, никогда не декор

  # --- Марка: натриевый фонарь и сталь ---
  accent: "#eca84a"                          # заливки: главная кнопка, выделение, «к содержанию»
  accent-text: "#f2bd6e"                     # ссылка, обводка фокуса, текстовый акцент
  ink-on-accent: "#170d04"                   # текст на заливке фонаря
  accent-2: "#809db2"                        # сталь: орнамент, счётчик, полоса прокрутки под курсором

typography:
  # Две гарнитуры, роли не пересекаются. Файлы — свои (`@fontsource`),
  # подмножество latin, насыщенности: заголовок 600, текст 400/500/600.
  headline:
    fontFamily: "'Libre Bodoni', ui-serif, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(1.75rem, 1.25rem + 2.2vw, 2.75rem)"
    fontWeight: 600
    lineHeight: 1.14
    letterSpacing: "0.02em"
  title:
    fontFamily: "'Libre Franklin', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.3125rem"
    fontWeight: 600
    lineHeight: 1.28
    letterSpacing: "0.03em"
  lead:
    fontFamily: "'Libre Franklin', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(1.0625rem, 1rem + 0.35vw, 1.1875rem)"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  body:
    fontFamily: "'Libre Franklin', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  caption:
    fontFamily: "'Libre Franklin', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "0.02em"
  label:
    fontFamily: "'Libre Franklin', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.14em"
  micro:
    fontFamily: "'Libre Franklin', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.16em"
  button:
    fontFamily: "'Libre Franklin', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.06em"

rounded:
  # Шасси: набор схлопнут до двух ступеней.
  none: "0"
  sharp: "2px"

spacing:
  # 4-based, одиннадцать ступеней. Промежуточных значений не бывает.
  "3xs": "4px"
  "2xs": "8px"
  xs: "12px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "48px"
  "2xl": "64px"
  "3xl": "96px"
  "4xl": "128px"
  "5xl": "160px"

components:
  # Геометрия — шасси ядра (`core/styles/button.css`, `card.css`); цвета — этой темы.
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink-on-accent}"
    typography: "{typography.button}"
    rounded: "{rounded.sharp}"
    padding: "0 32px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "color-mix(in oklab, {colors.accent} 88%, {colors.ink})"
    textColor: "{colors.ink-on-accent}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sharp}"
    padding: "0 32px"
    height: "52px"
  button-quiet:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.sharp}"
    padding: "0 24px"
    height: "44px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.accent-text}"
    typography: "{typography.button}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sharp}"
    padding: "24px"
  card-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sharp}"
---

# Design System: Зимняя ночь

## Overview

**Creative North Star: «Зимняя ночь»**

Нью-Йорк в метель, закадровый голос, газетные заголовки — мир Max Payne
в жанре нуар. Страница — ночная улица: холодная сине-чёрная темнота, текст
цвета снега, и один тёплый свет на весь экран — натриевый фонарь. Красный
в этом мире не декор и не марка: он только у опасности.

Сайт стоит на шасси первого сайта фабрики (П63 п. 3 (а)): те же 32 токена
договора `core/styles/ROLES.md`, те же роли и кегли, шкала отступов,
радиусы 0/2px, волосяная линия вместо тени, та же конструкция шапки, подвала
и блоков. Тема этого сайта — значения палитры и две гарнитуры; всё остальное
не переоткрывается. Эпох у сайта нет: бегущие `--era`, `--era-text`,
`--era-ink` равны акценту (ROLES.md §2).

Две гарнитуры — пара американской газеты середины века: **Libre Bodoni**
в заголовках (Бодони газетных шапок и титров) и **Libre Franklin**
в тексте и интерфейсе (Franklin Gothic, гротеск таблоидов). Ни одна
не похожа на логотип и шрифты издателя.

Растровых ассетов и авторской графики у сайта пока нет: арт, кадры и их
лицензия — пачка 0 (П63 п. 5, П71). Зерна (`Grain`) страница не несёт.

**Key Characteristics:**

- Холодная база, снег вместо белого, один тёплый свет — фонарь.
- Одна заливка на экране, и она цвета фонаря.
- Волос вместо тени; тень — только отклик на наведение.
- Две гарнитуры: Бодони в заголовках, Franklin в тексте и интерфейсе.
- Все пары цветов считает гейт и роняет сборку ниже порога.

## Colors

Палитра — холодная почти-чернота с оттенком ночного неба (тон 255°
в OKLCH), снежные чернила и тёплый янтарь фонаря как единственный цвет марки.
Значения подобраны в OKLCH и записаны в hex.

### Primary

- **Фонарь** (`{colors.accent}`): заливка главной кнопки, `::selection`,
  ссылка «к содержанию» при фокусе. На экране залит в одном месте.
- **Фонарь по тексту** (`{colors.accent-text}`): ссылка, обводка фокуса,
  текстовый акцент. Светлее заливки — чтобы текст держал 4,5:1 на всех
  четырёх фонах с запасом.
- **Чернила на фонаре** (`{colors.ink-on-accent}`): единственный цвет текста
  на заливке — тёплая почти-чернота.

### Secondary

- **Сталь** (`{colors.accent-2}`): орнамент, счётчик группы, ползунок полосы
  прокрутки под курсором. Холодная — чтобы фонарь оставался единственным
  тёплым пятном. Сталь не бывает кнопкой.

### Neutral

- **Ночь** (`{colors.bg}`): фон страницы и цвет `theme-color` в голове
  документа (`src/layouts/Base.astro`, литерал равен токену).
- **Полоса** (`{colors.bg-band}`): соседняя секция, подвал, ящик меню,
  дорожка полосы прокрутки.
- **Поверхность** (`{colors.surface}`) и **приподнятая поверхность**
  (`{colors.surface-2}`): карточка; тихая кнопка и ползунок прокрутки.
- **Снег** (`{colors.ink}`) и **приглушённый снег** (`{colors.ink-muted}`):
  заголовок и корпус против лида, подписи, подвала.
- **Волос** (`{colors.hairline}`, `{colors.hairline-strong}`) и **подсветка**
  (`{colors.wash}`, `{colors.wash-strong}`): доли снежных чернил, те же, что
  у шасси.
- **Опасность** (`{colors.danger}`): только предупреждение и запрет.

### Named Rules

**Правило одного тёплого света.** Тёплый цвет в палитре один — фонарь.
Поверхности, чернила, волос и сталь холодные; красный живёт только
у опасности и марки не образует.

**Правило одной заливки.** В пределах экрана фонарём залита ровно одна
кнопка. Вторая — контурная (`button-secondary`) или тихая (`button-quiet`).

**Правило посчитанного контраста.** Ни одна пара не принимается на глаз.
`npm run gates` зовёт `core/gates/check-contrast.mjs`: список пар —
`gates/contrast.mjs` сайта, цвета — `src/styles/global.css`; сейчас 18 пар,
самая тесная — второстепенный текст на приподнятой поверхности, 7,02:1.
Новый цвет приходит вместе со своей парой.

**Правило снега.** Основной текст — `{colors.ink}`, не чистый белый:
на сине-чёрном фоне #FFF режет глаз и ломает ночь.

## Typography

**Display Font:** Libre Bodoni 600 (ui-serif, Georgia, 'Times New Roman',
serif) — газетный Бодони: высокий контраст штриха, шарообразные окончания.
**Body Font:** Libre Franklin 400/500/600 (ui-sans-serif, system-ui) —
американский газетный гротеск для текста и интерфейса.
**Label/Mono Font:** отдельного нет; цифры выравнивает `.tabular`.

Обе гарнитуры — своими файлами через `@fontsource`, лицензия OFL-1.1,
подмножество latin: сайт англоязычный, латиница-1 покрывает и имена
из источников (São Paulo, Möbius, Järvi). Внешних запросов шрифтов нет.

**Character:** шапка газеты и сводка таблоида. Бодони даёт заголовку вес
титра, Franklin не спорит с ним — корпус спокойный, серый снег, никогда
не белый.

### Hierarchy

Роли, кегли, интерлиньяж, насыщенность и трекинг — шасси первого сайта
в редакции каркаса (П62); тема меняет только гарнитуры.

- **Headline** (`{typography.headline}`, Бодони, обычный регистр,
  `text-wrap: balance`): `h1` страницы, заголовки секций блоков.
- **Title** (`{typography.title}`): знак сайта в шапке и подвале, пункт
  ящика меню, название в списке.
- **Lead** (`{typography.lead}`): подводка под `h1`.
- **Body** (`{typography.body}`, строка ≤ 62ch через `.measure`): текст,
  ссылки подвала.
- **Caption** (`{typography.caption}`): правовая полоса подвала, метаданные.
- **Label** (`{typography.label}`, капслок): пункт меню, заголовок колонки
  подвала.
- **Micro** (`{typography.micro}`, капслок): мельчайшие подписи.
- **Button** (`{typography.button}`, капслок): любой `.btn` и `.btn-link`.

### Named Rules

**Правило восьми ролей.** Каждый литеральный `font-size` — и в `src/` сайта,
и в `core/` — принадлежит одной из ролей `.t-*` (базовый корпус
`1.0625rem` включён). Проверяет `core/gates/check-tokens.mjs`, читая роли
из `global.css`. Нужен новый кегль — сначала роль, потом разметка.

**Правило капслока.** Капслоком набираются только мелкие гротескные роли:
label, micro, button. Заголовок Бодони, корпус, лид и caption — обычным
регистром.

**Правило колонки цифр.** Ряд чисел, который сравнивают глазом (годы,
минуты, счётчики, даты), несёт `.tabular`.

## Layout

Контейнер — 1240px (`--container`) с полем `clamp(16px, 4vw, 32px)`
(`--gutter`); вертикальный ритм секции — `--section-y`
(`clamp(72px, 9vw, 128px)`). Шапка липкая, 68px; та же величина — в
`--header-h`, якоря несут `scroll-margin-top: calc(var(--header-h) +
var(--space-lg))`. Главная сегодня — одна секция: `h1` и лид в колонке
`.measure`, под ней подвал ядра. Раскладку блоков задаёт маршрут, который
придёт с пачкой 0 (бэклог 54 п. 9).

### Named Rules

**Правило шкалы отступов.** Каждый литеральный `padding`, `margin`, `gap`
стоит на одной из одиннадцати ступеней; проверяет тот же `check-tokens.mjs`.

## Elevation & Depth

Система плоская. Глубину дают слоистость ночных поверхностей
(`bg` → `bg-band` → `surface` → `surface-2`) и волосяная линия. Липкая
шапка отделена полупрозрачным фоном и размытием (ядро) и волосом по краю.

### Shadow Vocabulary

- **Подъём карточки** (`box-shadow: 0 12px 32px rgb(0 0 0 / 0.45)`,
  `--shadow-lift`): единственная тень; только на `:hover` карточки.

### Named Rules

**Правило покоя.** Поверхность в покое плоская; тень — отклик на наведение.

## Shapes

Углы острые: `{rounded.none}` и `{rounded.sharp}`. 2px — кнопкам,
карточкам, обводке фокуса; 0 — полосам и секциям.

### Named Rules

**Правило острого угла.** Радиусов больше 2px нет.

## Components

### Buttons

- **Primary:** фонарь под чернилами на фонаре; на `:hover` заливка
  смешивается со снегом (`color-mix(in oklab, … 88%, var(--ink))`).
- **Secondary:** прозрачная, текст снегом, край — сильный волос; на `:hover`
  край — снег, фон — `--wash`.
- **Quiet:** приподнятая поверхность, 44px.
- **Link:** текст фонарём по тексту (`--era-text` = `accent-text`), стрелка;
  на `:hover` подчёркивание и растущий зазор.
- **Focus:** обводка `2px solid {colors.accent-text}` с отступом 3px — ядро,
  не снимается никогда.

### Cards

Поверхность `{colors.surface}`, волос, `{rounded.sharp}`, поля `md`;
на `:hover` — сильный волос и `--shadow-lift`.

### Navigation

Шапка и подвал — ядра (`core/chrome/`); знак сайта — текст роли title
(собственной символики у сайта нет, символика издателя — под запретом).
Пункты меню — label капслоком, приглушённый снег в покое, снег под курсором;
активного пункта шапка ядра цветом не выделяет. Ящик меню на узком экране —
на `--bg-band`.

### Video

Блок `video` назван (П71 п. 3, словарь ядра `core/structure/blocks.json`),
но не реализован: фасад с локальной заставкой, ни одного стороннего запроса
до клика (youtube-nocookie) — пачка 0 вместе с лицензией кадров.

## Do's and Don'ts

### Do:

- **Do** держать фонарь единственным тёплым цветом и единственной заливкой
  на экране.
- **Do** прогонять `npm run gates -w 7thserpent.com` перед сдачей: 18/18 пар
  контраста — состояние нормативное.
- **Do** добавлять новую пару в `gates/contrast.mjs` вместе с новым цветом.
- **Do** ставить новый кегль сначала ролью `.t-*` в `global.css`.
- **Do** грузить шрифты только своими файлами и только используемые
  насыщенности (заголовок 600, текст 400/500/600).
- **Do** менять `theme-color` в `Base.astro` вместе с `{colors.bg}`.

### Don't:

- **Don't** брать красный на акцент: он только у опасности.
- **Don't** ставить чистый белый на текст.
- **Don't** ставить отступ вне шкалы или кегль вне ролей.
- **Don't** скруглять больше 2px и класть тень на поверхность в покое.
- **Don't** подключать шрифты и видео со сторонних серверов.
- **Don't** приносить логотипы, фирменные гарнитуры и точную палитру
  издателя; дисклеймер о неофициальном статусе остаётся в подвале.
