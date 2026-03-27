/**
 * Обработка Contact Form 7
 * 
 * 1. Блокировка кнопки отправки на основе класса optional у .wpcf7-acceptance
 *    - Если у .wpcf7-acceptance есть класс optional - кнопка не блокируется
 *    - Во всех остальных случаях кнопка блокируется, если чекбокс не отмечен
 * 2. Изменение текста кнопки при отправке формы
 * 3. Закрытие модального окна при успешной отправке
 */

(function() {
  'use strict';

  /**
   * Блокировка кнопки отправки на основе класса optional у .wpcf7-acceptance
   */
  function initAcceptanceRequiredCheck(form) {
    // Пропускаем формы с acceptance-as-validation (они используют другую логику)
    if (form.classList.contains('wpcf7-acceptance-as-validation')) {
      return;
    }

    const acceptanceWrappers = form.querySelectorAll('.wpcf7-acceptance');
    if (acceptanceWrappers.length === 0) {
      return;
    }

    const submitButtons = form.querySelectorAll('.wpcf7-submit');

    // Функция проверки всех обязательных чекбоксов
    function checkAcceptanceRequired() {
      let allRequiredChecked = true;

      acceptanceWrappers.forEach(function(wrapper) {
        // Если у .wpcf7-acceptance есть класс optional - пропускаем (не блокируем)
        if (wrapper.classList.contains('optional')) {
          return;
        }

        // Если нет класса optional - чекбокс обязательный
        const checkbox = wrapper.querySelector('input[type="checkbox"]');
        if (!checkbox) {
          return;
        }

        const isInvert = wrapper.classList.contains('invert');

        // Для обычного чекбокса: должен быть отмечен
        // Для invert чекбокса: должен быть НЕ отмечен
        if ((!isInvert && !checkbox.checked) || 
            (isInvert && checkbox.checked)) {
          allRequiredChecked = false;
        }
      });

      // Блокируем/разблокируем кнопки отправки
      submitButtons.forEach(function(button) {
        button.disabled = !allRequiredChecked;
      });
    }

    // Проверяем при инициализации
    checkAcceptanceRequired();

    // Проверяем при изменении любого чекбокса
    acceptanceWrappers.forEach(function(wrapper) {
      const checkbox = wrapper.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.addEventListener('change', checkAcceptanceRequired);
      }
    });

    // Проверяем при сбросе формы
    form.addEventListener('wpcf7reset', function() {
      setTimeout(checkAcceptanceRequired, 0);
    });
  }

  /**
   * Отслеживание статуса формы и изменение текста кнопки
   */
  function initFormSubmittingWatcher() {
    const forms = document.getElementsByClassName("wpcf7-form");

    Array.prototype.forEach.call(forms, function (form) {
      // Проверяем, не инициализирована ли форма уже
      if (form.dataset.submittingWatcherInitialized === 'true') {
        return;
      }

      // Найти кнопку отправки внутри формы
      const submitButton = form.querySelector(
        'button[type="submit"], input[type="submit"], div[type="submit"], span[type="submit"]'
      );

      if (submitButton) {
        // Сохраняем оригинальный текст в data-атрибут
        if (submitButton.tagName.toLowerCase() === "input") {
          submitButton.setAttribute("data-original-text", submitButton.value);
        } else {
          submitButton.setAttribute(
            "data-original-text",
            submitButton.innerHTML
          );
        }
      }

      const observer = new MutationObserver(function (mutationsList) {
        mutationsList.forEach(function (mutation) {
          if (mutation.attributeName === "class") {
            if (form.classList.contains("submitting")) {
              // Если форма отправляется — меняем текст
              if (submitButton) {
                const loadingText =
                  'Отправка... <i class="uil uil-envelope-upload ms-2"></i>';
                if (submitButton.tagName.toLowerCase() === "input") {
                  submitButton.value = "Отправка...";
                } else {
                  submitButton.innerHTML = loadingText;
                }
              }
            } else if (
              form.classList.contains("invalid") ||
              form.classList.contains("unaccepted")
            ) {
              // Если форма вернула invalid или unaccepted — возвращаем оригинальный текст
              if (submitButton) {
                const originalText =
                  submitButton.getAttribute("data-original-text");
                if (submitButton.tagName.toLowerCase() === "input") {
                  submitButton.value = originalText;
                } else {
                  submitButton.innerHTML = originalText;
                }
              }
            } else if (form.classList.contains("sent")) {
              // Если форма успешно отправлена — меняем текст на "Отправлено"
              if (submitButton) {
                const successText =
                  'Отправлено <i class="uil uil-check-circle ms-2"></i>';
                if (submitButton.tagName.toLowerCase() === "input") {
                  submitButton.value = "Отправлено";
                } else {
                  submitButton.innerHTML = successText;
                }
              }
            }
          }
        });
      });

      observer.observe(form, { attributes: true });
      
      // Помечаем форму как инициализированную
      form.dataset.submittingWatcherInitialized = 'true';
    });
  }

  /**
   * Инициализация всех функций
   */
  function init() {
    // Инициализация для существующих форм
    document.querySelectorAll('.wpcf7-form').forEach(function(form) {
      initAcceptanceRequiredCheck(form);
    });

    // Инициализация отслеживания статуса формы
    initFormSubmittingWatcher();

    // Перехватываем инициализацию CF7 для новых форм
    if (typeof wpcf7 !== 'undefined' && wpcf7.init) {
      const originalInit = wpcf7.init;
      wpcf7.init = function(form) {
        originalInit.call(this, form);
        
        // Небольшая задержка, чтобы CF7 успел инициализировать свою логику
        setTimeout(function() {
          initAcceptanceRequiredCheck(form);
          initFormSubmittingWatcher();
        }, 100);
      };
    }
  }

  // Инициализация при загрузке DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Инициализация для форм, загруженных через AJAX
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) {
          if (node.classList && node.classList.contains('wpcf7-form')) {
            setTimeout(function() {
              initAcceptanceRequiredCheck(node);
              initFormSubmittingWatcher();
            }, 100);
          } else if (node.querySelectorAll) {
            const forms = node.querySelectorAll('.wpcf7-form');
            if (forms.length > 0) {
              forms.forEach(function(form) {
                setTimeout(function() {
                  initAcceptanceRequiredCheck(form);
                  initFormSubmittingWatcher();
                }, 100);
              });
            }
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Инициализация при событии wpcf7mailsent (для динамически загруженных форм)
  document.addEventListener('wpcf7mailsent', function() {
    setTimeout(function() {
      document.querySelectorAll('.wpcf7-form').forEach(function(form) {
        initAcceptanceRequiredCheck(form);
        initFormSubmittingWatcher();
      });
    }, 100);
  });
})();

