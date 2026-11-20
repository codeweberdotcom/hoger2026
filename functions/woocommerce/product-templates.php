<?php
/**
 * Product page templates of the hoger theme.
 *
 * The chooser ("Product template" box in the product editor) and the loader live in the
 * parent theme (codeweber, functions/woocommerce/product-template.php). Here the
 * hoger-specific templates are registered; their files are in
 * woocommerce/single-product-templates/{slug}.php.
 *
 * @package hoger
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_filter( 'codeweber_product_templates', 'hoger_register_product_templates' );
/**
 * Register the hoger product page templates.
 *
 * @param array<string,string> $templates Slug => label.
 * @return array<string,string>
 */
function hoger_register_product_templates( $templates ) {
	$templates['description-under-image'] = __( 'Description under the image', 'hoger' );

	return $templates;
}
