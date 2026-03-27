/**
 * CF7 UTM Tracking
 * 
 * Collects UTM parameters from URL and localStorage, and adds them to CF7 forms as hidden fields
 * Uses the same logic as Codeweber forms for consistency
 * 
 * @package Codeweber
 */

(function() {
    'use strict';
    
    /**
     * Get UTM parameters from URL or localStorage
     * (Same logic as Codeweber forms)
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
            // Error reading UTM from localStorage - silently fail
        }
        
        // Store current UTM params in localStorage for future use
        if (Object.keys(utmParams).length > 0) {
            try {
                localStorage.setItem('codeweber_utm_params', JSON.stringify(utmParams));
                // Store expiration (30 days)
                localStorage.setItem('codeweber_utm_params_expiry', (Date.now() + (30 * 24 * 60 * 60 * 1000)).toString());
            } catch (e) {
                // Error storing UTM in localStorage - silently fail
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
     * Add UTM fields to CF7 form
     * 
     * @param {HTMLElement} form - CF7 form element
     */
    function addUTMFieldsToForm(form) {
        // Check if fields already exist
        if (form.querySelector('input[name="_utm_data"]')) {
            return; // Already added
        }
        
        // Get UTM and tracking data
        const utmParams = getUTMParams();
        const trackingData = getTrackingData();
        
        // Combine all UTM data
        const utmData = Object.assign({}, utmParams, trackingData);
        
        if (Object.keys(utmData).length === 0) {
            return; // No UTM data to add
        }
        
        // Create hidden input field with JSON data
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = '_utm_data';
        hiddenInput.value = JSON.stringify(utmData);
        form.appendChild(hiddenInput);
    }
    
    /**
     * Initialize UTM tracking for CF7 forms
     */
    function initCF7UTMTracking() {
        // Add UTM fields when form is loaded
        const addToExistingForms = function() {
            const cf7Forms = document.querySelectorAll('form.wpcf7-form');
            cf7Forms.forEach(form => {
                addUTMFieldsToForm(form);
            });
        };
        
        // Initial run
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', addToExistingForms);
        } else {
            addToExistingForms();
        }
        
        // Handle forms loaded via AJAX (e.g., in modals)
        // Используем MutationObserver для отслеживания появления новых форм
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) { // Element node
                            const forms = node.querySelectorAll ? node.querySelectorAll('form.wpcf7-form') : [];
                            forms.forEach(form => {
                                addUTMFieldsToForm(form);
                            });
                            // Also check if the node itself is a form
                            if (node.tagName === 'FORM' && node.classList.contains('wpcf7-form')) {
                                addUTMFieldsToForm(node);
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
        
        // Also add UTM fields before form submission (capture phase)
        document.addEventListener('submit', function(e) {
            const form = e.target;
            if (form && form.classList.contains('wpcf7-form')) {
                addUTMFieldsToForm(form);
            }
        }, true); // Use capture phase to ensure we run before CF7 handlers
        
        // Handle CF7 form reset after successful submission
        document.addEventListener('wpcf7mailsent', function(event) {
            const form = event.target;
            if (form && form.classList.contains('wpcf7-form')) {
                // Re-add UTM fields if form is reset (they will be removed by CF7)
                setTimeout(function() {
                    addUTMFieldsToForm(form);
                }, 100);
            }
        }, false);
    }
    
    // Initialize
    initCF7UTMTracking();
})();





