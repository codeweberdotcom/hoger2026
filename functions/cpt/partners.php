<?php

add_action( 'init', 'hoger_register_cpt_partners' );
function hoger_register_cpt_partners() {
	register_post_type( 'partners', [
		'labels' => [
			'name'               => __( 'Partners', 'hoger' ),
			'singular_name'      => __( 'Partner', 'hoger' ),
			'add_new'            => __( 'Add New', 'hoger' ),
			'add_new_item'       => __( 'Add New Partner', 'hoger' ),
			'edit_item'          => __( 'Edit Partner', 'hoger' ),
			'new_item'           => __( 'New Partner', 'hoger' ),
			'view_item'          => __( 'View Partner', 'hoger' ),
			'search_items'       => __( 'Search Partners', 'hoger' ),
			'not_found'          => __( 'No partners found', 'hoger' ),
			'not_found_in_trash' => __( 'No partners found in trash', 'hoger' ),
			'menu_name'          => __( 'Partners', 'hoger' ),
		],
		'public'              => false,
		'publicly_queryable'  => false,
		'show_ui'             => true,
		'show_in_menu'        => true,
		'show_in_nav_menus'   => false,
		'show_in_rest'        => true,
		'has_archive'         => false,
		'hierarchical'        => false,
		'exclude_from_search' => true,
		'capability_type'     => 'post',
		'rewrite'             => false,
		'query_var'           => false,
		'supports'            => [ 'title', 'thumbnail' ],
		'menu_icon'           => 'dashicons-groups',
	] );
}
