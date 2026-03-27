/**
 * DaData: подсказки адресов (виджет jQuery Suggestions, как в плагине dadata-ru)
 * и кнопка «Проверить адрес» (clean через бэкенд).
 */
(function () {
  'use strict';

  var config = window.codeweberDadata || {};
  var ajaxUrl = config.ajaxUrl || '';
  var nonce = config.nonce || '';
  var token = config.dadataToken || '';
  var defaultPrefix = config.addressPrefix || 'billing';
  var minChars = typeof config.minChars === 'number' ? config.minChars : 2;
  var count = typeof config.count === 'number' ? config.count : 10;
  var debug = !!(config.debug);
  var isCheckout = !!(config.isCheckout);
  var checkoutPhoneMask = config.checkoutPhoneMask !== false;

  function log() {}
  }

  function getForm() {
    var form = document.querySelector('.woocommerce-EditAddressForm, .woocommerce-checkout');
    if (form) return form;
    var wrap = document.querySelector('.woocommerce-address-fields');
    return wrap && wrap.closest ? wrap.closest('form') : null;
  }

  function getField(prefix, name) {
    var form = getForm();
    var id = prefix + '_' + name;
    var selector = '#' + id + ', [name="' + prefix + '_' + name + '"]';
    if (form) return form.querySelector(selector);
    return document.querySelector(selector);
  }

  function setFieldValue(el, value) {
    if (!el) return;
    value = value || '';
    if (el.tagName === 'SELECT') {
      el.value = value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      // WooCommerce state/country используют Select2 — через jQuery виджет обновит отображение
      if (typeof jQuery !== 'undefined') {
        jQuery(el).val(value).trigger('change');
      }
    } else {
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function fillFields(data, prefix) {
    var map = {
      country: 'country',
      state: 'state',
      city: 'city',
      address_1: 'address_1',
      address_2: 'address_2',
      postcode: 'postcode'
    };
    Object.keys(map).forEach(function (key) {
      var val = data[key];
      if (val === undefined) return;
      var p = prefix || defaultPrefix;
      var el = getField(p, map[key]);
      setFieldValue(el, val);
    });
  }

  function initSuggestionsWidget() {
    if (!token) {
      log('initSuggestionsWidget: пропуск — нет token (проверьте Redux → API → DaData API Token)');
      return;
    }
    if (typeof jQuery === 'undefined') {
      log('initSuggestionsWidget: пропуск — jQuery не найден');
      return;
    }
    if (!jQuery.fn.suggestions) {
      log('initSuggestionsWidget: пропуск — jQuery.fn.suggestions отсутствует (подключите jquery.suggestions.min.js)');
      return;
    }

    var locations = [{ country_iso_code: 'RU' }];
    if (config.locations && Array.isArray(config.locations)) {
      locations = config.locations;
    } else if (config.locationsString) {
      locations = config.locationsString.split(',').map(function (c) {
        return { country_iso_code: c.trim() };
      }).filter(function (o) { return o.country_iso_code; });
    }
    if (locations.length === 0) locations = [{ country_iso_code: 'RU' }];

    var ids = ['billing_address_1', 'shipping_address_1'];
    var inited = 0;
    ids.forEach(function (id) {
      var elById = document.getElementById(id);
      var elByName = document.querySelector('input[name="' + id + '"]');
      var el = elById || elByName;
      if (debug) log('Поле', id, '— по id:', !!elById, 'по name:', !!elByName, 'элемент:', el ? el.tagName : null);
      if (!el) return;
      if (el.tagName !== 'INPUT') {
        log('Поле', id, '— пропуск, не INPUT:', el.tagName);
        return;
      }
      if (jQuery(el).data('suggestions')) {
        if (debug) log('Поле', id, '— уже инициализировано');
        return;
      }

      var prefix = id.indexOf('shipping') === 0 ? 'shipping' : 'billing';
      log('Инициализация виджета для', id);
      try {
        jQuery(el).suggestions({
        token: token,
        type: 'ADDRESS',
        count: count,
        minChars: minChars,
        hint: (config.messages && config.messages.hint) ? config.messages.hint : 'Выберите вариант или продолжите ввод',
        constraints: { locations: locations },
        onSelect: function (suggestion) {
          if (debug) log('onSelect:', suggestion.value);
          var d = suggestion.data || {};
          // Город: город или населённый пункт (село, деревня). Улица+дом — в address_1.
          var cityDisplay = (d.city || d.settlement || '').trim();
          var city = (d.city && typeof d.city === 'string') ? d.city : '';
          var region = (d.region && typeof d.region === 'string') ? d.region : '';
          var regionIso = (d.region_iso_code && typeof d.region_iso_code === 'string') ? d.region_iso_code : '';
          var stateCode;
          if (regionIso === 'UA-43' || (region && region.indexOf('Крым') >= 0)) {
            stateCode = 'CR';
          } else if (region && (region.indexOf('Донецк') >= 0 || region.indexOf('ДНР') >= 0)) {
            stateCode = 'DNR';
          } else if (region && (region.indexOf('Луганск') >= 0 || region.indexOf('ЛНР') >= 0)) {
            stateCode = 'LNR';
          } else if ((region && region.indexOf('Севастополь') >= 0) || (cityDisplay && cityDisplay.indexOf('Севастополь') >= 0) || (regionIso === 'UA-40' && (region.indexOf('Севастополь') >= 0 || (cityDisplay && cityDisplay.indexOf('Севастополь') >= 0)))) {
            stateCode = 'SEV';
          } else if (region && (region.indexOf('Запорож') >= 0 || region.indexOf('Запорожська') >= 0) || regionIso === 'UA-40') {
            stateCode = 'ZAP';
          } else if (region && (region.indexOf('Херсон') >= 0 || region.indexOf('Херсонська') >= 0) || regionIso === 'UA-65') {
            stateCode = 'KHE';
          } else if (regionIso) {
            stateCode = regionIso.replace(/^RU\-/i, '');
          } else {
            stateCode = region;
          }
          var stateField = getField(prefix, 'state');
          log('[Область/район] DaData region:', d.region, 'region_iso_code:', d.region_iso_code, '→ stateCode:', stateCode);
          log('[Область/район] Поле state:', stateField ? (stateField.tagName + (stateField.id ? '#' + stateField.id : '') + (stateField.name ? ' name=' + stateField.name : '')) : 'не найдено');
          if (stateField && stateField.tagName === 'SELECT') {
            var opts = [].map.call(stateField.options, function (o) { return o.value; }).filter(Boolean);
            log('[Область/район] Варианты в select:', opts.slice(0, 15).join(', ') + (opts.length > 15 ? '… (' + opts.length + ')' : ''));
            log('[Область/район] stateCode в списке?', opts.indexOf(stateCode) !== -1);
          }
          // address_1 не трогаем — виджет сам подставляет полный адрес (suggestion.value), и список закрывается
          if (prefix === 'billing') {
            jQuery('#billing_city').val(cityDisplay);
            setFieldValue(stateField, stateCode);
            log('[Область/район] После setFieldValue value=', stateField ? stateField.value : '-');
            jQuery('#billing_postcode').val(d.postal_code || '');
            if (d.country_iso_code) setFieldValue(getField('billing', 'country'), d.country_iso_code);
            if (d.flat) setFieldValue(getField('billing', 'address_2'), d.flat);
          } else {
            jQuery('#shipping_city').val(cityDisplay);
            setFieldValue(stateField, stateCode);
            log('[Область/район] После setFieldValue value=', stateField ? stateField.value : '-');
            jQuery('#shipping_postcode').val(d.postal_code || '');
            if (d.country_iso_code) setFieldValue(getField('shipping', 'country'), d.country_iso_code);
            if (d.flat) setFieldValue(getField('shipping', 'address_2'), d.flat);
          }
        }
      });
        inited++;
      } catch (err) {
        log('Ошибка инициализации виджета для', id, err);
      }
    });
    if (inited > 0) log('Виджет подсказок инициализирован для', inited, 'полей');
  }

  function runCleanRequest(button, addressEl, prefix) {
    var address = (addressEl && addressEl.value) ? addressEl.value.trim() : '';
    if (!address) {
      alert((config.messages && config.messages.enterAddress) ? config.messages.enterAddress : 'Введите адрес в поле «Адрес».');
      return;
    }
    var label = button.textContent;
    button.disabled = true;
    button.textContent = (config.messages && config.messages.loading) ? config.messages.loading : 'Проверка…';

    var formData = new FormData();
    formData.append('action', 'dadata_clean_address');
    formData.append('nonce', nonce);
    formData.append('address', address);

    fetch(ajaxUrl, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        button.disabled = false;
        button.textContent = label;
        if (res.success && res.data) {
          fillFields(res.data, prefix);
        } else {
          alert((res && res.error) ? res.error : 'Не удалось проверить адрес.');
        }
      })
      .catch(function () {
        button.disabled = false;
        button.textContent = label;
        alert((config.messages && config.messages.error) || 'Ошибка сети.');
      });
  }

  function initButtons() {
    if (!ajaxUrl || !nonce) return;
    var form = getForm();
    var buttons = form ? form.querySelectorAll('[data-dadata-check-address]') : [];
    var prefixes = ['billing', 'shipping'];
    prefixes.forEach(function (prefix) {
      var addressEl = getField(prefix, 'address_1');
      if (!addressEl) return;
      var btn = form ? form.querySelector('[data-dadata-check-address][data-address-prefix="' + prefix + '"]') : null;
      if (!btn) return;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        runCleanRequest(btn, addressEl, prefix);
      });
    });
  }

  // ── Phone mask (checkout only) ────────────────────────────────────────────

  function initPhoneMask() {
    if (!isCheckout || !checkoutPhoneMask) return;
    var phoneInputs = document.querySelectorAll('input#billing_phone');
    if (!phoneInputs.length) return;

    function getNumbers(input) { return input.value.replace(/\D/g, ''); }

    function onPaste(e) {
      var pasted = e.clipboardData || window.clipboardData;
      if (pasted && /\D/g.test(pasted.getData('Text'))) {
        e.target.value = getNumbers(e.target);
      }
    }

    function onKeyDown(e) {
      if (e.keyCode === 8 && getNumbers(e.target).length === 1) e.target.value = '';
    }

    function onInput(e) {
      var input = e.target, nums = getNumbers(input), sel = input.selectionStart, formatted = '';
      if (!nums) { input.value = ''; return; }
      if (input.value.length !== sel) {
        if (e.data && /\D/g.test(e.data)) input.value = nums;
        return;
      }
      if (['7', '8', '9'].indexOf(nums[0]) > -1) {
        if (nums[0] === '9') nums = '7' + nums;
        formatted = (nums[0] === '8' ? '8' : '+7') + ' ';
        if (nums.length > 1) formatted += '(' + nums.substring(1, 4);
        if (nums.length >= 5) formatted += ') ' + nums.substring(4, 7);
        if (nums.length >= 8) formatted += '-' + nums.substring(7, 9);
        if (nums.length >= 10) formatted += '-' + nums.substring(9, 11);
      } else {
        formatted = '+' + nums.substring(0, 16);
      }
      input.value = formatted;
    }

    [].forEach.call(phoneInputs, function (input) {
      input.addEventListener('keydown', onKeyDown);
      input.addEventListener('input', onInput);
      input.addEventListener('paste', onPaste);
    });
    if (debug) log('Маска телефона инициализирована для', phoneInputs.length, 'полей');
  }

  function init() {
    initSuggestionsWidget();
    initButtons();
    initPhoneMask();
  }

  function run() {
    log('run(), readyState:', document.readyState);
    var form = getForm();
    log('Форма найдена:', !!form, form ? form.className : '-');
    log('#billing_address_1 в DOM:', !!document.getElementById('billing_address_1'));
    log('input[name=billing_address_1] в DOM:', !!document.querySelector('input[name="billing_address_1"]'));

    init();
    setTimeout(function () {
      log('Повтор initSuggestionsWidget (300 мс)');
      initSuggestionsWidget();
    }, 300);
    setTimeout(function () {
      log('Повтор initSuggestionsWidget (800 мс)');
      initSuggestionsWidget();
    }, 800);
  }

  if (document.readyState === 'loading') {
    log('Ожидание DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  // WooCommerce: при обновлении чекаута заново инициализировать подсказки (как в плагине dadata-ru)
  if (typeof jQuery !== 'undefined') {
    jQuery(document.body).on('updated_checkout', function () {
      initSuggestionsWidget();
    });
  }
})();
