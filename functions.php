<?php
/**
 * hoger functions and definitions
 *
 * @package hoger
 */

require_once get_stylesheet_directory() . '/functions/cpt/surfaces.php';
require_once get_stylesheet_directory() . '/functions/meta/surfaces-meta.php';

add_action( 'wp_enqueue_scripts', 'hoger_enqueue_styles' );
function hoger_enqueue_styles() {
    wp_enqueue_style( 'hoger-style',
        get_stylesheet_directory_uri() . '/style.css',
        array( 'codeweber-style' ),
        wp_get_theme()->get('Version')
    );
}
