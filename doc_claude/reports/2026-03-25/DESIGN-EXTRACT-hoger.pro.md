# Design Extract — hoger.pro — 2026-03-25

## Источник
- URL: https://hoger.pro/ + https://hoger.pro/services/wall/ + https://hoger.pro/projects/
- Метод: WebFetch (Playwright недоступен)
- Замечание: сайт-образец не оптимизирован, значения сняты как есть + добавлены рекомендации по Material UI

---

## Извлечённые токены

### Цвета

| Роль | Извлечённый HEX | Текущая переменная | Текущее значение | Рекомендация |
|------|-----------------|-------------------|-----------------|--------------|
| Primary (акцент) | `#9c886f` (тёплый тауп) | `$blue` | `#3f78e0` | **Заменить** |
| Body background | `#ffffff` | `$body-bg` | белый | Оставить |
| Body text | `#000000` | `$body-color` | зависит от `$navy` | **Заменить** |
| Headings | `#000000` | `$headings-color` | не задан | **Заменить** |
| Secondary text | `#4c4e52` | — | — | Добавить как `$gray-600` или кастом |
| Dark section bg | `#1e2228` | `$dark` / `$navy` | `#343f52` | **Заменить** |
| Active/dark hover | `#292728` | — | — | Использовать как dark-вариант |
| Light bg | `#f8f9fa` | `$gray-100` | Bootstrap default | Оставить |
| Border (тонкий) | `#eeeeee` | `$input-border-color` | `rgba(...)` | **Заменить** |
| Border (тёмный) | `#d2d2d7` | `$border-color` | — | **Заменить** |
| Links | `#9c886f` | `$link-color` | `$primary` | Авто (через `$primary`) |
| Footer border | `#9c886f` | — | — | Авто (через `$primary`) |
| Breadcrumb | `#9c886f` | `$breadcrumb-color` | — | Авто (через `$primary`) |

### Типографика — Копирование с образца

| Параметр | Извлечённое | Текущая переменная | Текущее значение | Рекомендация |
|----------|------------|-------------------|-----------------|--------------|
| Root font size | `16px` (browser default) | `$font-size-root` | `20px` | **Изменить на 16px** |
| Body font size | `16px` / `1rem` | `$font-size-base` | `0.8rem` | **Изменить на 1rem** |
| Body font family | системный шрифт (не задан) | `$font-family-sans-serif` | `Manrope` | **Заменить** (см. рекомендации) |
| Body font weight | `400` | `$font-weight-normal` | `500` | **Изменить на 400** |
| Body line height | `1.6` | `$line-height-base` | `1.7` | **Изменить на 1.6** |
| Headings font weight | `600–700` (предположительно) | `$headings-font-weight` | `700` | Оставить |
| H1 (px) | `~42px` | `$h1-font-size` | — | 2.625rem @ 16px |
| H2 (px) | `~36px` | `$h2-font-size` | — | 2.25rem @ 16px |
| H4 (px) | `~20px` | `$h4-font-size` | — | 1.25rem @ 16px |

### 📐 Типографика — Рекомендации Material UI

> **Контекст:** MUI использует `htmlFontSize: 16px` + шкалу Modular Scale.
> Ниже — практическая адаптация MUI type scale для корпоративного сайта строительной тематики.

| Параметр | Сайт-образец | MUI рекомендация | Для hoger (при root 16px) |
|----------|-------------|-----------------|--------------------------|
| Root | 16px | **16px** | `$font-size-root: 16px` |
| Body | 16px / 400 | body1: 16px / 400 | `$font-size-base: 1rem` |
| Body small | — | body2: 14px / 400 | `$font-size-sm: 0.875rem` |
| Line-height | 1.6 | 1.5 | `$line-height-base: 1.6` |
| Font weight normal | 400 | 400 | `$font-weight-normal: 400` |
| **H1** | 42px | MUI: 96px → реальный: **40–48px** | `$h1-font-size: 2.5rem` (40px) |
| **H2** | 36px | MUI: 60px → реальный: **32–36px** | `$h2-font-size: 2.25rem` (36px) ✓ |
| **H3** | не задан | MUI: 48px → реальный: **24–28px** | `$h3-font-size: 1.75rem` (28px) |
| **H4** | 20px | MUI: 34px → реальный: **20–22px** | `$h4-font-size: 1.375rem` (22px) |
| **H5** | не задан | MUI: 24px → реальный: **18px** | `$h5-font-size: 1.125rem` (18px) |
| **H6** | не задан | MUI: 20px → реальный: **16px** | `$h6-font-size: 1rem` (16px) |

**Рекомендованный шрифт:** `Inter` (Google Fonts) — дефолт в MUI v6, нейтральный, отлично читается. Или `Roboto` (исторический дефолт MUI).

### Кнопки

| Параметр | Извлечённое | Текущая переменная | Текущее значение | Рекомендация |
|----------|------------|-------------------|-----------------|--------------|
| Background | `#9c886f` | — | авто через `$primary` | Авто |
| Color | `#ffffff` | — | авто | — |
| Border radius | `50px` (pill) | `$btn-border-radius` | `0.4rem` | **50rem (pill!)** |
| Padding Y | `15px` → `0.938rem` | `$btn-padding-y` | `0.5rem` | **0.938rem** |
| Padding X | `20px` → `1.25rem` | `$btn-padding-x` | `1.2rem` | **1.25rem** |
| Font size (сайт) | `16px` → `1rem` | `$btn-font-size` | — | `1rem` (сайт) |
| Font size (MUI) | MUI: `0.875rem` (14px) | — | — | ⚠️ рекомендую `0.875rem` |
| Font weight | `500` | `$btn-font-weight` | `700` | **500** |
| Border width | `2px` | `$btn-border-width` | `2px` | Оставить |
| Text transform | `uppercase` | — | нет переменной | CSS override `.btn {}` |
| Hover | bg `#ffffff`, color `#9c886f` | — | — | Авто (Bootstrap outline-логика) |

### Формы (inputs)

| Параметр | Извлечённое | Текущая переменная | Текущее значение | Рекомендация |
|----------|------------|-------------------|-----------------|--------------|
| Border radius | `50px` (pill) | `$input-border-radius` | `$border-radius` | **50rem** или отдельно |
| Border color | `#9c886f` | `$input-border-color` | `rgba(...)` | **#9c886f** (или `$blue` в _user-variables) |
| Border width | `1px` | — | `1px` | Оставить |
| Padding Y | `15px` → `0.938rem` | `$input-padding-y` | `0.6rem` | **0.938rem** |
| Padding X | `20px` → `1.25rem` | `$input-padding-x` | `1rem` | **1.25rem** |
| Font size | `16px` → `1rem` | `$input-font-size` | `0.75rem` | **1rem** |
| Background | `#ffffff` | `$input-bg` | — | Оставить |
| Focus border | не задан явно | `$input-focus-border-color` | `$focus-border` | **#9c886f** |
| Focus shadow | не задан | `$input-focus-box-shadow` | `unset` | **none** |

### Breadcrumb

| Параметр | Извлечённое | Текущая переменная | Рекомендация |
|----------|------------|-------------------|--------------|
| Link color | `#9c886f` | `$breadcrumb-color` | Авто (через `$primary`) |
| Active color | `#9c886f` | `$breadcrumb-active-color` | Авто (через `$primary`) |
| Divider color | не задан | `$breadcrumb-divider-color` | `#d2d2d7` |

### Навигация (верхний уровень)

| Параметр | Извлечённое | Текущая переменная | Рекомендация |
|----------|------------|-------------------|--------------|
| Font size | `18px` → `1.125rem` | `$nav-link-font-size` | **1.125rem** |
| Font weight | не задан явно | `$nav-link-font-weight` | `600` |
| Text transform | не задан | `$nav-link-text-transform` | `none` |
| Letter spacing | не задан | `$nav-link-letter-spacing` | `normal` |

---

## Шрифты для подключения

**Рекомендация:** подключить `Inter` (Google Fonts) — ближайший аналог к тому, что MUI использует по умолчанию.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Или подключить через `functions.php` (enqueue).

В `_user-variables.scss`:
```scss
$font-family-sans-serif: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
```

---

## Итоговый `_user-variables.scss` — предложение

```scss
// ── Основные цвета ──
$blue:         #9c886f;   // Primary → тёплый тауп
$navy:         #1e2228;   // Dark sections

$body-color:   #000000;
$headings-color: #000000;
$dark:         #1e2228;

$border-color: #d2d2d7;

// Глобальное скругление — НЕ pill, pill только для кнопок/инпутов
$border-radius: 0.25rem;  // 4px — нейтральное

// ── Типографика ──
$font-family-sans-serif: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
$font-size-root:  16px;
$font-size-base:  1rem;         // 16px
$font-weight-normal: 400;
$line-height-base: 1.6;

$h1-font-size: 2.5rem;    // 40px
$h2-font-size: 2.25rem;   // 36px (совпадает с сайтом)
$h3-font-size: 1.75rem;   // 28px
$h4-font-size: 1.375rem;  // 22px
$h5-font-size: 1.125rem;  // 18px
$h6-font-size: 1rem;      // 16px

// ── Кнопки ──
$btn-border-width:  2px;
$btn-font-weight:   500;
$btn-border-radius: 50rem;      // pill!
$btn-padding-y:     0.938rem;   // 15px
$btn-padding-x:     1.25rem;    // 20px
$btn-font-size:     0.875rem;   // 14px (MUI рекомендация)
// (сайт использует 16px — можно 1rem если хочется точнее к образцу)

// ── Формы ──
$input-font-size:          1rem;
$input-border-radius:      50rem;     // pill (как на образце)
$input-border-color:       #9c886f;   // (в _user-variables нельзя $blue если переопределён выше)
$input-padding-y:          0.938rem;  // 15px
$input-padding-x:          1.25rem;   // 20px
$input-focus-border-color: #9c886f;
$input-focus-box-shadow:   none;

// ── Навигация ──
$nav-link-font-size:      1.125rem;  // 18px
$nav-link-font-weight:    600;
$nav-link-text-transform: none;

// ── Breadcrumb ──
$breadcrumb-divider-color: #d2d2d7;

//--------------------------------------------------------------
// CSS overrides
//--------------------------------------------------------------
.btn {
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

//START IMPORT FONTS
// @import "fonts/Inter";
//END IMPORT FONTS
```

---

## ⚠️ Нюансы и спорные моменты

1. **Pill для инпутов** — на сайте `border-radius: 50px` у инпутов. Это нетипично для форм с label. Если используется `form-floating` (плавающий label), pill-shape плохо смотрится. Рекомендую обсудить: оставить pill или использовать умеренное скругление `0.5rem`.

2. **Шрифт** — на сайте-образце шрифт не определён явно. Скорее всего это `system-ui` (Arial/Helvetica на Windows). Я рекомендую Inter как MUI-совместимый шрифт. Но это решение за тобой.

3. **$btn-font-size** — сайт использует `16px`, MUI рекомендует `14px`. Записал `0.875rem` как MUI-рекомендацию. Если важно точнее к образцу — используй `1rem`.

4. **$input-border-color** — в `_user-variables.scss` нельзя использовать `$blue` после его переопределения выше (он уже будет `#9c886f`). Можно писать `$blue` и оно подставится, или указать hex напрямую.
