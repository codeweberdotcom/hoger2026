/**
 * WooCommerce Variation Swatches — Frontend
 *
 * Handles swatch click/keyboard, syncs with WooCommerce variation JS,
 * and updates disabled states reactively after variation changes.
 *
 * Dependencies: jquery, wc-add-to-cart-variation (loaded by WooCommerce)
 */

( function ( $ ) {
	'use strict';

	// OOS behavior setting passed from PHP via wp_localize_script
	const cwSwatchesSettings = window.cwSwatchesSettings || { oos_behavior: 'cross' };

	// ── Init ──────────────────────────────────────────────────────────────────

	$( function () {
		$( '.variations_form' ).each( function () {
			initSwatchForm( $( this ) );
		} );
	} );

	// Динамическая инициализация — для AJAX-контента (quick view и др.)
	$( document.body ).on( 'cw_init_swatches', function ( e, $form ) {
		initSwatchForm( $form );
	} );

	/**
	 * Bind all swatch events for one variation form.
	 *
	 * @param {jQuery} $form  .variations_form element
	 */
	function initSwatchForm( $form ) {

		// ── Swatch click ─────────────────────────────────────────────────────

		$form.on( 'click', '.cw-swatch:not(.disabled)', function ( e ) {
			e.preventDefault();
			const $swatch = $( this );
			const $swatches = $swatch.closest( '.cw-swatches' );
			const attrName  = $swatches.data( 'attribute_name' ); // e.g. "attribute_pa_color"
			const value     = $swatch.data( 'value' );
			const $select   = $form.find( '[name="' + attrName + '"]' );

			if ( $swatch.hasClass( 'selected' ) ) {
				// Deselect on second click
				$swatch.removeClass( 'selected active' ).attr( 'aria-pressed', 'false' );
				$select.val( '' ).trigger( 'change' );
			} else {
				$swatches.find( '.cw-swatch.selected' )
					.removeClass( 'selected active' )
					.attr( 'aria-pressed', 'false' );
				$swatch.addClass( 'selected active' ).attr( 'aria-pressed', 'true' );
				$select.val( value ).trigger( 'change' );
			}
		} );

		// ── Keyboard: Space / Enter ───────────────────────────────────────────

		$form.on( 'keydown', '.cw-swatch', function ( e ) {
			if ( e.key === ' ' || e.key === 'Enter' ) {
				e.preventDefault();
				$( this ).trigger( 'click' );
			}
		} );

		// ── Sync swatches when select changes externally ──────────────────────
		// Covers: page load with pre-selected value, WooCommerce reset, URL hash.

		$form.on( 'change', 'select', function () {
			const $select   = $( this );
			const attrName  = $select.attr( 'name' );
			const val       = $select.val();
			const $swatches = $form.find( '.cw-swatches[data-attribute_name="' + attrName + '"]' );

			if ( ! $swatches.length ) {
				return;
			}

			$swatches.find( '.cw-swatch' )
				.removeClass( 'selected active' )
				.attr( 'aria-pressed', 'false' );

			if ( val ) {
				$swatches.find( '.cw-swatch[data-value="' + val + '"]' )
					.addClass( 'selected active' )
					.attr( 'aria-pressed', 'true' );
			}
		} );

		// ── Sync swatches on WooCommerce reset_data ───────────────────────────
		// Fires when WooCommerce can't find a variation (partial selection) OR
		// when the "Clear" link is clicked (all selects become empty).
		// We sync visual state with the actual select values so that attributes
		// still carrying a value keep their selection ring.

		$form.on( 'reset_data', function () {
			$form.find( '.cw-swatches' ).each( function () {
				const $swatches = $( this );
				const attrName  = $swatches.data( 'attribute_name' );
				const $select   = $form.find( '[name="' + attrName + '"]' );
				const val       = $select.val();

				$swatches.find( '.cw-swatch' )
					.removeClass( 'selected active' )
					.attr( 'aria-pressed', 'false' );

				if ( val ) {
					$swatches.find( '.cw-swatch[data-value="' + val + '"]' )
						.addClass( 'selected active' )
						.attr( 'aria-pressed', 'true' );
				}
			} );

			$form.find( '.cw-swatch.disabled' )
				.removeClass( 'disabled oos-blur oos-cross' );
		} );

		// ── Update disabled states after WooCommerce finds a variation ────────
		// woocommerce_variation_has_changed fires after the form re-evaluates.

		$form.on( 'woocommerce_variation_has_changed', function () {
			updateDisabledSwatches( $form );
		} );

		// Run once on init to mark any pre-disabled swatches
		updateDisabledSwatches( $form );
	}

	// ── Disabled-state logic ──────────────────────────────────────────────────

	/**
	 * Inspect WooCommerce's variation data and mark unavailable swatches.
	 *
	 * WooCommerce stores `data-product_variations` JSON on the form (or loads
	 * via AJAX). We iterate variation data to determine which attribute values
	 * lead to at least one purchasable variation.
	 *
	 * @param {jQuery} $form
	 */
	function updateDisabledSwatches( $form ) {
		const variationData = $form.data( 'product_variations' );

		// AJAX mode: variation data not yet available — skip (WooCommerce will
		// call woocommerce_variation_has_changed when data arrives).
		if ( ! variationData || ! variationData.length ) {
			return;
		}

		// Build map: taxonomy → Set of available slugs
		const available = {};

		for ( let i = 0; i < variationData.length; i++ ) {
			const v = variationData[ i ];
			if ( ! v.is_purchasable ) {
				continue;
			}
			const attrs = v.attributes; // { attribute_pa_color: 'red', ... }
			for ( const key in attrs ) {
				if ( ! attrs.hasOwnProperty( key ) ) {
					continue;
				}
				const slug = attrs[ key ];
				if ( ! available[ key ] ) {
					available[ key ] = {};
				}
				if ( slug === '' ) {
					// Empty string = "any" — all values for this attribute are available
					available[ key ].__any = true;
				} else {
					available[ key ][ slug ] = true;
				}
			}
		}

		const oosClass  = 'oos-' + cwSwatchesSettings.oos_behavior;

		$form.find( '.cw-swatches' ).each( function () {
			const $swatches = $( this );
			const attrName  = $swatches.data( 'attribute_name' ); // "attribute_pa_color"
			const attrMap   = available[ attrName ];

			$swatches.find( '.cw-swatch' ).each( function () {
				const $swatch = $( this );
				const slug    = $swatch.data( 'value' );
				let isOos   = false;

				if ( attrMap ) {
					isOos = ! attrMap.__any && ! attrMap[ slug ];
				}

				if ( isOos ) {
					$swatch.addClass( 'disabled ' + oosClass );
				} else {
					$swatch.removeClass( 'disabled oos-blur oos-cross' );
				}
			} );
		} );
	}

} )( jQuery );
