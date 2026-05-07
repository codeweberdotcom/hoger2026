<?php

add_action( 'add_meta_boxes', 'hoger_partners_meta_boxes' );
function hoger_partners_meta_boxes() {
	add_meta_box(
		'partners_fields',
		__( 'Partner Details', 'hoger' ),
		'hoger_partners_meta_box_cb',
		'partners',
		'normal',
		'default'
	);
}

function hoger_partners_meta_box_cb( $post ) {
	wp_nonce_field( 'hoger_partners_save', 'hoger_partners_nonce' );

	$website = get_post_meta( $post->ID, 'website', true );
	$phone   = get_post_meta( $post->ID, 'phone', true );
	$email   = get_post_meta( $post->ID, 'email', true );
	?>
	<div class="hoger-meta-field" style="margin-bottom:16px">
		<label for="partner_website" style="display:block;font-weight:600;margin-bottom:4px">
			<?php esc_html_e( 'Website', 'hoger' ); ?>
		</label>
		<input type="url" id="partner_website" name="partner_website"
			value="<?php echo esc_attr( $website ); ?>"
			placeholder="https://example.com"
			style="width:100%">
	</div>

	<div class="hoger-meta-field" style="margin-bottom:16px">
		<label for="partner_phone" style="display:block;font-weight:600;margin-bottom:4px">
			<?php esc_html_e( 'Phone', 'hoger' ); ?>
		</label>
		<input type="text" id="partner_phone" name="partner_phone"
			value="<?php echo esc_attr( $phone ); ?>"
			style="width:100%">
	</div>

	<div class="hoger-meta-field">
		<label for="partner_email" style="display:block;font-weight:600;margin-bottom:4px">
			<?php esc_html_e( 'Email', 'hoger' ); ?>
		</label>
		<input type="email" id="partner_email" name="partner_email"
			value="<?php echo esc_attr( $email ); ?>"
			style="width:100%">
	</div>
	<?php
}

add_action( 'save_post_partners', 'hoger_partners_save_meta', 10, 2 );
function hoger_partners_save_meta( $post_id, $post ) {
	if ( ! isset( $_POST['hoger_partners_nonce'] ) ) return;
	if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['hoger_partners_nonce'] ) ), 'hoger_partners_save' ) ) return;
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
	if ( ! current_user_can( 'edit_post', $post_id ) ) return;

	if ( isset( $_POST['partner_website'] ) ) {
		$url = esc_url_raw( wp_unslash( $_POST['partner_website'] ) );
		if ( $url ) {
			update_post_meta( $post_id, 'website', $url );
		} else {
			delete_post_meta( $post_id, 'website' );
		}
	}

	if ( isset( $_POST['partner_phone'] ) ) {
		$phone = sanitize_text_field( wp_unslash( $_POST['partner_phone'] ) );
		if ( $phone ) {
			update_post_meta( $post_id, 'phone', $phone );
		} else {
			delete_post_meta( $post_id, 'phone' );
		}
	}

	if ( isset( $_POST['partner_email'] ) ) {
		$email = sanitize_email( wp_unslash( $_POST['partner_email'] ) );
		if ( $email ) {
			update_post_meta( $post_id, 'email', $email );
		} else {
			delete_post_meta( $post_id, 'email' );
		}
	}
}
