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

add_action( 'wp_ajax_nopriv_cwf_uis_log_failure', 'hoger_cwf_uis_log_failure' );
add_action( 'wp_ajax_cwf_uis_log_failure', 'hoger_cwf_uis_log_failure' );
function hoger_cwf_uis_log_failure() {
    $form_name = isset( $_POST['form_name'] ) ? sanitize_text_field( $_POST['form_name'] ) : '';
    $phone     = isset( $_POST['phone'] )     ? sanitize_text_field( $_POST['phone'] )     : '';
    $email     = isset( $_POST['email'] )     ? sanitize_email( $_POST['email'] )           : '';
    $response  = isset( $_POST['response'] )  ? sanitize_text_field( $_POST['response'] )  : '';

    error_log( '[UIS FAILURE] form=' . $form_name . ' phone=' . $phone . ' email=' . $email . ' response=' . $response );
    wp_die();
}
