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
	$bg_color   = get_post_meta( $post->ID, 'mn_bg_color', true ) ?: '#f2f2fb';
	$edge_color = get_post_meta( $post->ID, 'mn_edge_color', true ) ?: '#0057b8';
	$auto_rotate = get_post_meta( $post->ID, 'mn_auto_rotate', true );
	$auto_rotate = $auto_rotate === '' ? '1' : $auto_rotate;
	?>
	<div style="margin-bottom:12px">
		<label for="mn_bg_color" style="display:block;font-weight:600;margin-bottom:4px">
			<?php esc_html_e( 'Background Color', 'hoger' ); ?>
		</label>
		<input type="color" id="mn_bg_color" name="mn_bg_color"
			value="<?php echo esc_attr( $bg_color ); ?>">
	</div>
	<div style="margin-bottom:12px">
		<label for="mn_edge_color" style="display:block;font-weight:600;margin-bottom:4px">
			<?php esc_html_e( 'Edge Color', 'hoger' ); ?>
		</label>
		<input type="color" id="mn_edge_color" name="mn_edge_color"
			value="<?php echo esc_attr( $edge_color ); ?>">
	</div>
	<div style="margin-bottom:12px">
		<label style="display:flex;align-items:center;gap:6px;font-weight:600">
			<input type="checkbox" name="mn_auto_rotate" value="1"
				<?php checked( $auto_rotate, '1' ); ?>>
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
		});
	" );
}

// ─── Save post meta ────────────────────────────────────────────────────────

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

	// Auto rotate checkbox
	$auto_rotate = isset( $_POST['mn_auto_rotate'] ) ? '1' : '0';
	update_post_meta( $post_id, 'mn_auto_rotate', $auto_rotate );

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
