<?php
/**
 * hoger functions and definitions
 *
 * @package hoger
 */

require_once get_stylesheet_directory() . '/functions/cpt/surfaces.php';
require_once get_stylesheet_directory() . '/functions/cpt/partners.php';
require_once get_stylesheet_directory() . '/functions/cpt/cpt-models.php';
require_once get_stylesheet_directory() . '/functions/settings/models-new-settings.php';
require_once get_stylesheet_directory() . '/functions/meta/surfaces-meta.php';
require_once get_stylesheet_directory() . '/functions/meta/partners-meta.php';
require_once get_stylesheet_directory() . '/functions/meta/models-meta.php';
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

// ─── Three.js importmap (head, on single models) ──────────────────────────

add_action( 'wp_head', 'hoger_threejs_importmap', 1 );
function hoger_threejs_importmap() {
	if ( ! is_singular( 'models' ) ) {
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
	if ( is_singular( 'models' ) ) {
		wp_enqueue_script(
			'hoger-threejs-fry',
			get_stylesheet_directory_uri() . '/functions/integrations/threejs/three-fry.js',
			[],
			wp_get_theme()->get( 'Version' ),
			false
		);
		wp_enqueue_script(
			'hoger-threejs-configurator',
			get_stylesheet_directory_uri() . '/functions/integrations/threejs/three-configurator.js',
			[],
			wp_get_theme()->get( 'Version' ),
			true
		);
	}
}

// ─── Three.js importmap + scripts in admin (models edit screen) ───────────

add_action( 'admin_head', 'hoger_threejs_admin_importmap' );
function hoger_threejs_admin_importmap() {
	$screen = get_current_screen();
	if ( ! $screen || $screen->post_type !== 'models' ) {
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
	if ( ! $screen || $screen->post_type !== 'models' ) {
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
	if ( ! in_array( $handle, [ 'hoger-threejs', 'hoger-threejs-fry', 'hoger-threejs-fry-admin', 'hoger-threejs-configurator' ], true ) ) {
		return $tag;
	}
	$tag = str_replace( "type='text/javascript'", '', $tag );
	$tag = str_replace( 'type="text/javascript"', '', $tag );
	return str_replace( '<script ', '<script type="module" ', $tag );
}

// ─── Surfaces configurator data helper ────────────────────────────────────

function hoger_get_surfaces_json() {
	$posts = get_posts( [
		'post_type'      => 'surfaces',
		'post_status'    => 'publish',
		'posts_per_page' => -1,
		'orderby'        => 'menu_order title',
		'order'          => 'ASC',
	] );

	$data = [];
	foreach ( $posts as $post ) {
		$main_id    = (int) get_post_meta( $post->ID, 'osnovnoe_foto', true );
		$main_photo = $main_id ? wp_get_attachment_image_url( $main_id, 'thumbnail' ) : '';
		$count      = (int) get_post_meta( $post->ID, 'czveta', true );

		$finish_map = [
			'matte'  => [ 'roughness' => 0.9,  'metalness' => 0.0  ],
			'satin'  => [ 'roughness' => 0.4,  'metalness' => 0.05 ],
			'gloss'  => [ 'roughness' => 0.05, 'metalness' => 0.05 ],
			'chrome' => [ 'roughness' => 0.05, 'metalness' => 1.0  ],
		];

		$finish = get_post_meta( $post->ID, 'finish', true ) ?: 'matte';
		$mat    = $finish_map[ $finish ] ?? $finish_map['matte'];

		$colors = [];
		for ( $i = 0; $i < $count; $i++ ) {
			$name     = get_post_meta( $post->ID, "czveta_{$i}_nazvanie_czveta", true );
			$photo_id = (int) get_post_meta( $post->ID, "czveta_{$i}_foto_czveta", true );
			$photo    = $photo_id ? wp_get_attachment_url( $photo_id ) : '';
			if ( $photo ) {
				$colors[] = [
					'name'  => $name ?: __( 'Color', 'hoger' ) . ' ' . ( $i + 1 ),
					'photo' => $photo,
					'thumb' => $photo_id ? ( wp_get_attachment_image_url( $photo_id, 'thumbnail' ) ?: $photo ) : $photo,
				];
			}
		}

		if ( ! empty( $colors ) ) {
			$uv_val = get_post_meta( $post->ID, 'use_model_uv', true );

			$refl_mask_id = (int) get_post_meta( $post->ID, 'reflection_mask_id', true );
			$bump_map_id  = (int) get_post_meta( $post->ID, 'bump_map_id', true );

			$data[] = [
				'title'             => get_the_title( $post ),
				'main_photo'        => $main_photo,
				'colors'            => $colors,
				'roughness'         => $mat['roughness'],
				'metalness'         => $mat['metalness'],
				'useModelUv'        => ( $uv_val !== '0' ),
				'repeatX'           => (float) ( get_post_meta( $post->ID, 'repeat_x', true ) ?: 1 ),
				'repeatY'           => (float) ( get_post_meta( $post->ID, 'repeat_y', true ) ?: 1 ),
				'rotation'          => (float) ( get_post_meta( $post->ID, 'rotation', true ) ?: 0 ),
				'reflectionMask'    => $refl_mask_id ? wp_get_attachment_url( $refl_mask_id ) : '',
				'reflectionStrength'=> (float) ( get_post_meta( $post->ID, 'reflection_strength', true ) ?: 1 ),
				'bumpMap'           => $bump_map_id ? wp_get_attachment_url( $bump_map_id ) : '',
				'bumpScale'         => (float) ( get_post_meta( $post->ID, 'bump_scale', true ) ?: 1 ),
			];
		}
	}

	return wp_json_encode( $data, JSON_UNESCAPED_UNICODE );
}

add_action( 'wp_enqueue_scripts', 'hoger_enqueue_styles' );
function hoger_enqueue_styles() {
    wp_enqueue_style( 'hoger-style',
        get_stylesheet_directory_uri() . '/style.css',
        array( 'codeweber-style' ),
        wp_get_theme()->get('Version')
    );

	if ( is_singular( 'models' ) ) {
		wp_add_inline_style( 'hoger-style', '
			.hoger-surface-type-btn,
			.hoger-surface-color-btn {
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 4px;
				padding: 6px;
				border: 2px solid transparent;
				border-radius: 8px;
				background: #fff;
				cursor: pointer;
				transition: border-color .15s, box-shadow .15s;
				font-size: 11px;
				color: #444;
				width: 80px;
				text-align: center;
				line-height: 1.3;
			}
			.hoger-surface-type-btn img,
			.hoger-surface-color-btn img {
				width: 64px;
				height: 64px;
				object-fit: cover;
				border-radius: 5px;
				display: block;
			}
			.hoger-surface-type-btn:hover,
			.hoger-surface-color-btn:hover {
				border-color: #9c886f;
			}
			.hoger-surface-type-btn.is-active,
			.hoger-surface-color-btn.is-active {
				border-color: #9c886f;
				box-shadow: 0 0 0 2px #9c886f44;
			}
			.hoger-conf-empty {
				color: #999;
				font-size: 13px;
			}
		' );
	}
}

// ─── Allow GLB / GLTF uploads ─────────────────────────────────────────────

add_filter( 'upload_mimes', 'hoger_allow_3d_mimes' );
function hoger_allow_3d_mimes( $mimes ) {
	$mimes['glb']  = 'model/gltf-binary';
	$mimes['gltf'] = 'model/gltf+json';
	$mimes['hdr']  = 'image/vnd.radiance';
	return $mimes;
}

add_filter( 'wp_check_filetype_and_ext', 'hoger_allow_3d_filetype', 10, 4 );
function hoger_allow_3d_filetype( $data, $file, $filename, $mimes ) {
	$ext = strtolower( pathinfo( $filename, PATHINFO_EXTENSION ) );
	if ( $ext === 'glb' ) {
		$data['ext']  = 'glb';
		$data['type'] = 'model/gltf-binary';
	} elseif ( $ext === 'gltf' ) {
		$data['ext']  = 'gltf';
		$data['type'] = 'model/gltf+json';
	} elseif ( $ext === 'hdr' ) {
		$data['ext']  = 'hdr';
		$data['type'] = 'image/vnd.radiance';
	}
	return $data;
}
