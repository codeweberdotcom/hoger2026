<?php

// ─── Register settings page ────────────────────────────────────────────────

add_action( 'admin_menu', 'hoger_models_new_settings_menu' );
function hoger_models_new_settings_menu() {
	add_submenu_page(
		'edit.php?post_type=models',
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

	// Section: Controls
	add_settings_section( 'hoger_mn_controls', __( 'Viewer Controls', 'hoger' ), null, 'models-new-viewer-settings' );

	add_settings_field( 'hoger_mn_show_play_btn',  __( 'Show Play / Pause button', 'hoger' ),                 'hoger_mn_checkbox_field', 'models-new-viewer-settings', 'hoger_mn_controls', [ 'key' => 'show_play_btn' ] );
	add_settings_field( 'hoger_mn_show_edges_btn', __( 'Show Edges toggle button (FBX / GLB only)', 'hoger' ), 'hoger_mn_checkbox_field', 'models-new-viewer-settings', 'hoger_mn_controls', [ 'key' => 'show_edges_btn' ] );

	// Section: Rotation
	add_settings_section( 'hoger_mn_rotation', __( 'Auto-Rotation', 'hoger' ), null, 'models-new-viewer-settings' );

	add_settings_field( 'hoger_mn_enable_auto_rotate', __( 'Enable auto-rotate by default', 'hoger' ), 'hoger_mn_checkbox_field', 'models-new-viewer-settings', 'hoger_mn_rotation', [ 'key' => 'enable_auto_rotate' ] );
	add_settings_field( 'hoger_mn_auto_rotate_speed',  __( 'Rotation speed', 'hoger' ),                'hoger_mn_number_field',   'models-new-viewer-settings', 'hoger_mn_rotation', [
		'key'  => 'auto_rotate_speed',
		'min'  => 0.1,
		'max'  => 10,
		'step' => 0.1,
		'desc' => __( 'Default: 0.5. Higher = faster.', 'hoger' ),
	] );

	// Section: Interaction
	add_settings_section( 'hoger_mn_interaction', __( 'Interaction', 'hoger' ), null, 'models-new-viewer-settings' );

	add_settings_field( 'hoger_mn_enable_zoom',  __( 'Enable zoom (mouse wheel / pinch)', 'hoger' ), 'hoger_mn_checkbox_field', 'models-new-viewer-settings', 'hoger_mn_interaction', [ 'key' => 'enable_zoom' ] );
	add_settings_field( 'hoger_mn_enable_orbit', __( 'Enable orbit (mouse drag)', 'hoger' ),         'hoger_mn_checkbox_field', 'models-new-viewer-settings', 'hoger_mn_interaction', [ 'key' => 'enable_orbit' ] );

	// Section: Configurator appearance
	add_settings_section( 'hoger_mn_configurator', __( 'Configurator Appearance', 'hoger' ), null, 'models-new-viewer-settings' );

	add_settings_field( 'hoger_mn_conf_exposure', __( 'Exposure (brightness)', 'hoger' ), 'hoger_mn_number_field', 'models-new-viewer-settings', 'hoger_mn_configurator', [
		'key'  => 'conf_exposure',
		'min'  => 0.1,
		'max'  => 3.0,
		'step' => 0.1,
		'desc' => __( 'Default: 1.0. Lower = darker, higher = brighter.', 'hoger' ),
	] );
	add_settings_field( 'hoger_mn_conf_saturation', __( 'Saturation', 'hoger' ), 'hoger_mn_number_field', 'models-new-viewer-settings', 'hoger_mn_configurator', [
		'key'  => 'conf_saturation',
		'min'  => 0,
		'max'  => 3.0,
		'step' => 0.1,
		'desc' => __( 'Default: 1.0. Applied via CSS filter on the canvas.', 'hoger' ),
	] );
	add_settings_field( 'hoger_mn_conf_env_intensity', __( 'Reflection strength (envMapIntensity)', 'hoger' ), 'hoger_mn_number_field', 'models-new-viewer-settings', 'hoger_mn_configurator', [
		'key'  => 'conf_env_intensity',
		'min'  => 0,
		'max'  => 3.0,
		'step' => 0.1,
		'desc' => __( 'Default: 1.0. Controls gloss/chrome reflection intensity.', 'hoger' ),
	] );

	// Section: Environment map
	add_settings_section( 'hoger_mn_envmap', __( 'Environment Map (Reflections)', 'hoger' ), function() {
		echo '<p class="description">' . esc_html__( 'Upload a studio panorama to improve reflections. HDR takes priority over JPEG/PNG if both are set. Leave empty to use the built-in procedural environment.', 'hoger' ) . '</p>';
	}, 'models-new-viewer-settings' );

	add_settings_field( 'hoger_mn_conf_env_hdr', __( 'HDR environment URL (.hdr)', 'hoger' ), 'hoger_mn_text_field', 'models-new-viewer-settings', 'hoger_mn_envmap', [
		'key'  => 'conf_env_hdr',
		'desc' => __( 'Best quality. 2–8 MB. Free studio HDRs: polyhaven.com', 'hoger' ),
	] );
	add_settings_field( 'hoger_mn_conf_env_jpg', __( 'Equirectangular image URL (.jpg / .png)', 'hoger' ), 'hoger_mn_text_field', 'models-new-viewer-settings', 'hoger_mn_envmap', [
		'key'  => 'conf_env_jpg',
		'desc' => __( 'Lighter alternative (200–500 KB). Any studio panorama in equirectangular format.', 'hoger' ),
	] );
}

// ─── Defaults ──────────────────────────────────────────────────────────────

function hoger_mn_defaults() {
	return [
		'show_play_btn'      => '1',
		'show_edges_btn'     => '1',
		'enable_auto_rotate' => '1',
		'auto_rotate_speed'  => '0.5',
		'enable_zoom'        => '0',
		'enable_orbit'       => '1',
		'conf_exposure'      => '1.0',
		'conf_saturation'    => '1.0',
		'conf_env_intensity' => '1.0',
		'conf_env_hdr'       => '',
		'conf_env_jpg'       => '',
	];
}

function hoger_mn_get( $key ) {
	$opts     = get_option( 'hoger_mn_viewer', [] );
	$defaults = hoger_mn_defaults();
	return isset( $opts[ $key ] ) && $opts[ $key ] !== '' ? $opts[ $key ] : ( $defaults[ $key ] ?? '' );
}

// ─── Sanitize ──────────────────────────────────────────────────────────────

function hoger_mn_sanitize_settings( $input ) {
	$checkboxes = [ 'show_play_btn', 'show_edges_btn', 'enable_auto_rotate', 'enable_zoom', 'enable_orbit' ];
	$out = [];

	foreach ( $checkboxes as $key ) {
		$out[ $key ] = ! empty( $input[ $key ] ) ? '1' : '0';
	}

	// Numeric: rotation speed
	$speed = isset( $input['auto_rotate_speed'] ) ? (float) $input['auto_rotate_speed'] : 0.5;
	$speed = max( 0.1, min( 10.0, $speed ) );
	$out['auto_rotate_speed'] = (string) round( $speed, 1 );

	// Numeric: configurator appearance
	$exposure = isset( $input['conf_exposure'] ) ? (float) $input['conf_exposure'] : 1.0;
	$out['conf_exposure'] = (string) round( max( 0.1, min( 3.0, $exposure ) ), 1 );

	$saturation = isset( $input['conf_saturation'] ) ? (float) $input['conf_saturation'] : 1.0;
	$out['conf_saturation'] = (string) round( max( 0.0, min( 3.0, $saturation ) ), 1 );

	$env = isset( $input['conf_env_intensity'] ) ? (float) $input['conf_env_intensity'] : 1.0;
	$out['conf_env_intensity'] = (string) round( max( 0.0, min( 3.0, $env ) ), 1 );

	// URL fields: env map
	$out['conf_env_hdr'] = isset( $input['conf_env_hdr'] ) ? esc_url_raw( wp_unslash( $input['conf_env_hdr'] ) ) : '';
	$out['conf_env_jpg'] = isset( $input['conf_env_jpg'] ) ? esc_url_raw( wp_unslash( $input['conf_env_jpg'] ) ) : '';

	return $out;
}

// ─── Field renderers ───────────────────────────────────────────────────────

function hoger_mn_checkbox_field( $args ) {
	$key = $args['key'];
	$val = hoger_mn_get( $key );
	printf(
		'<input type="checkbox" name="hoger_mn_viewer[%s]" value="1" %s>',
		esc_attr( $key ),
		checked( $val, '1', false )
	);
}

function hoger_mn_text_field( $args ) {
	$key  = $args['key'];
	$val  = hoger_mn_get( $key );
	$desc = $args['desc'] ?? '';
	$id   = 'hoger_mn_' . esc_attr( $key );
	?>
	<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
		<input type="url" id="<?php echo $id; ?>" name="hoger_mn_viewer[<?php echo esc_attr( $key ); ?>]"
			value="<?php echo esc_attr( $val ); ?>" style="width:440px;max-width:100%">
		<button type="button" class="button hoger-mn-upload-btn" data-target="<?php echo $id; ?>">
			<?php esc_html_e( 'Select File', 'hoger' ); ?>
		</button>
		<?php if ( $val ) : ?>
			<button type="button" class="button hoger-mn-clear-btn" data-target="<?php echo $id; ?>">
				<?php esc_html_e( 'Clear', 'hoger' ); ?>
			</button>
		<?php endif; ?>
	</div>
	<?php if ( $desc ) : ?>
		<p class="description"><?php echo esc_html( $desc ); ?></p>
	<?php endif;
}

function hoger_mn_number_field( $args ) {
	$key  = $args['key'];
	$val  = hoger_mn_get( $key );
	$min  = $args['min']  ?? 0;
	$max  = $args['max']  ?? 100;
	$step = $args['step'] ?? 1;
	$desc = $args['desc'] ?? '';
	printf(
		'<input type="number" name="hoger_mn_viewer[%s]" value="%s" min="%s" max="%s" step="%s" style="width:80px"> %s',
		esc_attr( $key ),
		esc_attr( $val ),
		esc_attr( $min ),
		esc_attr( $max ),
		esc_attr( $step ),
		$desc ? '<p class="description">' . esc_html( $desc ) . '</p>' : ''
	);
}

// ─── Enqueue media on settings page ───────────────────────────────────────

add_action( 'admin_enqueue_scripts', 'hoger_mn_enqueue_settings_media' );
function hoger_mn_enqueue_settings_media( $hook ) {
	if ( 'models_page_models-new-viewer-settings' !== $hook ) {
		return;
	}
	wp_enqueue_media();
	wp_add_inline_script( 'jquery', '
		jQuery(function($) {
			$(document).on("click", ".hoger-mn-upload-btn", function() {
				var targetId = $(this).data("target");
				var frame = wp.media({
					title: "Select File",
					multiple: false,
					library: { type: ["image", "application"] }
				});
				frame.on("select", function() {
					var att = frame.state().get("selection").first().toJSON();
					$("#" + targetId).val(att.url);
					var btn = $(".hoger-mn-upload-btn[data-target=" + targetId + "]");
					if (!btn.next(".hoger-mn-clear-btn").length) {
						btn.after(\'<button type="button" class="button hoger-mn-clear-btn" data-target="\' + targetId + \'"><?php esc_html_e( "Clear", "hoger" ); ?></button>\');
					}
				});
				frame.open();
			});
			$(document).on("click", ".hoger-mn-clear-btn", function() {
				var targetId = $(this).data("target");
				$("#" + targetId).val("");
				$(this).remove();
			});
		});
	' );
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
