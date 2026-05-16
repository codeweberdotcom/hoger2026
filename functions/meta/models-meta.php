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

	$fbx_id = get_post_meta( $post->ID, 'model_fbx', true );
	hoger_models_media_field( 'model_fbx', __( 'FBX / GLB / OBJ File', 'hoger' ), $fbx_id, 'file' );
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

// ─── Meta box 3: Technical Drawings ───────────────────────────────────────

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
}
