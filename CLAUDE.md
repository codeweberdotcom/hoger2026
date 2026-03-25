# CLAUDE.md — hoger

Дочерняя тема **codeweber**. Создана 2026-03-25.

---

## Главное правило стилизации

**Весь стайлинг — только через `src/assets/scss/_user-variables.scss` в ЭТОЙ теме.**

- ✅ Редактировать: `src/assets/scss/_user-variables.scss` (в этой папке)
- ❌ Никогда не трогать: `../codeweber/src/assets/scss/_user-variables.scss`

### Порядок импорта SCSS

```
_theme-colors.scss  →  _user-variables.scss  →  _variables.scss
```

`$primary` и `$white` **недоступны** в `_user-variables.scss`.
Используй `$blue` вместо `$primary`, `#ffffff` вместо `$white`.

---

## Сборка

Gulp запускается **из директории parent темы**:

```bash
cd ../codeweber
npm run build       # продакшен
npm start           # режим разработки
```

Или через скилл `/build`.

Gulp автоматически определяет активную child тему через WordPress и выводит файлы в `dist/`.

**Требование:** Laragon должен быть запущен (MySQL). Без БД — ошибка `WordPress not loaded`.

---

## Git-правила

Перед любыми правками:
1. Проверить `git status`
2. Если есть незакоммиченные изменения — предложить коммит
3. Только после коммита (или явного отказа) приступать к изменениям

---

## Правила разработки

**Перед любой задачей** прочитай `.claude/RULES.md` — там базовые правила именования, безопасности, переводов и ссылки на документацию.

## Справочник переменных

Полный справочник переменных и паттерны извлечения дизайна:
`.claude/skills/design-extract/SKILL.md`

Полная документация parent (локально):
`../codeweber/doc_claude/`

---

## Архитектура (унаследована от codeweber)

Child тема наследует всю архитектуру parent:
- CPT, Redux Framework, Nav-walkers, AJAX, CF7, DaData — в parent
- Для переопределения шаблонов — создай такую же структуру в child
- Функции enqueue — сначала ищет файл в child, потом в parent