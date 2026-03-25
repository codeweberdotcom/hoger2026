<?php
/**
 * hoger functions and definitions
 *
 * @package hoger
 */

add_action( 'wp_enqueue_scripts', 'hoger_enqueue_styles' );
function hoger_enqueue_styles() {
    wp_enqueue_style( 'hoger-style',
        get_stylesheet_directory_uri() . '/style.css',
        array( 'codeweber-style' ),
        wp_get_theme()->get('Version')
    );
}
