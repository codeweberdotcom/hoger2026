/**
 * Share Buttons - Floating Social Share Widget
 * Адаптировано под Bootstrap и Unicons
 */

(function() {
	'use strict';
	
	document.addEventListener('DOMContentLoaded', function() {
		// Находим все виджеты на странице
		const shareButtonsWidgets = document.querySelectorAll('.share-buttons');
		
		if (shareButtonsWidgets.length === 0) {
			return;
		}
		
		// Инициализируем каждый виджет отдельно
		shareButtonsWidgets.forEach(function(shareButtons, widgetIndex) {
			// Ищем основную кнопку - может быть share-button-main или share-icon-main
			const shareButtonMain = shareButtons.querySelector('.share-button-main') || shareButtons.querySelector('.share-icon-main');
			const shareButtonIcon = shareButtonMain ? shareButtonMain.querySelector('i') : null;
			
			if (!shareButtonMain) {
				return;
			}
			
			// Обработчик клика на главную кнопку
			shareButtonMain.addEventListener('click', function(e) {
				e.preventDefault();
				e.stopPropagation();
				
				// Проверяем, нужно ли применять вращение (не применяем для типа button)
				const noRotate = shareButtonMain.classList.contains('no-rotate');
				
				if (!noRotate) {
					const isRotating = shareButtonMain.classList.contains('rotate');
					
					if (isRotating) {
						// Закрытие - обратный поворот
						shareButtonMain.classList.remove('rotate');
						shareButtonMain.classList.add('rotate-reverse');
						
						// Удаляем класс обратной анимации после завершения
						setTimeout(function() {
							shareButtonMain.classList.remove('rotate-reverse');
						}, 600);
					} else {
						// Открытие - прямой поворот
						shareButtonMain.classList.remove('rotate-reverse');
						shareButtonMain.classList.add('rotate');
					}
				}
				
				// Переключаем класс open для показа/скрытия социальных кнопок
				const isOpen = shareButtons.classList.contains('open');
				
				if (isOpen) {
					// Закрытие - меняем иконку обратно на comment-dots
					if (shareButtonIcon) {
						// Сохраняем все классы кроме классов uil и uil-*
						const allClasses = shareButtonIcon.className.split(' ');
						const preservedClasses = allClasses.filter(function(cls) {
							return cls !== 'uil' && !cls.startsWith('uil-');
						});
						shareButtonIcon.className = preservedClasses.join(' ') + ' uil uil-comment-dots';
					}
					
					// Закрытие - сначала запускаем анимацию исчезновения
					shareButtons.classList.add('closing');
					
					// Удаляем open после небольшой задержки, чтобы closing успел примениться
					setTimeout(function() {
						shareButtons.classList.remove('open');
					}, 10);
					
					// После завершения анимации убираем класс closing
					setTimeout(function() {
						shareButtons.classList.remove('closing');
					}, 500);
				} else {
					// Открытие - меняем иконку на times
					if (shareButtonIcon) {
						// Сохраняем все классы кроме классов uil и uil-*
						const allClasses = shareButtonIcon.className.split(' ');
						const preservedClasses = allClasses.filter(function(cls) {
							return cls !== 'uil' && !cls.startsWith('uil-');
						});
						shareButtonIcon.className = preservedClasses.join(' ') + ' uil uil-times';
					}
					
					// Открытие - убираем класс closing если был и добавляем open
					shareButtons.classList.remove('closing');
					shareButtons.classList.add('open');
				}
			});
		});
		
		// Закрытие при клике вне области кнопок (для всех виджетов)
		// Используем задержку, чтобы обработчик клика на кнопке сработал первым
		document.addEventListener('click', function(e) {
			// Небольшая задержка, чтобы обработчик клика на кнопке успел сработать
			setTimeout(function() {
				// Пропускаем клики на кнопках виджетов и внутри виджетов
				let clickedOnWidget = false;
				shareButtonsWidgets.forEach(function(shareButtons) {
					// Проверяем, был ли клик внутри виджета (включая кнопку и иконку)
					if (shareButtons.contains(e.target)) {
						clickedOnWidget = true;
					}
				});
				
				if (clickedOnWidget) {
					return;
				}
				
				shareButtonsWidgets.forEach(function(shareButtons, widgetIndex) {
					const isOpen = shareButtons.classList.contains('open');
					const containsTarget = shareButtons.contains(e.target);
					
					if (isOpen && !containsTarget) {
						// Ищем основную кнопку - может быть share-button-main или share-icon-main
						const shareButtonMain = shareButtons.querySelector('.share-button-main') || shareButtons.querySelector('.share-icon-main');
						const shareButtonIcon = shareButtonMain ? shareButtonMain.querySelector('i') : null;
						
						if (!shareButtonMain) {
							return;
						}
						
						// Проверяем, нужно ли применять вращение (не применяем для типа button)
						const noRotate = shareButtonMain.classList.contains('no-rotate');
						if (!noRotate) {
							shareButtonMain.classList.remove('rotate');
							shareButtonMain.classList.add('rotate-reverse');
						}
						
						// Закрытие - меняем иконку обратно на comment-dots
						if (shareButtonIcon) {
							// Сохраняем все классы кроме классов uil и uil-*
							const allClasses = shareButtonIcon.className.split(' ');
							const preservedClasses = allClasses.filter(function(cls) {
								return cls !== 'uil' && !cls.startsWith('uil-');
							});
							shareButtonIcon.className = preservedClasses.join(' ') + ' uil uil-comment-dots';
						}
						
						// Закрытие - сначала запускаем анимацию исчезновения
						shareButtons.classList.add('closing');
						
						// Удаляем open после небольшой задержки
						setTimeout(function() {
							shareButtons.classList.remove('open');
						}, 10);
						
						// После завершения анимации убираем класс closing
						setTimeout(function() {
							shareButtons.classList.remove('closing');
						}, 500);
						
						// Удаляем класс обратной анимации после завершения
						setTimeout(function() {
							shareButtonMain.classList.remove('rotate-reverse');
						}, 600);
					}
				});
			}, 10); // Небольшая задержка для обработчика клика на кнопке
		});
	});
})();

