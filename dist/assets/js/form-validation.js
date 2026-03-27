/**
 * Form Validation
 * Adds Bootstrap 4/5 form validation behavior for forms with 'needs-validation' class
 */

(function() {
  'use strict';

  /**
   * Инициализация валидации для форм с классом needs-validation
   */
  function initFormValidation() {
    var forms = document.getElementsByClassName("needs-validation");

    Array.prototype.forEach.call(forms, function (form) {
      // Проверяем, не инициализирована ли форма уже
      if (form.dataset.validationInitialized === 'true') {
        return;
      }

      form.addEventListener(
        "submit",
        function (event) {
          if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
          }
          form.classList.add("was-validated");
        },
        false
      );

      // Помечаем форму как инициализированную
      form.dataset.validationInitialized = 'true';
    });
  }

  /**
   * Инициализация для динамически добавленных форм
   */
  function initDynamicForms() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            if (node.classList && node.classList.contains('needs-validation')) {
              setTimeout(initFormValidation, 0);
            } else if (node.querySelectorAll) {
              const forms = node.querySelectorAll('.needs-validation');
              if (forms.length > 0) {
                setTimeout(initFormValidation, 0);
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
  }

  /**
   * Основная инициализация
   */
  function init() {
    initFormValidation();
    initDynamicForms();
  }

  // Инициализация при загрузке DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Экспортируем функцию для использования в других скриптах
  window.initFormValidation = initFormValidation;
})();





