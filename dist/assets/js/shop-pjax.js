/**
 * Shop PJAX
 *
 * Перехватывает клики по ссылкам с классом .pjax-link на страницах магазина,
 * загружает контент через fetch с заголовком X-PJAX и заменяет содержимое
 * #shop-pjax-wrapper (page header + товары + сайдбар) без полной перезагрузки.
 *
 * document.title обновляется из атрибута data-page-title нового контента.
 *
 * После замены DOM диспатчит событие 'cw:pjax:complete' для реинициализации
 * модулей (price slider и др.).
 */
(function () {
	'use strict';

	const CONTAINER_ID   = 'shop-pjax-wrapper';
	const LOADING_CLASS  = 'shop-pjax-loading';
	const SPINNER_CLASS  = 'shop-pjax-spinner';

	/**
	 * Получить высоту sticky-хедера.
	 * @returns {number}
	 */
	function getHeaderOffset() {
		const stickyHeader = document.querySelector(
			'.navbar.fixed-top, .navbar.sticky-top, header.fixed-top, header.sticky-top'
		);
		return stickyHeader ? stickyHeader.offsetHeight : 0;
	}

	/**
	 * Показать spinner в центре видимой части контейнера.
	 * @param {HTMLElement} container
	 * @returns {HTMLElement}
	 */
	function showSpinner( container ) {
		const el = document.createElement( 'div' );
		el.className = SPINNER_CLASS;
		el.innerHTML = '<div class="spinner"></div>';

		const rect        = container.getBoundingClientRect();
		const headerOffset = getHeaderOffset();
		const visibleTop  = Math.max( headerOffset, rect.top );
		const visibleBottom = Math.min( window.innerHeight, rect.bottom );
		const centerY     = ( visibleTop + visibleBottom ) / 2;
		const centerX     = rect.left + rect.width / 2;

		el.style.top  = centerY + 'px';
		el.style.left = centerX + 'px';

		document.body.appendChild( el );
		return el;
	}

	/**
	 * Убрать spinner.
	 * @param {HTMLElement} el
	 */
	function hideSpinner( el ) {
		if ( el && el.parentNode ) {
			el.parentNode.removeChild( el );
		}
	}

	/**
	 * Найти PJAX-контейнер.
	 * @returns {HTMLElement|null}
	 */
	function getContainer() {
		return document.getElementById( CONTAINER_ID );
	}

	/**
	 * Обновить document.title из атрибута data-page-title нового контейнера.
	 * @param {HTMLElement} container
	 */
	function updateDocTitle( container ) {
		const title = container.getAttribute( 'data-page-title' );
		if ( title ) {
			document.title = title;
		}
	}

	/**
	 * Загрузить URL через PJAX и заменить контент контейнера.
	 * @param {string} url
	 */
	function pjaxLoad( url ) {
		const container = getContainer();
		if ( ! container ) {
			window.location.href = url;
			return;
		}

		container.classList.add( LOADING_CLASS );
		const spinner = showSpinner( container );

		fetch( url, {
			headers: {
				'X-PJAX': 'true',
				'X-Requested-With': 'XMLHttpRequest',
			},
			credentials: 'same-origin',
		} )
			.then( function ( response ) {
				if ( ! response.ok ) {
					throw new Error( 'Network response was not ok' );
				}
				return response.text();
			} )
			.then( function ( html ) {
				// Парсим ответ и извлекаем новый контейнер
				const tmp = document.createElement( 'div' );
				tmp.innerHTML = html;
				const newContainer = tmp.firstElementChild;

				// Заменяем содержимое
				container.innerHTML = newContainer ? newContainer.innerHTML : html;

				// Обновляем data-page-title и document.title
				if ( newContainer ) {
					const newTitle = newContainer.getAttribute( 'data-page-title' );
					if ( newTitle ) {
						container.setAttribute( 'data-page-title', newTitle );
						document.title = newTitle;
					}
				}

				history.pushState( { pjax: true, url: url }, document.title, url );
				container.classList.remove( LOADING_CLASS );
				hideSpinner( spinner );
				initIsotope( container );
				initPriceSliders();

				// Оповещаем другие модули о завершении PJAX-навигации
				document.dispatchEvent( new CustomEvent( 'cw:pjax:complete', { bubbles: true } ) );

				// Скролл к верху контейнера с отступом под sticky-хедер
				const containerTop = container.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset() - 16;
				window.scrollTo( { top: containerTop, behavior: 'smooth' } );
			} )
			.catch( function () {
				hideSpinner( spinner );
				window.location.href = url;
			} );
	}

	/**
	 * Инициализировать Isotope в контейнере.
	 * Уничтожает существующий инстанс (masonry из theme.js), затем создаёт
	 * fitRows и дожидается imagesLoaded перед финальным layout.
	 * @param {HTMLElement} container
	 */
	function initIsotope( container ) {
		const grid = container.querySelector( '.isotope' );
		if ( ! grid ) return;

		if ( typeof window.Isotope === 'undefined' ) return;

		// Уничтожаем инстанс masonry, созданный theme.js при первой загрузке
		const existing = window.Isotope.data( grid );
		if ( existing ) {
			existing.destroy();
		}

		const doLayout = function () {
			new window.Isotope( grid, {
				itemSelector: '.item',
				layoutMode: 'fitRows',
			} );
		};

		if ( typeof window.imagesLoaded !== 'undefined' ) {
			window.imagesLoaded( grid, doLayout );
		} else {
			doLayout();
		}
	}

	// ==========================================================================
	// Price range slider (native dual <input type="range">)
	// ==========================================================================

	/**
	 * Инициализировать все ценовые слайдеры на странице.
	 * Безопасно вызывается повторно после PJAX-обновления.
	 */
	function initPriceSliders() {
		const panels = document.querySelectorAll( '.cw-filter-price' );
		panels.forEach( initSinglePriceSlider );
	}

	/**
	 * Инициализировать один ценовой слайдер.
	 * @param {HTMLElement} panel
	 */
	function initSinglePriceSlider( panel ) {
		const rangeMin = panel.querySelector( '.cw-range-min' );
		const rangeMax = panel.querySelector( '.cw-range-max' );
		const rangeBar = panel.querySelector( '.cw-price-range' );
		const inputMin = panel.querySelector( '.cw-price-input--min' );
		const inputMax = panel.querySelector( '.cw-price-input--max' );

		if ( ! rangeMin || ! rangeMax ) return;

		// Помечаем как инициализированный
		if ( panel.dataset.sliderInit ) return;
		panel.dataset.sliderInit = '1';

		const absMin = parseFloat( panel.dataset.min ) || 0;
		const absMax = parseFloat( panel.dataset.max ) || 100;

		/** Построить URL с текущими min/max ценами */
		function buildUrl( min, max ) {
			const params = new URLSearchParams( window.location.search );
			params.set( 'min_price', Math.round( min ) );
			params.set( 'max_price', Math.round( max ) );
			params.delete( 'paged' );
			params.delete( 'page' );
			return window.location.pathname + '?' + params.toString();
		}

		/** Обновить цветную полосу трека */
		function updateBar( min, max ) {
			if ( ! rangeBar ) return;
			const pctMin = ( ( min - absMin ) / ( absMax - absMin ) ) * 100;
			const pctMax = ( ( max - absMin ) / ( absMax - absMin ) ) * 100;
			rangeBar.style.left  = pctMin + '%';
			rangeBar.style.width = ( pctMax - pctMin ) + '%';
		}

		/** Слайдер двигается — обновить поля и полосу (без навигации) */
		function onSliderInput() {
			let min = parseFloat( rangeMin.value );
			let max = parseFloat( rangeMax.value );

			if ( min > max ) { rangeMin.value = max; min = max; }
			if ( max < min ) { rangeMax.value = min; max = min; }

			updateBar( min, max );

			if ( inputMin ) inputMin.value = Math.round( min );
			if ( inputMax ) inputMax.value = Math.round( max );
		}

		/** Слайдер отпущен — навигация */
		function onSliderChange() {
			const min = parseFloat( rangeMin.value );
			const max = parseFloat( rangeMax.value );
			pjaxLoad( buildUrl( min, max ) );
		}

		/** Поле ввода изменено — обновить слайдер и перейти */
		function onInputChange() {
			let min = Math.max( absMin, Math.min( absMax, parseFloat( inputMin ? inputMin.value : rangeMin.value ) || absMin ) );
			const max = Math.max( absMin, Math.min( absMax, parseFloat( inputMax ? inputMax.value : rangeMax.value ) || absMax ) );

			if ( min > max ) { min = max; }

			rangeMin.value = min;
			rangeMax.value = max;
			if ( inputMin ) inputMin.value = Math.round( min );
			if ( inputMax ) inputMax.value = Math.round( max );

			updateBar( min, max );
			pjaxLoad( buildUrl( min, max ) );
		}

		rangeMin.addEventListener( 'input',  onSliderInput );
		rangeMax.addEventListener( 'input',  onSliderInput );
		rangeMin.addEventListener( 'change', onSliderChange );
		rangeMax.addEventListener( 'change', onSliderChange );

		if ( inputMin ) {
			inputMin.addEventListener( 'change', onInputChange );
			inputMin.addEventListener( 'keydown', function( e ) { if ( e.key === 'Enter' ) { e.preventDefault(); onInputChange(); } } );
		}
		if ( inputMax ) {
			inputMax.addEventListener( 'change', onInputChange );
			inputMax.addEventListener( 'keydown', function( e ) { if ( e.key === 'Enter' ) { e.preventDefault(); onInputChange(); } } );
		}

		// Первичная расстановка полосы
		updateBar( parseFloat( rangeMin.value ), parseFloat( rangeMax.value ) );
	}

	/**
	 * Простое форматирование цены (используется только для live-отображения).
	 * Полное форматирование через wc_price() остаётся на сервере.
	 * @param {number} value
	 * @returns {string}
	 */
	function formatPrice( value ) {
		return Math.round( value ).toLocaleString( document.documentElement.lang || 'ru' );
	}

	// ==========================================================================
	// Init
	// ==========================================================================

	/**
	 * Инициализация при первой загрузке страницы.
	 * Ждём document.fonts.ready чтобы шрифты были готовы до расчёта высот,
	 * иначе двухстрочные заголовки ломают masonry-раскладку из theme.js.
	 */
	document.addEventListener( 'DOMContentLoaded', function () {
		const container = getContainer();
		if ( container ) {
			const run = function () { initIsotope( container ); };

			if ( document.fonts && document.fonts.ready ) {
				document.fonts.ready.then( run );
			} else {
				run();
			}

			initPriceSliders();
		}

		// Работает независимо от наличия PJAX-контейнера
		initFilterLimits();
	} );

	/**
	 * Перехват сортировки WooCommerce через PJAX.
	 */
	document.addEventListener( 'change', function ( e ) {
		const select = e.target.closest( 'select.orderby' );
		if ( ! select ) return;
		e.stopPropagation();
		const form = select.closest( 'form' );
		if ( ! form ) return;
		const url = new URL( form.action || window.location.href );
		url.search = new URLSearchParams( new FormData( form ) ).toString();
		pjaxLoad( url.toString() );
	}, true ); // capture phase

	/**
	 * Делегированный обработчик кликов — работает и после PJAX-замены контента.
	 */
	document.addEventListener( 'click', function ( e ) {
		const link = e.target.closest( '.pjax-link' );
		if ( ! link ) return;

		if ( link.hostname !== window.location.hostname ) return;
		if ( e.ctrlKey || e.metaKey || e.shiftKey ) return;

		e.preventDefault();
		pjaxLoad( link.href );
	} );

	/**
	 * Обработка браузерных кнопок Back/Forward.
	 */
	window.addEventListener( 'popstate', function ( e ) {
		if ( e.state && e.state.pjax ) {
			pjaxLoad( window.location.href );
		}
	} );

	// ── Filter limit: show-more by count or height ─────────────────────────

	/**
	 * Инициализирует «Показать ещё» для фильтров с data-limit-type.
	 * Вызывается при загрузке страницы и после каждого PJAX-обновления.
	 */
	function initFilterLimits() {
		document.querySelectorAll( '.cw-filter-limit[data-limit-type]' ).forEach( function ( el ) {
			// Не инициализировать повторно
			if ( el.dataset.cwLimitInit ) return;
			el.dataset.cwLimitInit = '1';

			const type      = el.dataset.limitType;
			const limit     = parseInt( el.dataset.limit, 10 );
			const moreText  = el.dataset.showMore || 'Показать ещё';
			const lessText  = el.dataset.showLess || 'Свернуть';

			if ( isNaN( limit ) || limit <= 0 ) return;

			const btn = document.createElement( 'button' );
			btn.type = 'button';
			btn.className = 'cw-filter-more-btn';

			if ( type === 'count' ) {
				// Убираем pre-render CSS (PHP добавил для скрытия без FOUC), JS берёт управление
				const preStyle = el.id ? document.getElementById( el.id + '-css' ) : null;
				if ( preStyle ) { preStyle.parentNode.removeChild( preStyle ); }

				const items = el.querySelectorAll( ':scope > ul > li, :scope > .d-flex > *' );
				const hideable = Array.prototype.slice.call( items, limit );

				if ( hideable.length === 0 ) return;

				hideable.forEach( function ( item ) { item.hidden = true; } );
				btn.textContent = moreText + ' (' + hideable.length + ')';

				btn.addEventListener( 'click', function () {
					const isOpen = ! hideable[ 0 ].hidden;
					hideable.forEach( function ( item ) { item.hidden = isOpen; } );
					btn.textContent = isOpen
						? moreText + ' (' + hideable.length + ')'
						: lessText;
				} );

				el.appendChild( btn );

			} else if ( type === 'height' ) {
				// Set initial max-height
				el.style.maxHeight = limit + 'px';

				// No overflow — no link needed
				if ( el.scrollHeight <= limit ) return;

				const link = document.createElement( 'a' );
				link.href = '#';
				link.className = 'cw-filter-more-btn';
				link.textContent = moreText;

				link.addEventListener( 'click', function ( e ) {
					e.preventDefault();
					const isOpen = el.classList.contains( 'is-open' );
					if ( isOpen ) {
						el.classList.remove( 'is-open' );
						el.style.maxHeight = limit + 'px';
						link.textContent = moreText;
					} else {
						el.classList.add( 'is-open' );
						el.style.maxHeight = el.scrollHeight + 'px';
						link.textContent = lessText;
					}
				} );

				// Ссылка — ПОСЛЕ контейнера (overflow:hidden обрезал бы её внутри)
				el.insertAdjacentElement( 'afterend', link );
			}
		} );
	}

	document.addEventListener( 'cw:pjax:complete', function () {
		// Reset init flags so limits are re-applied to fresh DOM
		document.querySelectorAll( '.cw-filter-limit[data-cw-limit-init]' ).forEach( function ( el ) {
			delete el.dataset.cwLimitInit;
		} );
		initFilterLimits();
	} );

} )();
