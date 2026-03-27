/**
 * Universal AJAX Filter
 *
 * Универсальный фильтр для вакансий, постов, товаров, staff, событий.
 * Использует систему fetch/ (endpoint: fetch_action, actionType: filterPosts).
 *
 * Использование:
 * 1. Добавьте класс .codeweber-filter-form к форме фильтрации
 * 2. Добавьте data-* атрибуты:
 *    - data-post-type="vacancies"
 *    - data-template="vacancies_1" (опционально)
 *    - data-container=".vacancies-container"
 * 3. Добавьте name к полям формы (name = ключ фильтра)
 *
 * Пример:
 * <form class="codeweber-filter-form" data-post-type="vacancies" data-template="vacancies_1" data-container=".vacancies-results">
 *   <select name="vacancy_type">...</select>
 * </form>
 */

(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', function () {
		const filterForms = document.querySelectorAll('.codeweber-filter-form');

		if (!filterForms.length) {
			return;
		}

		if (typeof fetch_vars === 'undefined') {
			console.error('fetch_vars is not defined. Make sure fetch-handler.js is enqueued properly.');
			return;
		}

		filterForms.forEach(function (form) {
			initFilterForm(form);
		});
	});

	function initFilterForm(form) {
		const postType          = form.getAttribute('data-post-type');
		const template          = form.getAttribute('data-template') || '';
		const containerSelector = form.getAttribute('data-container') || '.filter-results';
		const container         = document.querySelector(containerSelector);

		if (!postType) {
			console.error('data-post-type attribute is required on filter form');
			return;
		}

		if (!container) {
			console.error('Container not found:', containerSelector);
			return;
		}

		const filterFields = form.querySelectorAll('[data-filter-name], select[name], input[name]');

		filterFields.forEach(function (field) {
			const fieldType = field.tagName.toLowerCase();

			if (fieldType === 'select') {
				field.addEventListener('change', function () {
					performFilter(form, postType, template, container);
				});
			} else if (fieldType === 'input') {
				const inputType = field.getAttribute('type');

				if (inputType === 'checkbox' || inputType === 'radio') {
					field.addEventListener('change', function () {
						performFilter(form, postType, template, container);
					});
				} else if (inputType === 'text' || inputType === 'number') {
					let timeout;
					field.addEventListener('input', function () {
						clearTimeout(timeout);
						timeout = setTimeout(function () {
							performFilter(form, postType, template, container);
						}, 500);
					});
				}
			}
		});

		form.addEventListener('submit', function (e) {
			e.preventDefault();
			performFilter(form, postType, template, container);
		});

		if (form.getAttribute('data-load-on-init') === 'true') {
			performFilter(form, postType, template, container);
		}
	}

	async function performFilter(form, postType, template, container) {
		const filters = collectFilters(form);

		showLoading(container);

		const formData = new FormData();
		formData.append('action', 'fetch_action');
		formData.append('nonce', fetch_vars.nonce);
		formData.append('actionType', 'filterPosts');
		formData.append('params', JSON.stringify({
			post_type: postType,
			template:  template,
			filters:   filters,
		}));

		try {
			const response = await fetch(fetch_vars.ajaxurl, {
				method: 'POST',
				body:   formData,
			});

			const result = await response.json();

			hideLoading(container);

			if (result.status === 'success') {
				container.innerHTML = result.data.html;

				updateURL(filters);

				document.dispatchEvent(new CustomEvent('codeweber:filter:updated', {
					detail: {
						postType:   postType,
						filters:    filters,
						foundPosts: result.data.found_posts,
					},
				}));
			} else {
				showError(container, result.message || 'Error filtering content');
			}
		} catch (error) {
			hideLoading(container);
			showError(container, error.message || 'Network error');
			console.error('Filter error:', error);
		}
	}

	function collectFilters(form) {
		const filters      = {};
		const filterFields = form.querySelectorAll('[data-filter-name], select[name], input[name]');

		filterFields.forEach(function (field) {
			const filterName = field.getAttribute('data-filter-name') || field.getAttribute('name');

			if (!filterName) {
				return;
			}

			const fieldType = field.tagName.toLowerCase();
			let value       = '';

			if (fieldType === 'select') {
				value = field.value;
			} else if (fieldType === 'input') {
				const inputType = field.getAttribute('type');

				if (inputType === 'checkbox' || inputType === 'radio') {
					if (field.checked) {
						value = field.value;
					} else {
						return;
					}
				} else {
					value = field.value;
				}
			}

			if (value) {
				filters[filterName] = value;
			}
		});

		return filters;
	}

	function showLoading(container) {
		const position = window.getComputedStyle(container).position;
		if (position === 'static' || !position) {
			container.style.position = 'relative';
		}
		container.classList.add('filter-loading');
	}

	function hideLoading(container) {
		container.classList.remove('filter-loading');
		container.style.pointerEvents = '';
	}

	function showError(container, message) {
		const label = (typeof codeweberFilter !== 'undefined' && codeweberFilter.translations?.error)
			? codeweberFilter.translations.error
			: 'Error';
		container.innerHTML = '<div class="alert alert-danger">' + label + ': ' + message + '</div>';
	}

	function updateURL(filters) {
		const url = new URL(window.location.href);

		url.searchParams.forEach(function (value, key) {
			if (key.startsWith('filter_')) {
				url.searchParams.delete(key);
			}
		});

		Object.keys(filters).forEach(function (key) {
			url.searchParams.set('filter_' + key, filters[key]);
		});

		window.history.pushState({}, '', url);
	}
})();
