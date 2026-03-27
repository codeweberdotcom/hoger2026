/**
 * AJAX загрузка файлов для документов
 * 
 * Использует REST API для получения URL файла и программно инициирует загрузку
 * 
 * @package Codeweber
 */

(function() {
    'use strict';

    /**
     * AJAX загрузка файла документа
     * 
     * @param {number} postId - ID поста документа
     * @param {string} fileName - Имя файла (опционально)
     * @param {HTMLElement} button - Кнопка загрузки (для обновления состояния)
     * @param {function} onSuccess - Callback при успехе
     * @param {function} onError - Callback при ошибке
     */
    function ajaxDownloadFile(postId, fileName, button, onSuccess, onError) {
        // Проверяем наличие wpApiSettings
        if (typeof wpApiSettings === 'undefined') {
            console.error('wpApiSettings is not defined. Make sure restapi.js is loaded.');
            if (onError) {
                onError(new Error('wpApiSettings is not defined'));
            }
            return;
        }

            // Сохраняем оригинальное содержимое кнопки
            let originalHTML = '';
            let originalDisabled = false;
            let originalMinHeight = '';
            if (button) {
                originalHTML = button.innerHTML;
                originalDisabled = button.disabled;
                originalMinHeight = button.style.minHeight || '';
                
                // Сохраняем текущую высоту кнопки
                const currentHeight = button.offsetHeight;
                if (currentHeight > 0) {
                    button.style.minHeight = currentHeight + 'px';
                }
                
                button.disabled = true;
                
                // Показываем индикатор загрузки - сохраняем структуру кнопки
                const defaultLoadingText = typeof codeweberDownload !== 'undefined' ? codeweberDownload.loadingText : 'Loading...';
                const loadingText = button.dataset.loadingText || defaultLoadingText;
                // Ищем существующую иконку для сохранения структуры
                const icon = button.querySelector('i');
                const span = button.querySelector('span');
                
                if (icon) {
                    // Сохраняем размер иконки (fs-13 или другой), заменяем только иконку на спиннер
                    const iconSize = icon.className.match(/fs-\d+/);
                    const iconSizeClass = iconSize ? iconSize[0] : 'fs-13';
                    
                    // Заменяем иконку на спиннер с сохранением размера и добавляем отступ справа
                    icon.className = 'uil uil-spinner-alt uil-spin ' + iconSizeClass;
                    if (!icon.classList.contains('me-1')) {
                        icon.classList.add('me-1');
                    }
                    
                    // Удаляем span обертку, если есть
                    if (span) {
                        span.remove();
                    }
                    
                    // Добавляем текст загрузки напрямую в кнопку после иконки
                    // Удаляем все текстовые узлы после иконки
                    let node = icon.nextSibling;
                    while (node) {
                        const next = node.nextSibling;
                        if (node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SPAN')) {
                            node.remove();
                        }
                        node = next;
                    }
                    
                    // Добавляем новый текстовый узел с текстом загрузки
                    button.appendChild(document.createTextNode(loadingText));
                } else {
                    // Если структуры нет, создаем с правильным размером без span
                    button.innerHTML = '<i class="uil uil-spinner-alt uil-spin fs-13 me-1"></i>' + loadingText;
                }
            }

        // Получаем URL файла через REST API
        fetch(wpApiSettings.root + 'codeweber/v1/documents/' + postId + '/download-url', {
            method: 'GET',
            headers: {
                'X-WP-Nonce': wpApiSettings.nonce,
                'Content-Type': 'application/json'
            }
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Failed to get file URL: ' + response.status);
            }
            return response.json();
        })
        .then(function(data) {
            if (data.success && data.file_url) {
                // Программно инициируем загрузку
                const link = document.createElement('a');
                link.href = data.file_url;
                link.download = fileName || data.file_name || 'download';
                link.target = '_blank';
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                
                // Удаляем ссылку после небольшой задержки
                setTimeout(function() {
                    document.body.removeChild(link);
                }, 100);

                // Восстанавливаем кнопку
                if (button) {
                    button.disabled = originalDisabled;
                    button.innerHTML = originalHTML;
                    if (originalMinHeight) {
                        button.style.minHeight = originalMinHeight;
                    } else {
                        button.style.minHeight = '';
                    }
                }

                // Вызываем callback успеха
                if (onSuccess) {
                    onSuccess(data);
                }
            } else {
                throw new Error('Invalid response from server');
            }
        })
        .catch(function(error) {
            console.error('Download error:', error);

            // Восстанавливаем кнопку
            if (button) {
                button.disabled = originalDisabled;
                button.innerHTML = originalHTML;
                if (originalMinHeight) {
                    button.style.minHeight = originalMinHeight;
                } else {
                    button.style.minHeight = '';
                }
            }

            // Вызываем callback ошибки
            if (onError) {
                onError(error);
                } else {
                    // Показываем уведомление об ошибке
                    const errorText = typeof codeweberDownload !== 'undefined' ? codeweberDownload.errorText : 'Error downloading file. Please try again.';
                    alert(errorText);
                }
        });
    }

    /**
     * Инициализация обработчиков для всех кнопок загрузки
     */
    function initAjaxDownload() {
        // Проверяем наличие wpApiSettings
        if (typeof wpApiSettings === 'undefined') {
            console.warn('AJAX Download: wpApiSettings is not defined. Make sure restapi.js is loaded.');
        }
        
        // Используем делегирование событий для работы с динамически добавленными кнопками
        // Используем capture phase для перехвата события до того, как оно достигнет других обработчиков
        document.addEventListener('click', function(e) {
            // Проверяем, был ли клик на кнопке или внутри неё (иконка, span и т.д.)
            const downloadBtn = e.target.closest('.ajax-download');
            
            if (downloadBtn) {
                
                // ОСТАНОВКА ВСПЫТИЯ И ПРЕДОТВРАЩЕНИЕ ПЕРЕХОДА - ДОЛЖНО БЫТЬ ПЕРВЫМ
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                // Дополнительная проверка - если это button, отключаем стандартное поведение
                if (downloadBtn.tagName === 'BUTTON') {
                    downloadBtn.type = 'button'; // Убеждаемся что это не submit
                }

                const postId = downloadBtn.dataset.postId || downloadBtn.dataset.documentId;

                if (postId) {
                    ajaxDownloadFile(
                        parseInt(postId),
                        null, // Имя файла получаем из API
                        downloadBtn,
                        function(data) {
                            // Опционально: показать уведомление об успехе
                            
                            // Можно добавить аналитику
                            if (typeof gtag !== 'undefined') {
                                gtag('event', 'file_download', {
                                    'file_name': data.file_name,
                                    'post_id': data.post_id
                                });
                            }
                        },
                        function(error) {
                            console.error('Download failed:', error);
                        }
                    );
                } else {
                    console.error('Post ID not found in download button');
                }
                
                // Возвращаем false для дополнительной защиты
                return false;
            }
        }, true); // Используем capture phase (true) для перехвата ДО других обработчиков
        
        // Дополнительный обработчик на самой кнопке для гарантии
        document.addEventListener('click', function(e) {
            if (e.target.closest && e.target.closest('.ajax-download')) {
                const btn = e.target.closest('.ajax-download');
                if (btn.tagName === 'BUTTON' || btn.classList.contains('ajax-download')) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }
            }
        }, true);
    }

    // Инициализация с проверкой wpApiSettings
    function initWhenReady() {
        // Ждем, пока wpApiSettings будет доступен
        if (typeof wpApiSettings === 'undefined') {
            // Пробуем еще раз через небольшую задержку
            setTimeout(initWhenReady, 100);
            return;
        }
        
        // wpApiSettings доступен, инициализируем
        initAjaxDownload();
    }
    
    // Инициализация при загрузке DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWhenReady);
    } else {
        // Если DOM уже загружен, инициализируем сразу
        initWhenReady();
    }
    
    // Также инициализируем после полной загрузки страницы (на случай динамического контента)
    window.addEventListener('load', function() {
        if (typeof wpApiSettings !== 'undefined' && typeof initAjaxDownload !== 'undefined') {
            // Убедимся, что обработчик работает
        }
    });

    // Экспортируем функцию для использования в других скриптах
    if (typeof window !== 'undefined') {
        window.ajaxDownloadFile = ajaxDownloadFile;
    }
})();

