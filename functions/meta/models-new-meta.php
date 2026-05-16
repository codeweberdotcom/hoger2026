<?php

// ─── Allow 3D file types in media library ─────────────────────────────────

add_filter( 'upload_mimes', 'hoger_models_new_upload_mimes' );
function hoger_models_new_upload_mimes( $mimes ) {
	$mimes['fbx']  = 'application/octet-stream';
	$mimes['obj']  = 'application/octet-stream';
	$mimes['glb']  = 'model/gltf-binary';
	$mimes['gltf'] = 'model/gltf+json';
	return $mimes;
}

add_filter( 'wp_check_filetype_and_ext', 'hoger_models_new_check_filetype', 10, 4 );
function hoger_models_new_check_filetype( $data, $file, $filename, $mimes ) {
	$ext = strtolower( pathinfo( $filename, PATHINFO_EXTENSION ) );
	if ( in_array( $ext, [ 'fbx', 'obj', 'glb', 'gltf' ], true ) ) {
		$data['ext']  = $ext;
		$data['type'] = isset( $mimes[ $ext ] ) ? $mimes[ $ext ] : 'application/octet-stream';
	}
	return $data;
}

// ─── Meta boxes registration ───────────────────────────────────────────────

add_action( 'add_meta_boxes', 'hoger_models_new_meta_boxes' );
function hoger_models_new_meta_boxes() {
	add_meta_box(
		'models_new_3d_file',
		__( '3D Model File', 'hoger' ),
		'hoger_models_new_3d_file_cb',
		'models_new',
		'normal',
		'high'
	);
	add_meta_box(
		'models_new_product_info',
		__( 'Product Information', 'hoger' ),
		'hoger_models_new_product_info_cb',
		'models_new',
		'normal'
	);
	add_meta_box(
		'models_new_viewer_settings',
		__( 'Viewer Settings', 'hoger' ),
		'hoger_models_new_viewer_settings_cb',
		'models_new',
		'side'
	);
	add_meta_box(
		'models_new_mesh_colors',
		__( 'Mesh Colors', 'hoger' ),
		'hoger_models_new_mesh_colors_cb',
		'models_new',
		'normal'
	);
}

// ─── Helper: render media upload row ──────────────────────────────────────

function hoger_models_new_media_field( $key, $label, $value, $type = 'image' ) {
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

	$mime = $type === 'image' ? 'image' : 'application';
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

function hoger_models_new_3d_file_cb( $post ) {
	wp_nonce_field( 'hoger_models_new_save', 'hoger_models_new_nonce' );
	$obj_id = get_post_meta( $post->ID, 'mn_model_file', true );
	hoger_models_new_media_field( 'mn_model_file', __( 'OBJ / GLB / FBX File', 'hoger' ), $obj_id, 'file' );
}

// ─── Meta box 2: Product Information ──────────────────────────────────────

function hoger_models_new_product_info_cb( $post ) {
	$subtitle    = get_post_meta( $post->ID, 'mn_subtitle', true );
	$description = get_post_meta( $post->ID, 'mn_description', true );
	$katalog_id  = get_post_meta( $post->ID, 'mn_catalog_pdf', true );

	$params_raw = get_post_meta( $post->ID, 'mn_params', true );
	if ( ! is_array( $params_raw ) ) {
		$params_raw = [ [ 'value' => '' ] ];
	}
	?>

	<div class="hoger-meta-field" style="margin-bottom:16px">
		<label for="mn_subtitle" style="display:block;font-weight:600;margin-bottom:4px">
			<?php esc_html_e( 'Subtitle', 'hoger' ); ?>
		</label>
		<input type="text" id="mn_subtitle" name="mn_subtitle"
			value="<?php echo esc_attr( $subtitle ); ?>" class="large-text">
	</div>

	<div class="hoger-meta-field" style="margin-bottom:16px">
		<label style="display:block;font-weight:600;margin-bottom:4px"><?php esc_html_e( 'Parameters List', 'hoger' ); ?></label>
		<input type="hidden" name="mn_params_sent" value="1">
		<div class="mn-params-rows">
			<?php foreach ( $params_raw as $i => $row ) : ?>
				<div class="mn-param-row" style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
					<input type="text"
						name="mn_params[<?php echo (int) $i; ?>][value]"
						value="<?php echo esc_attr( $row['value'] ?? '' ); ?>"
						class="large-text"
						placeholder="<?php esc_attr_e( 'Parameter', 'hoger' ); ?>">
					<button type="button" class="button mn-param-remove"><?php esc_html_e( 'Remove', 'hoger' ); ?></button>
				</div>
			<?php endforeach; ?>
		</div>
		<button type="button" class="button mn-param-add"><?php esc_html_e( 'Add Parameter', 'hoger' ); ?></button>
	</div>

	<div class="hoger-meta-field" style="margin-bottom:16px">
		<label for="mn_description" style="display:block;font-weight:600;margin-bottom:4px">
			<?php esc_html_e( 'Description', 'hoger' ); ?>
		</label>
		<textarea id="mn_description" name="mn_description"
			class="large-text" rows="4"><?php echo esc_textarea( $description ); ?></textarea>
	</div>

	<?php hoger_models_new_media_field( 'mn_catalog_pdf', __( 'Technical Catalog (PDF)', 'hoger' ), $katalog_id, 'pdf' ); ?>
	<?php
}

// ─── Meta box 3: Viewer Settings (sidebar) ────────────────────────────────

function hoger_models_new_viewer_settings_cb( $post ) {
	$bg_color       = get_post_meta( $post->ID, 'mn_bg_color', true ) ?: '#f2f2fb';
	$edge_color     = get_post_meta( $post->ID, 'mn_edge_color', true ) ?: '#0057b8';
	$bg_soft        = get_post_meta( $post->ID, 'mn_bg_soft', true );
	$edge_soft      = get_post_meta( $post->ID, 'mn_edge_soft', true );
	$use_fbx_colors = get_post_meta( $post->ID, 'mn_use_fbx_colors', true );
	$auto_rotate    = get_post_meta( $post->ID, 'mn_auto_rotate', true );
	$auto_rotate    = $auto_rotate === '' ? '1' : $auto_rotate;

	$bg_colors = [
		// Светлые
		'#ffffff' => __( 'White', 'hoger' ),
		'#fefefe' => __( 'Light ($gray-100)', 'hoger' ),
		'#f6f7f9' => __( 'Gray ($gray-200)', 'hoger' ),
		'#f2f2fb' => __( 'Light Gray (default)', 'hoger' ),
		'#cacaca' => __( 'Inverse ($gray-300)', 'hoger' ),
		// Нейтральные
		'#aab0bc' => __( 'Gray ($gray-400)', 'hoger' ),
		'#959ca9' => __( 'Gray ($gray-500)', 'hoger' ),
		'#60697b' => __( 'Gray ($gray-600)', 'hoger' ),
		// Тёмные
		'#2f353a' => __( 'Gray ($gray-700)', 'hoger' ),
		'#21262c' => __( 'Gray ($gray-800)', 'hoger' ),
		'#1e2228' => __( 'Navy ($gray-900)', 'hoger' ),
		'#292728' => __( 'Dark (hoger)', 'hoger' ),
		'#262b32' => __( 'Dark (theme)', 'hoger' ),
		'#343f52' => __( 'Navy (theme)', 'hoger' ),
		// Акцентные
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
	<?php
}

// ─── Admin scripts ─────────────────────────────────────────────────────────

add_action( 'admin_enqueue_scripts', 'hoger_models_new_admin_scripts' );
function hoger_models_new_admin_scripts( $hook ) {
	global $post_type;
	if ( ! in_array( $hook, [ 'post.php', 'post-new.php' ], true ) || $post_type !== 'models_new' ) {
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

			$(document).on('click', '.hoger-media-remove', function(e) {
				e.preventDefault();
				var field = $(this).data('field');
				$('#' + field).val('');
				$('#' + field + '_preview').empty();
				$(this).hide();
			});

			var paramIndex = $('.mn-param-row').length;

			$(document).on('click', '.mn-param-add', function(e) {
				e.preventDefault();
				var html = '<div class=\"mn-param-row\" style=\"display:flex;gap:8px;align-items:center;margin-bottom:6px;\">' +
					'<input type=\"text\" name=\"mn_params[' + paramIndex + '][value]\" class=\"large-text\" placeholder=\"Parameter\">' +
					'<button type=\"button\" class=\"button mn-param-remove\">Remove</button>' +
					'</div>';
				$('.mn-params-rows').append(html);
				paramIndex++;
			});

			$(document).on('click', '.mn-param-remove', function(e) {
				e.preventDefault();
				$(this).closest('.mn-param-row').remove();
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
		});
	" );
}

// ─── Save post meta ────────────────────────────────────────────────────────

// ─── Meta box 4: Mesh Colors ──────────────────────────────────────────────

function hoger_models_new_mesh_colors_cb( $post ) {
	$mesh_colors = get_post_meta( $post->ID, 'mn_mesh_colors', true ) ?: '{}';
	if ( json_decode( $mesh_colors ) === null ) {
		$mesh_colors = '{}';
	}

	$model_id  = (int) get_post_meta( $post->ID, 'mn_model_file', true );
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

	</div>
	<?php
}

// ─── Save ─────────────────────────────────────────────────────────────────

add_action( 'save_post_models_new', 'hoger_models_new_save_meta', 10, 2 );
function hoger_models_new_save_meta( $post_id, $post ) {
	if ( ! isset( $_POST['hoger_models_new_nonce'] ) ) {
		return;
	}
	if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['hoger_models_new_nonce'] ) ), 'hoger_models_new_save' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	// Attachment fields
	foreach ( [ 'mn_model_file', 'mn_catalog_pdf' ] as $key ) {
		if ( isset( $_POST[ $key ] ) ) {
			$val = absint( $_POST[ $key ] );
			$val ? update_post_meta( $post_id, $key, $val ) : delete_post_meta( $post_id, $key );
		}
	}

	// Text fields
	foreach ( [ 'mn_subtitle', 'mn_description' ] as $key ) {
		if ( isset( $_POST[ $key ] ) ) {
			$val = sanitize_textarea_field( wp_unslash( $_POST[ $key ] ) );
			$val !== '' ? update_post_meta( $post_id, $key, $val ) : delete_post_meta( $post_id, $key );
		}
	}

	// Color fields
	foreach ( [ 'mn_bg_color', 'mn_edge_color' ] as $key ) {
		if ( isset( $_POST[ $key ] ) ) {
			$val = sanitize_hex_color( wp_unslash( $_POST[ $key ] ) );
			$val ? update_post_meta( $post_id, $key, $val ) : delete_post_meta( $post_id, $key );
		}
	}

	// Checkboxes
	update_post_meta( $post_id, 'mn_auto_rotate',    isset( $_POST['mn_auto_rotate'] )    ? '1' : '0' );
	update_post_meta( $post_id, 'mn_bg_soft',        isset( $_POST['mn_bg_soft'] )        ? '1' : '0' );
	update_post_meta( $post_id, 'mn_edge_soft',      isset( $_POST['mn_edge_soft'] )      ? '1' : '0' );
	update_post_meta( $post_id, 'mn_use_fbx_colors', isset( $_POST['mn_use_fbx_colors'] ) ? '1' : '0' );

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

	// Params repeater
	if ( ! empty( $_POST['mn_params_sent'] ) ) {
		if ( isset( $_POST['mn_params'] ) && is_array( $_POST['mn_params'] ) ) {
			$params = [];
			foreach ( $_POST['mn_params'] as $row ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
				if ( ! is_array( $row ) ) {
					continue;
				}
				$item = sanitize_text_field( wp_unslash( $row['value'] ?? '' ) );
				if ( $item !== '' ) {
					$params[] = [ 'value' => $item ];
				}
			}
			update_post_meta( $post_id, 'mn_params', $params );
		} else {
			update_post_meta( $post_id, 'mn_params', [] );
		}
	}
}
