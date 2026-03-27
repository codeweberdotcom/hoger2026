/**
 * CF7 success handler — unified with CodeWeber forms.
 * Delegates to window.codeweberModal.showSuccess() (defined in restapi.js).
 */

(function() {
    'use strict';

    function handleCf7Success(event) {
        // Показываем success-шаблон через единую функцию из restapi.js
        if (window.codeweberModal && window.codeweberModal.showSuccess) {
            window.codeweberModal.showSuccess('');
        }

        // Очищаем классы валидации с формы
        var form = event.target;
        form.classList.remove('was-validated');
        form.querySelectorAll('.form-control, .form-check-input').forEach(function(input) {
            input.classList.remove('is-valid', 'is-invalid');
            input.removeAttribute('aria-invalid');
        });
    }

    function init() {
        if (document.body.dataset.cf7SuccessMessageInitialized === 'true') return;
        document.addEventListener('wpcf7mailsent', handleCf7Success, false);
        document.body.dataset.cf7SuccessMessageInitialized = 'true';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
