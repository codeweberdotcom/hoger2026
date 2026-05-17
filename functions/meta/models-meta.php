<?php

// ─── Meta boxes registration ───────────────────────────────────────────────

add_action( 'add_meta_boxes', 'hoger_models_meta_boxes' );
function hoger_models_meta_boxes() {
	add_meta_box(
		'models_3d_file',
		__( '3D Model File', 'hoger' ),
		'hoger_models_3d_file_cb',
		'models',
		'normal',
		'high'
	);
	add_meta_box(
		'models_product_info',
		__( 'Product Information', 'hoger' ),
		'hoger_models_product_info_cb',
		'models',
		'normal'
	);
	add_meta_box(
		'models_viewer_settings',
		__( 'Viewer Settings', 'hoger' ),
		'hoger_models_viewer_settings_cb',
		'models',
		'side'
	);
	add_meta_box(
		'models_mesh_colors',
		__( 'Mesh Colors', 'hoger' ),
		'hoger_models_mesh_colors_cb',
		'models',
		'normal'
	);
	add_meta_box(
		'models_drawings',
		__( 'Technical Drawings', 'hoger' ),
		'hoger_models_drawings_cb',
		'models',
		'normal'
	);
}

// ─── Helper: render media upload row ──────────────────────────────────────

function hoger_models_media_field( $key, $label, $value, $type = 'image' ) {
	$url     = $value ? wp_get_attachment_url( (int) $value ) : '';
	$preview = '';
	if ( $value && $type === 'image' ) {
		$src     = wp_get_attachment_image_url( (int) $value, 'thumbnail' );
		$preview = $src ? '<img src="' . esc_url( $src ) . '" style="max-height:80px;display:block;margin-top:6px;">' : '';
	} elseif ( $value && $url ) {
		$preview = '<span style="display:block;margin-top:4px;color:#555;font-size:12px;">' . esc_html( basename( $url ) ) . '</span>';
	}

	$button_label = $type === 'image'
		? __( 'Select Image', 'hoger' )
		: __( 'Select File', 'hoger' );

	$mime = $type === 'image' ? 'image' : ( $type === 'pdf' ? 'application/pdf' : 'application' );
	?>
	<div class="hoger-meta-field" style="margin-bottom:16px">
		<label for="<?php echo esc_attr( $key ); ?>" style="display:block;font-weight:600;margin-bottom:4px">
			<?php echo esc_html( $label ); ?>
		</label>
		<input type="hidden"
			id="<?php echo esc_attr( $key ); ?>"
			name="<?php echo esc_attr( $key ); ?>"
			value="<?php echo esc_attr( (string) $value ); ?>"
			class="hoger-media-input">
		<div id="<?php echo esc_attr( $key ); ?>_preview" class="hoger-media-preview">
			<?php echo $preview; // phpcs:ignore WordPress.Security.EscapeOutput ?>
		</div>
		<button type="button"
			class="button hoger-media-upload"
			data-field="<?php echo esc_attr( $key ); ?>"
			data-mime="<?php echo esc_attr( $mime ); ?>"
			style="margin-top:6px">
			<?php echo esc_html( $button_label ); ?>
		</button>
		<?php if ( $value ) : ?>
		<button type="button"
			class="button hoger-media-remove"
			data-field="<?php echo esc_attr( $key ); ?>"
			style="margin-top:6px">
			<?php esc_html_e( 'Remove', 'hoger' ); ?>
		</button>
		<?php else : ?>
		<button type="button"
			class="button hoger-media-remove"
			data-field="<?php echo esc_attr( $key ); ?>"
			style="margin-top:6px;display:none">
			<?php esc_html_e( 'Remove', 'hoger' ); ?>
		</button>
		<?php endif; ?>
	</div>
	<?php
}

// ─── Meta box 1: 3D Model File ─────────────────────────────────────────────

function hoger_models_3d_file_cb( $post ) {
	wp_nonce_field( 'hoger_models_save', 'hoger_models_nonce' );

	$fbx_id  = get_post_meta( $post->ID, 'model_fbx', true );
	$fbx_url = $fbx_id ? wp_get_attachment_url( (int) $fbx_id ) : '';
	?>
	<div class="hoger-meta-field" style="margin-bottom:16px">
		<label for="mn_model_file" style="display:block;font-weight:600;margin-bottom:4px">
			<?php esc_html_e( 'FBX / GLB / OBJ File', 'hoger' ); ?>
		</label>
		<input type="hidden"
			id="mn_model_file"
			name="model_fbx"
			value="<?php echo esc_attr( (string) $fbx_id ); ?>"
			class="hoger-media-input">
		<div id="mn_model_file_preview" class="hoger-media-preview">
			<?php if ( $fbx_url ) : ?>
				<span style="display:block;margin-top:4px;color:#555;font-size:12px;"><?php echo esc_html( basename( $fbx_url ) ); ?></span>
			<?php endif; ?>
		</div>
		<button type="button"
			class="button hoger-media-upload"
			data-field="mn_model_file"
			data-mime="application"
			style="margin-top:6px">
			<?php esc_html_e( 'Select File', 'hoger' ); ?>
		</button>
		<button type="button"
			class="button hoger-media-remove"
			data-field="mn_model_file"
			style="margin-top:6px<?php echo $fbx_id ? '' : ';display:none'; ?>">
			<?php esc_html_e( 'Remove', 'hoger' ); ?>
		</button>
	</div>
	<?php
}

// ─── Meta box 2: Product Information ──────────────────────────────────────

function hoger_models_product_info_cb( $post ) {
	$field_style = 'margin-bottom:16px';
	$label_style = 'display:block;font-weight:600;margin-bottom:4px';

	$subtitle   = get_post_meta( $post->ID, 'podzagolovok_straniczy', true );
	$params     = get_post_meta( $post->ID, 'perechen_parametrov_pod_zagolovokom', true );
	if ( ! is_array( $params ) ) {
		$params = [ [ 'element_spiska' => '' ] ];
	}
	$description = get_post_meta( $post->ID, 'opisanie_modeli', true );
	$katalog_id  = get_post_meta( $post->ID, 'tehnicheskij_katalog', true );
	$product_id  = get_post_meta( $post->ID, 'tovar_s_konfiguratorom', true );
	?>

	<div class="hoger-meta-field" style="<?php echo esc_attr( $field_style ); ?>">
		<label for="podzagolovok_straniczy" style="<?php echo esc_attr( $label_style ); ?>">
			<?php esc_html_e( 'Subtitle', 'hoger' ); ?>
		</label>
		<input type="text"
			id="podzagolovok_straniczy"
			name="podzagolovok_straniczy"
			value="<?php echo esc_attr( $subtitle ); ?>"
			class="large-text">
	</div>

	<div class="hoger-meta-field" style="<?php echo esc_attr( $field_style ); ?>">
		<label style="<?php echo esc_attr( $label_style ); ?>"><?php esc_html_e( 'Parameters List', 'hoger' ); ?></label>
		<input type="hidden" name="models_params_sent" value="1">
		<div class="models-params-rows">
			<?php foreach ( $params as $i => $row ) : ?>
				<div class="models-param-row" style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
					<input type="text"
						name="perechen_parametrov_pod_zagolovokom[<?php echo (int) $i; ?>][element_spiska]"
						value="<?php echo esc_attr( $row['element_spiska'] ?? '' ); ?>"
						class="large-text"
						placeholder="<?php esc_attr_e( 'Parameter', 'hoger' ); ?>">
					<button type="button" class="button models-param-remove"><?php esc_html_e( 'Remove', 'hoger' ); ?></button>
				</div>
			<?php endforeach; ?>
		</div>
		<button type="button" class="button models-param-add"><?php esc_html_e( 'Add Parameter', 'hoger' ); ?></button>
	</div>

	<div class="hoger-meta-field" style="<?php echo esc_attr( $field_style ); ?>">
		<label for="opisanie_modeli" style="<?php echo esc_attr( $label_style ); ?>">
			<?php esc_html_e( 'Description', 'hoger' ); ?>
		</label>
		<textarea id="opisanie_modeli" name="opisanie_modeli"
			class="large-text" rows="4"><?php echo esc_textarea( $description ); ?></textarea>
	</div>

	<?php hoger_models_media_field( 'tehnicheskij_katalog', __( 'Technical Catalog (PDF)', 'hoger' ), $katalog_id, 'pdf' ); ?>

	<div class="hoger-meta-field" style="<?php echo esc_attr( $field_style ); ?>">
		<label for="tovar_s_konfiguratorom" style="<?php echo esc_attr( $label_style ); ?>">
			<?php esc_html_e( 'WooCommerce Product ID (Configurator)', 'hoger' ); ?>
		</label>
		<input type="number"
			id="tovar_s_konfiguratorom"
			name="tovar_s_konfiguratorom"
			value="<?php echo esc_attr( (string) $product_id ); ?>"
			class="small-text"
			min="0">
		<p class="description"><?php esc_html_e( 'Enter the WooCommerce product ID for the MKL configurator button.', 'hoger' ); ?></p>
	</div>
	<?php
}

// ─── Meta box 3: Viewer Settings (sidebar) ────────────────────────────────

function hoger_models_viewer_settings_cb( $post ) {
	$bg_color       = get_post_meta( $post->ID, 'mn_bg_color', true ) ?: '#f2f2fb';
	$edge_color     = get_post_meta( $post->ID, 'mn_edge_color', true ) ?: '#0057b8';
	$bg_soft        = get_post_meta( $post->ID, 'mn_bg_soft', true );
	$edge_soft      = get_post_meta( $post->ID, 'mn_edge_soft', true );
	$use_fbx_colors = get_post_meta( $post->ID, 'mn_use_fbx_colors', true );
	$auto_rotate    = get_post_meta( $post->ID, 'mn_auto_rotate', true );
	$auto_rotate    = $auto_rotate === '' ? '1' : $auto_rotate;

	$bg_colors = [
		'#ffffff' => __( 'White', 'hoger' ),
		'#fefefe' => __( 'Light ($gray-100)', 'hoger' ),
		'#f6f7f9' => __( 'Gray ($gray-200)', 'hoger' ),
		'#f2f2fb' => __( 'Light Gray (default)', 'hoger' ),
		'#cacaca' => __( 'Inverse ($gray-300)', 'hoger' ),
		'#aab0bc' => __( 'Gray ($gray-400)', 'hoger' ),
		'#959ca9' => __( 'Gray ($gray-500)', 'hoger' ),
		'#60697b' => __( 'Gray ($gray-600)', 'hoger' ),
		'#2f353a' => __( 'Gray ($gray-700)', 'hoger' ),
		'#21262c' => __( 'Gray ($gray-800)', 'hoger' ),
		'#1e2228' => __( 'Navy ($gray-900)', 'hoger' ),
		'#292728' => __( 'Dark (hoger)', 'hoger' ),
		'#262b32' => __( 'Dark (theme)', 'hoger' ),
		'#343f52' => __( 'Navy (theme)', 'hoger' ),
		'#9c886f' => __( 'Taupe — Primary', 'hoger' ),
		'#3f78e0' => __( 'Blue', 'hoger' ),
		'#5eb9f0' => __( 'Sky', 'hoger' ),
		'#605dba' => __( 'Grape', 'hoger' ),
		'#45c4a0' => __( 'Green', 'hoger' ),
		'#fab758' => __( 'Yellow', 'hoger' ),
		'#e2626b' => __( 'Red', 'hoger' ),
	];

	$edge_colors = [
		'#0057b8' => __( 'Blue (fryreglet)', 'hoger' ),
		'#9c886f' => __( 'Taupe — Primary', 'hoger' ),
		'#3f78e0' => __( 'Blue', 'hoger' ),
		'#5eb9f0' => __( 'Sky', 'hoger' ),
		'#605dba' => __( 'Grape', 'hoger' ),
		'#747ed1' => __( 'Purple', 'hoger' ),
		'#a07cc5' => __( 'Violet', 'hoger' ),
		'#d16b86' => __( 'Pink', 'hoger' ),
		'#e2626b' => __( 'Red', 'hoger' ),
		'#f78b77' => __( 'Orange', 'hoger' ),
		'#fab758' => __( 'Yellow', 'hoger' ),
		'#45c4a0' => __( 'Green', 'hoger' ),
		'#54a8c7' => __( 'Aqua', 'hoger' ),
		'#1e2228' => __( 'Navy', 'hoger' ),
		'#292728' => __( 'Dark (hoger)', 'hoger' ),
		'#343f52' => __( 'Navy (theme)', 'hoger' ),
		'#ffffff' => __( 'White', 'hoger' ),
		'#9499a3' => __( 'Ash', 'hoger' ),
	];

	$bg_is_custom   = ! array_key_exists( $bg_color, $bg_colors );
	$edge_is_custom = ! array_key_exists( $edge_color, $edge_colors );
	?>

	<div style="margin-bottom:16px;padding:10px;background:#f6f7f9;border-left:3px solid #9c886f;">
		<label style="display:flex;align-items:center;gap:8px;font-weight:600;cursor:pointer">
			<input type="checkbox" name="mn_use_fbx_colors" value="1" id="mn_use_fbx_colors"
				<?php checked( $use_fbx_colors, '1' ); ?>>
			<?php esc_html_e( 'Use original FBX / GLB colors', 'hoger' ); ?>
		</label>
		<p style="margin:4px 0 0 24px;font-size:12px;color:#666">
			<?php esc_html_e( 'When enabled, the model keeps its original material colors. Background and Edge color settings below are ignored.', 'hoger' ); ?>
		</p>
	</div>

	<div style="margin-bottom:14px">
		<label style="display:block;font-weight:600;margin-bottom:5px">
			<?php esc_html_e( 'Background Color', 'hoger' ); ?>
		</label>
		<div class="mn-swatch-grid" data-target="mn_bg_color">
			<?php foreach ( $bg_colors as $hex => $label ) :
				$active = ( ! $bg_is_custom && $bg_color === $hex );
			?>
			<span class="mn-swatch<?php echo $active ? ' mn-swatch--active' : ''; ?>"
				data-hex="<?php echo esc_attr( $hex ); ?>"
				title="<?php echo esc_attr( $label ); ?>"
				style="background:<?php echo esc_attr( $hex ); ?>;"
			></span>
			<?php endforeach; ?>
			<span class="mn-swatch mn-swatch--custom<?php echo $bg_is_custom ? ' mn-swatch--active' : ''; ?>"
				data-hex="custom"
				title="<?php esc_attr_e( 'Custom hex', 'hoger' ); ?>">+</span>
		</div>
		<div class="mn-swatch-label">
			<?php echo esc_html( $bg_is_custom ? $bg_color : ( $bg_colors[ $bg_color ] ?? '' ) ); ?>
		</div>
		<input type="hidden" id="mn_bg_color" name="mn_bg_color" value="<?php echo esc_attr( $bg_color ); ?>">
		<input type="text" class="mn-color-custom-input"
			value="<?php echo $bg_is_custom ? esc_attr( $bg_color ) : ''; ?>"
			placeholder="#rrggbb"
			style="display:<?php echo $bg_is_custom ? 'block' : 'none'; ?>">
		<label class="mn-soft-label">
			<input type="checkbox" name="mn_bg_soft" value="1" <?php checked( $bg_soft, '1' ); ?>>
			<?php esc_html_e( 'Soft (lighten 70%)', 'hoger' ); ?>
		</label>
	</div>

	<div style="margin-bottom:14px">
		<label style="display:block;font-weight:600;margin-bottom:5px">
			<?php esc_html_e( 'Edge Color', 'hoger' ); ?>
		</label>
		<div class="mn-swatch-grid" data-target="mn_edge_color">
			<?php foreach ( $edge_colors as $hex => $label ) :
				$active = ( ! $edge_is_custom && $edge_color === $hex );
			?>
			<span class="mn-swatch<?php echo $active ? ' mn-swatch--active' : ''; ?>"
				data-hex="<?php echo esc_attr( $hex ); ?>"
				title="<?php echo esc_attr( $label ); ?>"
				style="background:<?php echo esc_attr( $hex ); ?>;"
			></span>
			<?php endforeach; ?>
			<span class="mn-swatch mn-swatch--custom<?php echo $edge_is_custom ? ' mn-swatch--active' : ''; ?>"
				data-hex="custom"
				title="<?php esc_attr_e( 'Custom hex', 'hoger' ); ?>">+</span>
		</div>
		<div class="mn-swatch-label">
			<?php echo esc_html( $edge_is_custom ? $edge_color : ( $edge_colors[ $edge_color ] ?? '' ) ); ?>
		</div>
		<input type="hidden" id="mn_edge_color" name="mn_edge_color" value="<?php echo esc_attr( $edge_color ); ?>">
		<input type="text" class="mn-color-custom-input"
			value="<?php echo $edge_is_custom ? esc_attr( $edge_color ) : ''; ?>"
			placeholder="#rrggbb"
			style="display:<?php echo $edge_is_custom ? 'block' : 'none'; ?>">
		<label class="mn-soft-label">
			<input type="checkbox" name="mn_edge_soft" value="1" <?php checked( $edge_soft, '1' ); ?>>
			<?php esc_html_e( 'Soft (lighten 70%)', 'hoger' ); ?>
		</label>
	</div>

	<div style="margin-bottom:12px">
		<label style="display:flex;align-items:center;gap:6px;font-weight:600">
			<input type="checkbox" name="mn_auto_rotate" value="1" <?php checked( $auto_rotate, '1' ); ?>>
			<?php esc_html_e( 'Auto Rotate', 'hoger' ); ?>
		</label>
	</div>

	<hr style="margin:16px 0">

	<?php
	$cam_x        = get_post_meta( $post->ID, 'mn_cam_x', true );
	$cam_y        = get_post_meta( $post->ID, 'mn_cam_y', true );
	$cam_z        = get_post_meta( $post->ID, 'mn_cam_z', true );
	$cam_target_x = get_post_meta( $post->ID, 'mn_cam_target_x', true );
	$cam_target_y = get_post_meta( $post->ID, 'mn_cam_target_y', true );
	$cam_target_z = get_post_meta( $post->ID, 'mn_cam_target_z', true );
	$cam_debug    = get_post_meta( $post->ID, 'mn_cam_debug', true );
	?>

	<div style="margin-bottom:10px">
		<label style="display:block;font-weight:600;margin-bottom:6px">
			<?php esc_html_e( 'Camera Position', 'hoger' ); ?>
		</label>
		<p style="font-size:11px;color:#888;margin:0 0 8px">
			<?php esc_html_e( 'Leave empty to use global settings. Enable Debug, copy from frontend, paste below.', 'hoger' ); ?>
		</p>
		<textarea id="mn-cam-paste" rows="6" style="width:100%;font-family:monospace;font-size:11px;margin-bottom:6px" placeholder="<?php esc_attr_e( 'Paste config here…', 'hoger' ); ?>"></textarea>
		<button type="button" class="button" id="mn-cam-parse" style="width:100%;margin-bottom:10px">
			<?php esc_html_e( 'Apply to fields', 'hoger' ); ?>
		</button>

		<?php
		$cam_fields = [
			'mn_cam_x'        => __( 'Cam X', 'hoger' ),
			'mn_cam_y'        => __( 'Cam Y', 'hoger' ),
			'mn_cam_z'        => __( 'Cam Z', 'hoger' ),
			'mn_cam_target_x' => __( 'Target X', 'hoger' ),
			'mn_cam_target_y' => __( 'Target Y', 'hoger' ),
			'mn_cam_target_z' => __( 'Target Z', 'hoger' ),
		];
		$cam_val_map = [
			'mn_cam_x'        => $cam_x,
			'mn_cam_y'        => $cam_y,
			'mn_cam_z'        => $cam_z,
			'mn_cam_target_x' => $cam_target_x,
			'mn_cam_target_y' => $cam_target_y,
			'mn_cam_target_z' => $cam_target_z,
		];
		foreach ( $cam_fields as $key => $label ) :
		?>
		<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
			<label style="width:60px;font-size:12px;flex-shrink:0"><?php echo esc_html( $label ); ?></label>
			<input type="number" step="0.0001"
				id="<?php echo esc_attr( $key ); ?>"
				name="<?php echo esc_attr( $key ); ?>"
				value="<?php echo esc_attr( $cam_val_map[ $key ] ); ?>"
				placeholder="<?php esc_attr_e( 'auto', 'hoger' ); ?>"
				style="width:100%">
		</div>
		<?php endforeach; ?>

		<label style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:12px">
			<input type="checkbox" name="mn_cam_debug" value="1" <?php checked( $cam_debug, '1' ); ?>>
			<?php esc_html_e( 'Debug mode', 'hoger' ); ?>
		</label>
	</div>
	<?php
}

// ─── Meta box 4: Mesh Colors ──────────────────────────────────────────────

function hoger_models_mesh_colors_cb( $post ) {
	$mesh_colors  = get_post_meta( $post->ID, 'mn_mesh_colors', true ) ?: '{}';
	if ( json_decode( $mesh_colors ) === null ) {
		$mesh_colors = '{}';
	}
	$conf_meshes = get_post_meta( $post->ID, 'mn_conf_meshes', true ) ?: '[]';
	if ( json_decode( $conf_meshes ) === null ) {
		$conf_meshes = '[]';
	}

	$model_id  = (int) get_post_meta( $post->ID, 'model_fbx', true );
	$model_url = $model_id ? wp_get_attachment_url( $model_id ) : '';
	?>
	<div id="mn-mesh-colors-box" data-model-url="<?php echo esc_url( $model_url ); ?>">

		<p style="color:#666;font-size:13px;margin:0 0 12px">
			<?php esc_html_e( 'Assign colors to individual meshes. Requires a 3D model file to be selected above.', 'hoger' ); ?>
		</p>

		<div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;">

			<div style="flex-shrink:0;">
				<canvas id="mn-mesh-preview-canvas" width="300" height="300"
					style="display:block;border:1px solid #ddd;background:#f0f2f5;border-radius:4px;"></canvas>
				<button type="button" id="mn-load-model-btn" class="button"
					style="margin-top:8px;width:300px;">
					<?php esc_html_e( 'Load Model &amp; Detect Meshes', 'hoger' ); ?>
				</button>
				<span id="mn-load-status" style="display:block;font-size:12px;color:#888;margin-top:4px;min-height:16px;"></span>
			</div>

			<div id="mn-mesh-list" style="min-width:240px;max-height:320px;overflow-y:auto;padding-right:4px;">
				<p style="color:#999;font-size:13px;margin:0;">
					<?php esc_html_e( 'Click "Load Model" to detect meshes.', 'hoger' ); ?>
				</p>
			</div>

		</div>

		<input type="hidden" name="mn_mesh_colors" id="mn_mesh_colors"
			value="<?php echo esc_attr( $mesh_colors ); ?>">
		<input type="hidden" name="mn_conf_meshes" id="mn_conf_meshes"
			value="<?php echo esc_attr( $conf_meshes ); ?>">
		<p style="color:#666;font-size:12px;margin:8px 0 0">
			<?php esc_html_e( 'Checked meshes will receive the surface texture in the configurator. If none checked — all meshes receive it.', 'hoger' ); ?>
		</p>

	</div>
	<?php
}

// ─── Meta box 5: Technical Drawings ───────────────────────────────────────

function hoger_models_drawings_cb( $post ) {
	$field_style = 'margin-bottom:16px';
	$label_style = 'display:block;font-weight:600;margin-bottom:4px';

	$obshhij_vid_id    = get_post_meta( $post->ID, 'obshhij_vid', true );
	$zagolovok_vid     = get_post_meta( $post->ID, 'zagolovok_obshhego_vida', true );
	$razrez1_id        = get_post_meta( $post->ID, 'razrez_1', true );
	$zagolovok_razrez1 = get_post_meta( $post->ID, 'zagolovokrazreza1', true );
	$razrez2_id        = get_post_meta( $post->ID, 'razrez_2', true );
	$zagolovok_razrez2 = get_post_meta( $post->ID, 'zagolovok_razreza_2', true );
	$opisanie          = get_post_meta( $post->ID, 'opisanie_chertezha', true );
	?>

	<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:16px">
		<div>
			<?php hoger_models_media_field( 'obshhij_vid', __( 'General View', 'hoger' ), $obshhij_vid_id, 'image' ); ?>
			<div style="<?php echo esc_attr( $field_style ); ?>">
				<label for="zagolovok_obshhego_vida" style="<?php echo esc_attr( $label_style ); ?>">
					<?php esc_html_e( 'General View Title', 'hoger' ); ?>
				</label>
				<input type="text" id="zagolovok_obshhego_vida" name="zagolovok_obshhego_vida"
					value="<?php echo esc_attr( $zagolovok_vid ); ?>" class="large-text">
			</div>
		</div>

		<div>
			<?php hoger_models_media_field( 'razrez_1', __( 'Section A-A', 'hoger' ), $razrez1_id, 'image' ); ?>
			<div style="<?php echo esc_attr( $field_style ); ?>">
				<label for="zagolovokrazreza1" style="<?php echo esc_attr( $label_style ); ?>">
					<?php esc_html_e( 'Section A-A Title', 'hoger' ); ?>
				</label>
				<input type="text" id="zagolovokrazreza1" name="zagolovokrazreza1"
					value="<?php echo esc_attr( $zagolovok_razrez1 ); ?>" class="large-text">
			</div>
		</div>
	</div>

	<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:16px">
		<div>
			<?php hoger_models_media_field( 'razrez_2', __( 'Section B-B', 'hoger' ), $razrez2_id, 'image' ); ?>
			<div style="<?php echo esc_attr( $field_style ); ?>">
				<label for="zagolovok_razreza_2" style="<?php echo esc_attr( $label_style ); ?>">
					<?php esc_html_e( 'Section B-B Title', 'hoger' ); ?>
				</label>
				<input type="text" id="zagolovok_razreza_2" name="zagolovok_razreza_2"
					value="<?php echo esc_attr( $zagolovok_razrez2 ); ?>" class="large-text">
			</div>
		</div>

		<div>
			<div style="<?php echo esc_attr( $field_style ); ?>">
				<label for="opisanie_chertezha" style="<?php echo esc_attr( $label_style ); ?>">
					<?php esc_html_e( 'Drawing Description', 'hoger' ); ?>
				</label>
				<textarea id="opisanie_chertezha" name="opisanie_chertezha"
					class="large-text" rows="6"><?php echo esc_textarea( $opisanie ); ?></textarea>
			</div>
		</div>
	</div>
	<?php
}

// ─── Admin scripts ─────────────────────────────────────────────────────────

add_action( 'admin_enqueue_scripts', 'hoger_models_admin_scripts' );
function hoger_models_admin_scripts( $hook ) {
	global $post_type;
	if ( ! in_array( $hook, [ 'post.php', 'post-new.php' ], true ) || $post_type !== 'models' ) {
		return;
	}

	wp_enqueue_media();
	wp_enqueue_style( 'wp-color-picker' );
	wp_enqueue_script( 'wp-color-picker' );

	wp_add_inline_style( 'wp-admin', '
		.mn-swatch-grid { display:flex;flex-wrap:wrap;gap:3px;margin-bottom:4px; }
		.mn-swatch {
			display:inline-flex;align-items:center;justify-content:center;
			width:24px;height:24px;border-radius:3px;cursor:pointer;
			border:2px solid transparent;box-sizing:border-box;
			transition:border-color .12s,box-shadow .12s;
		}
		.mn-swatch:hover { border-color:#999; }
		.mn-swatch--active { border-color:#2271b1 !important;box-shadow:0 0 0 1px #2271b1; }
		.mn-swatch--custom { background:#e8e8e8;font-size:15px;color:#555;font-weight:700;line-height:1; }
		.mn-swatch-label { font-size:11px;color:#777;min-height:14px;margin-bottom:4px; }
		.mn-color-custom-input { width:90px;font-size:12px;margin-bottom:4px; }
		.mn-soft-label { display:flex;align-items:center;gap:6px;font-size:12px;margin-top:2px; }
	' );

	wp_add_inline_script( 'jquery', "
		jQuery(function($) {

			// Media upload
			$(document).on('click', '.hoger-media-upload', function(e) {
				e.preventDefault();
				var btn   = $(this);
				var field = btn.data('field');
				var mime  = btn.data('mime') || 'image';

				var frame = wp.media({
					title:    'Select File',
					multiple: false,
					library:  { type: mime }
				});

				frame.on('select', function() {
					var attachment = frame.state().get('selection').first().toJSON();
					$('#' + field).val(attachment.id);

					var preview = $('#' + field + '_preview');
					preview.empty();
					if (attachment.type === 'image' && attachment.sizes && attachment.sizes.thumbnail) {
						preview.html('<img src=\"' + attachment.sizes.thumbnail.url + '\" style=\"max-height:80px;display:block;margin-top:6px;\">');
					} else {
						preview.html('<span style=\"display:block;margin-top:4px;color:#555;font-size:12px;\">' + attachment.filename + '</span>');
					}

					btn.next('.hoger-media-remove').show();
				});

				frame.open();
			});

			// Media remove
			$(document).on('click', '.hoger-media-remove', function(e) {
				e.preventDefault();
				var field = $(this).data('field');
				$('#' + field).val('');
				$('#' + field + '_preview').empty();
				$(this).hide();
			});

			// Params repeater
			var paramIndex = $('.models-param-row').length;

			$(document).on('click', '.models-param-add', function(e) {
				e.preventDefault();
				var html = '<div class=\"models-param-row\" style=\"display:flex;gap:8px;align-items:center;margin-bottom:6px;\">' +
					'<input type=\"text\" name=\"perechen_parametrov_pod_zagolovokom[' + paramIndex + '][element_spiska]\" class=\"large-text\" placeholder=\"Parameter\">' +
					'<button type=\"button\" class=\"button models-param-remove\">Remove</button>' +
					'</div>';
				$('.models-params-rows').append(html);
				paramIndex++;
			});

			$(document).on('click', '.models-param-remove', function(e) {
				e.preventDefault();
				$(this).closest('.models-param-row').remove();
			});

			// Color swatch click
			$(document).on('click', '.mn-swatch', function() {
				var \$grid   = $(this).closest('.mn-swatch-grid');
				var target  = \$grid.data('target');
				var hex     = $(this).data('hex');
				var label   = $(this).attr('title');
				var \$wrap   = \$grid.closest('div');
				var \$custom = \$wrap.find('.mn-color-custom-input');
				var \$lbl    = \$wrap.find('.mn-swatch-label');

				\$grid.find('.mn-swatch').removeClass('mn-swatch--active');
				$(this).addClass('mn-swatch--active');
				\$lbl.text(label);

				if (hex === 'custom') {
					\$custom.show();
					\$('#' + target).val(\$custom.val());
				} else {
					\$custom.hide();
					\$('#' + target).val(hex);
				}
			});

			$(document).on('input', '.mn-color-custom-input', function() {
				var \$grid  = $(this).closest('div').find('.mn-swatch-grid');
				var target = \$grid.data('target');
				if (target) \$('#' + target).val($(this).val());
			});

			// Camera paste config
			\$('#mn-cam-parse').on('click', function() {
				var lines = \$('#mn-cam-paste').val().trim().split(/\\r?\\n/).map(function(l) { return l.trim(); }).filter(Boolean);
				if (lines.length < 6) { alert('Need 6 values (Camera X, Y, Z, Target X, Y, Z)'); return; }
				var keys = ['mn_cam_x','mn_cam_y','mn_cam_z','mn_cam_target_x','mn_cam_target_y','mn_cam_target_z'];
				keys.forEach(function(id, i) { \$('#' + id).val(lines[i]); });
				\$('#mn-cam-paste').val('');
			});
		});
	" );
}

// ─── Save post meta ────────────────────────────────────────────────────────

add_action( 'save_post_models', 'hoger_models_save_meta', 10, 2 );
function hoger_models_save_meta( $post_id, $post ) {
	if ( ! isset( $_POST['hoger_models_nonce'] ) ) {
		return;
	}
	if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['hoger_models_nonce'] ) ), 'hoger_models_save' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	// Attachment ID fields
	$attachment_fields = [ 'model_fbx', 'tehnicheskij_katalog', 'obshhij_vid', 'razrez_1', 'razrez_2' ];
	foreach ( $attachment_fields as $key ) {
		if ( isset( $_POST[ $key ] ) ) {
			$val = absint( $_POST[ $key ] );
			$val ? update_post_meta( $post_id, $key, $val ) : delete_post_meta( $post_id, $key );
		}
	}

	// Viewer color fields
	foreach ( [ 'mn_bg_color', 'mn_edge_color' ] as $key ) {
		if ( isset( $_POST[ $key ] ) ) {
			$val = sanitize_hex_color( wp_unslash( $_POST[ $key ] ) );
			$val ? update_post_meta( $post_id, $key, $val ) : delete_post_meta( $post_id, $key );
		}
	}

	// Viewer checkboxes
	update_post_meta( $post_id, 'mn_auto_rotate',    isset( $_POST['mn_auto_rotate'] )    ? '1' : '0' );
	update_post_meta( $post_id, 'mn_bg_soft',        isset( $_POST['mn_bg_soft'] )        ? '1' : '0' );
	update_post_meta( $post_id, 'mn_edge_soft',      isset( $_POST['mn_edge_soft'] )      ? '1' : '0' );
	update_post_meta( $post_id, 'mn_use_fbx_colors', isset( $_POST['mn_use_fbx_colors'] ) ? '1' : '0' );

	// Configurator meshes JSON array
	if ( isset( $_POST['mn_conf_meshes'] ) ) {
		$raw     = wp_unslash( $_POST['mn_conf_meshes'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$decoded = json_decode( $raw, true );
		if ( is_array( $decoded ) ) {
			$sanitized = array_values( array_filter( array_map( 'sanitize_text_field', $decoded ) ) );
			update_post_meta( $post_id, 'mn_conf_meshes', wp_json_encode( $sanitized, JSON_UNESCAPED_UNICODE ) );
		} else {
			update_post_meta( $post_id, 'mn_conf_meshes', '[]' );
		}
	}

	// Mesh colors JSON
	if ( isset( $_POST['mn_mesh_colors'] ) ) {
		$raw     = wp_unslash( $_POST['mn_mesh_colors'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$decoded = json_decode( $raw, true );
		if ( is_array( $decoded ) ) {
			$sanitized = [];
			foreach ( $decoded as $mesh_name => $color ) {
				$safe_name = sanitize_text_field( $mesh_name );
				$safe_col  = sanitize_hex_color( $color );
				if ( $safe_name !== '' && $safe_col ) {
					$sanitized[ $safe_name ] = $safe_col;
				}
			}
			update_post_meta( $post_id, 'mn_mesh_colors', wp_json_encode( $sanitized, JSON_UNESCAPED_UNICODE ) );
		} else {
			update_post_meta( $post_id, 'mn_mesh_colors', '{}' );
		}
	}

	// Text fields
	$text_fields = [
		'podzagolovok_straniczy',
		'opisanie_modeli',
		'zagolovok_obshhego_vida',
		'zagolovokrazreza1',
		'zagolovok_razreza_2',
		'opisanie_chertezha',
	];
	foreach ( $text_fields as $key ) {
		if ( isset( $_POST[ $key ] ) ) {
			$val = sanitize_textarea_field( wp_unslash( $_POST[ $key ] ) );
			$val !== '' ? update_post_meta( $post_id, $key, $val ) : delete_post_meta( $post_id, $key );
		}
	}

	// Product ID
	if ( isset( $_POST['tovar_s_konfiguratorom'] ) ) {
		$val = absint( $_POST['tovar_s_konfiguratorom'] );
		$val ? update_post_meta( $post_id, 'tovar_s_konfiguratorom', $val ) : delete_post_meta( $post_id, 'tovar_s_konfiguratorom' );
	}

	// Params repeater
	if ( ! empty( $_POST['models_params_sent'] ) ) {
		if ( isset( $_POST['perechen_parametrov_pod_zagolovokom'] ) && is_array( $_POST['perechen_parametrov_pod_zagolovokom'] ) ) {
			$params = [];
			foreach ( $_POST['perechen_parametrov_pod_zagolovokom'] as $row ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
				if ( ! is_array( $row ) ) {
					continue;
				}
				$item = sanitize_text_field( wp_unslash( $row['element_spiska'] ?? '' ) );
				if ( $item !== '' ) {
					$params[] = [ 'element_spiska' => $item ];
				}
			}
			update_post_meta( $post_id, 'perechen_parametrov_pod_zagolovokom', $params );
		} else {
			update_post_meta( $post_id, 'perechen_parametrov_pod_zagolovokom', [] );
		}
	}

	// Camera position (per-model override; empty = use global)
	$cam_keys = [ 'mn_cam_x', 'mn_cam_y', 'mn_cam_z', 'mn_cam_target_x', 'mn_cam_target_y', 'mn_cam_target_z' ];
	foreach ( $cam_keys as $key ) {
		if ( isset( $_POST[ $key ] ) && $_POST[ $key ] !== '' ) {
			update_post_meta( $post_id, $key, (string) round( (float) wp_unslash( $_POST[ $key ] ), 4 ) );
		} else {
			delete_post_meta( $post_id, $key );
		}
	}
	update_post_meta( $post_id, 'mn_cam_debug', isset( $_POST['mn_cam_debug'] ) ? '1' : '0' );
}
