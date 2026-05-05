<?php

add_action( 'init', 'hoger_register_cpt_surfaces' );
function hoger_register_cpt_surfaces() {
	register_post_type( 'surfaces', [
		'labels' => [
			'name'               => __( 'Surfaces', 'hoger' ),
			'singular_name'      => __( 'Surface', 'hoger' ),
			'add_new'            => __( 'Add New', 'hoger' ),
			'add_new_item'       => __( 'Add New Surface', 'hoger' ),
			'edit_item'          => __( 'Edit Surface', 'hoger' ),
			'new_item'           => __( 'New Surface', 'hoger' ),
			'view_item'          => __( 'View Surface', 'hoger' ),
			'search_items'       => __( 'Search Surfaces', 'hoger' ),
			'not_found'          => __( 'No surfaces found', 'hoger' ),
			'not_found_in_trash' => __( 'No surfaces found in trash', 'hoger' ),
			'menu_name'          => __( 'Surfaces', 'hoger' ),
		],
		'public'              => false,
		'publicly_queryable'  => false,
		'show_ui'             => true,
		'show_in_menu'        => true,
		'show_in_nav_menus'   => true,
		'show_in_rest'        => true,
		'has_archive'         => false,
		'hierarchical'        => false,
		'exclude_from_search' => true,
		'capability_type'     => 'post',
		'rewrite'             => false,
		'query_var'           => false,
		'supports'            => [ 'title', 'thumbnail' ],
		'menu_icon'           => 'dashicons-art',
	] );
}
