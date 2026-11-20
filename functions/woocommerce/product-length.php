<?php
/**
 * Product length line on single product pages ("Length: 3000 mm").
 *
 * Plinths and profiles are sold as bars. The bar length (mm) is stored in the
 * ACF field `mod_len`; the same value feeds the EPO price / weight formulas
 * through the [acf_field] shortcode, so the length shown here always matches
 * what the calculator uses.
 *
 * ACF saves `mod_len` (default 3000) on EVERY product, so the line is limited
 * to the plinth / profile categories (and their sub-categories).
 *
 * The same value is handed to the "Hoger EPO Summary" plugin (row "Длина изделия"
 * of the selection summary) through the hoger_epo_summary_length filter.
 *
 * Filters:
 * - hoger_product_length_categories (array)  product_cat slugs that show the length.
 * - hoger_product_length_mm (int, int)       length in mm, product ID.
 *
 * @package hoger
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Slugs of the product categories (with sub-categories) that show the length.
 *
 * @return string[]
 */
function hoger_product_length_categories(): array {
	$slugs = apply_filters( 'hoger_product_length_categories', array( 'plintus', 'profil' ) );

	return array_values( array_filter( array_map( 'sanitize_title', (array) $slugs ) ) );
}

/**
 * Term IDs of those categories and all their descendants.
 *
 * @return int[]
 */
function hoger_product_length_term_ids(): array {
	static $term_ids = null;

	if ( null !== $term_ids ) {
		return $term_ids;
	}

	$term_ids = array();
	foreach ( hoger_product_length_categories() as $slug ) {
		$term = get_term_by( 'slug', $slug, 'product_cat' );
		if ( ! $term || is_wp_error( $term ) ) {
			continue;
		}
		$term_ids[] = (int) $term->term_id;
		$children   = get_term_children( $term->term_id, 'product_cat' );
		if ( is_array( $children ) ) {
			$term_ids = array_merge( $term_ids, array_map( 'intval', $children ) );
		}
	}
	$term_ids = array_values( array_unique( $term_ids ) );

	return $term_ids;
}

/**
 * Length of the product in mm, or 0 when it must not be shown.
 *
 * @param int $product_id Product ID.
 * @return int
 */
function hoger_get_product_length_mm( $product_id ): int {
	$product_id = (int) $product_id;
	$term_ids   = hoger_product_length_term_ids();

	if ( $product_id <= 0 || empty( $term_ids ) || ! has_term( $term_ids, 'product_cat', $product_id ) ) {
		return 0;
	}

	$value = function_exists( 'get_field' )
		? get_field( 'mod_len', $product_id )
		: get_post_meta( $product_id, 'mod_len', true );

	if ( ! is_numeric( $value ) ) {
		return 0;
	}

	$mm = (int) apply_filters( 'hoger_product_length_mm', (int) round( (float) $value ), $product_id );

	return max( 0, $mm );
}

/**
 * Print the length line right before the add-to-cart form.
 *
 * Runs on the single product page and in the quick view.
 */
function hoger_render_product_length(): void {
	global $product;

	if ( ! $product instanceof WC_Product ) {
		return;
	}

	$mm = hoger_get_product_length_mm( $product->get_id() );
	if ( $mm <= 0 ) {
		return;
	}

	printf(
		'<p class="hoger-product-length mb-3">%s</p>',
		esc_html( sprintf( __( 'Length: %s mm', 'hoger' ), $mm ) )
	);
}
add_action( 'woocommerce_before_add_to_cart_form', 'hoger_render_product_length', 5 );

/**
 * Give the length (mm) to the selection summary of the Hoger EPO Summary plugin.
 *
 * @param int $mm         Length so far (0 = unknown).
 * @param int $product_id Product ID.
 * @return int
 */
function hoger_filter_epo_summary_length( $mm, $product_id ) {
	$length = hoger_get_product_length_mm( $product_id );

	return $length > 0 ? $length : (int) $mm;
}
add_filter( 'hoger_epo_summary_length', 'hoger_filter_epo_summary_length', 10, 2 );
