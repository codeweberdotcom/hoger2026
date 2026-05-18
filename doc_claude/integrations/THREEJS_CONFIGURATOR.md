# Three.js 3D Configurator

Интерактивный 3D-конфигуратор для CPT `models`. Позволяет менять поверхность и цвет покрытия модели в реальном времени, переключаться между формами (модель / куб / сфера).

---

## Файлы

| Файл | Назначение |
|------|-----------|
| `functions/integrations/threejs/three-configurator.js` | Главный модуль: Three.js сцена, UI surface-picker, shape switcher |
| `functions/integrations/threejs/three-fry.js` | Фронтенд: рендер модели без конфигуратора (обычная страница) |
| `functions/integrations/threejs/three-fry-admin.js` | Админка: превью модели в метабоксе |
| `functions/meta/surfaces-meta.php` | Метабокс CPT `surfaces` — поля текстур, UV, маски |
| `functions/meta/models-meta.php` | Метабокс CPT `models` — настройки вьюпорта, дефолтная поверхность |
| `functions/settings/models-new-settings.php` | Глобальные настройки вьюпорта (страница в админке) |
| `functions.php` → `hoger_get_surfaces_json()` | PHP → JSON всех поверхностей для фронтенда |
| `single-models.php` | Шаблон страницы модели: canvas + shape switcher HTML |

---

## Подключение скриптов

В `functions.php`:

- **Importmap** (`wp_head`, приоритет 1) — только на `is_singular('models')`:
  ```json
  { "three": "cdn.../three.module.js", "three/addons/": "cdn.../jsm/" }
  ```
- **`three-fry.js`** — `defer`, `type="module"` (через `script_loader_tag` фильтр)
- **`three-configurator.js`** — `footer`, `type="module"`
- В **admin** (`admin_head` / `admin_enqueue_scripts`) — аналогично для `three-fry-admin.js`

Фильтр `hoger_threejs_module_type` добавляет `type="module"` к handle-ам:
`hoger-threejs`, `hoger-threejs-fry`, `hoger-threejs-fry-admin`, `hoger-threejs-configurator`

**Версия Three.js:** `0.173.0` (CDN jsDelivr)

---

## Canvas data-атрибуты (`single-models.php`)

| Атрибут | Тип | Описание |
|---------|-----|---------|
| `data-three` | URL | GLB-файл основной модели |
| `data-exposure` | float | Яркость рендера (LinearToneMapping) |
| `data-saturation` | float | CSS `saturate()` фильтр |
| `data-env-intensity` | float | `envMapIntensity` окружения |
| `data-env-hdr` | URL | HDR-файл окружения (RGBELoader) |
| `data-env-jpg` | URL | JPG-окружение (EquirectangularReflection) |
| `data-env-rotate` | `"1"` | Вращать envMap |
| `data-env-rotate-speed` | float | Скорость вращения (рад/кадр) |
| `data-cam-x/y/z` | float | Позиция камеры (сохранённая) |
| `data-cam-target-x/y/z` | float | Target OrbitControls |
| `data-cam-debug` | `"1"` | Показать debug-оверлей с координатами |
| `data-conf-meshes` | JSON array | Имена мешей для нанесения текстуры |
| `data-default-surface` | int | Индекс дефолтной поверхности (-1 = нет) |
| `data-default-color` | int | Индекс дефолтного цвета |
| `data-cube-url` | URL | GLB куба для shape switcher |
| `data-sphere-url` | URL | GLB сферы для shape switcher |

---

## `three-configurator.js` — архитектура

### `initConfigurator(canvas)`

Создаёт Three.js сцену. Ключевые переменные:

```js
let meshes = [];           // меши, к которым применяется текстура
let _currentModelObj = null;
let _lastTextureArgs = null; // аргументы последнего applyTexture — повторяются при смене модели
```

### `loadModel(url, applyInitialCam, useConfMeshes, keepCamera)`

| Параметр | По умолчанию | Назначение |
|----------|-------------|-----------|
| `url` | — | URL GLB-файла |
| `applyInitialCam` | `false` | Применить сохранённую камеру из `data-cam-*` |
| `useConfMeshes` | `true` | Фильтровать меши по `data-conf-meshes` |
| `keepCamera` | `false` | Сохранить угол обзора при смене формы |

**`keepCamera` логика** (только для куба/сферы):
- Сохраняет нормализованный вектор направления камеры
- После `centerAndFit` вычисляет расстояние через bounding sphere: `radius / sin(fov/2) * 1.1`
- Восстанавливает угол, дистанция подбирается автоматически под новую форму
- **Не применяется** при возврате на основную модель (`applyInitialCam=true`)

После загрузки диспатчится `canvas.dispatchEvent(new CustomEvent('model:loaded'))`.

### `centerAndFit(object)`

Масштабирует объект до `2 / max(x,y,z)`, центрирует в origin, ставит камеру по оси Z.
Расстояние: `(size.y / 2) / tan(fov/2) * 1.5`.

### `canvas.applyTexture(...)`

```js
canvas.applyTexture(
  url,                  // URL текстуры цвета
  roughness,            // финиш (matte=0.9, satin=0.4, gloss/chrome=0.05)
  metalness,            // металличность (chrome=1.0, остальные ≈ 0)
  useModelUv,           // true = UV из модели, false = RepeatWrapping
  repeatX, repeatY,     // тайлинг текстуры цвета
  rotation,             // поворот текстуры (градусы)
  reflectionMaskUrl,    // URL roughnessMap (маска отражений)
  reflectionStrength,   // множитель envMapIntensity
  roughnessMapDepth,    // "прозрачность" roughnessMap (0–1)
  rmRepeatX, rmRepeatY, rmRotation,  // UV для roughnessMap
  bumpMapUrl,           // URL bumpMap
  bumpScale,            // интенсивность bump
  bmRepeatX, bmRepeatY, bmRotation   // UV для bumpMap
)
```

**Логика roughness:**
```js
// roughnessMapDepth < 1.0 → переопределяет roughness даже без маски
mesh.material.roughness = (roughnessMapDepth < 1.0 || reflectionMaskUrl)
  ? roughnessMapDepth
  : roughness;
```

**Важно:** `roughnessMap` использует GREEN канал текстуры и **умножается** на `material.roughness`. При gloss/chrome (roughness=0.05) диапазон будет 0–0.05 — визуально незаметно. Поэтому при наличии маски roughness устанавливается в `roughnessMapDepth` (по умолчанию 1.0), давая полный диапазон 0–1.

### Debug-оверлей (`data-cam-debug="1"`)

Показывает позицию камеры и target в реальном времени. Кнопка "Copy cam" копирует 6 чисел в буфер. Кнопки визуализации текстур (`▶ color map`, `▶ show roughnessMap`, `▶ show bumpMap`) помогают проверить UV-маппинг.

---

## Shape Switcher

HTML генерируется в `single-models.php` только если заданы `$cube_url` или `$sphere_url`:

```html
<div class="mn-shape-switcher" style="position:absolute;bottom:12px;right:12px;...">
  <button class="mn-shape-btn mn-shape-btn--active" data-shape="model" ...><!-- SVG --></button>
  <button class="mn-shape-btn" data-shape="cube" data-url="..."><!-- SVG --></button>
  <button class="mn-shape-btn" data-shape="sphere" data-url="..."><!-- SVG --></button>
</div>
```

URL куба и сферы берутся из глобальных настроек (`models-new-settings.php`): `conf_cube_url`, `conf_sphere_url`.

**При клике:**
- `model` → `loadModel(modelUrl, true, true, false)` — камера из `data-cam-*`
- `cube`/`sphere` → `loadModel(url, false, false, true)` — `useConfMeshes=false` (меши куба/сферы имеют другие имена), `keepCamera=true`

**Почему `useConfMeshes=false`:** `data-conf-meshes` содержит имена мешей основной модели. У куба/сферы имена другие → все меши были бы отфильтрованы → текстура не применялась бы.

---

## `hoger_get_surfaces_json()` — PHP → JS

Функция в `functions.php`. Возвращает JSON всех CPT `surfaces` (опубликованных).

Данные передаются в шаблоне через `<script>window.hogerSurfaces = [...];</script>` в `single-models.php`.

### Поля каждой поверхности в JSON

```json
{
  "title": "...",
  "main_photo": "url-thumbnail",
  "colors": [{ "name": "...", "photo": "url-full", "thumb": "url-thumbnail" }],
  "roughness": 0.9,
  "metalness": 0.0,
  "useModelUv": true,
  "repeatX": 1, "repeatY": 1, "rotation": 0,
  "reflectionMask": "url",
  "reflectionStrength": 1.0,
  "roughnessMapDepth": 1.0,
  "reflectionMaskRepeatX": 1, "reflectionMaskRepeatY": 1, "reflectionMaskRotation": 0,
  "bumpMap": "url",
  "bumpScale": 1.0,
  "bumpMapRepeatX": 1, "bumpMapRepeatY": 1, "bumpMapRotation": 0
}
```

### finish → roughness/metalness mapping

| finish | roughness | metalness |
|--------|-----------|-----------|
| `matte` | 0.9 | 0.0 |
| `satin` | 0.4 | 0.05 |
| `gloss` | 0.05 | 0.05 |
| `chrome` | 0.05 | 1.0 |

---

## Meta-поля CPT `surfaces`

| Meta key | Тип | Описание |
|----------|-----|---------|
| `osnovnoe_foto` | int (attachment ID) | Главное фото поверхности |
| `finish` | string | `matte`/`satin`/`gloss`/`chrome` |
| `use_model_uv` | `"1"`/`"0"` | Использовать UV модели |
| `repeat_x`, `repeat_y` | float | Тайлинг цветовой текстуры |
| `rotation` | float | Поворот цветовой текстуры (градусы) |
| `czveta` | int | Кол-во цветов |
| `czveta_{i}_nazvanie_czveta` | string | Название цвета |
| `czveta_{i}_foto_czveta` | int | Attachment ID текстуры цвета |
| `reflection_mask_id` | int | Attachment ID roughnessMap |
| `reflection_strength` | float | Интенсивность отражений (0–2) |
| `roughness_map_depth` | float | Прозрачность маски roughness (0–1) |
| `reflection_mask_repeat_x/y` | float | UV маски отражений |
| `reflection_mask_rotation` | float | Поворот маски отражений |
| `bump_map_id` | int | Attachment ID bumpMap |
| `bump_scale` | float | Интенсивность bump (0–5) |
| `bump_map_repeat_x/y` | float | UV bump-карты |
| `bump_map_rotation` | float | Поворот bump-карты |

---

## Meta-поля CPT `models` (вьюпорт)

Сохраняются в метабоксе "3D Viewer Settings" (`hoger_models_viewer_settings_cb`):

| Meta key | Описание |
|----------|---------|
| `mn_model_url` | URL GLB основной модели |
| `mn_env_hdr` | URL HDR окружения |
| `mn_env_jpg` | URL JPG окружения |
| `mn_exposure` | Экспозиция (float) |
| `mn_saturation` | Насыщенность CSS (float) |
| `mn_env_intensity` | envMapIntensity (float) |
| `mn_env_rotate` | Вращение окружения (`1`/`0`) |
| `mn_env_rotate_speed` | Скорость вращения |
| `mn_cam_x/y/z` | Сохранённая позиция камеры |
| `mn_cam_target_x/y/z` | Сохранённый target |
| `mn_cam_debug` | Debug-оверлей (`1`/`0`) |
| `mn_conf_meshes` | JSON array имён мешей для текстуры |
| `mn_default_surface_idx` | Индекс дефолтной поверхности (-1 = нет) |
| `mn_default_color_idx` | Индекс дефолтного цвета |

---

## Глобальные настройки (models-new-settings.php)

Страница: `wp-admin/edit.php?post_type=models&page=models-new-viewer-settings`

| Option key | Описание |
|------------|---------|
| `conf_cube_url` | URL GLB куба для shape switcher |
| `conf_sphere_url` | URL GLB сферы для shape switcher |
| + другие глобальные дефолты вьюпорта | |

---

## Дефолтная поверхность/цвет

В метабоксе модели выбирается дефолтная поверхность и цвет. Значения попадают в `data-default-surface` и `data-default-color` на canvas.

В `initSurfacePicker` после события `model:loaded` (один раз, `{once:true}`):
```js
canvas.addEventListener('model:loaded', () => {
  activeType = defaultSurfaceIdx;
  activeColor = defaultColorIdx;
  canvas.applyTexture(...);
}, { once: true });
```

---

## Разрешённые MIME-типы для загрузки

`hoger_allow_3d_mimes` + `hoger_allow_3d_filetype`:
- `.glb` → `model/gltf-binary`
- `.gltf` → `model/gltf+json`
- `.hdr` → `image/vnd.radiance`

---

## Известные gotchas

1. **Regex в PHP double-quoted строках:** `/\r?\n/` нужно писать как `/\\r?\\n/` — иначе PHP превращает `\r\n` в CR/LF и JS получает невалидный regex.

2. **roughnessMap × roughness:** Three.js умножает roughnessMap на `material.roughness`. При gloss (0.05) эффект маски почти незаметен. Решение: при наличии маски устанавливать `roughness = roughnessMapDepth`.

3. **useConfMeshes для куба/сферы:** имена мешей в GLB куба/сферы не совпадают с `data-conf-meshes` основной модели → передавать `useConfMeshes=false`.

4. **Кеш браузера:** WordPress использует версию темы как cache buster. При разработке делать hard refresh (Ctrl+Shift+R).

5. **keepCamera и расстояние:** `centerAndFit` рассчитывает дистанцию по оси Y для фронтального вида. При повороте камеры куб (у которого диагональ больше стороны) вылезает за края. Решение: bounding sphere → `radius / sin(fov/2) * 1.1`.
