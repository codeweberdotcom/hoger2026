/* global cwWishlist, CWNotify */
(function () {
	'use strict';

	var CWWishlist = {

		init: function () {
			this.updateCountWidget( cwWishlist.count || 0 );
			this.bindEvents();
			this.initTooltips();
		},

		initTooltips: function () {
			if ( typeof bootstrap === 'undefined' || typeof bootstrap.Tooltip === 'undefined' ) return;
			document.querySelectorAll( '.cw-wishlist-card [data-bs-toggle="white-tooltip"], .cw-wishlist-card [data-bs-toggle="tooltip"]' ).forEach( function ( el ) {
				var existing = bootstrap.Tooltip.getInstance( el );
				if ( existing ) existing.dispose();
				new bootstrap.Tooltip( el, {
					customClass: el.getAttribute( 'data-bs-toggle' ) === 'white-tooltip' ? 'white-tooltip' : '',
					trigger: 'hover',
					placement: el.dataset.bsPlacement || 'left',
				} );
			} );
		},

		bindEvents: function () {
			document.addEventListener( 'click', function ( e ) {
				var btn = e.target.closest( '.cw-wishlist-btn' );
				if ( btn ) {
					e.preventDefault();
					CWWishlist.handleToggle( btn );
					return;
				}

				var removeBtn = e.target.closest( '.cw-wishlist-remove' );
				if ( removeBtn ) {
					e.preventDefault();
					CWWishlist.handleRemove( removeBtn );
				}
			} );
		},

		handleToggle: function ( btn ) {
			if ( btn.classList.contains( 'cw-wishlist-btn--active' ) ) {
				if ( btn.classList.contains( 'cw-wishlist-btn--single' ) ) {
					window.location.href = cwWishlist.wishlistUrl;
				} else {
					CWWishlist.handleRemove( btn );
				}
				return;
			}

			if ( cwWishlist.isLoggedIn !== 'yes' && cwWishlist.guestsAllowed !== 'yes' ) {
				if ( typeof CWNotify !== 'undefined' ) {
					CWNotify.show( cwWishlist.i18n.loginNotice, { type: 'warning', event: 'wishlist' } );
				}
				window.location.href = cwWishlist.loginUrl;
				return;
			}

			var productId = btn.dataset.productId;
			if ( ! productId ) return;

			var feedback        = cwWishlist.feedbackType || 'spinner';
			var showSpinner     = ( feedback === 'spinner' || feedback === 'modal' );
			var showCardSpinner = ( feedback === 'card' );
			var showModal       = ( feedback === 'modal' );
			var showToast       = ( cwWishlist.showToast === 'yes' );

			var card = null;
			if ( showCardSpinner ) {
				card = btn.closest( 'figure' )
					|| btn.closest( '[id^="product-"]' )
					|| btn.closest( 'li.product, article.product, .product, li' );

				if ( card ) {
					var spinner = document.createElement( 'div' );
					spinner.className = 'cw-card-spinner spinner spinner-overlay';
					card.appendChild( spinner );
				} else {
					showCardSpinner = false;
					showSpinner     = true;
				}
			}

			if ( showCardSpinner && card ) {
				btn.disabled = true;
			} else if ( showSpinner ) {
				btn.classList.add( 'cw-wishlist-btn--loading' );
				btn.disabled = true;
			}

			fetch( cwWishlist.ajaxUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams( {
					action:     'cw_add_to_wishlist',
					nonce:      cwWishlist.nonce,
					product_id: productId,
				} ),
			} )
				.then( function ( r ) { return r.json(); } )
				.then( function ( response ) {
					if ( response.success ) {
						CWWishlist.markAdded( btn );
						CWWishlist.updateCountWidget( response.data.count );
						if ( showModal ) {
							CWWishlist.showWishlistModal( response.data.product_name || '' );
						}
						if ( showToast && typeof CWNotify !== 'undefined' ) {
							CWNotify.show( cwWishlist.i18n.added, { type: 'success', event: 'wishlist' } );
						}
					}
				} )
				.finally( function () {
					if ( showCardSpinner && card ) {
						var s = card.querySelector( '.cw-card-spinner' );
						if ( s ) s.remove();
					}
					btn.classList.remove( 'cw-wishlist-btn--loading' );
					btn.disabled = false;
				} );
		},

		handleRemove: function ( btn ) {
			var productId = btn.dataset.productId;
			if ( ! productId ) return;

			var spinnerHost = null;

			var wishlistCard = btn.closest( '.cw-wishlist-card' );
			if ( wishlistCard ) {
				spinnerHost = wishlistCard.querySelector( 'figure' );
			} else {
				var feedback = cwWishlist.feedbackType || 'spinner';
				if ( feedback === 'card' || feedback === 'card-toast' ) {
					spinnerHost = btn.closest( 'figure' )
						|| btn.closest( '[id^="product-"]' )
						|| btn.closest( 'li.product, article.product, .product, li' );
				}
			}

			if ( spinnerHost ) {
				var spinner = document.createElement( 'div' );
				spinner.className = 'cw-card-spinner spinner spinner-overlay';
				spinnerHost.appendChild( spinner );
				btn.disabled = true;
			} else {
				btn.classList.add( 'cw-wishlist-btn--loading' );
				btn.disabled = true;
			}

			fetch( cwWishlist.ajaxUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams( {
					action:     'cw_remove_from_wishlist',
					nonce:      cwWishlist.nonce,
					product_id: productId,
				} ),
			} )
				.then( function ( r ) { return r.json(); } )
				.then( function ( response ) {
					if ( response.success ) {
						CWWishlist.removeCard( productId );
						CWWishlist.updateCountWidget( response.data.count );
						var showToast = ( cwWishlist.showToast === 'yes' );
						if ( showToast && typeof CWNotify !== 'undefined' ) {
							CWNotify.show( cwWishlist.i18n.removed, { type: 'info', event: 'wishlist' } );
						}
					}
				} )
				.finally( function () {
					if ( spinnerHost ) {
						var s = spinnerHost.querySelector( '.cw-card-spinner' );
						if ( s ) s.remove();
					}
					btn.classList.remove( 'cw-wishlist-btn--loading' );
					btn.disabled = false;
				} );
		},

		markAdded: function ( btn ) {
			btn.classList.add( 'cw-wishlist-btn--active' );
			btn.setAttribute( 'href', cwWishlist.wishlistUrl );
			btn.setAttribute( 'title', cwWishlist.i18n.added );
			btn.setAttribute( 'aria-label', cwWishlist.i18n.added );
			var label = btn.querySelector( '.cw-wishlist-label' );
			if ( label ) label.textContent = cwWishlist.i18n.added;
		},

		removeCard: function ( productId ) {
			var card = document.querySelector( '.cw-wishlist-card[data-product-id="' + productId + '"]' );
			if ( card ) {
				card.style.transition = 'opacity .2s';
				card.style.opacity    = '0';
				setTimeout( function () {
					card.remove();
					if ( ! document.querySelector( '.cw-wishlist-card' ) ) {
						CWWishlist.showEmptyState();
					}
				}, 200 );
			}

			document.querySelectorAll( '.cw-wishlist-btn[data-product-id="' + productId + '"]' ).forEach( function ( btn ) {
				btn.classList.remove( 'cw-wishlist-btn--active' );
				btn.setAttribute( 'href', '#' );
				btn.setAttribute( 'title', cwWishlist.i18n.add );
				btn.setAttribute( 'aria-label', cwWishlist.i18n.add );
				var label = btn.querySelector( '.cw-wishlist-label' );
				if ( label ) label.textContent = cwWishlist.i18n.add;
			} );
		},

		showEmptyState: function () {
			var grid = document.querySelector( '.cw-wishlist-grid' );
			if ( ! grid ) return;
			var empty = document.createElement( 'div' );
			empty.className = 'cw-wishlist-empty';
			empty.innerHTML =
				'<p>' + ( cwWishlist.i18n.emptyText || 'Your wishlist is empty.' ) + '</p>' +
				'<a href="' + ( cwWishlist.shopUrl || '/shop/' ) + '" class="btn btn-primary">' +
					( cwWishlist.i18n.goToShop || 'Go to Shop' ) +
				'</a>';
			grid.replaceWith( empty );
		},

		getModal: function () {
			if ( this._modal ) return this._modal;

			var i18n      = cwWishlist.i18n || {};
			var btnShape  = cwWishlist.btnShape || '';
			var el        = document.createElement( 'div' );
			el.className  = 'modal fade';
			el.id         = 'cwWishlistModal';
			el.tabIndex   = -1;
			el.setAttribute( 'aria-hidden', 'true' );
			el.innerHTML  =
				'<div class="modal-dialog modal-dialog-centered modal-sm">' +
					'<div class="modal-content">' +
						'<div class="modal-body text-center p-5">' +
							'<div class="mb-4"><i class="uil uil-heart-alt fs-60 text-red" aria-hidden="true"></i></div>' +
							'<h5 class="mb-1">' + ( i18n.addedTitle || 'Added to Wishlist' ) + '</h5>' +
							'<p class="text-ash text-break mb-5 cw-wishlist-modal__name"></p>' +
							'<div class="d-flex gap-2 justify-content-center flex-wrap">' +
								'<button type="button" class="btn btn-sm btn-outline-ash has-ripple' + (btnShape ? ' ' + btnShape : '') + '" data-bs-dismiss="modal">' +
									( i18n.continueShopping || 'Continue Shopping' ) +
								'</button>' +
								'<a href="' + cwWishlist.wishlistUrl + '" class="btn btn-sm btn-primary has-ripple' + (btnShape ? ' ' + btnShape : '') + '">' +
									( i18n.goToWishlist || 'Go to Wishlist' ) +
								'</a>' +
							'</div>' +
						'</div>' +
					'</div>' +
				'</div>';

			document.body.appendChild( el );
			this._modal = el;
			return el;
		},

		showWishlistModal: function ( productName ) {
			var el     = this.getModal();
			var nameEl = el.querySelector( '.cw-wishlist-modal__name' );
			if ( nameEl ) nameEl.textContent = productName || '';

			if ( typeof bootstrap !== 'undefined' && bootstrap.Modal ) {
				bootstrap.Modal.getOrCreateInstance( el ).show();
			}
		},

		updateCountWidget: function ( count ) {
			document.querySelectorAll( '.cw-wishlist-widget__count' ).forEach( function ( el ) {
				el.textContent    = count;
				el.style.display  = count > 0 ? '' : 'none';
			} );
		},
	};

	document.addEventListener( 'DOMContentLoaded', function () {
		if ( typeof cwWishlist !== 'undefined' ) {
			CWWishlist.init();
		}
	} );

} )();
