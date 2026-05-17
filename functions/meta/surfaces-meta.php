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

	$main_photo   = get_post_meta( $post->ID, 'osnovnoe_foto', true );
	$description  = get_post_meta( $post->ID, 'opisanie_tipa_poverhnosti', true );
	$colors_count = (int) get_post_meta( $post->ID, 'czveta', true );

	// Global finish
	$finish         = get_post_meta( $post->ID, 'finish', true ) ?: 'matte';
	$finish_options = [
		'matte'  => __( 'Matte', 'hoger' ),
		'satin'  => __( 'Satin', 'hoger' ),
		'gloss'  => __( 'Gloss', 'hoger' ),
		'chrome' => __( 'Chrome', 'hoger' ),
	];

	// Global UV mapping
	$use_model_uv = get_post_meta( $post->ID, 'use_model_uv', true );
	$uv_checked   = ( $use_model_uv !== '0' );
	$repeat_x     = get_post_meta( $post->ID, 'repeat_x', true ) ?: '1';
	$repeat_y     = get_post_meta( $post->ID, 'repeat_y', true ) ?: '1';
	$rotation     = get_post_meta( $post->ID, 'rotation', true ) ?: '0';

	// Per-map UV
	$rm_repeat_x  = get_post_meta( $post->ID, 'reflection_mask_repeat_x', true ) ?: '1';
	$rm_repeat_y  = get_post_meta( $post->ID, 'reflection_mask_repeat_y', true ) ?: '1';
	$rm_rotation  = get_post_meta( $post->ID, 'reflection_mask_rotation', true ) ?: '0';
	$bm_repeat_x  = get_post_meta( $post->ID, 'bump_map_repeat_x', true ) ?: '1';
	$bm_repeat_y  = get_post_meta( $post->ID, 'bump_map_repeat_y', true ) ?: '1';
	$bm_rotation  = get_post_meta( $post->ID, 'bump_map_rotation', true ) ?: '0';

	// Main photo
	$img_src = $main_photo ? wp_get_attachment_image_url( $main_photo, 'medium' ) : '';
	?>
	<div class="hoger-meta-field" style="margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #ddd">
		<div style="display:flex;gap:32px;flex-wrap:wrap">

			<div>
				<label style="display:block;font-weight:600;margin-bottom:10px">
					<?php esc_html_e( 'Finish', 'hoger' ); ?>
				</label>
				<select name="finish" style="width:160px">
					<?php foreach ( $finish_options as $val => $label ) : ?>
						<option value="<?php echo esc_attr( $val ); ?>"<?php selected( $finish, $val ); ?>>
							<?php echo esc_html( $label ); ?>
						</option>
					<?php endforeach; ?>
				</select>
			</div>

			<div>
				<label style="display:block;font-weight:600;margin-bottom:10px">
					<?php esc_html_e( 'UV Mapping', 'hoger' ); ?>
				</label>
				<label style="display:flex;align-items:center;gap:6px;margin-bottom:10px;cursor:pointer">
					<input type="checkbox" id="hoger-use-model-uv" name="use_model_uv" value="1"
						<?php checked( $uv_checked ); ?>>
					<?php esc_html_e( 'Use model UV (ignore repeat & rotation)', 'hoger' ); ?>
				</label>
				<div id="hoger-uv-fields" style="display:flex;gap:16px;flex-wrap:wrap;<?php echo $uv_checked ? 'display:none' : ''; ?>">
					<label style="font-size:13px">
						<?php esc_html_e( 'Repeat X', 'hoger' ); ?><br>
						<input type="number" name="repeat_x" value="<?php echo esc_attr( $repeat_x ); ?>"
							step="0.1" min="0.1" style="width:80px">
					</label>
					<label style="font-size:13px">
						<?php esc_html_e( 'Repeat Y', 'hoger' ); ?><br>
						<input type="number" name="repeat_y" value="<?php echo esc_attr( $repeat_y ); ?>"
							step="0.1" min="0.1" style="width:80px">
					</label>
					<label style="font-size:13px">
						<?php esc_html_e( 'Rotation °', 'hoger' ); ?><br>
						<input type="number" name="rotation" value="<?php echo esc_attr( $rotation ); ?>"
							step="1" min="-360" max="360" style="width:80px">
					</label>
				</div>
			</div>

		</div>
	</div>

	<div class="hoger-meta-field" style="margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #ddd">
		<div style="display:flex;gap:32px;flex-wrap:wrap">

			<div style="min-width:220px">
				<label style="display:block;font-weight:600;margin-bottom:8px">
					<?php esc_html_e( 'Reflection Mask', 'hoger' ); ?>
				</label>
				<p style="margin:0 0 8px;font-size:12px;color:#777"><?php esc_html_e( 'Grayscale: dark = reflective, bright = matte (roughnessMap)', 'hoger' ); ?></p>
				<?php
				$refl_mask_id  = get_post_meta( $post->ID, 'reflection_mask_id', true );
				$refl_mask_src = $refl_mask_id ? wp_get_attachment_image_url( $refl_mask_id, 'thumbnail' ) : '';
				?>
				<div class="hoger-image-picker" data-field="reflection_mask_id">
					<input type="hidden" name="reflection_mask_id" value="<?php echo esc_attr( $refl_mask_id ); ?>">
					<div class="hoger-img-preview" style="margin-bottom:6px">
						<?php if ( $refl_mask_src ) : ?>
							<img src="<?php echo esc_url( $refl_mask_src ); ?>" style="max-width:80px;display:block">
						<?php endif; ?>
					</div>
					<button type="button" class="button hoger-upload-btn" data-target="reflection_mask_id">
						<?php esc_html_e( 'Select Image', 'hoger' ); ?>
					</button>
					<button type="button" class="button hoger-remove-btn" data-target="reflection_mask_id"
						style="margin-left:4px<?php echo $refl_mask_id ? '' : ';display:none'; ?>">
						<?php esc_html_e( 'Remove', 'hoger' ); ?>
					</button>
				</div>
				<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px">
					<label style="font-size:13px">
						<?php esc_html_e( 'Strength', 'hoger' ); ?> (0–2)<br>
						<input type="number" name="reflection_strength"
							value="<?php echo esc_attr( get_post_meta( $post->ID, 'reflection_strength', true ) ?: '1' ); ?>"
							step="0.05" min="0" max="2" style="width:70px;margin-top:4px">
					</label>
					<label style="font-size:13px">
						<?php esc_html_e( 'Roughness Depth', 'hoger' ); ?> (0–1)<br>
						<input type="number" name="roughness_map_depth"
							value="<?php echo esc_attr( get_post_meta( $post->ID, 'roughness_map_depth', true ) ?: '1' ); ?>"
							step="0.05" min="0" max="1" style="width:70px;margin-top:4px">
					</label>
					<label style="font-size:13px">
						<?php esc_html_e( 'Repeat X', 'hoger' ); ?><br>
						<input type="number" name="reflection_mask_repeat_x"
							value="<?php echo esc_attr( $rm_repeat_x ); ?>"
							step="any" min="0.1" style="width:70px;margin-top:4px">
					</label>
					<label style="font-size:13px">
						<?php esc_html_e( 'Repeat Y', 'hoger' ); ?><br>
						<input type="number" name="reflection_mask_repeat_y"
							value="<?php echo esc_attr( $rm_repeat_y ); ?>"
							step="any" min="0.1" style="width:70px;margin-top:4px">
					</label>
					<label style="font-size:13px">
						<?php esc_html_e( 'Rotation °', 'hoger' ); ?><br>
						<input type="number" name="reflection_mask_rotation"
							value="<?php echo esc_attr( $rm_rotation ); ?>"
							step="1" min="-360" max="360" style="width:70px;margin-top:4px">
					</label>
				</div>
			</div>

			<div style="min-width:220px">
				<label style="display:block;font-weight:600;margin-bottom:8px">
					<?php esc_html_e( 'Bump Map', 'hoger' ); ?>
				</label>
				<p style="margin:0 0 8px;font-size:12px;color:#777"><?php esc_html_e( 'Grayscale: white = raised, black = depressed (bumpMap)', 'hoger' ); ?></p>
				<?php
				$bump_map_id  = get_post_meta( $post->ID, 'bump_map_id', true );
				$bump_map_src = $bump_map_id ? wp_get_attachment_image_url( $bump_map_id, 'thumbnail' ) : '';
				?>
				<div class="hoger-image-picker" data-field="bump_map_id">
					<input type="hidden" name="bump_map_id" value="<?php echo esc_attr( $bump_map_id ); ?>">
					<div class="hoger-img-preview" style="margin-bottom:6px">
						<?php if ( $bump_map_src ) : ?>
							<img src="<?php echo esc_url( $bump_map_src ); ?>" style="max-width:80px;display:block">
						<?php endif; ?>
					</div>
					<button type="button" class="button hoger-upload-btn" data-target="bump_map_id">
						<?php esc_html_e( 'Select Image', 'hoger' ); ?>
					</button>
					<button type="button" class="button hoger-remove-btn" data-target="bump_map_id"
						style="margin-left:4px<?php echo $bump_map_id ? '' : ';display:none'; ?>">
						<?php esc_html_e( 'Remove', 'hoger' ); ?>
					</button>
				</div>
				<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px">
					<label style="font-size:13px">
						<?php esc_html_e( 'Scale', 'hoger' ); ?> (0–5)<br>
						<input type="number" name="bump_scale"
							value="<?php echo esc_attr( get_post_meta( $post->ID, 'bump_scale', true ) ?: '1' ); ?>"
							step="0.05" min="0" max="5" style="width:70px;margin-top:4px">
					</label>
					<label style="font-size:13px">
						<?php esc_html_e( 'Repeat X', 'hoger' ); ?><br>
						<input type="number" name="bump_map_repeat_x"
							value="<?php echo esc_attr( $bm_repeat_x ); ?>"
							step="any" min="0.1" style="width:70px;margin-top:4px">
					</label>
					<label style="font-size:13px">
						<?php esc_html_e( 'Repeat Y', 'hoger' ); ?><br>
						<input type="number" name="bump_map_repeat_y"
							value="<?php echo esc_attr( $bm_repeat_y ); ?>"
							step="any" min="0.1" style="width:70px;margin-top:4px">
					</label>
					<label style="font-size:13px">
						<?php esc_html_e( 'Rotation °', 'hoger' ); ?><br>
						<input type="number" name="bump_map_rotation"
							value="<?php echo esc_attr( $bm_rotation ); ?>"
							step="1" min="-360" max="360" style="width:70px;margin-top:4px">
					</label>
				</div>
			</div>

		</div>
	</div>

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
					<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #ddd;width:45%">
						<?php esc_html_e( 'Color Name', 'hoger' ); ?>
					</th>
					<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #ddd;width:45%">
						<?php esc_html_e( 'Color Photo', 'hoger' ); ?>
					</th>
					<th style="width:10%"></th>
				</tr>
			</thead>
			<tbody id="hoger-colors-body">
				<?php
				for ( $i = 0; $i < $colors_count; $i++ ) :
					$name      = get_post_meta( $post->ID, "czveta_{$i}_nazvanie_czveta", true );
					$photo_id  = get_post_meta( $post->ID, "czveta_{$i}_foto_czveta", true );
					$photo_src = $photo_id ? wp_get_attachment_image_url( $photo_id, 'thumbnail' ) : '';
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

		// Toggle UV fields
		$('#hoger-use-model-uv').on('change', function() {
			$('#hoger-uv-fields').toggle(!this.checked);
		});
		if ($('#hoger-use-model-uv').is(':checked')) {
			$('#hoger-uv-fields').hide();
		} else {
			$('#hoger-uv-fields').show();
		}

		// Update row count hidden field and re-index all names
		function updateCount() {
			var rows = $('#hoger-colors-body .hoger-color-row');
			rows.each(function(i) {
				$(this).attr('data-index', i);
				$(this).find('input[name*="_nazvanie_czveta"]').attr('name', 'czveta_' + i + '_nazvanie_czveta');
				$(this).find('input[name*="_foto_czveta"]').attr('name', 'czveta_' + i + '_foto_czveta');
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

		// Media uploader — generic (all .hoger-upload-btn)
		$(document).on('click', '.hoger-upload-btn', function() {
			var btn    = $(this);
			var target = btn.data('target');
			var picker = $('.hoger-image-picker[data-field="' + target + '"]');
			var frame  = wp.media({ title: '<?php esc_html_e( 'Select Image', 'hoger' ); ?>', multiple: false });
			frame.on('select', function() {
				var att     = frame.state().get('selection').first().toJSON();
				var preview = att.sizes && att.sizes.medium ? att.sizes.medium.url : (att.sizes && att.sizes.thumbnail ? att.sizes.thumbnail.url : att.url);
				picker.find('input[type="hidden"]').val(att.id);
				picker.find('.hoger-img-preview').html('<img src="' + preview + '" style="max-width:80px;display:block">');
				picker.find('.hoger-remove-btn').show();
			});
			frame.open();
		});

		// Remove — generic
		$(document).on('click', '.hoger-remove-btn', function() {
			var target = $(this).data('target');
			var picker = $('.hoger-image-picker[data-field="' + target + '"]');
			picker.find('input[type="hidden"]').val('');
			picker.find('.hoger-img-preview').html('');
			$(this).hide();
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

	// Global finish
	$allowed_finish = [ 'matte', 'satin', 'gloss', 'chrome' ];
	$finish_val     = isset( $_POST['finish'] ) ? sanitize_key( wp_unslash( $_POST['finish'] ) ) : 'matte';
	update_post_meta( $post_id, 'finish', in_array( $finish_val, $allowed_finish, true ) ? $finish_val : 'matte' );

	// Global UV mapping
	$uv_val = isset( $_POST['use_model_uv'] ) ? '1' : '0';
	update_post_meta( $post_id, 'use_model_uv', $uv_val );

	$repeat_x = isset( $_POST['repeat_x'] ) ? (float) $_POST['repeat_x'] : 1.0;
	update_post_meta( $post_id, 'repeat_x', max( 0.01, $repeat_x ) );

	$repeat_y = isset( $_POST['repeat_y'] ) ? (float) $_POST['repeat_y'] : 1.0;
	update_post_meta( $post_id, 'repeat_y', max( 0.01, $repeat_y ) );

	$rotation = isset( $_POST['rotation'] ) ? (float) $_POST['rotation'] : 0.0;
	update_post_meta( $post_id, 'rotation', max( -360, min( 360, $rotation ) ) );

	// Reflection mask
	if ( isset( $_POST['reflection_mask_id'] ) ) {
		$val = absint( $_POST['reflection_mask_id'] );
		$val ? update_post_meta( $post_id, 'reflection_mask_id', $val ) : delete_post_meta( $post_id, 'reflection_mask_id' );
	}
	if ( isset( $_POST['reflection_strength'] ) ) {
		update_post_meta( $post_id, 'reflection_strength', (string) round( max( 0, min( 2, (float) $_POST['reflection_strength'] ) ), 3 ) );
	}
	if ( isset( $_POST['roughness_map_depth'] ) ) {
		update_post_meta( $post_id, 'roughness_map_depth', (string) round( max( 0, min( 1, (float) $_POST['roughness_map_depth'] ) ), 3 ) );
	}
	if ( isset( $_POST['reflection_mask_repeat_x'] ) ) {
		update_post_meta( $post_id, 'reflection_mask_repeat_x', (string) round( max( 0.01, (float) $_POST['reflection_mask_repeat_x'] ), 3 ) );
	}
	if ( isset( $_POST['reflection_mask_repeat_y'] ) ) {
		update_post_meta( $post_id, 'reflection_mask_repeat_y', (string) round( max( 0.01, (float) $_POST['reflection_mask_repeat_y'] ), 3 ) );
	}
	if ( isset( $_POST['reflection_mask_rotation'] ) ) {
		update_post_meta( $post_id, 'reflection_mask_rotation', (string) round( max( -360, min( 360, (float) $_POST['reflection_mask_rotation'] ) ), 1 ) );
	}

	// Bump map
	if ( isset( $_POST['bump_map_id'] ) ) {
		$val = absint( $_POST['bump_map_id'] );
		$val ? update_post_meta( $post_id, 'bump_map_id', $val ) : delete_post_meta( $post_id, 'bump_map_id' );
	}
	if ( isset( $_POST['bump_scale'] ) ) {
		update_post_meta( $post_id, 'bump_scale', (string) round( max( 0, min( 5, (float) $_POST['bump_scale'] ) ), 3 ) );
	}
	if ( isset( $_POST['bump_map_repeat_x'] ) ) {
		update_post_meta( $post_id, 'bump_map_repeat_x', (string) round( max( 0.01, (float) $_POST['bump_map_repeat_x'] ), 3 ) );
	}
	if ( isset( $_POST['bump_map_repeat_y'] ) ) {
		update_post_meta( $post_id, 'bump_map_repeat_y', (string) round( max( 0.01, (float) $_POST['bump_map_repeat_y'] ), 3 ) );
	}
	if ( isset( $_POST['bump_map_rotation'] ) ) {
		update_post_meta( $post_id, 'bump_map_rotation', (string) round( max( -360, min( 360, (float) $_POST['bump_map_rotation'] ) ), 1 ) );
	}

	// Colors repeater
	$count = isset( $_POST['czveta'] ) ? absint( $_POST['czveta'] ) : 0;
	update_post_meta( $post_id, 'czveta', $count );

	// Delete old rows beyond new count
	$old_count = (int) get_post_meta( $post_id, 'czveta', true );
	for ( $i = $count; $i < $old_count + 10; $i++ ) {
		delete_post_meta( $post_id, "czveta_{$i}_nazvanie_czveta" );
		delete_post_meta( $post_id, "czveta_{$i}_foto_czveta" );
	}

	for ( $i = 0; $i < $count; $i++ ) {
		$name_key  = "czveta_{$i}_nazvanie_czveta";
		$photo_key = "czveta_{$i}_foto_czveta";

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
