# Шаблоны страницы товара (hoger)

Выбор шаблона в самом товаре (блок «Шаблон товара» в редакторе) и загрузчик живут в родительской теме codeweber (`functions/woocommerce/product-template.php`, документ `WC_PRODUCT_TEMPLATES.md` родителя). Здесь регистрируются шаблоны, нужные только hoger.pro.

- Регистрация: `functions/woocommerce/product-templates.php` (фильтр `codeweber_product_templates`).
- Файлы: `woocommerce/single-product-templates/{slug}.php`.
- Мета товара: `_cw_product_template` (slug). Пусто — стандартная страница товара.

## Шаблоны

| Slug | Название | Отличие от стандартного |
|---|---|---|
| `description-under-image` | Описание под изображением | Краткое описание (excerpt) не под заголовком справа, а в левой колонке под галереей, в блоке `card card-body text-dark mt-5`; нижний отступ абзаца гасится `mb-n4`. Пустое описание — блока нет. |

## Как добавить шаблон

1. Скопировать родительский `woocommerce/single-product.php` в `woocommerce/single-product-templates/{slug}.php` и внести изменения.
2. Добавить строку в `hoger_register_product_templates()` (название через `__()` с text domain `hoger`, перевод — в `languages/ru_RU.po`).

Шаблон — копия стандартного: когда в родителе меняется `single-product.php`, то же изменение нужно внести в файлы шаблонов.
