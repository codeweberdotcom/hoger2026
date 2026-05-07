<?php
/**
 * hoger functions and definitions
 *
 * @package hoger
 */

require_once get_stylesheet_directory() . '/functions/cpt/surfaces.php';
require_once get_stylesheet_directory() . '/functions/cpt/partners.php';
require_once get_stylesheet_directory() . '/functions/meta/surfaces-meta.php';
require_once get_stylesheet_directory() . '/functions/meta/partners-meta.php';
require_once get_stylesheet_directory() . '/functions/blocks/surfaces-block/render.php';

add_action( 'init', 'hoger_register_surfaces_block' );
function hoger_register_surfaces_block() {
	wp_register_script(
		'hoger-surfaces-block-editor',
		get_stylesheet_directory_uri() . '/functions/blocks/surfaces-block/index.js',
		[ 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-server-side-render', 'wp-i18n', 'wp-api-fetch' ],
		wp_get_theme()->get( 'Version' )
	);

	register_block_type( 'hoger/surfaces', [
		'editor_script'   => 'hoger-surfaces-block-editor',
		'render_callback' => 'hoger_render_surfaces_block',
		'attributes'      => [
			'postId'     => [ 'type' => 'number', 'default' => 0 ],
			'shape'      => [ 'type' => 'string', 'default' => 'square' ],
			'gridType'   => [ 'type' => 'string', 'default' => 'columns-grid' ],
			'gutterX'    => [ 'type' => 'string', 'default' => '4' ],
			'gutterY'    => [ 'type' => 'string', 'default' => '4' ],
			'rowColsXs'  => [ 'type' => 'string', 'default' => '2' ],
			'rowColsSm'  => [ 'type' => 'string', 'default' => '' ],
			'rowColsMd'  => [ 'type' => 'string', 'default' => '3' ],
			'rowColsLg'  => [ 'type' => 'string', 'default' => '' ],
			'rowColsXl'  => [ 'type' => 'string', 'default' => '6' ],
			'rowColsXxl' => [ 'type' => 'string', 'default' => '' ],
			'colXs'      => [ 'type' => 'string', 'default' => '6' ],
			'colSm'      => [ 'type' => 'string', 'default' => '' ],
			'colMd'      => [ 'type' => 'string', 'default' => '4' ],
			'colLg'      => [ 'type' => 'string', 'default' => '' ],
			'colXl'      => [ 'type' => 'string', 'default' => '2' ],
			'colXxl'     => [ 'type' => 'string', 'default' => '' ],
		],
	] );
}

add_action( 'wp_enqueue_scripts', 'hoger_enqueue_styles' );
function hoger_enqueue_styles() {
    wp_enqueue_style( 'hoger-style',
        get_stylesheet_directory_uri() . '/style.css',
        array( 'codeweber-style' ),
        wp_get_theme()->get('Version')
    );
}
