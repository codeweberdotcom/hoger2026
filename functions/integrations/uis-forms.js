(function () {
    'use strict';

    // formId → { name, phone, email, formName, formType }
    var pending = new Map();

    document.addEventListener('codeweberFormSubmitting', function (e) {
        var fd       = e.detail.formData;
        var form     = e.detail.form;
        var formId   = e.detail.formId;

        pending.set(formId, {
            name:     fd.get('name')     || fd.get('reg_name')  || '',
            phone:    fd.get('phone')    || fd.get('reg_phone') || '',
            email:    fd.get('email')    || fd.get('reg_email') || '',
            message:  fd.get('message') || fd.get('reg_message') || '',
            formName: (form && form.dataset.formName) || String(formId),
            formType: (form && form.dataset.formType) || '',
        });
    });

    document.addEventListener('codeweberFormSubmitted', function (e) {
        var formId = e.detail.formId;
        var data   = pending.get(formId);

        if (!data) return;
        pending.delete(formId);

        if (typeof Comagic === 'undefined') return;

        if (data.name || data.phone || data.email) {
            Comagic.addVisitorInfo({
                name:  data.name,
                phone: data.phone,
                email: data.email,
            });

            var fileUrls     = (e.detail.apiResponse && e.detail.apiResponse.file_urls) || [];
            var message      = data.message || '';
            var fileUrlsList = fileUrls.join(', ');

            if (fileUrls.length) {
                message += (message ? '\n' : '') +
                    'К этому сообщению прикреплено ' + fileUrls.length + ' файл(ов)';
            }

            Comagic.addOfflineRequest({
                name:      data.name,
                phone:     data.phone,
                email:     data.email,
                form_name: data.formName,
                message:   message,
                note:      fileUrlsList,
            });
        }

        Comagic.trackEvent('form', 'submit', data.formName, formId);
    });
}());
