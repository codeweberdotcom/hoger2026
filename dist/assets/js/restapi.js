document.addEventListener("DOMContentLoaded", () => {
  const ENABLE_CACHE = false;
  const modalButtons = document.querySelectorAll('a[data-bs-toggle="modal"]');
  const downloadButtons = document.querySelectorAll('a[data-bs-toggle="download"]');
  // Динамически создаётся по требованию через createModal(), уничтожается после hidden.bs.modal
  let modalElement = null;
  let modalContent = null;
  let modalDialog = null;
  
  // Функция для получения базового URL плагина
  function getPluginBaseUrl() {
    // Пытаемся найти уже загруженный скрипт FilePond и получить его базовый URL
    const existingFilePondScript = document.querySelector('script[src*="filepond.min.js"]');
    if (existingFilePondScript) {
      const src = existingFilePondScript.getAttribute('src');
      return src.replace('/assets/filepond/filepond.min.js', '');
    }
    // Если скрипт не найден, используем относительный путь от корня сайта
    return window.location.origin + '/wp-content/plugins/codeweber-gutenberg-blocks';
  }
  
  // Флаг для предотвращения множественных загрузок скрипта
  let filepondInitScriptLoading = false;
  let filepondInitScriptLoaded = false;
  
  // Функция для динамической загрузки filepond-init.js
  function loadFilePondInitScript() {
    // Проверяем, не загружен ли уже скрипт
    if (filepondInitScriptLoaded || document.querySelector('script[src*="filepond-init.js"]')) {
      filepondInitScriptLoaded = true;
      // Скрипт уже загружен, просто ждем его выполнения
      setTimeout(function() {
        if (typeof window.initFilePond === 'function') {
          // Проверяем, есть ли неинициализированные поля
          const uninitializedInputs = modalContent ? modalContent.querySelectorAll('input[type="file"][data-filepond="true"]:not([data-filepond-initialized])') : [];
          if (uninitializedInputs.length > 0) {
            window.initFilePond();
          }
        }
      }, 50); // Уменьшена задержка с 200ms до 50ms
      return;
    }
    
    // Проверяем, не загружается ли скрипт в данный момент
    if (filepondInitScriptLoading) {
      return;
    }
    
    // Устанавливаем флаг загрузки
    filepondInitScriptLoading = true;
    
    // Убеждаемся, что filepondSettings доступен (создаем, если не определен)
    // Проверяем, не определен ли он глобально (может быть локализован через wp_localize_script)
    if (typeof window.filepondSettings === 'undefined' && typeof filepondSettings === 'undefined') {
      // Создаем filepondSettings вручную, если он не был локализован
      window.filepondSettings = {
        uploadUrl: wpApiSettings.root + 'codeweber-forms/v1/upload',
        nonce: wpApiSettings.nonce,
        translations: {
          labelIdle: 'Drag & drop your files or <span class="filepond--label-action">browse</span>',
          maxFiles: 'Maximum number of files: %s. Please remove excess files.',
          fileTooLarge: 'File is too large. Maximum size: %s',
          totalSizeTooLarge: 'Total file size is too large. Maximum: %s',
          errorUploading: 'Error uploading file',
          errorAddingFile: 'Error adding file',
          filesRemoved: 'Maximum number of files: %s. Files removed: %s',
          totalSizeExceeded: 'Total file size exceeded. Maximum: %s',
          uploadComplete: 'Upload complete',
          tapToUndo: 'Tap to undo',
          uploading: 'Uploading',
          tapToCancel: 'tap to cancel'
        }
      };
    } else if (typeof filepondSettings !== 'undefined' && typeof window.filepondSettings === 'undefined') {
      // Если filepondSettings определен локально, но не глобально, делаем его глобальным
      window.filepondSettings = filepondSettings;
    }
    
    // Загружаем переводы перед загрузкой скрипта, если они еще не загружены
    const loadTranslationsPromise = new Promise(function(resolve) {
      // Проверяем, есть ли уже переводы (не английские по умолчанию)
      if (window.filepondSettings && window.filepondSettings.translations && 
          window.filepondSettings.translations.uploadComplete !== 'Upload complete') {
        // Переводы уже загружены (не английские по умолчанию)
        resolve();
      } else {
        // Загружаем переводы через REST API
        fetch(wpApiSettings.root + 'codeweber-forms/v1/filepond-translations', {
          credentials: 'include'
        })
          .then(function(response) {
            return response.json();
          })
          .then(function(translations) {
            if (translations && typeof translations === 'object') {
              if (!window.filepondSettings) {
                window.filepondSettings = {
                  uploadUrl: wpApiSettings.root + 'codeweber-forms/v1/upload',
                  nonce: wpApiSettings.nonce,
                  translations: {}
                };
              }
              window.filepondSettings.translations = translations;
            }
            resolve();
          })
          .catch(function(error) {
            console.warn('[REST API] Failed to load FilePond translations:', error);
            resolve(); // Продолжаем даже если переводы не загрузились
          });
      }
    });
    
    // Загружаем скрипт динамически после загрузки переводов
    loadTranslationsPromise.then(function() {
      const script = document.createElement('script');
      const pluginBaseUrl = getPluginBaseUrl();
      script.src = pluginBaseUrl + '/includes/js/filepond-init.js';
      script.onload = function() {
        filepondInitScriptLoading = false;
        filepondInitScriptLoaded = true;
        setTimeout(function() {
          if (typeof window.initFilePond === 'function') {
            // Проверяем, есть ли неинициализированные поля
            const uninitializedInputs = modalContent ? modalContent.querySelectorAll('input[type="file"][data-filepond="true"]:not([data-filepond-initialized])') : [];
            if (uninitializedInputs.length > 0) {
              window.initFilePond();
            }
          }
        }, 50); // Уменьшена задержка с 100ms до 50ms
      };
      script.onerror = function() {
        filepondInitScriptLoading = false;
        console.error('[REST API DEBUG] Failed to load filepond-init.js from', script.src);
      };
      document.head.appendChild(script);
    });
  }
  
  // Функция для динамической загрузки всех FilePond скриптов
  function loadFilePondScripts() {
    // Проверяем, загружена ли библиотека FilePond
    if (typeof FilePond === 'undefined') {
      const pluginBaseUrl = getPluginBaseUrl();
      
      // Загружаем FilePond CSS
      if (!document.querySelector('link[href*="filepond.min.css"]')) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = pluginBaseUrl + '/assets/filepond/filepond.min.css';
        document.head.appendChild(css);
      }
      
      // Загружаем FilePond JS
      if (!document.querySelector('script[src*="filepond.min.js"]')) {
        const filepondScript = document.createElement('script');
        filepondScript.src = pluginBaseUrl + '/assets/filepond/filepond.min.js';
        filepondScript.onload = function() {
          loadFilePondInitScript();
        };
        filepondScript.onerror = function() {
          console.error('[REST API DEBUG] Failed to load filepond.min.js from', filepondScript.src);
        };
        document.head.appendChild(filepondScript);
      } else {
        loadFilePondInitScript();
      }
    } else {
      loadFilePondInitScript();
    }
  }
  
  // Функция для ожидания и вызова initFilePond или прямой инициализации
  function waitAndInitFilePond(attempts = 0) {
    const maxAttempts = 2; // Максимум 0.2 секунды (2 * 100ms) - минимальная задержка для проверки
    const fileInputsBeforeInit = modalContent ? modalContent.querySelectorAll('input[type="file"][data-filepond="true"]') : [];
    
    // Если нет файловых полей, не инициализируем
    if (fileInputsBeforeInit.length === 0) {
      return;
    }
    
    if (typeof window.initFilePond === 'function') {
      // Функция доступна, вызываем сразу
      const uninitializedInputs = modalContent ? modalContent.querySelectorAll('input[type="file"][data-filepond="true"]:not([data-filepond-initialized])') : [];
      // Вызываем initFilePond только если есть неинициализированные поля
      if (uninitializedInputs.length > 0) {
        window.initFilePond();
      }
    } else if (attempts < maxAttempts) {
      setTimeout(function() {
        waitAndInitFilePond(attempts + 1);
      }, 100);
    } else {
      
      // Загружаем скрипты сразу, без дополнительных проверок
      if (typeof FilePond !== 'undefined') {
        const fileInputs = modalContent ? modalContent.querySelectorAll('input[type="file"][data-filepond="true"]:not([data-filepond-initialized])') : [];
        if (fileInputs.length > 0) {
          loadFilePondInitScript();
        }
      } else {
        // FilePond библиотека не загружена - загружаем скрипты сразу
        loadFilePondScripts();
      }
    }
  }
  
  let modalInstance = null;
  
  // ============================================
  // Обработчик для data-bs-toggle="download"
  // ============================================
  if (downloadButtons.length > 0 && typeof wpApiSettings !== 'undefined') {
    downloadButtons.forEach((button) => {
      button.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const dataValue = button.getAttribute("data-value");
        if (!dataValue) {
          console.error('Download: data-value not found');
          return;
        }
        
        // Извлекаем ID из data-value (формат: doc-{id}, staff-{id}, vac-{id} или просто {id})
        let postId = dataValue;
        let apiEndpoint = 'documents';
        
        if (dataValue.startsWith('doc-')) {
          postId = dataValue.replace('doc-', '');
          apiEndpoint = 'documents';
        } else if (dataValue.startsWith('staff-')) {
          postId = dataValue.replace('staff-', '');
          apiEndpoint = 'staff';
        } else if (dataValue.startsWith('vac-')) {
          postId = dataValue.replace('vac-', '');
          apiEndpoint = 'vacancies';
        }
        
        postId = parseInt(postId);
        
        if (!postId || isNaN(postId)) {
          console.error('Download: Invalid ID');
          return;
        }
        
        // Сохраняем оригинальное содержимое
        const originalHTML = button.innerHTML;
        const originalDisabled = button.disabled;
        const originalMinHeight = button.style.minHeight || '';
        const currentHeight = button.offsetHeight;
        
        // Устанавливаем минимальную высоту для предотвращения изменения размера кнопки
        if (currentHeight > 0) {
          button.style.minHeight = currentHeight + 'px';
        }
        
        button.disabled = true;
        
        // Показываем аккуратный спиннер (того же размера что и текст)
        const icon = button.querySelector('i');
        const span = button.querySelector('span');
        const loadingText = button.dataset.loadingText || (typeof codeweberDownload !== 'undefined' ? codeweberDownload.loadingText : 'Loading...');
        
        if (icon) {
          // Сохраняем размер иконки (fs-13 или другой), заменяем только иконку на спиннер
          const iconSize = icon.className.match(/fs-\d+/);
          const iconSizeClass = iconSize ? iconSize[0] : 'fs-13';
          
          // Заменяем иконку на спиннер с сохранением размера и добавляем отступ справа
          icon.className = 'uil uil-spinner-alt uil-spin ' + iconSizeClass;
          if (!icon.classList.contains('me-1')) {
            icon.classList.add('me-1');
          }
          
          // Удаляем span обертку, если есть
          if (span) {
            span.remove();
          }
          
          // Добавляем текст загрузки напрямую в кнопку после иконки
          // Удаляем все текстовые узлы после иконки
          let node = icon.nextSibling;
          while (node) {
            const next = node.nextSibling;
            if (node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SPAN')) {
              node.remove();
            }
            node = next;
          }
          
          // Добавляем новый текстовый узел с текстом загрузки
          button.appendChild(document.createTextNode(loadingText));
        } else {
          // Если структуры нет, создаем с правильным размером без span
          button.innerHTML = '<i class="uil uil-spinner-alt uil-spin fs-13 me-1"></i>' + loadingText;
        }
        
        // Получаем URL файла через REST API
        const endpoint = apiEndpoint === 'staff' ? 'vcf-url' : 'download-url';
        fetch(wpApiSettings.root + 'codeweber/v1/' + apiEndpoint + '/' + postId + '/' + endpoint, {
          method: 'GET',
          headers: {
            'X-WP-Nonce': wpApiSettings.nonce,
            'Content-Type': 'application/json'
          }
        })
        .then(function(response) {
          if (!response.ok) {
            throw new Error('Failed to get file URL: ' + response.status);
          }
          return response.json();
        })
        .then(function(data) {
          if (data.success && data.file_url) {
            // Программно инициируем загрузку
            const link = document.createElement('a');
            link.href = data.file_url;
            link.download = data.file_name || 'download';
            link.target = '_blank';
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            
            setTimeout(function() {
              document.body.removeChild(link);
            }, 100);
            
            // Восстанавливаем кнопку
            button.disabled = originalDisabled;
            button.innerHTML = originalHTML;
            // Восстанавливаем оригинальный minHeight или очищаем
            if (originalMinHeight) {
              button.style.minHeight = originalMinHeight;
            } else {
              button.style.minHeight = '';
            }
            
            // Аналитика — Google Analytics
            if (typeof gtag !== 'undefined') {
              gtag('event', 'file_download', {
                'file_name': data.file_name,
                'post_id': data.post_id
              });
            }

            // Аналитика — Matomo
            if (typeof _paq !== 'undefined') {
              const matomoCategory = apiEndpoint === 'staff'     ? 'Staff VCF Download'
                                   : apiEndpoint === 'vacancies' ? 'Vacancy PDF Download'
                                   :                               'Document Download';
              _paq.push(['trackEvent', matomoCategory, 'Download', data.file_name || String(data.post_id)]);
            }
          } else {
            throw new Error('Invalid response from server');
          }
        })
        .catch(function(error) {
          console.error('Download error:', error);
          
          // Восстанавливаем кнопку
          button.disabled = originalDisabled;
          button.innerHTML = originalHTML;
          // Восстанавливаем оригинальный minHeight или очищаем
          if (originalMinHeight) {
            button.style.minHeight = originalMinHeight;
          } else {
            button.style.minHeight = '';
          }
          
          alert(typeof codeweberDownload !== 'undefined' ? codeweberDownload.errorText : 'Ошибка при загрузке файла. Попробуйте еще раз.');
        });
      });
    });
  }

  /**
   * Создаёт #modal в DOM, инициализирует Bootstrap Modal, навешивает события.
   * Идемпотентен: при повторном вызове возвращает существующий экземпляр.
   * После hidden.bs.modal — уничтожает элемент и обнуляет переменные.
   */
  function createModal() {
    if (modalInstance) return modalInstance;
    if (typeof bootstrap === 'undefined' || !bootstrap.Modal) return null;

    const config = document.getElementById('cw-modal-config');
    const cardRadiusClass = config ? (config.dataset.cardRadius || '') : '';
    const closeLabel = config ? (config.dataset.closeLabel || 'Close') : 'Close';

    // Переиспользуем статичный #modal из DOM (modal-container.php), иначе создаём новый
    let el = document.getElementById('modal');
    if (!el) {
      el = document.createElement('div');
      el.className = 'modal fade';
      el.id = 'modal';
      el.tabIndex = -1;
      el.setAttribute('aria-labelledby', 'modalLabel');
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML =
        '<div class="modal-dialog modal-dialog-centered">' +
          '<div class="modal-content' + (cardRadiusClass ? ' ' + cardRadiusClass : '') + '">' +
            '<div class="modal-body">' +
              '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="' + closeLabel + '"></button>' +
              '<div id="modal-content"></div>' +
            '</div>' +
          '</div>' +
        '</div>';
      document.body.appendChild(el);
    }

    modalElement = el;
    modalContent = el.querySelector('#modal-content');
    modalDialog  = el.querySelector('.modal-dialog');
    modalInstance = new bootstrap.Modal(el);

    // Навешиваем слушатели только один раз на элемент (при переиспользовании не дублируем)
    if (!el.dataset.cwModalListeners) {
      el.dataset.cwModalListeners = '1';

      // shown.bs.modal — переинициализация CF7 и компонентов после показа
      el.addEventListener('shown.bs.modal', function () {
        const formElement = modalContent.querySelector('form.wpcf7-form');
        if (formElement && typeof wpcf7 !== 'undefined') {
          wpcf7.init(formElement);
        }
        initTestimonialRatingStars();
        initDocumentEmailForm();
      });

      // hidden.bs.modal — восстанавливаем скелетон, instance переиспользуется (не dispose)
      el.addEventListener('hidden.bs.modal', () => {
        if (modalContent) {
          modalContent.innerHTML = getModalSkeleton('');
        }
        // Не вызываем dispose() — Bootstrap сам убирает backdrop в штатном цикле hide.
        // Instance, modalElement, modalContent, modalDialog остаются живыми для переиспользования.
      });
    }

    return modalInstance;
  }

  /**
   * Единая функция отображения success-сообщения в модалке.
   * Используется CF7 (cf7-success-message.js) и может быть вызвана из любого места.
   * @param {string} [message] - текст сообщения; пустая строка → используется серверный перевод
   */
  function showModalSuccess(message) {
    if (typeof wpApiSettings === 'undefined') return;
    if (!createModal()) return;

    // Показываем модалку, если ещё не открыта
    if (!modalElement.classList.contains('show')) {
      modalInstance.show();
    }

    // Немедленно показываем skeleton — убираем форму / кнопку с «Отправлено»
    modalContent.innerHTML = getModalSkeleton('');

    // Запрашиваем шаблон успеха
    let url = wpApiSettings.root + 'codeweber/v1/success-message-template?icon_type=svg';
    if (message) url += '&message=' + encodeURIComponent(message);

    fetch(url, { headers: { 'X-WP-Nonce': wpApiSettings.nonce } })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.html) {
          modalContent.innerHTML = data.html;
        }
        setTimeout(() => { if (modalInstance) modalInstance.hide(); }, 3000);
      })
      .catch(() => {
        setTimeout(() => { if (modalInstance) modalInstance.hide(); }, 1000);
      });
  }

  // Публичный API для внешних скриптов (cf7-success-message.js и др.)
  window.codeweberModal = { showSuccess: showModalSuccess };

  /**
   * Apply modal size class to modal-dialog
   * @param {string} sizeClass - Modal size class (modal-sm, modal-lg, etc.)
   */
  const applyModalSize = (sizeClass) => {
    // Remove all existing size classes
    const sizeClasses = [
      'modal-sm', 'modal-lg', 'modal-xl', 
      'modal-fullscreen', 'modal-fullscreen-sm-down', 
      'modal-fullscreen-md-down', 'modal-fullscreen-lg-down',
      'modal-fullscreen-xl-down', 'modal-fullscreen-xxl-down'
    ];
    
    if (!modalDialog) return;
    sizeClasses.forEach(cls => modalDialog.classList.remove(cls));

    // Add new size class if provided
    if (sizeClass && sizeClass.trim() !== '') {
      modalDialog.classList.add(sizeClass);
    }
  };

  /**
   * Returns skeleton HTML based on modal data-value type.
   * Forms (cf7-, cf-, add-testimonial) → form skeleton.
   * Everything else (CPT modals, notifications) → generic content skeleton.
   * @param {string} dataValue
   * @returns {string}
   */
  const getModalSkeleton = (dataValue) => {
    const isForm = dataValue && (
      dataValue.startsWith('cf7-') ||
      dataValue.startsWith('cf-') ||
      dataValue === 'add-testimonial' ||
      dataValue.startsWith('event-reg-')
    );

    if (isForm) {
      return (
        '<div class="p-2">' +
          '<div class="cw-skeleton-block mb-4" style="height:1.4em;width:55%"></div>' +
          '<div class="cw-skeleton-block mb-3" style="height:2.6em;width:100%"></div>' +
          '<div class="cw-skeleton-block mb-3" style="height:2.6em;width:100%"></div>' +
          '<div class="cw-skeleton-block mb-4" style="height:5em;width:100%"></div>' +
          '<div class="cw-skeleton-block" style="height:2.8em;width:40%"></div>' +
        '</div>'
      );
    }

    // Generic content skeleton — CPT modals, notifications, etc.
    return (
      '<div class="p-2">' +
        '<div class="cw-skeleton-block mb-3" style="height:1.4em;width:65%"></div>' +
        '<div class="cw-skeleton-block mb-2" style="height:.8em;width:100%"></div>' +
        '<div class="cw-skeleton-block mb-2" style="height:.8em;width:92%"></div>' +
        '<div class="cw-skeleton-block mb-2" style="height:.8em;width:85%"></div>' +
        '<div class="cw-skeleton-block mb-4" style="height:.8em;width:68%"></div>' +
        '<div class="cw-skeleton-block mb-2" style="height:.8em;width:100%"></div>' +
        '<div class="cw-skeleton-block mb-2" style="height:.8em;width:88%"></div>' +
        '<div class="cw-skeleton-block" style="height:.8em;width:55%"></div>' +
      '</div>'
    );
  };

  /**
   * Initialize testimonial rating stars
   */
  function initTestimonialRatingStars() {
    // Use event delegation on modal-content to handle dynamically loaded content
    const modalContent = document.getElementById('modal-content');
    if (!modalContent) {
      return;
    }

    // Remove old event listeners by using a flag
    const ratingContainers = modalContent.querySelectorAll('.rating-stars-wrapper:not([data-initialized])');
    if (ratingContainers.length === 0) return;
    
    ratingContainers.forEach(function(container, index) {
      // Mark as initialized
      container.setAttribute('data-initialized', 'true');
      
      const stars = container.querySelectorAll('.rating-star-item');
      
      const inputId = container.dataset.ratingInput;
      
      let selectedRating = 0;
      
      // Get initial rating from input
      const input = document.getElementById(inputId);
      if (input) {
        if (input.value) {
          selectedRating = parseInt(input.value) || 0;
          updateStarsVisual(stars, selectedRating);
        }
      }
      
      // Click handler - use event delegation
      container.addEventListener('click', function(e) {
        const star = e.target.closest('.rating-star-item');
        if (!star) {
          return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        const rating = parseInt(star.dataset.rating);
        selectedRating = rating;
        if (input) {
          input.value = rating;
        }
        updateStarsVisual(stars, rating);
      });
      
      // Hover handlers - highlight all stars from first to current
      stars.forEach(function(star, starIndex) {
        star.addEventListener('mouseenter', function() {
          const hoverRating = parseInt(this.dataset.rating);
          // Highlight all stars from 1 to hoverRating (left to right)
          stars.forEach(function(s) {
            const sRating = parseInt(s.dataset.rating);
            if (sRating <= hoverRating) {
              s.style.color = '#fcc032';
            } else {
              s.style.color = 'rgba(0, 0, 0, 0.1)';
            }
          });
        });
      });
      
      // Reset on mouse leave
      container.addEventListener('mouseleave', function() {
        updateStarsVisual(stars, selectedRating);
      });
    });
  }
  
  /**
   * Update stars visual state
   */
  function updateStarsVisual(stars, rating, isHover) {
    stars.forEach(function(star, index) {
      const starRating = parseInt(star.dataset.rating);
      if (starRating <= rating) {
        star.classList.add('active');
        if (!isHover) {
          star.style.color = '#fcc032';
        }
      } else {
        if (!isHover) {
          star.classList.remove('active');
          star.style.color = 'rgba(0, 0, 0, 0.1)';
        }
      }
    });
  }

  // ✅ Предзагрузка формы в кэш при появлении кнопки в viewport
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const button = entry.target;
          const dataValue = button
            .getAttribute("data-value")
            ?.replace("modal-", "");
          if (!dataValue) return;

          const cachedContent = localStorage.getItem(dataValue);
          const cachedTime = localStorage.getItem(`${dataValue}_time`);

          if (
            ENABLE_CACHE &&
            cachedContent &&
            cachedTime &&
            Date.now() - cachedTime < 60000
          ) {
            // Уже в кеше — пропускаем
            obs.unobserve(button);
            return;
          }

          // Подгружаем в кэш
          fetch(`${wpApiSettings.root}wp/v2/modal/${dataValue}`)
            .then((response) => {
              if (!response.ok) {
                console.error(`Ошибка при загрузке данных: ${response.status} ${response.statusText}`);
                return response.json().then(err => {
                  throw new Error(err.message || `Ошибка при загрузке данных: ${response.status}`);
                }).catch(() => {
                  throw new Error(`Ошибка при загрузке данных: ${response.status}`);
                });
              }
              return response.json();
            })
            .then((data) => {
              if (data && data.content && data.content.rendered) {
                localStorage.setItem(dataValue, data.content.rendered);
                localStorage.setItem(
                  `${dataValue}_time`,
                  Date.now().toString()
                );
                // Cache modal size as well
                const modalSize = data.modal_size || '';
                localStorage.setItem(`${dataValue}_size`, modalSize);
              }
            })
            .catch((err) => {
              console.error("Ошибка предзагрузки:", err);
            });

          // Убираем наблюдение за этой кнопкой после загрузки
          obs.unobserve(button);
        }
      });
    });

    modalButtons.forEach((button) => {
      observer.observe(button);
    });
  }

  // ✅ Стандартный обработчик клика по кнопке
  modalButtons.forEach((button) => {
    // Убираем data-bs-toggle чтобы Bootstrap's delegated handler не перехватывал эти клики
    button.removeAttribute('data-bs-toggle');
    button.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent default link behavior
      const dataValue = button
        .getAttribute("data-value")
        ?.replace("modal-", "");
      if (!dataValue) {
        return;
      }
      const cachedContent = localStorage.getItem(dataValue);
      const cachedTime = localStorage.getItem(`${dataValue}_time`);
      const cachedSize = localStorage.getItem(`${dataValue}_size`);

      // Создаём DOM модалки (идемпотентно — если уже существует, ничего не делает)
      if (!createModal()) return;

      // Check if cookie modal is open (highest priority)
      const cookieModal = document.getElementById('cookieModal');
      if (cookieModal && cookieModal.classList.contains('show')) {
        // Wait for cookie modal to close, then show REST API modal
        const checkCookieModal = setInterval(function() {
          if (!cookieModal.classList.contains('show')) {
            clearInterval(checkCookieModal);
            // Close notification modal if it's open
            const notificationModal = document.getElementById('notification-modal');
            if (notificationModal && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
              const notificationBsModal = bootstrap.Modal.getInstance(notificationModal);
              if (notificationBsModal && notificationModal.classList.contains('show')) {
                notificationBsModal.hide();
              }
            }
            // Apply cached modal size if available
            if (cachedSize) {
              applyModalSize(cachedSize);
            }
            // Показываем скелетон перед открытием (тип зависит от data-value)
            modalContent.innerHTML = getModalSkeleton(dataValue);
            // Open modal
            modalInstance.show();
          }
        }, 100);
        return; // Exit early, will show modal after cookie modal closes
      }
      
      // Close notification modal if it's open (to prevent conflicts)
      const notificationModal = document.getElementById('notification-modal');
      if (notificationModal && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const notificationBsModal = bootstrap.Modal.getInstance(notificationModal);
        if (notificationBsModal && notificationModal.classList.contains('show')) {
          notificationBsModal.hide();
        }
      }
      
      // Apply cached modal size if available
      if (cachedSize) {
        applyModalSize(cachedSize);
      }

      // Показываем скелетон перед открытием (тип зависит от data-value)
      modalContent.innerHTML = getModalSkeleton(dataValue);

      // Open modal immediately
      modalInstance.show();
      
      // Check cache first
      if (
        ENABLE_CACHE &&
        cachedContent &&
        cachedTime &&
        Date.now() - cachedTime < 60000
      ) {
        // Use cached content
        modalContent.innerHTML = cachedContent;
        
        // КРИТИЧНО: Добавляем временный обработчик submit с preventDefault() СРАЗУ для кэшированного контента
        const cachedCodeweberForms = modalContent.querySelectorAll('.codeweber-form');
        cachedCodeweberForms.forEach(function(form) {
          // Добавляем временный обработчик, который будет удален после инициализации
          const tempSubmitHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
          };
          form.addEventListener('submit', tempSubmitHandler, true); // Используем capture phase
          // Сохраняем ссылку на обработчик для последующего удаления
          form._tempSubmitHandler = tempSubmitHandler;
          // Удаляем обработчик после инициализации (через небольшую задержку)
          setTimeout(function() {
            if (form._tempSubmitHandler) {
              form.removeEventListener('submit', form._tempSubmitHandler, true);
              delete form._tempSubmitHandler;
            }
          }, 1000); // Удаляем через 1 секунду (достаточно для инициализации)
        });
        
        // Initialize rating stars if present (with small delay to ensure DOM is ready)
        setTimeout(function() {
          initTestimonialRatingStars();
        }, 50);
        
        // Инициализируем Contact Form 7 формы
        const formElement = modalContent.querySelector("form.wpcf7-form");
        if (formElement && typeof wpcf7 !== "undefined") {
          wpcf7.init(formElement);
          custom.addTelMask();
          custom.rippleEffect();
          // formValidation инициализируется автоматически через form-validation.js
          if (typeof initFormValidation === 'function') {
            initFormValidation();
          }
        }
        
        // Инициализируем Codeweber формы СРАЗУ для кэшированного контента
        // Формы будут инициализированы через shown.bs.modal и MutationObserver в form-submit-universal.js
        if (cachedCodeweberForms.length > 0) {
        }
        
        // Инициализируем FilePond для кэшированного контента
        
        // Используем ту же функцию waitAndInitFilePond для кэшированного контента
        waitAndInitFilePond();
      } else {
        // Load content via API
        // Add user_id as query parameter if user is logged in
        let apiUrl = `${wpApiSettings.root}wp/v2/modal/${dataValue}`;
        if (wpApiSettings.isLoggedIn && wpApiSettings.currentUserId) {
          apiUrl += `?user_id=${wpApiSettings.currentUserId}`;
        }
        
        fetch(apiUrl, {
          credentials: 'include' // Include cookies for authentication
        })
          .then((response) => {
            if (!response.ok)
              throw new Error("Ошибка при загрузке данных с сервера");
            return response.json();
          })
          .then((data) => {
            if (data && data.content && data.content.rendered) {
              // Apply modal size from API
              const modalSize = data.modal_size || '';
              applyModalSize(modalSize);
              
              if (ENABLE_CACHE) {
                localStorage.setItem(dataValue, data.content.rendered);
                localStorage.setItem(
                  `${dataValue}_time`,
                  Date.now().toString()
                );
                localStorage.setItem(`${dataValue}_size`, modalSize);
              }
              
              modalContent.innerHTML = data.content.rendered;
              
              // КРИТИЧНО: Добавляем временный обработчик submit с preventDefault() СРАЗУ после загрузки контента
              // Это предотвратит обычную отправку формы до инициализации AJAX обработчика
              const codeweberForms = modalContent.querySelectorAll('.codeweber-form');
              codeweberForms.forEach(function(form) {
                // Добавляем временный обработчик, который будет удален после инициализации
                const tempSubmitHandler = function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                  return false;
                };
                form.addEventListener('submit', tempSubmitHandler, true); // Используем capture phase
                // Сохраняем ссылку на обработчик для последующего удаления
                form._tempSubmitHandler = tempSubmitHandler;
                // Удаляем обработчик после инициализации (проверяем каждые 100ms)
                const checkAndRemoveHandler = function(attempts) {
                  if (attempts > 20) {
                    // Максимум 2 секунды, затем удаляем в любом случае
                    if (form._tempSubmitHandler) {
                      form.removeEventListener('submit', form._tempSubmitHandler, true);
                      delete form._tempSubmitHandler;
                    }
                    return;
                  }
                  if (form.dataset.initialized === 'true' && form._codeweberSubmitHandler) {
                    // Форма инициализирована, удаляем временный обработчик
                    if (form._tempSubmitHandler) {
                      form.removeEventListener('submit', form._tempSubmitHandler, true);
                      delete form._tempSubmitHandler;
                    }
                  } else {
                    // Проверяем снова через 100ms
                    setTimeout(function() {
                      checkAndRemoveHandler(attempts + 1);
                    }, 100);
                  }
                };
                checkAndRemoveHandler(0);
              });
              
              
              // Initialize rating stars if present (with small delay to ensure DOM is ready)
              setTimeout(function() {
                initTestimonialRatingStars();
              }, 50);
              
              // Инициализируем обработчик формы отправки документа на email
              initDocumentEmailForm();
              
              // Инициализируем Contact Form 7 формы
              const formElement = modalContent.querySelector("form.wpcf7-form");
              if (formElement && typeof wpcf7 !== "undefined") {
                wpcf7.init(formElement);
                custom.addTelMask();
                custom.rippleEffect();
                // formValidation инициализируется автоматически через form-validation.js
                if (typeof initFormValidation === 'function') {
                  initFormValidation();
                }
              }
              
              // Инициализируем маску телефона для всех форм в модальном окне
              // Это должно применяться к любым input[data-mask] независимо от типа формы
              custom.addTelMask();
              
              // Инициализируем Codeweber формы СРАЗУ после загрузки контента
              // Это критично, чтобы форма не отправлялась через обычный POST
              // MutationObserver в form-submit-universal.js должен сработать автоматически,
              // но для надежности вызываем инициализацию явно
              if (codeweberForms.length > 0) {
                // Используем requestAnimationFrame для гарантии, что DOM готов
                requestAnimationFrame(function() {
                  // Вызываем initForms() явно, если она доступна
                  if (typeof window.initForms === 'function') {
                    window.initForms();
                  } else {
                  }
                  // Проверяем через небольшую задержку, инициализированы ли формы
                  setTimeout(function() {
                    const uninitializedForms = Array.from(codeweberForms).filter(f => !f.dataset.initialized || f.dataset.initialized === 'false');
                    if (uninitializedForms.length > 0) {
                    }
                  }, 200);
                });
              }
              
              // Инициализируем FilePond для форм, загруженных через AJAX
              
              // Начинаем ожидание и инициализацию
              waitAndInitFilePond();
              
            } else {
              modalContent.innerHTML = "Контент не найден.";
            }
          })
          .catch(() => {
            modalContent.innerHTML = "Произошла ошибка при загрузке данных.";
          });
      }
    });
  });

  /**
   * Инициализация обработчика формы отправки документа на email
   */
  function initDocumentEmailForm() {
    const documentEmailForm = modalContent.querySelector("#document-email-form");
    if (!documentEmailForm) {
      return;
    }
    
    // Удаляем старый обработчик, если он есть
    const newForm = documentEmailForm.cloneNode(true);
    documentEmailForm.parentNode.replaceChild(newForm, documentEmailForm);
    
    // Добавляем новый обработчик
    newForm.addEventListener("submit", function(e) {
      e.preventDefault();
      e.stopPropagation();

      if (!newForm.checkValidity()) {
        newForm.classList.add("was-validated");
        const firstInvalid = newForm.querySelector(":invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      newForm.classList.remove("was-validated");

      const formData = new FormData(newForm);
      const submitButton = newForm.querySelector('button[type="submit"]');
      const originalButtonHTML = submitButton ? submitButton.innerHTML : '';
      const originalButtonDisabled = submitButton ? submitButton.disabled : false;
      const originalMinHeight = submitButton ? (submitButton.style.minHeight || '') : '';
      
        if (submitButton) {
          // Сохраняем текущую высоту кнопки для предотвращения изменения размера
          const currentHeight = submitButton.offsetHeight;
          if (currentHeight > 0) {
            submitButton.style.minHeight = currentHeight + 'px';
          }
          
          submitButton.disabled = true;
          const sendingText = typeof codeweberDocumentEmail !== 'undefined' ? codeweberDocumentEmail.sendingText : 'Sending...';
          const loadingText = submitButton.dataset.loadingText || sendingText;
          const icon = submitButton.querySelector('i');
          const span = submitButton.querySelector('span');
          
          if (icon && span) {
            // Сохраняем размер иконки (fs-15 или другой), заменяем только иконку на спиннер
            const iconSize = icon.className.match(/fs-\d+/);
            const iconSizeClass = iconSize ? iconSize[0] : 'fs-15';
            icon.className = 'uil uil-spinner-alt uil-spin ' + iconSizeClass;
            span.textContent = loadingText;
            // Добавляем отступ между спиннером и текстом
            if (!span.classList.contains('ms-1')) {
              span.classList.add('ms-1');
            }
          } else {
            submitButton.innerHTML = '<i class="uil uil-spinner-alt uil-spin fs-15"></i> <span class="ms-1">' + loadingText + '</span>';
          }
        }
      
      // Отправляем AJAX запрос
      const requestData = {
        document_id: parseInt(formData.get('document_id')),
        email: formData.get('email')
      };

      // Collect consent checkboxes
      const consents = {};
      newForm.querySelectorAll('input[type="checkbox"][name^="form_consents_"]').forEach(function(cb) {
        const key = cb.name.replace('form_consents_', '');
        consents[key] = cb.checked ? '1' : '0';
      });
      if (Object.keys(consents).length > 0) {
        requestData.consents = consents;
      }
      
      
      fetch(wpApiSettings.root + 'codeweber/v1/documents/send-email', {
        method: 'POST',
        headers: {
          'X-WP-Nonce': wpApiSettings.nonce,
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Важно для передачи cookies
        body: JSON.stringify(requestData)
      })
      .then(function(response) {
        if (!response.ok) {
          var httpStatus = response.status;
          return response.json().then(function(err) {
            const serverErrorText = typeof codeweberDocumentEmail !== 'undefined' ? codeweberDocumentEmail.serverError : 'Server error';
            var error = new Error(err.message || serverErrorText + ': ' + httpStatus);
            error.httpStatus = httpStatus;
            throw error;
          });
        }
        return response.json();
      })
      .then(function(data) {
        
        if (data.success) {
          // Получаем шаблон успешной отправки через REST API
          const successText = typeof codeweberDocumentEmail !== 'undefined' ? codeweberDocumentEmail.successText : 'Document sent successfully!';
          const message = data.message || successText;
          
          fetch(wpApiSettings.root + 'codeweber/v1/success-message-template?message=' + encodeURIComponent(message) + '&icon_type=svg', {
            method: 'GET',
            headers: {
              'X-WP-Nonce': wpApiSettings.nonce,
              'Content-Type': 'application/json'
            }
          })
          .then(function(response) {
            return response.json();
          })
          .then(function(templateData) {
            if (templateData.success && templateData.html) {
              // modal-body и btn-close уже есть в модальном окне, добавляем только контент
              modalContent.innerHTML = templateData.html;
              
              // Закрываем модальное окно через 2 секунды
              setTimeout(function() {
                if (modalInstance) modalInstance.hide();
              }, 2000);
            } else {
              // Fallback на простой шаблон
              modalContent.innerHTML = '<div class="text-center p-5"><div class="mb-3"><i class="uil uil-check-circle text-success" style="font-size: 3rem;"></i></div><h5>' + message + '</h5></div>';
              setTimeout(function() {
                if (modalInstance) modalInstance.hide();
              }, 2000);
            }
          })
          .catch(function(error) {
            console.error('[Document Email] Error loading success template:', error);
            // Fallback на простой шаблон
            modalContent.innerHTML = '<div class="text-center p-5"><div class="mb-3"><i class="uil uil-check-circle text-success" style="font-size: 3rem;"></i></div><h5>' + message + '</h5></div>';
            setTimeout(function() {
              modalInstance.hide();
            }, 2000);
          });
        } else {
          throw new Error(data.message || 'Failed to send email');
        }
      })
      .catch(function(error) {
        console.error('[Document Email] Error:', error);

        if (submitButton) {
          submitButton.disabled = originalButtonDisabled;
          submitButton.innerHTML = originalButtonHTML;
          if (originalMinHeight) {
            submitButton.style.minHeight = originalMinHeight;
          } else {
            submitButton.style.minHeight = '';
          }
        }

        var messagesDiv = newForm.querySelector('.document-email-form-messages');
        if (messagesDiv) {
          var isRateLimit = error.httpStatus === 429;
          var rateLimitText = typeof codeweberDocumentEmail !== 'undefined' && codeweberDocumentEmail.rateLimitText
            ? codeweberDocumentEmail.rateLimitText
            : 'File already sent. Check your Spam folder or use a different email address.';
          messagesDiv.textContent = isRateLimit ? rateLimitText : (error.message || '');
          messagesDiv.style.display = 'block';
          setTimeout(function() { messagesDiv.style.display = 'none'; }, 7000);
        }
      });
    });
  }

  // shown.bs.modal обработчик теперь регистрируется в createModal()
});
