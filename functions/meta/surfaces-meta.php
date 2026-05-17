<?php

add_action( 'add_meta_boxes', 'hoger_surfaces_meta_boxes' );
function hoger_surfaces_meta_boxes() {
	add_meta_box(
		'surfaces_fields',
		__( 'Surface Fields', 'hoger' ),
		'hoger_surfaces_meta_box_cb',
		'surfaces',
		'normal',
		'default'
	);
}

function hoger_surfaces_meta_box_cb( $post ) {
	wp_nonce_field( 'hoger_surfaces_save', 'hoger_surfaces_nonce' );

	$main_photo  = get_post_meta( $post->ID, 'osnovnoe_foto', true );
	$description = get_post_meta( $post->ID, 'opisanie_tipa_poverhnosti', true );
	$colors_count = (int) get_post_meta( $post->ID, 'czveta', true );

	// Main photo
	$img_src = $main_photo ? wp_get_attachment_image_url( $main_photo, 'medium' ) : '';
	?>
	<div class="hoger-meta-field" style="margin-bottom:20px">
		<label style="display:block;font-weight:600;margin-bottom:6px">
			<?php esc_html_e( 'Main Photo', 'hoger' ); ?>
		</label>
		<div class="hoger-image-picker" data-field="osnovnoe_foto">
			<input type="hidden" name="osnovnoe_foto" value="<?php echo esc_attr( $main_photo ); ?>">
			<div class="hoger-img-preview" style="margin-bottom:6px">
				<?php if ( $img_src ) : ?>
					<img src="<?php echo esc_url( $img_src ); ?>" style="max-width:200px;display:block">
				<?php endif; ?>
			</div>
			<button type="button" class="button hoger-upload-btn" data-target="osnovnoe_foto">
				<?php esc_html_e( 'Select Image', 'hoger' ); ?>
			</button>
			<?php if ( $main_photo ) : ?>
				<button type="button" class="button hoger-remove-btn" data-target="osnovnoe_foto" style="margin-left:4px">
					<?php esc_html_e( 'Remove', 'hoger' ); ?>
				</button>
			<?php endif; ?>
		</div>
	</div>

	<div class="hoger-meta-field" style="margin-bottom:20px">
		<label for="opisanie_tipa_poverhnosti" style="display:block;font-weight:600;margin-bottom:6px">
			<?php esc_html_e( 'Surface Type Description', 'hoger' ); ?>
		</label>
		<textarea id="opisanie_tipa_poverhnosti" name="opisanie_tipa_poverhnosti"
			rows="4" style="width:100%"><?php echo esc_textarea( $description ); ?></textarea>
	</div>

	<div class="hoger-meta-field" id="hoger-colors-wrap">
		<label style="display:block;font-weight:600;margin-bottom:8px">
			<?php esc_html_e( 'Colors', 'hoger' ); ?>
		</label>
		<input type="hidden" id="czveta_count" name="czveta" value="<?php echo esc_attr( $colors_count ); ?>">
		<table id="hoger-colors-table" style="width:100%;border-collapse:collapse;margin-bottom:10px">
			<thead>
				<tr>
					<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #ddd;width:35%">
						<?php esc_html_e( 'Color Name', 'hoger' ); ?>
					</th>
					<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #ddd;width:30%">
						<?php esc_html_e( 'Color Photo', 'hoger' ); ?>
					</th>
					<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #ddd;width:25%">
						<?php esc_html_e( 'Finish', 'hoger' ); ?>
					</th>
					<th style="width:10%"></th>
				</tr>
			</thead>
			<tbody id="hoger-colors-body">
				<?php
				$finish_options = [
					'matte'  => __( 'Matte', 'hoger' ),
					'satin'  => __( 'Satin', 'hoger' ),
					'gloss'  => __( 'Gloss', 'hoger' ),
					'chrome' => __( 'Chrome', 'hoger' ),
				];
				for ( $i = 0; $i < $colors_count; $i++ ) :
					$name      = get_post_meta( $post->ID, "czveta_{$i}_nazvanie_czveta", true );
					$photo_id  = get_post_meta( $post->ID, "czveta_{$i}_foto_czveta", true );
					$photo_src = $photo_id ? wp_get_attachment_image_url( $photo_id, 'thumbnail' ) : '';
					$finish    = get_post_meta( $post->ID, "czveta_{$i}_finish", true ) ?: 'matte';
					?>
					<tr class="hoger-color-row" data-index="<?php echo esc_attr( $i ); ?>">
						<td style="padding:6px 8px;vertical-align:top">
							<input type="text"
								name="czveta_<?php echo esc_attr( $i ); ?>_nazvanie_czveta"
								value="<?php echo esc_attr( $name ); ?>"
								style="width:100%">
						</td>
						<td style="padding:6px 8px;vertical-align:top">
							<input type="hidden"
								name="czveta_<?php echo esc_attr( $i ); ?>_foto_czveta"
								value="<?php echo esc_attr( $photo_id ); ?>">
							<?php if ( $photo_src ) : ?>
								<img src="<?php echo esc_url( $photo_src ); ?>"
									style="max-width:80px;display:block;margin-bottom:4px">
							<?php endif; ?>
							<button type="button" class="button hoger-upload-color-btn"
								data-index="<?php echo esc_attr( $i ); ?>">
								<?php esc_html_e( 'Select', 'hoger' ); ?>
							</button>
							<?php if ( $photo_id ) : ?>
								<button type="button" class="button hoger-remove-color-btn"
									data-index="<?php echo esc_attr( $i ); ?>" style="margin-left:4px">
									<?php esc_html_e( 'Remove', 'hoger' ); ?>
								</button>
							<?php endif; ?>
						</td>
						<td style="padding:6px 8px;vertical-align:top">
							<select name="czveta_<?php echo esc_attr( $i ); ?>_finish" style="width:100%">
								<?php foreach ( $finish_options as $val => $label ) : ?>
									<option value="<?php echo esc_attr( $val ); ?>"<?php selected( $finish, $val ); ?>>
										<?php echo esc_html( $label ); ?>
									</option>
								<?php endforeach; ?>
							</select>
						</td>
						<td style="padding:6px 8px;vertical-align:top">
							<button type="button" class="button hoger-delete-row-btn">✕</button>
						</td>
					</tr>
				<?php endfor; ?>
			</tbody>
		</table>
		<button type="button" class="button button-secondary" id="hoger-add-color">
			<?php esc_html_e( '+ Add Color', 'hoger' ); ?>
		</button>
	</div>

	<script>
	(function($) {
		var colorIndex = <?php echo (int) $colors_count; ?>;

		// Update row count hidden field
		function updateCount() {
			var rows = $('#hoger-colors-body .hoger-color-row');
			rows.each(function(i) {
				$(this).attr('data-index', i);
				$(this).find('input[name*="_nazvanie_czveta"]').attr('name', 'czveta_' + i + '_nazvanie_czveta');
				$(this).find('input[name*="_foto_czveta"]').attr('name', 'czveta_' + i + '_foto_czveta');
				$(this).find('select[name*="_finish"]').attr('name', 'czveta_' + i + '_finish');
				$(this).find('.hoger-upload-color-btn').attr('data-index', i);
				$(this).find('.hoger-remove-color-btn').attr('data-index', i);
			});
			$('#czveta_count').val(rows.length);
			colorIndex = rows.length;
		}

		// Add row
		$('#hoger-add-color').on('click', function() {
			var i = colorIndex;
			var row = '<tr class="hoger-color-row" data-index="' + i + '">' +
				'<td style="padding:6px 8px;vertical-align:top">' +
					'<input type="text" name="czveta_' + i + '_nazvanie_czveta" value="" style="width:100%">' +
				'</td>' +
				'<td style="padding:6px 8px;vertical-align:top">' +
					'<input type="hidden" name="czveta_' + i + '_foto_czveta" value="">' +
					'<button type="button" class="button hoger-upload-color-btn" data-index="' + i + '"><?php esc_html_e( 'Select', 'hoger' ); ?></button>' +
				'</td>' +
				'<td style="padding:6px 8px;vertical-align:top">' +
					'<select name="czveta_' + i + '_finish" style="width:100%">' +
						'<option value="matte"><?php esc_html_e( 'Matte', 'hoger' ); ?></option>' +
						'<option value="satin"><?php esc_html_e( 'Satin', 'hoger' ); ?></option>' +
						'<option value="gloss"><?php esc_html_e( 'Gloss', 'hoger' ); ?></option>' +
						'<option value="chrome"><?php esc_html_e( 'Chrome', 'hoger' ); ?></option>' +
					'</select>' +
				'</td>' +
				'<td style="padding:6px 8px;vertical-align:top">' +
					'<button type="button" class="button hoger-delete-row-btn">✕</button>' +
				'</td>' +
			'</tr>';
			$('#hoger-colors-body').append(row);
			colorIndex++;
			$('#czveta_count').val(colorIndex);
		});

		// Delete row
		$(document).on('click', '.hoger-delete-row-btn', function() {
			$(this).closest('tr').remove();
			updateCount();
		});

		// Media uploader — main photo
		$(document).on('click', '.hoger-upload-btn[data-target="osnovnoe_foto"]', function() {
			var frame = wp.media({ title: '<?php esc_html_e( 'Select Image', 'hoger' ); ?>', multiple: false });
			frame.on('select', function() {
				var att = frame.state().get('selection').first().toJSON();
				$('input[name="osnovnoe_foto"]').val(att.id);
				var preview = att.sizes && att.sizes.medium ? att.sizes.medium.url : att.url;
				$('.hoger-image-picker[data-field="osnovnoe_foto"] .hoger-img-preview').html('<img src="' + preview + '" style="max-width:200px;display:block">');
			});
			frame.open();
		});

		// Remove main photo
		$(document).on('click', '.hoger-remove-btn[data-target="osnovnoe_foto"]', function() {
			$('input[name="osnovnoe_foto"]').val('');
			$('.hoger-image-picker[data-field="osnovnoe_foto"] .hoger-img-preview').html('');
		});

		// Media uploader — color photo
		$(document).on('click', '.hoger-upload-color-btn', function() {
			var btn = $(this);
			var idx = btn.data('index');
			var frame = wp.media({ title: '<?php esc_html_e( 'Select Image', 'hoger' ); ?>', multiple: false });
			frame.on('select', function() {
				var att = frame.state().get('selection').first().toJSON();
				var row = btn.closest('tr');
				row.find('input[name="czveta_' + idx + '_foto_czveta"]').val(att.id);
				var thumb = att.sizes && att.sizes.thumbnail ? att.sizes.thumbnail.url : att.url;
				var img = row.find('img');
				if (img.length) {
					img.attr('src', thumb);
				} else {
					btn.before('<img src="' + thumb + '" style="max-width:80px;display:block;margin-bottom:4px">');
				}
			});
			frame.open();
		});

		// Remove color photo
		$(document).on('click', '.hoger-remove-color-btn', function() {
			var idx = $(this).data('index');
			var row = $(this).closest('tr');
			row.find('input[name="czveta_' + idx + '_foto_czveta"]').val('');
			row.find('img').remove();
		});

	})(jQuery);
	</script>
	<?php
}

add_action( 'save_post_surfaces', 'hoger_surfaces_save_meta', 10, 2 );
function hoger_surfaces_save_meta( $post_id, $post ) {
	if ( ! isset( $_POST['hoger_surfaces_nonce'] ) ) return;
	if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['hoger_surfaces_nonce'] ) ), 'hoger_surfaces_save' ) ) return;
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
	if ( ! current_user_can( 'edit_post', $post_id ) ) return;

	// Main photo
	if ( isset( $_POST['osnovnoe_foto'] ) ) {
		$val = absint( $_POST['osnovnoe_foto'] );
		if ( $val ) {
			update_post_meta( $post_id, 'osnovnoe_foto', $val );
		} else {
			delete_post_meta( $post_id, 'osnovnoe_foto' );
		}
	}

	// Description
	if ( isset( $_POST['opisanie_tipa_poverhnosti'] ) ) {
		update_post_meta(
			$post_id,
			'opisanie_tipa_poverhnosti',
			sanitize_textarea_field( wp_unslash( $_POST['opisanie_tipa_poverhnosti'] ) )
		);
	}

	// Colors repeater
	$count = isset( $_POST['czveta'] ) ? absint( $_POST['czveta'] ) : 0;
	update_post_meta( $post_id, 'czveta', $count );

	// Delete old rows beyond new count
	$old_count = (int) get_post_meta( $post_id, 'czveta', true );
	for ( $i = $count; $i < $old_count + 10; $i++ ) {
		delete_post_meta( $post_id, "czveta_{$i}_nazvanie_czveta" );
		delete_post_meta( $post_id, "czveta_{$i}_foto_czveta" );
		delete_post_meta( $post_id, "czveta_{$i}_finish" );
	}

	for ( $i = 0; $i < $count; $i++ ) {
		$name_key  = "czveta_{$i}_nazvanie_czveta";
		$photo_key = "czveta_{$i}_foto_czveta";

		$finish_key = "czveta_{$i}_finish";
		$allowed    = [ 'matte', 'satin', 'gloss', 'chrome' ];

		if ( isset( $_POST[ $name_key ] ) ) {
			update_post_meta( $post_id, $name_key, sanitize_text_field( wp_unslash( $_POST[ $name_key ] ) ) );
		}
		if ( isset( $_POST[ $photo_key ] ) ) {
			$photo_val = absint( $_POST[ $photo_key ] );
			if ( $photo_val ) {
				update_post_meta( $post_id, $photo_key, $photo_val );
			} else {
				delete_post_meta( $post_id, $photo_key );
			}
		}
		if ( isset( $_POST[ $finish_key ] ) ) {
			$finish_val = sanitize_key( wp_unslash( $_POST[ $finish_key ] ) );
			update_post_meta( $post_id, $finish_key, in_array( $finish_val, $allowed, true ) ? $finish_val : 'matte' );
		}
	}
}

// Enqueue WP media on surfaces edit screen
add_action( 'admin_enqueue_scripts', 'hoger_surfaces_enqueue_media' );
function hoger_surfaces_enqueue_media( $hook ) {
	global $post;
	if ( ( 'post.php' === $hook || 'post-new.php' === $hook ) && isset( $post->post_type ) && 'surfaces' === $post->post_type ) {
		wp_enqueue_media();
	}
}
