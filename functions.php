<?php
/**
 * hoger functions and definitions
 *
 * @package hoger
 */

require_once get_stylesheet_directory() . '/functions/cpt/surfaces.php';
require_once get_stylesheet_directory() . '/functions/cpt/partners.php';
require_once get_stylesheet_directory() . '/functions/cpt/cpt-models.php';
require_once get_stylesheet_directory() . '/functions/cpt/cpt-models-new.php';
require_once get_stylesheet_directory() . '/functions/settings/models-new-settings.php';
require_once get_stylesheet_directory() . '/functions/meta/surfaces-meta.php';
require_once get_stylesheet_directory() . '/functions/meta/partners-meta.php';
require_once get_stylesheet_directory() . '/functions/meta/models-meta.php';
require_once get_stylesheet_directory() . '/functions/meta/models-new-meta.php';
require_once get_stylesheet_directory() . '/functions/blocks/surfaces-block/render.php';
require_once get_stylesheet_directory() . '/functions/shortcodes/partners-shortcode.php';

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

// ─── Three.js importmap (head, on single models and models_new) ───────────

add_action( 'wp_head', 'hoger_threejs_importmap', 1 );
function hoger_threejs_importmap() {
	if ( ! is_singular( 'models' ) && ! is_singular( 'models_new' ) ) {
		return;
	}
	?>
	<script type="importmap">
	{
		"imports": {
			"three": "https://cdn.jsdelivr.net/npm/three@0.173.0/build/three.module.js",
			"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.173.0/examples/jsm/"
		}
	}
	</script>
	<?php
}

// ─── Three.js init scripts ─────────────────────────────────────────────────

add_action( 'wp_enqueue_scripts', 'hoger_enqueue_threejs' );
function hoger_enqueue_threejs() {
	if ( is_singular( 'models' ) || is_singular( 'models_new' ) ) {
		wp_enqueue_script(
			'hoger-threejs-fry',
			get_stylesheet_directory_uri() . '/functions/integrations/threejs/three-fry.js',
			[],
			wp_get_theme()->get( 'Version' ),
			false
		);
	}
}

// ─── Three.js importmap + scripts in admin (models_new edit screen) ──────

add_action( 'admin_head', 'hoger_threejs_admin_importmap' );
function hoger_threejs_admin_importmap() {
	$screen = get_current_screen();
	if ( ! $screen || ! in_array( $screen->post_type, [ 'models', 'models_new' ], true ) ) {
		return;
	}
	if ( ! in_array( $screen->base, [ 'post', 'post-new' ], true ) ) {
		return;
	}
	?>
	<script type="importmap">
	{
		"imports": {
			"three": "https://cdn.jsdelivr.net/npm/three@0.173.0/build/three.module.js",
			"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.173.0/examples/jsm/"
		}
	}
	</script>
	<?php
}

add_action( 'admin_enqueue_scripts', 'hoger_enqueue_threejs_admin' );
function hoger_enqueue_threejs_admin( $hook ) {
	if ( ! in_array( $hook, [ 'post.php', 'post-new.php' ], true ) ) {
		return;
	}
	$screen = get_current_screen();
	if ( ! $screen || ! in_array( $screen->post_type, [ 'models', 'models_new' ], true ) ) {
		return;
	}
	wp_enqueue_script(
		'hoger-threejs-fry-admin',
		get_stylesheet_directory_uri() . '/functions/integrations/threejs/three-fry-admin.js',
		[],
		wp_get_theme()->get( 'Version' ),
		true
	);
	wp_localize_script( 'hoger-threejs-fry-admin', 'wpApiSettings', [
		'root'  => esc_url_raw( rest_url() ),
		'nonce' => wp_create_nonce( 'wp_rest' ),
	] );
}

add_filter( 'script_loader_tag', 'hoger_threejs_module_type', 10, 2 );
function hoger_threejs_module_type( $tag, $handle ) {
	if ( ! in_array( $handle, [ 'hoger-threejs', 'hoger-threejs-fry', 'hoger-threejs-fry-admin' ], true ) ) {
		return $tag;
	}
	$tag = str_replace( "type='text/javascript'", '', $tag );
	$tag = str_replace( 'type="text/javascript"', '', $tag );
	return str_replace( '<script ', '<script type="module" ', $tag );
}

add_action( 'wp_enqueue_scripts', 'hoger_enqueue_styles' );
function hoger_enqueue_styles() {
    wp_enqueue_style( 'hoger-style',
        get_stylesheet_directory_uri() . '/style.css',
        array( 'codeweber-style' ),
        wp_get_theme()->get('Version')
    );
}
