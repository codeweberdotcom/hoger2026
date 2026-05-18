<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'wp_enqueue_scripts', 'hoger_enqueue_uis_forms' );
function hoger_enqueue_uis_forms() {
    wp_enqueue_script(
        'hoger-uis-forms',
        get_stylesheet_directory_uri() . '/functions/integrations/uis-forms.js',
        [],
        wp_get_theme()->get( 'Version' ),
        true
    );
}
