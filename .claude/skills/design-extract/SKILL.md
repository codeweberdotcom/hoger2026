---
name: design-extract
description: Извлечь цвета, шрифты, кнопки, формы, breadcrumb, навигацию с веб-страницы и применить к _user-variables.scss
argument-hint: <URL страницы-образца (одна или несколько через пробел)>
---

Извлеки дизайн-токены (цвета, типографика, кнопки, формы, breadcrumb, навигация) со страницы-образца и обнови `_user-variables.scss` темы CodeWeber.

**URL(ы) для анализа:** `$ARGUMENTS`

---

## Золотое правило извлечения стилей

**Для каждого компонента** (кнопки, инпуты, табы, аккордеон, навигация, карточки и т.д.) обязательно снимать **все параметры** в **трёх состояниях**:

| Параметр | Normal | :hover | :active / .active | :focus | :disabled |
|----------|--------|--------|-------------------|--------|-----------|
| Отступы (padding top/right/bottom/left) | ✓ | ✓ | ✓ | — | — |
| Внешние отступы (margin) | ✓ | — | — | — | — |
| Промежуток (gap) в flex-контейнерах | ✓ | — | — | — | — |
| Размер шрифта (font-size) | ✓ | ✓ | ✓ | — | — |
| Толщина шрифта (font-weight) | ✓ | ✓ | ✓ | — | — |
| Цвет шрифта (color) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Межстрочный интервал (line-height) | ✓ | — | — | — | — |
| Межбуквенный интервал (letter-spacing) | ✓ | ✓ | ✓ | — | — |
| Трансформация текста (text-transform) | ✓ | — | ✓ | — | — |
| Оформление текста (text-decoration) | ✓ | ✓ | ✓ | — | — |
| Бордер — толщина (border-width) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Бордер — стиль (border-style) | ✓ | ✓ | ✓ | ✓ | — |
| Бордер — цвет (border-color) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Скругление (border-radius) | ✓ | — | — | — | — |
| Цвет фона (background-color) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Тень (box-shadow) | ✓ | ✓ | ✓ | ✓ | — |
| Прозрачность (opacity) | ✓ | ✓ | — | — | ✓ |
| Курсор (cursor) | — | ✓ | — | — | ✓ |
| Outline (контур доступности) | — | — | — | ✓ | — |

> **Почему это критично.** Дефолтные значения переменных темы часто имеют **неожиданные** значения при hover/active:
> например, `$nav-pills-hover-border-color` по умолчанию = **primary** (синий), а не серый.
> Если не снять hover-стиль с образца — бордер будет синим вместо серого, и придётся исправлять после.
> Чем больше параметров снято сразу — тем меньше итераций правок.

> **Для `<input>` — `:focus` обязателен.** Фокусное состояние у инпутов критично: именно там чаще всего меняются border-color, background, box-shadow (outline). Без него нельзя правильно задать `$input-focus-border-color`, `$input-focus-bg`, `$input-focus-box-shadow`. Всегда кликай на инпут в браузере и снимай все параметры в фокусе.

> **Как снимать hover/active/focus.** В DevTools: выбрать элемент → в панели Styles нажать `:hov` → включить нужное состояние (`:hover`, `:active`, `:focus`).
> Также Playwright позволяет эмулировать hover через `browser_evaluate` с `element.dispatchEvent(new MouseEvent('mouseover'))`.

---

## Шаг 1: Получение дизайн-токенов

Для каждого URL из аргументов:

1. Открой страницу в Playwright:
   ```
   browser_navigate → URL
   ```

2. Дождись загрузки (browser_wait_for → networkidle или 3 секунды)

3. Сделай скриншот для визуального контекста:
   ```
   browser_take_screenshot
   ```

4. Выполни скрипт извлечения через `browser_evaluate`:
   Прочитай файл `.claude/skills/design-extract/scripts/extract-design-tokens.js`
   и выполни его содержимое через `browser_evaluate`.
   Скрипт возвращает JSON с полями:
   - `colors` — text, background, border, links, cssVariables
   - `typography` — rootFontSize, body (fontFamily, fontSize, fontWeight, lineHeight, **lineHeightRatio**), headings (h1-h6), usedFonts
   - `buttons` — styles (backgroundColor, color, borderRadius, padding, fontSize, fontWeight и т.д.)
   - `forms` — styles инпутов (height, fontSize, fontWeight, bg, borderColor, padding и т.д.), **focus** (bg, borderColor, boxShadow, bgChanged, borderChanged, shadowChanged)
   - `breadcrumb` — linkColor, dividerColor, activeColor, divider
   - `navigation` — fontSize, fontWeight, color, textTransform, letterSpacing
   - `accordion` — button (fontSize, fontWeight из **внутреннего текстового элемента**, containerFontSize, hasInnerTextEl, paddingYEqual, padding), icon (type, position, fontSize, width, color, content, transform, marginTop), body (fontSize, color, padding), item (bg, border, shadow, marginBottom), style ("plain"/"card"), hoverColor

5. Сохрани результат — он понадобится на шагах 2 и 3.

---

## Шаг 2: Анализ и рекомендации

Прочитай текущие значения из:
- `src/assets/scss/_theme-colors.scss` — базовые цвета темы
- `src/assets/scss/_variables.scss` — все переменные (типографика, кнопки, компоненты)
- `src/assets/scss/_user-variables.scss` — текущие пользовательские переопределения

Сопоставь извлечённые токены с переменными темы и создай отчёт:

**Создай файл** `doc_claude/reports/YYYY-MM-DD/DESIGN-EXTRACT-[domain].md`:

```markdown
# Design Extract — [domain] — YYYY-MM-DD

## Источник
- URL: [url]
- Скриншот: (описание визуального впечатления)

## Извлечённые токены

### Цвета

| Роль | Извлечённый HEX | Текущая переменная | Текущее значение | Рекомендация |
|------|-----------------|-------------------|-----------------|--------------|
| Primary (основной акцент) | #XXXXXX | $primary / $blue | #3f78e0 | Заменить |
| Secondary | #XXXXXX | $secondary | $gray-400 | Заменить |
| Body text | #XXXXXX | $body-color | — | — |
| Body background | #XXXXXX | $body-bg | — | — |
| Link color | #XXXXXX | $link-color | — | — |
| Success | #XXXXXX | $green | #45c4a0 | Оставить |
| ... | ... | ... | ... | ... |

### Типографика

| Параметр | Извлечённое | Текущая переменная | Текущее значение | Рекомендация |
|----------|------------|-------------------|-----------------|--------------|
| Root font size | XXpx | $font-size-root | 20px | Изменить |
| Body font size | X.Xrem | $font-size-base | 0.8rem | Изменить |
| Body font family | "Font Name" | $font-family-sans-serif | Manrope | Изменить |
| Body font weight | 400 | $font-weight-normal | 500 | Изменить |
| Body line height | 1.X | $line-height-base | 1.7 | — |
| Headings font weight | XXX | $headings-font-weight | 700 | — |
| H1 size / weight | X.Xrem / XXX | $h1-font-size | — | — |
| H2 size / weight | X.Xrem / XXX | $h2-font-size | — | — |
| H3 size / weight | X.Xrem / XXX | $h3-font-size | — | — |
| H4 size / weight | X.Xrem / XXX | $h4-font-size | — | — |
| ... | ... | ... | ... | ... |

### Кнопки

| Параметр | Извлечённое | Текущая переменная | Текущее значение | Рекомендация |
|----------|------------|-------------------|-----------------|--------------|
| Padding Y | X.Xrem | $btn-padding-y | 0.5rem | Изменить |
| Padding X | X.Xrem | $btn-padding-x | 1.2rem | Изменить |
| Border radius | X.Xrem | $btn-border-radius / $border-radius | 0.4rem | Изменить |
| Font weight | XXX | $btn-font-weight | bold | — |
| Font size | X.Xrem | $btn-font-size | — | — |
| Border width | Xpx | $btn-border-width | 2px | — |
| ... | ... | ... | ... | ... |

### Формы (inputs)

| Параметр | Извлечённое | Текущая переменная | Текущее значение | Рекомендация |
|----------|------------|-------------------|-----------------|--------------|
| **Height** | XXpx | (вычисляемая) | — | **Подогнать через $form-floating-height** |
| Font size | X.Xrem | $input-font-size | 0.75rem | Изменить |
| Font weight | XXX | $input-font-weight | — | — |
| Background | #XXXXXX | $input-bg | body-bg | Изменить |
| Border color | #XXXXXX | $input-border-color | rgba($shadow-border, 0.07) | Изменить |
| Border radius | X.Xrem | $input-border-radius | $border-radius | — |
| Padding Y | X.Xrem | $input-padding-y | 0.6rem | **Вычислить по формуле** |
| Padding X | X.Xrem | $input-padding-x | 1rem | Изменить |
| **Hover: bg** | #XXXXXX | $input-hover-bg | null | Из CSS-правила `.form-control:hover` |
| **Focus: bg** | #XXXXXX | $input-focus-bg | — | Сравнить с blur |
| **Focus: border** | #XXXXXX | $input-focus-border-color | $focus-border | Сравнить с blur |
| **Focus: box-shadow** | none/значение | $input-focus-box-shadow | unset | Сравнить с blur |
| **Active: bg** | #XXXXXX | — | — | Если отличается от focus |

> **Правило интерактивных состояний инпутов:** Всегда проверяй стили инпута при hover, focus и active на образце.
> Скрипт возвращает `forms.hover`, `forms.focus`, `forms.active` — из CSS-правил (`:hover`, `:focus`, `:active`).
> Также `forms.focus` содержит `bgChanged`, `borderChanged`, `shadowChanged` из программного теста.
> Hover и active извлекаются через парсинг CSS stylesheets (programmatic hover/active невозможен).
> Если на образце при hover фон меняется — задай `$input-hover-bg` (по умолчанию `null` = без hover-эффекта).
> Если на образце при focus ничего не меняется — задай `$input-focus-border-color` равным `$input-border-color`,
> `$input-focus-box-shadow: none`, `$input-focus-bg` равным `$input-bg`.

> **Правило высоты инпутов:** Высота input на нашем сайте должна совпадать с образцом.
> Высота вычисляется: `height = paddingY×2 + fontSize×lineHeight + borderWidth×2`.
> Для подгонки высоты рассчитай `$input-padding-y`:
> `paddingY = (targetHeight - fontSize×$input-btn-line-height - borderWidth×2) / 2`, затем переведи в rem.

### Breadcrumb

| Параметр | Извлечённое | Текущая переменная | Текущее значение | Рекомендация |
|----------|------------|-------------------|-----------------|--------------|
| Link color | #XXXXXX | $breadcrumb-color | $gray-600 | — |
| Link font weight | XXX | — | — | — |
| Link font size | X.Xrem | — | — | — |
| Divider color | #XXXXXX | $breadcrumb-divider-color | rgba($gray-600, 0.35) | Изменить |
| Active color | #XXXXXX | $breadcrumb-active-color | $gray-600 | — |

### Навигация (горизонтальное меню, верхний уровень)

| Параметр | Извлечённое | Текущая переменная | Текущее значение | Рекомендация |
|----------|------------|-------------------|-----------------|--------------|
| Font size | X.Xrem | $nav-link-font-size | 0.8rem | Изменить |
| Font weight | XXX | $nav-link-font-weight | $font-weight-bold | Изменить |
| Text transform | none/uppercase | $nav-link-text-transform | none | **Проверить обязательно** |
| Letter spacing | X.Xrem | $nav-link-letter-spacing | $letter-spacing | Изменить |
| Color | #XXXXXX | $nav-link-color | $main-dark | — |

### Навигация (dropdown / дочерние пункты)

| Параметр | Извлечённое | Текущая переменная | Текущее значение | Рекомендация |
|----------|------------|-------------------|-----------------|--------------|
| Font size | X.Xrem | $dropdown-font-size | $font-size-base * 0.9375 | Изменить |
| Font weight | XXX | $dropdown-font-weight | $font-weight-bold | Изменить |
| Text transform | none/uppercase | $dropdown-text-transform | none | Изменить если отличается |
| Letter spacing | X.Xrem | $dropdown-letter-spacing | normal | Изменить если отличается |

> **Правило text-transform навигации:** Всегда проверяй `text-transform` на пунктах меню верхнего уровня.
> На многих сайтах верхний уровень — `uppercase` с уменьшенным `font-size` и увеличенным `letter-spacing`,
> а dropdown/дети — `none` с обычным размером. Скрипт извлекает эти значения в `navigation.textTransform` и `navigation.letterSpacing`.

### Табы

| Параметр | Извлечённое | Текущая переменная | Текущее значение | Рекомендация |
|----------|------------|-------------------|-----------------|--------------|
| **Общие (все типы)** | | | | |
| Font size | X.Xrem | `$tab-font-size` (→ nav-tabs-basic/pills/fanny) | 0.85rem | Унифицировать |
| Font weight | XXX | `$tab-font-weight` (→ nav-tabs-basic/pills/fanny) | 600 | Унифицировать |
| Inactive color | #XXXXXX | `$tab-color` (→ nav-tabs-basic/pills/fanny) | $body-color | Изменить |
| **Nav-pills (pills style) — бордер** | | | | |
| Border (inactive, все стороны) | 1px solid #e5e5e5 | `$nav-pills-border-top/right/bottom/left` | 0 (нет бордера) | **Четыре отдельных переменных!** |
| Border color (hover) | #XXXXXX | `$nav-pills-hover-border-color` | **primary (!)** | **Всегда переопределять** |
| Border color (active) | #XXXXXX | `$nav-pills-active-border-color` | **transparent (!)** | Если бордер должен сохраниться — задать #e5e5e5 |
| **Nav-pills — фон и цвет** | | | | |
| Background (inactive) | #XXXXXX | `$nav-pills-bg` | transparent | Если нужен фон — задать |
| Padding | X.Xrem X.Xrem | `$nav-pills-padding` | 0.55rem 1.25rem | Изменить |
| Border radius | Xpx | `$nav-pills-border-radius` | $border-radius | Изменить |
| Active bg | #XXXXXX | `$nav-pills-active-bg` | white | — |
| Active color | #XXXXXX | `$nav-pills-active-color` | primary | — |
| Active top-indicator | none/значение | `$nav-pills-active-box-shadow` | $box-shadow-with-border | `inset 0 2px 0 $blue` для полосы сверху |
| Hover bg | #XXXXXX | `$nav-pills-hover-bg` | white | — |
| Hover color | #XXXXXX | `$nav-pills-hover-color` | **primary (!)** | Переопределить если дизайн отличается |
| **Nav-tabs-basic (underline style)** | | | | |
| Border bottom color | #XXXXXX | `$nav-tabs-basic-active-border-color` | $nav-tabs-link-active-color | — |
| Hover border color | #XXXXXX | `$nav-tabs-basic-hover-border-color` | $nav-tabs-link-active-color | — |
| Padding | X.Xrem | `$nav-tabs-basic-padding` | 0.6rem 0 | — |
| Margin right | X.Xrem | `$nav-tabs-basic-margin-right` | 1rem | — |

> **Правило font-size табов.** В теме root font-size = **15px** (`$font-size-root: 15px` в `_user-variables.scss`). Для 14px из образца: `14 / 15 = 0.933rem`.
> Задавай через промежуточную переменную `$tab-font-size` и применяй к трём типам: basic, pills, fanny.
> Дефолтный шрифт всех трёх типов — 0.85rem (17px). Если образец меньше — уменьшай.

> **Правило pills vs basic.** На большинстве образцов tabs используют стиль pills (`nav.nav-tabs.nav-pills`):
> - pills: таблетки с белым/прозрачным фоном, скругление, тень
> - basic: подчёркивание active
> - fanny: кнопка-стиль (bg primary при active)
> Наш Gutenberg-блок tabs по умолчанию добавляет классы `nav-tabs nav-pills` — это pills-стиль.

> **КРИТИЧНО: дефолты hover и active у nav-pills.** Три переменные имеют «опасные» дефолты:
> - `$nav-pills-hover-border-color` → по умолчанию **primary** (бордер становится синим при hover)
> - `$nav-pills-hover-color` → по умолчанию **primary** (текст становится синим при hover)
> - `$nav-pills-active-border-color` → по умолчанию **transparent** (бордер исчезает у активного элемента)
> Если на образце бордер серый во всех состояниях — переопределяй все три.

> **Правило бордера nav-pills.** Бордер задаётся четырьмя **отдельными** переменными (не shorthand):
> `$nav-pills-border-top`, `$nav-pills-border-right`, `$nav-pills-border-bottom`, `$nav-pills-border-left`.
> Значение каждой — полная shorthand строка: `1px solid #e5e5e5`.

> **Правило «верхний primary индикатор».** Для активного таба с серым бордером со всех сторон + синей полосой сверху:
> ```scss
> $nav-pills-active-border-color: #e5e5e5;              // сохранить серый бордер
> $nav-pills-active-box-shadow:   inset 0 2px 0 $blue;  // синяя полоса сверху (через inset shadow)
> ```
> Здесь `inset 0 2px 0 $blue` = отступ 0px по горизонтали, 2px от верха, 0 blur, синий цвет.

> **ВАЖНО: `$blue` вместо `$primary` и `#ffffff` вместо `$white` в `_user-variables.scss`.**
> Порядок импорта: `_theme-colors.scss` → `_user-variables.scss` → `_variables.scss`.
> На момент загрузки `_user-variables.scss`:
> - `$primary` **НЕ определён** (он задаётся в `_variables.scss` позже) → использовать `$blue`
> - `$white` **НЕ определён** → использовать `#ffffff` литерал
> - `$blue: #3f78e0 !default` уже загружен из `_theme-colors.scss` и может быть переопределён выше в `_user-variables.scss`

> **Паттерн «AllCorp3 pills».** Точный рецепт стилизации nav-pills под AllCorp3:
> ```scss
> // Inactive: серый бордер + серый фон
> $nav-pills-border-top:        1px solid #e5e5e5;
> $nav-pills-border-right:      1px solid #e5e5e5;
> $nav-pills-border-bottom:     1px solid #e5e5e5;
> $nav-pills-border-left:       1px solid #e5e5e5;
> $nav-pills-bg:                #fafafa;
> $nav-pills-border-radius:     3px;
> $nav-pills-padding:           0.933rem 1.467rem;
>
> // Active: белый фон + серый бордер + синяя полоса сверху
> $nav-pills-active-border-color: #e5e5e5;
> $nav-pills-active-box-shadow:   inset 0 2px 0 $blue;
>
> // Hover: белый фон + серый бордер (без изменения!) + тёмный текст
> $nav-pills-hover-bg:            #ffffff;
> $nav-pills-hover-border-color:  #e5e5e5;
> $nav-pills-hover-color:         #333333;
> ```

### Списки

| Параметр | Извлечённое | Текущая переменная / место | Текущее значение | Рекомендация |
|----------|------------|--------------------------|-----------------|--------------|
| **UL — маркер** | | | | |
| Тип маркера | background-bar / символ / none | `$unordered-list-dot-content` | `"\2022"` (•) | Если bar — нужен CSS override |
| Маркер: ширина × высота | 11px × 1px | CSS rule (нет переменной) | — | Только через CSS |
| Маркер: цвет / фон | #XXXXXX | CSS rule (нет переменной) | — | Только через CSS |
| Маркер: margin-right | Xpx | CSS rule (нет переменной) | 10px (AllCorp3) | Только через CSS |
| Маркер: vertical offset (top) | Xpx | `$unordered-list-dot-top` | -0.15rem | Изменить |
| Маркер: font-size (если символ) | X.Xrem | `$unordered-list-dot-font-size` | 1rem | Изменить |
| Маркер: font-weight | XXX | `$unordered-list-dot-font-weight` | normal | — |
| **UL — отступы** | | | | |
| `li` padding-left | Xrem | `$unordered-list-padding-left` | 1rem | Изменить |
| `li` margin-bottom | Xpx | CSS rule (нет переменной) | 0 (только `li+li margin-top: 0.35rem`) | Только через CSS |
| **OL** | | | | |
| `list-style-type` | decimal/... | CSS (Bootstrap default) | decimal | — |
| `padding-left` | Xpx | CSS rule | Bootstrap default | Только через CSS |
| `ol li` margin-bottom | Xpx | CSS rule | 0 | Только через CSS |
| Цвет счётчика (::marker) | #XXXXXX | CSS rule | наследует color | Только через CSS |
| **Вложенный список** | | | | |
| padding-top | Xpx | CSS rule | 4px (AllCorp3) | — |
| маркер вложенного | circle / другой | CSS rule | circle (AllCorp3) | — |

> **ВАЖНО: Архитектура списков в теме.** Наша тема не стилизует `ul li` глобально.
> Маркер работает ТОЛЬКО на элементах с классом `.unordered-list` (через `::before` с абсолютным позиционированием).
> AllCorp3 стилизует `ul li` **глобально** через `::before` с CSS-баром.
> Если нужен глобальный стиль — добавлять CSS-правило в `_user-variables.scss`.

> **Два типа маркеров.** Всегда определяй тип маркера на образце:
> - **Символ** (`•`, `—`, иконка) → `content: "символ"` в `::before`, управляется через `$unordered-list-dot-content`
> - **CSS-бар** (горизонтальная полоска) → `content: ""` + `background: цвет` + `width/height` в `::before` → **нельзя задать через переменные**, нужен CSS override

> **Паттерн «AllCorp3 bar marker».** Глобальный маркер-полоска как на AllCorp3:
> ```scss
> // В _user-variables.scss — CSS override для глобального стиля ul li
> ul li {
>   list-style-type: none;
>   position: relative;
>   padding-left: 0;
>   margin-bottom: 8px;
> }
> ul li p { margin-bottom: 0; }
> ul li ul, ol li ol { padding-top: 4px; }
> ul li::before {
>   content: "";
>   position: relative;
>   left: 0;
>   top: 11px;           // ~половина line-height
>   background: #666666; // цвет маркера
>   width: 11px;
>   height: 1px;
>   display: inline-block;
>   vertical-align: top;
>   margin-right: 10px;
> }
> // Отключить маркер там, где он не нужен (nav, header, footer, dropdown)
> .mega-fixed-menu ul li::before,
> header ul li::before,
> footer ul li::before,
> nav ul li::before,
> .dropdown-menu li::before { content: none; }
> ol li { margin-bottom: 12px; }
> ol { padding-left: 17px; }
> ```

> **Правило вложенных списков.** Вложенный `ul ul` обычно использует другой маркер.
> Задавай отдельно: `ul ul { padding-top: 4px; } ul ul li::before { /* другой стиль */ }`.

> **Правило `li + li` vs `li margin-bottom`.** В нашей теме используется `li + li { margin-top: 0.35rem }`.
> AllCorp3 использует `li { margin-bottom: 8px }`. Оба дают отступ между пунктами.
> При CSS override — выбирай один подход, не оба.

### Аккордеон

| Параметр | Извлечённое | Текущая переменная | Текущее значение | Рекомендация |
|----------|------------|-------------------|-----------------|--------------|
| Стиль | plain/card | — | plain (по умолч.) | — |
| **Заголовок (button)** | | | | |
| Font size | X.Xrem | $accordion-button-font-size | 0.85rem | Изменить |
| Font weight | XXX | $accordion-button-font-weight | $font-weight-bold | Изменить |
| Color (collapsed) | #XXXXXX | (hardcoded $main-dark) | — | — |
| Color (expanded) | #XXXXXX | (hardcoded $primary) | — | — |
| Hover color | #XXXXXX | $accordion-button-hover-color | var(--primary) | Изменить |
| Padding (plain, icon-left) | rem | $accordion-button-padding-left | 0 0 0 1rem | Изменить |
| Padding (plain, icon-right) | rem | $accordion-button-padding-right | 0 1rem 0 0 | Изменить |
| Padding (card, icon-left) | rem | $accordion-card-header-button-padding | 0.9rem 2.9rem 0.85rem | Изменить |
| Padding (card, icon-right) | rem | $accordion-card-header-button-padding-right | 0.9rem 2.6rem 0.85rem 1.3rem | Изменить |
| Padding header (plain) | rem | $accordion-card-header-padding | 0 0 0.8rem 0 | Изменить |
| **Иконка** | | | | |
| Позиция | left/right | icon-left / icon-right класс | left | **Проверить** |
| Тип | one (поворот) / two (замена) | $accordion-icon-type | "two" | **Проверить** |
| Font size + width | X.Xrem | $accordion-icon-font-size | 1.15rem | **width = font-size** |
| Color | #XXXXXX | $accordion-icon-color | var(--primary) | Изменить |
| Icon hover color | #XXXXXX | $accordion-icon-hover-color | var(--primary) | Изменить |
| margin-top (корректировка) | Xrem | $accordion-icon-margin-top | -0.3rem | Изменить |
| **Тело (body)** | | | | |
| Font size | X.Xrem | (наследует body) | — | **Проверить шрифтовой файл** |
| Padding (icon-left) | rem | $accordion-body-padding-left | 0 1.25rem 0.25rem 2.6rem | Изменить |
| Padding (icon-right) | rem | $accordion-body-padding-right | 0 2.35rem 0.25rem 1.25rem | Изменить |
| **Элемент (item/card)** | | | | |
| Margin bottom | X.Xrem | $accordion-margin-bottom | 1.25rem | Изменить |
| **Card стиль — border/shadow** | | | | |
| Border | значение/0 | $accordion-card-border | 0 | Изменить |
| Box shadow | значение/none | $accordion-card-box-shadow | null (= наследует card) | Изменить |
| Border radius | значение/null | $accordion-card-border-radius | null (= $border-radius) | Изменить |
| Hover shadow | значение/none | $accordion-card-hover-shadow | 0 5px 20px rgba(0,0,0,0.1) | Изменить |
| **Plain стиль — border** | | | | |
| Border width | Xpx | $accordion-plain-border-width | 0 0 0 0 | Изменить |
| Border style | none/solid | $accordion-plain-border-style | none | Изменить |
| Border color | #XXXXXX | $accordion-plain-border-color | none | Изменить |

> **ВАЖНО: Текст внутри кнопки.** Скрипт извлекает `accordion.button.fontSize` / `fontWeight` из **внутреннего текстового элемента** (`<span>`, `<a>`, `<strong>`), а не из контейнера.
> Поле `accordion.button.hasInnerTextEl` = `true` означает, что стили текста отличаются от контейнера.
> Поля `containerFontSize` / `containerFontWeight` содержат стили самого контейнера.
> Всегда используй значения из `fontSize` / `fontWeight` (они уже содержат правильные данные из внутреннего элемента).

> **Правило вертикальных padding:** Поле `accordion.button.paddingYEqual` показывает, совпадают ли top и bottom padding.
> В нашей теме вертикальные padding кнопки аккордеона должны быть **равными**. Если на образце они разные — бери среднее.

> **Правило иконки — size = width:** Переменная `$accordion-icon-font-size` задаёт и `font-size`, и `width` иконки.
> Скрипт извлекает оба значения: `accordion.icon.fontSize` и `accordion.icon.width`.

> **Правило margin-top иконки:** Переменная `$accordion-icon-margin-top` (дефолт `-0.3rem`) корректирует вертикальное положение `::before` иконки.
> Если на нашем сайте при равных paddingY иконка визуально по центру — установи `$accordion-icon-margin-top: 0`.
> НЕ меняй это значение в шрифтовых файлах (`src/assets/scss/fonts/`) — только через переменную.

> **Правило типа иконки:** Скрипт извлекает `accordion.icon.type` — `"pseudo"` (CSS ::before/::after) или `"element"` (<i>, <svg>).
> Если `"pseudo"` — проверь `accordion.icon.content` и `accordion.icon.transform`:
> - Если у свёрнутого и развёрнутого элемента **одна и та же иконка**, но разный `transform` (rotate) → `$accordion-icon-type: "one"`.
> - Если у свёрнутого и развёрнутого **разные иконки** (content отличается) → `$accordion-icon-type: "two"`.
> Также определи позицию: `accordion.icon.position` → класс `.icon-left` или `.icon-right` на `.accordion-wrapper`.

> **Правило стиля аккордеона:** Скрипт возвращает `accordion.style` — `"plain"` (без фона, без бордера, без тени) или `"card"` (с фоном/бордером/тенью).
> Для card-стиля задай: `$accordion-card-border`, `$accordion-card-box-shadow`, `$accordion-card-border-radius`.
> Для plain-стиля задай: `$accordion-plain-border-width`, `$accordion-plain-border-style`, `$accordion-plain-border-color`.

> **ВАЖНО: Шрифтовой файл.** Файл `src/assets/scss/fonts/{FontName}.scss` компилируется **отдельно** от `style.scss` и подключается **после** него.
> Он может переопределять `$font-size-base`, что перебьёт значение из `_user-variables.scss`.
> При смене шрифта или `$font-size-base` — **обязательно проверь и обнови** значение в шрифтовом файле.

## Шрифты для подключения
Если обнаружены Google Fonts или другие веб-шрифты, которых нет в теме:
- Название шрифта
- URL для подключения
- Рекомендация по подключению (enqueue в functions.php или @import)

## Переменные, которые нужно создать
Если обнаружены токены, для которых нет переменных в _variables.scss:
- Предложить имя переменной
- Значение
- Где определить
```

**Покажи отчёт пользователю и жди подтверждения** перед обновлением `_user-variables.scss`.

---

## Шаг 3: Обновление _user-variables.scss

После подтверждения пользователя, запиши переменные в файл
`src/assets/scss/_user-variables.scss`.

**Образец структуры** (по аналогии с дочерней темой Horizons — см. `wp-content/themes/horizons/src/assets/scss/_user-variables.scss`):

```scss
//--------------------------------------------------------------
// User Variables — переопределения для конкретного проекта
// Извлечено из: [URL]
// Дата: YYYY-MM-DD
//--------------------------------------------------------------

// ── Кастомные цвета (карта) ──
// Если на сайте-образце есть цвета, которых нет в теме,
// создай карту — они станут доступны как утилитарные классы (.text-*, .bg-*, .btn-*)
$custom-colors: (
  "brand-accent": #XXXXXX,
  "brand-dark": #XXXXXX,
  "brand-light": #XXXXXX,
);
$custom-theme-colors: $custom-colors;

// ── Основные цвета ──
$primary: #XXXXXX;           // (было: $blue / #3f78e0)
$primary-soft: #XXXXXX;      // Мягкий вариант primary

$body-bg: #XXXXXX;           // (было: $white)
$body-color: #XXXXXX;        // (было: зависит от $navy)
$dark: #XXXXXX;              // (было: $navy / #343f52)

// Переопределение именованных цветов — если нужно
// $blue:    #XXXXXX;   // (было: #3f78e0)
// $navy:    #XXXXXX;   // (было: #343f52)

// Серые — если палитра серых отличается
$gray-100: #XXXXXX;
$gray-200: #XXXXXX;
// ... $gray-300 — $gray-900

// Глобальное скругление
$border-radius: 0;           // (было: 0.4rem) — 0 для строгого дизайна

// ── Типографика ──
$font-family-sans-serif: "New Font", sans-serif;  // (было: Manrope)
$font-size-root: XXpx;       // (было: 20px)
$font-size-base: X.Xrem;     // (было: 0.8rem)
$font-weight-normal: 400;    // (было: 500)
$line-height-base: 1.X;      // (было: 1.7)

$h1-font-size: X.Xrem;
$h2-font-size: X.Xrem;
// ... только изменённые размеры заголовков

// ── Кнопки ──
$btn-border-width: 1px;      // (было: 2px)
$input-btn-line-height: 1;   // (было: зависит от Bootstrap)
$btn-font-weight: 600;       // (было: $font-weight-bold / 700)

// Размеры кнопок — все варианты
// Default
$btn-padding-y:     X.Xrem;  // (было: 0.5rem)
$btn-padding-x:     X.Xrem;  // (было: 1.2rem)
$btn-font-size:     X.Xrem;

// Extra Small (XS)
$btn-padding-y-xs:  X.Xrem;
$btn-padding-x-xs:  X.Xrem;
$btn-font-size-xs:  X.Xrem;

// Small (SM)
$btn-padding-y-sm:  X.Xrem;  // (было: 0.35rem)
$btn-padding-x-sm:  X.Xrem;  // (было: 0.9rem)
$btn-font-size-sm:  X.Xrem;

// Medium (MD)
$btn-padding-y-md:  X.Xrem;
$btn-padding-x-md:  X.Xrem;
$btn-font-size-md:  X.Xrem;

// Large (LG)
$btn-padding-y-lg:  X.Xrem;  // (было: 0.65rem)
$btn-padding-x-lg:  X.Xrem;  // (было: 1.4rem)
$btn-font-size-lg:  X.Xrem;

// Extra Large (ELG)
$btn-padding-y-elg: X.Xrem;
$btn-padding-x-elg: X.Xrem;
$btn-font-size-elg: X.Xrem;

// Font weights по размерам (если все одинаковые — можно только $btn-font-weight)
$btn-font-weight-xs:  600;
$btn-font-weight-sm:  600;
$btn-font-weight-md:  600;
$btn-font-weight-lg:  600;
$btn-font-weight-elg: 600;

// ── Формы ──
$input-font-size: X.Xrem;              // (было: 0.75rem)
$input-bg: #XXXXXX;                     // (было: body-bg / white)
$input-border-color: #XXXXXX;           // (было: rgba($shadow-border, 0.07))
$input-padding-y: X.Xrem;              // (было: 0.6rem)
$input-padding-x: X.Xrem;              // (было: 1rem)
$input-color: #XXXXXX;
$input-focus-border-color: #XXXXXX;
$input-focus-bg: #XXXXXX;
$form-floating-height: XXpx;
$form-floating-padding-x: X.Xrem;
$form-floating-padding-y: X.Xrem;

// ── Навигация (горизонтальное меню, верхний уровень) ──
$nav-link-font-size: X.Xrem;
$nav-link-font-weight: 700;
$nav-link-text-transform: uppercase;    // или none
$nav-link-letter-spacing: X.Xrem;      // межбуквенный интервал

// ── Навигация (dropdown / дети) ──
$dropdown-font-size: X.Xrem;
$dropdown-font-weight: 400;
$dropdown-text-transform: none;
$dropdown-letter-spacing: normal;

// ── Аккордеон ──
// Общие (все типы)
$accordion-button-font-size:    X.Xrem;       // (было: 0.85rem) — размер ТЕКСТА (проверь inner span!)
$accordion-button-font-weight:  700;           // (было: $font-weight-bold / 700)
$accordion-icon-font-size:      X.Xrem;       // (было: 1.15rem) — задаёт и font-size, и width иконки
$accordion-icon-color:          #XXXXXX;       // (было: var(--primary))
$accordion-icon-margin-top:     0;             // (было: -0.3rem) — 0 при равных paddingY
$accordion-icon-type:           "one";         // (было: "two") — "one" = поворот, "two" = замена
$accordion-margin-bottom:       -1px;          // (было: 1.25rem) — -1px для перекрытия бордеров

// Hover
$accordion-button-hover-color:  $body-color;   // (было: var(--primary))
$accordion-icon-hover-color:    $body-color;   // (было: var(--primary))
$accordion-button-active-color: $blue;         // цвет при открытии

// Иконки — если type "one"
$accordion-icon-one:            "\ec5d";       // (было: $icon-caret-down)
$accordion-icon-closed-rotate:  -45deg;        // (было: 0deg)
$accordion-icon-opened-rotate:  135deg;        // (было: 180deg)

// Card стиль — border/shadow
$accordion-card-border:         1px solid #e5e5e5; // (было: 0)
$accordion-card-box-shadow:     none;          // (было: null = $box-shadow-with-border)
$accordion-card-border-radius:  $border-radius $border-radius 0 0; // (было: null)
$accordion-card-hover-shadow:   none;          // (было: 0 5px 20px rgba(0,0,0,0.1))

// Card стиль — padding кнопки (paddingY должны быть равными!)
$accordion-card-header-button-padding:       X.Xrem X.Xrem X.Xrem X.Xrem; // (было: 0.9rem 2.9rem 0.85rem)
$accordion-card-header-button-padding-right: X.Xrem X.Xrem X.Xrem X.Xrem; // (было: 0.9rem 2.6rem 0.85rem 1.3rem)

// Plain стиль — padding
$accordion-card-header-padding:  X.Xrem X.Xrem X.Xrem; // (было: 0 0 0.8rem 0) — paddingY равные!
$accordion-button-padding-left:  0 0 0 X.Xrem; // (было: 0 0 0 1rem)
$accordion-button-padding-right: 0 X.Xrem 0 0; // (было: 0 1rem 0 0)

// Padding body
$accordion-body-padding-left:   0 X.Xrem X.Xrem X.Xrem; // (было: 0 1.25rem 0.25rem 2.6rem)
$accordion-body-padding-right:  0 X.Xrem X.Xrem X.Xrem; // (было: 0 2.35rem 0.25rem 1.25rem)

// Plain стиль — border (если есть):
// $accordion-plain-border-width: 0 0 1px 0;  // (было: 0 0 0 0)
// $accordion-plain-border-style: solid;       // (было: none)
// $accordion-plain-border-color: $border-color; // (было: none)

// ── Breadcrumb ──
$breadcrumb-divider-color: #XXXXXX;
$breadcrumb-color: #XXXXXX;
$breadcrumb-hover-color: $primary;
$breadcrumb-active-color: $primary;

// ── Карточки ──
$card-cap-padding-y: X.Xrem;
$card-cap-padding-x: X.Xrem;
$card-border-radius: $border-radius;

//--------------------------------------------------------------
// Кастомные CSS-правила (hover-эффекты, декоративные элементы)
//--------------------------------------------------------------

// Пример: text-transform для кнопок
.btn {
    text-transform: uppercase;
}

//--------------------------------------------------------------
// Импорт шрифтов
//--------------------------------------------------------------
//START IMPORT FONTS
// @import "fonts/NewFont";
//END IMPORT FONTS
```

**Правила записи:**
- Только переменные, значения которых **отличаются** от дефолтных
- Комментарий с прежним значением `// (было: ...)`
- Группировка по секциям: Цвета → Типографика → Кнопки → Формы → Навигация → Кастомные правила → Шрифты
- Все переменные **без** `!default` — они перехватят дефолты в `_variables.scss`
- CSS-правила (`.btn { text-transform: ... }`) допустимы — они попадут в итоговый CSS

**ВАЖНО:** Порядок импорта в `style.scss`:
```scss
@import "theme-colors";      // 1. Базовые цвета ($blue, $navy и т.д.)
@import 'user-variables';    // 2. Пользовательские переопределения ← СЮДА ПИШЕМ
@import "variables";          // 3. Все переменные с !default
```

Поэтому в `_user-variables.scss`:
- **Можно** переопределить цвета из `_theme-colors.scss` (они уже загружены и используют `!default`)
- **Можно** задать любые переменные из `_variables.scss` — они перехватят `!default`
- **Можно** использовать `$primary` и другие цвета из `_theme-colors.scss` в своих значениях

---

## Шаг 4: Проверка (опционально)

Если пользователь хочет сразу увидеть результат:
1. Запусти `/build` для компиляции темы
2. Открой страницу сайта в Playwright и сделай скриншот для сравнения

---

## Справочник переменных

### Цвета

**Именованные (из _theme-colors.scss):**
`$sky` (#5eb9f0), `$blue` (#3f78e0), `$grape` (#605dba), `$purple` (#747ed1), `$violet` (#a07cc5), `$pink` (#d16b86), `$fuchsia` (#e668b3), `$red` (#e2626b), `$orange` (#f78b77), `$yellow` (#fab758), `$green` (#45c4a0), `$leaf` (#7cb798), `$aqua` (#54a8c7), `$navy` (#343f52), `$ash` (#9499a3)

**Семантические (из _variables.scss):**
`$primary` (= $blue), `$secondary` (= $gray-400), `$success` (= $green), `$info` (= $sky), `$warning` (= $yellow), `$danger` (= $red)

**Серые:** `$gray-100` — `$gray-900`, `$white`, `$black`

**Тело и ссылки:** `$body-color`, `$body-bg`, `$link-color`, `$link-hover-color`

**Кастомные цвета (карта):** `$custom-colors`, `$custom-theme-colors` — создают утилитарные классы

### Типографика

| Переменная | Дефолт | Описание |
|------------|--------|----------|
| `$font-family-sans-serif` | Manrope, sans-serif | Основной шрифт |
| `$font-size-root` | 20px | Корень (rem-база) |
| `$font-size-base` | 0.8rem | Базовый размер |
| `$font-size-sm` | 0.7rem | Уменьшенный |
| `$font-size-lg` | 1rem | Увеличенный |
| `$h1-font-size` — `$h6-font-size` | — | Размеры заголовков |
| `$headings-font-weight` | 700 | Жирность всех заголовков |
| `$headings-color` | — | Цвет всех заголовков |
| `$font-weight-light` | 400 | Тонкий |
| `$font-weight-normal` | 500 | Нормальный |
| `$font-weight-bold` | 700 | Жирный |
| `$line-height-base` | 1.7 | Межстрочный |

### Кнопки

| Переменная | Дефолт | Описание |
|------------|--------|----------|
| `$btn-border-width` | 2px | Ширина рамки |
| `$input-btn-line-height` | 1.7 ($line-height-base) | Line-height кнопок и инпутов. Влияет на высоту! Вычислять: lineHeight / fontSize образца |
| `$btn-font-weight` | $font-weight-bold | Жирность (все размеры) |
| **Default** | | |
| `$btn-padding-y` / `$btn-padding-x` | 0.5rem / 1.2rem | Padding |
| `$btn-font-size` | — | Размер шрифта |
| **XS** | | |
| `$btn-padding-y-xs` / `$btn-padding-x-xs` | — | Padding XS |
| `$btn-font-size-xs` | — | Размер XS |
| **SM** | | |
| `$btn-padding-y-sm` / `$btn-padding-x-sm` | 0.35rem / 0.9rem | Padding SM |
| `$btn-font-size-sm` | — | Размер SM |
| **MD** | | |
| `$btn-padding-y-md` / `$btn-padding-x-md` | — | Padding MD |
| `$btn-font-size-md` | — | Размер MD |
| **LG** | | |
| `$btn-padding-y-lg` / `$btn-padding-x-lg` | 0.65rem / 1.4rem | Padding LG |
| `$btn-font-size-lg` | — | Размер LG |
| **ELG** | | |
| `$btn-padding-y-elg` / `$btn-padding-x-elg` | — | Padding ELG |
| `$btn-font-size-elg` | — | Размер ELG |
| **Per-size weights** | | |
| `$btn-font-weight-xs` — `$btn-font-weight-elg` | — | Жирность по размерам |

### Скругление

| Переменная | Дефолт | Определена в | Описание |
|------------|--------|-------------|----------|
| `$border-radius` | 0.4rem | _variables.scss | Глобальное скругление (кнопки, карточки, инпуты) |
| `$border-radius-sm` | 0.2rem | _variables.scss | SM |
| `$border-radius-lg` | 0.4rem | _variables.scss | LG |
| `$border-radius-xl` | 0.8rem | _variables.scss | XL |
| `$rounded-pill` | 1.5rem | _variables.scss | Для `.rounded-pill` класса |
| `$border-radius-pill` | 50rem | Bootstrap | Для `.rounded-pill` утилиты и `.btn-expand` |

### Формы

| Переменная | Дефолт | Описание |
|------------|--------|----------|
| `$input-font-size` | 0.75rem | Размер шрифта input |
| `$input-font-weight` | — | Жирность шрифта input |
| `$input-bg` | — | Фон input |
| `$input-color` | — | Цвет текста input |
| `$input-hover-bg` | null | Фон при hover (null = без изменения) |
| `$input-focus-border-color` | — | Бордер в фокусе |
| `$input-focus-bg` | — | Фон в фокусе |
| `$input-focus-box-shadow` | unset | Тень в фокусе |
| `$input-focus-color` | — | Цвет текста в фокусе |
| `$input-box-shadow` | $box-shadow | Тень по умолчанию (для отключения: none) |
| `$form-floating-height` | add(2.5rem, border) | Высота floating label input. **Обязательно подгоняй**, чтобы совпадала с образцом |
| `$form-floating-padding-x` / `$form-floating-padding-y` | — | Padding floating |

> **ВАЖНО: Высота инпутов.** На сайте используются floating-label инпуты (`.form-floating`). Их высота задаётся `$form-floating-height`, а НЕ вычисляется из padding+font. Для подгонки высоты к образцу: `$form-floating-height: calc(Xrem + 2px)`, где `Xrem = (targetHeight - 2) / rootFontSize`.

### Навигация (горизонтальное меню)

| Переменная | Дефолт | Описание |
|------------|--------|----------|
| `$nav-link-font-size` | 0.8rem | Размер шрифта верхнего уровня |
| `$nav-link-font-weight` | $font-weight-bold | Жирность верхнего уровня |
| `$nav-link-text-transform` | none | Трансформация (uppercase/none) |
| `$nav-link-letter-spacing` | $letter-spacing | Межбуквенный интервал |
| `$nav-link-color` | $main-dark | Цвет ссылки |

### Навигация (dropdown / дочерние пункты)

| Переменная | Дефолт | Описание |
|------------|--------|----------|
| `$dropdown-font-size` | $font-size-base * 0.9375 | Размер шрифта dropdown |
| `$dropdown-font-weight` | $font-weight-bold | Жирность dropdown |
| `$dropdown-text-transform` | none | Трансформация dropdown |
| `$dropdown-letter-spacing` | normal | Межбуквенный интервал dropdown |

### Навигация (вертикальное меню)

| Переменная | Дефолт | Описание |
|------------|--------|----------|
| `$navbar-vertical-N-nav-link-font-size` | inherit | Размер шрифта (N = 1,2,3) |
| `$navbar-vertical-N-nav-link-font-weight` | inherit | Жирность (N = 1,2,3) |
| `$navbar-vertical-N-nav-link-text-transform` | none | Трансформация (N = 1,2,3) |
| `$navbar-vertical-N-nav-link-letter-spacing` | normal | Межбуквенный интервал (N = 1,2,3) |

### Табы

| Переменная | Дефолт | Описание |
|------------|--------|----------|
| **Общие (все типы)** | | |
| `$tab-font-size` | — | Промежуточная переменная (14px → 0.7rem при root 20px) |
| `$tab-font-weight` | — | Промежуточная переменная |
| `$tab-color` | — | Неактивный цвет (всех типов) |
| `$nav-tabs-basic-font-size` | 0.85rem | Размер шрифта basic-стиля |
| `$nav-tabs-basic-font-weight` | 600 | Жирность basic-стиля |
| `$nav-tabs-basic-color` | $body-color | Неактивный цвет basic |
| `$nav-pills-font-size` | 0.85rem | Размер шрифта pills-стиля |
| `$nav-pills-font-weight` | 600 | Жирность pills-стиля |
| `$nav-pills-color` | $body-color | Неактивный цвет pills |
| `$nav-tabs-fanny-font-size` | $btn-font-size | Размер шрифта fanny-стиля |
| `$nav-tabs-fanny-font-weight` | $btn-font-weight | Жирность fanny-стиля |
| `$nav-tabs-fanny-color` | $body-color | Неактивный цвет fanny |
| **Nav-pills — бордер** | | |
| `$nav-pills-border-top` | 0 (нет) | Бордер сверху неактивного — полная строка: `1px solid #e5e5e5` |
| `$nav-pills-border-right` | 0 (нет) | Бордер справа неактивного |
| `$nav-pills-border-bottom` | 0 (нет) | Бордер снизу неактивного |
| `$nav-pills-border-left` | 0 (нет) | Бордер слева неактивного |
| `$nav-pills-hover-border-color` | **primary (!)** | Цвет бордера при hover — **дефолт primary**, всегда переопределять если нужен серый |
| `$nav-pills-active-border-color` | **transparent (!)** | Цвет бордера активного — **дефолт transparent** (бордер исчезает), задать #e5e5e5 чтобы сохранить |
| **Nav-pills — фон и размеры** | | |
| `$nav-pills-bg` | transparent | Фон неактивного |
| `$nav-pills-padding` | 0.55rem 1.25rem | Padding ссылки (inactive + active) |
| `$nav-pills-border-radius` | $border-radius | Скругление таблетки |
| `$nav-pills-margin-right` | 0.5rem | Расстояние между таблетками |
| `$nav-pills-box-shadow` | none | Тень неактивного |
| **Nav-pills — активный** | | |
| `$nav-pills-active-bg` | white | Фон активного |
| `$nav-pills-active-color` | primary | Цвет текста активного |
| `$nav-pills-active-box-shadow` | $box-shadow-with-border | Тень активного — `inset 0 2px 0 $blue` для полосы сверху |
| **Nav-pills — hover** | | |
| `$nav-pills-hover-bg` | white | Фон при hover |
| `$nav-pills-hover-color` | **primary (!)** | Цвет текста при hover — **дефолт primary**, переопределить если дизайн отличается |
| **Nav-tabs-basic** | | |
| `$nav-tabs-basic-padding` | 0.6rem 0 | Padding |
| `$nav-tabs-basic-margin-right` | 1rem | Расстояние между |
| `$nav-tabs-basic-active-color` | $nav-tabs-link-active-color | Цвет активного |
| `$nav-tabs-basic-active-border-color` | $nav-tabs-link-active-color | Цвет подчёркивания активного |
| `$nav-tabs-basic-hover-color` | var(--primary) | Цвет при hover |
| `$nav-tabs-basic-hover-border-color` | $nav-tabs-link-active-color | Цвет подчёркивания при hover |
| **Nav-tabs-fanny** | | |
| `$nav-tabs-fanny-padding-y` / `$nav-tabs-fanny-padding-x` | $btn-padding-y / $btn-padding-x | Padding |
| `$nav-tabs-fanny-border-radius-default` | $btn-border-radius | Скругление |
| `$nav-tabs-fanny-active-bg` | var(--primary) | Фон активного |
| `$nav-tabs-fanny-active-color` | white | Цвет активного |
| `$nav-tabs-fanny-hover-color` | var(--primary) | Цвет при hover |

### Аккордеон

| Переменная | Дефолт | Описание |
|------------|--------|----------|
| **Общие** | | |
| `$accordion-button-font-size` | 0.85rem | Размер шрифта заголовка |
| `$accordion-button-font-weight` | $font-weight-bold | Жирность заголовка |
| `$accordion-icon-font-size` | 1.15rem | Размер и width иконки (одна переменная) |
| `$accordion-icon-color` | var(--primary) | Цвет иконки |
| `$accordion-icon-margin-top` | -0.3rem | Вертикальная корректировка ::before иконки |
| `$accordion-icon-type` | "two" | "one" (с поворотом) или "two" (открыть/закрыть) |
| `$accordion-margin-bottom` | 1.25rem | Отступ между items (-1px для перекрытия бордеров) |
| **Hover / Active** | | |
| `$accordion-button-hover-color` | var(--primary) | Цвет текста при hover |
| `$accordion-icon-hover-color` | var(--primary) | Цвет иконки при hover |
| `$accordion-button-active-color` | var(--primary) | Цвет текста при открытии |
| **Иконки (type "one")** | | |
| `$accordion-icon-one` | $icon-caret-down | Символ иконки |
| `$accordion-icon-closed-rotate` | 0deg | Поворот в закрытом состоянии |
| `$accordion-icon-opened-rotate` | 180deg | Поворот в открытом состоянии |
| **Card стиль** | | |
| `$accordion-card-border` | 0 | Border карточки (напр. `1px solid #e5e5e5`) |
| `$accordion-card-box-shadow` | null (= наследует card) | Shadow карточки (`none` = убрать) |
| `$accordion-card-border-radius` | null (= $border-radius) | Border-radius карточки |
| `$accordion-card-hover-shadow` | 0 5px 20px rgba(0,0,0,0.1) | Тень при hover |
| `$accordion-card-header-button-padding` | 0.9rem 2.9rem 0.85rem | Padding кнопки card (icon-left) |
| `$accordion-card-header-button-padding-right` | 0.9rem 2.6rem 0.85rem 1.3rem | Padding кнопки card (icon-right) |
| **Plain стиль** | | |
| `$accordion-card-header-padding` | 0 0 0.8rem 0 | Padding header plain |
| `$accordion-button-padding-left` | 0 0 0 1rem | Padding кнопки plain (icon-left) |
| `$accordion-button-padding-right` | 0 1rem 0 0 | Padding кнопки plain (icon-right) |
| `$accordion-body-padding-left` | 0 1.25rem 0.25rem 2.6rem | Padding body (icon-left) |
| `$accordion-body-padding-right` | 0 2.35rem 0.25rem 1.25rem | Padding body (icon-right) |
| `$accordion-plain-border-width` | 0 0 0 0 | Border width plain |
| `$accordion-plain-border-style` | none | Border style plain |
| `$accordion-plain-border-color` | none | Border color plain |

### Списки

| Переменная | Дефолт | Описание |
|------------|--------|----------|
| **`.unordered-list` — маркер-символ** | | |
| `$unordered-list-padding-left` | 1rem | Отступ слева у `li` (место под маркер) |
| `$unordered-list-dot-content` | `"\2022"` (•) | Символ маркера (Unicode) |
| `$unordered-list-dot-font-family` | `$font-family-sans-serif` | Шрифт маркера |
| `$unordered-list-dot-font-size` | 1rem | Размер маркера |
| `$unordered-list-dot-font-weight` | normal | Жирность маркера |
| `$unordered-list-dot-top` | -0.15rem | Вертикальное смещение `::before` |
| `$unordered-list-dot-left` | 0 | Горизонтальное смещение `::before` |
| **`.text-line` — список с горизонтальной полоской (маркер-бар через переменные)** | | |
| `$text-line-width` | `0.75rem` (~11px) | Ширина маркера-бара — совпадает с AllCorp3 (11px) |
| `$text-line-height` | `0.05rem` | Высота маркера-бара (при root 15px = 0.75px, не рендерится!) |
| `$text-line-color` | `var(--bs-primary)` | Цвет маркера-бара; **переопределять в `_user-variables.scss`** |
| **CSS-only (нет переменных)** | | |
| `ul li::before background` | — | Цвет CSS-бара голого `ul` (только через CSS override) |
| `ul li::before width/height` | — | Размер CSS-бара голого `ul` |
| `ul li::before margin-right` | — | Отступ после маркера |
| `ul li margin-bottom` | 0 (только `li+li margin-top: 0.35rem`) | Отступ снизу каждого пункта — **нет переменной, CSS override** |
| `ol li margin-bottom` | 0 | Отступ снизу пункта ol |
| `ol padding-left` | Bootstrap default | Отступ для счётчика ol |

> **`.text-line` — список с баром через переменные.** В отличие от голого `ul`, класс `.text-line` управляется через переменные `$text-line-width`, `$text-line-height`, `$text-line-color`.
> Дефолт `$text-line-height: 0.05rem` при `font-size-root: 15px` = 0.75px — **бар не рендерится** (меньше 1px)!
> Чтобы бар был виден: `$text-line-height: 1px` — задаётся в пикселях, не rem.

> **Маркер-бар голого `ul` (CSS background) не управляется переменными** — только через CSS override в `_user-variables.scss`.
> Маркер-символ управляется через `$unordered-list-dot-content` и применяется ТОЛЬКО к `.unordered-list` (не к голым `ul`).

> **`ul li margin-bottom` — нет переменной.** Добавлять CSS override прямо в `_user-variables.scss`:
> ```scss
> // ── Списки ──
> .list-unstyled .text-line,
> ul li {
>   margin-bottom: 8px;  // как на AllCorp3
> }
> ```

### Breadcrumb

| Переменная | Дефолт | Описание |
|------------|--------|----------|
| `$breadcrumb-divider-color` | — | Цвет разделителя |
| `$breadcrumb-color` | — | Цвет текста |
| `$breadcrumb-hover-color` | — | Цвет при наведении |
| `$breadcrumb-active-color` | — | Цвет активного элемента |

### Карточки

| Переменная | Дефолт | Описание |
|------------|--------|----------|
| `$card-spacer-y` / `$card-spacer-x` | 2rem | Padding карточки |
| `$card-cap-padding-y` / `$card-cap-padding-x` | — | Padding шапки |
| `$card-border-radius` | $border-radius | Скругление |

### Брейкпоинты и контейнеры (если отличаются)

```scss
$grid-breakpoints: (xs: 0, sm: 576px, md: 768px, lg: 992px, xl: 1200px, xxl: 1400px);
$container-max-widths: (sm: 540px, md: 720px, lg: 960px, xl: 1140px, xxl: 1320px);
```
