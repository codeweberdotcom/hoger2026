/**
 * Testimonial Form Handler
 * 
 * Handles AJAX submission of testimonial form
 * 
 * @package Codeweber
 */

(function() {
    'use strict';

    /**
     * Заменяет контент модального окна на шаблон с конвертом
     * 
     * @param {HTMLElement} form - Элемент формы
     * @param {string} message - Сообщение для отображения
     */
    function replaceModalContentWithEnvelope(form, message) {
        const modal = form.closest('.modal');
        const modalContent = modal ? modal.querySelector('.modal-body') : null;

        if (!modal || !modalContent) {
            return; // Модального окна нет
        }

        // Получаем шаблон успешной отправки через REST API
        let apiRoot = '/wp-json/';
        let apiNonce = '';

        if (typeof wpApiSettings !== 'undefined') {
            apiRoot = wpApiSettings.root;
            apiNonce = wpApiSettings.nonce;
        } else {
            // Пытаемся получить nonce из мета-тега
            const nonceMeta = document.querySelector('meta[name="wp-api-nonce"]');
            if (nonceMeta) {
                apiNonce = nonceMeta.getAttribute('content');
            }
        }

        fetch(apiRoot + 'codeweber/v1/success-message-template?message=' + encodeURIComponent(message) + '&icon_type=svg', {
            method: 'GET',
            headers: {
                'X-WP-Nonce': apiNonce,
                'Content-Type': 'application/json'
            }
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(templateData) {
            if (templateData.success && templateData.html) {
                // Заменяем содержимое модального окна на шаблон с конвертом
                modalContent.innerHTML = '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' + templateData.html;

                // Закрываем модальное окно через 2 секунды
                setTimeout(function() {
                    const bsModal = bootstrap.Modal.getInstance(modal);
                    if (bsModal) {
                        bsModal.hide();
                    }
                }, 2000);
            } else {
                // Fallback: просто закрываем модальное окно
                setTimeout(function() {
                    const bsModal = bootstrap.Modal.getInstance(modal);
                    if (bsModal) {
                        bsModal.hide();
                    }
                }, 500);
            }
        })
        .catch(function(error) {
            console.error('[Testimonial Form] Error loading success template:', error);
            // Fallback: закрываем модальное окно
            setTimeout(function() {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    bsModal.hide();
                }
            }, 500);
        });
    }

    /**
     * Get UTM parameters from URL or localStorage
     * 
     * @return object UTM parameters
     */
    function getUTMParams() {
        const utmParams = {};
        const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id'];
        
        // Get from current URL
        const urlParams = new URLSearchParams(window.location.search);
        utmKeys.forEach(key => {
            const value = urlParams.get(key);
            if (value) {
                utmParams[key] = value;
            }
        });
        
        // Get from localStorage (stored from previous visits)
        try {
            const storedUTM = localStorage.getItem('codeweber_utm_params');
            const expiry = localStorage.getItem('codeweber_utm_params_expiry');
            
            // Check if stored UTM is still valid (30 days)
            if (storedUTM && expiry && Date.now() < parseInt(expiry)) {
                const parsed = JSON.parse(storedUTM);
                // Merge with current URL params (URL params take priority)
                utmKeys.forEach(key => {
                    if (!utmParams[key] && parsed[key]) {
                        utmParams[key] = parsed[key];
                    }
                });
            } else if (storedUTM) {
                // Expired, remove it
                localStorage.removeItem('codeweber_utm_params');
                localStorage.removeItem('codeweber_utm_params_expiry');
            }
        } catch (e) {
            console.error('[Testimonial Form] Error reading UTM from localStorage:', e);
        }
        
        // Store current UTM params in localStorage for future use
        if (Object.keys(utmParams).length > 0) {
            try {
                localStorage.setItem('codeweber_utm_params', JSON.stringify(utmParams));
                // Store expiration (30 days)
                localStorage.setItem('codeweber_utm_params_expiry', (Date.now() + (30 * 24 * 60 * 60 * 1000)).toString());
            } catch (e) {
                console.error('[Testimonial Form] Error storing UTM in localStorage:', e);
            }
        }
        
        return utmParams;
    }
    
    /**
     * Get additional tracking data
     * 
     * @return object Tracking data
     */
    function getTrackingData() {
        const data = {};
        
        // Referrer
        if (document.referrer) {
            data.referrer = document.referrer;
        }
        
        // Landing page (current page URL)
        data.landing_page = window.location.href;
        
        return data;
    }

    /**
     * Initialize testimonial form
     */
    function initTestimonialForm() {
        const form = document.getElementById('testimonial-form');
        if (!form) return;

        const submitBtn = form.querySelector('[type="submit"]');
        if (!submitBtn) return;

        const originalBtnText = submitBtn.textContent || submitBtn.innerText;
        const formMessages = form.querySelector('.testimonial-form-messages');

        // JavaScript хук: форма открыта (отправляем один раз при загрузке)
        if (!form.dataset.opened) {
            form.dataset.opened = 'true';
            
            const openedEvent = new CustomEvent('codeweberFormOpened', {
                detail: {
                    formId: 'testimonial-form',
                    form: form
                }
            });
            form.dispatchEvent(openedEvent);
            
            // Отправляем запрос на сервер для PHP хука
            const restUrl = codeweberForms?.restUrl || '/wp-json/codeweber-forms/v1/';
            const restNonce = codeweberForms?.restNonce || '';
            
            if (restUrl) {
                fetch(restUrl + 'form-opened', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': restNonce
                    },
                    body: JSON.stringify({ form_id: 'testimonial-form' })
                }).catch(() => {}); // Игнорируем ошибки
            }
        }

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // JavaScript хук: форма отправляется
            const submittingEvent = new CustomEvent('codeweberFormSubmitting', {
                detail: {
                    formId: 'testimonial-form',
                    form: form,
                    formData: new FormData(form)
                },
                cancelable: true
            });
            const submittingResult = form.dispatchEvent(submittingEvent);
            
            // Если событие было отменено, не отправляем форму
            if (!submittingResult) {
                return;
            }

            // Clear previous messages
            if (formMessages) {
                formMessages.innerHTML = '';
                formMessages.className = 'testimonial-form-messages';
            }

            // Bootstrap validation: check if form is valid
            if (!form.checkValidity()) {
                // Add was-validated class to show validation styles
                form.classList.add('was-validated');
                
                // JavaScript хук: ошибка валидации
                const invalidEvent = new CustomEvent('codeweberFormInvalid', {
                    detail: {
                        formId: 'testimonial-form',
                        form: form,
                        message: 'Form validation failed'
                    }
                });
                form.dispatchEvent(invalidEvent);
                
                // Focus on first invalid field
                const firstInvalid = form.querySelector(':invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                }
                
                return;
            }
            
            // Remove was-validated class if form is valid (for re-submission)
            form.classList.remove('was-validated');
            
            // Also run custom validation
            if (!validateForm(form)) {
                // JavaScript хук: ошибка валидации
                const invalidEvent = new CustomEvent('codeweberFormInvalid', {
                    detail: {
                        formId: 'testimonial-form',
                        form: form,
                        message: 'Form validation failed'
                    }
                });
                form.dispatchEvent(invalidEvent);
                return;
            }

            // Show loading state
            submitBtn.disabled = true;
            const loadingText = submitBtn.dataset.loadingText || 'Отправка...';
            submitBtn.textContent = loadingText;

            // Collect form data
            const formData = new FormData(form);
            const formNonce = formData.get('testimonial_nonce');
            const userId = formData.get('user_id'); // Check if user is logged in
            const isLoggedIn = !!userId;
            
            // Collect UTM parameters
            const utmParams = getUTMParams();
            const trackingData = getTrackingData();
            
            // Collect consents
            const testimonialConsents = {};
            const consentCheckboxes = form.querySelectorAll('input[name^="testimonial_consents["]');
            consentCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    const name = checkbox.name;
                    // Extract document ID from name like "testimonial_consents[123]"
                    const match = name.match(/testimonial_consents\[(\d+)\]/);
                    if (match && match[1]) {
                        testimonialConsents[match[1]] = '1';
                    }
                }
            });
            
            const data = {
                testimonial_text: formData.get('testimonial_text'),
                rating: formData.get('rating'),
                nonce: formNonce,
                honeypot: formData.get('testimonial_honeypot') || '', // Honeypot field
                utm_params: utmParams,
                tracking_data: trackingData,
                testimonial_consents: testimonialConsents
            };
            
            // If user is logged in, send user_id; otherwise send name and email
            if (isLoggedIn && userId) {
                data.user_id = parseInt(userId, 10); // Ensure it's a number
            } else {
                data.author_name = formData.get('author_name');
                data.author_email = formData.get('author_email');
                data.author_role = formData.get('author_role') || '';
                data.company = formData.get('company') || '';
            }

            // Get REST API URL and nonce
            const restUrl = codeweberTestimonialForm?.restUrl || '/wp-json/codeweber/v1/submit-testimonial';
            const restNonce = codeweberTestimonialForm?.nonce || '';

            // Send AJAX request
            fetch(restUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': restNonce
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.message || 'Network response was not ok');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    form.reset();
                    
                    const message = data.message || __('Message sent successfully.', 'codeweber');
                    
                    // 1. Основная логика UI: заменяем контент модального окна на шаблон с конвертом
                    replaceModalContentWithEnvelope(form, message);
                    
                    // 2. Если модального окна нет, показываем простое сообщение
                    const modal = form.closest('.modal');
                    if (!modal && formMessages) {
                        showMessage(formMessages, message, 'success');
                    }
                    
                    // 3. JavaScript хук: для дополнительных действий (аналитика, уведомления и т.д.)
                    const successEvent = new CustomEvent('codeweberFormSubmitted', {
                        detail: {
                            formId: 'testimonial-form',
                            form: form,
                            submissionId: data.data?.post_id || null,
                            message: message,
                            apiResponse: data
                        }
                    });
                    form.dispatchEvent(successEvent);
                } else {
                    showMessage(formMessages, data.message || 'An error occurred. Please try again.', 'error');
                    
                    // JavaScript хук: ошибка отправки
                    const errorEvent = new CustomEvent('codeweberFormError', {
                        detail: {
                            formId: 'testimonial-form',
                            form: form,
                            message: data.message || 'An error occurred. Please try again.',
                            apiResponse: data
                        }
                    });
                    form.dispatchEvent(errorEvent);
                }
            })
            .catch(error => {
                console.error('Testimonial Form Error:', error);
                showMessage(formMessages, error.message || 'An error occurred. Please try again.', 'error');
                
                // JavaScript хук: ошибка сети/сервера
                const networkErrorEvent = new CustomEvent('codeweberFormError', {
                    detail: {
                        formId: 'testimonial-form',
                        form: form,
                        message: error.message || 'Network error occurred',
                        error: error
                    }
                });
                form.dispatchEvent(networkErrorEvent);
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            });
        });
    }

    /**
     * Validate form fields
     * 
     * @param {HTMLFormElement} form
     * @return {boolean}
     */
    function validateForm(form) {
        const testimonialText = form.querySelector('[name="testimonial_text"]');
        const authorName = form.querySelector('[name="author_name"]');
        const authorEmail = form.querySelector('[name="author_email"]');
        const rating = form.querySelector('[name="rating"]');
        const userId = form.querySelector('[name="user_id"]');
        const formMessages = form.querySelector('.testimonial-form-messages');
        const isLoggedIn = !!userId;

        let isValid = true;
        const errors = [];

        // Validate testimonial text
        if (!testimonialText || !testimonialText.value.trim()) {
            isValid = false;
            errors.push('Please enter your testimonial text.');
            if (testimonialText) {
                testimonialText.classList.add('is-invalid');
            }
        } else {
            if (testimonialText) {
                testimonialText.classList.remove('is-invalid');
            }
        }

        // Validate author name and email only if user is not logged in
        if (!isLoggedIn) {
            // Validate author name
            if (!authorName || !authorName.value.trim()) {
                isValid = false;
                errors.push('Please enter your name.');
                if (authorName) {
                    authorName.classList.add('is-invalid');
                }
            } else {
                if (authorName) {
                    authorName.classList.remove('is-invalid');
                }
            }

            // Validate email
            if (!authorEmail || !authorEmail.value.trim()) {
                isValid = false;
                errors.push('Please enter your email address.');
                if (authorEmail) {
                    authorEmail.classList.add('is-invalid');
                }
            } else if (authorEmail && !isValidEmail(authorEmail.value)) {
                isValid = false;
                errors.push('Please enter a valid email address.');
                authorEmail.classList.add('is-invalid');
            } else {
                if (authorEmail) {
                    authorEmail.classList.remove('is-invalid');
                }
            }
        }

        // Validate rating
        if (!rating || !rating.value) {
            isValid = false;
            errors.push('Please select a rating.');
            if (rating) {
                rating.classList.add('is-invalid');
            }
        } else {
            if (rating) {
                rating.classList.remove('is-invalid');
            }
        }

        // Validate required consents
        const consentCheckboxes = form.querySelectorAll('input[name^="testimonial_consents["][required]');
        consentCheckboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                isValid = false;
                const label = form.querySelector('label[for="' + checkbox.id + '"]');
                const labelText = label ? label.textContent.trim() : 'consent';
                errors.push('Please accept: ' + labelText);
                checkbox.classList.add('is-invalid');
            } else {
                checkbox.classList.remove('is-invalid');
            }
        });

        // Don't show alert message, only use Bootstrap validation styles
        // if (!isValid && formMessages) {
        //     showMessage(formMessages, errors.join('<br>'), 'error');
        // }
        
        // If validation failed, add was-validated class for Bootstrap styles
        if (!isValid) {
            form.classList.add('was-validated');
        }

        return isValid;
    }

    /**
     * Validate email format
     * 
     * @param {string} email
     * @return {boolean}
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Show message to user
     * 
     * @param {HTMLElement} container
     * @param {string} message
     * @param {string} type
     */
    function showMessage(container, message, type) {
        if (!container) return;

        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        container.className = 'testimonial-form-messages alert ' + alertClass;
        container.innerHTML = '<p class="mb-0">' + message + '</p>';
        container.style.display = 'block';

        // Scroll to message
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Make function globally available
    window.initTestimonialForm = initTestimonialForm;
    
    /**
     * Initialize on DOM ready
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTestimonialForm);
    } else {
        initTestimonialForm();
    }

    // Reinitialize if form is added dynamically (e.g., modal opened)
    document.addEventListener('shown.bs.modal', function(e) {
        if (e.target.querySelector('#testimonial-form')) {
            // Small delay to ensure DOM is ready
            setTimeout(function() {
                initTestimonialForm();
            }, 100);
        }
    });
    
    // Also listen for content loaded in modal-content
    const modalContent = document.getElementById('modal-content');
    if (modalContent) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length > 0) {
                    const form = modalContent.querySelector('#testimonial-form');
                    if (form) {
                        setTimeout(initTestimonialForm, 100);
                    }
                }
            });
        });
        observer.observe(modalContent, { childList: true, subtree: true });
    }

})();

