/**
 * Notification Triggers Handler
 * Handles all trigger types for notification modals
 */

document.addEventListener("DOMContentLoaded", function() {
    const modalElement = document.getElementById("notification-modal");

    if (!modalElement) {
        return;
    }

    // Get trigger data from modal element
    const triggerType = modalElement.getAttribute('data-trigger-type');
    const triggerInactivity = modalElement.getAttribute('data-trigger-inactivity');
    const triggerViewport = modalElement.getAttribute('data-trigger-viewport');
    const triggerUtmParam = modalElement.getAttribute('data-trigger-utm-param') || '';
    const triggerUtmValue = modalElement.getAttribute('data-trigger-utm-value') || '';
    const waitDelay = modalElement.getAttribute('data-wait') || 200;
    const notifId    = modalElement.getAttribute('data-notification-id') || '';
    const maxFirings = parseInt(modalElement.getAttribute('data-max-firings') || '1', 10);
    const countReset = parseFloat(modalElement.getAttribute('data-count-reset') || '720');

    // --- Firing counter (cookie-based) ---
    const countCookieName = notifId ? 'cw_notif_' + notifId + '_count' : '';

    function getCookieVal(name) {
        var m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
        return m ? parseInt(decodeURIComponent(m[1]), 10) : 0;
    }
    function setCookieVal(name, val, hours) {
        var cookie = name + '=' + encodeURIComponent(val) + '; path=/; SameSite=Lax';
        if (hours > 0) {
            cookie += '; expires=' + new Date(Date.now() + hours * 3600000).toUTCString();
        }
        document.cookie = cookie;
    }

    function canFire() {
        if (!notifId || maxFirings === 0) return true;
        return getCookieVal(countCookieName) < maxFirings;
    }
    function recordFire() {
        if (!notifId || maxFirings === 0) return;
        var current = getCookieVal(countCookieName);
        setCookieVal(countCookieName, current + 1, countReset);
    }

    function checkUtmMatch() {
        if (!triggerUtmParam || !triggerUtmValue) return false;
        const params = new URLSearchParams(window.location.search);
        return params.get(triggerUtmParam) === triggerUtmValue;
    }

    // --- Composite Chain Mode ---
    const compositeRaw      = modalElement.getAttribute('data-composite') || '';
    const compositeLifetime = parseFloat(modalElement.getAttribute('data-composite-lifetime') || '24');
    let   compositeSteps    = null;
    try { if (compositeRaw) compositeSteps = JSON.parse(compositeRaw); } catch(e) {}

    if (compositeSteps && compositeSteps.length > 0 && notifId) {
        const cookieName     = 'cw_notif_' + notifId + '_chain';
        const chainNotifType = modalElement.getAttribute('data-notification-type') || '';

        function chainGetCookie() {
            const m = document.cookie.match(new RegExp('(?:^|; )' + cookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
            return m ? parseInt(decodeURIComponent(m[1]), 10) : 0;
        }
        function chainSetCookie(val) {
            const exp = new Date(Date.now() + compositeLifetime * 3600000).toUTCString();
            document.cookie = cookieName + '=' + encodeURIComponent(val) + '; expires=' + exp + '; path=/; SameSite=Lax';
        }

        function chainFire() {
            if (!canFire()) return;
            recordFire();
            if (chainNotifType === 'cw_notify') {
                if (typeof window.CWNotify === 'undefined') return;
                window.CWNotify.show(
                    modalElement.getAttribute('data-cw-message') || '',
                    {
                        type:     modalElement.getAttribute('data-cw-type')     || 'info',
                        position: modalElement.getAttribute('data-cw-position') || 'bottom-end',
                        delay:    parseInt(modalElement.getAttribute('data-cw-delay') || '5000', 10)
                    }
                );
            } else if (chainNotifType === 'telegram') {
                const fd   = new FormData();
                const utmP = new URLSearchParams(window.location.search);
                fd.append('action', 'codeweber_notification_telegram');
                fd.append('nonce', modalElement.getAttribute('data-nonce') || '');
                fd.append('notification_id', notifId);
                fd.append('page_url', window.location.href);
                ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(function(k) {
                    fd.append(k, utmP.get(k) || '');
                });
                const aj = (typeof theme_scripts_ajax !== 'undefined') ? theme_scripts_ajax.ajax_url : '/wp-admin/admin-ajax.php';
                fetch(aj, { method: 'POST', body: fd });
            } else {
                if (typeof bootstrap !== 'undefined') {
                    try { new bootstrap.Modal(modalElement).show(); } catch(e) {}
                }
            }
        }

        let chainStep = chainGetCookie();

        function chainAdvance() {
            chainStep++;
            chainSetCookie(chainStep);
            if (chainStep >= compositeSteps.length) {
                chainFire();
            } else {
                chainInitStep(chainStep);
            }
        }

        function chainInitStep(idx) {
            if (idx >= compositeSteps.length) return;
            const step = compositeSteps[idx];

            if (step.type === 'page') {
                var val = step.value || '';
                var hit = false;
                if (val === 'home' || val === 'front-page') {
                    hit = document.body.classList.contains('home') || document.body.classList.contains('front-page');
                } else if (val) {
                    hit = document.body.classList.contains('page-id-' + val) ||
                          document.body.classList.contains('postid-' + val);
                }
                if (hit) chainAdvance();

            } else if (step.type === 'utm_param') {
                var p = new URLSearchParams(window.location.search);
                if (step.utm_param && step.utm_value && p.get(step.utm_param) === step.utm_value) {
                    chainAdvance();
                }

            } else if (step.type === 'codeweber_form') {
                document.addEventListener('codeweber_form_success', chainAdvance, { once: true });

            } else if (step.type === 'cf7_form') {
                document.addEventListener('wpcf7mailsent', chainAdvance, { once: true });
                document.addEventListener('cf7_form_success', chainAdvance, { once: true });

            } else if (step.type === 'woocommerce_order') {
                if (document.body.classList.contains('woocommerce-order-received')) { chainAdvance(); return; }
                document.addEventListener('woocommerce_order_success', chainAdvance, { once: true });

            } else if (step.type === 'scroll_middle') {
                var smDone = false;
                function smCheck() {
                    if (smDone) return;
                    if ((window.pageYOffset + window.innerHeight) / document.documentElement.scrollHeight >= 0.5) {
                        smDone = true; chainAdvance();
                    }
                }
                smCheck();
                window.addEventListener('scroll', smCheck, { passive: true });

            } else if (step.type === 'scroll_end') {
                var seDone = false;
                function seCheck() {
                    if (seDone) return;
                    if ((window.pageYOffset + window.innerHeight) / document.documentElement.scrollHeight >= 0.95) {
                        seDone = true; chainAdvance();
                    }
                }
                seCheck();
                window.addEventListener('scroll', seCheck, { passive: true });
            }
        }

        chainInitStep(chainStep);
        return; // skip single-trigger logic
    }

    // --- CW Notify (Toast) type ---
    const notificationType = modalElement.getAttribute('data-notification-type');
    if (notificationType === 'cw_notify') {
        if (!triggerType) return;
        const cwMessage  = modalElement.getAttribute('data-cw-message') || '';
        const cwType     = modalElement.getAttribute('data-cw-type')    || 'info';
        const cwPosition = modalElement.getAttribute('data-cw-position') || 'bottom-end';
        const cwDelay    = parseInt(modalElement.getAttribute('data-cw-delay') || '5000', 10);

        function showCwNotify() {
            if (!canFire()) return;
            if (typeof window.CWNotify === 'undefined') return;
            recordFire();
            window.CWNotify.show(cwMessage, { type: cwType, position: cwPosition, delay: cwDelay });
        }

        function initCwNotifyTriggers() {
            if (triggerType === 'delay') {
                setTimeout(showCwNotify, parseInt(waitDelay));
            } else if (triggerType === 'inactivity') {
                var inactivityDelay = triggerInactivity ? parseInt(triggerInactivity) : 30000;
                var inactivityTimer;
                function resetTimer() {
                    clearTimeout(inactivityTimer);
                    inactivityTimer = setTimeout(showCwNotify, inactivityDelay);
                }
                ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(function(evt) {
                    document.addEventListener(evt, resetTimer, true);
                });
                resetTimer();
            } else if (triggerType === 'viewport' && triggerViewport) {
                var elementId = triggerViewport.replace('#', '');
                var targetEl = document.getElementById(elementId) || document.querySelector(triggerViewport);
                if (targetEl) {
                    var obs = new IntersectionObserver(function(entries) {
                        entries.forEach(function(entry) {
                            if (entry.isIntersecting) { showCwNotify(); obs.disconnect(); }
                        });
                    }, { threshold: 0.1 });
                    obs.observe(targetEl);
                }
            } else if (triggerType === 'scroll_middle') {
                var triggered = false;
                function checkMid() {
                    if (triggered) return;
                    var pct = (window.pageYOffset + window.innerHeight) / document.documentElement.scrollHeight;
                    if (pct >= 0.5) { triggered = true; showCwNotify(); }
                }
                checkMid();
                window.addEventListener('scroll', checkMid, { passive: true });
            } else if (triggerType === 'scroll_end') {
                var triggeredEnd = false;
                function checkEnd() {
                    if (triggeredEnd) return;
                    var pct = (window.pageYOffset + window.innerHeight) / document.documentElement.scrollHeight;
                    if (pct >= 0.95) { triggeredEnd = true; showCwNotify(); }
                }
                checkEnd();
                window.addEventListener('scroll', checkEnd, { passive: true });
            } else if (triggerType === 'codeweber_form') {
                document.addEventListener('codeweber_form_success', showCwNotify);
            } else if (triggerType === 'cf7_form') {
                document.addEventListener('wpcf7mailsent', showCwNotify);
                document.addEventListener('cf7_form_success', showCwNotify);
            } else if (triggerType === 'woocommerce_order') {
                if (document.body.classList.contains('woocommerce-order-received')) { showCwNotify(); }
                document.addEventListener('woocommerce_order_success', showCwNotify);
            } else if (triggerType === 'page') {
                setTimeout(showCwNotify, parseInt(waitDelay));
            } else if (triggerType === 'utm_param') {
                if (checkUtmMatch()) { showCwNotify(); }
            }
        }

        initCwNotifyTriggers();
        return; // не инициализируем Bootstrap Modal
    }

    // --- Telegram Notification type ---
    if (notificationType === 'telegram') {
        if (!triggerType) return;
        const notificationId = modalElement.getAttribute('data-notification-id');
        const nonce = modalElement.getAttribute('data-nonce');

        function getUtmParams() {
            const params = new URLSearchParams(window.location.search);
            return {
                utm_source:   params.get('utm_source')   || '',
                utm_medium:   params.get('utm_medium')   || '',
                utm_campaign: params.get('utm_campaign') || '',
                utm_term:     params.get('utm_term')     || '',
                utm_content:  params.get('utm_content')  || '',
            };
        }

        function sendTelegramNotification() {
            if (!canFire()) return;
            recordFire();
            const utm = getUtmParams();
            const formData = new FormData();
            formData.append('action', 'codeweber_notification_telegram');
            formData.append('nonce', nonce);
            formData.append('notification_id', notificationId);
            formData.append('page_url', window.location.href);
            Object.entries(utm).forEach(function([k, v]) { formData.append(k, v); });
            const ajaxUrl = (typeof theme_scripts_ajax !== 'undefined' && theme_scripts_ajax.ajax_url)
                ? theme_scripts_ajax.ajax_url
                : '/wp-admin/admin-ajax.php';
            fetch(ajaxUrl, { method: 'POST', body: formData });
        }

        function initTelegramTriggers() {
            if (triggerType === 'delay') {
                setTimeout(sendTelegramNotification, parseInt(waitDelay));
            } else if (triggerType === 'inactivity') {
                var inactivityDelay = triggerInactivity ? parseInt(triggerInactivity) : 30000;
                var inactivityTimer;
                function resetTimerTg() {
                    clearTimeout(inactivityTimer);
                    inactivityTimer = setTimeout(sendTelegramNotification, inactivityDelay);
                }
                ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(function(evt) {
                    document.addEventListener(evt, resetTimerTg, true);
                });
                resetTimerTg();
            } else if (triggerType === 'viewport' && triggerViewport) {
                var elementId = triggerViewport.replace('#', '');
                var targetEl = document.getElementById(elementId) || document.querySelector(triggerViewport);
                if (targetEl) {
                    var obs = new IntersectionObserver(function(entries) {
                        entries.forEach(function(entry) {
                            if (entry.isIntersecting) { sendTelegramNotification(); obs.disconnect(); }
                        });
                    }, { threshold: 0.1 });
                    obs.observe(targetEl);
                }
            } else if (triggerType === 'scroll_middle') {
                var triggeredMid = false;
                function checkMidTg() {
                    if (triggeredMid) return;
                    var pct = (window.pageYOffset + window.innerHeight) / document.documentElement.scrollHeight;
                    if (pct >= 0.5) { triggeredMid = true; sendTelegramNotification(); }
                }
                checkMidTg();
                window.addEventListener('scroll', checkMidTg, { passive: true });
            } else if (triggerType === 'scroll_end') {
                var triggeredEnd = false;
                function checkEndTg() {
                    if (triggeredEnd) return;
                    var pct = (window.pageYOffset + window.innerHeight) / document.documentElement.scrollHeight;
                    if (pct >= 0.95) { triggeredEnd = true; sendTelegramNotification(); }
                }
                checkEndTg();
                window.addEventListener('scroll', checkEndTg, { passive: true });
            } else if (triggerType === 'codeweber_form') {
                document.addEventListener('codeweber_form_success', sendTelegramNotification);
            } else if (triggerType === 'cf7_form') {
                document.addEventListener('wpcf7mailsent', sendTelegramNotification);
                document.addEventListener('cf7_form_success', sendTelegramNotification);
            } else if (triggerType === 'woocommerce_order') {
                if (document.body.classList.contains('woocommerce-order-received')) { sendTelegramNotification(); }
                document.addEventListener('woocommerce_order_success', sendTelegramNotification);
            } else if (triggerType === 'page') {
                setTimeout(sendTelegramNotification, parseInt(waitDelay));
            } else if (triggerType === 'utm_param') {
                if (checkUtmMatch()) { sendTelegramNotification(); }
            }
        }

        initTelegramTriggers();
        return;
    }

    // --- Modal type ---
    // Check if modal has notification content (modal-popup class)
    const isNotification = modalElement.classList.contains('modal-popup');

    if (!isNotification || !triggerType) {
        return;
    }

    // Initialize Bootstrap modal
    let modal;
    try {
        modal = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true
        });
    } catch (e) {
        return;
    }
    
    let triggerHandled = false;
    let triggerInitFunctions = []; // Store trigger initialization functions for re-initialization
    
    /**
     * Check if a higher priority modal is currently open
     * Priority order:
     * 1. Cookie modal (id="cookieModal") - highest priority
     * 2. Other modals (id="modal", id="newsletter-success-modal", id="codeweber-form-success-modal") - medium priority
     * 3. Notification modal (id="notification-modal") - lowest priority
     * 
     * @returns {boolean} true if higher priority modal is open, false otherwise
     */
    function isHigherPriorityModalOpen() {
        if (typeof bootstrap === 'undefined' || !bootstrap.Modal) {
            return false;
        }
        
        // Check cookie modal (priority 1)
        const cookieModal = document.getElementById('cookieModal');
        if (cookieModal && cookieModal.classList.contains('show')) {
            return true;
        }
        
        const otherModals = [
            document.getElementById('modal'),
            document.getElementById('newsletter-success-modal'),
            document.getElementById('codeweber-form-success-modal')
        ];
        
        for (let otherModal of otherModals) {
            if (otherModal && otherModal.classList.contains('show')) {
                return true;
            }
        }
        
        return false;
    }
    
    // Function to show modal
    function showNotificationModal() {
        if (triggerHandled) {
            return;
        }

        if (!canFire()) {
            return;
        }

        if (isHigherPriorityModalOpen()) {
            return;
        }

        triggerHandled = true;

        setTimeout(function() {
            if (isHigherPriorityModalOpen()) {
                triggerHandled = false;
                return;
            }
            recordFire();
            modal.show();
        }, parseInt(waitDelay));
    }
    
    /**
     * Initialize notification triggers based on trigger type
     * This function can be called multiple times (e.g., after cookie modal closes)
     */
    function initNotificationTriggers() {
        // Check if trigger was already handled and modal was shown
        if (triggerHandled && modalElement.classList.contains('show')) {
            return;
        }
        
        if (isHigherPriorityModalOpen()) {
            return;
        }
        
        if (triggerType === 'delay') {
            showNotificationModal();
        }
    
    // Trigger: inactivity
    else if (triggerType === 'inactivity') {
        let inactivityTimer;
        const inactivityDelay = triggerInactivity ? parseInt(triggerInactivity) : 30000;
        let lastActivity = Date.now();
        
        function resetTimer() {
            lastActivity = Date.now();
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(function() {
                if (Date.now() - lastActivity >= inactivityDelay) {
                    showNotificationModal();
                }
            }, inactivityDelay);
        }
        
        // Track user activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(function(event) {
            document.addEventListener(event, resetTimer, true);
        });
        
        // Start timer
        resetTimer();
    }
    
    // Trigger: viewport
    else if (triggerType === 'viewport') {
        if (triggerViewport) {
            const elementId = triggerViewport.replace('#', '');
            const targetElement = document.getElementById(elementId) || document.querySelector(triggerViewport);
            
            if (targetElement) {
                const observer = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting) {
                            showNotificationModal();
                            observer.disconnect();
                        }
                    });
                }, {
                    threshold: 0.1
                });
                
                observer.observe(targetElement);
            }
        }
    }
    
    // Trigger: scroll to middle
    else if (triggerType === 'scroll_middle') {
        let scrollMiddleTriggered = false;
        let scrollEventCount = 0;
        
        function checkScrollPosition() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollPercent = (scrollTop + windowHeight) / documentHeight;
            
            if (scrollPercent >= 0.5 && !scrollMiddleTriggered) {
                scrollMiddleTriggered = true;
                showNotificationModal();
            }
        }
        
        // Check immediately and after a short delay (in case page loads scrolled)
        checkScrollPosition();
        setTimeout(checkScrollPosition, 100);
        setTimeout(checkScrollPosition, 500);
        
        window.addEventListener('scroll', function() {
            scrollEventCount++;
            
            if (scrollMiddleTriggered) {
                return;
            }
            
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollPercent = (scrollTop + windowHeight) / documentHeight;
            
            if (scrollPercent >= 0.5) {
                scrollMiddleTriggered = true;
                showNotificationModal();
            }
        }, { passive: true });
    }
    
    else if (triggerType === 'scroll_end') {
        let scrollEndTriggered = false;
        let scrollEventCount = 0;
        
        function checkScrollPosition() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollPercent = (scrollTop + windowHeight) / documentHeight;
            
            if (scrollPercent >= 0.95 && !scrollEndTriggered) {
                scrollEndTriggered = true;
                showNotificationModal();
            }
        }
        
        // Check immediately and after a short delay (in case page loads scrolled)
        checkScrollPosition();
        setTimeout(checkScrollPosition, 100);
        setTimeout(checkScrollPosition, 500);
        
        window.addEventListener('scroll', function() {
            scrollEventCount++;
            
            if (scrollEndTriggered) {
                return;
            }
            
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollPercent = (scrollTop + windowHeight) / documentHeight;
            
            if (scrollPercent >= 0.95) {
                scrollEndTriggered = true;
                showNotificationModal();
            }
        }, { passive: true });
    }
    
    else if (triggerType === 'codeweber_form') {
        document.addEventListener('codeweber_form_success', function() {
            showNotificationModal();
        });
    }
    
    else if (triggerType === 'cf7_form') {
        document.addEventListener('wpcf7mailsent', function() {
            showNotificationModal();
        });
        document.addEventListener('cf7_form_success', function() {
            showNotificationModal();
        });
    }
    
    else if (triggerType === 'woocommerce_order') {
        if (document.body.classList.contains('woocommerce-order-received')) {
            showNotificationModal();
        }
        document.addEventListener('woocommerce_order_success', function() {
            showNotificationModal();
        });
    }
    
    else if (triggerType === 'page') {
        showNotificationModal();
    }
    else if (triggerType === 'utm_param') {
        if (checkUtmMatch()) { showNotificationModal(); }
    }
        else {
        }
    }
    
    initNotificationTriggers();
    
    function handleModalCloseAndReinit(modalId, modalName) {
        return function(e) {
            triggerHandled = false;
            setTimeout(function() {
                initNotificationTriggers();
            }, 200);
        };
    }
    
    // Listen for cookie modal close event to re-initialize triggers
    const cookieModal = document.getElementById('cookieModal');
    if (cookieModal) {
        cookieModal.addEventListener('hidden.bs.modal', handleModalCloseAndReinit('cookieModal', 'Cookie modal'));
    }
    
    // Listen for CF7 success modal close event (uses id="modal")
    const cf7SuccessModal = document.getElementById('modal');
    if (cf7SuccessModal) {
        // Use a flag to track if this is CF7 success modal
        // We'll check if modal was opened by CF7 by listening to custom event or checking content
        cf7SuccessModal.addEventListener('hidden.bs.modal', function(e) {
            // Check if this is CF7 success modal by checking if it has CF7-specific content or class
            // We'll re-init if modal was shown (it could be CF7 or REST API modal)
            // But we want to re-init notification triggers after any modal closes
            handleModalCloseAndReinit('modal', 'CF7/REST API modal')(e);
        });
    }
    
    // Listen for newsletter success modal close event
    const newsletterSuccessModal = document.getElementById('newsletter-success-modal');
    if (newsletterSuccessModal) {
        newsletterSuccessModal.addEventListener('hidden.bs.modal', handleModalCloseAndReinit('newsletter-success-modal', 'Newsletter success modal'));
    }
    
    // Listen for codeweber form success modal close event
    const codeweberFormSuccessModal = document.getElementById('codeweber-form-success-modal');
    if (codeweberFormSuccessModal) {
        codeweberFormSuccessModal.addEventListener('hidden.bs.modal', handleModalCloseAndReinit('codeweber-form-success-modal', 'Codeweber form success modal'));
    }
    
});


