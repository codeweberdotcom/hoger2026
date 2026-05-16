<?php

add_action( 'init', 'hoger_register_cpt_models' );
function hoger_register_cpt_models() {
	register_post_type( 'models', [
		'labels' => [
			'name'               => __( '3D Models', 'hoger' ),
			'singular_name'      => __( '3D Model', 'hoger' ),
			'add_new'            => __( 'Add New', 'hoger' ),
			'add_new_item'       => __( 'Add New 3D Model', 'hoger' ),
			'edit_item'          => __( 'Edit 3D Model', 'hoger' ),
			'new_item'           => __( 'New 3D Model', 'hoger' ),
			'view_item'          => __( 'View 3D Model', 'hoger' ),
			'search_items'       => __( 'Search 3D Models', 'hoger' ),
			'not_found'          => __( 'No 3D models found', 'hoger' ),
			'not_found_in_trash' => __( 'No 3D models found in trash', 'hoger' ),
			'menu_name'          => __( '3D Models', 'hoger' ),
		],
		'public'              => true,
		'publicly_queryable'  => true,
		'show_ui'             => true,
		'show_in_menu'        => true,
		'show_in_nav_menus'   => true,
		'show_in_rest'        => true,
		'has_archive'         => true,
		'hierarchical'        => false,
		'rewrite'             => [ 'slug' => 'models', 'with_front' => false ],
		'query_var'           => true,
		'supports'            => [ 'title', 'thumbnail' ],
		'menu_icon'           => 'dashicons-format-image',
	] );
}
