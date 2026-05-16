<?php

// ─── Register settings page ────────────────────────────────────────────────

add_action( 'admin_menu', 'hoger_models_new_settings_menu' );
function hoger_models_new_settings_menu() {
	add_submenu_page(
		'edit.php?post_type=models_new',
		__( '3D Viewer Settings', 'hoger' ),
		__( 'Viewer Settings', 'hoger' ),
		'manage_options',
		'models-new-viewer-settings',
		'hoger_models_new_settings_page'
	);
}

// ─── Register settings ─────────────────────────────────────────────────────

add_action( 'admin_init', 'hoger_models_new_settings_init' );
function hoger_models_new_settings_init() {
	register_setting(
		'hoger_models_new_viewer',
		'hoger_mn_viewer',
		[
			'sanitize_callback' => 'hoger_mn_sanitize_settings',
			'default'           => hoger_mn_defaults(),
		]
	);

	add_settings_section(
		'hoger_mn_controls',
		__( 'Viewer Controls', 'hoger' ),
		null,
		'models-new-viewer-settings'
	);

	add_settings_section(
		'hoger_mn_interaction',
		__( 'Interaction', 'hoger' ),
		null,
		'models-new-viewer-settings'
	);

	$fields_controls = [
		'show_play_btn'  => __( 'Show Play / Pause button', 'hoger' ),
		'show_edges_btn' => __( 'Show Edges toggle button (FBX / GLB only)', 'hoger' ),
	];

	foreach ( $fields_controls as $key => $label ) {
		add_settings_field(
			'hoger_mn_' . $key,
			$label,
			'hoger_mn_checkbox_field',
			'models-new-viewer-settings',
			'hoger_mn_controls',
			[ 'key' => $key ]
		);
	}

	$fields_interaction = [
		'enable_zoom'         => __( 'Enable zoom (mouse wheel / pinch)', 'hoger' ),
		'enable_orbit'        => __( 'Enable orbit (mouse drag)', 'hoger' ),
		'enable_auto_rotate'  => __( 'Default auto-rotate for new posts', 'hoger' ),
	];

	foreach ( $fields_interaction as $key => $label ) {
		add_settings_field(
			'hoger_mn_' . $key,
			$label,
			'hoger_mn_checkbox_field',
			'models-new-viewer-settings',
			'hoger_mn_interaction',
			[ 'key' => $key ]
		);
	}
}

// ─── Defaults ──────────────────────────────────────────────────────────────

function hoger_mn_defaults() {
	return [
		'show_play_btn'        => '1',
		'show_edges_btn'       => '1',
		'enable_zoom'          => '0',
		'enable_orbit'         => '1',
		'enable_auto_rotate'   => '1',
	];
}

function hoger_mn_get( $key ) {
	$opts     = get_option( 'hoger_mn_viewer', [] );
	$defaults = hoger_mn_defaults();
	return isset( $opts[ $key ] ) ? $opts[ $key ] : ( $defaults[ $key ] ?? '0' );
}

// ─── Sanitize ──────────────────────────────────────────────────────────────

function hoger_mn_sanitize_settings( $input ) {
	$keys = array_keys( hoger_mn_defaults() );
	$out  = [];
	foreach ( $keys as $key ) {
		$out[ $key ] = ! empty( $input[ $key ] ) ? '1' : '0';
	}
	return $out;
}

// ─── Field renderer ────────────────────────────────────────────────────────

function hoger_mn_checkbox_field( $args ) {
	$key = $args['key'];
	$val = hoger_mn_get( $key );
	printf(
		'<input type="checkbox" name="hoger_mn_viewer[%s]" value="1" %s>',
		esc_attr( $key ),
		checked( $val, '1', false )
	);
}

// ─── Settings page HTML ────────────────────────────────────────────────────

function hoger_models_new_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>
	<div class="wrap">
		<h1><?php esc_html_e( '3D Viewer Settings', 'hoger' ); ?></h1>
		<p class="description">
			<?php esc_html_e( 'Global defaults for the fry-style 3D viewer used by the "3D Models (New)" post type.', 'hoger' ); ?>
		</p>
		<form method="post" action="options.php">
			<?php
			settings_fields( 'hoger_models_new_viewer' );
			do_settings_sections( 'models-new-viewer-settings' );
			submit_button();
			?>
		</form>
	</div>
	<?php
}
