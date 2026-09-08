# Контракт: что ядро ожидает от каждого сайта

Шасси стилей лежит рядом, в девяти файлах `core/styles/*.css`. Оно несёт
**форму** — геометрию кнопки, карточки, кадра, колонки. **Значения** — цвета,
кегли, гарнитуры, ступени отступов — остаются у сайта, и ядро берёт их
по именам, перечисленным здесь.

Список заведён по решению владельца от 2026-09-08 (П14, запись
в `DECISIONS.md`). Довод: роли и шкала — значения этого сайта, а не форма,
поэтому они остаются у сайта; но опора ядра на них не должна быть молчаливой.
**Второй сайт узнаёт о недостающей роли отсюда, а не из сломанной вёрстки.**

**Гейта на этот контракт сегодня нет — только документ.** Проверку обсуждаем,
когда появится второй сайт: раньше него правило не на чем откалибровать.
Пока список сверяется глазами при заведении сайта.

Отказ при пропаже — молчаливый. `var(--нет-такого)` не роняет сборку: правило
просто не применяется, и страница выглядит «почти правильно». Это тот же класс
отказа, что у `@source` (инвариант 8 `CLAUDE.md`).

---

## 1. Роли типографики — восемь из одиннадцати

Ядро **надевает** эти классы на разметку, а объявляет их сайт в своём
`global.css`. Ядро не знает ни кегля, ни гарнитуры — только имя роли.

| Роль | Кто надевает |
|---|---|
| `.t-headline` | `BandQuote`, `CardRail`, `CtaBand`, `LinkColumns` |
| `.t-title` | `CardRail`, `LinkColumns`, `SiteHeader` |
| `.t-lead` | `BandQuote`, `CtaBand`, `LinkColumns` |
| `.t-body` | `CardRail`, `LinkColumns`, `SiteFooter` |
| `.t-caption` | `CardRail`, `SiteHeader` |
| `.t-label` | `SiteFooter`, `SiteHeader` |
| `.t-micro` | `SiteHeader`, `SmartImage` |
| `.t-button` | `CardRail`, `CtaBand`, `LinkColumns` |

Ещё три роли — `.t-display`, `.t-year`, `.t-wordmark` — на витрине ac4bf есть,
но ядро их не называет: они целиком посайтовые. Заводить их новому сайту
не обязательно.

**Роли обязаны оставаться в `<сайт>/src/styles/global.css`**, а не уезжать
в подключаемый файл: `core/gates/check-tokens.mjs` читает оттуда список
разрешённых кеглей регулярным выражением по `.t-*` и по `@import` не идёт.

## 2. Токены — тридцать два имени

Все объявляются сайтом в `:root` (и цветовая часть дублируется в `@theme`
для Tailwind). Ядро читает их из `<style>` компонентов и из файлов шасси.

### Поверхности и текст — 7

| Токен | Кто читает |
|---|---|
| `--bg` | `CtaBand`, `SiteHeader`, `credit.css`, `foto.css` |
| `--bg-band` | `BandQuote`, `SiteFooter`, `SiteHeader`, `base.css`, `card.css`, `layout.css` |
| `--surface` | `SiteHeader`, `card.css` |
| `--surface-2` | `base.css`, `button.css` |
| `--ink` | все шесть компонентов с `<style>`, `button.css`, `credit.css` |
| `--ink-muted` | все шесть компонентов с `<style>`, `credit.css` |
| `--ink-on-accent` | `a11y.css`, `base.css`, `button.css` |

### Акцент — 3

| Токен | Кто читает |
|---|---|
| `--accent` | `BandQuote`, `SiteHeader`, `a11y.css`, `base.css`, `button.css` |
| `--accent-text` | `LinkColumns`, `base.css` |
| `--accent-2` | `LinkColumns`, `base.css` |

### Линии, подсветки, тень — 5

| Токен | Кто читает |
|---|---|
| `--hairline` | `BandQuote`, `CtaBand`, `LinkColumns`, `SiteFooter`, `SiteHeader`, `card.css`, `layout.css` |
| `--hairline-strong` | `CardRail`, `LinkColumns`, `SiteHeader`, `button.css`, `card.css` |
| `--wash` | `CardRail`, `button.css` |
| `--wash-strong` | `button.css` |
| `--shadow-lift` | `card.css` |

### Текущая эпоха — 2

| Токен | Кто читает |
|---|---|
| `--era` | `foto.css` — цвет дуотона кадра |
| `--era-text` | `CardRail`, `button.css` |

Это **бегущие** значения: сайт объявляет их по умолчанию в `:root` и подменяет
секцией. Сайту без такой механики достаточно объявить их равными акценту —
ровно так и сделано на ac4bf (`--era: var(--accent)`).

### Шрифт — 1

| Токен | Кто читает |
|---|---|
| `--font-display` | `LinkColumns` |

Второй шрифтовой токен, `--font-text`, ядро напрямую не читает — он приходит
через `body` и роли, то есть остаётся делом сайта целиком.

### Геометрия — 4

| Токен | Кто читает |
|---|---|
| `--container` | `CardRail`, `layout.css` |
| `--gutter` | `CardRail`, `layout.css` |
| `--section-y` | `layout.css` |
| `--radius-sharp` | `CardRail`, `SiteHeader`, `a11y.css`, `base.css`, `button.css`, `card.css` |

### Шкала отступов — 9 ступеней

`--space-3xs`, `--space-2xs`, `--space-xs`, `--space-sm`, `--space-md`,
`--space-lg`, `--space-xl`, `--space-2xl`, `--space-3xl`.

Ни одного литерального отступа в ядре нет: вся его геометрия стоит на этих
ступенях. Верхние две ступени витрины, `--space-4xl` и `--space-5xl`, ядру
не нужны.

**Шкала обязана оставаться в `global.css` сайта** по той же причине, что
и роли: `check-tokens` читает ступени оттуда регулярным выражением
по `--space-*`. Уезд шкалы гейт не роняет — он **ослепляет** его молча.

### Движение — 1

| Токен | Кто читает |
|---|---|
| `--ease-out` | `CardRail`, `LinkColumns`, `SiteFooter`, `SiteHeader`, `button.css`, `card.css` |

## 3. Что ядро приносит само

Сайту не нужно объявлять это заново — оно приедет вместе с шасси:

| Файл | Что даёт |
|---|---|
| `reset.css` | `box-sizing: border-box` на всё |
| `base.css` | выделение, полоса прокрутки, кольцо фокуса, `img/svg`, `a`, `.tabular` |
| `layout.css` | `.measure`, `.container`, `.section`, `.band`, `.rule` |
| `button.css` | `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-quiet`, `.btn-link` |
| `card.css` | `.card`, `.card__media`, `.card__body` |
| `foto.css` | оболочка кадра `.foto` с дуотоном |
| `credit.css` | подпись автора `.foto__credit` |
| `motion.css` | уважение к `prefers-reduced-motion` |
| `a11y.css` | `.visually-hidden`, `.skip-link` |

## 4. Три ожидания сверх токенов

**Шасси подключается только через `@import` из `global.css` сайта — никогда
напрямую из `.astro`.** Причина не в стиле, а в механике: Lightning CSS
расщепляет правила с `color-mix()` на запасное плюс копию в `@supports`,
и делает это только для файлов в графе импорта листа сайта. Подключение мимо
графа молча убьёт запасные варианты у `a`, `.btn-primary:hover`
и `.foto__credit`.

**Ставить `@import` на место.** Порядок правил в собранном листе — это порядок
строк `@import`. Три места, где он решает исход: `.tabular` обязан идти
раньше ролей `.t-*`, `.btn` — раньше `.btn-secondary` и `.btn-quiet`,
`foto.css` — раньше посайтовых модификаторов вроде `.foto--gra`. Специфичность
у этих пар равная, и ошибка не проявится ни в сборке, ни в гейтах.

**Ядро рассчитывает на `preflight` Tailwind.** Универсальный сброс
`* { margin: 0; padding: 0; border: 0 solid }` приходит из
`@import 'tailwindcss'` и в шасси не переносится в принципе: например,
`.hdr__drawer-list` в `SiteHeader` задаёт `padding-block` сам, а нулевой
`padding-inline` берёт из сброса.

## 5. Одно правило, которое ядро не приносит, но требует

`SiteHeader` ставит и снимает класс `menu-otwarte` на `<html>`, когда
открывается выдвижное меню. Правило, дающее классу смысл, остаётся у сайта:

```css
html.menu-otwarte {
  overflow: hidden;
}
```

На ac4bf оно объявлено в `src/layouts/Base.astro` через `<style is:global>`.
Без него открытое меню не запирает прокрутку страницы под собой.
