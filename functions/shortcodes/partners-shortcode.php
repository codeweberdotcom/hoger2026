<?php

/**
 * Shortcode [partners] — renders all published partners as cards.
 *
 * Usage:
 *   [partners]
 *   [partners count="5" orderby="title" order="ASC"]
 */
add_shortcode( 'partners', 'hoger_partners_shortcode' );
function hoger_partners_shortcode( $atts ) {
	$atts = shortcode_atts(
		[
			'count'   => -1,
			'orderby' => 'title',
			'order'   => 'ASC',
		],
		$atts,
		'partners'
	);

	$query = new WP_Query( [
		'post_type'      => 'partners',
		'posts_per_page' => (int) $atts['count'],
		'orderby'        => sanitize_key( $atts['orderby'] ),
		'order'          => strtoupper( $atts['order'] ) === 'DESC' ? 'DESC' : 'ASC',
		'post_status'    => 'publish',
	] );

	if ( ! $query->have_posts() ) {
		return '<p class="partners-empty">' . esc_html__( 'No partners found.', 'hoger' ) . '</p>';
	}

	ob_start();
	?>
	<div class="partners-list">
		<?php while ( $query->have_posts() ) : $query->the_post(); ?>
			<?php
			$id       = get_the_ID();
			$address  = get_post_meta( $id, 'partner_factual_address', true );
			$director = get_post_meta( $id, 'partner_director', true );
			$inn      = get_post_meta( $id, 'partner_inn', true );
			$phones   = get_post_meta( $id, 'partner_phones', true );
			if ( ! is_array( $phones ) ) {
				$phones = [];
			}
			$email   = get_post_meta( $id, 'partner_email', true );
			$website = get_post_meta( $id, 'partner_website', true );
			?>
			<div class="card shadow-sm mb-4">
				<div class="card-body p-4 p-md-5">
					<h3 class="h4 mb-3"><?php the_title(); ?></h3>
					<div class="partner-meta">
						<?php if ( $address ) : ?>
							<p class="mb-2">
								<strong><?php esc_html_e( 'Factual Address', 'hoger' ); ?>:</strong>
								<?php echo esc_html( $address ); ?>
							</p>
						<?php endif; ?>

						<?php if ( $director ) : ?>
							<p class="mb-2">
								<strong><?php esc_html_e( 'Director', 'hoger' ); ?>:</strong>
								<?php echo esc_html( $director ); ?>
							</p>
						<?php endif; ?>

						<?php if ( $inn ) : ?>
							<p class="mb-2">
								<strong><?php esc_html_e( 'INN', 'hoger' ); ?>:</strong>
								<?php echo esc_html( $inn ); ?>
							</p>
						<?php endif; ?>

						<?php foreach ( $phones as $p ) :
							$p_phone    = $p['phone'] ?? '';
							$p_position = $p['position'] ?? '';
							$p_name     = $p['name'] ?? '';
							if ( $p_phone === '' && $p_position === '' && $p_name === '' ) continue;
							$p_label = trim( $p_position . ' ' . $p_name );
							?>
							<p class="mb-2">
								<strong><?php esc_html_e( 'Phone', 'hoger' ); ?>:</strong>
								<?php if ( $p_phone ) : ?>
									<a href="tel:<?php echo esc_attr( preg_replace( '/\s+/', '', $p_phone ) ); ?>">
										<?php echo esc_html( $p_phone ); ?>
									</a>
								<?php endif; ?>
								<?php if ( $p_label ) : ?>
									<span class="text-muted">— <?php echo esc_html( $p_label ); ?></span>
								<?php endif; ?>
							</p>
						<?php endforeach; ?>

						<?php if ( $email ) : ?>
							<p class="mb-2">
								<strong>E-mail:</strong>
								<a href="mailto:<?php echo esc_attr( $email ); ?>"><?php echo esc_html( $email ); ?></a>
							</p>
						<?php endif; ?>

						<?php if ( $website ) : ?>
							<p class="mb-0">
								<strong><?php esc_html_e( 'Website', 'hoger' ); ?>:</strong>
								<a href="<?php echo esc_url( $website ); ?>" target="_blank" rel="noopener noreferrer">
									<?php echo esc_html( $website ); ?>
								</a>
							</p>
						<?php endif; ?>
					</div>
				</div>
			</div>
		<?php endwhile; ?>
		<?php wp_reset_postdata(); ?>
	</div>
	<?php
	return ob_get_clean();
}
