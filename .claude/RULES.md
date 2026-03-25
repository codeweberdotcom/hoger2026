# RULES.md — CodeWeber Theme

Базовые правила для всех скиллов. Читается в начале любой задачи.

---

## Язык кода

**Всё — только на английском:** функции, переменные, slug-и, meta keys, labels в PHP, комментарии.
Русский — только в `languages/ru_RU.po` (переводы).

---

## Именование

| Элемент | Паттерн | Пример |
|---------|---------|--------|
| Функции | `codeweber_` + snake_case | `codeweber_get_post_template()` |
| Классы | PascalCase | `Codeweber_Yandex_Maps` |
| Константы | UPPER_SNAKE_CASE | `CODEWEBER_FORMS_PATH` |
| Хуки | `codeweber_{module}_{event}` | `codeweber_form_after_send` |
| CPT-функции | `cptui_register_my_cpts_{slug}()` | `cptui_register_my_cpts_portfolio()` |
| Meta keys | `_{slug}_{field}` | `_portfolio_client` |
| Text domain | из `style.css` (`Text Domain:`) | `'asprocorp3'` |

> Функции без префикса — **запрещены**.

---

## Безопасность — обязательно

### Вывод данных
```php
echo esc_html($text);       // текст
echo esc_attr($attr);       // HTML-атрибут
echo esc_url($url);         // URL
echo wp_kses_post($html);   // HTML с разрешёнными тегами
```

### $_POST / $_GET — всегда санитизировать
```php
$text  = sanitize_text_field( wp_unslash( $_POST['field'] ?? '' ) );
$id    = absint( $_POST['id'] ?? 0 );
$url   = esc_url_raw( wp_unslash( $_POST['url'] ?? '' ) );
$email = sanitize_email( wp_unslash( $_POST['email'] ?? '' ) );
```

### save_post — 4 обязательные проверки
```php
if ( ! wp_verify_nonce( $_POST['nonce'] ?? '', 'action' ) ) { return; }
if ( ! current_user_can( 'edit_post', $post_id ) ) { return; }
if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) { return; }
if ( get_post_type( $post_id ) !== '{slug}' ) { return; }
```

### AJAX — nonce обязателен
```php
check_ajax_referer( 'my_nonce_action', 'nonce' );
```

### SQL — только через prepare()
```php
$wpdb->get_results( $wpdb->prepare( "SELECT * FROM %i WHERE id = %d", $table, $id ) );
```

### Запрещено
- `echo $variable;` без `esc_*`
- AJAX без nonce
- `permission_callback => '__return_true'` для POST/PUT/DELETE
- `error_log()` без `if (WP_DEBUG)`
- `file_put_contents()` в шаблонах

---

## Redux

```php
// ✅ Предпочтительно
Codeweber_Options::get('my_key');

// Допустимо
global $opt_name;
Redux::get_option( $opt_name, 'my_key', 'default' );

// ❌ Запрещено
$options = get_option('redux_demo');
```

> Redux доступен только после `after_setup_theme` с приоритетом ≥ 30.

---

## Переводы — обязательно при любом новом тексте

1. Все user-facing строки — через `esc_html__( 'Text', 'TEXTDOMAIN' )`
2. После добавления кода — обновить `languages/{slug}.pot` и `languages/ru_RU.po`
3. Скомпилировать: `wp i18n make-mo languages/ru_RU.po`

---

## Постоянные ссылки — после нового CPT/таксономии

```bash
wp rewrite flush
```

---

## Документация parent темы

Читай перед реализацией задачи:

| Задача | Файл |
|--------|------|
| Архитектура, entry point | `doc_claude/architecture/THEME_OVERVIEW.md` |
| Порядок загрузки файлов | `doc_claude/architecture/FILE_LOADING_ORDER.md` |
| Стандарты кода (полный) | `doc_claude/development/CODING_STANDARDS.md` |
| Сборка Gulp, SCSS | `doc_claude/development/BUILD_SYSTEM.md` |
| Добавить CPT | `doc_claude/cpt/CPT_HOW_TO_ADD.md` |
| Каталог CPT | `doc_claude/cpt/CPT_CATALOG.md` |
| Шаблоны archive/single | `doc_claude/templates/ARCHIVE_SINGLE_PATTERNS.md` |
| Карточки постов | `doc_claude/templates/POST_CARDS_SYSTEM.md` |
| Выбор header/footer | `doc_claude/templates/TEMPLATE_SYSTEM.md` |
| Redux, Codeweber_Options | `doc_claude/settings/REDUX_OPTIONS.md` |
| AJAX-архитектура | `doc_claude/api/AJAX_FETCH_SYSTEM.md` |
| REST API | `doc_claude/api/REST_API_REFERENCE.md` |
| Хуки | `doc_claude/api/HOOKS_REFERENCE.md` |
| Безопасность (полный) | `doc_claude/security/SECURITY_CHECKLIST.md` |
| CodeWeber Forms | `doc_claude/forms/CODEWEBER_FORMS.md` |
| CF7 | `doc_claude/forms/CF7_INTEGRATION.md` |

Все пути относительно `../PARENT_SLUG/` от child темы.
