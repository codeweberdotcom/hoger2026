/* global cwReview, CWNotify, wc_single_product_params */
/**
 * WooCommerce AJAX Review Submission
 *
 * Паттерн: wishlist.js (jQuery + CWNotify)
 * Перехват в capture-фазе — блокирует нативный alert() WooCommerce.
 */
( function ( $ ) {
	'use strict';

	var $form = $( '#review_form .comment-form' );
	if ( ! $form.length ) return;

	// Отключаем браузерную нативную валидацию (required-тултипы у кнопки).
	// Всю валидацию берём на себя — JS + сервер.
	$form.attr( 'novalidate', 'novalidate' );

	// capture:true — наш обработчик срабатывает ДО jQuery-хендлера WooCommerce
	$form[ 0 ].addEventListener( 'submit', function ( e ) {
		e.preventDefault();
		e.stopPropagation();

		var ratingVal  = $form.find( '#rating' ).val();
		var isRequired = ( typeof wc_single_product_params !== 'undefined' )
			? wc_single_product_params.review_rating_required === 'yes'
			: true;

		if ( isRequired && ! ratingVal ) {
			if ( typeof CWNotify !== 'undefined' ) {
				CWNotify.show( cwReview.i18n.ratingRequired, { type: 'danger', event: 'review' } );
			}
			return;
		}

		var $submitBtn = $form.find( '[type="submit"]' );
		$submitBtn.prop( 'disabled', true ).addClass( 'loading' );

		$.ajax( {
			url:    cwReview.ajaxUrl,
			method: 'POST',
			data:   {
				action:          'cw_submit_review',
				nonce:           cwReview.nonce,
				comment_post_ID: $form.find( '#comment_post_ID' ).val(),
				comment:         $form.find( '#comment' ).val(),
				rating:          ratingVal,
				author:          $form.find( '#author' ).val(),
				email:           $form.find( '#email' ).val(),
			},
			success: function ( response ) {
				if ( response.success ) {
					if ( typeof CWNotify !== 'undefined' ) {
						CWNotify.show( response.data.message, { type: 'success', event: 'review' } );
					}

					if ( response.data.status === 'approved' && response.data.html ) {
						var $list = $( '.commentlist' );
						if ( $list.length ) {
							$list.prepend( response.data.html );
						} else {
							var $newList = $( '<ol class="commentlist"></ol>' ).html( response.data.html );
							var $noReviews = $( '.woocommerce-noreviews' );
							if ( $noReviews.length ) {
								$noReviews.replaceWith( $newList );
							} else {
								$( '#comments' ).prepend( $newList );
							}
						}
					}

					$form[ 0 ].reset();

					// Сброс WC stars UI
					$form.find( '.stars' )
						.removeClass( 'selected' )
						.find( 'a' ).removeClass( 'active' );

				} else {
					var errMsg = ( response.data && response.data.message )
						? response.data.message
						: cwReview.i18n.error;
					if ( typeof CWNotify !== 'undefined' ) {
						CWNotify.show( errMsg, { type: 'danger', event: 'review' } );
					}
				}
			},
			error: function () {
				if ( typeof CWNotify !== 'undefined' ) {
					CWNotify.show( cwReview.i18n.error, { type: 'danger', event: 'review' } );
				}
			},
			complete: function () {
				$submitBtn.prop( 'disabled', false ).removeClass( 'loading' );
			},
		} );

	}, true ); // true = capture phase

} )( jQuery );
