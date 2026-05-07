<?php

add_action( 'add_meta_boxes', 'hoger_partners_meta_boxes' );
function hoger_partners_meta_boxes() {
	add_meta_box(
		'partner_data',
		__( 'Partner Details', 'hoger' ),
		'hoger_partners_meta_box_cb',
		'partners',
		'normal'
	);
}

function hoger_partners_meta_box_cb( $post ) {
	wp_nonce_field( 'hoger_partners_save', 'hoger_partners_nonce' );

	$address  = get_post_meta( $post->ID, 'partner_factual_address', true );
	$director = get_post_meta( $post->ID, 'partner_director', true );
	$inn      = get_post_meta( $post->ID, 'partner_inn', true );
	$phones   = get_post_meta( $post->ID, 'partner_phones', true );
	if ( ! is_array( $phones ) ) {
		$phones = [ [ 'phone' => '', 'position' => '', 'name' => '' ] ];
	}
	$email   = get_post_meta( $post->ID, 'partner_email', true );
	$website = get_post_meta( $post->ID, 'partner_website', true );

	$field_style = 'margin-bottom:16px';
	$label_style = 'display:block;font-weight:600;margin-bottom:4px';
	?>

	<div class="hoger-meta-field" style="<?php echo esc_attr( $field_style ); ?>">
		<label for="partner_factual_address" style="<?php echo esc_attr( $label_style ); ?>">
			<?php esc_html_e( 'Factual Address', 'hoger' ); ?>
		</label>
		<textarea id="partner_factual_address" name="partner_factual_address"
			class="large-text" rows="3"
			placeholder="390048, г. Рязань, ул. Лесопарковая, дом 18"><?php echo esc_textarea( $address ); ?></textarea>
	</div>

	<div class="hoger-meta-field" style="<?php echo esc_attr( $field_style ); ?>">
		<label for="partner_director" style="<?php echo esc_attr( $label_style ); ?>">
			<?php esc_html_e( 'Director', 'hoger' ); ?>
		</label>
		<input type="text" id="partner_director" name="partner_director"
			value="<?php echo esc_attr( $director ); ?>"
			class="large-text" style="width:100%">
	</div>

	<div class="hoger-meta-field" style="<?php echo esc_attr( $field_style ); ?>">
		<label for="partner_inn" style="<?php echo esc_attr( $label_style ); ?>">
			<?php esc_html_e( 'INN', 'hoger' ); ?>
		</label>
		<input type="text" id="partner_inn" name="partner_inn"
			value="<?php echo esc_attr( $inn ); ?>"
			class="large-text" style="width:100%">
	</div>

	<div class="hoger-meta-field" style="<?php echo esc_attr( $field_style ); ?>">
		<input type="hidden" name="partner_phones_sent" value="1">
		<label style="<?php echo esc_attr( $label_style ); ?>"><?php esc_html_e( 'Phones', 'hoger' ); ?></label>
		<div class="partner-phones-rows">
			<?php foreach ( $phones as $i => $row ) : ?>
				<div class="partner-phone-row" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;padding:8px;background:#f6f7f7;border:1px solid #dcdcde;">
					<input type="text"
						name="partner_phones[<?php echo (int) $i; ?>][phone]"
						value="<?php echo esc_attr( $row['phone'] ?? '' ); ?>"
						placeholder="<?php esc_attr_e( 'Phone', 'hoger' ); ?>"
						class="regular-text" style="flex:1;min-width:120px;">
					<input type="text"
						name="partner_phones[<?php echo (int) $i; ?>][position]"
						value="<?php echo esc_attr( $row['position'] ?? '' ); ?>"
						placeholder="<?php esc_attr_e( 'Position', 'hoger' ); ?>"
						class="regular-text" style="flex:1;min-width:120px;">
					<input type="text"
						name="partner_phones[<?php echo (int) $i; ?>][name]"
						value="<?php echo esc_attr( $row['name'] ?? '' ); ?>"
						placeholder="<?php esc_attr_e( 'Name', 'hoger' ); ?>"
						class="regular-text" style="flex:1;min-width:120px;">
					<button type="button" class="button partner-phone-remove"><?php esc_html_e( 'Remove', 'hoger' ); ?></button>
				</div>
			<?php endforeach; ?>
		</div>
		<button type="button" class="button partner-phone-add"><?php esc_html_e( 'Add Phone', 'hoger' ); ?></button>
	</div>

	<div class="hoger-meta-field" style="<?php echo esc_attr( $field_style ); ?>">
		<label for="partner_email" style="<?php echo esc_attr( $label_style ); ?>">
			<?php esc_html_e( 'Email', 'hoger' ); ?>
		</label>
		<input type="email" id="partner_email" name="partner_email"
			value="<?php echo esc_attr( $email ); ?>"
			class="large-text" style="width:100%">
	</div>

	<div class="hoger-meta-field">
		<label for="partner_website" style="<?php echo esc_attr( $label_style ); ?>">
			<?php esc_html_e( 'Website', 'hoger' ); ?>
		</label>
		<input type="url" id="partner_website" name="partner_website"
			value="<?php echo esc_attr( $website ); ?>"
			placeholder="https://example.com"
			class="large-text" style="width:100%">
	</div>
	<?php
}

add_action( 'admin_enqueue_scripts', 'hoger_partners_admin_scripts' );
function hoger_partners_admin_scripts( $hook ) {
	global $post_type;
	if ( ! in_array( $hook, [ 'post.php', 'post-new.php' ], true ) || $post_type !== 'partners' ) {
		return;
	}
	wp_add_inline_script( 'jquery', "
		jQuery(function($) {
			var phoneRowIndex = $('.partner-phone-row').length;
			$(document).on('click', '.partner-phone-add', function(e) {
				e.preventDefault();
				var html = '<div class=\"partner-phone-row\" style=\"display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;padding:8px;background:#f6f7f7;border:1px solid #dcdcde;\">' +
					'<input type=\"text\" name=\"partner_phones[' + phoneRowIndex + '][phone]\" placeholder=\"Phone\" class=\"regular-text\" style=\"flex:1;min-width:120px;\">' +
					'<input type=\"text\" name=\"partner_phones[' + phoneRowIndex + '][position]\" placeholder=\"Position\" class=\"regular-text\" style=\"flex:1;min-width:120px;\">' +
					'<input type=\"text\" name=\"partner_phones[' + phoneRowIndex + '][name]\" placeholder=\"Name\" class=\"regular-text\" style=\"flex:1;min-width:120px;\">' +
					'<button type=\"button\" class=\"button partner-phone-remove\">Remove</button></div>';
				$('.partner-phones-rows').append(html);
				phoneRowIndex++;
			});
			$(document).on('click', '.partner-phone-remove', function(e) {
				e.preventDefault();
				$(this).closest('.partner-phone-row').remove();
			});
		});
	" );
}

add_action( 'save_post_partners', 'hoger_partners_save_meta', 10, 2 );
function hoger_partners_save_meta( $post_id, $post ) {
	if ( ! isset( $_POST['hoger_partners_nonce'] ) ) return;
	if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['hoger_partners_nonce'] ) ), 'hoger_partners_save' ) ) return;
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
	if ( ! current_user_can( 'edit_post', $post_id ) ) return;

	if ( isset( $_POST['partner_factual_address'] ) ) {
		$val = sanitize_textarea_field( wp_unslash( $_POST['partner_factual_address'] ) );
		$val ? update_post_meta( $post_id, 'partner_factual_address', $val ) : delete_post_meta( $post_id, 'partner_factual_address' );
	}

	foreach ( [ 'partner_director', 'partner_inn' ] as $key ) {
		if ( isset( $_POST[ $key ] ) ) {
			$val = sanitize_text_field( wp_unslash( $_POST[ $key ] ) );
			$val ? update_post_meta( $post_id, $key, $val ) : delete_post_meta( $post_id, $key );
		}
	}

	if ( ! empty( $_POST['partner_phones_sent'] ) ) {
		if ( isset( $_POST['partner_phones'] ) && is_array( $_POST['partner_phones'] ) ) {
			$phones = [];
			foreach ( $_POST['partner_phones'] as $row ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
				if ( ! is_array( $row ) ) continue;
				$phones[] = [
					'phone'    => sanitize_text_field( wp_unslash( $row['phone'] ?? '' ) ),
					'position' => sanitize_text_field( wp_unslash( $row['position'] ?? '' ) ),
					'name'     => sanitize_text_field( wp_unslash( $row['name'] ?? '' ) ),
				];
			}
			$phones = array_values( array_filter( $phones, function( $r ) {
				return $r['phone'] !== '' || $r['position'] !== '' || $r['name'] !== '';
			} ) );
			update_post_meta( $post_id, 'partner_phones', $phones );
		} else {
			update_post_meta( $post_id, 'partner_phones', [] );
		}
	}

	if ( isset( $_POST['partner_email'] ) ) {
		$val = sanitize_email( wp_unslash( $_POST['partner_email'] ) );
		$val ? update_post_meta( $post_id, 'partner_email', $val ) : delete_post_meta( $post_id, 'partner_email' );
	}

	if ( isset( $_POST['partner_website'] ) ) {
		$val = esc_url_raw( wp_unslash( $_POST['partner_website'] ) );
		$val ? update_post_meta( $post_id, 'partner_website', $val ) : delete_post_meta( $post_id, 'partner_website' );
	}
}
